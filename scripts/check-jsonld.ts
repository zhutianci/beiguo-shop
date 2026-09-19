/**
 * JSON-LD 转义自测。
 *
 * 【为什么值得有这么一个脚本】2026-09-19 引入 lib/seo/jsonld.tsx 时踩了一个坑：
 * 写成 `json.replace(/</g, '<')`（单反斜杠）。这在 TS 里是一个 unicode 转义，
 * 编译出来就是字符 `<` 本身，于是整句是「把 < 换成 <」——一个彻头彻尾的空操作。
 * 代码看上去完全正常、类型检查通过、页面渲染也正常，
 * **唯一能发现它的方式就是断言输出里不含裸的 `</script>`**。
 * 这类 bug 靠 code review 看不出来，所以留下这个脚本。
 *
 * 跑法：npx tsx scripts/check-jsonld.ts
 */
import { escapeJsonLd } from '../src/lib/seo/jsonld'

let failed = 0
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) {
    console.log('  ✓', name)
  } else {
    failed++
    console.log('  ✗', name, extra ? `\n      ${extra}` : '')
  }
}

console.log('JSON-LD 转义：')

// ① 最要紧的一条：商品名里塞 </script> 不能逃出 script 标签
const evil = 'a</script><img src=x onerror=alert(1)>b'
const out = escapeJsonLd(JSON.stringify({ name: evil }))
assert('含 </script> 的商品名不会闭合 script 标签', !out.includes('</script>'), out)
assert('输出里没有任何裸的 <', !out.includes('<'), out)
assert('输出里没有任何裸的 >', !out.includes('>'), out)

// ② 转义之后必须还是同一份数据——转义不能改变语义
assert('转义后仍是合法 JSON 且内容等价', JSON.parse(out).name === evil)

// ③ & 与行分隔符：U+2028 / U+2029 在 JSON 里合法，在 JS 源码里是换行
const LS = String.fromCharCode(0x2028)
const PS = String.fromCharCode(0x2029)
const weird = JSON.stringify({ a: 'x&y', b: `p${LS}q${PS}r` })
const wout = escapeJsonLd(weird)
assert('& 被转义', !wout.includes('&'), wout)
assert('U+2028 被转义', !wout.includes(LS), wout)
assert('U+2029 被转义', !wout.includes(PS), wout)
assert('转义后内容仍等价', JSON.parse(wout).b === `p${LS}q${PS}r`)

// ④ 正常内容不应被改动（避免过度转义把中文或引号也动了）
const plain = JSON.stringify({ name: '贝果科技 ChatGPT Plus 充值', price: '135.00' })
assert('不含特殊字符时原样输出', escapeJsonLd(plain) === plain)

console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)

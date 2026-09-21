/**
 * meta description 收口自测。
 *   npx tsx scripts/check-news-desc.ts
 *
 * 原来是 `.slice(0, 110)` 硬切，中文摘要每一条都断在句子中间。
 * 这几条断言钉住「按句子收口」这个行为，别让后人改回硬切。
 */
import { clipDescription } from '../src/lib/news/seo'

let failed = 0
function ok(name: string, cond: boolean, got?: unknown) {
  if (cond) console.log('  ✓', name)
  else { failed++; console.log('  ✗', name, got === undefined ? '' : `\n      got = ${JSON.stringify(got)}`) }
}

const short = '短句。'
ok('没超上限就原样返回', clipDescription(short) === short)
ok('空值不抛异常', clipDescription(null) === '' && clipDescription(undefined) === '')
ok('压缩连续空白', clipDescription('a   b\n\nc') === 'a b c')

const sentences =
  'OpenAI 宣布该功能将于下月面向所有 Plus 用户开放。公司同时表示将继续优化推理速度与稳定性，并计划在年内把上下文窗口扩展到更大规模。此外还将调整企业版定价策略以应对竞争。'
const r1 = clipDescription(sentences)
ok('在句号处收口', r1.endsWith('。'), r1)
ok('不超过上限', r1.length <= 120, r1.length)
ok('是原文的前缀（没篡改内容）', sentences.startsWith(r1), r1)

// 必须真的超过 120 字上限，否则会原样返回、根本走不到逗号分支（第一版就写短了）
const commas =
  '这是一段没有任何句末标点的超长文本只有逗号，比如这样，再比如这样，继续写下去直到超过上限为止，' +
  '还要再长一点才能触发截断逻辑的分支判断，好了应该够长了吧再补几个字凑数，继续再写一句，' +
  '确保总长度稳稳超过一百二十个字符这个阈值，这样才能覆盖到逗号回退那条路径'
const r2 = clipDescription(commas)
ok('用例本身要超过上限，否则测不到这条分支', commas.length > 120, commas.length)
ok('没有句号时退到逗号并补省略号', r2.endsWith('…') && !r2.includes('，…'), r2)
ok('逗号分支不超上限', r2.length <= 120, r2.length)

const nopunct = '一'.repeat(200)
const r3 = clipDescription(nopunct)
ok('完全无标点时硬切并补省略号', r3.endsWith('…') && r3.length <= 120, r3.length)

ok('不会把长句砍成一小截（收口点不得过短）', clipDescription('前面很长的一段话没有标点一直写到接近上限。' + '尾'.repeat(200)).length >= 20)

console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)

import type { ReactElement } from 'react'

/**
 * 通用 JSON-LD 注入组件。**Server Component**，不要加 'use client'——
 * 结构化数据必须出现在首屏 HTML 里，客户端注入的搜索引擎大概率抓不到
 * （同 components/news/article-jsonld.tsx 的注释）。
 */

/*
 * 【这一段踩过两次坑，改之前务必读完，并且改完一定要跑 scripts/check-jsonld.ts】
 *
 * 要往 <script> 里塞 JSON，必须把 `<` 转成 JSON 的 `<`，
 * 否则商品名或 FAQ 文案里只要出现一个 "</script>" 就能闭合标签逃出去——
 * 商品名是后台手填的，这是一个真实可达的注入口。
 *
 * 坑一：**怎么写出「反斜杠 + u003c」这几个字符**。
 *   '<'  ← 错。它是一个 unicode 转义，编译出来就是字符 `<` 本身，
 *               于是 replace(/</g, '<') 是「把 < 换成 <」，一个空操作。
 *               代码看着完全正常、类型检查也过，只有断言能发现。
 *   '\\u003c' ← 对，但少一个反斜杠就静默退化成上面那种。
 *   String.raw`\u` ← 现在用的写法，模板不做转义处理，没有「少写一个反斜杠」这种失败模式。
 *
 * 坑二：**源码里不要出现   /   这两个转义**。写它们的本意是转义行分隔符，
 *   但只要哪一步工具链把转义还原成真字符写回文件，这两个字符在 JS 源码里就是换行，
 *   会把所在的那一行（比如一段正则字面量）拦腰截断，报「Unterminated regular expression」。
 *   所以这里干脆不用正则字面量、也不写任何 unicode 转义，只按码点判断。
 *
 * 转义 `<` `>` `&` 与 U+2028 / U+2029。后两个在 JSON 里合法、在 JS 源码里是换行，
 * 历史上是一类真实的解析事故来源。这些转义对 JSON 语义没有任何影响，解析回来完全等价。
 */
const U_ESCAPE = String.raw`\u`

/** 需要转义的码点：< > & U+2028 U+2029 */
const ESCAPED_CODES = new Set([0x3c, 0x3e, 0x26, 0x2028, 0x2029])

export function escapeJsonLd(json: string): string {
  let out = ''
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i)
    out += ESCAPED_CODES.has(code)
      ? U_ESCAPE + code.toString(16).padStart(4, '0')
      : json[i]
  }
  return out
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(JSON.stringify(data)) }}
    />
  )
}

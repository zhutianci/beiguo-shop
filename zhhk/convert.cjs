'use strict'
/**
 * 简体 → 香港繁体 转换核心（docs/繁体香港版/设计.md §3）。
 *
 * 【为什么自己写而不直接用 opencc-js】
 *  · 繁体站是在「输出层」统一转换的（HTML、RSC 流、JSON、客户端 JS 分块），其中 RSC 流里的 `T` 行带**字节长度**前缀，
 *    换字时一旦 UTF-8 字节数变了，React 解析就错位、整页白屏。所以词典里每一条都必须「转换前后字节数相同」——
 *    生成词典时已过滤（scripts/i18n/gen-zhhk-dict.mjs），这里加载时再校验一遍，有一条不等就拒绝启用。
 *  · 要能**流式**转换（边收边转，不等整页渲染完）：词组只由汉字组成，所以在「最后一个非汉字字符」处切开，
 *    两边的转换结果与整段一起转完全相同（见 createStream）。
 *  · 运行时零依赖：这个文件和 dict.json 直接拷进运行镜像，用纯 node 跑（proxy.cjs、构建脚本、自测共用这一份）。
 *
 * 算法：正向最大匹配（与 OpenCC 相同）。每个位置先试以该字开头的最长词组，没有再查单字表。
 */

const fs = require('fs')
const path = require('path')

const DEFAULT_DICT = path.join(__dirname, 'dict.json')

/** 汉字（含扩展 A、兼容区）与会出现在词组里的「〇」。词组只由这些字符组成，切流时以「非汉字」为安全边界 */
function isHanCode(c) {
  return (
    (c >= 0x4e00 && c <= 0x9fff) ||
    (c >= 0x3400 && c <= 0x4dbf) ||
    (c >= 0xf900 && c <= 0xfaff) ||
    c === 0x3007 ||
    (c >= 0xd800 && c <= 0xdfff) // 代理对（扩展 B 及以后），按汉字看待，切流时不从中间切开
  )
}

function utf8Len(s) {
  return Buffer.byteLength(s, 'utf8')
}

/**
 * @param {{chars: string[][], phrases: string[][], version?: string}} data
 */
function buildConverter(data) {
  /** @type {Map<string,string>} 单字（可能是代理对） */
  const charMap = new Map()
  /** @type {Map<string,string>} 词组 */
  const phraseMap = new Map()
  /** 以某字（首个 UTF-16 码元）开头的最长词组长度（码元数） */
  const maxLenByFirst = new Map()

  for (const [k, v] of data.chars) {
    if (utf8Len(k) !== utf8Len(v)) throw new Error(`[zhhk] 单字字节数不等：${k} → ${v}`)
    if (k !== v) charMap.set(k, v)
  }
  for (const [k, v] of data.phrases) {
    if (utf8Len(k) !== utf8Len(v)) throw new Error(`[zhhk] 词组字节数不等：${k} → ${v}`)
    if (k.length < 2) continue
    phraseMap.set(k, v)
    const f = k.charCodeAt(0)
    const cur = maxLenByFirst.get(f) || 0
    if (k.length > cur) maxLenByFirst.set(f, k.length)
  }

  /**
   * 整段转换。非汉字原样保留，所以 HTML 标签、JSON 结构、JS 语法都不受影响。
   * @param {string} s
   */
  function convert(s) {
    if (!s) return s
    let out = ''
    let last = 0 // out 已经追加到 s 的哪个位置
    const n = s.length
    let i = 0
    while (i < n) {
      const c = s.charCodeAt(i)
      if (!isHanCode(c)) {
        i++
        continue
      }
      // 词组
      const maxLen = maxLenByFirst.get(c)
      let matched = false
      if (maxLen) {
        for (let len = Math.min(maxLen, n - i); len >= 2; len--) {
          const v = phraseMap.get(s.substr(i, len))
          if (v !== undefined) {
            out += s.slice(last, i) + v
            i += len
            last = i
            matched = true
            break
          }
        }
      }
      if (matched) continue
      // 单字（代理对按两个码元取）
      const w = c >= 0xd800 && c <= 0xdbff && i + 1 < n ? 2 : 1
      const ch = w === 2 ? s.substr(i, 2) : s[i]
      const v = charMap.get(ch)
      if (v !== undefined) {
        out += s.slice(last, i) + v
        last = i + w
      }
      i += w
    }
    if (last === 0) return s
    return out + s.slice(last)
  }

  /**
   * 流式转换器：push(片段) 返回可以安全输出的已转换文本，end() 返回剩余部分。
   * 切点 = 缓冲区里最后一个非汉字字符之后：词组不跨越非汉字，所以切点两侧分别转换 ≡ 整段转换。
   * 连续汉字超过 holdMax 个码元（正常网页不会出现）就强制切，最坏只是一个词组在切口处退化成逐字转换。
   */
  function createStream(holdMax = 4096) {
    let buf = ''
    return {
      push(chunk) {
        buf += chunk
        let cut = buf.length
        while (cut > 0 && isHanCode(buf.charCodeAt(cut - 1))) cut--
        if (cut === 0) {
          if (buf.length < holdMax) return ''
          // 不从代理对中间切
          cut = buf.length
          const c = buf.charCodeAt(cut - 1)
          if (c >= 0xd800 && c <= 0xdbff) cut--
        }
        const head = buf.slice(0, cut)
        buf = buf.slice(cut)
        return convert(head)
      },
      end() {
        const rest = buf
        buf = ''
        return convert(rest)
      },
    }
  }

  return {
    convert,
    createStream,
    version: data.version || 'dev',
    size: { chars: charMap.size, phrases: phraseMap.size },
  }
}

let cached = null

/** 默认词典（zhhk/dict.json），进程内只加载一次 */
function loadDefault(file = DEFAULT_DICT) {
  if (cached && cached.file === file) return cached.conv
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const conv = buildConverter(data)
  cached = { file, conv }
  return conv
}

module.exports = { buildConverter, loadDefault, isHanCode }

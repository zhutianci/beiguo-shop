---
title: 论文 Highlights 与通俗摘要怎么写提示词（期刊亮点 + Plain Language Summary）
slug: highlights-plain-language-summary
model: any-llm
topics: [paper-writing]
needsRefImage: false
useCase: 投稿时期刊要求提交 Highlights（研究亮点）或 Plain Language Summary（通俗摘要）时用：贴入摘要和期刊的具体要求，AI 写出符合条数与字符限制的亮点，以及面向非专业读者的通俗摘要，并检查有没有夸大。
prompt: |
  请根据我的论文写两样东西：研究亮点（Highlights）和通俗摘要（Plain Language Summary）。

  论文摘要：[粘贴摘要]
  主要结果中的关键数字（可选）：[关键数字]
  期刊对 Highlights 的要求：[亮点要求]（如：3–5 条、每条不超过 85 个字符含空格）
  期刊对通俗摘要的要求：[通俗摘要要求]（如：不超过 250 词、面向患者或公众）
  语言：[英文/中文]

  一、Highlights
  - 按要求的条数输出，每条一句话，只写一个核心点；覆盖：研究问题或对象、方法特点、主要发现（1–2 条）、意义。
  - 每条后面括号标注字符数（含空格），确保不超过限制。
  - 用主动语态和具体表达，不用缩写（除非是众所周知的），不写「首次」「突破性」这类无法证实的说法。

  二、Plain Language Summary
  - 面向没有专业背景的读者，大约初中到高中的阅读水平。
  - 结构：为什么做这项研究（一个读者能共鸣的问题）→ 我们做了什么 → 发现了什么 → 这意味着什么、不意味着什么。
  - 专业术语要么替换为日常说法，要么第一次出现时用一句话解释；数字尽量用直观方式表达（如「每 10 人中约有 3 人」），但不得改变原意。
  - 必须写出研究的主要局限，避免读者过度解读（例如：相关不等于因果、样本范围有限）。

  三、自查：列出你在写作中做的简化，以及哪些简化可能影响准确性，请我确认。

  只用摘要和我提供的数字，不添加新结论。
negativePrompt: null
source: null
verify:
  - 用字符计数工具核对 Highlights 每条的字符数
  - 检查通俗摘要是否写出了研究局限
---
**怎么填变量**：[亮点要求] 和 [通俗摘要要求] 一定从期刊作者指南中复制原文，不同出版社对条数、字符数的规定不一样，以期刊为准。[关键数字] 可选，提供后通俗摘要会更具体，比如「平均每晚多睡约 20 分钟」。

**常见问题与调整**：
- 字符数超标 → AI 自报的字符数可能不准，用 Word 或在线工具的「字符数（计空格）」核对；超标就追问：「第 2 条压缩到 80 个字符以内，保留核心动词和结果。」
- 通俗摘要仍有术语 → 追问：「请一个高中生读一遍，标出他可能看不懂的词并替换。」
- 夸大结论 → 追问：「检查每句话能否由摘要中的结果直接支撑，不能支撑的删除。」

**提示**：Highlights 常被用于期刊网页和检索展示，写得具体比写得华丽更重要。中文期刊如有「研究亮点」栏目，同样可以使用。

### 示例输出

> 示例，仅供参考（研究：午间小睡与小学生下午课堂专注度）

**Highlights**
- A 20-minute school nap was linked to better afternoon attention (63)
- We followed 600 pupils across 12 primary schools for one term (61)
- Benefits were larger in pupils who slept under 8 hours at night (63)

**Plain Language Summary（节选）**
Many children feel sleepy in afternoon classes. We wanted to know whether a short nap at school could help. … Because this was not a randomised trial, we cannot be sure the nap itself caused the improvement.

---
title: 审稿意见怎么写：作为审稿人撰写 Peer Review 报告提示词
slug: peer-review-report-writer
model: any-llm
topics: [paper-writing, literature]
needsRefImage: false
useCase: 第一次受邀给期刊审稿、不知道审稿报告怎么组织时用：把你自己读稿后的笔记和判断写进去，AI 帮你整理成结构清楚、语气专业、有建设性的审稿报告（总体评价、主要问题、次要问题、给编辑的保密意见）。先确认期刊是否允许使用 AI。
prompt: |
  我受邀为期刊审稿，已经读完稿件并记下了自己的意见。请帮我把这些意见整理成规范的审稿报告。

  重要前提：未发表稿件属于保密材料，很多期刊和出版社规定审稿人不得把稿件内容上传到 AI 工具。因此我只提供我自己写的审稿笔记，不提供稿件原文。

  - 期刊类型与领域：[期刊领域]
  - 稿件类型：[稿件类型]（原创研究 / 综述 / 短篇报告）
  - 我对稿件的一句话概括（用我自己的话）：[稿件概括]
  - 我的审稿笔记（逐条，越具体越好，注明页码或章节）：
    [我的审稿笔记]
  - 我倾向的推荐意见：[推荐意见]（接收 / 小修 / 大修 / 拒稿）
  - 报告语言：[中文/英文]

  请整理为以下结构：
  1. 稿件概述（2–4 句）：说明稿件研究了什么、主要结论是什么，让编辑知道我读懂了。
  2. 总体评价：优点与主要不足各 2–3 句，语气客观。
  3. 主要问题（Major comments）：影响结论是否成立的问题，如研究设计缺陷、统计方法不当、结论超出数据支持范围。每条写「问题 → 为什么重要 → 具体建议」。
  4. 次要问题（Minor comments）：表述、图表、引用、格式等，按页码顺序列出。
  5. 给编辑的保密意见（Confidential comments to the editor）：推荐意见及理由，以及我不便直接对作者说的顾虑。

  写作要求：
  - 语气尊重、具体、可操作，针对稿件而不是作者本人；避免「作者显然不懂……」这类措辞。
  - 只基于我的笔记整理，不要替我新增我没提出的批评，也不要编造稿件中的内容。
  - 不要要求作者引用我（审稿人）的文献，除非我在笔记中写明且确实必要。
negativePrompt: null
source: null
verify:
  - 检查模型是否新增了审稿笔记里没有的批评
  - 检查语气是否专业、对事不对人
---
**先确认合规**：各期刊和出版社对审稿人使用生成式 AI 的规定不同，有的完全禁止把稿件内容输入 AI，有的允许用于语言润色但需声明。请先查看期刊的审稿人指南。这条提示词的设计是**只输入你自己的笔记**，不输入稿件原文；即便如此，也建议不要写入可识别稿件的具体细节（如独特的数据集名称）。

**怎么填变量**：[我的审稿笔记] 是核心，判断必须由你做出，AI 只负责组织语言和结构。笔记可以很随意，比如「p12 表 3 的样本量和方法里说的不一样」「讨论里说因果，但是横断面数据」。

**常见问题与调整**：
- Major 和 Minor 分不清 → 追问：「根据『是否影响结论成立』重新分类，并说明理由。」
- 英文表达生硬 → 追问：「用审稿报告常见的礼貌表达改写，例如 The authors may wish to consider…」
- 推荐意见与意见强度不一致（列了很多严重问题却推荐小修）→ AI 应当提醒你，追问：「我的意见与推荐结果是否一致？」

### 示例输出

> 示例，仅供参考（英文审稿报告节选）

**Major comments**
1. *Causal language.* The Discussion repeatedly states that screen time "leads to" poorer sleep, but the cross-sectional design does not allow causal inference. I suggest revising these statements and adding this point to the Limitations.
2. *Sample size inconsistency.* The Methods report 412 participants, whereas Table 3 includes 398. Please clarify how missing data were handled.

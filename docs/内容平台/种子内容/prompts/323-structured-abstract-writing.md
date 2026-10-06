---
title: 论文摘要怎么写：结构化摘要生成与字数压缩提示词
slug: structured-abstract-writing
model: any-llm
topics: [paper-writing]
needsRefImage: false
useCase: 论文主体写完、需要写或改摘要时用：根据你提供的研究要点生成符合期刊字数和结构要求的摘要，并给出压缩版和关键词建议。
prompt: |
  【角色】你是一名资深学术编辑，熟悉 [学科领域] 期刊的摘要写作规范，擅长在有限字数内准确传达研究贡献。

  【背景】
  - 论文标题：[论文标题]
  - 目标期刊与字数上限：[期刊与字数上限]
  - 摘要类型：[结构化/非结构化]
  - 输出语言：[中文/英文]
  - 研究要点（请严格依据以下内容）：
    背景与研究空白：[研究空白]
    研究目的：[研究目的]
    方法（设计、对象、样本量、主要测量）：[方法要点]
    主要结果（含关键数字）：[主要结果]
    结论与意义：[结论与意义]

  【任务】
  1. 按目标期刊要求写摘要；结构化摘要使用 Background / Methods / Results / Conclusions（或期刊指定的小标题）。
  2. 结果部分优先给出主要结局的具体数字和统计量，而不是笼统的「显著改善」。
  3. 写一个压缩到字数上限 70% 的版本，说明删减了什么。
  4. 推荐 5 个关键词，避免与标题完全重复，兼顾检索常用词。
  5. 自查：列出摘要中每个结论对应的结果依据；指出任何可能超出数据支持范围的表述。

  【约束】
  - 只使用我提供的信息，不得添加任何新的数据、结果或参考文献。
  - 不使用「首次」「突破性」等无法证实的夸大用语，除非我明确提供了依据。
  - 数字、单位、缩写首次出现时与正文保持一致。

  【输出格式】
  完整摘要（标注字数）→ 压缩版（标注字数）→ 关键词 → 自查表（结论 | 对应依据）。
negativePrompt: null
source: null
verify:
  - 实测检查模型是否会擅自补充用户没给的数字
---
**怎么填变量**：[主要结果] 一定要写具体数字，例如「干预组 HbA1c 下降 0.8%（95% CI 0.5–1.1），对照组下降 0.2%」。只给「效果显著」，AI 只能写出空泛的摘要。

**追问技巧**：觉得不够有吸引力时，追问「第一句改得更直接点出研究空白」；英文摘要可以追问「换成更符合 [目标期刊] 风格的用词」。

**适合模型**：通用大模型均可。

> 摘要中的每个数字都要与正文核对；按期刊政策披露 AI 辅助写作的使用情况。

### 示例输出

> 示例，仅供参考（虚构研究，数字仅为格式演示）

**Background**: Evidence on app-based coaching for glycemic control in older adults remains limited.
**Methods**: In this randomized trial, 240 adults aged 60 years or older with type 2 diabetes received app-based coaching or usual care for 6 months.
**Results**: HbA1c decreased by 0.8% in the intervention group versus 0.2% in the control group (difference −0.6%, 95% CI −0.9 to −0.3).
**Conclusions**: App-based coaching modestly improved glycemic control in older adults.（字数：62 词）

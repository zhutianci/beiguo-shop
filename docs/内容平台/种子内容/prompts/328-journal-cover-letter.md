---
title: 投稿 Cover Letter 怎么写：期刊投稿信模板提示词
slug: journal-cover-letter
model: any-llm
topics: [paper-writing]
needsRefImage: false
useCase: 投稿 SCI 或英文期刊时用：根据论文核心发现和期刊定位，写一封一页以内、重点突出的投稿信，并附上期刊常要求的声明。
prompt: |
  【角色】你是一名经验丰富的通讯作者，熟悉期刊编辑初筛稿件时关注的重点。

  【背景】
  - 目标期刊：[目标期刊]；编辑姓名：[编辑姓名，不知道写无]
  - 稿件题目：[稿件题目]；文章类型：[文章类型]
  - 研究问题与核心发现（2–3 句）：[核心发现]
  - 新颖性与重要性：[新颖性]
  - 与期刊范围的契合点：[期刊契合点]
  - 需要的声明：[声明事项]（如未一稿多投、利益冲突、伦理批准、数据可用性、推荐或回避审稿人）

  【任务】
  1. 写一封英文 Cover Letter，结构为：称呼 → 投稿说明（题目、文章类型）→ 研究问题与核心发现 → 为什么适合本刊、对读者的价值 → 声明 → 结尾与通讯作者信息占位。
  2. 控制在一页以内（约 250–400 词）。
  3. 用一句话概括本研究最重要的贡献，放在第二段开头。
  4. 附一份中文说明：每段的写作目的，以及我可以根据期刊调整的地方。

  【约束】
  - 不夸大，不使用「首次」「革命性」等无法证实的表述，除非我提供了依据。
  - 不编造数据、文献或资助信息；我没提供的信息用「【待补】」占位。
  - 不要照抄摘要，突出「为什么是这本期刊」。

  【输出格式】
  英文 Cover Letter 全文 → 中文写作说明 → 可选：推荐审稿人信息模板。
negativePrompt: null
source: null
verify:
  - 检查生成信件词数是否控制在一页以内
---
**怎么填变量**：[期刊契合点] 是编辑最看重的部分，可以写「本刊近两年发表过 3 篇关于……的研究，本文在此基础上……」，前提是这些文章你真的读过。[声明事项] 以期刊投稿系统要求为准。

**追问技巧**：转投其他期刊时，追问「把契合点改写为适合 [新期刊] 的版本，其余保持不变」；还可以让它「从编辑的角度挑出这封信最弱的一句」。

**适合模型**：通用大模型均可。

> 信中提到的所有事实（伦理批号、基金号等）必须真实；推荐审稿人须避免利益冲突。

### 示例输出

> 示例，仅供参考

Dear Dr. 【待补】,

We are pleased to submit our manuscript entitled "Mobile coaching for glycemic control in older adults: a randomized trial" for consideration as an Original Article in *【目标期刊】*.

In this trial of 240 older adults with type 2 diabetes, we found that app-based coaching reduced HbA1c by 0.6 percentage points compared with usual care. Given the journal's recent focus on digital health in aging populations, we believe these findings will interest your readers...

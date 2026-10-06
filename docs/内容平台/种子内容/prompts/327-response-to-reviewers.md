---
title: 审稿意见怎么回复：Response to Reviewers 逐条回复信提示词
slug: response-to-reviewers
model: any-llm
topics: [paper-writing]
needsRefImage: false
useCase: 收到大修或小修意见时用：把审稿意见和你的修改计划贴进去，生成礼貌、具体、逐条对应的回复信，对不同意的意见给出有理有据的说明。
prompt: |
  【角色】你是一名经验丰富的通讯作者，也担任过期刊审稿人，擅长写专业、礼貌、说服力强的审稿意见回复。

  【背景】
  - 期刊与稿件题目：[期刊与稿件题目]
  - 审稿决定：[大修/小修]
  - 审稿意见原文（保留审稿人编号与意见编号）：
    [粘贴审稿意见]
  - 我对每条意见的处理（已修改 / 补充分析 / 不同意及理由）：
    [我的处理说明]

  【任务】
  1. 先把意见分类：需补实验或补分析、需改写或澄清、审稿人误解、不同意；标出最关键的意见。
  2. 逐条写回复，格式为：Comment → Response → Changes in manuscript（写明修改位置，页码和行号用占位符）。
  3. 已修改的：简洁说明改了什么，必要时引用修改后的原文。
  4. 不同意的：先感谢和承认合理之处，再用数据、文献或研究设计的理由说明，语气尊重；可提出折中方案（如在局限性中讨论）。
  5. 写开头致谢段和结尾段。

  【约束】
  - 不承诺我没有做的实验或分析；我未说明的处理方式，标「【待作者补充】」。
  - 不编造文献；需要文献支持的地方标「【需补引用】」。
  - 避免过度客套，每条回复开头最多一句感谢。

  【输出格式】
  意见分类表 → 完整回复信（英文）→ 修改清单汇总（便于制作修订稿的修订标记）。
negativePrompt: null
source: null
verify:
  - 检查模型是否会替作者承诺未完成的补充实验
---
**怎么填变量**：[我的处理说明] 最重要，每条写一句即可，比如「R1-3：已补充敏感性分析，见表 S4」「R2-1：不同意，因为样本来自单中心，无法做亚组」。不写处理方式，AI 只能写空泛的回复。

**追问技巧**：对棘手意见单独追问「给出 3 种不同强硬程度的回复写法」；最后追问「检查所有回复的语气是否一致、有没有遗漏的意见」。

**适合模型**：通用大模型均可；意见较长时选上下文窗口大的模型。

> 回复中提到的修改必须在修订稿中真实完成；引用的文献请自行核实。

### 示例输出

> 示例，仅供参考

**Comment 2.1**: The sample size seems small for subgroup analyses.

**Response**: We thank the reviewer for this important point. We agree that the subgroup analyses were underpowered. We have therefore relabeled them as exploratory and added this limitation to the Discussion.

**Changes in manuscript**: Page 【待补】, lines 【待补】.

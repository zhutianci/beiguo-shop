---
title: 投稿过程英文邮件提示词（催审、延期修回、撤稿、更正作者信息）
slug: journal-editor-emails
model: any-llm
topics: [paper-writing, translation]
needsRefImage: false
useCase: 投稿后需要给编辑部写英文邮件时用：选择场景（询问审稿进度、申请延期提交修改稿、撤回稿件、更正作者信息或单位、询问校样问题等），填入稿件信息，AI 写出礼貌简洁、信息完整的英文邮件，并提醒先查投稿系统和期刊政策。
prompt: |
  请帮我给期刊编辑部写一封英文邮件。

  邮件场景：[邮件场景]
  （可选：询问审稿进度 / 申请延长修改稿提交期限 / 撤回稿件 / 更正作者署名或单位 / 增加或删除作者 / 询问校样或出版时间 / 回复编辑的其他问题）
  稿件编号：[稿件编号]
  稿件题目：[稿件题目]
  收件人：[收件人]（如：主编 / 责任编辑 / 编辑部，知道姓名就写姓名）
  关键事实：[关键事实]（如：投稿日期、当前系统状态、需要延期多久及原因、要更正的内容）
  我的身份：[通讯作者/第一作者/其他]

  写作要求：
  1. 主题行：包含稿件编号和事由，例如「Manuscript ID xxx – Request for Extension of Revision Deadline」。
  2. 正文不超过 150 词：开头一句说明身份和稿件；中间清楚陈述事实与请求；结尾一句感谢。
  3. 语气礼貌、专业、不卑不亢；询问进度时不带抱怨，不写「very urgent」之类施压的话。
  4. 根据场景补充必要信息：
     - 询问进度：说明投稿日期和系统当前状态，并说明我已了解期刊公布的常规处理时间（如有）；
     - 延期：给出具体的新期限和简短理由；
     - 撤稿：明确表达撤稿意愿和理由，说明所有作者已同意；
     - 署名或单位变更：说明变更内容、理由，并提示期刊通常要求所有作者签字确认（以期刊政策为准）。
  5. 同时给出一个中文对照译文，方便我核对意思。

  另外请提醒我：发邮件前先检查投稿系统的状态说明和期刊的作者指南，部分事项（如增删作者）需要按期刊规定的表格或流程办理。
negativePrompt: null
source: null
verify:
  - 检查邮件正文是否在 150 词以内
  - 检查撤稿与署名变更场景是否提醒了期刊政策和全体作者同意
---
**怎么填变量**：[邮件场景] 一次只写一个场景，一封邮件只办一件事，编辑处理起来最快。[关键事实] 写清日期和状态，比如「2026 年 6 月投稿，系统显示 Under Review 已 4 个月」，邮件里有具体信息比空泛地问「进展如何」有效得多。

**常见问题与调整**：
- 语气太卑微（大量 sorry、humbly）→ 追问：「删掉多余的道歉，语气保持礼貌而平等。」
- 太长 → 追问：「压缩到 100 词以内，只保留事实和请求。」
- 催审的时机：一般先对照期刊公布的平均审稿时间，超出明显后再询问，间隔不宜过短。具体以期刊惯例为准。

**提示**：修改稿的回复信用本站「审稿意见怎么回复：Response to Reviewers」提示词，首次投稿信用「投稿 Cover Letter 怎么写」。

### 示例输出

> 示例，仅供参考（场景：询问审稿进度）

**Subject:** Manuscript ID ABC-2026-0123 – Inquiry about Review Status

Dear Dr. [Editor's surname],

I am writing to inquire about the status of our manuscript entitled "[稿件题目]" (ID: ABC-2026-0123), submitted on 10 June 2026. The system has shown "Under Review" since mid-June. We understand that the review process can take time, and we would be grateful for any update you may be able to share.

Thank you for your time and assistance.

Sincerely,
[Your name], on behalf of all co-authors

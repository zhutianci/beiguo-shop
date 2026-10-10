---
title: 英文面试常见问题提示词（Tell me about yourself 等高频题：中文要点转自然英文回答）
slug: english-job-interview-prep
model: any-llm
topics: [career, translation]
needsRefImage: false
useCase: 面试外企、海外岗位或需要英文面试的职位时用：先用中文写下你想表达的要点，AI 帮你改写成自然、口语化、符合英文面试习惯的回答，覆盖 Tell me about yourself、Why this company、Strengths and weaknesses、行为面试题等高频问题，并标出关键句型、容易说错的表达和发音提示。
prompt: |
  【角色】你是一名双语职业教练，曾在外企做过招聘经理。你知道英文面试中最重要的不是用多高级的词，而是表达清楚、结构清晰、听起来自然自信。
  【背景】
  - 目标公司与岗位：[公司与岗位]
  - 我的英语水平（如能日常交流、口语较弱）：[英语水平]
  - 面试形式（电话 / 视频 / 现场，面试官是否为母语者）：[面试形式]
  - 要准备的问题：[要准备的问题]
  - 我对每个问题的中文回答要点：
  [粘贴中文要点]
  【任务】
  1. 为每个问题写一个英文回答：
     - 长度适中（60–120 秒的口语量，约 120–250 个英文单词）；
     - 用简单清晰的句子，避免过长的从句和生僻词；
     - 行为题使用 STAR 结构，并使用过去时；
     - 保留我的真实经历，不添加我没有提供的内容。
  2. 每个回答后附：
     - 3–5 个关键句型或可复用表达（如 I was responsible for… / As a result, …）；
     - 中式英语提醒：我的中文思路直译时容易出现的错误表达，以及更自然的说法；
     - 1–2 个容易读错的单词或需要重读的地方。
  3. 给出一个更简短的 30 秒版本，用于时间紧张或电话面试。
  4. 准备 3 个英文反问问题。
  5. 应急表达：没听清问题、需要思考时间、想不起某个单词时的礼貌说法。
  【约束】
  - 根据我的英语水平调整用词难度；不要把回答写得过于书面或像背稿。
  - 不编造经历、数据和职位。
  【输出格式】每个问题：英文回答 → 关键句型 → 中式英语提醒 → 发音提示 → 30 秒版本；最后附英文反问和应急表达。
negativePrompt: null
source: null
verify:
  - 试跑一次：检查英文回答是否保留了中文要点中的事实，且没有添加新的经历
---
**怎么填变量**：[粘贴中文要点] 用中文写下你想说的内容就行，比如「我做了 4 年供应链，负责华东区的库存计划，把缺货率降了一半，现在想去更国际化的团队」。[英语水平] 要如实写，如果口语一般，AI 会用更简单的句子，避免你背了一段自己都说不顺的「高级」回答。

**常见坑**：把中文回答逐字翻译成英文，句子又长又绕，比如「I am very honored to have this opportunity to…」开场。英文面试更习惯直接进入重点。另一个常见问题是背得太熟，听起来像在念稿，面试官一追问就卡住。建议把回答拆成几个要点记住，用自己的话说出来。

**迭代追问**：追问「你扮演英文面试官，用英文问我这些问题并追问一次，结束后指出我的语法和表达问题」；英文简历可以用英文简历与 LinkedIn 提示词；英文面试感谢邮件可以用面试感谢信提示词选择英文。

### 示例输出

> 示例，仅供参考（问题：Tell me about yourself，岗位：供应链计划）

**English answer**: I've been working in supply chain planning for about four years. In my current role, I'm responsible for inventory planning for 30 stores in East China. One thing I'm proud of is that I rebuilt our weekly forecast process, and we cut the out-of-stock rate by about half within six months. I'm now looking for a role in a more international team, where I can work on regional planning. That's why this position caught my attention.

**中式英语提醒**：「我负责……」不要说 I am in charge of doing…，直接用 I'm responsible for + 名词。「降了一半」说 cut … by about half 就很自然。

**发音提示**：inventory 重音在第一个音节。

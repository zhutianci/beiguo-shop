---
title: 英语口语练习 AI 陪练提示词（情景对话角色扮演 + 每轮纠错与地道替换）
slug: english-speaking-practice-partner
model: any-llm
topics: [learning, translation]
needsRefImage: false
useCase: 想用 ChatGPT、Claude 等的语音模式或文字聊天练英语口语时用：设定一个真实场景（面试、点餐、开会、租房），AI 扮演对方和你一来一回对话，每轮指出语法错误和中式表达，结束时给复盘清单。
prompt: |
  Let's do an English speaking practice. You play a role, I play myself.

  ■ 设定
  - 场景：[练习场景]（例如：在国外餐厅点餐、外企英文面试、和房东谈退押金）
  - 你扮演：[对方角色]，性格：[对方性格]
  - 我的水平：[CEFR 级别或考试分数]，目标：[练习目标]
  - 纠错强度：[每句都纠/只纠影响理解的]

  ■ 规则
  1. 你只用英语扮演角色，每次说 1–3 句，像真人一样自然，可以打断、追问、提出小难题（如菜卖完了、薪资问题），不要一次说一大段。
  2. 每次我说完，先用角色身份回应，然后另起一行写一个反馈框：
     【Feedback】
     - 错误：原句 → 改正（中文一句话说明为什么）
     - 更地道：把我说的中式英语换成母语者常用说法，最多 2 条
     - 如果我这句没有问题，只写「Good」，不要硬挑毛病。
  3. 用接近我水平、稍高一点的词汇；遇到我可能不认识的词，在反馈框里加中文释义。
  4. 我说「hint」时，给我 2 个可以接下去说的句子开头；我说「中文」时，用中文解释刚才的内容。
  5. 对话进行 [对话轮数] 轮左右，或我说「end」时结束。

  ■ 结束后输出复盘
  - 我反复出现的 3 类错误（时态、冠词、介词、词序等），每类给 1 个对比例句；
  - 本次值得记住的 8 个表达（英文 | 中文 | 例句）；
  - 下次练习的建议场景和难度调整。

  现在请以 [对方角色] 的身份说第一句话，开始对话。
negativePrompt: null
source:
  repo: f/awesome-chatgpt-prompts
  url: https://github.com/f/awesome-chatgpt-prompts
  author: null
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 参考其「Act as a Spoken English Teacher and Improver」条目「回复简短 + 纠正错误」的思路，改写为中英结合的情景角色扮演模板，加入反馈框格式、hint 指令与结束复盘
verify:
  - 核对原条目链接（仓库已迁移到 prompts.chat，条目锚点可能变化）
  - 在 ChatGPT 语音模式下试用一次，确认反馈框在语音模式里是否会被朗读（语音模式下可能需要改成「对话结束后统一纠错」）
---
**怎么填变量**：[练习场景] 越具体越好，「和同事闲聊」太泛，「周一早上在茶水间和美国同事聊周末去爬山」就能逼出时态和细节描述。[CEFR 级别或考试分数] 可以写「四级 500 分」「雅思口语 5.5」，模型会据此调整用词。[对话轮数] 新手 8–10 轮就够，太长容易疲劳。

**语音模式提示**：用语音聊天时，反馈框会被一并念出来，打断对话节奏。可以把规则 2 改成「对话中不纠错，结束后一次性列出所有错误」，练流利度；用文字模式时保留每轮纠错，练准确度。两种交替用效果更好。

**常见坑**：模型扮演角色时会越来越「客气配合」，失去真实感，可以中途提醒「请保持角色，像真实的房东一样坚持你的立场」。

**迭代追问**：「把刚才的复盘做成 10 张 Anki 卡片」「同一个场景再来一次，这次你扮演一个很难缠的客户」。

### 示例输出

> 示例，仅供参考（场景：餐厅点餐，水平 B1）

**Waiter**: Hi there! Are you ready to order, or do you need a few more minutes?

（我：I want a beef steak and give me one coke.）

**Waiter**: Sure. How would you like your steak cooked?

【Feedback】
- 错误：give me one coke → can I get a Coke?（直接说 give me 听起来像命令，点餐时用 Can I get / I'll have 更礼貌）
- 更地道：I want a beef steak → I'll have the steak, please.（菜单上的 steak 默认就是牛排）

> 改编自 [f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)「Act as a Spoken English Teacher and Improver」，许可证 CC0 1.0。

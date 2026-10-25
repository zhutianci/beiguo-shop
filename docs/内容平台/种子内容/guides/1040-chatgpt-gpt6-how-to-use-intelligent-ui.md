---
title: GPT-6 怎么用：在 ChatGPT 里选到 GPT-6、各套餐能用哪几档，Intelligent UI 能让它做什么（可复制的提问）
slug: chatgpt-gpt6-how-to-use-intelligent-ui
products: [chatgpt]
models: [gpt]
accountTier: PLUS
excerpt: GPT-6 怎么用？在 ChatGPT 模型菜单选 GPT-6，再用 Thinking 滑杆选档，Plus 有 Medium 和 High。讲各套餐能用哪几档，以及 Intelligent UI 的用法和可复制的提问。
checkedOn: 2026-10-25
sources:
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://openai.com/index/gpt-6-for-everyone/
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 官方发布页写 Free 和 Go 由 GPT-6 Luna 驱动，帮助中心 GPT-6 文章写 Free 和 Go 默认是 GPT-5.6 Luna、Think 也用 GPT-5.6 Luna，两处不一致，正文都写了出处并提示以模型菜单为准
  - 官方说 GPT-6 在分批推出，看不到不代表账号有问题；Intelligent UI 在网页和更新后的手机 App 上可用，旧版 macOS、Windows 桌面 App 不支持
  - 「GPT-6 Instant 对需要联网的问题平均早 44% 开始回答」是官方发布页引用的内部评测结果，正文标明是官方内部评测，不是我们的结论
  - 文中的提问示例是依照官方列出的用法（计算器、分账工具、游戏、对比、交互图）改写的，不是官方原话，是否能得到理想的界面取决于模型当时的判断
---

> 本文根据 OpenAI 帮助中心《GPT-6 and other models in ChatGPT》、OpenAI 发布页《GPT-6 and Intelligent UI for everyone》和 ChatGPT 发布说明整理，资料核对于 2026-10-25。官方说明 GPT-6 在分批推出，名称和档位变化快，**以你账号里模型菜单显示的为准**。选模型的细节见 [/guides/chatgpt-model-picker-thinking](/guides/chatgpt-model-picker-thinking)，各个模型名字的关系见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)，本文侧重「怎么用起来」。

## 适用于谁

- 刚看到 ChatGPT 换成 GPT-6，不知道怎么选、怎么用的人；
- 听说 GPT-6 有「Intelligent UI」，想知道它具体能做什么的人；
- 搜「GPT-6 怎么用」「GPT-6 怎么开」的人；
- 在 Plus 上，想知道自己能用到哪一档的人。

## 结论先说

1. **在聊天里，GPT-6 取代了原来模型菜单里的 Latest。** 原来选 Latest 的，会按相同的思考强度换到 GPT-6；明确选了 GPT-5.6 Sol 的，仍停在 GPT-5.6。
2. **用 Thinking 滑杆选档位：** Instant（快）、Medium、High、Extra High、Pro。**Plus 包含 Medium 和 High**；Extra High 和 Pro 档是 Pro、Business、Enterprise 的；Free 和 Go 没有这些档位。
3. **Intelligent UI 是 GPT-6 的新能力：** 回答可以由文字、图表、对比、可点击的按钮和表单等交互元素组成，**不需要特别的提示词**，ChatGPT 自己选格式，简单问题仍给纯文字。
4. **GPT-6 还会「边想边答」：** 开始回答的同时继续思考或用工具，再补充更多内容，不用等整段想完。
5. **Intelligent UI 没有单独额度**，仍受你现有的模型、工具和套餐额度约束。
6. 想用 Plus 的 Medium 和 High 档，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；要用聊天里的 Pro 档（GPT-6 Pro），官方写的是 Pro 100、Pro 200、Business 和 Enterprise，可看 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

![在 ChatGPT 里用 GPT-6 的 4 步：选 GPT-6、选档位、直接提问、需要时关掉视觉元素](seed:g1040-use-gpt6-steps.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

## 一、第一步：选到 GPT-6

1. 打开 ChatGPT（网页或更新到最新版的手机 App）；
2. 点模型菜单，找到 **GPT-6**（官方说它不会标成 Sol）；
3. 用 **Thinking** 滑杆选档。

**看不到 GPT-6：** 官方说，GPT-6 正在向符合条件的账号分批推出；在托管工作区（Business、Enterprise）里，还要看管理员的模型访问权限。手机 App 请更新到最新版；旧版 macOS、Windows 桌面 App 不支持 Intelligent UI，请用网页。排查见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)。

## 二、各套餐能用到哪一档

![各套餐在聊天里能选到的档位：Free 和 Go 没有，Plus 有 Medium 和 High，Pro、Business、Enterprise 都有](seed:g1040-plan-levels.png)
*图：本站根据 [OpenAI 帮助中心：GPT-6 and other models in ChatGPT](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt) 整理的示意图*

各档的意思（官方）：

- **Instant**：日常问题的快速回答；
- **Medium**：标准思考；
- **High**：延长思考；
- **Extra High**：GPT-6 Sol 能用到的最高思考档；
- **Pro**：用于难题和较长任务的 Pro 模型，包括 GPT-5.6 Sol Pro，以及符合条件的套餐上的 GPT-6 Pro。

在 Plus 和 Pro 上，Instant 不会因为你在提示里写「再想深一点」就自动切换到更高档，需要你手动选。手动选 Medium、High、Extra High 有额度，用到上限后，ChatGPT 可能继续用其他可用模型。

**Free 和 Go 呢？** 官方发布页写 Free 和 Go 由 GPT-6 Luna 驱动，而帮助中心写这两档默认是 GPT-5.6 Luna，**两处说法不一致，以你的模型菜单为准**。Free 和 Go 在手机 App 的 **+** 菜单里有 **Think**，用于更难的问题。

## 三、Intelligent UI：它能让你做什么

官方发布页给了几类用法，下面每一类都附一条你可以直接复制的提问。**提示词不是官方原话，是否出现交互界面，由 ChatGPT 按问题自己决定。**

### 1. 更直观的日常回答

官方例子：做计划时，把时间安排和菜谱放在一起；做旅行规划时，把沿途站点放在地图上并写出值得绕路的地方。

> 我周日要请 6 位朋友吃烤羊腿，人数可能还会变。请给我一份菜单、一张按人数换算的用量表，以及一个从上午到开饭的时间安排。

### 2. 学习复杂的内容

官方例子：交互式图解，让你改一个输入、看结果怎么变，或一步步做题。

> 我想理解自行车的 7 速变速是怎么工作的。请用一张可以交互的图帮我讲，让我可以切换档位、看看踩踏的力气和车速怎么变化。

### 3. 直接做一个小工具

官方例子：计算存款会怎么增长的计算器、和朋友聚餐的分账工具、可以在对话里玩的小游戏。

> 帮我做一个可以交互的存款增长计算器：我可以填每月存入金额、年化利率和年数，并看到最终金额和每年的变化图。

> 做一个聚餐分账小工具：我可以输入每个人点的菜和价格，以及小费比例，帮我算出每人该付多少。

### 4. 并排对比

官方说，对比类的问题适合并排展示。

> 把「买一台新笔记本」和「修旧笔记本」放在一起比较：成本、时间、风险、适合的情况，用一张对比表给我。

**提问的小技巧（不是官方规则）：** 说清楚你要的是「可以交互的」「可以改数字」「用对比表」，ChatGPT 就更容易给出对应的界面；简单问题它仍可能只给文字。

## 四、不想要这些视觉元素

官方说明：在 ChatGPT 网页版打开 **Settings**，关闭 **Layout and visuals**，可以减少视觉元素。但官方也说，这个开关不会把整个回答体验切回「纯文字的经典模式」，一些视觉元素可能仍然出现。你对某一次对话外观的改动，不会影响其他对话。

## 五、边想边答是怎么回事

官方发布页说，GPT-6 会在继续思考、搜索或用工具的同时，先开始回答，再逐步补充，所以你不用等它想完才开始读。官方内部评测的说法是：对需要联网的问题，GPT-6 Instant 开始回答平均比 GPT-5.6 Instant 早 44%。这是官方的内部评测结果，不是独立测试，实际感受以你的使用为准。

## 六、和其他地方的 GPT-6 有什么不同

- **聊天（Chat）里的 GPT-6** 由 GPT-6 Sol 驱动（Plus、Pro、Business、Enterprise），Pro 档仍是 GPT-6 Pro，由 GPT-6 Astra 驱动，**不支持 Intelligent UI**；
- **ChatGPT Work 和 Codex** 里的模型不随这次聊天更新而变，用量规则与聊天分开，见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)；
- GPT-6 Pro 怎么用、有哪些限制，见 [/guides/chatgpt-gpt6-pro-astra-how-to-use-plans](/guides/chatgpt-gpt6-pro-astra-how-to-use-plans)；
- GPT-6 什么时候发布、各阶段更新了什么，见 [/guides/chatgpt-gpt6-release-date-timeline](/guides/chatgpt-gpt6-release-date-timeline)。

## 常见问题

**Q：GPT-6 要单独付费吗？**
聊天里的 GPT-6 随套餐提供，按套餐不同可用的档位不同；官方没有单独的 GPT-6 收费项目。需要更高档位，要看套餐，见 [/guides/chatgpt-plus-vs-pro-tiers](/guides/chatgpt-plus-vs-pro-tiers)。

**Q：我的老对话会怎样？**
官方说，原来选 Latest 的会换到 GPT-6，思考强度不变；选了 GPT-5.6 Sol 的仍留在 GPT-5.6；GPT-6 推出不会让旧的可选模型下线。

**Q：官方对 GPT-6 的安全做了什么？**
官方发布页提到，GPT-6 在识别现实风险、回答是否诚实、遵守用户设定的限制等方面做了改进，并有系统卡可查，细节以官方为准。

**Q：为什么我的回答没有图表？**
Intelligent UI 由 ChatGPT 按问题决定是否使用，没有强制；也可能是你关闭了 **Layout and visuals**、用的是旧版桌面 App，或者选了 Pro 档。

## 参考资料

- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI：GPT-6 and Intelligent UI for everyone — https://openai.com/index/gpt-6-for-everyone/
- OpenAI 帮助中心：ChatGPT release notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes

---
title: GPT-6 发布时间与更新了什么：从 GPT-6 Astra 到聊天版 GPT-6（2026 年 9 月至 10 月时间线）
slug: chatgpt-gpt6-release-date-timeline
products: [chatgpt]
models: [gpt]
accountTier: FREE
excerpt: GPT-6 什么时候发布？9 月 3 日 Astra 先向有限组织开放，9 月 22 日 Sol 和 Luna 进 Work 和 Codex，10 月 7 日 GPT-6 与 Intelligent UI 进入聊天。按时间线讲更新了什么。
checkedOn: 2026-10-25
sources:
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://openai.com/index/gpt-6-astra/
  - https://openai.com/index/gpt-6-for-everyone/
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
  - https://developers.openai.com/api/docs/models
verify:
  - 「GPT-6 发布时间」有几个不同的日子：官方发布说明里，GPT-6 Astra 是 2026-09-03，聊天版 GPT-6 是 2026-10-07；正文按时间线都写了，没有只挑一个
  - 发布说明写 Astra 9 月 3 日「向有限的组织开放、尚未全面可用」，OpenAI 发布页写「未来几天内向 Plus、Pro、Business、Enterprise 用户和 API 开放」；各套餐实际到账时间官方没有逐日列出，以账号为准
  - 发布页的评测数字（例如联网问答早 44%）是 OpenAI 内部评测，正文标明是官方内部评测，不作我们自己的结论
  - 帮助中心 GPT-6 文章写 Free 和 Go 默认是 GPT-5.6 Luna，发布页写 Free 和 Go 由 GPT-6 Luna 驱动，以模型菜单为准
  - API 价格取自 developers.openai.com 模型页（2026-10 查询），会变动
---

> 本文根据 ChatGPT 发布说明（help.openai.com）、OpenAI 发布页《GPT-6 Astra》《GPT-6 and Intelligent UI for everyone》和帮助中心《GPT-6 and other models in ChatGPT》整理，资料核对于 2026-10-25。官方是分批推出，**各账号看到的时间不同**。怎么在聊天里用 GPT-6，见 [/guides/chatgpt-gpt6-how-to-use-intelligent-ui](/guides/chatgpt-gpt6-how-to-use-intelligent-ui)。

## 适用于谁

- 搜「GPT-6 发布时间」「GPT-6 什么时候出」的人；
- 分不清 GPT-6 Astra、Sol、Luna、GPT-6.1 Sol 分别是什么时候的事的人；
- 想知道「现在用的 GPT-6」和 9 月那个 GPT-6 是不是一回事的人。

## 结论先说

1. **GPT-6 不是一天发布的，而是分了几步：**
   - **2026 年 9 月 3 日**：GPT-6 Astra 发布，先向有限的一批组织开放；
   - **9 月 22 日**：GPT-6 Sol 和 GPT-6 Luna 进入 ChatGPT Work 和 Codex；
   - **9 月 29 日**：GPT-6.1 Sol 进入 Work 和 Codex，先 Pro 用户，再扩展到 Plus、Business、Enterprise、Edu；
   - **10 月 7 日**：GPT-6 与 Intelligent UI 进入 ChatGPT 聊天，Plus、Pro、Business、Enterprise 当天开始，Free 和 Go 从次日开始；
   - **10 月 16 日**：聊天里的 GPT-6 Pro 更新。
2. **如果你问的是「ChatGPT 聊天里的 GPT-6」，答案是 10 月 7 日。** 官方发布页写的是「面向每周超过 12 亿使用 ChatGPT 的人」的新 GPT-6 模型。
3. **聊天版 GPT-6 由 Sol 或 Luna 驱动：** 官方说 Plus、Pro、Business、Enterprise 由 GPT-6 Sol 驱动，Free 和 Go 由 GPT-6 Luna 驱动；Pro 档仍然是 GPT-6 Pro（GPT-6 Astra 驱动）。**但帮助中心写 Free 和 Go 默认是 GPT-5.6 Luna，两处说法不同，以模型菜单为准。**
4. **Work 和 Codex 里的模型不随 10 月 7 日这次聊天更新而改变。**
5. 想用聊天里的 Medium、High 档，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)；要用 GPT-6 Pro，可以看 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

![GPT-6 在 2026 年 9 月到 10 月的发布时间线](seed:g1041-gpt6-timeline.png)
*图：本站根据 [ChatGPT 发布说明](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) 整理的示意图*

## 一、时间线逐步说明

### 9 月 3 日：GPT-6 Astra

发布说明写：GPT-6 Astra 在编码、研究、操作电脑和复杂的多步骤工作上有改进；它可以按你的模板和要求生成文档、表格和演示文稿，并能在你补充要求或改变方向时调整。**访问向有限的一批组织开放，尚未全面可用**，几天内会扩大。Astra 还加入了额外的安全监控，发现智能体可能没有正确理解指令的情况时，对话可能被暂停或中止，让你检查并决定怎么处理。

OpenAI 发布页写：Astra 将在接下来几天向所有 ChatGPT Plus、Pro、Business、Enterprise 用户，以及 OpenAI API、Microsoft Azure、AWS Bedrock 开放。需要注意：官方帮助中心现在写的是 **Plus 在 ChatGPT Work 和 Codex 里含 GPT-6 Astra**，聊天里的 Pro 档（GPT-6 Pro）则在 Pro 100、Pro 200、Business、Enterprise 上。

### 9 月 22 日：GPT-6 Sol 和 GPT-6 Luna

官方发布说明：GPT-6 Sol 和 GPT-6 Luna 进入 ChatGPT Work 和 Codex，**这些模型和聊天里的模型是分开的**。OpenAI 发布页同日也更新说明：GPT-6 家族加入 Sol 和 Luna。

### 9 月 29 日：GPT-6.1 Sol

官方说，GPT-6.1 Sol 在代理式编程、操作电脑和专业工作上比 GPT-6 Sol 有提升，在 Work 和 Codex 里推出，**先是 Pro 用户，再扩展到 Plus、Business、Enterprise、Edu**。同日还有一个新的 Pro 500 套餐，含 Astra Ultrafast，详见 [/guides/chatgpt-pro-worth-it](/guides/chatgpt-pro-worth-it)。

### 10 月 7 日：聊天里的 GPT-6 和 Intelligent UI

官方发布说明：ChatGPT 现在可以把文字、视觉和交互元素结合起来回答，从并排比较、图表，到计算器、分账工具和小游戏；还可以边思考边开始回答。推出顺序：**Plus、Pro、Business、Enterprise 在聊天（Chat）里当天开始，Free 和 Go 从次日开始**；Enterprise 取决于管理员设置。

### 10 月 16 日：聊天里的 GPT-6 Pro

发布说明：聊天里的 GPT-6 Pro 现在更快，更善于用插件和工具完成任务，并支持多个智能体并行处理一个任务的不同部分，你可以在对话里看进度、打开已完成的任务；向符合条件的 Pro 用户推出。

## 二、聊天版 GPT-6 更新了什么

![聊天里的 GPT-6 更新了什么：Intelligent UI、边想边答、联网更快、安全改进](seed:g1041-gpt6-chat-changes.png)
*图：本站根据 [OpenAI：GPT-6 and Intelligent UI for everyone](https://openai.com/index/gpt-6-for-everyone/) 整理的示意图*

- **Intelligent UI**：回答可以含图表、对比、可点击的按钮和表单，需要时 ChatGPT 自己选格式，简单问题仍给文字；没有单独的使用额度；
- **边想边答**：回答不必等整个思考结束；
- **联网问答**：官方内部评测称，对需要联网的问题，GPT-6 Instant 开始回答平均比 GPT-5.6 Instant 早 44%，并且更会判断什么时候该查资料；这是官方自己的评测，不是第三方测试；
- **安全**：官方说在识别风险、诚实回答、遵守用户设定的限制方面有进展，并有系统卡（deploymentsafety.openai.com）可查。

## 三、在 API 里

官方开发者模型页（2026-10 查询）列出了 `gpt-6-astra`、`gpt-6.1-sol` 和 `gpt-6-luna`。页面显示：GPT-6 Astra 输入每百万 token $10、输出 $50；GPT-6.1 Sol 输入 $2、输出 $10；两者上下文窗口都是 105 万 token、最大输出 12.8 万 token。API 单独计费，不包含在 ChatGPT 订阅里，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。价格会变，以官方模型页为准。

## 四、对你有什么影响

- **在聊天里用**：模型菜单里选 GPT-6，用 Thinking 滑杆选档，步骤见 [/guides/chatgpt-gpt6-how-to-use-intelligent-ui](/guides/chatgpt-gpt6-how-to-use-intelligent-ui)；
- **看不到 GPT-6**：官方说分批推出，见 [/guides/chatgpt-cant-find-new-model-gpt-6-codex](/guides/chatgpt-cant-find-new-model-gpt-6-codex)；
- **几个名字什么关系**：见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)；
- **GPT-6 Pro**：见 [/guides/chatgpt-gpt6-pro-astra-how-to-use-plans](/guides/chatgpt-gpt6-pro-astra-how-to-use-plans)；
- **想追官方新动态**：看 [/guides/chatgpt-release-notes-latest-model](/guides/chatgpt-release-notes-latest-model)。

## 常见问题

**Q：GPT-6 到底是哪天发布的？**
看你指哪一个：GPT-6 Astra 是 2026-09-03，聊天里的 GPT-6 是 2026-10-07。

**Q：GPT-6 发布后，GPT-5.6 还能用吗？**
官方说，GPT-6 推出不会让旧的可选模型下线；明确选 GPT-5.6 Sol 的，仍留在 GPT-5.6。

**Q：Free 能用 GPT-6 吗？**
官方发布页说 Free 和 Go 从 10 月 7 日的次日起获得 GPT-6 Luna；帮助中心写默认是 GPT-5.6 Luna。以你模型菜单里显示的为准。

**Q：GPT-6.1 Sol 在聊天里能选吗？**
官方说它是 Work 和 Codex 的模型选项，和聊天里的 GPT-6、GPT-5.6、GPT-6 Pro 是分开的。

## 参考资料

- OpenAI 帮助中心：ChatGPT release notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI：GPT-6 Astra — https://openai.com/index/gpt-6-astra/
- OpenAI：GPT-6 and Intelligent UI for everyone — https://openai.com/index/gpt-6-for-everyone/
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- OpenAI 开发者文档：Models — https://developers.openai.com/api/docs/models

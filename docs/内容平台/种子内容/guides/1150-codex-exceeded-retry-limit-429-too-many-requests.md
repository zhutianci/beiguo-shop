---
title: "Codex 报「exceeded retry limit, last status: 429 Too Many Requests」怎么办：额度、API 密钥与工作区限制的排查顺序"
slug: codex-exceeded-retry-limit-429-too-many-requests
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 提示 exceeded retry limit, last status: 429 Too Many Requests？官方没有单独解释这句话，429 在 HTTP 里表示请求太多。本文按官方文档列出可能相关的情况：套餐额度、API 密钥限额、工作区额度控制，并教你到哪里看用量。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/auth
  - https://learn.chatgpt.com/docs/enterprise/usage-limits
  - https://learn.chatgpt.com/docs/developer-commands
  - https://status.openai.com/
verify:
  - 官方文档没有单独解释「exceeded retry limit, last status: 429」这句报错，也没有写它一定意味着额度用完；本文只列官方文档里和用量限制、API 计费相关的说法，不对这句报错下结论
  - GitHub openai/codex 的公开问题里有用户反馈在用量页面还有余量时也遇到 429，截至核对日仍是未关闭的问题，官方没有给出解释，本文只提示「有这类反馈」
  - 用量页面网址和 /status、/usage 命令来自官方文档当天的写法，之后可能调整
---

> 本文根据 Codex 官方文档（Pricing、Authentication、企业用量控制、命令参考）整理，资料核对于 2026-10-27。**官方没有单独解释这条报错**，也没有写它一定表示额度用完。429 是 HTTP 状态码，字面意思是「请求太多」，本文列的是官方文档里与用量限制相关的几种情况。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 里发消息后弹出 `exceeded retry limit, last status: 429 Too Many Requests`（有时后面跟着 `request id`）的人；
- 用 ChatGPT 账号登录，或用 API 密钥登录的人；
- 在公司、学校的 ChatGPT 工作区里用 Codex 的人。

## 结论先说

1. **先去看用量。** 官方的用量页面是 [chatgpt.com/codex/settings/usage](https://chatgpt.com/codex/settings/usage)；在命令行里可以输入 `/status` 看当前会话的用量，输入 `/usage` 看账号的 token 用量。用量页面上有限额和重置时间。
2. **用量真的见底了**：官方说，在一个进行中的任务里达到限额时，代理仍可能继续完成这一轮；ChatGPT Plus 和 Pro 用户达到上限后可以购买额外的额度继续用，不必升级套餐；也可以改用 API 密钥跑本地对话，用量按标准 API 价格计费。
3. **用量页面还有余量**：先稍等几分钟再试。反复出现就向官方反馈，并带上报错里的 `request id`。
4. **你是用 API 密钥登录的**：429 要按 API 自己的速率限制和账户余额去查，见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。
5. **你在公司或学校的工作区里**：问管理员，工作区的额度控制可能影响计划内的 Codex 用量。
6. **状态页有 Codex 事件**：等官方恢复，读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。

![Codex 429：先对照这张表](seed:g1150-429-decide.png)
*图：本站根据 [Codex 官方文档：Pricing](https://learn.chatgpt.com/docs/pricing) 与 [Authentication](https://learn.chatgpt.com/docs/auth) 整理的示意图*

## 报错原文怎么读

```text
exceeded retry limit, last status: 429 Too Many Requests, request id: ...
```

拆开读：**Codex 向服务端发请求，服务端回了 429；Codex 重试了几次，仍然是 429，于是放弃并报错**。`429 Too Many Requests` 是通用的 HTTP 状态码，表示在一段时间内请求太多；服务端用它可以表示不同的限制，所以单看这句话，**分不清是你的套餐额度、API 的速率限制，还是服务端的临时限流**。官方文档没有逐条解释，所以下面用「看用量」把情况分开。

## 一、先去看用量，三个入口

官方 Pricing 页「Where can I see my current usage limits?」写了：当前限额在用量页面可见；在命令行会话里想看剩余限额，用 `/status`。命令参考里另有 `/usage`：查看账号 token 用量，或者使用可兑换的额度重置（可以直接输入 `/usage daily`、`/usage weekly`、`/usage cumulative` 打开对应视图）。官方建议每隔一两周看一次用量页面，了解自己的节奏。

![在哪里看 Codex 还剩多少额度](seed:g1150-where-usage.png)
*图：本站根据 [Codex 官方文档：Pricing](https://learn.chatgpt.com/docs/pricing) 与命令参考整理的示意图*

## 二、用量页面显示额度用完了

官方 Pricing 页的几条说明（本站转述）：

- 可发送的消息数量取决于所用模型、任务的大小和复杂程度，以及在本地还是云端运行；看起来相似的任务消耗也可能不同，模型选择、上下文、推理、工具调用、检索和缓存都会影响用量，所以提示词长度不是可靠的估算依据；
- Plus 和标准 Business 的本地消息数是按每五小时估算的，官方强调这只是估算，不是固定的消息上限，以用量页面的限额和重置时间为准；Pro 目前没有五小时限制；
- 云端任务可能比本地消息消耗更多额度；
- 图像生成和本地消息、云端对话共用同一类额度，官方写明图像生成消耗额度的速度平均比类似的无图像任务快 3 到 5 倍。

各套餐的具体数字和重置规则，以官方页面和站内文章 [/guides/codex-usage-limits](/guides/codex-usage-limits) 为准。想开通更高的套餐，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 或 [/chongzhi/chatgpt-pro](/chongzhi/chatgpt-pro)。

## 三、让额度更耐用的几个官方建议

官方在 Pricing 页「What can I do to make my usage limits last longer?」里给了这些：

- **控制提示词的大小**：指令精确，去掉不必要的上下文；
- **限制素材**：只给相关的文件，尽量缩小来源或日期范围；
- **输出匹配需求**：说明受众、格式和长度，把必须做的和可选的分开；
- **精简 AGENTS.md**：项目较大时，可以把 AGENTS.md 按目录嵌套，控制注入的上下文量；
- **减少 MCP 服务器**：每个 MCP 服务器都会给你的消息增加上下文、占用更多额度，用不到时关掉，配置方法见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。

## 四、用量页面还有余量，却仍然报 429

这一点官方文档没有说明。需要提醒的是：GitHub 的 [openai/codex](https://github.com/openai/codex/issues) 问题列表里，有用户反馈在用量页面显示还有余量时仍然反复遇到 429，这类问题截至本文核对日仍是未关闭的状态。**这只能说明有这类反馈，不能说明原因**，也不是官方的解释。可以做的是：

1. 稍等几分钟再试，不要连续快速重发；
2. 到状态页确认 Codex 相关组件没有进行中的事件；
3. 反复出现就在输入框里输入 `/` 向官方提交反馈，或在 GitHub 查看是否有相同问题，附上 request id 与版本号，不要贴令牌或密钥。

## 五、用 API 密钥登录时

官方认证文档说，用 API 密钥登录后，Codex 用量按标准 API 价格计费，不使用 ChatGPT 套餐里包含的额度；用量遵循的是你的 API 组织的保留和数据共享设置。此时 429 要到 OpenAI Platform 的账户页面查看速率限制和账单，而不是 ChatGPT 的用量页面。API 的 429 是怎么回事，见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

## 六、在工作区里用 Codex

官方有专门的《ChatGPT usage limits and spend controls》页，写明工作区的额度控制可能影响计划内的 Codex 用量。个人用户看不到工作区的设置，需要问管理员：是否设置了额度或支出限制、你所在的角色能用多少。

## 常见问题

**Q：重试几次都不行，要不要换个模型？**
官方的省额度建议里提到「用较小的模型、收窄任务范围，往往也能得到有用的结果」，不同模型消耗额度的速度不同，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

**Q：是不是我的账号被限制了？**
官方文档没有把 429 和账号限制联系在一起。登录和账号方面的问题见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。

**Q：ChatGPT 网页聊天正常，只有 Codex 报错？**
官方的说明是 Work 和 Codex 的用量规则与聊天分开，两者的区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

## 参考资料

- Codex 官方文档：Pricing — https://learn.chatgpt.com/docs/pricing
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth
- Codex 官方文档：ChatGPT usage limits and spend controls — https://learn.chatgpt.com/docs/enterprise/usage-limits
- Codex 官方文档：命令参考（/status、/usage）— https://learn.chatgpt.com/docs/developer-commands
- OpenAI 状态页 — https://status.openai.com/

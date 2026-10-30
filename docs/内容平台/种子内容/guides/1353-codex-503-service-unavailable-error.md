---
title: Codex 报错 503 怎么办：Model temporarily overloaded 的官方说法，Retry-After 与重试办法
slug: codex-503-service-unavailable-error
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 提示 503？OpenAI 官方 API 文档把 503 解释为模型暂时过载，建议等待后重试，响应里有 Retry-After 就至少等那么久。本文讲怎么重试、什么时候该看状态页，以及用第三方提供方时 503 可能来自哪里。
checkedOn: 2026-10-30
sources:
  - https://developers.openai.com/api/docs/guides/error-codes
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://learn.chatgpt.com/docs/config-file/config-advanced
  - https://status.openai.com/
verify:
  - 「503 = Model temporarily overloaded」来自 OpenAI API 错误码文档；Codex 官方文档没有单独解释 Codex 里出现的 503，本文按 API 文档的通用做法写，可能与某些具体场景不完全对应
  - 报错在 Codex 里的原文可能随版本变化，没有统一固定的中文翻译
  - 官方没有给出「要等多久」的数字，只说有 Retry-After 就照它等，没有就逐步拉长间隔
---

> 本文根据 OpenAI API 错误码文档、Codex 排查页和配置文档整理，资料核对于 2026-10-30。**官方没有专门解释 Codex 里的 503**，下面写的是 API 文档对 503 的说法和通用重试方法。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 里看到 `503`、`Service Unavailable` 或 `server_is_overloaded` 的人；
- 任务跑到一半突然报错、想知道要不要重新开始的人；
- 在 config.toml 里用了第三方提供方的人。

## 结论先说

1. 官方 API 文档里，**503 对应「Model temporarily overloaded」，类型 `service_unavailable_error`，代码 `server_is_overloaded`**，意思是模型暂时过载，不是你的账号或额度出了问题。
2. 官方的处理办法：**响应里有 `Retry-After`，就至少等它写的时间再重试**；没有就逐步拉长重试间隔；持续出现就看状态页。
3. 不要连续狂点重发，也不要因此退订、重装。
4. 持续不好又没有状态页事件，提交反馈（输入框输入 `/`），带上 request id 和 session ID。

![Codex 503：先对照这张表](seed:g1353-503-decide.png)
*图：本站根据 [OpenAI API 错误码文档](https://developers.openai.com/api/docs/guides/error-codes) 整理的示意图*

## 官方对 503 的原话怎么理解

API 错误码页对 503 的描述是：原因是模型暂时过载；解决办法是——如果响应里有 `Retry-After` 头，至少等它指定的时间再重试；如果没有，就增加重试之间的间隔；错误持续时检查状态页。

通俗地说：**这是服务端忙不过来，不是请求写错了**。你的提示词、项目文件、登录状态通常都不用改。对比：401 是认证问题，见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)；429 是请求或额度的限制，见 [/guides/codex-exceeded-retry-limit-429-too-many-requests](/guides/codex-exceeded-retry-limit-429-too-many-requests)。

## 一、怎么重试才对

![503 的重试办法](seed:g1353-503-steps.png)
*图：本站根据 [OpenAI API 错误码文档](https://developers.openai.com/api/docs/guides/error-codes) 整理的示意图*

- **先停一下。** 报错的那一秒再发，大概率还是同样的结果；
- **有等待时间就照做。** `Retry-After` 是服务端明确告诉你的下限；
- **没有就逐步拉长。** 官方在 429 的建议里写过：没有 `Retry-After` 时，用「指数退避加随机抖动」，并限制重试次数；503 的做法与之一致；
- **不急的任务晚点再跑**，也可以换个模型，不同模型的繁忙程度不一定一样，换模型见 [/guides/codex-switch-model-reasoning-effort](/guides/codex-switch-model-reasoning-effort)。

Codex 自己也会重试：配置参考里，HTTP 请求默认重试 4 次、流式中断默认重试 5 次，所以你看到 503 往往是它试过之后的结果。

## 二、看状态页

503 持续超过几分钟，就打开 [status.openai.com](https://status.openai.com/)，看 Codex、ChatGPT 相关组件有没有事件。读法见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。有事件就等官方恢复。

## 三、用了第三方提供方时

官方配置文档允许用 `[model_providers.<id>]` 配其他地址，还可以给每个提供方单独设置 `request_max_retries`、`stream_max_retries`、`stream_idle_timeout_ms`（默认依次是 4、5、300000 毫秒）。此时 503 可能是那个提供方产生的，OpenAI 的状态页帮不上忙，要看对方的状态与说明。想确认是不是 Codex 的问题，可以暂时回到官方登录再试，配置方式见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok)。

## 四、任务中断了怎么办

官方排查页对「卡住的对话」的建议：看 Codex 是否在等你批准某个操作；在终端里跑一条简单命令如 `git status`；新开一个对话、提示词缩小一些再试。503 之后接着做，可以在新对话里先让它读一下当前改动，再继续。

## 常见问题

**Q：503 会扣额度吗？**
官方文档没有说明，也没有说失败的请求是否计费，以用量页面显示为准，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

**Q：高峰期更容易出现吗？**
官方没有给出规律，只说是「暂时过载」。

**Q：升级套餐能避免 503 吗？**
官方文档没有这样写。额度类问题可以参考 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 的说明，但 503 本身不是额度错误。

## 参考资料

- OpenAI API 错误码 — https://developers.openai.com/api/docs/guides/error-codes
- Codex 官方排查页 — https://learn.chatgpt.com/docs/reference/troubleshooting
- Codex 配置文档（自定义提供方）— https://learn.chatgpt.com/docs/config-file/config-advanced
- OpenAI 状态页 — https://status.openai.com/

---
title: "Codex 报错 detail: Bad Request 怎么办：官方没单独说明，按登录方式和自定义提供方排查"
slug: codex-detail-bad-request-error
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: "Codex 提示 detail: Bad Request？官方文档没有收录这句话。400 在 HTTP 里表示请求本身有问题。本文按官方资料，把可能情况分成 ChatGPT 登录、API 密钥、自定义提供方三类，给出升级、缩短提示、回到官方登录和反馈的顺序。"
checkedOn: 2026-10-30
sources:
  - https://developers.openai.com/api/docs/guides/error-codes
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://learn.chatgpt.com/docs/config-file/config-advanced
  - https://learn.chatgpt.com/docs/auth
verify:
  - 官方文档没有收录「detail: Bad Request」这句报错，也没有解释 Codex 里 400 的原因；API 错误码文档里 400 只给了 service_tier 参数不被项目允许这一个例子
  - 「400 表示请求有问题」是 HTTP 通用常识，不是官方对这条报错的解释；正文给的几类情况是排查方向，不是确定原因
  - 配置文档的 Azure 示例用 wire_api = "responses"，没有文档化 chat 值；是否能接某个第三方，以对方与 Codex 官方说明为准
---

> 本文根据 Codex 排查页、配置文档和 OpenAI API 错误码文档整理，资料核对于 2026-10-30。**官方没有收录 `detail: Bad Request` 这句话**，也没有单独解释 Codex 里的 400。本文给的是排查方向，不是确定的原因。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 在 Codex 里发消息后得到 `detail: Bad Request` 或 `400` 的人；
- 登录方式是 ChatGPT 账号、API 密钥，或自己配了第三方提供方的人；
- 想知道这是不是自己账号或额度问题的人。

## 结论先说

1. **Bad Request（400）在 HTTP 里表示「这次请求本身有问题」**，而不是服务器忙或额度用完。这是网络常识，官方没有就 Codex 的这条报错给出具体解释。
2. **先分清你是怎么登录的**：ChatGPT 账号、API 密钥、config.toml 里的自定义提供方，三种情况的排查方向不一样。
3. 通用的几步：记下原文 → 升级 Codex → 开新对话、缩短提示 → 去掉自定义提供方回官方登录 → 反馈。
4. 额度、登录失效，官方是分开的报错：见 [/guides/codex-exceeded-retry-limit-429-too-many-requests](/guides/codex-exceeded-retry-limit-429-too-many-requests)、[/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)。

![Bad Request：先看你怎么登录的](seed:g1355-badreq-decide.png)
*图：本站根据 [Codex 官方文档](https://learn.chatgpt.com/docs/config-file/config-advanced) 与 [API 错误码](https://developers.openai.com/api/docs/guides/error-codes) 整理的示意图*

## 官方到底说了什么

OpenAI API 错误码文档里，400 只有一个例子：`Invalid service_tier argument`，原因是请求的服务层级不被这个项目允许，解决办法是改成允许的层级，或者在项目设置里调整。它说明 **400 可能和请求参数有关**，但不能由此推出 Codex 里的每个 Bad Request 都是这个原因。

Codex 排查页没有 400，也没有「detail」这个字段的说明。所以下面按登录方式分类，是在帮你缩小范围。

## 一、用 ChatGPT 账号登录

这是最常见的情况。官方没有写原因，能做的是：

1. 用 `codex --version` 看版本，更新到最新版；命令行更新方式见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)；
2. **新开一个对话**，把提示词缩小，别一次粘贴大段内容。官方排查页对卡住的对话的建议也是「用更小的提示开新对话」；
3. 退出登录再重新登录一次；
4. 看状态页 [status.openai.com](https://status.openai.com/)，排除官方故障。

## 二、用 API 密钥登录

官方认证文档说，用 API 密钥登录后，用量按标准 API 价格计费。此时 400 更接近 API 的参数错误：看报错里有没有指出具体参数，核对模型名和参数写法是否被你的项目允许。对照错误码时，回到官方错误码页面，并可参考 [/guides/openai-api-429-error](/guides/openai-api-429-error) 里对 API 错误的整体说明。

## 三、用 config.toml 里的自定义提供方

官方配置文档允许用 `[model_providers.<id>]` 配第三方地址，并写明几点：

- 自定义提供方不能使用保留 ID `openai`、`ollama`、`lmstudio`；
- 文档里所有示例的 `wire_api` 都是 `"responses"`，没有写其他取值；
- `openai_base_url` 要写在 `~/.codex/config.toml`，项目里的 `.codex/config.toml` 不能设置它。

所以 400 在这类配置下，常见的怀疑方向是：对方服务不兼容 Codex 发出的请求格式、模型名写错、参数对方不支持。**这只是怀疑方向，官方没有写这就是原因。** 最快的验证办法：**暂时去掉 `model_provider`，回到官方登录**再发一次，如果恢复正常，问题就在那个提供方的配置。接入方法和兼容性说明见 [/guides/codex-third-party-models-deepseek-gemini-grok](/guides/codex-third-party-models-deepseek-gemini-grok)。

![排查 Bad Request 的顺序](seed:g1355-badreq-steps.png)
*图：本站根据 [Codex 官方排查页](https://learn.chatgpt.com/docs/reference/troubleshooting) 整理的示意图*

## 四、反馈时带什么

在输入框输入 `/` 提交反馈，会得到 session ID，官方要求把它给团队。同时附上：`detail` 后面的完整原文、request id、`codex --version`。会话记录在 `~/.codex/sessions`，分享之前先检查有没有路径、密钥等敏感信息，令牌和密钥不要贴出去。

## 常见问题

**Q：是不是我的提示词违规了？**
官方没有把 Bad Request 与内容规则联系起来。ChatGPT 对内容的限制是另一回事。

**Q：重装能解决吗？**
官方没有这样建议。先升级，再按上面顺序排查；安装方式见 [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install)。

**Q：报错总表在哪？**
本站把 Codex 常见报错汇总在 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。需要更高额度的套餐，可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI API 错误码 — https://developers.openai.com/api/docs/guides/error-codes
- Codex 官方排查页 — https://learn.chatgpt.com/docs/reference/troubleshooting
- Codex 配置文档（自定义提供方）— https://learn.chatgpt.com/docs/config-file/config-advanced
- Codex 认证文档 — https://learn.chatgpt.com/docs/auth

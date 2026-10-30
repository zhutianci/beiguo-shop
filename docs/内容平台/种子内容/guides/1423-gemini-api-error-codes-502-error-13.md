---
title: Gemini API 报错 400、403、429、500、503、504 怎么办：官方错误码对照，502 和 error 13 官方没列出时怎么查
slug: gemini-api-error-codes-502-error-13
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: "Gemini API 报错 400、403、429、500、503、504，哪些该重试，哪些要先改请求或补账单？按官方错误页和排查页（2026-10-30 查询）逐项对照。官方没有列出 502 和 error 13，本文说明遇到这两种时能做什么。"
checkedOn: 2026-10-30
sources:
  - https://ai.google.dev/gemini-api/docs/api-errors
  - https://ai.google.dev/gemini-api/docs/troubleshooting
  - https://aistudio.google.com/status
verify:
  - 错误码名称和说明是 2026-10-30 当天读到的官方页面；官方页面里的英文原文这里按意思改写，具体措辞以官方为准
  - 官方两页都没有出现 502 和「error 13」，本文对这两种的建议是通用做法，不是官方对该错误码的说明
  - 官方排查页把 400 和 402 都归为不要重试的客户端错误，并提到预付费余额用尽的情形，余额相关规则以官方账单页为准
---

> 本文根据 Gemini API 官方文档的「API errors」页和「Troubleshooting」页整理，资料核对于 2026-10-30。**官方两页都没有出现 502，也没有出现「error 13」**，这两种在下面单列一节说明。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 调用 Gemini API，返回 HTTP 400、403、429、500、503、504 的开发者；
- 在 Cursor、Cline、Cherry Studio 等工具里填了 Gemini API Key，看到报错的人；
- 搜「Gemini 报错 502」「Gemini error 13」的人。

## 结论先说

1. 官方错误页把错误分成三类：**请求本身的问题**（400、401、402、403、404、416 等，改请求或查账号，**重试没用**）、**限流类**（429，等一等再试）、**服务端类**（500、503、504）。
2. **429 有三种代码**：`rate_limit_exceeded`（每分钟或每秒的请求或 token 超限）、`quota_exceeded`（日配额用完）、`too_many_requests`（短时间请求太多）。前者和后者等待后按指数退避重试，日配额则要等重置或申请提高。429 的详细讲解见 [/guides/gemini-api-429-resource-exhausted](/guides/gemini-api-429-resource-exhausted)。
3. **500 `api_error`**：服务端意外错误，重试，持续就联系支持。**503 `service_unavailable`**：服务暂时过载或不可用，等待后按指数退避重试。**504 `deadline_exceeded`**：请求没在时限内完成，官方建议去掉或调大客户端的超时设置，让服务端用默认值。
4. 官方推荐的重试方式：**指数退避，加随机抖动，设置最大重试次数**；官方说明 Python SDK 默认对暂时性错误最多重试四次。
5. **502 和 error 13 官方页面里没有**。先看官方状态页，确认不是官方故障，再按通用做法处理，见第三节。

![Gemini API 常见错误码速查](seed:g1423-error-codes.png)
*图：本站根据 [Gemini API 错误页](https://ai.google.dev/gemini-api/docs/api-errors) 整理的示意图*

## 一、请求类错误：重试没有用

| 代码 | HTTP | 含义 | 怎么办 |
| --- | --- | --- | --- |
| `invalid_request` | 400 | 请求格式不对或参数无效 | 对照 API 参考检查语法和参数 |
| `failed_precondition` | 400 | 前提条件不满足，例如账单未开通 | 检查账单状态和账号前提 |
| `parameter_unknown` | 400 | 请求里有不认识的参数 | 删掉该参数再试 |
| `authentication` | 401 | API Key 缺失、无效或过期 | 检查 Key |
| `payment_required` | 402 | 预付费余额用完 | 补充余额或开启自动充值，补充前不要重试 |
| `permission_denied` | 403 | Key 没有权限，或项目被限制 | 检查权限、所在层级和账单 |
| `not_found` / `model_not_found` | 404 | 资源或模型不存在 | 检查路径、参数和模型名 |
| `out_of_range` | 416 | 参数超出有效范围 | 检查取值和限制 |

排查页对 403 的几种情形写得更细：

- **项目被拒绝访问**，或项目状态是 Restricted、Free tier unavailable、Payment needed、Unavailable；
- **免费层不可用**：关联一个有效的 Cloud Billing 账号；
- **需要付款**：处理欠费，或在账单页更新付款方式；
- **Key 泄露或被封**：官方会提示「API key was reported as leaked」，要在 AI Studio 里新建一个 Key。

Key 的创建和保管，可参考 [/guides/gemini-api-python-quickstart](/guides/gemini-api-python-quickstart)。免费层和付费层的额度区别，见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits) 和 [/guides/gemini-api-price-official](/guides/gemini-api-price-official)。

## 二、限流和服务端错误：可以重试

| 代码 | HTTP | 含义 | 怎么办 |
| --- | --- | --- | --- |
| `rate_limit_exceeded` | 429 | 每分钟或每秒的请求或 token 超限 | 等待后按指数退避重试 |
| `quota_exceeded` | 429 | 日配额用完 | 等配额重置，或申请提高 |
| `too_many_requests` | 429 | 短时间内请求太多 | 等待后按指数退避重试 |
| `api_error` | 500 | 服务端意外错误 | 重试，持续就联系支持 |
| `service_unavailable` | 503 | 服务暂时过载或宕机 | 等待后按指数退避重试 |
| `deadline_exceeded` | 504 | 请求在时限内没完成 | 去掉或调大客户端超时 |
| `unimplemented` | 501 | 该功能或操作不支持 | 检查 API 能力，换支持的功能 |
| `cancelled` | 499 | 客户端在完成前取消了请求 | 通常是客户端断开，无需处理 |

另外官方页面还列了**内容被拦截**的代码（如 `safety`、`prohibited_content`、`image_safety` 等），官方说法是修改输入后再试；以及**生成错误**（如 `malformed_function_call`、`no_image`）。这些和网络、额度无关，是请求内容或模型输出方面的问题。

## 三、502 和 error 13：官方没写，怎么办

官方的 API 错误页使用 `api_error`、`service_unavailable`、`deadline_exceeded` 这样的小写名称，页面里**没有**502，也**没有**「error 13」。网上常见的 `500 INTERNAL`、`UNAVAILABLE` 这类大写名称，也没有出现在这一页里。所以这两种报错没有官方的逐条解释，建议这样查：

![Gemini API 报错先这样查](seed:g1423-error-decide.png)
*图：本站根据 [Gemini API 排查页](https://ai.google.dev/gemini-api/docs/troubleshooting) 整理的示意图*

1. **看官方状态页** [aistudio.google.com/status](https://aistudio.google.com/status)，确认是不是官方在处理事件；
2. 502 在 HTTP 里通常表示网关或中间代理收到了上游的无效响应，所以在你和 Google 之间还有**代理、网关或第三方中转**的话，先绕开它直接请求官方地址试试；
3. 把它当作暂时性错误处理：**指数退避重试，设置最大次数**；
4. 用的是**第三方工具或客户端**时，换一个客户端或更新版本再试，并查看工具自己的日志；
5. 持续出现，保存请求 ID 等信息，向官方反馈。

## 常见问题

**Q：Gemini 网页或 App 里的报错呢？**
那是另一类，见 [/guides/gemini-error-messages-table](/guides/gemini-error-messages-table) 和 [/guides/gemini-down-check-status-page](/guides/gemini-down-check-status-page)。

**Q：429 是不是一定是我用多了？**
官方把 429 分成三种代码，只有看到 `quota_exceeded` 才是日配额用完，其他两种是短时间内太快，等一等就好。

**Q：需要 Google 账号怎么办？**
本站有 [Google 账号相关服务](/chongzhi/google-zhanghao)，具体以页面说明为准。

## 参考资料

- Gemini API 错误 — https://ai.google.dev/gemini-api/docs/api-errors
- Gemini API 排查 — https://ai.google.dev/gemini-api/docs/troubleshooting
- Google AI Studio 状态页 — https://aistudio.google.com/status

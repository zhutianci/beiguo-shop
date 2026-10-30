---
title: Kimi API 报错 400 怎么办：invalid_request_error、content_filter、Input token length too long 对照表
slug: kimi-api-error-400-invalid-request
products: [kimi]
models: []
accountTier: OTHER
excerpt: 调用 Kimi API 返回 400，官方把它归为「请求错误」，要看 error type 和 message 才知道原因。本文按 Kimi API 开放平台的错误码说明，列出 400 的各种典型情况（内容审查、输入过长、参数错误、文件上传限制）和对应处理，并附 401、403、404、429、504 速查。
checkedOn: 2026-10-30
sources:
  - https://platform.kimi.com/docs/api/errors
  - https://platform.kimi.com/docs/api/chat
  - https://platform.kimi.com/docs/guide/troubleshooting
verify:
  - 官方错误码页只列了「典型」情形，实际 message 可能有别的写法，以你收到的响应为准
  - 文件大小、数量上限是官方文档当天的数字，官方可能调整
  - 本文不涉及 Kimi Code 或第三方工具（CC Switch 等）里的报错，那属于另一条排查链路
---

> 本文根据 Kimi API 开放平台的《常见错误码说明》《Chat Completions API》和《问题排查》整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 用 Kimi API 开发，调用时返回 HTTP 400 的人；
- 在第三方工具里配置了 Kimi，看到 400 想弄清是不是 Kimi 的问题的人。

## 结论先说

1. 官方把 400 定义为**「请求错误」**，**不是一个原因**，要看响应 JSON 里的 `error.type` 和 `message`。
2. 官方列出的 400 典型情形：`content_filter`（内容审查）、`invalid_request_error`（格式、缺参数、输入过长、文件上传的各种限制）。
3. 报错时 API 返回包含错误信息的 JSON。**先把完整响应读一遍**，再对照下面的表。
4. 如果你收到的是 401、404、429，那是别的问题，官方的处理见文末速查表。
5. 经常和 400 一起出现的坑：把别的产品的 Key 填进开放平台端点、模型名写错。这两类官方分别归到 401/404，不是 400。

![Kimi API 报 400：对照 error type](seed:g1447-400-decide.png)
*图：本站根据 [Kimi API 开放平台：常见错误码说明](https://platform.kimi.com/docs/api/errors) 整理的示意图*

## 一、400 的典型情形

| error type | 典型 message | 官方的原因与处理 |
| --- | --- | --- |
| `content_filter` | The request was rejected because it was considered high risk | 输入或模型输出触发内容安全审查。修改提示词，避免敏感或高风险内容 |
| `invalid_request_error` | 请求格式错误、缺少必填参数或参数类型非法 | 对照接口文档检查请求体 |
| `invalid_request_error` | Input token length too long | 输入 Token 数达到或超过模型上下文窗口。缩短输入或换用更大上下文的模型 |
| `invalid_request_error` | Invalid purpose: xxx, only `file-extract`, `batch`, `batch_output`, `lambda`, `image` and `video` accepted | 文件上传的 purpose 不合法，需是上述取值之一 |
| `invalid_request_error` | File size is too large, max file size is 100MB, please confirm and re-upload the file | 上传文件超过 100MB。压缩或拆分后重传 |
| `invalid_request_error` | File size is zero, please confirm and re-upload the file | 上传文件大小为 0。检查文件是否损坏或为空 |
| `invalid_request_error` | 上传文件总数超过上限 | 删除不再使用的早期文件后重试 |

另外，Chat Completions 文档里有一条：**暂不支持显式缓存断点**，`content` 中出现 `prompt_cache_breakpoint` 时请求会被拒绝（HTTP 400）。如果你是从别的平台迁移过来的代码，检查是否带了这个字段。

## 二、按顺序排查

1. **看 `error.type`**：是 `content_filter` 就是内容问题，是 `invalid_request_error` 再看 message；
2. **message 里有 token length**：说明输入太长。缩短提示词、去掉重复的历史消息，或换更大上下文的模型；
3. **是上传文件**：确认 `purpose` 是官方列出的值之一，文件非空、不超过 100MB，早期用不到的文件及时删除；
4. **message 看不出原因**：对照 [Chat Completions 接口文档](https://platform.kimi.com/docs/api/chat) 逐个检查必填参数和类型（比如数字写成了字符串）；
5. **用 cURL 直连一次**：官方建议在用第三方 Agent 或 IDE 时，先用相同的 Key、端点和模型直接调用 Kimi API。直连成功但第三方工具仍失败，就去看第三方工具的日志，重点是协议转换、流式响应、超时和自动重试；
6. **保留 `request_id`、发生时间、客户端版本和脱敏日志**，需要联系支持时用。

## 三、状态码速查

![Kimi API 常见状态码速查](seed:g1447-codes-compare.png)
*图：本站根据 [Kimi API 开放平台：常见错误码说明](https://platform.kimi.com/docs/api/errors) 整理的示意图*

| 状态码 | 官方归类 | 提示 |
| --- | --- | --- |
| 401 | 认证错误 | 先确认 Key 属于正确的平台：中国站 platform.kimi.com 与国际站 platform.kimi.ai 的账户、余额和 Key 完全独立，混用返回 401 |
| 403 | 权限错误 | API 暂未对当前账号开放，或调用 IP 不在组织白名单内（国际站常见） |
| 404 | 资源不存在 | 模型不存在或无权访问，检查 model 拼写和账号 tier |
| 429 | 速率限制或额度不足 | 先看 `error.type` 再决定，见 [/guides/kimi-queue-busy-compute-shortage](/guides/kimi-queue-busy-compute-shortage) |
| 500 | 服务端错误 | 稍后重试；持续出现就附上 `request_id` 联系支持 |
| 504 | 网关超时 | 服务端 900 秒无响应，非流式长请求建议改用 `stream: true` |

## 常见问题

**Q：充值后为什么还是报错？**
先看是哪个状态码。官方特别说明：429 里的 `engine_overloaded_error` 是服务端容量问题，充值不能消除；而 400 与余额无关。

**Q：Kimi API、Kimi Code 和 Kimi 会员的余额与 Key 通用吗？**
官方写明不互通。Kimi API 开放平台、Kimi Code 和 Kimi 会员的余额与 API Key 相互独立，用错会出现 401 或 404。

**Q：怎么拿 API Key、第一次怎么调用？**
见 [/guides/kimi-api-key-quickstart](/guides/kimi-api-key-quickstart)。Kimi 网页版的会员额度问题见 [/guides/kimi-extra-usage-pack-quota-used-up](/guides/kimi-extra-usage-pack-quota-used-up)。

**Q：我用 DeepSeek 等其他接口，报错怎么看？**
各家错误码不同，DeepSeek 的见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 参考资料

- Kimi API 开放平台：常见错误码说明 — https://platform.kimi.com/docs/api/errors
- Kimi API 开放平台：Chat Completions API — https://platform.kimi.com/docs/api/chat
- Kimi API 开放平台：问题排查 — https://platform.kimi.com/docs/guide/troubleshooting

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。

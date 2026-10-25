---
title: DeepSeek API 报错 400、402、429 怎么办：官方错误码与常见触发原因对照
slug: deepseek-api-error-codes
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API 返回 400、401、402、422、429、500、503 分别是什么意思、怎么处理？按官方错误码页、限速页和各功能文档（2026-10-24 查询）逐项整理，并列出文档里写明会触发 400 的几种情形和空行、超时的原因。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
  - https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
  - https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
  - https://api-docs.deepseek.com/zh-cn/guides/json_mode
  - https://api-docs.deepseek.com/zh-cn/guides/vision
  - https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
verify:
  - 七个状态码的含义和处理办法取自官方错误码页（2026-10-24）
  - 触发 400 的情形分别来自：思考模式文档（携带 tools 的请求，后续请求必须完整回传 reasoning_content，否则返回 400）、图像理解文档（system 或 assistant 消息携带图片返回 400）、Anthropic API 文档（不以 claude 开头的未知模型名返回 400）
  - JSON 输出文档写明「API 有概率会返回空的 content」，官方说正在优化，可尝试修改提示词缓解；本文只转述，不保证改提示词一定有效
  - 请求保活机制取自限速页：10 分钟后仍未开始推理，服务器会关闭连接
---

> 本文根据 DeepSeek 官方 API 文档整理，资料核对于 2026-10-24。错误码和限制可能调整，以官方文档为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek api 报错」「deepseek 402」「deepseek 429」「deepseek 400」的开发者；
- 在 Cursor、Cline、Cherry Studio 等工具里填了 DeepSeek 的 Key，却一直报错的人；
- 想弄清「服务器繁忙」和「余额不足」到底差在哪的人。

## 结论先说

1. 官方错误码页一共列了 7 个：**400 格式错误、401 认证失败、402 余额不足、422 参数错误、429 请求速率达到上限、500 服务器故障、503 服务器繁忙**。
2. **402 就是余额不足**，不是限速也不是服务器问题；**429 是你自己的并发或频率超了**；**500 / 503 才是服务器那边的问题**，官方说等一等再试。
3. 400 的原因最杂，文档里明确写了几种会触发的情形，见第三节。

![DeepSeek API 报错先看状态码](seed:g1006-deepseek-error-codes-decide.png)
*图：本站根据 [DeepSeek 官方错误码页](https://api-docs.deepseek.com/zh-cn/quick_start/error_codes) 整理的示意图*

## 一、错误码对照表

| 状态码 | 官方说明的原因 | 官方给的处理办法 |
| --- | --- | --- |
| 400 格式错误 | 请求体格式错误 | 根据错误信息提示修改请求体 |
| 401 认证失败 | API Key 错误，认证失败 | 检查 API Key 是否正确，没有就先创建 |
| 402 余额不足 | 账号余额不足 | 确认账户余额，去充值页面充值 |
| 422 参数错误 | 请求体参数错误 | 根据错误信息提示修改相关参数 |
| 429 请求速率达到上限 | 请求速率或并发达到上限 | 合理规划请求速率，限速详见「限速与隔离」 |
| 500 服务器故障 | 服务器内部故障 | 等待后重试；一直存在就联系官方 |
| 503 服务器繁忙 | 服务器负载过高 | 稍后重试 |

## 二、402 与 429 怎么处理

**402**：先去开放平台看余额，充值方法见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。注意充值余额和赠送余额是分开的，扣费时优先扣赠送余额。

**429**：限速页写明，对每个账号，并发限制是 deepseek-flash 2500、deepseek-v4-pro 500。要点：

- 从请求发出到模型响应完成之前，算一个并发；
- 并发按**账号**计，和用了几个 Key 无关；多开 Key 不会增加额度；
- 在限度内的请求都会得到响应，超过就收到 HTTP 429；
- 需要更高并发，可以提交官方的账号扩容申请工单，官方说扩容不增加额外费用。

处理思路：给请求加队列或限流，失败后等待一会儿再重试，别立刻狂重试；批量任务放到空闲时段，价格也更低（见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)）。如果你只是在聊天网页看到「服务器繁忙」，那是网页端的提示，见 [/guides/deepseek-server-busy](/guides/deepseek-server-busy)。

另外，Search 和 Fetch 接口有自己的 QPS 限制（官方写 Search 100、Fetch 25），超过也是 429，并且和模型并发互不占用。

## 三、文档里明确会触发 400 的情形

![请求出错时，先查这 5 处](seed:g1006-deepseek-400-check.png)
*图：本站根据 DeepSeek 官方各功能文档整理的检查清单示意图*

1. **思考模式 + 工具调用没回传 reasoning_content**：官方思考模式文档写明，携带了 tools 参数的请求，在后续所有请求中必须完整回传 `reasoning_content`，即使那一轮没有真的调用工具；没有正确回传，API 会返回 400。最省事的做法是直接把上一次返回的 `message` 整个 append 回 messages；
2. **图片放错位置**：图像理解文档写明，图片只能出现在 user 消息里，system 或 assistant 消息携带图片会返回 400；
3. **Anthropic 接口里用了不存在的模型名**：以 claude 开头的模型名会被映射（claude-opus 开头映射到 deepseek-v4-pro，claude-haiku、claude-sonnet 开头映射到 deepseek-flash），不以 claude 开头的未知模型名返回 400；
4. **Responses API 图片字段冲突**：同时传 `image_url` 和 `file_id`，或两个都不传，都返回 400；
5. **JSON 格式本身有问题**：请求体不是合法 JSON、字段值类型不对，都属于官方说的「请求体格式错误」。

JSON 输出还有一点：官方说使用 JSON Output 时，API 有概率返回空的 content，建议修改提示词来缓解；同时提示词里必须有「json」字样并给出期望格式的样例，`max_tokens` 要设得够大，防止 JSON 被截断。

## 四、请求「卡住」或一直返回空行

限速页的「请求保活机制」写明：请求发出后有时要等一会儿，这段时间 HTTP 连接会保持，并持续收到内容——非流式请求返回空行，流式请求返回 SSE 的 keep-alive 注释（`: keep-alive`）。这些不影响 JSON 解析，但如果你自己解析响应，要处理这些空行或注释。**如果 10 分钟后请求还没开始推理，服务器会关闭连接。** 所以不是死机，是排队；排得太久就会断。

## 五、在第三方工具里报错怎么办

在 Cursor、Cline、Cherry Studio 等工具里，工具会把 API 的错误原样显示或包装一下。先对照状态码：401 多半是 Key 填错或带了空格；402 去充值；429 降低并发；400 先检查模型名拼写（`deepseek-flash`、`deepseek-v4-pro`）、Base URL 是否是 `https://api.deepseek.com`，以及工具是否在发送官方文档不支持的内容。具体到各工具的设置，见本站对应教程。Key 的创建与保管见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。

## 常见问题

**Q：500 和 503 要重试几次？**
官方只说等待后重试，没有给次数。建议加指数退避，并设上限；一直不行就去官方状态页（status.deepseek.com）看看。

**Q：Search / Fetch 接口也是这些错误码吗？**
大体相同，另外有 403（Fetch 被安全策略拒绝）、404（Fetch 没取到可用内容）、408（读取请求体超时）、413（请求体太大）、504（下游超时）。官方说遇到 408、429 或 5xx 要等待后重试，遇到 402 先充值，其他 4xx 不修改请求就不要重试。

**Q：Python 调用的完整示例在哪？**
见 [/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)。

## 参考资料

- DeepSeek API 文档：错误码 — https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
- DeepSeek API 文档：限速与隔离 — https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
- DeepSeek API 文档：思考模式 — https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
- DeepSeek API 文档：JSON Output — https://api-docs.deepseek.com/zh-cn/guides/json_mode
- DeepSeek API 文档：图像理解 — https://api-docs.deepseek.com/zh-cn/guides/vision
- DeepSeek API 文档：使用 Anthropic API — https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
- DeepSeek API 文档：网页搜索与抓取 — https://api-docs.deepseek.com/zh-cn/guides/search

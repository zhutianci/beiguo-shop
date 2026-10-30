---
title: Claude 报错 429 rate_limit_error 怎么办：速率限制、加速限制和月度花费上限三种来源，retry-after 怎么看
slug: claude-api-error-429-rate-limit
products: [claude]
models: []
accountTier: FREE
excerpt: "Claude API 返回 429 rate_limit_error，不一定是请求太快。按官方错误页和速率限制页（2026-10 查询），429 有速率限制、加速限制、触到档位月度花费上限等来源，处理办法不同。本文讲清怎么看 retry-after 和 error_code，以及 SDK 自动重试的行为。"
checkedOn: 2026-10-30
sources:
  - https://platform.claude.com/docs/en/api/errors
  - https://platform.claude.com/docs/en/api/rate-limits
verify:
  - 官方两页是 2026-10-30 当天读到的版本，限额数值和档位表会随时调整，本文只写机制，不抄具体限额数字
  - 官方只在 Claude Code 工作区限制处提到 429 可能带 retry-after，其他场景是否带请以实际响应头为准
  - 官方没有单独说明 claude.ai 网页版聊天里的 429，本文只讲 API；网页版额度问题见站内另一篇
---

> 本文根据 Claude 官方 API 错误页和速率限制页整理，资料核对于 2026-10-30。官方没有单独说明 claude.ai 网页版聊天里出现的 429，本文讲的是 API 返回的 429，在 Claude Code、Cursor 等工具里看到的 429 多半也是它。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 调用 Claude API，返回 HTTP 429、`rate_limit_error` 的开发者；
- 在 Cursor、Cline 等工具里填了自己的 Claude API Key，工具显示 429 的人；
- 重试了很多次还是 429，想知道到底是什么限制的人。

## 结论先说

1. 官方错误页对 429 的定义是：你的组织触到了**速率限制**，或用完了所在档位的**月度花费上限**，或触到了 **Claude Code 工作区**的花费限制。
2. **看响应头 `retry-after`**：有，就等那么多秒再重试，更早重试会失败；**没有**，且错误里带 `enforced_spend_limit_reached`，就是月度花费上限，重试（包括 SDK 自动重试）都会失败，直到下月 1 日 00:00 UTC 或你申请提高。
3. 官方还提到**加速限制**：组织的用量突然猛增时，也可能收到 429。办法是逐步增加流量、保持稳定。
4. **你自己设的花费上限**触顶，返回的是 **400**（`invalid_request_error`）而不是 429；调高或取消限额即可。
5. 官方 SDK 默认会对 429、5xx 和连接错误**自动重试两次**，指数退避，并遵守 `retry-after`。

![429 的几种来源](seed:g1410-429-sources.png)
*图：本站根据 [Claude API 错误页](https://platform.claude.com/docs/en/api/errors) 和 [速率限制页](https://platform.claude.com/docs/en/api/rate-limits) 整理的示意图*

## 一、速率限制：请求太多或 token 太多

官方说明 Messages API 的速率限制按模型类别分别计算，包括：

- **RPM**：每分钟请求数；
- **ITPM**：每分钟输入 token 数；
- **OTPM**：每分钟输出 token 数。

超过其中任何一项就会收到 429，错误信息会说明超的是哪一项。几个值得知道的细节：

- 限制是**按组织**计的，换一个 API Key 不会增加额度；
- 限制可能在很短的时间窗口里生效：官方举例，每分钟 60 个请求可能按每秒 1 个来执行，所以**突发的并发请求**也会触发；
- 官方用**令牌桶算法**，容量是持续补充的，不是整点重置；
- 对大多数模型，**命中缓存读取的输入 token 不计入 ITPM**，所以用好提示词缓存能提高实际吞吐，缓存方法见 [/guides/claude-prompt-caching](/guides/claude-prompt-caching)；
- `max_tokens` 不影响 OTPM 的计算，OTPM 按实际生成的 token 数算。

响应头里会带当前限额、剩余量和重置时间，名字以 `anthropic-ratelimit-` 开头，可以按 requests、tokens、input-tokens、output-tokens 分别查看；`retry-after` 是还要等的秒数，官方说**不是每个 429 都带它**。

## 二、月度花费上限：重试没有用

官方规则：Start、Build、Scale 三档都有月度花费上限。用到上限后，**API 用量暂停到下月 1 日 00:00 UTC**，期间请求返回 429。

和普通速率限制的区别：

- 错误类型同样是 `rate_limit_error`；
- **没有 `retry-after` 头**；
- 消息里写着月度用量阈值并给出恢复时间，`error.details.error_code` 是 `enforced_spend_limit_reached`；
- 升到更高档位可以恢复，提高上限在控制台的速率限制页发起「Request tier increase」。

具体的档位上限金额，请看官方页面当天的数字，本文不引用。

**自己设置的上限**不一样：在控制台账单页设置的花费上限触顶时，请求返回 **400**，消息以「You have reached your specified API usage limits」开头，调高或移除限额就能恢复。API Key 和控制台的使用见 [/guides/claude-api-key-console](/guides/claude-api-key-console)。

## 三、加速限制：用量突然猛增

官方在错误页和速率限制页都提醒：如果组织的用量**突然大幅上升**，可能因为加速限制收到 429。避免的办法是**逐步增加流量，保持稳定的使用节奏**，比如批量任务从低并发开始慢慢加。官方没有给出加速限制的具体阈值。

## 四、对照表：收到 429 先这样查

![收到 429 先这样查](seed:g1410-429-decide.png)
*图：本站根据 [Claude API 速率限制页](https://platform.claude.com/docs/en/api/rate-limits) 整理的示意图*

## 五、要更高的额度怎么办

官方提供的途径：

1. 控制台「Rate limits」页里的 **Request tier increase**，可申请更高的速率限制或月度花费上限；
2. 联系 Anthropic 支持，紧急情况也可以走这里；
3. 用工作区（Workspace）给不同项目设置更低的限额，避免某个项目占满整个组织的额度。官方说明默认工作区不能设花费上限；
4. 在控制台的 Usage 页可以看到速率限制的图表，了解自己的峰值和缓存命中率。

## 常见问题

**Q：我已经等了很久还是 429，为什么？**
先看是不是花费上限：没有 `retry-after` 且 error_code 是 `enforced_spend_limit_reached`，那就不是等几十秒的问题，要等到下月初或申请提高。

**Q：429 和 529 有什么区别？**
429 是你所在组织的限制，529 是 API 整体过载，见 [/guides/claude-api-error-529-overloaded](/guides/claude-api-error-529-overloaded)。

**Q：Claude Code 里的报错怎么看？**
常见报错见 [/guides/claude-code-common-errors](/guides/claude-code-common-errors)；订阅额度不是 API 额度，两者区别见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。需要 Claude 订阅的话，本站有 [Claude Pro 充值页](/chongzhi/claude-pro)。

**Q：怎么确认是官方故障？**
看 [/guides/claude-down-check-status-page](/guides/claude-down-check-status-page)。

## 参考资料

- Claude API 错误 — https://platform.claude.com/docs/en/api/errors
- Claude API 速率限制 — https://platform.claude.com/docs/en/api/rate-limits

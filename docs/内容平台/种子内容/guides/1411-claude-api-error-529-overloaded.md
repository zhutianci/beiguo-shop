---
title: Claude 报错 529 overloaded_error 怎么办：API 暂时过载是什么意思，和 429、500、504 怎么区分
slug: claude-api-error-529-overloaded
products: [claude]
models: []
accountTier: FREE
excerpt: "Claude API 返回 529 overloaded_error，官方的解释是 API 暂时过载，全体用户高峰时都可能遇到，不是你的 Key 或余额出了问题。本文按官方错误页（2026-10 查询）讲清它和 429、500、504 的区别、SDK 怎么自动重试、流式请求中途报错怎么处理。"
checkedOn: 2026-10-30
sources:
  - https://platform.claude.com/docs/en/api/errors
  - https://platform.claude.com/docs/en/api/rate-limits
verify:
  - 官方错误页对 529 只写了「API 暂时过载」和「高流量下全体用户都可能遇到」，没有给出持续时间、重试间隔或专门的处理步骤；本文的重试和排查建议里，只有 SDK 自动重试和流式错误事件来自官方，其余是本站的通用做法
  - 官方 SDK 默认重试次数「两次」是 2026-10-30 当天错误页的说法，以官方为准
---

> 本文根据 Claude 官方 API 错误页整理，资料核对于 2026-10-30。**官方对 529 的说明很短**：它只写了「API 暂时过载」，没有单独的排查步骤。下面把官方写明的内容和本站的通用做法分开写。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 调用 Claude API，返回 HTTP 529、`overloaded_error` 的开发者；
- 在 Cursor、Cline、Claude Code 等工具里用 Claude 模型，工具显示 Overloaded 的人。

## 结论先说

1. **529 `overloaded_error` 的官方含义是：API 暂时过载。** 官方补充说明：**API 在全体用户的流量都很高时，就可能出现 529**。
2. 这是**服务端整体的状况**，和你的 API Key、余额、个人限速都无关。**429 才是你自己的组织触到了限制**，两者要区分，见 [/guides/claude-api-error-429-rate-limit](/guides/claude-api-error-429-rate-limit)。
3. 官方 SDK 会对**连接错误、速率限制和 5xx 等暂时性失败**自动重试，默认两次，指数退避。官方没有把 529 单独点名，但它属于这类服务端的暂时性失败，以 SDK 实际行为为准。
4. 官方提到一种相关情形：组织用量突然猛增时，可能因为**加速限制**收到 429。避免办法是逐步增加流量。
5. 持续出现时，看官方状态页，确认是不是在处理事件：[/guides/claude-down-check-status-page](/guides/claude-down-check-status-page)。

![429、500、504、529 怎么区分](seed:g1411-status-codes.png)
*图：本站根据 [Claude API 错误页](https://platform.claude.com/docs/en/api/errors) 整理的示意图*

## 一、官方错误码里 529 排在哪

官方错误页列出的 HTTP 错误里，和服务端有关的有三个：

- **500 `api_error`**：Anthropic 系统内部出现意外错误。官方建议用指数退避重试，持续出现就联系支持，并附上请求 ID；
- **504 `timeout_error`**：请求处理超时。官方建议长请求用流式 Messages API；
- **529 `overloaded_error`**：API 暂时过载。

另外的 400、401、402、403、404、409、413 是请求或账号本身的问题，**重试没有意义**，要改请求或检查 Key、账单、权限。429 是限速，见上面的链接。

## 二、收到 529 怎么办

### 官方写明的部分

1. **SDK 自动重试**：官方 SDK 默认会对暂时性失败自动重试，指数退避；可以用 `max_retries` 之类的参数调整或关闭；
2. **流式请求的特殊性**：用 SSE 流式返回时，**错误可能出现在服务端已经返回 200 之后**，这时不按普通的 HTTP 状态码处理，而是看流里的「错误事件」。官方在流式文档里有专门的说明；
3. **记下请求 ID**：每个响应都带 `request-id` 头，错误响应体里也有 `request_id` 字段。要联系支持时附上它，处理更快。

### 本站的通用做法

官方没有给 529 的专门步骤，下面是通用的工程做法，不是官方保证：

- **别密集地重试**：在失败后拉长间隔再试，不要立刻连发，否则可能让情况更糟，还可能碰到加速限制；
- **别反复换 Key**：529 不是 Key 的问题；
- **把能延后的任务排队**：批量任务可以改用官方的 Message Batches API，官方在「长请求」说明里把它列为应对网络不稳的办法；
- **对用户界面做提示**：如果你做的是产品，给用户一个「服务繁忙，请稍后重试」的提示，并保留请求内容。

![收到 529 怎么办](seed:g1411-529-decide.png)
*图：本站根据 [Claude API 错误页](https://platform.claude.com/docs/en/api/errors) 整理的示意图*

## 三、在 Cursor、Cline 等工具里看到 Overloaded

这些工具用你的 API Key 调用 Claude，会把 API 返回的错误显示出来或包装一下。看到 Overloaded、529，一般就是上面讲的 API 过载，工具本身没有问题。可以稍等再发一次，或换一个模型试试。

如果显示的是 429、400、401，处理办法不同：401 多半是 Key 填错，400 要检查请求内容，429 看上面的 429 文章。Claude Code 里的常见报错见 [/guides/claude-code-common-errors](/guides/claude-code-common-errors)。

## 常见问题

**Q：529 是我的额度用完了吗？**
不是。额度和花费上限触顶返回的是 429（或你自己设置的上限返回 400）。529 是 API 整体过载。

**Q：订阅用户（Pro、Max）会遇到 529 吗？**
官方错误页只讲 API。订阅用户在网页或 Claude Code 里遇到的拥堵提示，官方没有在这个页面里逐条说明；Max 套餐的说明里提到「高峰时段优先访问」，见 [/guides/claude-pricing-free-or-paid](/guides/claude-pricing-free-or-paid)。

**Q：API 和订阅是一回事吗？**
不是，见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。如需开通 Claude Pro，可看本站 [Claude Pro 充值页](/chongzhi/claude-pro)。

**Q：怎么拿到 API Key？**
见 [/guides/claude-api-key-console](/guides/claude-api-key-console)。

## 参考资料

- Claude API 错误 — https://platform.claude.com/docs/en/api/errors
- Claude API 速率限制 — https://platform.claude.com/docs/en/api/rate-limits

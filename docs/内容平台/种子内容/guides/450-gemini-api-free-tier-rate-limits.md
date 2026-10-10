---
title: Gemini API 免费额度是多少：免费层级、RPM / TPM / RPD 速率限制与限额查询
slug: gemini-api-free-tier-rate-limits
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: Gemini API 有免费层，但官方不再公布固定额度表，要到 AI Studio 的 Rate Limit 页面看。本文讲清免费层能用哪些模型、RPM / TPM / RPD 怎么算和何时重置、数据使用差别与升档条件。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/rate-limits
  - https://ai.google.dev/gemini-api/docs/billing
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/terms
  - https://ai.google.dev/gemini-api/docs/interactions-overview
  - https://ai.google.dev/gemini-api/docs/google-ai-plans
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/generate-content/api-errors
  - https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
  - https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/
verify:
  - 各模型免费层的 RPM / TPM / RPD 具体数字：2026-10-10 的官方 Rate limits 页面没有列出，只让用户到 AI Studio 的 Rate Limit 页面查看，正文未写数字
  - 「哪些模型有免费层」是按 2026-10-10 定价页各模型 Standard 表格的 Free Tier 一栏整理的（Free of charge / Not available），会随时变动，上线前请对照定价页
  - 表格里的升档门槛、按 10 分钟计的支出速率上限为官方 Rate limits 页原文数字（美元），属于限额而非价格；如站内规则不允许出现金额可删去该表两列
  - 上下文缓存在免费层能不能用，定价页两处说法不一致：方案概览把「Access to Context caching」列在 Paid 下，但 Gemini 3.8 Flash 等模型表格的免费层一栏写缓存价格 Free of charge；正文未下结论
  - 截图来自 2025-10-18 官方博客，图中的限额数字是当时某个付费项目的示例，不代表现在的免费额度
  - 免费层在部分国家或地区不可用（官方错误表有对应的 400 FAILED_PRECONDITION），但官方没有单独列出是哪些地区
---

> 本文根据 Gemini API 官方文档（Rate limits、Billing、Pricing、Additional Terms of Service、Interactions API）和 Google 官方博客整理，资料核对于 2026-10-10。限额数字随账号档位和模型变化，以你在 AI Studio 里看到的为准。

## 适用于谁

- 想知道 Gemini API 免费能用多少、用哪些模型的人；
- 看到 RPM、TPM、RPD、Tier 1 这些词不明白意思的人；
- 免费层不够用，想知道升档条件和升档后有什么变化的开发者。

## 结论先说

1. **有免费层，但官方不再公布固定的免费额度表**。官方 Rate limits 页面的说法是：限额取决于你的使用档位等多种因素，请到 AI Studio 的 **Rate Limit** 页面查看自己项目当前生效的限额。网上流传的「每天多少次」多半是旧数字。
2. **限额分三个维度**：每分钟请求数（RPM）、每分钟输入 token 数（TPM）、每天请求数（RPD），超过任何一个都会报 429。
3. **限额按项目算，不按密钥算**；RPD 在太平洋时间午夜重置。
4. **免费层只能用部分模型**，而且你提交的内容会被 Google 用于改进产品；付费层不会。
5. **绑定结算账号并预付费后进入 Tier 1**，之后按累计消费和账号时长自动升到 Tier 2、Tier 3，限额随之提高。

## 一、免费层是什么，能用哪些模型

官方账单页的说明：新账号从免费层（Free Tier）开始，可以在 Gemini API 和 AI Studio 里使用**部分模型**，上限就是各模型的免费层速率限制。

按 2026-10-10 官方定价页各模型表格里「Free Tier」一栏整理（标 Free of charge 的算有免费层，标 Not available 的算没有）：

| 有免费层的（节选） | 没有免费层、只能付费用的（节选） |
| --- | --- |
| Gemini 3.8 Flash、Gemini 3.6 Flash | Gemini 3.1 Pro Preview |
| Gemini 3.5 Flash-Lite、Gemini 3.1 Flash-Lite | Nano Banana 系列图片模型（Nano Banana 2.1、2、2 Lite、Pro） |
| Gemini 3 Flash Preview | Gemini Omni Flash（视频生成） |
| Gemini 3.8 Flash TTS、Flash-Lite TTS（语音合成） | |
| Gemma 4 | |

另外几个容易忽略的点：

- 定价页对免费层的描述是「对部分模型的有限访问」；付费层的卖点是更高的速率限制、Batch API 和最先进的模型。各模型的 Batch 表格里，免费层一栏都是「不可用」。
- Gemini 3.8 Flash 等模型的表格里，**Google 搜索接地（Grounding with Google Search）在免费层一栏是「不可用」**。
- Gemini 2.5 系列：官方说明为保证容量，现在只对过去实际用过这些模型的用户开放，新项目请用 3.5 Flash-Lite 或 3.8 Flash。
- 官方错误表里有一条 400 FAILED_PRECONDITION：「你所在的国家或地区不提供 Gemini API 免费层，请在 AI Studio 为项目开通结算」。也就是说，免费层并不是在所有可用地区都有。

## 二、RPM、TPM、RPD 分别是什么

| 缩写 | 含义 | 说明 |
| --- | --- | --- |
| RPM | 每分钟请求数 | Requests per minute |
| TPM | 每分钟输入 token 数 | Tokens per minute (input) |
| RPD | 每天请求数 | Requests per day，太平洋时间午夜重置 |

官方给的规则：

- **三项分别检查，超过任意一项就触发限流**。官方举例：RPM 上限是 20 时，一分钟内发第 21 个请求就会报错，哪怕 TPM 还远没用完。
- **按项目计算，不按 API 密钥**。同一个项目下建多个密钥，共用同一份限额。
- **不同模型限额不同**，有些限额只对特定模型存在：能生成图片的模型有每分钟图片数（IPM），有的模型有每天 token 数（TPD）。
- **实验版和预览版模型的限额更严**。
- 官方声明：标出的限额不构成保证，实际可用容量可能变化。
- 账单页还有一条：返回 400 或 500 错误的请求不收 token 费用，但**仍然计入配额**。

## 三、去哪里看自己的限额

![AI Studio 的 Rate Limit 页面：按模型列出 RPM、TPM、RPD 的峰值用量和上限，下方是按时间的用量曲线（2025 年 10 月的早期界面，图中数字是当时某付费项目的示例）](seed:g450-rate-limit-page.jpg)
*图片来源：[Google 官方博客《Leveling up your developer experience in Google AI Studio》](https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/)*

1. 打开 Google AI Studio，进入 Dashboard。
2. 打开 **Rate Limit** 页面（官方文档给的直达地址是 aistudio.google.com/rate-limit），选择项目和时间范围。
3. 表格里每个模型一行，能看到 RPM、TPM、RPD 的当前上限和近期峰值用量。
4. 项目处在哪个档位，可以在 **Projects** 页面（aistudio.google.com/projects）查看；用量明细在 Dashboard 的 **Usage** 页面。

如果页面打不开或没有数据，官方排错页列出了所需权限：查看用量面板需要 `monitoring.timeSeries.list`，查看速率限制面板还需要 `cloudquotas.quotas.get`。

## 四、使用档位（Usage tiers）与升档

限额跟项目的使用档位挂钩。官方 Rate limits 页的档位表（金额为美元，原样引用）：

| 档位 | 资格 | 按 10 分钟计的支出速率上限 |
| --- | --- | --- |
| Free | 有效的项目或免费试用 | 不适用 |
| Tier 1 | 设置并关联一个有效的结算账号 | 10 美元 |
| Tier 2 | 累计支付满 100 美元，且距首次成功付款满 3 天 | 50 美元 |
| Tier 3 | 累计支付满 1,000 美元，且距首次成功付款满 30 天 | 200 美元 |

- Tier 2、Tier 3 的「累计支付」按该结算账号在 **Google Cloud 所有服务**上的总消费计算，不只是 Gemini API。
- 达到条件后**自动升档**：从 Free 到 Tier 1 通常立即生效，之后的升档一般在 10 分钟内生效。官方同时说明，极少数情况下升档可能因审核中发现的其他因素被拒。
- 「支出速率上限」是付费层额外的一道保护：在滚动的 10 分钟窗口内花费过快，也会返回 429。
- 付费层觉得限额不够，可以在 Rate limits 页面底部找到「申请提高付费层限额」的表单，官方不保证批准。
- 每个档位还有每月的账单上限，见本站《Gemini API 怎么收费：按 token 计费、预付费充值（Prepay）与支出上限设置》。

## 五、免费层和付费层的其他差别

| | 免费层 | 付费层 |
| --- | --- | --- |
| 内容是否用于改进 Google 产品 | 是，人工审核员可能读到 | 否 |
| Interactions API 交互记录保留 | 1 天 | 55 天（可在 AI Studio 调短） |
| Batch API | 不提供 | 提供 |
| 可用模型 | 部分 | 更多，含 Gemini 3.1 Pro Preview 和图片、视频模型 |

数据使用是最需要注意的一条。官方服务条款写明：使用免费服务（包括 AI Studio 里的直接对话和 Gemini API 的免费额度）时，Google 会用你提交的内容和生成的回复来提供、改进和开发产品及机器学习技术；为了保证质量，人工审核员可能阅读、标注和处理这些输入输出（会先与你的账号、密钥和项目断开关联）。官方的提醒是：**不要向免费服务提交敏感、保密或个人信息**。付费服务则不会用你的提示和回复来改进产品。

条款里还有两条地区相关的规定：在欧洲经济区、瑞士和英国，免费服务也按付费服务的数据条款处理；面向这些地区的用户提供应用时，只能使用付费服务。

## 六、AI Studio 的额度和 API 额度不是一回事

- 官方定价页写明，在所有可用地区，AI Studio 网页本身免费使用。
- Google AI Pro / Ultra 订阅会提高你在 **AI Studio 网页里**的每日配额，官方写明这项权益只在 AI Studio 界面内有效，**不适用于用 API 密钥直接调用 Gemini API**；后者按 API 的档位另算。
- AI Studio 里订阅配额用完后，官方的说法是可以改用已开通结算的 API 密钥继续，按请求付费。

## 常见问题

**Q：免费额度到底每天多少次？**
官方文档现在不给统一数字，各模型、各账号可能不同，而且会调整。唯一可靠的来源是你自己 AI Studio 里的 Rate Limit 页面。

**Q：免费额度什么时候重置？**
每天请求数（RPD）在太平洋时间午夜重置。每分钟类的限额（RPM、TPM）按分钟计算，过了这一分钟就可以继续发。

**Q：多建几个密钥，额度会翻倍吗？**
不会。限额按项目计算，同一项目下的所有密钥共用。

**Q：开通付费后还能退回免费层吗？**
可以。官方说明把项目和结算账号解除关联（停用项目的结算）后，项目回到免费层。

**Q：超了限额会怎样？**
返回 429 错误。处理方法见本站《Gemini API 429 错误怎么解决：RESOURCE_EXHAUSTED 的原因与 400 / 403 / 503 排查表》。

## 参考资料

- Rate limits（官方）：https://ai.google.dev/gemini-api/docs/rate-limits
- Billing（官方）：https://ai.google.dev/gemini-api/docs/billing
- Gemini Developer API pricing（官方）：https://ai.google.dev/gemini-api/docs/pricing
- Gemini API Additional Terms of Service（官方）：https://ai.google.dev/gemini-api/terms
- Interactions API（官方）：https://ai.google.dev/gemini-api/docs/interactions-overview
- Google AI Plans（官方）：https://ai.google.dev/gemini-api/docs/google-ai-plans
- Models（官方）：https://ai.google.dev/gemini-api/docs/models
- API errors（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/api-errors
- Troubleshoot Google AI Studio（官方）：https://ai.google.dev/gemini-api/docs/troubleshoot-ai-studio
- Leveling up your developer experience in Google AI Studio（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/ai-studio-updates-more-control/

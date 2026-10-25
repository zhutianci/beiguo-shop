---
title: Gemini 4 Argon 是什么：发布时间、谁能用、API 怎么调用、价格多少
slug: gemini-4-argon-what-is-release-date
products: [gemini]
models: []
accountTier: PRO
excerpt: Gemini 4 / Argon 是什么？官方 2026-09-30 公布 Gemini 4 Argon，10-13 进入 Gemini 应用（Pro、Ultra 订阅）；API 模型代码 gemini-4-argon，引入价到 11 月 30 日为输入 2 美元、输出 10 美元每百万 tokens。
checkedOn: 2026-10-25
sources:
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
  - https://gemini.google/release-notes/
  - https://ai.google.dev/gemini-api/docs/models/gemini-4-argon
  - https://ai.google.dev/gemini-api/docs/latest-model
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://gemini.google/subscriptions/
verify:
  - 官方博客写 Argon 公布时先向「受信任的网络防御者」开放，并说明采用分阶段方式、会尽快向开发者、企业和普通用户开放；各阶段的具体日期以官方公告为准
  - 官方更新记录 2026-10-13：Argon 在 Gemini 应用中面向 Google AI Pro 和 Ultra 订阅用户全球推出；Google AI Plus 和免费版官方订阅页没有列 Argon
  - 价格取自官方定价页：引入价到 2026-11-30，之后输入 4 美元、输出 20 美元（每百万 tokens）；缓存价同样分阶段；官方定价页显示 Argon 没有免费层
  - 博客里的测评分数（如 DeepSWE v1.1 77.9%）是 Google 自己公布的，本文不转述，更不做对比结论
  - 官方文档说 Gemini CLI 没有针对 Argon 优化，要用 Argon 请用 Antigravity；本文只转述这条提示
  - 「Gemini 4」目前官方模型列表里只有 Gemini 4 Argon 一个型号；日期与型号会变，以官方页面为准
  - 本站 937 号文章已讲 Gemini 3.5 Pro 的官方说法，本文聚焦 Argon 本身
---

> 本文根据 Google 官方博客、Gemini 应用更新记录、Gemini API 模型文档和定价页整理，资料核对于 2026-10-25，价格为「2026-10 查询」。模型与价格会变，**以官方页面为准**。图为本站整理的示意图。Gemini 3.5 Pro 为什么没发布，见 [/guides/gemini-35-pro-status-what-to-use](/guides/gemini-35-pro-status-what-to-use)。

## 适用于谁

- 搜「gemini 4 argon」「gemini 4 release date」的人；
- 想知道 Argon 是不是 Gemini 4、什么时候发布、谁能用的人；
- 想在 API 里调用 Argon、问价格的开发者。

## 结论先说

1. **Gemini 4 Argon 是官方目前唯一的 Gemini 4 型号**，被称为「旗舰推理模型」，用于复杂软件工程、深度数学与科学问题、自主多步骤智能体，以及最长约 100 万 tokens 的长输出。
2. **时间线**：2026-09-30 官方博客公布；先向受信任的网络防御者开放；2026-10-13 进入 Gemini 应用，面向 Google AI Pro 和 Ultra 订阅用户。
3. **谁能在 Gemini 应用里用**：官方订阅页写 Pro 有 Argon 访问，Ultra 是最高额度。订阅差别见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)，需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。
4. **API 怎么调**：模型代码 `gemini-4-argon`，只有付费层，没有免费层。
5. **价格有「引入价」**：到 2026-11-30 为输入 2 美元、输出 10 美元（每百万 tokens）；2026-12-01 起变为 4 美元和 20 美元。

![Gemini 4 Argon 的官方时间线](seed:g1086-gemini4-argon-timeline.png)
*图：本站根据 [Google 官方博客](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/)、[Gemini 更新记录](https://gemini.google/release-notes/) 与 [API 文档](https://ai.google.dev/gemini-api/docs/latest-model) 整理的示意图*

## 一、官方怎么介绍 Argon

官方博客的核心说法：

- **定位**：为长流程、复杂工作设计，覆盖真实软件工程、法律和金融等企业知识工作，以及网络安全防御；
- **输出上限**：从此前的 6.4 万 tokens 扩大到 100 万 tokens；官方 API 文档称之为「长输出（long decode）」，输入、思考和输出共用 1,048,576 tokens 的窗口；
- **分阶段开放**：官方说发布这种级别的能力需要分阶段进行，会先让受信任的测试者反馈，再向开发者、企业和普通用户开放，最先面向付费 API 客户和 Google AI Ultra 订阅用户；
- **安全措施**：博客列出了防滥用、防提示词注入、监控偏离目标行为、加固系统等措施。

官方 2026-10-13 的 Gemini 应用更新记录说：Argon 从当天起在 Gemini 应用中向 Google AI Pro 和 Ultra 订阅用户全球推出，适合分析复杂财务报告、从零散资料做演示文稿、做交互式 3D 模型等任务。同一天的更新还有 Gemini macOS 应用内置 Google Antigravity，以及新的「Customize」入口。

## 二、API 规格与价格

![Gemini 4 Argon 与 3.8 Flash 的规格和价格对比](seed:g1086-gemini4-argon-vs-flash.png)
*图：本站根据 [Argon 模型页](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon) 与 [定价页](https://ai.google.dev/gemini-api/docs/pricing) 整理的示意图*

官方模型页：

| 项目 | 内容 |
| --- | --- |
| 模型代码 | `gemini-4-argon` |
| 输入 | 文本、图片、视频、音频、PDF |
| 输出 | 文本 |
| 上下文窗口 | 1,048,576 tokens，输入与输出共用 |
| 最大输出 | 默认同步 65,536；开启长输出最多约 1,048,576 |
| 默认思考等级 | `medium` |
| 缓存 | 仅隐式缓存，不支持显式缓存 |
| 其他 | 支持批量、Flex、Priority 推理；支持代码执行；智能体视频理解已正式可用 |

官方的最小调用示例用的是 Interactions API：`client.interactions.create(model="gemini-4-argon", input="...")`。要让单次回答超过 6.4 万 tokens，官方要求用后台执行（`background=True`），并把 `max_output_tokens` 设得比 65,536 大；服务器分多段续写，最后要把各段 `model_output` 的文本拼起来。

价格（官方定价页，标准档，每百万 tokens，美元）：

| 项目 | 到 2026-11-30 | 从 2026-12-01 |
| --- | --- | --- |
| 输入 | 2.00 | 4.00 |
| 输出（含思考 tokens） | 10.00 | 20.00 |
| 缓存输入 | 0.10 | 0.20 |

另外，Argon 在定价页的「免费层」一栏写「Not available」。批量、Flex、Priority 档的价格在同一页面，Google 搜索 grounding 每月有 5,000 次免费请求，超出每 1,000 次 14 美元。更多价格见 Gemini API 官方定价页，已有的免费额度与计费文章见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits) 和 [/guides/gemini-api-billing-prepay](/guides/gemini-api-billing-prepay)。

## 三、几个容易混的点

- **Argon 不是 3.5 Pro**：官方没有宣布 3.5 Pro 已发布，见开头链接的文章。
- **应用里的名字**：官方帮助中心把应用内模型档位写成 Flash-Lite、Flash、Pro、Argon，具体能选哪些取决于套餐。
- **Gemini CLI 用不了 Argon**：官方 Gemini CLI 文档提示，Gemini CLI 没有针对 Argon 优化，要用 Argon 请使用 Antigravity。
- **和别家模型比**：官方发布的测评分数是 Google 自己的口径，本文不做强弱结论。

## 常见问题

**Q：免费用户能用 Argon 吗？**
官方订阅页的免费版只写 Flash-Lite 模型；API 免费层也没有 Argon。

**Q：Argon 能生成图片、视频吗？**
官方模型页写输出只有文本。图片、视频用别的模型：图片见 [/guides/gemini-image-limits](/guides/gemini-image-limits)，视频见 [/guides/gemini-video-generation](/guides/gemini-video-generation)。

**Q：引入价过期后会涨多少？**
官方定价页写明 2026-12-01 起输入 4 美元、输出 20 美元，是引入价的两倍。

## 参考资料

- Google 官方博客：Gemini 4 Argon — https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/
- Gemini 官方：应用更新记录 — https://gemini.google/release-notes/
- Gemini API：Gemini 4 Argon 模型页 — https://ai.google.dev/gemini-api/docs/models/gemini-4-argon
- Gemini API：最新模型 — https://ai.google.dev/gemini-api/docs/latest-model
- Gemini API：定价 — https://ai.google.dev/gemini-api/docs/pricing
- Gemini 官方：订阅 — https://gemini.google/subscriptions/

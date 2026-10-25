---
title: Gemini API 价格：各模型每百万 tokens 多少钱、免费层和付费层差在哪、引入价什么时候结束
slug: gemini-api-price-official
products: [gemini]
models: []
accountTier: OTHER
excerpt: Gemini API 价格是多少？按官方定价页：Gemini 4 Argon 引入价输入 2 美元、输出 10 美元（到 11 月 30 日）；3.8 Flash 输入 0.75、输出 3.75；3.5 Flash-Lite 输入 0.30、输出 2.50，每百万 tokens。附免费层区别（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://ai.google.dev/gemini-api/docs/models
  - https://ai.google.dev/gemini-api/docs/latest-model
  - https://ai.google.dev/gemini-api/docs/billing
verify:
  - 价格取自 ai.google.dev/gemini-api/docs/pricing 当次页面（页面更新于 2026-10-22 UTC），单位美元每百万 tokens，只列「标准」档的付费层价格；批量、Flex、优先档的价格在同一页面的其他标签里，本文不逐项列
  - 页面把各模型的价格表放在模型名下，文本抓取时部分模型名丢失，本文按页面导航顺序和模型简介把价格表对应到模型；若与你在官方页面看到的不符，请以官方页面为准
  - Argon 的引入价到 2026-11-30，之后输入 4 美元、输出 20 美元；3.8 Flash 与 3.6 Flash 等的现价写明到 2026-12-31，之后（2027-01-01 起）输入 1.50、输出 7.50；本文只写已标注日期的价格
  - 3.1 Pro 预览版和 2.5 Pro 的价格按提示词是否超过 20 万 tokens 分档，本文只写 20 万 tokens 以内的价格，超出的见官方页面
  - 免费层「用于改进产品」「付费层不用于改进产品」取自定价页每个模型表中的「Used to improve our products」一行，各模型不尽相同，请以具体模型表为准
  - 官方说明 Google AI Studio 在所有可用地区免费使用；API 的限额与计费详情见官方 Billing 页，本站已有免费额度与预付费文章
  - 图片、视频、语音、音乐、嵌入模型和工具（如 Google 搜索 grounding）也有单独定价，本文不展开
---

> 本文根据 Gemini API 官方定价页、模型页和最新模型页整理，资料核对于 2026-10-25，价格为「2026-10 查询」。**价格以官方定价页为准**；部分价格带有结束日期。图为本站整理的示意图。

## 适用于谁

- 搜「gemini api price」「gemini api 价格」的人；
- 想比较 Gemini 各模型成本、选便宜够用模型的开发者；
- 想知道免费层能用哪些模型的人。

## 结论先说

1. **按 tokens 计费**：官方定价页的单位是美元每百万 tokens，输出价包含思考 tokens。
2. **最便宜的文本模型**：Gemini 3.1 Flash-Lite 输入 0.25 美元、输出 1.50 美元；3.5 Flash-Lite 输入 0.30、输出 2.50；3.8 Flash 与 3.6 Flash 输入 0.75、输出 3.75（均为标准档，到 2026-12-31 的价格）。
3. **旗舰 Gemini 4 Argon**：引入价输入 2.00、输出 10.00，到 2026-11-30；2026-12-01 起输入 4.00、输出 20.00；没有免费层。Argon 的介绍见 [/guides/gemini-4-argon-what-is-release-date](/guides/gemini-4-argon-what-is-release-date)。
4. **免费层**：官方说「限量访问部分模型，输入输出 tokens 免费」，AI Studio 免费；但 Argon 和 3.1 Pro 预览版在免费层「不可用」。
5. **想省钱**：官方写付费层的 Batch API 可降低 50% 成本。Key 怎么拿见 [/guides/gemini-api-key](/guides/gemini-api-key)，限额见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits)，充值与支出上限见 [/guides/gemini-api-billing-prepay](/guides/gemini-api-billing-prepay)。

![Gemini API 主要文本模型价格（标准档）](seed:g1092-gemini-api-price-table.png)
*图：本站根据 [Gemini API 官方定价页](https://ai.google.dev/gemini-api/docs/pricing) 整理的示意图，单位美元 / 每百万 tokens*

## 一、主要文本模型价格（标准档，付费层）

| 模型 | 输入 | 输出（含思考） | 说明 |
| --- | --- | --- | --- |
| Gemini 4 Argon | 2.00 | 10.00 | 引入价到 2026-11-30，之后 4.00 / 20.00；无免费层 |
| Gemini 3.8 Flash | 0.75 | 3.75 | 到 2026-12-31，之后 1.50 / 7.50；有免费层 |
| Gemini 3.6 Flash | 0.75 | 3.75 | 同上，官方称其为上一代 Flash |
| Gemini 3.5 Flash-Lite | 0.30 | 2.50 | 面向大批量智能体任务、翻译、简单数据处理；有免费层 |
| Gemini 3.1 Flash-Lite | 0.25 | 1.50 | 文本、图片、视频输入价；音频 0.50；有免费层 |
| Gemini 3.1 Pro 预览版 | 2.00 | 12.00 | 提示词 20 万 tokens 以内；超过为 4.00 / 18.00；无免费层 |
| Gemini 3 Flash 预览版 | 0.50 | 3.00 | 官方称为旧版 Flash；有免费层 |
| Gemini 2.5 Pro | 1.25 | 10.00 | 20 万 tokens 以内；超过为 2.50 / 15.00；有免费层 |
| Gemini 2.5 Flash | 0.30 | 2.50 | 音频输入 1.00；有免费层 |

官方把 Argon 称为旗舰推理模型，用于复杂软件工程、深度数学与科学问题、自主智能体和长输出；把 3.8 Flash 称为「最智能的 Flash 模型」，适合长流程软件工程、自主智能体和复杂企业工作流。缓存、批量、Flex 和优先档价格见官方页面。哪些模型已经下线（标注 Shut down），见官方模型页，例如 2.0 Flash 已下线。

## 二、免费层和付费层

![Gemini API 免费层还是付费层怎么选](seed:g1092-gemini-api-free-or-paid.png)
*图：本站根据 [Gemini API 官方定价页](https://ai.google.dev/gemini-api/docs/pricing) 整理的示意图*

官方定价页对三种层级的描述：

| 层级 | 官方写的内容 |
| --- | --- |
| Free | 限量访问部分模型；免费的输入和输出 tokens；Google AI Studio 访问；内容可能被用于改进产品 |
| Paid | 更高速率限制；可用上下文缓存；Batch API（成本降低 50%）；可用 Google 最先进模型；内容不用于改进产品 |
| Enterprise | Paid 的全部功能，加专属支持、高级安全与合规、预置吞吐、按用量折扣、MLOps 等，通过 Gemini Enterprise Agent Platform |

另外：

- **Google 搜索 grounding**：Argon、3.8 Flash 等 Gemini 3 及以上模型共享每月 5,000 次免费搜索请求，超出每 1000 次 14 美元；
- **Google AI Studio 本身免费**：官方说在所有可用地区免费使用；
- **价格因平台不同**：官方提醒，Gemini Enterprise Agent Platform 上的价格可能与这里的不同；
- **文档（PDF）计费**：按图片 token 价计算。

## 三、怎么控制成本

1. **先用便宜模型试**：简单分类、翻译、数据处理先从 Flash-Lite 级别试；
2. **能异步就用 Batch**：官方写 Batch API 成本降低 50%，通常不要求实时返回；
3. **设支出上限**：见 [/guides/gemini-api-billing-prepay](/guides/gemini-api-billing-prepay)；
4. **注意提示词长度分档**：3.1 Pro、2.5 Pro 的价格以提示词是否超过 20 万 tokens 分档；
5. **关注结束日期**：Argon 的引入价到 11 月 30 日，之后涨一倍。

## 常见问题

**Q：Gemini 订阅（Google AI Pro）和 API 是一回事吗？**
不是。订阅是给 Gemini 应用等产品的，API 单独按 tokens 计费，见 [/guides/gemini-ultra-vs-pro-difference](/guides/gemini-ultra-vs-pro-difference)；需要谷歌账号相关服务可看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

**Q：429 报错怎么办？**
见 [/guides/gemini-api-429-resource-exhausted](/guides/gemini-api-429-resource-exhausted)。

**Q：怎么用 OpenAI 的库调 Gemini？**
见 [/guides/gemini-api-base-url-openai-compatible](/guides/gemini-api-base-url-openai-compatible)。

**Q：其他家 API 价格呢？**
五家官方价格放在一起的速查见 [/guides/llm-api-price-comparison-official](/guides/llm-api-price-comparison-official)。

## 参考资料

- Gemini API：定价 — https://ai.google.dev/gemini-api/docs/pricing
- Gemini API：模型 — https://ai.google.dev/gemini-api/docs/models
- Gemini API：最新模型 — https://ai.google.dev/gemini-api/docs/latest-model
- Gemini API：计费说明 — https://ai.google.dev/gemini-api/docs/billing

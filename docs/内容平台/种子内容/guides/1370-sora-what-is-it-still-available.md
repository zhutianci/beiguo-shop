---
title: Sora 是什么、现在还能用吗：从 OpenAI 的视频生成产品到 2026 年的停用，想做 AI 视频怎么办
slug: sora-what-is-it-still-available
products: [chatgpt]
models: [sora]
accountTier: OTHER
excerpt: Sora 是 OpenAI 推出的视频生成产品。按官方帮助中心，网页和 App 已于 2026-04-26 停用，API 已于 2026-09-24 停用，现在不能再用它生成视频。本文把停用时间线讲清楚，并告诉你想做 AI 视频时去哪里看官方工具。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
  - https://openai.com/index/sora/
  - https://openai.com/index/sora-2/
  - https://developers.openai.com/api/docs/deprecations
verify:
  - 官方帮助中心的停用说明没有介绍 Sora 的功能细节；「Sora 是 OpenAI 的视频生成产品」依据的是 OpenAI 官方的 Sora 产品页标题（Creating video from text）
  - 停用日期来自官方帮助中心与 API 弃用页；官方没有说 Sora 是否会以其他形式回归，本文不作猜测
  - 官方文章没有提到替代产品，本文只指向本站按官方说明整理的其他视频工具文章
---

> 本文根据 OpenAI 帮助中心的 Sora 停用说明、OpenAI 官方 Sora 页面和 API 弃用页面整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 听说过 Sora，想知道它是什么的人；
- 想知道「Sora 现在还能不能用」的人；
- 想做 AI 视频，不知道现在该用什么的人。

## 结论先说

1. **Sora 是 OpenAI 推出的视频生成产品**，官方产品页的标题就是「Creating video from text」，即根据文字生成视频。
2. **现在不能再用它生成视频了。** 网页和 App 于 2026-04-26 停用；API 于 2026-09-24 停用。
3. **只剩一件事可以做：导出自己以前的内容。** 入口是 sora.chatgpt.com/sunset，细节见 [/guides/sora-official-website-status-export](/guides/sora-official-website-status-export)。
4. 官方说，过了最终导出期后会**永久删除**与你使用 Sora 相关的数据，建议尽快导出。
5. 想做 AI 视频，要换别的工具，本站按官方说明整理了对比，见下文。

![Sora 的停用时间线](seed:g1370-timeline-compare.png)
*图：本站根据 [OpenAI 帮助中心：Sora 停用说明](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) 与 [API 弃用页面](https://developers.openai.com/api/docs/deprecations) 整理的示意图*

## 一、Sora 是什么

OpenAI 官方的 Sora 页面把它描述为从文字生成视频的产品；后来推出的 Sora 2，在官方页面上以「Sora 2 is here」介绍。具体的画质、时长、功能，官方帮助中心的停用说明没有展开，而产品已经停用，所以本文**不再介绍功能细节**，也不转述网上流传的参数。

需要注意：同名搜索结果里，有大量发布于停用前的介绍、教程、提示词。其中的**入口、价格、额度**现在都不适用，别按它们操作。

## 二、停用时间线

- **2026-04-26：** 官方帮助中心写明「The Sora web and app experiences were discontinued on April 26, 2026」，Sora 网页和 App 停用；
- **2026-09-24：** 帮助中心写明 Sora API 已停用。API 弃用页对应的条目是「2026-03-24: Sora 2 video generation models and Videos API」，官方在 2026-03-24 通知了开发者，模型别名在 2026-09-24 移除，替代一栏没有填写。开发者向的说明见 [/guides/sora-api-discontinued-videos-api](/guides/sora-api-discontinued-videos-api)；
- **数据：** 官方说，停用并过了最终导出窗口之后，会永久删除与你使用 Sora 相关的数据；是否会提供最终导出窗口、什么时候开，官方说会邮件通知，**没有写固定日期**。

## 三、想做 AI 视频，现在去哪里

官方的 Sora 说明里没有提到替代产品，所以这里不替 OpenAI 推荐什么。本站按各家官方说明整理了几篇文章，可以根据你的情况选：

![想做 AI 视频，可以怎么办](seed:g1370-alt-decide.png)
*图：本站根据 [OpenAI 帮助中心：Sora 停用说明](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) 整理的示意图*

- **想比较有哪些官方视频工具：** [/guides/ai-video-tools-which-to-choose](/guides/ai-video-tools-which-to-choose)，按官方说明对比了 Gemini（Omni、Veo、Flow）和 Grok Imagine；
- **想在 ChatGPT 里生成或上传视频：** [/guides/chatgpt-video-generate-upload](/guides/chatgpt-video-generate-upload)，说明 Sora 停用后 ChatGPT 的现状；
- **想看 Gemini 的视频功能：** [/guides/gemini-video-generation](/guides/gemini-video-generation)。

## 四、别被这些说法带偏

- 「Sora 免费无限用」：官方已停用，这类说法无法成立；
- 「Sora 中文版 / 镜像站」：官方没有这些版本，见 [/guides/sora-official-website-status-export](/guides/sora-official-website-status-export) 里怎么识别；
- 「花钱买 Sora 账号」：本站不涉及账号买卖，也不建议这样做，官方已经停用服务，任何售卖都不成立。

## 常见问题

**Q：我以前的 Sora 会员怎么处理？**
官方停用说明没有讨论订阅和退款，请联系官方帮助中心。ChatGPT 套餐相关问题见 [/guides/chatgpt-monthly-price-official-plans](/guides/chatgpt-monthly-price-official-plans)。

**Q：ChatGPT Plus 里还有视频功能吗？**
请看 [/guides/chatgpt-video-generate-upload](/guides/chatgpt-video-generate-upload)，以官方当前页面为准；套餐开通入口 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：What to know about the Sora discontinuation — https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- OpenAI：Sora — https://openai.com/index/sora/
- OpenAI：Sora 2 — https://openai.com/index/sora-2/
- OpenAI API 弃用页面 — https://developers.openai.com/api/docs/deprecations

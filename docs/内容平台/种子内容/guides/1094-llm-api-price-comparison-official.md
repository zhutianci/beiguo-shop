---
title: AI 大模型 API 价格对比：OpenAI、Anthropic、Google、xAI、DeepSeek 官方价格页速查
slug: llm-api-price-comparison-official
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: 大模型 API 价格怎么比？取自五家官方价格页（2026-10 查询）：OpenAI gpt-6.1-sol 2/10 美元，Claude Sonnet 5.5 2/10，Gemini 3.8 Flash 0.75/3.75，grok-4.7 2/6，DeepSeek flash 0.3/1.2（每百万）。
checkedOn: 2026-10-25
sources:
  - https://platform.openai.com/docs/pricing
  - https://docs.claude.com/en/docs/about-claude/pricing
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://docs.x.ai/developers/pricing
  - https://api-docs.deepseek.com/quick_start/pricing
verify:
  - 全部价格取自五家官方价格页当次内容：OpenAI（页面发布 2026-10-24）、Anthropic、Google（页面更新 2026-10-22）、xAI、DeepSeek（页面发布 2026-10-19），单位美元每百万 tokens；各家价格会调整，请以官方页面为准
  - 各家的档位并不是同级对应：「旗舰、主力、轻量」是本站按官方模型简介做的粗分，模型能力没有可比的官方口径，本文不做性价比结论
  - OpenAI 价格表另有长上下文价、缓存写入价等列，Anthropic 的 Haiku 5.5 按提示词是否超过 10 万 tokens 分两档，Google 的 3.1 Pro 与 2.5 Pro 按是否超过 20 万 tokens 分档，xAI 的 grok-4.7 按 20 万 tokens 分档；本文只列短上下文的标准价
  - DeepSeek 价格分高峰和低谷：官方写低谷价是高峰价的一半，高峰时段为周一至周五 UTC 01:00 到 04:00 和 06:00 到 10:00（中国法定节假日除外）；本文列的是高峰价，缓存未命中的输入价
  - Google Gemini 4 Argon 的 2 美元与 10 美元是引入价，到 2026-11-30，之后是 4 美元与 20 美元；3.8 Flash 的价格标注到 2026-12-31
  - OpenAI 价格表里的模型名取自官方 .md 版价格页；Anthropic 价格页的部分行在文本抓取中缺失字段，本文只引完整的几行；以官方页面为准
  - 本文不涉及任何 API 中转、转售或第三方折扣渠道，也不涉及 API Key 的购买
---

> 本文把五家官方价格页放在一起速查，资料核对于 2026-10-25，价格为「2026-10 查询」。**价格以官方页面为准**，各家都会调整。本文只摆价格，不做「哪家更值」的结论。图为本站整理的示意图。

## 适用于谁

- 搜「大模型 api 价格对比」「ai api 价格」的人；
- 要选模型做产品、做批量处理的开发者；
- 想知道「主力模型」大概花多少钱的人。

## 结论先说

1. **单位统一**：以下都是美元每百万 tokens，输入和输出分开计价。
2. **主力档价格集中在输入 0.75 到 2 美元、输出 3.75 到 10 美元**：OpenAI gpt-6.1-sol 2 / 10；Claude Sonnet 5.5 2 / 10；Gemini 3.8 Flash 0.75 / 3.75；xAI grok-4.7 2 / 6；DeepSeek flash 高峰 0.30 / 1.20。
3. **旗舰档差距更大**：OpenAI gpt-6-astra 10 / 50；Claude Fable 5.1 10 / 50；Gemini 4 Argon 引入价 2 / 10；DeepSeek v4-pro 高峰 1.32 / 3.96。
4. **轻量档最便宜**：OpenAI gpt-6-luna 0.10 / 0.50；Claude Haiku 5.5 0.10 / 0.50（10 万 tokens 以内）；Gemini 3.1 Flash-Lite 0.25 / 1.50。
5. **有限时价和时段价**：Argon 引入价到 11 月 30 日；DeepSeek 低谷是高峰的一半。

![五家 API 的价格速查](seed:g1094-llm-api-price-five-vendors.png)
*图：本站根据 [OpenAI](https://platform.openai.com/docs/pricing)、[Anthropic](https://docs.claude.com/en/docs/about-claude/pricing)、[Google](https://ai.google.dev/gemini-api/docs/pricing)、[xAI](https://docs.x.ai/developers/pricing)、[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) 官方价格页整理的示意图，美元每百万 tokens，档位并非同级对应*

## 一、各家价格表（标准价，短上下文）

### OpenAI

| 模型 | 输入 | 输出 | 缓存输入 |
| --- | --- | --- | --- |
| gpt-6-astra | 10.00 | 50.00 | 1.00 |
| gpt-6.1-sol | 2.00 | 10.00 | 0.10 |
| gpt-6-sol | 2.00 | 10.00 | 0.20 |
| gpt-6-luna | 0.10 | 0.50 | 0.01 |

### Anthropic（Claude）

| 模型 | 输入 | 输出 | 官方简介 |
| --- | --- | --- | --- |
| Claude Fable 5.1 | 10 | 50 | 面向要求很高的推理和长流程智能体任务 |
| Claude Opus 5.5 | 4 | 20 | 长时间运行的智能体式编程与知识工作 |
| Claude Sonnet 5.5 | 2 | 10 | 速度和智能的最佳组合 |
| Claude Haiku 5.5 | 0.10（10 万 tokens 以内） | 0.50 | 大批量、低延迟任务，如分类、提取、路由 |

Haiku 5.5 的提示词超过 10 万 tokens 时，输入 0.50、输出 2.50。

### Google（Gemini）

| 模型 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| Gemini 4 Argon | 2.00 | 10.00 | 引入价到 2026-11-30，之后 4.00 / 20.00；无免费层 |
| Gemini 3.8 Flash | 0.75 | 3.75 | 到 2026-12-31；有免费层 |
| Gemini 3.1 Flash-Lite | 0.25 | 1.50 | 有免费层 |

更多模型见 [/guides/gemini-api-price-official](/guides/gemini-api-price-official)。

### xAI（Grok）

| 模型 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- |
| grok-4.7 | 2.00 | 6.00 | 提示词 20 万 tokens 以上整条请求按 4.00 / 12.00 |
| grok-4.3 | 1.25 | 2.50 | 上下文 1M |
| grok-build-0.1 | 1.00 | 2.00 | 编程模型，256k 上下文 |

细节见 [/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)。

### DeepSeek

| 模型 | 高峰输入（缓存未命中） | 高峰输出 | 低谷输入 / 输出 |
| --- | --- | --- | --- |
| deepseek-flash | 0.30 | 1.20 | 0.15 / 0.60 |
| deepseek-v4-pro | 1.32 | 3.96 | 0.66 / 1.98 |

官方说低谷价是高峰价的一半，高峰时段为周一到周五 UTC 01:00 到 04:00 和 06:00 到 10:00（中国法定节假日除外）。DeepSeek 的价格变化见 [/guides/deepseek-price-changes-timeline](/guides/deepseek-price-changes-timeline)，开放平台充值见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

## 二、比价时别漏看的

![比 API 价格时容易漏看的 6 项](seed:g1094-api-price-read-checklist.png)
*图：本站根据各家官方价格页整理的示意图*

- **长上下文加价**：各家阈值不同（Anthropic 的 Haiku 10 万 tokens、Google 和 xAI 20 万 tokens），超过后整条请求按高价算；
- **缓存价**：命中缓存的输入价格低得多，写入缓存另有价格，具体见各家价格表；
- **工具按次收费**：例如 xAI 的 Web Search 官方标价每 1000 次调用 5 美元，Google 搜索 grounding 每月 5,000 次免费后每 1000 次 14 美元；
- **批量折扣**：Google 官方写 Batch API 降低 50% 成本，xAI 对 grok-4.7 等文本模型的批量折扣是 20%；
- **模型更新很快**：价格页里会标注已下线（Shut down）的模型，上线前再核对一遍。

## 三、怎么选（只给方向）

| 需求 | 方向 |
| --- | --- |
| 分类、提取、路由等大批量简单任务 | 轻量档：gpt-6-luna、Haiku 5.5、3.1 Flash-Lite、deepseek-flash |
| 通用对话与普通编程 | 主力档，价格区间见上文 |
| 最难的推理、长流程智能体 | 旗舰档，价格最高，用量大时先小样本测试成本 |
| 想先免费试 | Gemini API 有免费层（部分模型），见 [/guides/gemini-api-free-tier-rate-limits](/guides/gemini-api-free-tier-rate-limits)；其他家以官方为准 |

订阅和 API 是两回事：ChatGPT、Claude、Gemini、Grok 的会员选择见 [/guides/ai-subscription-which-to-choose-four-vendors](/guides/ai-subscription-which-to-choose-four-vendors)。需要 ChatGPT 或 Claude 会员可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 和 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 常见问题

**Q：为什么同样叫「输入 2 美元」，实际账单差很多？**
因为缓存、长上下文、思考 tokens、工具调用都会改变账单。官方价格表里的输出价通常包含思考 tokens。

**Q：能不能用中转或打折渠道？**
本文不涉及；官方价格页和官方控制台是唯一的依据。

**Q：国内模型 API 价格呢？**
本文只取了 DeepSeek 的官方价格页。其他模型请看各家官方文档。

## 参考资料

- OpenAI：API 价格 — https://platform.openai.com/docs/pricing
- Anthropic：Claude API 价格 — https://docs.claude.com/en/docs/about-claude/pricing
- Google：Gemini API 价格 — https://ai.google.dev/gemini-api/docs/pricing
- xAI：API 价格 — https://docs.x.ai/developers/pricing
- DeepSeek：模型与价格 — https://api-docs.deepseek.com/quick_start/pricing

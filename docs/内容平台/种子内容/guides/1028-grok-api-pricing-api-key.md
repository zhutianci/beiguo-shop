---
title: Grok API 价格与 API Key 怎么获取：控制台、计费、模型价格和速率档位
slug: grok-api-pricing-api-key
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok API 怎么收费、API Key 在哪拿？官方控制台是 console.x.ai，先充值再在 API Keys 页面生成。文本模型 grok-4.7 每百万 tokens 输入 2 美元、输出 6 美元（2026-10 查询），图片视频和工具另有标价，速率档位按累计消费自动升级。
checkedOn: 2026-10-25
sources:
  - https://docs.x.ai/developers/quickstart
  - https://docs.x.ai/developers/pricing
  - https://docs.x.ai/developers/models
  - https://docs.x.ai/developers/rate-limits
  - https://docs.x.ai/grok/faq
  - https://x.ai/pricing
verify:
  - 价格均取自 docs.x.ai/developers/pricing 当次页面（2026-10-25），单位美元；模型清单与价格更新很快，以官方页面为准
  - 官方 x.ai/pricing 的 FAQ 说，付费订阅包含 Grok API 访问，但 API 用量按标准模型价另行计费，不从订阅的用量池里扣；本文照此写，具体怎么「包含」官方没有展开
  - docs.x.ai 的 FAQ 写「API credits are non-refundable」，本文照引
  - 速率档位的消费门槛来自官方 Rate Limits 页面当次内容，会调整，本文只引档位门槛，不列每个模型的具体数字
  - 本文不涉及 API Key 的购买、转售、中转或共享，只写官方控制台自助获取的方式
---

> 本文根据 xAI 官方开发者文档（docs.x.ai）整理，资料核对于 2026-10-25，价格为「2026-10 查询」。价格和模型会变，**以官方 Pricing 页和控制台显示为准**。图为本站整理的示意图。

## 适用于谁

- 搜「grok api pricing」「grok api key 怎么获取」的人；
- 想在自己的程序、Cursor、Codex 里接 Grok 的开发者；
- 分不清「订阅 Grok」和「用 Grok API」有什么区别的人。

## 结论先说

1. **API Key 在官方控制台 console.x.ai 自助生成**：注册账号、充值 credits、在 API Keys 页面创建。官方明确写要先给账号充值才能开始用 API。
2. **API 单独计费**。官方定价页的 FAQ 说，付费订阅包含 Grok API 访问，但 API 用量按标准模型价另行计费，不会从订阅的周用量池里扣。订阅的价格和用量见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)。
3. **主力文本模型 grok-4.7**：上下文 500k，输入 2.00、缓存输入 0.50、输出 6.00（美元 / 每 100 万 tokens）；单次请求的提示词达到 200k tokens 及以上时，整条请求按长上下文价计：4.00 / 1.00 / 12.00。
4. **API 充值不可退**：官方 FAQ 写明 xAI API credits 不可退款，充值前想清楚额度。
5. **别把 Key 泄露出去**：官方示例把它放进环境变量 `XAI_API_KEY`，不要写进代码仓库。

![获取 Grok API Key 并发出第一个请求的 5 步](seed:g1028-grok-api-key-steps.png)
*图：本站根据 [docs.x.ai Quickstart](https://docs.x.ai/developers/quickstart) 整理的示意图*

## 一、API Key 怎么拿

官方快速入门的顺序：

1. **注册账号**：打开 console.x.ai 注册，然后给账号充值 credits；
2. **生成 Key**：在控制台的 API Keys 页面创建，然后导出为环境变量（`export XAI_API_KEY="你的 Key"`），或写进项目的 `.env` 文件；
3. **装 SDK**：官方给了几种写法，JavaScript 的 `ai` 加 `@ai-sdk/xai`，Python 或 JavaScript 的 `openai`，Python 的 `xai-sdk`；
4. **发第一个请求**：用 `openai` 库的话，`base_url` 填 `https://api.x.ai/v1`，模型写 `grok-4.7`，走 Responses 接口。

账号默认属于一个「Personal Team」。官方 FAQ 说，团队是 xAI 统计 API 用量、结账和开发票的单位：你可以重命名它，也可以新建团队、邀请成员；管理员能改账单信息和成员，成员不能。

## 二、价格：文本模型

![Grok 主要文本模型 API 价格对比](seed:g1028-grok-api-price-compare.png)
*图：本站根据 [docs.x.ai Pricing](https://docs.x.ai/developers/pricing) 整理的示意图，单位美元 / 每 100 万 tokens*

官方价格页的文本模型表（括号里是长上下文价，单位同上）：

| 模型 | 上下文 | 输入 | 缓存输入 | 输出 |
| --- | --- | --- | --- | --- |
| grok-4.7 | 500k | 2.00（4.00） | 0.50（1.00） | 6.00（12.00） |
| grok-build-0.1 | 256k | 1.00（2.00） | 0.20（0.40） | 2.00（4.00） |
| grok-4.6 | 500k | 2.00（4.00） | 0.50（1.00） | 6.00（12.00） |
| grok-4.3 | 1M | 1.25（2.50） | 0.20（0.40） | 2.50（5.00） |

官方把 grok-4.7 称为「代码和其他一切任务的旗舰模型」，支持智能体式工具调用，推理强度可配置（low、medium、high 默认、xhigh）。官方的选型建议是：音频、图片、视频用对应的专用模型，其余包括代码都用 grok-4.7。

### 几个会影响账单的项目

- **批量 API（Batch）**：grok-4.7 等文本模型有 20% 折扣，大多在 24 小时内完成；
- **优先处理（Priority）**：官方说按标准价的 2 倍计费，且只有响应里确认 `"service_tier": "priority"` 才按优先价收；
- **美国区域端点** `https://us.api.x.ai/v1`：按全球价的 1.1 倍计费，目前只有 grok-4.7 和 grok-4.6；
- **服务端工具**：Web Search、X Search、代码执行、文件附件检索等按调用次数另计，例如 Web Search 官方标价每 1000 次调用 5 美元；
- **违规请求**：即使请求被判定违反使用准则，已生成的部分仍然收费；在 Responses API 中生成前就被拦住的，每次收 0.05 美元违规费。

图片、视频、语音模型的单价见 [/guides/grok-imagine-video-15-image-20](/guides/grok-imagine-video-15-image-20)。

## 三、速率限制：按累计消费自动升档

官方 Rate Limits 页面写明：每个团队对每个模型有两个维度的限制，每秒请求数（RPS）和每分钟 tokens（TPM），超出会返回 429。档位由 **2026 年 1 月 1 日以来的累计 API 消费**决定，自动升级、永不降级：

| 档位 | 累计消费门槛 |
| --- | --- |
| Tier 0 | 0 美元（默认） |
| Tier 1 | 50 美元 |
| Tier 2 | 250 美元 |
| Tier 3 | 1000 美元 |
| Tier 4 | 5000 美元 |
| Enterprise | 联系销售 |

统计口径是通过预付 credits 或已结清发票收到的金额。你团队当前的具体限额，可以在控制台的 Models 页面看。

## 四、常见问题

**Q：订阅了 SuperGrok 或 The X Subscription，API 就免费了吗？**
不是。官方写的是订阅包含 API 访问权限，用量仍然按标准价单独计费、不占订阅用量池。

**Q：能不能在 Codex 或 Cursor 里用 Grok？**
可以，见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup)。

**Q：API 和 App 的每周用量是一回事吗？**
不是，周用量池见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)。

**Q：Grok 和 ChatGPT、Claude 的 API 价格怎么对比？**
五家官方价格放在一起的速查见 [/guides/llm-api-price-comparison-official](/guides/llm-api-price-comparison-official)。

## 参考资料

- docs.x.ai：Quickstart — https://docs.x.ai/developers/quickstart
- docs.x.ai：Pricing — https://docs.x.ai/developers/pricing
- docs.x.ai：Models — https://docs.x.ai/developers/models
- docs.x.ai：Rate Limits — https://docs.x.ai/developers/rate-limits
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- Grok 官方：Pricing — https://x.ai/pricing

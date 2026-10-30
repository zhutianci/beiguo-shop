---
title: OpenAI API 价格是多少：GPT-6 系列每百万 token 价格表（2026-10 查询），批处理、Fast 与长上下文怎么算
slug: openai-api-price-official-table
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: OpenAI API 按 token 计费。本文按官方价格页（2026-10 查询）列出 GPT-6 系列和几个常用旧型号的输入、缓存输入、输出价格，再讲批处理、Flex、Fast、Ultrafast 与超长上下文的计价差别，以及怎么估算一次调用要花多少。
checkedOn: 2026-10-30
sources:
  - https://developers.openai.com/api/docs/pricing
  - https://developers.openai.com/api/docs/deprecations
verify:
  - 价格全部取自 OpenAI 官方 API 价格页 2026-10-30 当天的写法，美元 / 每 100 万 token，标准档、输入不超过 272K 的短上下文价格；官方价格调整很频繁，下单前以官方页面为准
  - 价格页写明 GPT-5.6 Sol 的促销价格至少到 2026-11-21 可用，之后可能变化，本文表里的 gpt-5.6-sol 价格不作长期依据
  - 价格页写 Priority processing 于 2026-07-30 改名为 Fast mode；批处理和 Flex 的价格对本文列的模型相同，未列出的模型以官方页面为准
  - 本文不涉及人民币换算，汇率和支付渠道因人而异
---

> 本文根据 OpenAI 官方 API 价格页整理，**价格 2026-10 查询（2026-10-30）**，单位是美元 / 每 100 万 token。官方调整价格很频繁，表里的数字只是查询当天的快照，**付款前请以官方价格页为准**。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 搜「OpenAI API 价格」「OpenAI API price」，想先估一下成本的人；
- 在 GPT-6 系列几个型号之间犹豫的人；
- 想知道批处理、Fast、长上下文到底贵多少的人。

## 结论先说

1. **API 按 token 计费，分输入、缓存输入、输出三类价格**，输出比输入贵。ChatGPT 订阅和 API 是两套计费，互不包含，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。
2. **GPT-6 系列的标准价（2026-10 查询）：** gpt-6-astra 输入 $10、输出 $50；gpt-6.1-sol 输入 $2、输出 $10；gpt-6.1-terra 输入 $1、输出 $5；gpt-6-luna 输入 $0.10、输出 $0.50。
3. **不赶时间用批处理：** 价格页上多数列出的型号，批处理大约是标准价的一半。Flex 对表里这些型号和批处理价格一致。
4. **要更低延迟更贵：** Fast（原 Priority）以 gpt-6.1-sol 为例是标准价的两倍；Ultrafast 只有 gpt-6-astra 和 gpt-6.1-sol 提供。
5. **输入超过 272K 的长上下文价格更高**，区域或数据驻留端点另加 10%。
6. 价格页之外：余额、预付额度、怎么查用量见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

![OpenAI API 文本模型价格](seed:g1368-price-compare.png)
*图：本站根据 [OpenAI API 价格页](https://developers.openai.com/api/docs/pricing) 整理的示意图，2026-10 查询*

## 一、常用型号的标准价

下面的价格是标准档、输入不超过 272K 的短上下文价格（美元 / 100 万 token）：

| 型号 | 输入 | 缓存输入 | 输出 |
| --- | --- | --- | --- |
| gpt-6-astra | $10.00 | $1.00 | $50.00 |
| gpt-6.1-sol | $2.00 | $0.10 | $10.00 |
| gpt-6.1-terra | $1.00 | $0.05 | $5.00 |
| gpt-6-sol | $2.00 | $0.20 | $10.00 |
| gpt-6-luna | $0.10 | $0.01 | $0.50 |
| gpt-5.4-mini | $0.75 | $0.075 | $4.50 |
| gpt-5-mini | $0.25 | $0.025 | $2.00 |
| gpt-5-nano | $0.05 | $0.005 | $0.40 |

价格页同时还列了 gpt-5.6、gpt-5.5、gpt-5.4、gpt-5.2 等更早的型号；**这些型号能不能继续调用，要看官方弃用页**，见 [https://developers.openai.com/api/docs/deprecations](https://developers.openai.com/api/docs/deprecations)。价格页还写明，GPT-5.6 Sol 的促销价格至少到 2026-11-21 可用，之后可能变化。

## 二、几档处理方式差多少

![同一模型不同档位](seed:g1368-tier-compare.png)
*图：本站根据 [OpenAI API 价格页](https://developers.openai.com/api/docs/pricing) 整理的示意图，2026-10 查询*

- **批处理（Batch）：** 多数型号约为标准价的一半，例如 gpt-6.1-sol 输入 $1.00、缓存输入 $0.05、输出 $5.00，适合不要求实时返回的批量任务；
- **Flex：** 价格页列出的价格与批处理相同；
- **Fast（2026-07-30 起由 Priority 改名）：** 为了更低的延迟，价格更高，gpt-6.1-sol 是 $4.00 / $0.20 / $20.00；
- **Ultrafast：** 价格页只列了 gpt-6-astra 和 gpt-6.1-sol，gpt-6.1-sol 是 $12.00 / $0.60 / $60.00；
- **长上下文：** 输入超过 272K 时价格更高，例如 gpt-6.1-sol 输入 $4.00、输出 $15.00；
- **区域和数据驻留：** 区域端点和 FedRAMP 端点有 10% 的加价。

## 三、其他常见的计费项

- **生图（gpt-image-2）：** 价格页标准档图像输入 $8.00、图像输出 $30.00、缓存图像输入 $2.00，文字输入 $5.00、缓存文字 $1.25；批处理大约减半。缓存输入价只适用于通过 Responses API 生成的图像；
- **向量（embeddings）：** text-embedding-3-small 每 100 万 token $0.02，text-embedding-3-large $0.13，text-embedding-ada-002 $0.10。

## 四、怎么估算一次调用的成本

1. **数 token：** 以官方分词工具或接口返回的用量字段为准，不要自己估；
2. **分三类乘价格：** 输入 token 数 ×输入价，命中缓存的输入 ×缓存价，输出 token 数 ×输出价，再除以 100 万；
3. **例子：** 用 gpt-6.1-sol，输入 20 万 token、输出 2 万 token，标准价大约是 0.2 × $2 + 0.02 × $10 = $0.60（没有缓存命中时）。换成 gpt-6-luna 大约是 0.2 × $0.10 + 0.02 × $0.50 = $0.03。这只是用上表算术，实际账单以官方用量为准；
4. **注意：** 上面的算术只覆盖输入和输出；推理型号的思考部分是否另计、怎么计，以对应型号的官方文档和账单用量为准。

## 五、省钱的几个办法

- **能用小模型就别用大模型：** 按上表，Luna、Terra 的价格明显低于 Astra；
- **用批处理：** 不要求实时的任务，价格大约减半；
- **利用缓存：** 重复的长前缀（系统提示、固定资料）命中缓存，输入价明显更低；
- **别无谓拉长上下文：** 超过 272K 的输入价格更高。

## 常见问题

**Q：ChatGPT Plus 会员能抵扣 API 费用吗？**
不能，两者是两套计费。订阅看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，API 另付。

**Q：API 余额怎么充、怎么看？**
见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)；API Key 怎么建见 [/guides/openai-api-key](/guides/openai-api-key)。

**Q：API 429 报错是不是额度没了？**
见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

**Q：需要发票怎么办？**
见 [/guides/openai-invoice-chatgpt-vs-api](/guides/openai-invoice-chatgpt-vs-api)。

## 参考资料

- OpenAI API 价格页 — https://developers.openai.com/api/docs/pricing
- OpenAI API 弃用页面 — https://developers.openai.com/api/docs/deprecations

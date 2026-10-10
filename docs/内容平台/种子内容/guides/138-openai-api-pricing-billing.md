---
title: OpenAI API 价格怎么看、余额怎么查：按 token 计费、用量与预付额度
slug: openai-api-pricing-billing
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: OpenAI API 按 token 计费，价格页上的 input、cached input、output、Batch、Flex、Fast 分别是什么意思？余额在哪里看、自动充值怎么关、额度会不会过期、怎么设支出上限？本文按官方价格页和帮助中心逐项讲清，不列具体单价，以官方页面为准。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/pricing
  - https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing
  - https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs
  - https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens
  - https://help.openai.com/en/articles/6640792-api-billing-and-invoice-timing
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/11647665-fast-mode-faq
  - https://developers.openai.com/api/docs/guides/batch
  - https://developers.openai.com/api/docs/guides/flex-processing
  - https://developers.openai.com/api/docs/guides/spend-limits
  - https://developers.openai.com/api/docs/guides/rate-limits
  - https://developers.openai.com/api/docs/quickstart
  - https://developers.openai.com/api/docs/guides/migrate-to-responses
verify:
  - 预付文章写最低首充 5 美元、默认 10 美元、自动充值默认开启；金额和默认值可能调整，上线前复核
  - 新账号是否有免费额度、额度多少，本次核对的官方页面都没有写具体数字（Quickstart 只提到「免费的测试请求」，速率限制页有 Free 档），正文按「官方未公开」处理
  - 价格页中「Short context ≤272K 输入 token」的分界和「数据驻留端点加价 10%」等说明可能随新模型变化
  - Billing 页面上「Buy credits / Add to credit balance」按钮名以实际界面为准（帮助中心写的是两者之一）
---

> 本文根据 OpenAI API 价格页、帮助中心（预付账单、用量与费用、token 计数、账单时间）和开发者文档（Batch、Flex、Spend limits、Rate limits）整理，资料核对于 2026-10-07。**本文不写具体单价**，价格经常调整，请以 [官方价格页](https://developers.openai.com/api/docs/pricing) 为准。

## 适用于谁

- 打开 OpenAI API 价格页，看到一堆 input / cached input / output、Batch / Flex / Fast 列，不知道怎么换算的人；
- 想知道 API 余额在哪查、为什么余额到 0 还扣成负数的人；
- 担心密钥泄露或程序死循环把钱刷光，想设上限的人；
- 分不清 ChatGPT 账单和 API 账单的人。

## 结论先说

1. **计费单位**：文本模型按「每 100 万 token」标价，输入、缓存输入、输出分开计价，输出通常最贵；推理模型的内部推理 token 按输出 token 计费。
2. **同一模型有多种处理档位**：Standard（标准）、Batch（批处理，异步、更便宜）、Flex（便宜但更慢、偶尔无资源）、Fast（原 Priority，更快更稳、溢价）等，按需选择。
3. **余额和用量分开看**：余额在 **Billing（账单）** 页面，调用明细在 **Usage（用量）** 页面；单次请求的 token 数在返回结果的 `usage` 字段里。
4. **新账号默认预付费**：先买额度再用；购买的额度 **1 年后过期**，一般不退款；**自动充值在开通时默认打开**，不想自动扣款记得关。
5. **防超支要设硬上限**：只设「支出提醒」不会拦截请求，要在 Limits 里打开 **Enforce a hard limit**。
6. **ChatGPT 订阅和 API 是两套账单**，互不抵扣。

## 一、价格页怎么读

打开 [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing)，旗舰模型表格的每一行是一个模型 ID，列的含义如下：

| 列名 | 含义 |
| --- | --- |
| Input（输入） | 你发给模型的内容：提示词、对话历史、文件、工具定义等 |
| Cached input（缓存输入） | 命中提示词缓存的重复前缀，单价比普通输入低 |
| Cache writes（缓存写入） | 部分新模型单独列出的写入缓存费用，没有该列的模型不收 |
| Output（输出） | 模型生成的内容，包括看不见的推理 token |
| Short / Long context | 价格页注明：单次输入 ≤272K token 为短上下文，超过按长上下文价格计 |

页面顶部可以切换处理档位：

- **Standard**：默认档位；
- **Batch**：把一批请求打包成文件异步提交，官方承诺 24 小时内完成，费用比同步调用低 50%，而且有独立、更高的速率限制，适合评测、批量分类、批量生成；
- **Flex**：在请求里设 `service_tier="flex"`，按 Batch 价格计费，代价是响应更慢、偶尔资源不足，目前是 Beta，支持的模型以价格页为准；
- **Fast**：2026-07-30 由 Priority processing 更名而来，`service_tier` 写 `fast` 或 `priority` 都可以，按 token 溢价计费，换取更快、更稳定的速度；
- **Ultrafast**：只面向已获权限组织的 GPT-6 Astra，用 Responses API 调用，需要额外请求头。

另外，价格页下方还有图像、音频、实时语音、工具调用（如网页搜索按调用次数计）等分区，计价单位各不相同。通过 Amazon Bedrock 或 Microsoft Azure 使用 OpenAI 模型的，由这些云平台自己计费。

### 估算一次调用的费用

拿到某次请求的 token 数后，按下面的思路算（单价从价格页查）：

```
费用 ≈ 未缓存输入 token ÷ 1,000,000 × 输入单价
     + 缓存输入 token ÷ 1,000,000 × 缓存输入单价
     + 输出 token（含推理 token）÷ 1,000,000 × 输出单价
```

帮助中心特别提醒：**单价低不等于总价低**。不同模型对同一段文字切出的 token 数不同，生成的长度和推理量也不同，最好用几条真实任务实际跑一遍再比较。英文粗略估算是 1 token ≈ 4 个字符，其他语言换算关系不同，要精确就用官方 Tokenizer 或 tiktoken。

## 二、余额和用量在哪看

**看余额 / 买额度**：开发者平台 **Settings → Billing**。这里能看到额度余额、添加付款方式、购买额度（按钮可能叫 **Buy credits** 或 **Add to credit balance**），以及 **Billing history（账单记录）** 里的付款记录和收据。赠送的额度在 Billing 下的 **Credit grants（额度发放）** 页查看；如果账户有免费额度，会先于购买的额度扣除。

**看用量**：打开 **Usage** 页面（需要组织 Owner 或有 Usage Dashboard 权限）：

- 数据按 **UTC 时间**显示，和本地日志对账时注意时差；
- 有独立的项目筛选器，不选项目就是整个组织的数据；
- 可以在 **API capabilities → Responses and Chat Completions** 里按用户筛选；
- 可以导出数据，日期范围不限；
- 多个组织之间的数据不会合并显示。

**看单次请求**：Responses API 返回的 `usage` 里有 `input_tokens`、`output_tokens`、`total_tokens`，以及缓存命中和推理 token 的明细。代码写法见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。

Playground 里的测试也走 API，同样计入用量和费用。

## 三、预付额度：开通、自动充值与过期

开通步骤（需要有该组织的账单管理权限）：

1. 进入 API 平台的 Billing 概览，点 **Add payment details（添加付款信息）**；
2. 选首次购买金额，帮助中心写的最低金额是 5 美元；
3. 确认前检查 **Use auto-reload（自动充值）**——它**默认是开着的**，不想自动扣款就关掉；保留的话，设置触发充值的余额阈值、充到多少，以及可选的每月自动充值上限；
4. 确认购买，余额几分钟后更新。

几条容易踩坑的规则：

- **额度 1 年过期**，官方不能延期；除法律或合同要求、或经核实的账单错误等例外情况外，不予退款；
- **余额用完后可能出现负数**：停止服务有延迟，这期间的用量会记成负余额，从下次充值里扣，所以别把余额当作即时止损手段；
- **余额为正不代表不会被限流**：速率限制、组织的月度用量上限、你自己设的支出上限都是独立的；
- 账户能持有的最高余额、单次自动充值上限，由账户的信任等级决定。

企业客户按自然月出具发票，个人和团队客户通过预付额度或信用卡自动扣款支付。

## 四、设置支出上限

在 **Settings → Limits** 里：

1. 找到 **Spend**，点 **Edit spend limit**；
2. 填写 **Monthly spend limit（月度支出上限）**；
3. 想到达上限后真正拦截请求，打开 **Enforce a hard limit**；
4. 保存。项目级上限在对应项目的 Limits 里设置，方法相同。

到达硬上限后，请求会返回 429，错误码是 `organization_spend_limit_exceeded` 或 `project_spend_limit_exceeded`；生效有延迟，实际花费可能略超上限。另外，OpenAI 还会按组织的使用档位（Free、Build、Launch、Grow）给一个**月度用量上限**，累计充值达到门槛会自动升档，具体门槛见 [Rate limits 页面](https://developers.openai.com/api/docs/guides/rate-limits)。遇到各种 429 怎么区分，见 [/guides/openai-api-429-error](/guides/openai-api-429-error)。

## 常见问题

**Q：有免费额度吗？**
官方 Quickstart 提到可以先跑「免费的测试请求」，速率限制页也列有 Free 档，但本次核对的官方页面没有写新账号具体送多少额度。以你账户 Billing → Credit grants 页面显示为准。

**Q：ChatGPT 的账单和 API 账单在哪里分别看？**
ChatGPT 订阅在 chatgpt.com 的 **Settings → Billing**；API 在 platform.openai.com 的 Billing。两套系统独立，Plus / Pro 订阅不含 API 额度。

**Q：用了 `previous_response_id` 续写对话，之前的内容还收费吗？**
收费。官方迁移指南写明，链条里之前的输入 token 仍按输入 token 计费。

**Q：充值后马上调用还是报余额不足？**
余额更新需要几分钟，稍等再试；仍不行就看错误码是不是别的限额。

## 参考资料

- OpenAI API Pricing — https://developers.openai.com/api/docs/pricing
- OpenAI 帮助中心：Setting up and managing prepaid API billing — https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing
- OpenAI 帮助中心：Reviewing API usage and costs — https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs
- OpenAI 帮助中心：Understanding and counting tokens — https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens
- OpenAI 帮助中心：API billing and invoice timing — https://help.openai.com/en/articles/6640792-api-billing-and-invoice-timing
- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：Fast mode FAQ — https://help.openai.com/en/articles/11647665-fast-mode-faq
- OpenAI 开发者文档：Batch API — https://developers.openai.com/api/docs/guides/batch
- OpenAI 开发者文档：Flex processing — https://developers.openai.com/api/docs/guides/flex-processing
- OpenAI 开发者文档：Spend limits — https://developers.openai.com/api/docs/guides/spend-limits
- OpenAI 开发者文档：Rate limits（Usage tiers）— https://developers.openai.com/api/docs/guides/rate-limits

---
title: DeepSeek 收费吗：网页版和 App 免费，API 按 token 收费，收费版和免费版到底差在哪、错峰价怎么算
slug: deepseek-pricing-free-or-paid
products: [ai-tools]
models: [deepseek]
accountTier: FREE
excerpt: "搜「DeepSeek 收费吗」「收费版和免费版的区别」，答案要分两种用法：App Store 页面标注免费，官方没有写网页版会员；API 才是按 token 计费，有错峰价。本文按官方价格页（2026-10 查询）把两者分开讲清，并说明余额怎么扣。"
checkedOn: 2026-10-30
sources:
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://apps.apple.com/cn/app/deepseek/id6737597349
  - https://www.deepseek.com/
verify:
  - 官方页面没有明确写出「网页版永久免费」，本文只陈述 App Store 页面标注免费、核对时未列内购，这不等于官方承诺
  - API 价格、错峰时段、Search 与 Fetch 单价是 2026-10-30 当天读到的官方价格页，官方随时可能调整
  - 价格页脚注提到 Harness、Claude Code、Codex 的服务端工具调用目前免费并将于 2026-11-01 起计费，以官方页面为准
---

> 本文根据 DeepSeek 官方 API 价格页和 App Store 页面整理，价格为 2026-10 查询，资料核对于 2026-10-30。价格会变，以官方页面为准。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 想知道 DeepSeek 聊天要不要花钱的人；
- 听说有「收费版」「免费版」，想弄清差别的人；
- 用 API，想估算费用、想知道什么时候最便宜的人。

## 结论先说

1. **聊天（网页版、App）**：iOS 的 App Store 页面标注「免费」，核对时没有列出内购项目，应用介绍写的是免费体验。**官方站点上没有看到网页版的会员、订阅或「收费版」的说明**，所以「收费版和免费版的区别」并没有官方对照表。
2. **API（给程序调用的接口）**：需要充值，**按 token 消耗计费**，价格以官方价格页为准，并且分高峰和空闲时段。这是两件事，别混在一起。
3. 官方价格页写的扣费规则是：模型调用费用等于 token 消耗量乘以模型单价；Search 和 Fetch 按成功请求次数计费；费用从充值余额或赠送余额里扣，**两种余额同时存在时先扣赠送余额**。
4. 看到有人卖「DeepSeek 会员」之类的东西，官方页面里没有对应说明，付款前先到官网核实。

![DeepSeek：聊天和 API 怎么收费](seed:g1401-chat-vs-api-cost.png)
*图：本站根据 [DeepSeek API 文档](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 和 App Store 页面整理的示意图*

## 一、聊天免费，具体是什么意思

- App Store 的「DeepSeek - AI 智能助手」页面标注价格为「免费」，介绍里写着「免费体验与全球领先 AI 模型的互动交流」；
- 官方没有公布聊天每天能发多少条、有没有隐形的使用额度，所以如果用得很多遇到限制，看 [/guides/deepseek-server-busy](/guides/deepseek-server-busy)；
- 官方没有说明网页版和 App 的计费方式，这里不替官方猜。

官方入口和下载见 [/guides/deepseek-official-site-web-desktop-download](/guides/deepseek-official-site-web-desktop-download)，功能使用见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。

## 二、API 按什么收费（2026-10 查询）

官方价格页目前列出两个模型：**deepseek-flash**（版本 DeepSeek-V4.1-Flash-1017）和 **deepseek-v4-pro**（版本 DeepSeek-V4-Pro-0813）。上下文长度都是 1M，最大输出 384K。价格单位是**元 / 百万 tokens**：

| 模型 | 项目 | 空闲时段 | 高峰时段 |
| --- | --- | --- | --- |
| deepseek-flash | 输入（缓存命中） | 0.02 | 0.04 |
| deepseek-flash | 输入（缓存未命中） | 1 | 2 |
| deepseek-flash | 输出 | 4 | 8 |
| deepseek-v4-pro | 输入（缓存命中） | 0.15 | 0.30 |
| deepseek-v4-pro | 输入（缓存未命中） | 4.5 | 9.0 |
| deepseek-v4-pro | 输出 | 13.5 | 27.0 |

另外，**Search 和 Fetch 各按每 1,000 次成功请求 5 元**计费。旧的模型名 deepseek-v4-flash 和 deepseek-v4-flash-vision-exp 仍然可用，会按 V4.1 Flash 的价格计费。

### 高峰和空闲怎么分

官方脚注写的是：空闲时段价格是高峰时段的一半。**北京时间周一至周五（不含中国法定节假日）9:00–12:00、14:00–18:00 是高峰**，其余时间，包括周末和法定节假日全天，都是空闲时段。

要省钱，能延后的批量任务放在晚上或周末跑。历史价格变化见 [/guides/deepseek-price-changes-timeline](/guides/deepseek-price-changes-timeline)，Flash 和 Pro 的对比见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

### 余额怎么扣

按官方说明：费用直接从**充值余额或赠送余额**中扣减，两者同时存在时**优先扣赠送余额**。余额不够时接口会报错，处理见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

## 三、对照表：你属于哪种情况

![想知道会不会花钱，看这里](seed:g1401-cost-decide.png)
*图：本站根据 [DeepSeek API 文档](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 整理的示意图*

## 常见问题

**Q：有没有「DeepSeek Plus」或 Pro 会员？**
在官方网站、API 文档和 App Store 页面里没有找到。别把 API 的 deepseek-v4-pro 模型名当成会员档位，它是接口里的一个模型。

**Q：通过 Codex、Claude Code 用 DeepSeek 要钱吗？**
那是走接口。官方价格页脚注提到，通过 DeepSeek Harness、Claude Code 或 Codex 发起的服务端工具调用目前免费，**北京时间 2026 年 11 月 1 日 0 点起开始按次计费**，具体以官方价格页为准。接入方法见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。

**Q：想用 ChatGPT、Claude 的付费功能呢？**
那是另外的产品，本站 [充值页](/chongzhi) 提供 [ChatGPT Plus](/chongzhi/chatgpt-plus)、[Claude Pro](/chongzhi/claude-pro) 等服务，价格以各自官方页面为准。

## 参考资料

- DeepSeek API 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek App（App Store） — https://apps.apple.com/cn/app/deepseek/id6737597349
- DeepSeek 官网 — https://www.deepseek.com/

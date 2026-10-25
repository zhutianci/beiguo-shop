---
title: DeepSeek 为什么涨价：官方三次价格调整的时间线、官方说明与现在的价格
slug: deepseek-price-changes-timeline
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API 为什么涨价？只引官方公告与价格页（2026-10-24 查询）：4 月 V4 定价、8 月 17 日起的峰谷定价、9 月 10 日 Flash 下调，附各时间点的价格表、官方给出的理由和现在怎么省钱。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/news/news260424
  - https://api-docs.deepseek.com/zh-cn/news/news260813
  - https://api-docs.deepseek.com/zh-cn/news/news260910
  - https://api-docs.deepseek.com/zh-cn/updates
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
verify:
  - 04-24、08-17、09-10 三个时间点的价格取自官方公告里的价格图（2026-10-24 逐张查看）；当前价格取自官方价格页。官方保留调整价格的权利，下单前请再看价格页
  - 「涨了还是降了」是本文把各价格表对比后的读法，不是官方结论；官方对 8 月峰谷定价的说明只有「为了更加合理地调配资源」，没有说是涨价
  - 官方 2026-04-24 价格图的脚注写：受限于高端算力，Pro 的服务吞吐有限，预计下半年昇腾 950 超节点批量上市后 Pro 价格会大幅下调；这是当时的预期，本文不预测是否兑现
  - 官方 2026-09-10 的新闻稿曾写计划有序下线 V4 Pro、请求将路由到 V4.1 Flash；同日更新日志又写「决定在 2026 年 9 月 14 日之后继续提供 V4 Pro 的 API 调用服务，计费方式保持不变」。以最新的更新日志和价格页为准
---

> 本文只引用 DeepSeek 官方公告和价格页，资料核对于 2026-10-24。价格可能随时调整。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek为什么涨价」的人；
- 觉得最近账单变高、想弄清官方到底改了什么的开发者；
- 想知道现在价格是多少、怎么省的人。

## 结论先说

1. **官方没有用「涨价」这个词**。官方公告里的说法是：2026-08-13 起采用**峰谷定价**，「为了更加合理地调配资源」，空闲时段价格是高峰时段的一半，新价格自北京时间 **2026-08-17 0 点**起生效。
2. **从价格表看，不同项目有升有降**：以 Flash 为例，8 月 17 日起未命中缓存的输入和输出单价比 4 月的价格表高，缓存命中的单价则更低；9 月 10 日 V4.1 Flash 发布时官方又**下调**了 Flash 价格。
3. **现在的价格**以官方价格页为准：2026-10-24 查询，Flash 空闲时段输出 4 元 / 百万 token，高峰 8 元；Pro 空闲 13.5 元，高峰 27 元。
4. **想省钱**：批量任务放空闲时段，价格直接减半。

![API 价格变化（元 / 百万 token）](seed:g1015-deepseek-price-timeline.png)
*图：本站根据 [DeepSeek 官方公告](https://api-docs.deepseek.com/zh-cn/updates) 与 [价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 整理的示意图*

## 一、时间线

### 2026-04-24：V4 预览版

官方公告配的价格图里，V4-Pro 为缓存命中 1 元、未命中 12 元、输出 24 元；V4-Flash 为缓存命中 0.2 元、未命中 1 元、输出 2 元（每百万 token），上下文 1M。图下脚注写明：受限于高端算力，目前 Pro 的服务吞吐十分有限，预计下半年昇腾 950 超节点批量上市后，Pro 的价格会大幅下调。

### 2026-08-13：V4 Pro 正式版，宣布峰谷定价

官方更新日志写：随着 V4 全系列正式版上线，将对 API 价格进行更新调整；为更合理地调配资源采用峰谷定价，闲时价格为高峰时段价格的一半，鼓励用户根据实际使用情况调整任务时间；新价格自北京时间 2026 年 8 月 17 日 0 时起生效。公告价格图：

- V4-Flash 空闲时段：缓存命中 0.05 元、未命中 1.5 元、输出 4.5 元；高峰时段 0.10 / 3.0 / 9.0 元；
- V4-Pro 空闲时段：0.15 / 4.5 / 13.5 元；高峰时段 0.30 / 9.0 / 27.0 元。

高峰时段是北京时间 9:00–12:00 和 14:00–18:00（价格页补充：周一至周五，不含中国法定节假日；周末和法定节假日全天为空闲）。

把这张表和 4 月的价格对比，可以看到变化并不一致：缓存命中的单价下降；Pro 未命中和输出在空闲时段低于 4 月的价格，但高峰时段的输出（27 元）高于 4 月的 24 元；Flash 未命中和输出则高于 4 月的价格。所以「涨价」的感受取决于你主要用哪个模型、什么时段、缓存命中率多高。这是本文对表格的读法，不是官方说法。

### 2026-09-10：V4.1 Flash 发布，Flash 价格下调

官方说明：得益于模型架构的创新，V4.1 Flash 能以更低的成本服务更多用户，因此下调了 Flash 的定价，仍采用峰谷定价；新价格自 2026 年 9 月 10 日 12:00 起生效。公告价格图：空闲时段缓存命中 0.02 元、未命中 1.0 元、输出 4.0 元；高峰时段 0.04 / 2.0 / 8.0 元。

同日的新闻稿还写到：V4.1 Flash 官方评测超过 V4 Pro，计划有序下线 V4 Pro，2026-09-14 12:00 之后访问 `deepseek-v4-pro` 的请求将路由到 V4.1 Flash 并按 Flash 单价计费。但同一天的更新日志又写：为响应用户需求，**2026-09-14 之后继续提供 V4 Pro 的 API 调用，计费方式保持不变**。当前价格页仍列有 `deepseek-v4-pro` 的独立价格，所以以后者为准。

### 2026-10-17：V4.1-Flash-1017

官方更新日志写明：API 调用方式与价格保持不变，仍使用 `deepseek-flash`。同日开放自研搜索 API，Search 与 Fetch 各 5 元 / 千次，目前在 DeepSeek Harness、Claude Code、Codex 中使用时的服务端调用不计费，将于北京时间 2026-11-01 00:00 起按次收取。

## 二、现在的价格（价格页，2026-10-24 查询）

| 项目（每百万 token） | Flash 空闲 | Flash 高峰 | Pro 空闲 | Pro 高峰 |
| --- | --- | --- | --- | --- |
| 输入（缓存命中） | 0.02 元 | 0.04 元 | 0.15 元 | 0.30 元 |
| 输入（缓存未命中） | 1 元 | 2 元 | 4.5 元 | 9.0 元 |
| 输出 | 4 元 | 8 元 | 13.5 元 | 27.0 元 |

逐项解释和旧模型名的处理见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。

## 三、官方文档里的省钱办法

![想少花钱，官方文档里有这些办法](seed:g1015-deepseek-save-cost-decide.png)
*图：本站根据 DeepSeek 官方价格页与上下文缓存文档整理的示意图*

- **错开高峰**：批量、离线任务放到空闲时段；
- **用缓存**：官方的上下文硬盘缓存对所有用户默认开启，重复的前缀计入「缓存命中」，单价低得多；把固定的系统提示和长文档放在请求最前面，原理见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)；
- **按任务选模型**：Flash 各项价格都低于 Pro，Flash 支持图像理解、Pro 不支持；
- **控制思考强度和输出长度**：思考内容也计入输出 token，简单任务可降低强度或关闭思考，见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)；
- **按需充值**：官方让用户依据实际用量按需充值，并定期查看价格页。

## 常见问题

**Q：网页版和 App 涨价了吗？**
上面的价格都是 API 价格。网页版和 App 的使用见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)，本文没有查到网页版收费的相关公告。

**Q：价格以后还会变吗？**
官方价格页写明保留修改价格的权利，请定期查看。4 月价格图脚注提到的 Pro 降价预期，截至查询时没有看到相关公告。

**Q：怎么确认自己用了多少？**
开放平台的用量页和每次返回的 `usage`，见 [/guides/deepseek-api-platform-balance-topup](/guides/deepseek-api-platform-balance-topup)。

**Q：想对比其他家的价格？**
OpenAI API 见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)；ChatGPT 与 DeepSeek 的整体差别见 [/guides/chatgpt-vs-deepseek-difference](/guides/chatgpt-vs-deepseek-difference)。

## 参考资料

- DeepSeek-V4 预览版发布（2026-04-24）— https://api-docs.deepseek.com/zh-cn/news/news260424
- DeepSeek-V4-Pro 正式版上线（2026-08-13）— https://api-docs.deepseek.com/zh-cn/news/news260813
- DeepSeek-V4.1-Flash 发布（2026-09-10）— https://api-docs.deepseek.com/zh-cn/news/news260910
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing

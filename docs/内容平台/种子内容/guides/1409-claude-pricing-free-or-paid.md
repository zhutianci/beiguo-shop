---
title: Claude 收费吗：免费版能用什么，Pro、Max、Team 官方标价是多少（2026 年 10 月官方定价页）
slug: claude-pricing-free-or-paid
products: [claude]
models: []
accountTier: FREE
excerpt: "Claude 收费吗？官方有免费套餐，也有付费套餐。按官方定价页（2026-10 查询）：Pro 年付折合 17 美元每月、月付 20 美元，Max 从 100 美元每月起，Team 标准席位年付 20 美元。本文讲清各档标价、税费、手机端价格差异，以及订阅不含 API。"
checkedOn: 2026-10-30
sources:
  - https://claude.com/pricing
  - https://support.claude.com/en/articles/11049741-what-is-the-max-plan
  - https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console
verify:
  - 价格是 2026-10-30 当天读到的 claude.com/pricing，以美元标价，官方写明价格不含税并保留调整权利，请以打开页面时的显示为准
  - 手机应用内购买的价格可能与网页订阅不同，帮助中心只说「可能不同」，没有给数字
  - Enterprise 的价格表述较复杂（含最低席位和按量计费），本文只摘要不展开
---

> 本文根据 Claude 官方定价页和帮助中心整理，价格为 2026-10 查询，资料核对于 2026-10-30。价格以官方页面为准。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 搜「claude收费吗」「claude收费标准」，想先知道要不要花钱的人；
- 免费版不够用，想知道升级要多少钱的人；
- 分不清订阅和 API 的人。

## 结论先说

1. **有免费版**，官方定价页写的是「Free for everyone」，标价 0 美元。
2. **付费套餐（2026-10 查询，美元，不含税）**：
   - **Pro**：年付折合 **$17 每月**（一次收 $200），月付 **$20**；
   - **Max**：**$100 每月起**，分 5x 和 20x 两档（帮助中心写的是 Max 5x $100、Max 20x $200）；
   - **Team**：标准席位年付 $20、月付 $25，高级席位年付 $100、月付 $125，每席位每月，适用 2 到 150 人；
   - **Enterprise**：官方页面标 US$20 每席位每月，年付，至少 20 个席位，另按 API 价格计用量。
3. **Claude 订阅不包含 API**，API 单独计费，见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。
4. 价格页写明**标价不含适用的税**，并说价格和套餐可能调整。
5. 手机应用内购买的价格**可能和网页订阅不一样**，具体看你所用应用商店里显示的价格。

![Claude 各套餐官方标价](seed:g1409-plans-prices.png)
*图：本站根据 [Claude 定价页](https://claude.com/pricing) 整理的示意图*

## 一、免费版能做什么

官方定价页列出免费版的功能：网页、桌面和手机上的聊天；联网搜索、创建文件、运行代码；记忆；应用连接器；Artifacts；Claude Design、Slides 和 Docs。

免费版和付费版**用量不同**：定价页对 Pro 和 Max 标了用量星号，说明各付费套餐都有用量限制。具体什么时候重置、怎么看，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 二、付费版比免费版多了什么

按官方定价页：

- **Pro**：在 Free 的基础上增加用量，以及任务交接与定时、Claude Dashboards（测试版）、Claude Science、Projects、更多 Claude 模型、Claude in Chrome 和 Microsoft 365，页面写明「Claude Code included」；
- **Max**：在 Pro 的基础上是 Pro 用量的 5 倍或 20 倍，更高的输出上限，提前试用新功能，高峰时段优先访问，另有每月 100 到 200 美元的 API 额度；
- **Team**：包含 Claude Code 和 Cowork、集中计费、SSO、最多每月 500 美元的共享 API 额度；高级席位的用量是标准席位的 5 倍；
- **Enterprise**：在 Team 之上增加管理员支出限制、基于角色的访问、审计日志等。

各档功能的详细对比，见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)；Pro 和 Team 怎么选，见 [/guides/claude-team-vs-pro](/guides/claude-team-vs-pro)。

「5x」「20x」指什么：帮助中心写的是相对 Pro 每个会话用量额度的倍数，每 5 小时一个会话限制，另有每周限额。

## 三、对照表：该看哪一档

![该选哪一档，先看这几条](seed:g1409-plan-decide.png)
*图：本站根据 [Claude 定价页](https://claude.com/pricing) 整理的示意图*

## 四、几个容易搞混的点

- **月付和年付**：Pro 的 $17 是年付折合，月付是 $20；定价页写的是年付一次收 $200；
- **税费**：标价不含税，实际扣款金额以结账页面为准；
- **退款**：定价页只写了一点区域性说明，欧洲经济区和英国的客户有 14 天的撤销期。取消和退款的具体做法见 [/guides/claude-cancel-subscription-refund](/guides/claude-cancel-subscription-refund)；
- **通过应用商店订阅**：手机应用内的价格可能不同，管理方式见 [/guides/claude-app-store-google-play-subscription](/guides/claude-app-store-google-play-subscription)。

## 常见问题

**Q：Claude 免费版有时间限制吗？**
官方定价页没有写免费版的试用期，只写了「Free for everyone」，用量有限制，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

**Q：Claude 的官网入口是哪个？**
见 [/guides/claude-official-website-entry-chinese-version](/guides/claude-official-website-entry-chinese-version)。

**Q：想开通 Claude Pro 怎么办？**
可以在官方页面订阅，也可以看本站的 [Claude Pro 充值页](/chongzhi/claude-pro)，价格以各页面显示为准。

## 参考资料

- Claude 定价 — https://claude.com/pricing
- What is the Max plan?（帮助中心） — https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- 为什么订阅之外还要单独为 API 付费（帮助中心） — https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console

---
title: Claude Pro 和 Max 的区别：用量、价格、Fable 模型和每月 API 额度怎么选
slug: claude-pro-vs-max-difference
products: [claude]
models: []
accountTier: PRO
excerpt: Claude Pro 和 Max 有什么区别？按官方定价页和帮助中心核对：Max 有 5x、20x 两档用量，Pro 与 Max 在价格、Fable 模型、每月 API 额度和计费周期上的差别，以及什么情况下 Pro 够用、什么情况下该升 Max。
checkedOn: 2026-10-19
sources:
  - https://claude.com/pricing
  - https://support.claude.com/en/articles/11049741-what-is-the-max-plan
  - https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
  - https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
  - https://support.claude.com/en/articles/12138966-release-notes
verify:
  - 价格取自 claude.com/pricing 和帮助中心 2026-10-19 的页面：Pro 月付 20 美元、年付折合每月 17 美元（一次性付 200 美元）；Max 5x 每月 100 美元、20x 每月 200 美元；定价页写明「不含适用税费」，手机应用商店的价格可能不同；价格与套餐随时可能调整
  - 定价页对比表里 Priority access at high traffic times 一栏，Pro 标 No、Max 标 Yes，而 Pro 帮助中心文章的权益列表里写了「高峰期优先访问」，两处官方表述不一致，本文不下结论，以官方当天页面为准
  - Fable 5 / 5.1 在 Pro 上走用量额度、在 Max 上最多占每周限额 50%，来自官方 Fable 帮助文章；模型名与规则变化较快
  - 各套餐每 5 小时 / 每周具体能发多少条消息官方未公开，本文只写官方给的倍数
---

> 本文根据 Claude 官方定价页（claude.com/pricing）和帮助中心《What is the Max plan?》《What is the Pro plan?》《Claude Fable models on your plan》整理，资料核对于 2026-10-19，价格为「2026-10 查询」。图为本站整理的示意图。套餐和价格可能随时调整，**以官方页面和你下单时显示的为准**。

## 适用于谁

- 在 Pro 和 Max 之间犹豫的人；
- 在 Pro 上经常碰到「5-hour limit reached」，想知道升 Max 值不值的人；
- 想知道 Max 比 Pro 多了哪些东西的人；
- 想了解 Fable 模型、每月 API 额度这些新差异的人。

套餐的完整对比（含免费版、团队版）见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)，本文只聚焦 Pro 和 Max。

## 结论先说

1. **最核心的差别是用量**：官方说，Max 提供 Pro 套餐 **5 倍或 20 倍**的用量，看你选哪一档；Max 另有更高的输出上限、优先体验新功能的资格。
2. **功能上的重叠很大**：按官方定价页的对比表，Claude Code、Opus、Research（研究）、Claude in Chrome、Projects 等，Pro 和 Max 都有；Max 不是「多了一堆新功能」，主要是**更多用量 + 几项额外权益**。
3. **三项额外权益在 Max**：每月含 API 额度（Max 5x 为 100 美元、Max 20x 为 200 美元，Pro 没有）、Fable 模型包含在套餐里（Pro 上走用量额度，见下）、官方定价页标注的「高峰期优先访问」。
4. **价格**（官方定价页，不含税）：Pro 月付 20 美元，年付折合每月 17 美元；Max 5x 每月 100 美元，Max 20x 每月 200 美元。**Max 目前只有月付**。
5. **选择方式**：偶尔碰限额，Pro 加用量额度就行；几乎天天用完限额，再考虑 Max 5x，更重的使用再看 20x。需要开通 Claude Pro 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)；需要更高用量的，可以看 [/chongzhi/claude-max](/chongzhi/claude-max)。

![Claude Pro 和 Max 的区别：价格、用量、计费周期、Fable、API 额度](seed:g934-claude-pro-vs-max-compare.png)
*图：本站根据 [Claude 官方定价页](https://claude.com/pricing) 与 [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan) 整理的示意图*

## 一、用量：Max 到底多多少

官方帮助中心的原话要点：

- **Max 5x**：包含 Pro 套餐 5 倍的**每次会话用量**，官方说适合需要在各种任务上经常和 Claude 协作的人；
- **Max 20x**：包含 Pro 套餐 20 倍的每次会话用量，官方说适合每天、大部分任务都要和 Claude 协作的人。

两档 Max 和 Pro 的限额机制是一样的：

- **5 小时会话限额**：每 5 小时重置一次；
- **每周限额**：适用于所有模型，在你账号被分配的固定时间重置，不会因为你什么时候开始用、什么时候订阅而改变；你可以在 **Settings → Usage** 里看到下次重置的时间；
- 官方还说，为了管理容量和保证公平，可能以每周、每月上限，或模型、功能的使用限制等方式额外限制用量。

**每个套餐具体能发多少条消息，官方没有公布**，只给倍数，本文也不编数字。额度怎么看、怎么省，见 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 二、Pro 额度不够，不一定要升 Max

官方说，Pro 订阅用户可以开启**用量额度（usage credits）**，在用完套餐内含用量之后继续按量付费使用。开启后，到达 5 小时或每周限额，请求会切换到用量额度继续，直到达到你设置的月度花费上限或余额用完（关闭自动充值时）。

所以两种思路：

- **偶尔超出**：留在 Pro，需要时用用量额度顶一下；
- **经常超出**：对比一下每月用量额度花销和 Max 5x 的月费，再决定。

官方还提供「限额重置」（limit reset）功能，可以把 5 小时或每周限额重置为满额，细则见官方帮助中心。

## 三、Fable 模型：Pro 走用量额度，Max 已包含

官方有一篇专门的帮助文章讲 Fable 模型（Fable 5 和 Fable 5.1）在各套餐上的规则，要点是：

- **所有付费套餐**（Pro、Max、Team、Enterprise）都可以使用 Fable 5 和 Fable 5.1，免费版不可用；
- **Max 套餐**：两者是套餐的标准组成部分，**最多可以使用每周限额的 50%** 在 Fable 模型上，不额外收费；用完这 50% 后，可以改用用量额度继续用 Fable，也可以切到别的模型；Fable 会比其他模型更快消耗限额；
- **Pro 套餐**：Fable 不包含在套餐限额里，要用**用量额度**付费；
- 官方强调，「50%」不是额外增加 50%：用其他模型和用 Fable 都从同一份每周限额里扣，总量永远不会超过每周限额。

如果你主要用 Sonnet、Haiku、Opus，不依赖 Fable，这一条差别对你影响不大；模型怎么选，见 [/guides/claude-models-compare](/guides/claude-models-compare)。

## 四、每月 API 额度：Max 有、Pro 没有

官方说，Max 套餐（和 Team 套餐）包含**每月的 Claude API 额度**：Max 5x 每月 100 美元，Max 20x 每月 200 美元（定价页写法）。Pro 套餐**不包含** API 用量：想同时用 Claude 的增强功能和 API，Pro 用户要另外在 Claude Console 开通 API，并单独付费。

注意：订阅和 API 是两套计费，Pro、Max 的聊天用量不能拿去抵 API 费用；Max 的每月 API 额度也是单独领取的（官方说「如果你已经领取了每月 API 额度」），具体领取方式和使用范围见官方说明。API 怎么开通，见 [/guides/claude-api-key-console](/guides/claude-api-key-console)。

## 五、价格与计费细节

![什么情况下 Pro 够用、什么情况下该升 Max](seed:g934-claude-pro-or-max-decide.png)
*图：本站根据 [What is the Pro plan?](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) 与 [What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan) 整理的示意图*

- **Pro**：官方说每月 20 美元（美国），在支持的地区按当地货币定价；可选年付，年付折合每月更便宜（定价页写的是年付 200 美元一次性付、折合每月 17 美元）。各地区价格不同，有的含税、有的结账时加税。
- **Max**：5x 每月 100 美元，20x 每月 200 美元；官方说这些是**网页订阅**价格，手机应用商店的价格可能不同。目前**只有月付**。
- **升档的计费**：从低档升到高档，当期按比例补差价；用 Google Play 订阅的，升级时按新套餐全价收费，旧套餐没用完的部分折算成新套餐的额外天数；年付 Pro 升 Max 时，如果年付剩余金额大于 Max 价格，多出来的部分会作为账户余额，用于以后的订阅费，前提是账单地址和上一次订阅时相同。
- **折扣**：官方说个人套餐（Pro 和 Max）没有常规折扣，客服也不能发一次性折扣或优惠券；限时活动会在官方渠道公布。

## 六、怎么选：几个判断问题

1. **每天会不会用完 5 小时限额？** 很少——Pro 够用；经常——考虑 Max 5x；
2. **是不是靠 Claude Code 写代码、长时间跑任务？** 长任务耗额度快，这类用户往往是升 Max 的主力，Claude Code 的用法见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)；
3. **是否需要 Fable 模型？** 需要且用得多，Max 里已经包含；
4. **有没有 API 需求？** Max 每月含 API 额度；Pro 没有；
5. **是个人用还是团队用？** 官方的 Pro、Max 文章都注明是面向个人的，团队使用请看 Team 与 Enterprise 套餐。

## 常见问题

**Q：Max 比 Pro 多了哪些功能？**
按定价页对比表，Claude Code、Opus、Research 等主要功能 Pro 也有；Max 多的是更高用量、更高输出上限、优先体验新功能、每月 API 额度和 Fable 模型包含在套餐里。

**Q：Pro 和 Max 的模型一样吗？**
定价页显示，Opus、Sonnet、Haiku 在 Pro 和 Max 上都有；区别在 Fable。

**Q：从 Pro 升 Max，已付的钱怎么算？**
见上面「升档的计费」；具体金额以升级页面显示为准。

**Q：升级后订阅在哪里管理？**
网页订阅在 Claude 的 Settings 里管理；手机端订阅归 Apple 或 Google 管理。

**Q：我所在地区能订阅吗？**
Pro 套餐在官方支持的地区提供，名单见 [Anthropic Supported Regions Policy](https://www.anthropic.com/supported-countries)；登录和地区问题见 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)。

## 参考资料

- Claude 官方定价页 — https://claude.com/pricing
- Claude 帮助中心：What is the Max plan? — https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- Claude 帮助中心：What is the Pro plan? — https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- Claude 帮助中心：Claude Fable models on your plan — https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan

---
title: Grok 怎么取消订阅：网页、苹果、谷歌、X 四种购买渠道分别在哪取消、能不能退款
slug: grok-cancel-subscription
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 怎么取消订阅？要看当初在哪里买的：网页订阅去 grok.com/dashboard/billing，苹果内购找 Apple，谷歌商店订阅在 Google Play，X 里订阅的在 X 里取消。官方说续费前至少 24 小时取消，退款也按渠道分开处理（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://docs.x.ai/x-subscription/cancel
  - https://docs.x.ai/x-subscription/manage
  - https://docs.x.ai/x-subscription/invoices-and-refunds
  - https://docs.x.ai/x-subscription/upgrade-or-downgrade
  - https://docs.x.ai/grok/faq
  - https://x.ai/pricing
verify:
  - 官方文档把「The X Subscription（合并订阅）」和老的「SuperGrok」订阅分开写；本文两种都写明，若你没有切换过合并订阅，按老 SuperGrok 的说法走（FAQ），已切换的按 dashboard 的说法走
  - 苹果取消路径：官方文档只在 Cursor 的 App Store 订阅说明里写了「设置 → 点头像 → 订阅 → 选择对应订阅」，Grok 的取消链接指向 Apple 官方页面，具体按钮以 iOS 系统界面为准
  - 官方 FAQ 写网页或 Google Play 订阅的退款由官方处理，通过 xAI 退款申请表（accounts.x.ai/refund），批准后通常 5 到 10 个工作日退回原支付方式；到账时间还取决于银行
  - 定价页写「续费前至少 24 小时取消」，网页取消后是否立即停用还是用到当期结束，官方文档没有逐条写明，请以取消确认页面提示为准
  - 合并订阅（The X Subscription）一旦完成是永久的，取消订阅不会拆分账号，也不会恢复原来的 Cursor、SuperGrok 或 X Premium 订阅，这是官方文档明确写的
  - 官方定价页同时声明订阅只通过官方渠道直接销售，不授权任何转售方；本文只讲官方渠道的取消方式
---

> 本文根据 Grok 官方 FAQ、The X Subscription 文档和定价页整理，资料核对于 2026-10-25。订阅和退款规则可能调整，**以官方页面和你下单、取消时显示的为准**。图为本站整理的示意图。

## 适用于谁

- 搜「grok怎么取消订阅」「supergrok怎么退订」的人；
- 在网页、App Store、Google Play 或 X 里订阅过，不确定该去哪取消的人；
- 想知道取消后能不能退款的人。

## 结论先说

1. **先确认购买渠道**：订阅记在你当时付款的平台上，哪里买的就在哪里取消。
2. **网页订阅**：登录 grok.com/dashboard/billing，在 Current plan 卡片的选项里取消。老的 SuperGrok 网页订阅，FAQ 的说法是 grok.com 的 Settings → Billing（或 grok.com/?_s=billing）里点 Manage Subscription。
3. **苹果 App Store**：Apple 处理这笔交易，取消和退款都找 Apple。
4. **谷歌 Google Play**：在 Google Play 里取消；退款则由官方处理，用 xAI 退款申请表。
5. **在 X 里订阅的**：官方说在 X 里订阅 The X Subscription 的，要在 X 里取消。
6. **时间点**：官方定价页写，取消要在续费前至少 24 小时操作，以免产生额外扣款。
7. **合并过账号的要注意**：官方说，合并账号是永久的，取消订阅不会拆分账号，也不会恢复你原来的 Cursor、SuperGrok 或 X Premium 订阅。

![Grok 订阅按购买渠道取消](seed:g1032-grok-cancel-by-channel.png)
*图：本站根据 [docs.x.ai 取消订阅文档](https://docs.x.ai/x-subscription/cancel) 与 [Grok FAQ](https://docs.x.ai/grok/faq) 整理的示意图*

## 一、网页订阅怎么取消

![网页订阅取消的 4 步](seed:g1032-grok-cancel-web-steps.png)
*图：本站根据 [docs.x.ai：Manage your subscription](https://docs.x.ai/x-subscription/manage) 整理的示意图*

官方文档（已切换到 The X Subscription 的账号）：

1. 用购买订阅的账号登录；
2. 打开 grok.com/dashboard，进入 **Billing & invoices**（grok.com/dashboard/billing）；
3. 在 **Current plan** 卡片上打开选项，选择取消，按提示确认。

官方说可以随时取消。同一页面还能做这些事：换档、改付款方式（Payment details）、下载发票（Invoices 标签页）、查看用量（左侧 Usage）。

如果 **Manage Subscription** 按钮点不开，官方 FAQ 的建议是：广告拦截器或其他插件可能挡住了它，换无痕窗口或另一个浏览器试试；仍然不行可以联系客服，由客服转给账单团队处理取消。

## 二、App Store、Google Play 和 X

| 购买渠道 | 取消 | 退款 |
| --- | --- | --- |
| 网页（grok.com） | grok.com 账单页自助取消 | 官方处理，提交 xAI 退款申请表，批准后通常 5 到 10 个工作日退回原支付方式 |
| Apple App Store | 在 Apple 订阅管理里取消 | 向 Apple 申请，Apple 决定 |
| Google Play | 在 Google Play 里取消 | 官方处理，同样用 xAI 退款申请表 |
| X（X Premium / The X Subscription） | 在 X 里取消 | X 负责按法律要求处理，可向 X 提交退款申请 |

几点补充：

- 苹果的订阅，官方在合并订阅的文档里写的路径是：iPhone 或 iPad 的 **设置**，点你的名字，点 **订阅**，选对应订阅，再选管理或取消；
- API 额度（credits）是另一回事，官方 FAQ 明确说 xAI API credits 不可退款；
- 如果收到一张看不懂的大额账单，官方说不一定是 API 用量，常见原因是 **SuperGrok Heavy 的年订阅**，先看购买日期和订阅记录，再联系客服核实，不要急着发起拒付；
- 网页买的订阅在 App 里看不到，或者反过来，多半只是登录了不同账号，不一定是重复扣款。

## 三、取消之前想清楚的几件事

1. **取消和降档不一样**：只是嫌贵可以考虑降档，官方说网页降档会在确认前显示变更和下次扣款，苹果降档要到下一个计费周期才生效且当期不退款（法律要求除外）；
2. **升级**：网页升级到更高档立即生效，苹果要等 Apple 确认后生效；
3. **合并过账号的**：合并是永久的，取消不会还原；
4. **重新订阅**：需要时在官方定价页或本站 [/chongzhi/grok-super](/chongzhi/grok-super) 重新开通即可。

订阅有哪几档、怎么订阅见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)，用量限制见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)，删除对话和账号见 [/guides/grok-memory-custom-instructions-privacy-training](/guides/grok-memory-custom-instructions-privacy-training)。

## 常见问题

**Q：取消后马上就不能用了吗？**
官方文档对网页订阅没有逐条写明，请以取消确认页面的提示为准；团队版里官方写明，被取消的席位在当前计费周期结束前仍然有效。

**Q：我提前取消了，能按天退吗？**
官方 FAQ 只写明了各渠道提交退款的方式，没有承诺按天退款。合并订阅时旧订阅会按剩余时间退款，那是切换场景，不是普通取消。

**Q：取消订阅后账号会被删吗？**
不会。删除账号是单独的操作，见上面链接的隐私文章。

## 参考资料

- docs.x.ai：Cancel your subscription — https://docs.x.ai/x-subscription/cancel
- docs.x.ai：Managing The X Subscription — https://docs.x.ai/x-subscription/manage
- docs.x.ai：Invoices & Refunds — https://docs.x.ai/x-subscription/invoices-and-refunds
- docs.x.ai：Upgrade or downgrade a subscription — https://docs.x.ai/x-subscription/upgrade-or-downgrade
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- Grok 官方：Pricing — https://x.ai/pricing

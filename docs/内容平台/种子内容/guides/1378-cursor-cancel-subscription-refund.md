---
title: Cursor 怎么取消订阅、能退款吗：旧套餐与 X 订阅的取消入口，14 天退款条件，App Store 订阅怎么处理
slug: cursor-cancel-subscription-refund
products: [cursor]
models: []
accountTier: OTHER
excerpt: Cursor 官方帮助中心现在分两种订阅：新的 X 订阅和以前直接在 cursor.com 订的旧套餐，取消入口不一样。本文按官方说明讲取消步骤，以及退款条件：个人套餐最近一次扣款 14 天内且本期没用过，才可能退款。
checkedOn: 2026-10-30
sources:
  - https://cursor.com/help/account-and-billing/cancel
  - https://cursor.com/help/account-and-billing/refunds
  - https://cursor.com/help/account-and-billing/pricing
verify:
  - 官方帮助中心现在同时有「The X Subscription」（新订阅，在 grok.com/dashboard/billing 管理）和「旧 Cursor 套餐」（在 cursor.com/dashboard/billing 管理）两套说明；本文按官方页面当天的写法，具体你属于哪一种以你的账单页为准
  - 退款政策页写的是个人套餐的条件，没有写具体邮箱或表单，只说「登录后联系支持」；团队套餐只写了摘要
  - 官方取消页混写了 Cursor 与 Grok Bot 的移动端订阅，本文只引用与 Cursor 相关的部分
---

> 本文根据 Cursor 官方帮助中心《Cancel your subscription》《Refunds》《Pricing and plans》整理，资料核对于 2026-10-30。套餐名称和入口更新较快，以你账号里看到的页面为准。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想取消 Cursor 订阅、不想再被扣款的人；
- 刚续费就想退款的人；
- 找不到取消入口的人。

## 结论先说

1. **先看你是哪种订阅。** 官方说，现在的新订阅是「The X Subscription」（把 Grok、Cursor、X 合在一起），新客户从这里选套餐；以前直接订的 Cursor 套餐叫旧套餐（legacy），现有用户可继续用，直到自己切换或取消。
2. **旧套餐取消：** 打开 cursor.com/dashboard/billing，点 **Manage in Stripe** 进入 Stripe 账单门户，点 **Cancel Subscription** 并确认。个人旧套餐也可以选择「安排降级」代替取消。
3. **X 订阅取消：** 打开 grok.com/dashboard/billing，在 **Current plan** 卡片的选项里选择取消，按提示确认。
4. **取消后：** 付费功能保留到当前计费周期结束，不会再扣款，之后账号回到免费版（旧账号叫 Hobby），账号和本地项目文件都保留。
5. **退款：** 个人套餐最近一次扣款，**14 天内且本期没用过订阅**，才可能退款；其他一般不可退。
6. **通过 App Store 订的**，Cursor 取消不了也退不了，要去苹果那边处理。

![Cursor 订阅在哪取消：先看你怎么订的](seed:g1378-cancel-decide.png)
*图：本站根据 [Cursor 帮助中心：取消订阅](https://cursor.com/help/account-and-billing/cancel) 整理的示意图*

## 一、取消的详细步骤

**旧 Cursor 套餐：**

1. 登录 cursor.com，打开 [cursor.com/dashboard/billing](https://cursor.com/dashboard/billing)；
2. 点 **Manage in Stripe**；
3. 点 **Cancel Subscription**，确认。

**X 订阅：**

1. 打开 [grok.com/dashboard/billing](https://grok.com/dashboard/billing)；
2. 在 **Current plan** 卡片上打开选项，选择取消；
3. 按提示确认。

**团队和企业：** 团队管理员在同一个账单页取消；成员看不到账单选项，要找管理员。未付清的发票或账号状态不一致，可能让取消失败。

**移动端订阅：** iOS 订阅由苹果管理，要在 iPhone 或 iPad 的订阅设置里取消；Cursor 无法代取消。

## 二、看不到取消按钮怎么办

官方列出几种情况：

- 套餐已经到期，没有可取消的；
- 有未付的发票：先在账单页查看，再到 Manage in Stripe 补付或重试；
- 你是团队成员，没有管理员权限；
- 你是通过 iOS 或安卓应用订的。

都不是的话，联系官方支持，带上账单页截图。取消后随时可以重新订阅，账号和设置会保留。

## 三、退款：官方条件

![Cursor 退款：官方怎么写](seed:g1378-refund-compare.png)
*图：本站根据 [Cursor 帮助中心：退款](https://cursor.com/help/account-and-billing/refunds) 整理的示意图*

官方退款政策页的要点：

- 付费套餐到期会**自动续费**，除非在续费日前取消；取消只会停止以后的扣款，**不会撤销已经处理的扣款**；
- **只对个人套餐：** 最近一次订阅付款，如果在 **14 天内**，且这个计费周期里**没有使用过**订阅，可以申请退款；官方会先审核账号，符合条件就取消订阅并退款；
- 退款按原支付方式退回，官方写的是 **5 至 10 个工作日**；
- 超出 14 天或已有使用：**一般不可退**，你要承担当前周期，但仍可以取消以停止续费；
- **按量和快速请求的费用**，已经消耗的部分不可退；
- **升级：** 抵扣额度取决于未用完的包含用量，如果已经用完，要付新套餐的全价；**降级：** 当前周期有用量时，官方不按比例退款，可以取消，或安排到下次续费时降级；
- **团队套餐：** 官方只写了摘要，账单调整可能体现为之后发票上的抵扣，具体要联系官方。

## 四、怎么申请退款

官方页面写的是「登录你的 Cursor 账号后联系支持」，没有列具体邮箱或表单，用官方帮助中心页面上的支持入口即可。申请时带上：账号邮箱、扣款金额和日期、发票号或收据、问题说明。

**App Store 订阅：** 苹果是收款方，Cursor 无法退款，要向苹果的账单支持申请。

## 五、相关文章

- 套餐、额度怎么算：[/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)；
- 发票在哪下载：[/guides/cursor-invoice-download-billing-details](/guides/cursor-invoice-download-billing-details)；
- 其他订阅的取消：[/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)、[/guides/claude-cancel-subscription-refund](/guides/claude-cancel-subscription-refund)；
- 想了解 ChatGPT 的会员，可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 常见问题

**Q：取消后马上就不能用了吗？**
不会。官方说付费功能保留到当前计费周期结束。

**Q：取消了，账号和项目会删吗？**
官方说账号和本地项目文件保留，回到免费版。

**Q：怎么知道自己是新订阅还是旧套餐？**
登录后看账单页：在 cursor.com/dashboard/billing 能看到 Manage in Stripe 的，是旧套餐；在 grok.com/dashboard/billing 管理的，是 X 订阅。拿不准就看订阅邮件和扣款名称，或联系官方。

## 参考资料

- Cursor 帮助中心：Cancel your subscription — https://cursor.com/help/account-and-billing/cancel
- Cursor 帮助中心：Refunds — https://cursor.com/help/account-and-billing/refunds
- Cursor 帮助中心：Pricing and plans — https://cursor.com/help/account-and-billing/pricing

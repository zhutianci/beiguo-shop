---
title: Cursor 怎么开发票：账单页下载发票 PDF，改公司抬头与税务信息，团队与 App Store 订阅的区别
slug: cursor-invoice-download-billing-details
products: [cursor]
models: []
accountTier: OTHER
excerpt: Cursor 的发票在 cursor.com/dashboard/billing 下载：点 Manage in Stripe 进账单门户，或直接看 Invoices 列表，发票是 PDF，需要手动下载。公司名称、地址、税务信息在 Stripe 里改，只对以后的发票生效。
checkedOn: 2026-10-30
sources:
  - https://cursor.com/help/account-and-billing/invoices
  - https://cursor.com/help/account-and-billing/billing
  - https://cursor.com/help/account-and-billing/pricing
verify:
  - 官方发票页没有说明增值税（VAT）的具体处理，也没有写本地化发票（例如中国大陆的增值税发票）的开具办法，本文不涉及
  - 官方页面上与 X 订阅相关的发票管理在 grok.com/dashboard/billing，本文只写 Cursor 旧套餐页面的步骤；你属于哪种订阅以账单页为准
  - 发票是否「自动发送到邮箱」官方没有写，只写下载是手动的
---

> 本文根据 Cursor 官方帮助中心《Invoices》《Pricing and plans》整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。**官方没有说明增值税和本地化发票的处理**，需要时请联系官方支持。

## 适用于谁

- 需要 Cursor 发票报销的人；
- 想把发票抬头改成公司名称的人；
- 团队成员，找不到账单入口的人。

## 结论先说

1. **发票在账单页：** 登录后打开 [cursor.com/dashboard/billing](https://cursor.com/dashboard/billing)。
2. **两种看法：** 点 **Manage in Stripe** 进入 Stripe 账单门户，往下看账单历史；或者就留在账单页，看 **Invoices** 列表。选一张发票，下载 PDF，官方说**下载是手动的**。
3. **按量计费的发票**也在账单页的 Invoices 列表里。
4. **改公司名称、地址、税务信息：** 在 Stripe 账单门户里改。**只对以后的发票生效，已开出的发票不能编辑**，所以要在下次扣款前改好。
5. **团队或企业套餐：** 只有团队管理员能打开账单和发票，成员要找管理员下载。
6. **通过 App Store 订的**，收据由苹果提供，不是 Cursor 开的。

![Cursor 发票在哪下载](seed:g1379-invoice-steps.png)
*图：本站根据 [Cursor 帮助中心：发票](https://cursor.com/help/account-and-billing/invoices) 整理的示意图*

## 一、下载发票的步骤

1. 打开 cursor.com 并登录，进入 [cursor.com/dashboard/billing](https://cursor.com/dashboard/billing)；
2. 点击 **Manage in Stripe**，打开 Stripe 账单门户，向下滚动到账单历史；
3. 或者直接看账单页上的 **Invoices** 列表；
4. 选中需要的发票，下载 PDF。

如果你是通过新的 X 订阅（Cursor 属于其中一部分）管理账单的，官方说明账单入口在 grok.com/dashboard/billing，包括发票。区别见 [/guides/cursor-cancel-subscription-refund](/guides/cursor-cancel-subscription-refund)。

## 二、怎么改发票抬头和税务信息

官方页面的说法：在 Stripe 账单门户里更新公司名称、地址和税务信息；**修改只影响以后开出的发票，已经开出的发票不能编辑**。所以：

- 报销需要公司抬头时，**先改信息，再等下次扣款**；
- 已经开出的发票抬头不对，官方页面没有给出重开办法，需要联系官方支持，带上账号邮箱、发票日期范围和你能看到的发票号；
- 官方页面没有说明增值税（VAT）怎么处理，也没有写本地化发票，别照网上其他说法填。

![想改发票抬头或税号，注意这几点](seed:g1379-change-decide.png)
*图：本站根据 [Cursor 帮助中心：发票](https://cursor.com/help/account-and-billing/invoices) 整理的示意图*

## 三、看不到账单入口

- **团队成员：** 官方说只有团队管理员能打开账单和发票，成员要请管理员下载；
- **订阅已经结束，账号回到免费版：** 订阅控制不再显示。联系官方支持，写明需要的发票日期范围；
- **某张发票找不到：** 登录后联系官方支持，提供账号邮箱、日期范围、能看到的发票号，团队的话再加上团队或工作区名称。

## 四、常见疑问

**Q：能自动收到发票邮件吗？**
官方发票页没有写，只写了需要手动下载。

**Q：用 App Store 订阅，发票怎么拿？**
官方说收据由苹果提供，到苹果的订阅与购买记录里查。

**Q：其他产品的发票呢？**
ChatGPT 见 [/guides/chatgpt-invoice-download](/guides/chatgpt-invoice-download)，Claude 见 [/guides/claude-invoice-receipt-download](/guides/claude-invoice-receipt-download)，OpenAI API 见 [/guides/openai-invoice-chatgpt-vs-api](/guides/openai-invoice-chatgpt-vs-api)。套餐和额度看 [/guides/cursor-usage-limits-plans](/guides/cursor-usage-limits-plans)，想开通 ChatGPT 套餐见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Cursor 帮助中心：Invoices — https://cursor.com/help/account-and-billing/invoices
- Cursor 帮助中心：Billing and payments — https://cursor.com/help/account-and-billing/billing
- Cursor 帮助中心：Pricing and plans — https://cursor.com/help/account-and-billing/pricing

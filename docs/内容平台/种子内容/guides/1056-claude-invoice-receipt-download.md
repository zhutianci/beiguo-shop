---
title: Claude 发票和收据在哪下载：Settings 里的 Invoices、邮件收据和公司抬头
slug: claude-invoice-receipt-download
products: [claude]
models: []
accountTier: PRO
excerpt: Claude Pro / Max 的发票和收据在哪找？按官方帮助中心讲清：邮箱里的「Your receipt from Anthropic」、Settings > Billing 里的 Invoices、升级和用量额度各有什么发票，以及怎么改公司名、加税号，苹果和 Google 订阅去哪找。
checkedOn: 2026-10-24
sources:
  - https://support.claude.com/en/articles/16607638-understanding-your-pro-or-max-plan-invoices
  - https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
  - https://support.claude.com/en/articles/9889408-add-or-update-your-paid-claude-account-s-tax-or-vat-id
verify:
  - 取自 2026-10-24 官方帮助中心；官方在 Invoices 部分只写了点击 View 查看，没有写单独的「下载」按钮，本文不写具体怎么保存为 PDF
  - 官方说已开出的发票不能修改或重新开具；中国大陆「发票」（增值税发票）官方未提及，本文不涉及
  - 税号、账单地址、币种的更多细则见官方对应文章，本文只写已核对的要点
---

> 本文根据 Claude 帮助中心《Understanding your Pro or Max plan invoices》《Paid plan billing FAQs》整理，资料核对于 2026-10-24。适用于**网页订阅**的 Pro 和 Max。图为本站整理的示意图。**以官方页面为准**。

## 适用于谁

- 需要报销、对账，想找 Claude 付款凭证的人；
- 收到「Your receipt from Anthropic」邮件，不知道是什么的人；
- 想在发票上写公司名、加税号的人。

## 结论先说

1. **两个地方能找到**：一是邮箱，每次扣款后会发到账单邮箱，标题是「Your receipt from Anthropic」；二是 claude.ai 的 **Settings > Billing**，在 **Invoices** 部分点对应发票旁边的 **View**。
2. **手机订阅不在这里**：通过 iOS 或 Android 应用订阅的，Anthropic 不开发票，由苹果 App Store 或 Google Play 收费，收据在你的应用商店账号里。
3. **已开出的发票不能改**：官方说已经完成的发票不能编辑，也不会重新开具；账单信息改了只对**之后**的发票生效。
4. **想写公司名**：添加或更新付款方式时，勾选 **Use a different name on invoices**。
5. 取消和退款见 [/guides/claude-cancel-subscription-refund](/guides/claude-cancel-subscription-refund)；订阅可以看 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![在哪里找 Claude 的发票和收据](seed:g1056-find-invoice-steps.png)
*图：本站根据 [Claude 帮助中心：Paid plan billing FAQs](https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs) 整理的示意图*

## 一、找发票的步骤

**方法一：邮箱**。每次扣款后，Anthropic 会把发票发到你的账单邮箱。在邮箱里搜索标题 **Your receipt from Anthropic** 即可。如果搜不到，检查垃圾邮件，并确认账单邮箱是不是你以为的那个。

**方法二：账号里**。登录 claude.ai，进入 **Settings > Billing**（网址是 claude.ai/settings/billing），找到 **Invoices** 部分，点你要看的发票旁边的 **View**。官方没有写单独的下载按钮，需要保存时用浏览器自己的保存或打印功能即可。

**手机订阅**：iOS 或 Android 订阅的发票和收据在苹果或 Google 的账号里，见 [/guides/claude-mobile-app](/guides/claude-mobile-app)。

## 二、你会收到哪几种发票

官方把它们分成三类：

- **订阅发票**：每次续费（按月或按年）开一张，直到你取消；
- **套餐变更发票**：中途升级时开，账单周期会重置，升级后立刻开发票，而不是等下次续费；
- **用量额度收据**：每次购买用量额度（包括自动充值和额度包）各开一张，和订阅分开。所以同一个月里你可能收到**两张**：一张是套餐，一张是额度。用量额度见 [/guides/claude-code-pro-max-or-api](/guides/claude-code-pro-max-or-api)。

官方文章用「invoice」称订阅和变更的扣款，用「receipt」称额度购买，但邮件标题统一写 receipt，官方没有正式区分两者，可以当作基本通用。

## 三、发票上有什么

- **按比例的费用**：中途升级时，收取新套餐一个完整周期的费用，减去旧套餐未使用部分的折算；下次续费收全价；
- **账户余额**：如果新套餐一个周期的费用低于旧套餐未用完的价值，差额存为账户余额，之后自动抵扣；
- **税**：按账单地址计算，账单地址来自付款方式里的地址；
- **应付金额**：发票总额减去已抵扣的余额，就是你的付款方式被扣的金额；
- **姓名和地址**：取自开票当时的付款方式。

Max 和 Team 的每月 API 额度**不会出现**在套餐发票上，可以在 Claude Console 的 Settings > Billing（platform.claude.com/settings/billing）里看金额和到期日；API 用量不会记到你的 Claude 套餐上。关系见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。

## 四、发票信息要改怎么办

![发票信息有误，先看这 5 点](seed:g1056-invoice-fix-check.png)
*图：本站根据 [Claude 帮助中心：Understanding your Pro or Max plan invoices](https://support.claude.com/en/articles/16607638-understanding-your-pro-or-max-plan-invoices) 整理的示意图*

- 在 **Settings > Billing** 点付款方式旁边的 **Update**，输入新的信息再点 **Update**，新方式会在下次续费时使用；
- 想在发票上写公司名：添加或更新付款方式时勾选 **Use a different name on invoices**；
- 税号或 VAT ID：可以添加到付费账号，具体步骤见官方《Add or update your paid Claude account's tax or VAT ID》；
- 官方的说明是：已开出的发票改不了，所以要先改好再续费；
- **换订阅币种**：官方写的流程是，先把套餐设为到期后取消，等当前周期结束，再按你所在地区提供的币种选项重新购买 Pro 或 Max。

**换银行卡**：官方说没有单独的「删除」按钮，更新后新卡成为之后续费的默认方式，旧卡不会再被扣，但可能仍保存在支付处理方那里，想彻底删除要联系官方客服。

## 常见问题

**Q：只有邮件，没有 PDF 吗？**
官方没有写 PDF 下载。发票在邮件和 Settings > Billing 的 Invoices 里查看。

**Q：能开中国大陆的增值税发票吗？**
官方帮助中心的相关文章没有提到，本文不作回答，需要的话向官方客服确认。

**Q：为什么这个月有两张收据？**
一张是订阅，一张是用量额度购买，见上文。

**Q：忘了用的哪个邮箱？**
邮件发到的是账单邮箱；如果没有，也试试你用过的其他邮箱，官方在「付了款却显示免费版」的排查里也建议先检查是不是用了别的邮箱登录。

## 参考资料

- Claude 帮助中心：Understanding your Pro or Max plan invoices — https://support.claude.com/en/articles/16607638-understanding-your-pro-or-max-plan-invoices
- Claude 帮助中心：Paid plan billing FAQs — https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
- Claude 帮助中心：Add or update your paid Claude account's tax or VAT ID — https://support.claude.com/en/articles/9889408-add-or-update-your-paid-claude-account-s-tax-or-vat-id

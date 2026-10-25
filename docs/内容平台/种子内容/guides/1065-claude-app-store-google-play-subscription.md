---
title: Claude 订阅用 Google Pay、Apple 内购怎么管理：手机应用订阅的取消、退款和发票
slug: claude-app-store-google-play-subscription
products: [claude]
models: []
accountTier: PRO
excerpt: 在 Claude 手机应用里用苹果或 Google Play 订阅，怎么管理？按官方帮助中心：谁收款、怎么取消、退款找谁、发票在哪、用量额度怎么买；官方没有提到 Google Pay 这个名字，只说支付方式取决于苹果或 Google。
checkedOn: 2026-10-24
sources:
  - https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
  - https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription
  - https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan
  - https://support.claude.com/en/articles/16607638-understanding-your-pro-or-max-plan-invoices
  - https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans
  - https://support.claude.com/en/articles/9612892-how-do-i-sign-up-for-claude-pro-on-claude-for-android
  - https://support.claude.com/en/articles/9266495-how-do-i-sign-up-for-claude-pro-on-the-claude-app-for-ios
verify:
  - 官方在 Android、iOS 订阅文章里只写了「Upgrade to Pro」后「按提示完成应用内购买」，没有写价格、具体支付方式，也没有出现 Google Pay 这个名字；本文不对「Google Pay 能不能付」作结论，以 Google Play 结账页显示的方式为准
  - 官方说明手机应用商店的价格可能与网页订阅不同；各地区价格和税费以应用商店结账页为准
  - 用量额度「手机订阅者只能在网页版启用和购买」取自 Extra usage 官方文章；退款、取消、发票规则取自 2026-10-24 官方帮助中心
---

> 本文根据 Claude 帮助中心的《Paid plan billing FAQs》《Cancel your Pro or Max subscription》《Request a refund for a paid Claude plan》《Understanding your Pro or Max plan invoices》和用量额度、手机应用订阅文章整理，资料核对于 2026-10-24。图为本站整理的示意图。**以官方页面和应用商店显示的为准**。

## 适用于谁

- 在 Claude 手机应用里用苹果内购或 Google Play 订阅，想知道怎么管理的人；
- 搜「claude 订阅 google pay」，想知道能不能用 Google Pay 付款的人；
- 手机订阅后想取消、退款、找发票的人。

网页订阅的取消和退款，见 [/guides/claude-cancel-subscription-refund](/guides/claude-cancel-subscription-refund)；发票，见 [/guides/claude-invoice-receipt-download](/guides/claude-invoice-receipt-download)。

## 结论先说

1. **手机应用里的订阅是应用内购买**：官方说明，在 iOS 和 Android 应用里点头像、进设置、点 **Upgrade to Pro**，按提示完成应用内购买。这时收款的是苹果 App Store 或 Google Play，不是 Anthropic。
2. **关于 Google Pay：官方没有提到这个名字。** 官方只说，网页订阅只接受信用卡或借记卡，应用订阅则使用苹果或 Google 提供的支付方式。你能用什么付款，以 Google Play 结账页显示的为准。
3. **取消要在订阅的平台上做**：应用里点头像 → **Billing** → **Manage subscription**；如果已经删了应用，用苹果或 Google 官方的订阅管理方式取消。
4. **退款分渠道**：苹果的扣款 Claude 客服无法退，要向苹果申请；Google Play 的由 Claude 客服核对资格。
5. **发票和收据由苹果或 Google 开**，不在 Claude 账号里。
6. 需要新开通、而又想用网页订阅的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![网页订阅和手机应用订阅有什么不同](seed:g1065-web-vs-app-billing.png)
*图：本站根据 [Claude 帮助中心：Paid plan billing FAQs](https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs) 等整理的示意图*

## 一、怎么在手机应用里订阅

官方的步骤（iOS 和 Android 相同）：

1. 打开 Claude 应用；
2. 点右上角你的头像或首字母；
3. 在设置页点 **Upgrade to Pro**；
4. 按支付提示完成应用内购买。

官方这两篇文章**没有写**价格、具体支付方式，也没有写如何管理、升降级、恢复购买。官方《What is the Pro plan?》只说：价格见 claude.ai/upgrade 或你所在地区应用商店里显示的价格；Pro 在美国是每月 20 美元，各地区价格不同，有的含税、有的结账时加税。官方对 Max 的说明还提到，应用商店里的价格可能与网页订阅价不同，具体见 [/guides/claude-pro-vs-max-difference](/guides/claude-pro-vs-max-difference)。

## 二、怎么取消

![手机订阅出问题，先找谁](seed:g1065-app-subscription-who-to-ask.png)
*图：本站根据 [Claude 帮助中心](https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription) 的取消、退款、发票、用量额度文章整理的示意图*

官方《Cancel your Pro or Max subscription》：

- **iOS**：打开 Claude 应用，点右上角头像，选 **Billing**，选 **Manage subscription**，按提示取消；如果已经删了应用，用苹果官方「取消订阅」说明操作；
- **Android**：同样是头像 → **Billing** → **Manage subscription**；如果已经删了应用，用 Google 官方「在 Google Play 取消、暂停或更改订阅」说明操作；
- 取消在**当前计费周期结束时**生效，官方建议在下次扣费前至少 24 小时取消。

## 三、怎么退款

官方《Request a refund for a paid Claude plan》：

- **苹果（iOS）**：由苹果处理付款，Claude 客服无法查看或退款。要用购买时的苹果账号登录 reportaproblem.apple.com，选 **I'd like to** → **Request a refund**，选原因，选你的 Claude 订阅，提交。是否退款由苹果决定。**申请退款不等于取消订阅**，要另外取消，否则还会继续扣款；
- **Google Play（Android）**：订阅仍有效时，联系 Claude 客服，由客服核对资格，首条消息里写清细节；订阅已失效时，用 Google Play 绑定的邮箱，或 GPA 订单号（在 Google Play 收据上，形如 GPA.xxxx-xxxx-xxxx-xxxxx）联系客服。退款可能要几天才到账。

退款的总原则（付款一般不可退，欧洲经济区和英国 14 天内可申请，按用量折算）见 [/guides/claude-cancel-subscription-refund](/guides/claude-cancel-subscription-refund)。

## 四、发票和收据

官方《Understanding your Pro or Max plan invoices》说明：通过 iOS 或 Android 应用订阅的，Anthropic 不开发票，由苹果 App Store 或 Google Play 向你收费，收据在你的应用商店账号里。发票上要不要写公司名、税号，官方没有说明应用商店订阅怎么处理，请向苹果或 Google 确认。

## 五、手机订阅怎么开用量额度

官方《Extra usage / Manage usage credits for paid Claude plans》说明：如果你是通过 iOS 或 Android 应用订阅的，只能在 **Claude 网页版**上启用和购买用量额度，并且要先在网页上添加付款方式。额度怎么算见 [/guides/claude-code-pro-max-or-api](/guides/claude-code-pro-max-or-api) 和 [/guides/claude-usage-limits](/guides/claude-usage-limits)。

## 六、想从应用订阅换成网页订阅

官方没有写「直接迁移」的功能。官方帮助中心写明的相关事实是：账单日不能直接改，可以取消当前订阅后在想要的日期重新订阅；换订阅币种也需要先设为到期取消、等周期结束再重新购买。所以如果想从应用订阅换成网页订阅，思路是：在应用商店取消续费，等当前周期结束，再到网页上重新订阅。具体细节请向官方客服确认。手机应用的其他说明见 [/guides/claude-mobile-app](/guides/claude-mobile-app)。

## 常见问题

**Q：Claude 订阅能用 Google Pay 付款吗？**
官方页面没有提到 Google Pay。应用订阅走的是 Google Play 的支付，能用什么方式看 Google Play 结账页。

**Q：为什么 App 里的价格和网页不一样？**
官方说明应用商店价格可能与网页价不同，也受地区和税费影响。

**Q：已经退款了，订阅还在扣吗？**
苹果的退款申请不会自动取消订阅，要另外取消；官方明确提醒。

**Q：发票哪里下？**
苹果或 Google 的账号里，不在 Claude 账号里。

## 参考资料

- Claude 帮助中心：Paid plan billing FAQs — https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
- Claude 帮助中心：Cancel your Pro or Max subscription — https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription
- Claude 帮助中心：Request a refund for a paid Claude plan — https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan
- Claude 帮助中心：Understanding your Pro or Max plan invoices — https://support.claude.com/en/articles/16607638-understanding-your-pro-or-max-plan-invoices
- Claude 帮助中心：Extra usage for paid Claude plans — https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans

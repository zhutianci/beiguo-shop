---
title: Claude 怎么取消订阅、能退款吗：网页、iOS、Android 取消步骤和退款规则
slug: claude-cancel-subscription-refund
products: [claude]
models: []
accountTier: PRO
excerpt: Claude Pro / Max 怎么取消订阅？按官方帮助中心讲清网页、iOS、Android 的取消入口，取消什么时候生效，能不能退款（欧洲经济区和英国 14 天、苹果和 Google Play 的特殊规则），以及怎么提交退款申请。
checkedOn: 2026-10-24
sources:
  - https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription
  - https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan
  - https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
verify:
  - 取消步骤、「周期结束时生效」「下次扣费前至少 24 小时取消」取自 2026-10-24 官方《Cancel your Pro or Max subscription》；该文没有写取消后数据怎么处理、怎么重新订阅、年付的特殊条款，本文也不写
  - 退款规则取自官方《Request a refund for a paid Claude plan》：总则是付款不可退，除非用户条款规定或法律要求；欧洲经济区和英国 14 天按用量折算；其他地区官方没有写通用期限
  - 苹果、Google Play 的退款渠道取自同一篇官方文章；各平台的处理时间以平台为准
---

> 本文根据 Claude 帮助中心《Cancel your Pro or Max subscription》《Request a refund for a paid Claude plan》《Paid plan billing FAQs》整理，资料核对于 2026-10-24。界面名称以官方英文界面为准。图为本站整理的示意图。**规则以官方页面和你下单时显示的为准**。

## 适用于谁

- 想取消 Claude Pro 或 Max 自动续费的人；
- 不确定是在网页、苹果还是 Google Play 订的，不知道去哪取消的人；
- 想知道扣了款能不能退、怎么申请的人。

## 结论先说

1. **在哪个平台订的，就在哪个平台取消**：网页（claude.ai 和桌面版）在 Settings > Billing 里取消；iOS 和 Android 应用在 Billing > Manage subscription 里。
2. **取消不会立刻停用**：官方说取消在**当前计费周期结束时**生效，到期前你仍然可以使用付费套餐。想避免下一期扣款，官方建议**在下次扣费日前至少 24 小时**取消。
3. **退款不是默认的**：官方总则是所有付款不可退款，除非用户条款规定可退，或法律要求。欧洲经济区和英国的用户购买后 **14 天内**可以申请退款，按已用量折算；其他地区官方没有写通用期限，需要通过退款申请流程判断。
4. **通过苹果订阅的，要找苹果退款**，Claude 客服无法处理 App Store 的扣款。
5. 不确定要不要继续订，可以先看 [/guides/claude-pro-vs-max-difference](/guides/claude-pro-vs-max-difference) 和 [/guides/claude-usage-limits](/guides/claude-usage-limits)；以后需要再订，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

![Claude 订阅在哪个平台买，就在哪个平台取消](seed:g1055-cancel-by-platform.png)
*图：本站根据 [Claude 帮助中心：Cancel your Pro or Max subscription](https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription) 整理的示意图*

## 一、取消订阅的步骤

**网页（claude.ai）和桌面版**：

1. 在浏览器登录，或打开桌面版；
2. 点左下角的头像或名字；
3. 选 **Settings**；
4. 进入 **Settings > Billing**；
5. 点 **Cancel** 按钮。

**iOS**：打开 Claude 应用，点右上角头像 → 选 **Billing** → 选 **Manage subscription**，按提示取消。如果已经删除了应用，用苹果官方的订阅管理方式取消。

**Android**：打开 Claude 应用，点右上角头像 → **Billing** → **Manage subscription**，按提示取消。如果已经删除了应用，用 Google Play 的订阅管理方式取消。

不确定自己是哪个渠道订的：回忆一下是在网页付款，还是在应用里用苹果或 Google 账号付款。官方《Paid plan billing FAQs》说明，网页订阅只接受信用卡或借记卡，应用订阅则用苹果或 Google 提供的支付方式。手机端订阅的更多管理说明见 [/guides/claude-mobile-app](/guides/claude-mobile-app)。

## 二、取消之后会怎样

官方文章写明的几点：

- 套餐保留到当前计费周期结束；
- Max 和 Team 附带的**每月 API 额度**不是购买来的，所以不能退款，到每个计费周期结束时作废；取消或退款之后，**新的每月额度不再发放**，已有额度在到期前仍可使用；API 额度的关系见 [/guides/claude-subscription-vs-api](/guides/claude-subscription-vs-api)。

官方这篇文章**没有写**的：取消之后你的对话数据会怎么处理、之后怎么重新订阅、年付套餐有没有特殊的取消和退款条款。需要确认的，直接查官方帮助中心或联系官方客服，不要自己猜。如果想导出对话，见 [/guides/claude-export-chat-data](/guides/claude-export-chat-data)。

## 三、能不能退款

![想退款，先看你属于哪种情况](seed:g1055-refund-cases.png)
*图：本站根据 [Claude 帮助中心：Request a refund for a paid Claude plan](https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan) 整理的示意图*

官方《Request a refund for a paid Claude plan》的要点：

- **总则**：所有付款不可退款，除非用户条款规定可退，或法律要求退款；
- **欧洲经济区和英国**：购买后 14 天内可以申请退款，选项可能出现在 Settings 里，退款按已用量折算；
- **其他地区**：官方没有写通用的退款期限，通过退款申请流程检查资格；
- **从 Pro / Max 升级到 Team**：按未使用的计费期间自动按比例退款，不需要申请，一般在 Team 付款约 24 小时后发出，银行入账可能再多几个工作日；
- **银行拒付**：已经向银行发起拒付的，在拒付处理期间客服无法退款，要么继续和银行处理，要么撤回拒付后让客服处理。

**苹果（iOS）**：由苹果收款，Claude 客服无法查看和退款。官方给的办法是：用购买时的苹果账号登录 reportaproblem.apple.com → 选「I'd like to」→「Request a refund」→ 选原因 → 选你的 Claude 订阅 → 提交。是否退款由苹果决定。**申请退款不等于取消订阅**，要另外取消，否则还会继续扣款。

**Google Play（Android）**：订阅仍有效时，联系客服由客服核对资格，第一条消息里写清细节；订阅已失效时，用 Google Play 绑定的邮箱或 GPA 订单号（在 Google Play 收据上，形如 GPA.xxxx-xxxx-xxxx-xxxxx）联系客服。退款可能要几天才到账。

**打不开账号**：官方说可以用另一个邮箱联系客服，抄送与那个无法访问的账号相关联的邮箱，要求取消付费套餐并申请退款。

## 四、网页订阅怎么提交退款申请

![网页订阅申请退款的步骤](seed:g1055-refund-request-steps.png)
*图：本站根据 [Claude 帮助中心：Request a refund for a paid Claude plan](https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan) 整理的示意图*

1. 登录后点左下角的头像或名字；
2. 选 **Get help**，打开右侧的消息窗口；
3. 点 **Send us a message**；
4. 点 **Accept**，然后选择 **Claude Refund Request**；
5. 选择退款原因；
6. 按提示检查是否符合条件；
7. 符合条件的话，在窗口里继续，取消套餐并办理退款。

## 常见问题

**Q：我取消了，为什么还能用？**
正常。取消在当前计费周期结束时才生效，期间套餐仍然有效。

**Q：取消之后还会扣款吗？**
官方建议在下次扣费日前至少 24 小时取消，才能避免下一期扣款。

**Q：账号被封了能退款吗？**
这是另一类情况，见 [/guides/claude-account-disabled-appeal](/guides/claude-account-disabled-appeal)。

**Q：发票在哪下载？**
见 [/guides/claude-invoice-receipt-download](/guides/claude-invoice-receipt-download)。

**Q：账单日可以改吗？**
官方《Paid plan billing FAQs》说不能直接改；可以取消当前订阅后，在你想要的日期重新订阅，开始新的月度周期。

**Q：付了款账号却显示免费版？**
官方建议先检查是否用了别的邮箱登录，再检查是否因付款失败被降级：看 Settings > Billing 里的付款状态，必要时更新付款方式。

## 参考资料

- Claude 帮助中心：Cancel your Pro or Max subscription — https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-subscription
- Claude 帮助中心：Request a refund for a paid Claude plan — https://support.claude.com/en/articles/12386328-request-a-refund-for-a-paid-claude-plan
- Claude 帮助中心：Paid plan billing FAQs — https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs

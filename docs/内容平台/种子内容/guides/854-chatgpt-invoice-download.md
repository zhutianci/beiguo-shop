---
title: ChatGPT 发票在哪下载：Plus / Pro 账单查询、App Store 收据、扣款时间与发票抬头怎么改
slug: chatgpt-invoice-download
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT Plus、Pro 的发票（Invoice）在哪下载？在网页订阅的，到设置的账单页进入账单门户，在 Invoice History 里下载；在 App Store 或 Google Play 订阅的，发票不在 ChatGPT 里。本文按 OpenAI 帮助中心讲清各渠道的位置、每月扣款日怎么定、发票抬头和税号怎么改，以及找不到发票时的排查。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices
  - https://help.openai.com/en/articles/9030143-how-do-i-obtain-my-chatgpt-subscription-invoice-if-i-subscribed-from-the-apple-app-store
  - https://help.openai.com/en/articles/8156167-invoice-dates-for-chatgpt-and-api-billing
  - https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/11173733-taiwan-vat-and-egui
verify:
  - 设置里账单入口有两种写法：新文章写 Settings → Billing，旧截图是 Settings → Account → Payment → Manage；两种都写进了正文，以实际界面为准
  - Google Play 订阅的收据位置，官方只写「查看应用商店的购买记录」，没有逐步说明
---

> 本文根据 OpenAI 帮助中心《How can I find my past ChatGPT invoices?》《Updating billing information, Tax ID, and VAT ID》等文章整理，资料核对于 2026-10-13；截图引用自 OpenAI 帮助中心，为英文界面，画面里的套餐内容和金额是官方示例账号当时的情况。

## 适用于谁

- 订了 ChatGPT Plus 或 Pro，需要下载发票（Invoice）用来报销、记账的人；
- 在设置里找不到账单，或者 Invoice History 是空的人；
- 通过 iPhone App Store、Google Play 订阅，不知道收据去哪找的人；
- 想在发票上加公司名称、地址或税号的人。

先说明一点：这里说的「发票」是 OpenAI 开具的英文 **Invoice（账单 / 付款凭证）**，不是国内的增值税发票。能否用于报销，要看你所在单位的财务要求。

## 结论先说

1. **在网页（chatgpt.com）订阅的 Plus / Pro**：**Settings（设置）→ Billing（账单）**；如果你的界面里看到的是 **Settings → Account（账号）→ Payment（付款）→ Manage（管理）**，点它。两条路都通向同一个**账单门户**，在 **Invoice History（发票历史）** 里下载每一期的发票。
2. **在 App Store / Google Play 订阅的**：发票**不会出现在 ChatGPT 里**，要去 Apple 或 Google 的购买记录里找。
3. **扣款日 = 订阅那天的日期**，每月同一天扣，官方不支持修改。
4. **改抬头、加税号只对以后的发票生效**，已经开出的不会自动更正。
5. **Business（团队版）**：只有工作区所有者能看发票，位置在 Workspace settings → Billing → Invoices。

![ChatGPT 发票在哪找：按订阅渠道对照的示意图](seed:g854-invoice-where.png)
*图：本站根据 [OpenAI 帮助中心：How can I find my past ChatGPT invoices?](https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices) 等文章整理的示意图*

## 一、网页订阅的 Plus / Pro：下载步骤

1. 用浏览器登录 chatgpt.com，点头像打开 **Settings（设置）**；
2. 进入 **Billing（账单）** 标签页；界面是旧样式的，进入 **Account（账号）**，在 **Payment（付款）** 一行点 **Manage（管理）**；

![ChatGPT 设置的 Account 页面，Payment 一行右侧的 Manage 按钮被圈出（英文界面，官方示例账号）](seed:g854-account-payment-manage.jpg)
*图片来源：[OpenAI 帮助中心：How can I find my past ChatGPT invoices?](https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices)*

3. 页面会跳到账单门户，往下找到 **Invoice History（发票历史）**；
4. 每一期扣款对应一行，点开即可查看并下载。

![账单门户里的 Invoice History 列表，每行显示日期、金额、Paid 状态和订阅名称（官方示例账号 2025 年的记录，金额仅为示例）](seed:g854-invoice-history.png)
*图片来源：[OpenAI 帮助中心：How can I find my past ChatGPT invoices?](https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices)*

## 二、App Store 订阅：到 Apple 那边找收据

官方给的 iPhone / iPad 路径：

1. 打开系统的 **设置**；
2. 点顶部自己的名字，进入 Apple 账户；
3. 选 **媒体与购买项目（Media & Purchases）→ 查看账户（View Account）**；
4. 验证后点 **购买记录（Purchase History）**；
5. 找到 ChatGPT 订阅，查看收据和详情。

另外，每次续费 Apple 都会往你 **Apple 账户绑定的邮箱**发一封收据邮件，在邮箱里搜 Apple 的收据邮件通常更快。电脑上也可以在 iTunes 的 **Account → View My Account → Purchase History → See All** 里找。

**Google Play 订阅**同理：官方只说明这类收据不会出现在 ChatGPT 的发票历史里，要到应用商店的购买记录里查。

## 三、发票历史是空的，或者找不到某一期

按官方的排查顺序：

1. **确认登录的是正确的账号或工作区**。用 Google 登录和用邮箱密码登录可能是两个不同的账号，订阅只在其中一个上，见 [/guides/chatgpt-change-login-method](/guides/chatgpt-change-login-method)；
2. **确认是不是通过 App Store / Google Play 订阅的**，是的话按上一节去应用商店找；
3. 切换账号、查过应用商店之后还是没有，带上**账号邮箱**联系客服。

想搞清楚自己到底是在哪个渠道订阅的，可以看 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription) 里「先弄清是在哪买的」一节。

## 四、扣款时间怎么定

官方说明：自助开通、按月计费的 ChatGPT 订阅，**在你订阅的那个日期循环扣款**。比如 12 号订阅，以后每个月 12 号扣款，发票日期也跟着这个周期走。**OpenAI 不支持更改发票日期**。

另外，ChatGPT 订阅和 API 用量是**两套独立的账单系统**：API 的费用在 platform.openai.com 的账单页里看，不会出现在 ChatGPT 的发票历史中，见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

## 五、发票抬头、地址和税号怎么改

个人账号的步骤：

1. 打开 chatgpt.com，点头像进入 **Settings**；
2. 选 **Billing** 标签页；
3. 在 **Billing information（账单信息）** 下点 **Edit（编辑）**；
4. 修改账单信息，需要的话填入 **Tax ID（税号）**；
5. 点 **Save（保存）**。

界面是旧样式的：**Settings → Account → Payment → Manage** 进入账单门户，在 Billing information 下点 **Update information**。

![修改 ChatGPT 发票抬头与税号的步骤示意图](seed:g854-billing-info-steps.png)
*图：本站根据 [OpenAI 帮助中心：Updating billing information, Tax ID, and VAT ID](https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id) 整理的示意图*

三点注意：

- **只影响以后的发票**。已开出的发票想更正，要通过帮助中心的聊天窗口联系客服，提供发票号、需要改的内容，以及希望显示的抬头、地址和税号。官方明说会审核能否重开，**不保证**一定重开；
- 填写的税号如果被判定无效，可能随时被移除，并按规定加收税款；
- **账单邮箱可以和登录邮箱不同**。发票和收据发到账单邮箱，登录用登录邮箱，别混淆。

**台湾地区用户**：官方说明自 2025 年 5 月 1 日起，对没有在账号里填写台湾统一编号（VAT ID）的台湾客户加收 5% 营业税；如被收取，电子发票（eGUI）会由 `noreply@tax.openai.com` 发到账号邮箱，也可以在财政部电子发票平台查询下载。

## 常见问题

**Q：发票上的金额为什么和订阅页显示的价格不一样？**
部分国家和地区会依法加收税款，税额会单独体现在发票上。具体以你的发票为准。

**Q：我取消订阅了，还能下载以前的发票吗？**
官方文章没有专门说明。只要还能登录原账号并进入账单页，就先去 Invoice History 看；进不去或没有记录时，带上账号邮箱和需要的账期联系客服。

**Q：一个月被扣了两次是怎么回事？**
最常见的是在网页和应用商店各订了一次，官方提醒多个平台的订阅会分别扣费。处理办法见 [/guides/chatgpt-app-store-google-play-subscription](/guides/chatgpt-app-store-google-play-subscription)。

**Q：Business 版的发票谁能看？**
只有工作区所有者（owner）。位置在 **Workspace settings → Billing → Invoices**。团队版和个人版的区别见 [/guides/chatgpt-business-vs-plus](/guides/chatgpt-business-vs-plus)。

## 参考资料

- OpenAI 帮助中心：How can I find my past ChatGPT invoices? — https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices
- OpenAI 帮助中心：How do I obtain my ChatGPT subscription invoice if I subscribed from the Apple App Store? — https://help.openai.com/en/articles/9030143-how-do-i-obtain-my-chatgpt-subscription-invoice-if-i-subscribed-from-the-apple-app-store
- OpenAI 帮助中心：Invoice dates for ChatGPT and API billing — https://help.openai.com/en/articles/8156167-invoice-dates-for-chatgpt-and-api-billing
- OpenAI 帮助中心：Updating billing information, Tax ID, and VAT ID — https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id
- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：Taiwan VAT and eGUI — https://help.openai.com/en/articles/11173733-taiwan-vat-and-egui

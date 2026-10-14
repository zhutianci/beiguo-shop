---
title: ChatGPT 怎么删除或更换付款方式（信用卡）：Billing 里没有 Remove 删不掉怎么办
slug: chatgpt-remove-change-payment-method
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 想删除已保存的信用卡、换一张卡？网页版在 Settings 的 Billing 里，点卡片的 ••• 选 Remove。删除不会取消订阅，要先加新卡再删旧卡。本文讲清只显示 Edit、取消后卡还在、auto-reload、有未付账单等删不掉的情况。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/12362718-removing-a-payment-method
  - https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
verify:
  - 官方删除文章只写了「先添加替代的付款方式」，没有逐步写添加新卡的按钮位置；正文只说在同一个账单页添加，并引用账单门户截图里的 Add payment method
  - Settings → Billing 与 Settings → Account → Payment → Manage 两种入口官方都写了，界面在调整，以你实际看到的为准
  - 官方文章里没写 Free 账号删除保存的卡是否有时间限制；原文只说 Free 账号也可能有已保存的付款方式
---

> 本文根据 OpenAI 帮助中心《Removing a payment method》《Updating billing information, Tax ID, and VAT ID》等文章整理，资料核对于 2026-10-14。截图引用自 OpenAI 帮助中心，为英文界面，画面里的卡号末四位是官方的示例数据。

## 适用于谁

- 想把 ChatGPT 上保存的信用卡删掉的人；
- 卡过期、换了新卡，想更换付款方式的人；
- 在 Settings 里找不到 Remove，只看到 Edit，或者点了删除没反应的人；
- 取消了订阅，卡还留在账号里的人。

## 结论先说

1. **删除付款方式不等于取消订阅。** 官方明说：删除付款方式不会取消订阅、不会清除历史发票，也不会撤销已经发生的扣款。要停止续费，先看 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)。
2. **还要继续付费的话，先加新卡，再删旧卡。** 官方的原话是：为避免付费服务中断，先添加替代的付款方式再删除旧的。
3. **网页版个人账号**：**Settings（设置）→ Billing（账单）**，在 **Payment methods** 下点卡片的 **•••**，选 **Remove（删除）**。
4. **只显示 Edit、没有 Remove**，通常是因为这张卡被标成了 **Default（默认）**：先添加另一张卡，对新卡选 **Set as default**，再回来删旧的。
5. **在 iPhone / 安卓 App 里订阅的，扣款走苹果或谷歌**，这里的步骤改不了应用商店里的付款方式，要到 Apple 账号或 Google Play 账号里改。

![删除 ChatGPT 已保存付款方式的 4 个步骤示意图](seed:g863-remove-payment-steps.png)
*图：本站根据 [OpenAI 帮助中心：Removing a payment method](https://help.openai.com/en/articles/12362718-removing-a-payment-method) 整理的示意图*

## 一、网页版：删除或更换已保存的卡

官方对个人 ChatGPT 账号给的步骤（Free 账号也可能保存着付款方式，同样适用）：

1. 在网页上进入 **Settings → Billing**；
2. 找到 **Payment methods（付款方式）**，点要删除的那张卡的 **more options（更多选项）菜单 •••**；
3. 选择 **Remove**。如果没有这一项，看下面第三节。

**更换一张新卡**就是两件事合在一起做：先在同一个账单页添加新的付款方式，再把旧卡设为非默认并删除。新卡如果没有自动成为默认，选它的 **Set as default**。

### 界面不一样：Account 设置里有 Payment

官方说明，有些账号用的是账单门户，Account 设置里会出现 **Payment** 一行：

1. **Settings → Account**；
2. 在 **Payment** 一行点 **Manage（管理）**，打开账单门户；
3. 在门户里点付款方式旁边的 **×** 删除。

![ChatGPT 设置的 Account 页面，Payment 一行右侧的 Manage 按钮被圈出（英文界面，官方示例账号）](seed:g854-account-payment-manage.jpg)
*图片来源：[OpenAI 帮助中心：How can I find my past ChatGPT invoices?](https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices)*

![账单门户里的 Payment method 区域，卡片右侧的 × 被箭头标出，下面有 Add payment method（官方示例数据）](seed:g863-billing-portal-remove-x.png)
*图片来源：[OpenAI 帮助中心：Removing a payment method](https://help.openai.com/en/articles/12362718-removing-a-payment-method)*

门户里也有 **Add payment method** 按钮，用来添加新卡。

## 二、改的是账单名称和地址，不是卡

有人想换的其实是账单上的姓名、地址或税号，不是卡本身。这类入口不同：**Settings → Billing → Billing information → Edit**，改完点 **Save**；在 Account 设置里有 Payment 的账号，是 **Payment → Manage → Update information**。官方提醒，改账单信息**只影响以后的发票**，已经开出的不会改，详见 [/guides/chatgpt-invoice-download](/guides/chatgpt-invoice-download)。

## 三、删不掉，是为什么

![ChatGPT 付款方式删不掉的几种情况与官方处理方式对照图](seed:g863-cannot-remove-causes.png)
*图：本站根据 [OpenAI 帮助中心：Removing a payment method](https://help.openai.com/en/articles/12362718-removing-a-payment-method) 整理的示意图*

官方列出的几种情况：

**1. 菜单里只有 Edit**
卡被标成 Default 时，菜单可能只给 Edit。先添加另一张付款方式，对新的选 Set as default，再删旧的。如果你想删的是唯一一张卡，而界面里又没有任何删除入口，官方的说法是联系客服。

**2. 取消订阅后卡还在**
有效的订阅，或者**取消还没生效**，都可能阻止删除。先去看取消状态和当前计费周期什么时候结束。如果计划已经结束，或账号已经是 Free，仍然没有删除入口，联系客服。

**3. 提示这张卡用于 auto-reload**
点 **Manage auto-reload**，选另一种付款方式，或关闭自动充值，再回来删卡。（auto-reload 是 API 平台的自动充值功能。）

**4. 有未付账单或付款失败**
未结清的费用会阻止删除。如果这笔费用你认可，按账单设置里的说明付清，或更新付款方式；解决不了就联系客服。

**5. 根本打不开账单设置**
Business 工作区的付款方式只有**工作区所有者**能管，让所有者来处理；你是所有者但工作区已停用或账单设置打不开，联系客服。API 账单要确认选对了组织、有管理账单的权限。

## 四、其他渠道的付款方式在哪改

- **Business 工作区**：切换到使用这张卡的工作区，**Workspace settings → Billing → Plan → Manage plan → Payment method**，在门户里用 × 删除。工作区所有者变更时，要和新所有者商量好替代付款方式再删。
- **API 平台**：用有账单权限的账号登录，选对组织，**Billing → Payment methods**，在要删的卡上点 **Delete**；默认卡的 Delete 不可用时，先添加另一张卡并 **Set as default**。
- **App Store / Google Play 订阅**：付款方式属于你的 Apple 账号或 Google Play 账号，要在苹果或谷歌那边改。订阅归谁管，见 [/guides/chatgpt-app-store-google-play-subscription](/guides/chatgpt-app-store-google-play-subscription)。

## 联系客服前，准备这些

官方建议附上：

- 登录用的邮箱；
- 付款方式属于个人 ChatGPT、Business 工作区还是 API 组织；
- 你的套餐或取消状态、缺失的选项或确切的报错、已经试过的步骤；
- 隐藏了敏感信息的截图。

**不要发完整卡号、安全码、密码或验证码。** 联系方式见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。看到不认识的扣款，官方有单独的「未识别扣款」说明，不要用这篇的流程处理。

## 常见问题

**Q：删了卡，下个月还会扣费吗？**
删除付款方式不会取消订阅。订阅仍有效时，到了续费日会尝试扣款，没有可用的付款方式就可能续费失败。要停掉续费，请取消订阅。

**Q：能不能不留任何付款方式？**
官方文章只写了 Free 账号也可能保存着付款方式，没有写必须保留。订阅有效期间，续费需要可用的付款方式，所以先加新卡再删旧卡最稳妥。

**Q：不确定是不是网页订阅，怎么办？**
看订阅是在哪买的：网页（chatgpt.com）买的，用本文；在 App 里买的，归苹果或谷歌管。同一个账号在多个平台订阅会产生各自的扣款，官方也有专门说明。

**Q：支持哪些卡和付款方式？**
见 [/guides/chatgpt-payment-methods-supported](/guides/chatgpt-payment-methods-supported)。

## 参考资料

- OpenAI 帮助中心：Removing a payment method — https://help.openai.com/en/articles/12362718-removing-a-payment-method
- OpenAI 帮助中心：Updating billing information, Tax ID, and VAT ID — https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id
- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：Canceling your ChatGPT subscription — https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
- OpenAI 帮助中心：How can I find my past ChatGPT invoices?（Account 页面截图） — https://help.openai.com/en/articles/12356340-how-can-i-find-my-past-chatgpt-invoices

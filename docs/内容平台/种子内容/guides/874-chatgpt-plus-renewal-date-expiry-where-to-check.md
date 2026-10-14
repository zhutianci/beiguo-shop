---
title: ChatGPT Plus 到期时间、续费日在哪看：网页、iPhone、安卓分别怎么查，订阅页「无法加载」怎么办
slug: chatgpt-plus-renewal-date-expiry-where-to-check
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT Plus 什么时候到期、哪天扣费？订阅在哪买就在哪看：网页看 Settings 的 Billing，iPhone 看 Apple 订阅，安卓看 Google Play。官方写明按月订阅在订阅当天续费、日期不能改，取消后用到本期结束。订阅页加载不出来时的官方排查顺序也在文中。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
  - https://help.openai.com/en/articles/8156167-invoice-dates-for-chatgpt-and-api-billing
  - https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
  - https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
  - https://help.openai.com/en/articles/20001043-how-do-i-avoid-being-charged-twice-if-i-subscribe-to-chatgpt-on-ios-android-and-the-web
  - https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
  - https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages
verify:
  - 官方文章没有逐字写「下次扣费日期显示在 Billing 页面的哪一行」，正文只写了官方明确写过的入口和规则；Billing 页面上具体显示哪些字段，以你账号里实际看到的为准
  - 官方没有为「无法加载订阅」这条提示写专门文章，正文用的是官方通用的页面加载排查和「已扣款仍显示 Free」的排查步骤，已在文中说明
  - Plus 帮助文章里管理订阅写的是 Settings → Account，Billing 文章写的是 Settings → Billing，两处入口措辞不同，正文两个都列了
  - 本文不写价格，官方价格页会变动
---

> 本文根据 OpenAI 帮助中心《Managing billing for ChatGPT and the API platform》《Invoice dates for ChatGPT and API billing》《Canceling your ChatGPT subscription》《What is ChatGPT Plus?》等文章整理，资料核对于 2026-10-14。配图为本站整理的示意图，不是界面截图；界面和菜单名称可能随版本调整。

## 适用于谁

- 想知道 Plus 什么时候到期、下一次哪天扣费的人；
- 搜「gpt 怎么看到期时间」，在设置里翻了一圈没找到的人；
- 点开订阅页，看到「无法加载订阅」之类提示的人；
- 取消了订阅，想确认还能用到哪天的人。

## 结论先说

1. **订阅在哪个平台买的，就在哪个平台看。** 在 chatgpt.com 网页买的，到 ChatGPT 的 **Settings → Billing** 管理；在 iPhone 上用 App Store 买的，到 Apple 的订阅页看；在安卓用 Google Play 买的，到 Google Play 的订阅页看。网页订阅不会出现在苹果或谷歌的订阅列表里。
2. **续费日有固定规律。** 官方写明：自助的按月订阅「在你订阅的那一天」续费，例如 12 号订阅，之后每月 12 号扣费。**OpenAI 不支持修改账单日期。**
3. **取消不是立刻失效。** 官方：普通取消之后，付费功能保留到当前计费周期结束；想避免下一期扣费，要在下次计费日前至少 24 小时取消。
4. **续费扣款失败，订阅也不一定就结束了。** 官方在 Pro 的文章里写：续费失败本身不代表订阅已结束，网页订阅按账单邮件里的付款恢复说明处理，苹果和谷歌订阅则去商店的付款设置里检查。
5. **「无法加载订阅」官方没有专门文章。** 能做的是按官方的页面加载排查走一遍，见下文第三节；急着确认日期，可以去苹果或谷歌的订阅页，或联系客服。

![续费日和到期时间去哪看：网页、App Store、Google Play、Business 的入口和续费规则](seed:g874-renewal-where-to-look.png)
*图：本站根据 [OpenAI 帮助中心：Managing billing for ChatGPT and the API platform](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) 与 [Invoice dates for ChatGPT and API billing](https://help.openai.com/en/articles/8156167-invoice-dates-for-chatgpt-and-api-billing) 整理的示意图*

## 一、先弄清楚：你的订阅是在哪买的

官方在多处强调同一件事：ChatGPT 订阅可以通过**网页、Apple App Store、Google Play** 购买，各由对应平台管理，**在多个平台各买一份会产生各自的扣费**。所以找日期之前，先回忆或翻收据：

- 收据是 OpenAI 发来的邮件，一般对应网页订阅；
- 收据来自苹果的，是 App Store 订阅；
- 扣费记录里写着 Google Play 的，是谷歌订阅。

官方的建议也是这样：看购买收据，确认是哪个平台在扣费。

官方还特别提醒：收发票的邮箱和你的 ChatGPT 账号邮箱**可能不一样**。如果登录的不是购买订阅时用的那个账号，Settings 里就看不到那份订阅。排查账号和登录方式，可以参考 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems) 和 [/guides/chatgpt-change-login-method](/guides/chatgpt-change-login-method)。

## 二、各平台怎么看

### 在网页订阅的（chatgpt.com）

![在网页上找订阅信息的五个步骤：确认账号、Settings 的 Billing、Account、My Plan、找不到时去苹果或谷歌看](seed:g874-web-billing-steps.png)
*图：本站根据 [OpenAI 帮助中心：Managing billing for ChatGPT and the API platform](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) 与 [What is ChatGPT Plus?](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus) 整理的示意图*

1. 在网页登录 ChatGPT，确认是购买订阅的那个账号；
2. 打开 **Settings（设置）→ Billing（账单）**。官方说，Free、Go、Plus、Pro 账号如果是在网页订阅的，可以用 Billing 里的选项管理订阅、付款方式和可用的账单记录；
3. Plus 的官方文章还写了另一条路：**Settings → Account**，在那里管理订阅、查看发票、取消套餐；另一篇讲重复订阅的文章写的路径也是 Settings → Account（页面上可能叫 Account、Billing 或 Plan management），点 **Manage** 进入；
4. 如果你是 Pro，官方说 **Settings → My Plan** 可以查看订阅和可选的套餐变更。

Billing 页面具体会显示哪几项，官方文章没有逐项写出来。所以「下次扣费日」有没有直接显示，以你账号里实际看到的为准。看不到时，可以用下面的办法推算：翻出第一次扣费的日期，按月订阅就是**每月同一天**。账单记录和发票怎么下载，见 [/guides/chatgpt-invoice-download](/guides/chatgpt-invoice-download)。

### 在 iPhone 上订阅的（App Store）

官方的步骤：打开 iPhone 的 **设置**，点你的名字，选 **订阅（Subscriptions）**，再选 **ChatGPT**。这里是苹果管理的页面，续费时间以苹果页面为准。

官方还写了一个细节：在这个页面里，如果找不到 **Cancel Subscription**（取消订阅）而页面显示了一个到期日期，说明这份订阅可能**已经取消过了**，到那天结束。

### 在安卓上订阅的（Google Play）

打开 Google Play 商店 App，进入 **Subscriptions（订阅）**，选 **ChatGPT**。也可以打开 Google Play 的订阅网页，登录购买时用的谷歌账号，在 ChatGPT 旁边点 **Manage**。官方提醒：如果设备上有多个谷歌账号，要逐个检查。

手机端订阅的详细管理，见 [/guides/chatgpt-app-store-google-play-subscription](/guides/chatgpt-app-store-google-play-subscription)。

### 在 Business 工作区

自助的 ChatGPT Business：打开账号菜单的 **Workspace settings → Billing**。官方说明，只有工作区所有者能更新账单信息和付款方式、查看发票；没有权限就请所有者处理。

## 三、订阅页「无法加载订阅」怎么办

先说明：**官方没有为这条提示写专门文章**，下面是把官方的通用排查和订阅相关的排查拼起来的顺序，没有把它说成「官方对这条提示的解释」。

![订阅页加载不出来的排查：强制刷新、无痕窗口、重新登录、换网络、核对账号、联系客服](seed:g874-subscription-wont-load.png)
*图：本站根据 [OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages](https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages) 与 [What is ChatGPT Plus?](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus) 整理的示意图*

1. **强制刷新**：官方对空白页、一直加载的建议是硬刷新（Cmd/Ctrl + Shift + R）。
2. **换无痕窗口或另一个浏览器**，并关掉拦截脚本、修改页面内容的扩展。
3. **退出登录再重新登录**，必要时清除该站点的数据或 Cookie。
4. **换网络或设备**：官方建议关闭 VPN、安全 DNS 之类的过滤工具再试。
5. **看状态页**：[status.openai.com](https://status.openai.com/) 上有没有正在处理的事件，见 [/guides/chatgpt-down-check-status-page](/guides/chatgpt-down-check-status-page)。
6. **如果页面能打开，但账号显示 Free，而你明明已经扣了款**：官方的「已扣款仍是 Free」排查是——先在没退出前看一眼账号邮箱，确认登录方式是否对（用苹果登录并选了「隐藏邮件地址」的，账号邮箱可能是 `@privaterelay.appleid.com`，要继续用「通过 Apple 登录」）；iOS、安卓 App 里点 **Settings → Restore purchases**；然后在显示 Free 的设备上退出再登录；仍不行，联系客服，并附上收据或被扣款卡的后四位。
7. **都不行**：联系客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)。官方对页面卡住的建议是准备好控制台报错、HAR 文件和时间点；订阅类问题再加上收据信息。

## 四、取消之后能用到哪天

- 普通取消后，付费功能保留到**当前计费周期结束**；
- **要在下一次计费日前至少 24 小时取消**，否则下一期可能已经扣了；
- 如果批准了退款，退款覆盖的那段使用权通常会提前结束；
- 卸载 App **不会**取消订阅；删除账号只会取消由 ChatGPT 直接扣费的订阅，不会取消苹果订阅；
- Pro 的文章还说，预约取消不会立刻结束订阅，在本期结束前可以撤销取消。

取消的具体步骤见 [/guides/chatgpt-cancel-subscription](/guides/chatgpt-cancel-subscription)，退款见 [/guides/chatgpt-refund-request](/guides/chatgpt-refund-request)。

## 常见问题

**Q：能不能改续费日？**
不能。官方明确写：OpenAI 不支持修改发票日期，续费按订阅那天循环。

**Q：Plus 能买年付或一次买几个月吗？**
官方 Plus 文章写的是目前不支持年付，也不支持一次预付多个月；Pro 同样按月计费。

**Q：设置里看不到订阅，是不是没买成功？**
先核对是否登录了购买时的账号，再看是不是在苹果或谷歌买的。官方提示：网页订阅不会出现在苹果或谷歌的订阅列表里。

**Q：看到两条扣费怎么办？**
官方的做法是先弄清有几份订阅分别在哪个平台，保留想要的，其他去对应平台取消；两次分别购买的订阅不会自动退款。

**Q：Plus 和 Pro 有什么区别？**
见 [/guides/chatgpt-plus-vs-pro-tiers](/guides/chatgpt-plus-vs-pro-tiers) 和 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。要开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：Managing billing for ChatGPT and the API platform — https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- OpenAI 帮助中心：Invoice dates for ChatGPT and API billing — https://help.openai.com/en/articles/8156167-invoice-dates-for-chatgpt-and-api-billing
- OpenAI 帮助中心：Canceling your ChatGPT subscription — https://help.openai.com/en/articles/7232927-canceling-your-chatgpt-subscription
- OpenAI 帮助中心：What is ChatGPT Plus? — https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus
- OpenAI 帮助中心：Managing your ChatGPT subscription across devices — https://help.openai.com/en/articles/20001043-how-do-i-avoid-being-charged-twice-if-i-subscribe-to-chatgpt-on-ios-android-and-the-web
- OpenAI 帮助中心：About ChatGPT Pro tiers — https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers
- OpenAI 帮助中心：Troubleshooting ChatGPT Error Messages — https://help.openai.com/en/articles/7996703-troubleshooting-chatgpt-error-messages

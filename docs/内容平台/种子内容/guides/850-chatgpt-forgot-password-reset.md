---
title: ChatGPT 忘记密码怎么办、怎么改密码：重置步骤、收不到邮件与第三方登录的情况
slug: chatgpt-forgot-password-reset
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 忘记密码、想改密码，或者点了「Forgot password?」却收不到邮件？本文按 OpenAI 帮助中心讲清重置密码的 5 步、登录状态下在设置里改密码的位置、用 Google / Apple / 微软登录为什么没有密码可重置，以及手机号注册和邮箱进不去时的官方处理方式。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/4936828-resetting-or-changing-your-chatgpt-password
  - https://help.openai.com/en/articles/7426629-why-cant-i-log-in-to-chatgpt
  - https://help.openai.com/en/articles/10388702-phone-only-signups
  - https://help.openai.com/en/articles/8485685-im-seeing-unrecognized-activity-on-my-openai-account
  - https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa
  - https://help.openai.com/en/articles/9019931-creating-a-new-chatgpt-account-after-deletion
verify:
  - 设置里密码一项的位置：《Resetting or Changing Your ChatGPT Password》写 Settings → Account，《Creating a new ChatGPT account after deletion》写 Settings → Security and login → Password → Add；正文两处都写了
  - 手机号注册（phone-only）目前只在部分国家对新用户开放，短信重置密码的条件以官方文章为准
---

> 本文根据 OpenAI 帮助中心《Resetting or Changing Your ChatGPT Password》《Why can't I log in to ChatGPT?》等文章整理，资料核对于 2026-10-13。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 忘了 ChatGPT 密码，登录不进去的人；
- 还能登录，只是想换一个更安全的密码的人；
- 点了「Forgot password?」却一直收不到重置邮件的人；
- 当初用 Google、Apple、微软账号登录，现在找不到「密码」在哪的人。

## 结论先说

1. **忘记密码**：退出登录（或开无痕窗口）→ 打开 chatgpt.com → **Log in（登录）** → 输入邮箱或手机号 → **Continue** → 在输入密码的页面点 **Forgot password?（忘记密码？）** → 按邮件里的说明重置。
2. **还能登录、只想改密码**：**Settings（设置）→ Account（账号）**，在这里添加或更新密码。
3. **用 Google / 微软 / Apple 登录的账号本来就没有 ChatGPT 密码**，所以没有密码可以重置。继续点对应的「Continue with …」登录；要改的是 Google、微软或 Apple 那边的密码，得去它们各自的网站改。
4. 改了 ChatGPT 的密码，等于改了**整个 OpenAI 账号**的密码，API 平台（platform.openai.com）也要用新密码登录。

![ChatGPT 忘记密码重置的 5 个步骤示意图](seed:g850-reset-password-steps.png)
*图：本站根据 [OpenAI 帮助中心：Resetting or Changing Your ChatGPT Password](https://help.openai.com/en/articles/4936828-resetting-or-changing-your-chatgpt-password) 整理的示意图*

## 一、忘记密码：重置步骤

官方给的顺序是：

1. 先**退出当前账号**，或者直接打开浏览器的无痕 / 隐私窗口；
2. 打开 [chatgpt.com](https://chatgpt.com/)；
3. 点 **Log in（登录）**；
4. 输入注册时用的**邮箱或手机号**，点 **Continue（继续）**；
5. 到了输入密码的那一页，点 **Forgot password?**；
6. 去邮箱里找重置邮件，按里面的说明设置新密码。

为什么要先退出或用无痕窗口：浏览器里如果还留着旧的登录状态或缓存，容易直接跳回原来的页面，看不到「Forgot password?」这个入口。

## 二、还能登录：在设置里改密码

1. 登录 ChatGPT；
2. 进入 **Settings（设置）→ Account（账号）**；
3. 添加或更新密码（官方写法是 Add or update your password）。

另一篇官方文章给的位置是 **Settings → Security and login（安全与登录）**：Password 一行显示 **Add** 时点它，按提示设置。两处写法不同，说明设置页在调整，哪一处有密码选项就用哪一处。

官方还提到一点：**设好密码之后，才能在同一个设置页里修改登录邮箱**。所以当初用第三方账号登录、现在想换邮箱的人，也要先来这里加一个密码，具体见 [/guides/chatgpt-change-email-address](/guides/chatgpt-change-email-address)。

## 三、收不到重置邮件怎么办

![收不到 ChatGPT 密码重置邮件时的对照排查示意图](seed:g850-no-reset-email.png)
*图：本站根据 [OpenAI 帮助中心：Resetting or Changing Your ChatGPT Password](https://help.openai.com/en/articles/4936828-resetting-or-changing-your-chatgpt-password) 与 [Why can't I log in to ChatGPT?](https://help.openai.com/en/articles/7426629-why-cant-i-log-in-to-chatgpt) 整理的示意图*

按官方列出的顺序检查：

1. **垃圾邮件 / 广告邮件文件夹**里有没有；
2. 查的是不是**注册 ChatGPT 用的那个邮箱**——官方特别提醒，登录邮箱可能和你收发票、收据的邮箱不是同一个；
3. 输入邮箱时**有没有打错字**；
4. 当初是不是用 **Continue with Google / Microsoft / Apple** 注册的——这种账号没有密码，自然不会发重置邮件。

第 4 种情况最常见。不确定当初用的哪种方式，可以在无痕窗口里把邮箱密码、Google、微软、Apple 挨个试一遍。如果注册 Apple 登录时选了「隐藏邮件地址」（Hide My Email），账号绑定的是一个 `@privaterelay.appleid.com` 结尾的地址，只能继续用同一个 Apple 账号点 **Continue with Apple** 进入。

邮件到了但验证码总是过期：重新请求一次，**只用最新的那一封**；官方还建议把 `noreply@openai.com` 加入邮箱白名单。

## 四、几种特殊情况

**手机号注册的账号**（phone-only）。官方说明，仅用手机号注册的账号，重置密码走**短信**；并且有一个限制：必须在**以前至少登录过一次这个账号的设备**上操作。这种注册方式目前只对部分国家的新用户开放。

**注册邮箱已经进不去了**。官方的说法很直接：收不到登录、验证或重置邮件，是因为你已经无法访问账号上的那个邮箱时，自助排查帮不上忙，短信也不能替代邮箱验证。能做的是联系客服，说明账号邮箱、试过的登录方式和相关的账单 / 订阅信息，由客服判断下一步；如果账号上有订阅，可以请客服协助取消。

**开了两步验证（MFA），验证方式丢了**。这和密码是两回事：改密码不会绕过 MFA。丢失全部验证方式时要联系客服走核验流程，见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)。

**怀疑账号被别人用了**。官方建议第一件事就是改密码：密码改完后，所有已登录的会话会在 **30 分钟内**被登出，别人需要新密码才能再进来。之后的检查见 [/guides/chatgpt-suspicious-activity-alert](/guides/chatgpt-suspicious-activity-alert)。

## 常见问题

**Q：我明明记得密码，却提示登录方式不对？**
多半是登录方式选错了。用 Google 注册的账号要一直点「Continue with Google」，直接输邮箱密码会报「Wrong authentication method」之类的错。各种登录报错的含义见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

**Q：改密码之后，手机 App 和其他电脑会被登出吗？**
按官方《unrecognized activity》一文的说法，改密码后现有会话会在 30 分钟内登出。想立刻手动登出，可以在 **Settings → Security（安全）** 里使用登出所有设备的选项。

**Q：ChatGPT 和 API 平台的密码是分开的吗？**
不是。两边共用一个 OpenAI 账号，改一处两边都变。

**Q：可以让客服帮我把密码发到另一个邮箱吗？**
官方文章没有提供这种做法。重置邮件只发到账号绑定的邮箱；邮箱进不去时按上面第四节处理。

## 参考资料

- OpenAI 帮助中心：Resetting or Changing Your ChatGPT Password — https://help.openai.com/en/articles/4936828-resetting-or-changing-your-chatgpt-password
- OpenAI 帮助中心：Why can't I log in to ChatGPT? — https://help.openai.com/en/articles/7426629-why-cant-i-log-in-to-chatgpt
- OpenAI 帮助中心：Phone-only signups — https://help.openai.com/en/articles/10388702-phone-only-signups
- OpenAI 帮助中心：I'm seeing unrecognized activity on my OpenAI account — https://help.openai.com/en/articles/8485685-im-seeing-unrecognized-activity-on-my-openai-account
- OpenAI 帮助中心：Managing multi-factor authentication (MFA) — https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa

---
title: Claude 怎么注册：官方注册流程、手机验证要求，以及提示无法注册时官方怎么说
slug: claude-how-to-sign-up
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 怎么注册？打开 claude.ai，用 Google 或邮箱登录链接创建账号，再用支持地区的手机号收短信验证码。讲清官方的注册条件、手机验证的限制，以及收不到验证码、号码被用过多次时官方的处理办法。
checkedOn: 2026-10-19
sources:
  - https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account
  - https://support.claude.com/en/articles/8287232-verify-your-phone-number
  - https://support.claude.com/en/articles/8114491-get-started-with-claude
  - https://www.anthropic.com/supported-countries
verify:
  - 官方支持地区名单会更新；本文说的「名单里列有 Taiwan、没有列中国大陆、香港和澳门」是 2026-10-19 核对 anthropic.com/supported-countries 和帮助中心「Where can I access Claude」两份名单的结果，请以官方页面当天显示为准
  - 官方没有一篇叫「注册」的独立文章，注册流程是根据登录文章、手机验证文章和入门文章拼起来的；「无法注册新用户」这类提示的原文，官方没有逐条收录，本文只写官方明确写了的情形
  - 手机验证文章没有写短信验证码的有效时长，只说超过 5 分钟没收到就点 Try again
---

> 本文根据 Claude 帮助中心《Log in to your Claude account》《Verify your phone number》《Get started with Claude》和 Anthropic 的 Supported Regions Policy 整理，资料核对于 2026-10-19。**本文只讲官方的注册流程和官方给出的处理办法**；官方说手机验证这一步没有办法跳过，本文不提供任何绕过的做法。图为官方登录界面截图和本站整理的示意图。

## 适用于谁

- 想注册 Claude 账号，不知道从哪里开始的人；
- 注册时卡在手机号验证，收不到码或提示号码用过太多次的人；
- 看到「无法注册」类提示，想知道官方到底有什么要求的人；
- 已经有账号，只是想确认登录方式的人，见 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)。

## 结论先说

1. **注册入口**：打开 claude.ai，官方登录页有两种方式：**Continue with Google**，或者填邮箱后点 **Continue with email**，邮箱会收到主题为「Secure link to log in to Claude.ai」的登录链接。第一次登录的新用户，就是用这两种方式创建账号。
2. **三个硬条件**：你得**身处官方支持的国家或地区**；**年满 18 岁**；有一个**来自支持地区、能收短信的手机号**来做验证。
3. **手机验证**：创建账号时输入手机号，会收到一条六位数验证码的短信，填进去点 **Verify code** 就完成。官方说，**这一步没有办法跳过**。
4. **官方支持名单**：官方名单（Anthropic 的 Supported Regions Policy 和帮助中心 Where can I access Claude 两页）里列有 Taiwan，没有列中国大陆、香港和澳门；名单里没有的地区，官方明说「不支持」。具体以官方页面为准。
5. **手机验证的限制**：不接受 VoIP、Google Voice、用应用生成的号码、座机和其他收不了短信的号码；同一个手机号最多用来验证 3 个账号；验证后**无法更换**账号绑定的手机号。

![Claude 官方登录界面：Continue with Google 和邮箱登录（官方截图）](seed:g932-claude-login-official.png)
*图片来源：[Claude 帮助中心：Log in to your Claude account](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account)*

## 一、注册前先确认 5 件事

![注册 Claude 之前先确认的 5 件事](seed:g932-claude-signup-checklist.png)
*图：本站根据 [Claude 帮助中心：Verify your phone number](https://support.claude.com/en/articles/8287232-verify-your-phone-number) 与 [Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude) 整理的示意图*

官方的几条规定：

- **所在地**：官方说，只有**人在支持地区**的用户才能创建和使用 Claude 账号，并且要求用支持地区的手机号。Supported Regions Policy 还写明，不在名单里的地区一律视为不支持，包括：人在不支持地区使用的情况、公司注册或总部在不支持地区的实体及其员工、被不支持地区的人或实体控股的实体。
- **年龄**：官方入门文章说，必须年满 18 岁才能使用服务。
- **手机号**：必须是能收短信验证码的号码，官方明说不接受 VoIP、Google Voice、用应用创建的号码和座机。
- **长期持有**：官方说，验证完成后**没办法更换**账号绑定的手机号，所以请用一个你能长期拿着的号码。

如果你不确定自己所在地区是否在名单里，直接看官方名单：[Anthropic Supported Regions Policy](https://www.anthropic.com/supported-countries)。

## 二、注册步骤（官方流程）

### 方式一：用 Google 账号

1. 打开 claude.ai（或桌面版、手机 App）；
2. 点 **Continue with Google**，在弹出的窗口里输入你的 Google 邮箱和密码，点 Next；
3. 回到 Claude，按提示完成手机验证（见下一节）。

### 方式二：用邮箱

1. 在输入框里填邮箱，点 **Continue with email**；
2. 去邮箱里找主题为「Secure link to log in to Claude.ai」的邮件；
3. 在**同一台设备**上点邮件里的链接，会自动登录；如果你是在电脑上请求、在手机上点的链接，邮件里的 **Sign in with Claude.ai** 会生成一个验证码，把它输回你最初请求登录的那台设备；
4. 完成手机验证。

官方还说：目前**不能给 Claude 账号单独设置密码**，登录靠 Google 或邮箱链接；同一个邮箱在不同设备（网页、手机 App）上登录的是同一个账号。

### 手机验证

1. 输入来自支持地区的手机号；
2. 手机会收到一条六位数验证码短信；
3. 把验证码输进框里，点 **Verify code**，账号创建完成，可以开始聊天。

官方说，要求手机验证是为了防止垃圾信息和滥用，号码只用于账号验证，不用于别的目的。

## 三、收不到验证码、提示出错，官方怎么说

![手机验证常见问题与官方处理办法](seed:g932-claude-phone-verify-decide.png)
*图：本站根据 [Claude 帮助中心：Verify your phone number](https://support.claude.com/en/articles/8287232-verify-your-phone-number) 整理的示意图*

官方手机验证文章的问答，整理如下：

- **超过 5 分钟没收到验证码**：短信可能要几分钟才到；超过 5 分钟就点 **Try again** 重置，再确认号码没输错，重新输入。
- **一直收不到，或者提示「Error sending code. Double check your phone number.」**：官方说，重新输入后还是不行，就需要换一个手机号来验证。
- **收到了验证码但提示无效**：验证码是临时的，要用你收到的**最新一条**；点 **Try again** 重新开始，拿到新验证码后立刻输入。
- **提示号码已经被使用太多次**：这表示已经有 3 个 Claude 账号用这个号码验证过了，官方最多允许 3 个。如果你记得是哪些邮箱，登录其中一个账号，联系官方客服请求解除这个号码的绑定，解绑后就可以用它验证新账号；或者直接换一个没用过的号码。
- **想改账号绑定的手机号**：官方说，验证后没办法更换。
- **没有支持地区的手机号 / 没有能收短信的手机**：官方明说，只有人在支持地区的用户才能创建和使用账号，需要支持地区的号码，**没有办法跳过这一步**。

联系官方客服的入口，见官方的 [How to get support](https://support.claude.com/en/articles/9015913-how-to-get-support)。

## 四、提示「无法注册」的几种常见原因

官方没有一篇收录所有「无法注册」提示原文的文章，但从上面几篇文章能归出几类情况，可以自己对照：

1. **所在地不在支持名单里**：这是最根本的限制，官方说不支持的地区不能创建账号；
2. **手机号类型不被接受**：VoIP、Google Voice、应用生成号码、座机；
3. **手机号已被用满 3 次**：按上一节的办法处理；
4. **验证码问题**：超时、用了旧验证码；
5. **登录时出现通用错误**（比如「There was an error logging you in」）：官方的建议是：确保没有使用 VPN、禁用浏览器扩展、清除浏览器缓存和 Cookie；仍不行就看 [status.claude.com](https://status.claude.com/) 有没有故障，见 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)。

如果以上都不是，建议截图保存提示原文，联系官方客服。

## 五、注册之后

- 新手怎么开始聊天，见 [/guides/claude-how-to-use-beginner](/guides/claude-how-to-use-beginner)；
- 想要中文回答，见 [/guides/claude-set-chinese-language](/guides/claude-set-chinese-language)；
- 免费版够不够用、什么时候要升级，见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)；
- 需要开通 Claude Pro 的，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)；
- 账号被停用，见 [/guides/claude-account-disabled-appeal](/guides/claude-account-disabled-appeal)。

## 常见问题

**Q：Claude 可以用密码登录吗？**
官方说，目前不能给 Claude 账号设置专用密码，登录靠 Google 账号或邮箱链接。

**Q：注册要付费吗？**
官方说，在支持地区的任何人都可以到 claude.ai 用邮箱注册免费版；付费套餐是另外的选项。

**Q：我用 Apple 的「隐藏邮件地址」注册过，换设备怎么登录？**
官方登录文章里有专门的说明，要用你注册时用的那个隐藏邮箱；已经登录着 iOS App 的话，可以在 App 里看到你当时用的邮箱。

**Q：同一个手机号能注册几个账号？**
官方说最多验证 3 个账号。

## 参考资料

- Claude 帮助中心：Log in to your Claude account — https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account
- Claude 帮助中心：Verify your phone number — https://support.claude.com/en/articles/8287232-verify-your-phone-number
- Claude 帮助中心：Get started with Claude — https://support.claude.com/en/articles/8114491-get-started-with-claude
- Anthropic：Supported Regions Policy — https://www.anthropic.com/supported-countries

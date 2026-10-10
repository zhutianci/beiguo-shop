---
title: ChatGPT 两步验证怎么开：MFA、通行密钥、登出所有设备与安全记录
slug: chatgpt-account-security-mfa
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 担心 ChatGPT 账号被盗？本文按官方帮助中心讲清怎么开启两步验证（MFA）、添加通行密钥（Passkey）、查看活跃会话和安全记录、一键登出所有设备，以及丢了验证方式怎么恢复。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa
  - https://help.openai.com/en/articles/20001039-passkeys-to-secure-your-openai-account
  - https://help.openai.com/en/articles/20001257-managing-active-sessions-in-chatgpt
  - https://help.openai.com/en/articles/9243857-how-do-i-log-out-of-all-of-my-devices
  - https://help.openai.com/en/articles/8304786-keeping-your-openai-account-secure
  - https://help.openai.com/en/articles/20001221-advanced-account-security
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 设置里的安全页面，不同帮助文章分别叫「Security」和「Security and login」，以实际界面为准
  - 配图来自「登出所有设备」帮助文章，是较早的设置界面，新版界面布局可能不同
  - 「高级账号安全」可用范围的帮助文章原文有矛盾（Availability 列表写了企业托管账号，另一篇又说企业账号不可用），正文只写「以设置里是否出现为准」
---

> 本文根据 OpenAI 帮助中心（MFA、Passkeys、Active sessions、Keeping your account secure、Advanced Account Security）和发布说明整理，资料核对于 2026-10-07；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 想给 ChatGPT 账号加一道保险、防止密码泄露后被盗用的人；
- 收到陌生登录提醒、怀疑账号被别人登录过的人；
- 换了手机、丢了验证器，登录时卡在两步验证的人。

## 结论先说

1. **入口统一在安全设置**：**Settings（设置）→ Security / Security and login（安全与登录）**。MFA、通行密钥、活跃会话、安全记录、登出所有设备都在这里。
2. **MFA 开一次，全 OpenAI 通用**：同时作用于 ChatGPT 和 API 平台。可选验证器 App、推送通知、短信 / WhatsApp 验证码、通行密钥（具体可选项因设备、国家、套餐和注册方式而异）。
3. **开 MFA 不会踢掉已登录的设备**。怀疑被盗时，顺序是：先改密码 → 登出所有设备 → 再开 MFA。
4. **邮箱不能当 MFA 方式**。所有验证方式都丢了，只能找客服走身份核验，官方给的一次性邮箱恢复登录**只能用一次**。
5. 2026 年新增了 **安全记录（Security history）** 和 **活跃会话（Active sessions）**，可以看到最近的登录、登出和安全设置变更。

## 步骤

### 1. 开启两步验证（MFA）

1. 打开 ChatGPT 网页版，进入 **Settings → Security and login**；
2. 在 **Multi-factor authentication (MFA)** 下选择要启用的验证方式；
3. 按提示完成设置：
   - **验证器 App**（如 Google Authenticator、Authy）：扫二维码，输入 App 显示的一次性验证码；
   - **短信或 WhatsApp**：先填手机号，再输入收到的 6 位验证码；
   - **推送通知**：在受信任设备上批准登录请求；
   - **通行密钥**：见下一步。
4. 设置完成后，**下次登录**时就会要求第二步验证。

建议至少开两种方式，比如「验证器 App + 通行密钥」，一种丢了还能用另一种。启用多种方式时，系统默认先用最安全的那种，但登录时你仍可以选择其他已启用的方式。

### 2. 添加通行密钥（Passkey）

通行密钥用设备上的生物识别（Face ID、Touch ID）、设备 PIN 或硬件安全密钥来登录，不需要输入密码。

1. 在网页版登录 ChatGPT，进入 **Settings → Security**；
2. 在 **Passkeys** 下点 **Add passkey（添加通行密钥）**，按系统提示完成。

添加后，输入邮箱就会默认用通行密钥登录；想用密码时点 **Try another method（换一种方式）**。注意：

- 只存在单台设备上、没有同步的通行密钥，设备丢了就用不了；用 iCloud 钥匙串这类同步方式会更稳妥。
- 没有邮箱的账号看不到通行密钥选项；公司 SSO 登录的账号仍走公司登录，通行密钥只充当 MFA。

### 3. 查看活跃会话、登出可疑设备

1. **Settings → Security → Active sessions（活跃会话）**；
2. 每一行会显示设备 / 浏览器、是 ChatGPT、Codex 还是 API 平台、大致位置和登录时间，标着 **CURRENT SESSION** 的是你当前这台；
3. 看到不认识的，点该行的 **Log out（登出）** 并确认；受信任设备会显示 **Log out and remove（登出并移除）**。

活跃会话**不显示**第三方应用会话、已连接应用、Codex CLI 会话，也不显示已登出的会话。用公司 SSO 登录的账号没有这个功能。

### 4. 一键登出所有设备

在活跃会话页面找到 **Log out of all sessions（登出所有会话）→ Log out all**，确认 **Log out of all devices**。这会连当前设备一起登出，其他设备最多可能要 30 分钟才全部失效。

![ChatGPT 设置的 Security 页面，「Log out of all devices」右侧是红色的「Log out all」按钮（英文界面，较早版本）](seed:g102-security-logout-all.png)
*图片来源：[OpenAI 帮助中心《How do I log out of all of my devices?》](https://help.openai.com/en/articles/9243857-how-do-i-log-out-of-all-of-my-devices)*

API 平台是另一套会话：在 platform.openai.com 的 **Your Profile → Security** 里同样有「登出所有设备」，那边会立即生效。

### 5. 查看安全记录

2026 年 9 月起，网页版 **Settings → Security and login → Security history（安全记录）** 会列出最近的登录、登出、改密码、MFA 和通行密钥变更等事件，附时间、位置和设备信息（部分信息可能不精确）。发现不是自己做的操作，按下面「怀疑被盗」的步骤处理。

## 怀疑账号被盗怎么办

官方建议的顺序：

1. 用密码登录的，立刻改成一个**没在别处用过**的新密码（推荐用密码管理器生成）；
2. **登出所有设备**；
3. 开启 MFA 或通行密钥；
4. 检查登录方式和安全记录；
5. 联系 OpenAI 客服（[help.openai.com](https://help.openai.com/) 右下角对话入口）。

另外警惕索要账号密码的邮件和链接，先核对发件地址和网址是否来自 OpenAI 官方。

## 高级账号安全（可选）

**Advanced Account Security** 是更严格的可选保护：必须准备至少两种安全登录方式（通行密钥或 FIDO 硬件密钥，其中一种要能跨设备使用），并保存恢复密钥。开启后会禁用密码登录、邮箱和短信验证码，以及邮箱找回账号，会话时间更短，开启期间对话不用于训练。

它的代价是：**所有登录方式和恢复密钥都丢了，可能永久失去账号**，客服也无法帮你重置。适合对安全要求很高、能妥善保管恢复密钥的人。入口在 **Settings → Security → Advanced Account Security**，设置里没出现就说明你的账号暂不可用。

## 常见问题

**Q：换手机了，验证器 App 里的码没了怎么办？**
如果还开着别的验证方式（短信、通行密钥等），登录时选那种。全部丢失时联系客服，完成核验（可能需要几天）后会给一次性的邮箱恢复登录，登录后要马上补一种能用的 MFA 方式或关闭 MFA。这个恢复机会只有一次。

**Q：公司管理员能强制全员开 MFA 吗？**
官方说明目前不能在 ChatGPT 工作区或 API 组织层面强制开启 MFA。

**Q：登录时总让我做额外验证，是被盗了吗？**
不一定。OpenAI 会在某些情况下要求验证登录。若同时看到陌生的登录记录，就按上面的步骤处理。登录方面的问题可以看 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

## 参考资料

- OpenAI 帮助中心：Managing multi-factor authentication (MFA) — https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa
- OpenAI 帮助中心：Passkeys to secure your OpenAI account — https://help.openai.com/en/articles/20001039-passkeys-to-secure-your-openai-account
- OpenAI 帮助中心：Managing active sessions in ChatGPT — https://help.openai.com/en/articles/20001257-managing-active-sessions-in-chatgpt
- OpenAI 帮助中心：How do I log out of all of my devices? — https://help.openai.com/en/articles/9243857-how-do-i-log-out-of-all-of-my-devices
- OpenAI 帮助中心：Keeping your OpenAI account secure — https://help.openai.com/en/articles/8304786-keeping-your-openai-account-secure
- OpenAI 帮助中心：Advanced Account Security — https://help.openai.com/en/articles/20001221-advanced-account-security
- ChatGPT Release Notes（2026-09-25 安全记录）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes

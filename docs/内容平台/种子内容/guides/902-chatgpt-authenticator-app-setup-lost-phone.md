---
title: ChatGPT 验证器应用是什么、怎么设置两步验证，换手机或丢了验证器怎么办
slug: chatgpt-authenticator-app-setup-lost-phone
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的验证器应用就是用 Google Authenticator、Authy 这类 App 生成一次性验证码做两步验证。按 OpenAI 帮助中心讲清怎么开启、官方列出的四种 MFA 方式，以及换手机、丢了验证器后官方给的恢复流程（需客服核实、可能几天、只有一次）。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa
  - https://support.google.com/accounts/answer/1066447
verify:
  - 官方说可选的 MFA 方式因设备、国家、账号类型和注册方式而异，你的设置页里未必四种都有，以实际界面为准
  - 官方对「客服核实」只说「可能需要几天」，没有给确切时间；一次性邮件恢复登录只有一次机会
  - 文中「换手机时转移验证器里的账号」一节来自 Google Authenticator 的官方帮助，菜单名称（Transfer accounts、Export accounts 等）随 App 版本不同，以你手机上的 App 为准；若你用的是 Authy 或其他验证器，请看它们各自的官方说明
  - 「Security and login」「Multi-factor authentication (MFA)」等菜单的中文名称以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Managing multi-factor authentication (MFA)》整理，换手机转移验证码的部分来自 Google Authenticator 的官方帮助，资料核对于 2026-10-14。这些官方页面没有可用的界面截图，配图为本站整理的示意图。两步验证的总览（通行密钥、会话管理、账号被盗怎么办）见 [/guides/chatgpt-account-security-mfa](/guides/chatgpt-account-security-mfa)，本文专讲验证器应用。

## 适用于谁

- 搜「ChatGPT 验证器应用是什么」，想弄清它和短信验证码有什么不同的人；
- 想给 ChatGPT 账号开两步验证，选了验证器应用，不知道怎么扫码的人；
- 换了手机，验证器里没有 ChatGPT 的验证码，登录被卡住的人。

## 结论先说

1. **验证器应用是什么**：官方的说法是，用 **Google Authenticator 或 Authy** 这类应用里生成的**一次性验证码**，作为登录时的第二道验证。它是多重验证（MFA）的几种方式之一。
2. **开启路径**：ChatGPT **设置（Settings）→ 安全与登录（Security and login）→ Multi-factor authentication (MFA)**，选你要开启的验证方式，再按提示设置。
3. **设置过程**：用验证器应用**扫描二维码**，输入应用里显示的一次性验证码确认；设置完成后，**下次登录**时 MFA 开始生效。
4. **开一次，全 OpenAI 通用**：官方说开启后会应用于 OpenAI 的各项服务，包括 ChatGPT 和 API 平台。
5. **换手机前先转移，别先卸载旧的**：验证码存在验证器 App 里，丢了或换机没转移，就会卡在登录。官方的恢复流程很麻烦（要客服核实，可能几天，**只有一次机会**），所以提前备份或多开一种验证方式更省事。
6. **邮件不是 MFA 方式**：官方明确说，邮件不能作为标准的 MFA 方式；登录时必须用账号上已设置的 MFA 方式。

![开启验证器 App 两步验证的 5 步](seed:g902-mfa-authenticator-setup.png)
*图：本站根据 [OpenAI 帮助中心：Managing multi-factor authentication (MFA)](https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa) 整理的示意图*

## 一、官方列出的几种 MFA 方式

![官方列出的四种 MFA 方式：验证器 App、推送通知、短信或 WhatsApp、通行密钥](seed:g902-mfa-methods.png)
*图：本站根据 [OpenAI 帮助中心：Managing multi-factor authentication (MFA)](https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa) 整理的示意图*

官方说，开启 MFA 后，登录时你可能被要求用第二种方式验证身份，可以从可用的选项里选：

- **验证器 App（Authenticator app）**：使用 Google Authenticator 或 Authy 这类应用里的一次性验证码；
- **推送通知（Push notifications）**：在你受信任的设备上，批准发来的登录提示；
- **短信（Text message）**：通过短信或 WhatsApp 收一个 6 位验证码，启用前要先输入手机号；
- **通行密钥（Passkey）**：把通行密钥作为额外的 MFA 方式，部分通行密钥可以存在兼容的硬件安全密钥里。

官方也提醒：**可用的 MFA 选项取决于你的设备、国家、账号类型和账号的创建方式**，OpenAI 还在逐步开放更多选项。如果你启用了多种方式，OpenAI 默认**先要求最安全的那种**，但你登录时仍可以选择任何已启用的方式。

## 二、怎么开启验证器应用

按官方说明：

1. 打开 ChatGPT **设置（Settings）**；
2. 选 **安全与登录（Security and login）**；
3. 在 **Multi-factor authentication (MFA)** 下，选择你想开启的验证方式（这里是验证器 App），按设置说明操作；
4. 用手机上的验证器应用**扫描屏幕上的二维码**，然后输入应用里显示的一次性验证码；
5. 设置完成后，**下次登录时 MFA 生效**。

几个官方明确的点：

- **开启 MFA 不会自动让其他设备退出登录**。要手动退出所有会话：设置 → 安全与登录 → **Log out of all devices**（官方说可能要等 30 分钟，所有会话才会全部退出）；
- **管理员目前不能在 ChatGPT 工作区或 API 平台组织层面强制要求 MFA**，要靠每个人自己开启；
- 想用硬件安全密钥，官方有 OpenAI + Yubico YubiKey 的合作套装，以优惠价格提供给符合条件的用户，详见官方文章。

## 三、换手机，验证器里的码怎么带过去

**先说原则**：在**旧手机还能用**的时候转移，是最省事的。验证码保存在验证器 App 里，ChatGPT 官方这边没有「帮你找回验证器里的码」的功能。

### 如果你用的是 Google Authenticator

按 Google 官方帮助：

- **登录了 Google 账号同步的**：在新手机上安装 Google Authenticator，登录同一个 Google 账号，验证码会自动同步到新设备；
- **没有登录账号、只存在本地的**：需要旧手机、旧手机上最新版本的 App、新手机三样。步骤是：
  1. 在新手机安装并打开 App；
  2. 在旧手机上打开 App 的菜单，选 **Transfer accounts → Export accounts**，解锁设备并选择要转移的账号，旧手机会生成二维码（账号多的话可能生成多个）；
  3. 在新手机上打开菜单，选 **Transfer accounts → Import accounts**，扫描旧手机上的二维码，确认转移成功。

Google 官方帮助页里，Android 版有时写成 **Transfer codes / Export codes / Import codes**，菜单名称随版本不同，以你手机上的 App 为准。

### 如果你用的是 Authy 或其他验证器

请看它们各自官方的换机说明；ChatGPT 官方文章只是举了它们作为例子，没有写它们的转移方法。

### 转移完要做的

1. 在新手机的验证器里确认 ChatGPT 对应的条目在，并且显示的验证码在变化；
2. 试着退出 ChatGPT 再登录一次，用新手机上的验证码确认可用，再处理旧手机。

## 四、已经丢了验证器，怎么办

![换手机或丢了验证器：另一种方式、转移、联系客服、一次性邮件恢复、只有一次机会](seed:g902-mfa-lost-phone.png)
*图：本站根据 [OpenAI 帮助中心：Managing multi-factor authentication (MFA)](https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa) 整理的示意图*

官方的恢复流程是这样：

1. **还有别的已配置的 MFA 方式**：登录时被提示时，选那一种。比如你同时开了验证器和推送，验证器丢了就用推送；
2. **所有已配置的方式都用不了**：联系 OpenAI 客服（见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)）。你必须完成一个**核实流程**，官方说**可能需要几天**；
3. **核实通过后**：客服会提供一次性的**邮件恢复登录**。官方强调这是临时的恢复办法，**不是长期的邮件 MFA 方式**；
4. **用恢复登录进去之后**：你必须**添加一个你能访问的备用 MFA 方式**，或者在 **设置 → 安全与登录** 里**关闭 MFA**；
5. **只有一次机会**：官方说这个恢复选项只能用一次，用过之后如果再次丢失 MFA 方式，**不会再提供**；
6. 如果你开了「高级账号安全（Advanced Account Security）」并且丢了通行密钥或安全密钥，官方说用你的**恢复密钥**重新获得访问权。

所以最稳妥的做法是：**至少开两种方式**（比如验证器 App 加通行密钥），并在换手机前先转移好验证器。

## 常见问题

**Q：验证器应用和短信验证码有什么区别？**
官方列的几种方式都属于 MFA：验证器应用用的是应用里生成的一次性码，短信是发到手机上的 6 位码。选哪种取决于你的账号和设备能用哪些。

**Q：我不想用验证器，能只用邮件验证吗？**
官方说，邮件不是标准的 MFA 方式。

**Q：丢了手机但邮箱还在，能直接用邮件登录吗？**
官方说，开了 MFA 后，登录必须用账号上已配置的 MFA 方式，邮件不能代替；如果所有方式都用不了，要走客服的核实和一次性恢复流程。

**Q：开了 MFA 之后，还会收到邮箱验证码吗？**
邮件验证码属于登录验证的另一件事，见 [/guides/chatgpt-email-verification-code-not-received](/guides/chatgpt-email-verification-code-not-received)。

**Q：公司管理员能强制大家开 MFA 吗？**
官方说目前不能在 ChatGPT 工作区或 API 平台组织层面强制。

**Q：怎么把别人的登录踢下线？**
设置 → 安全与登录 → Log out of all devices；官方说可能要 30 分钟才全部退出。怀疑账号被盗的更多处理，见 [/guides/chatgpt-suspicious-activity-alert](/guides/chatgpt-suspicious-activity-alert)。

**Q：忘记密码和丢了验证器是一回事吗？**
不是。忘记密码见 [/guides/chatgpt-forgot-password-reset](/guides/chatgpt-forgot-password-reset)。

## 参考资料

- OpenAI 帮助中心：Managing multi-factor authentication (MFA) — https://help.openai.com/en/articles/7967234-managing-multi-factor-authentication-mfa
- Google 账号帮助：Get verification codes with Google Authenticator — https://support.google.com/accounts/answer/1066447

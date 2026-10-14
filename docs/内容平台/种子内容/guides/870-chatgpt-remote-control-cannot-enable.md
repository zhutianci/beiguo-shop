---
title: ChatGPT「无法启用远程控制」怎么办：手机控制电脑的官方设置步骤与 Remote Control 排查
slug: chatgpt-remote-control-cannot-enable
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 提示无法启用远程控制、手机里看不到电脑？按 OpenAI 官方文档，远程控制要在电脑上的 ChatGPT 桌面版里设置，手机扫码配对，两端要同一个账号和工作区。本文给出设置步骤、开始前的条件，以及点 Add 报错、看不到电脑、中途断开等情况的官方处理办法。
checkedOn: 2026-10-14
sources:
  - https://learn.chatgpt.com/docs/remote-connections
verify:
  - 官方文档只写了「点 Add 后出现错误：重启桌面版再试」，没有逐条解释各个具体报错文案；「无法启用远程控制 请重试」「无法更新远程控制状态」这两句界面文字在官方文档里没有出现，本文没有对它们做专门解释，只给了官方的通用办法
  - 官方文档说该功能的可用性随推出批次而异，菜单名称也在变化（iOS 应用里叫 Codex，仍有应用显示 Remote），以实际界面为准
  - 该页面原地址 developers.openai.com/codex/remote-connections 现已跳转到 learn.chatgpt.com，同属 OpenAI 官方文档
---

> 本文根据 OpenAI 官方文档《Remote connections》整理（原在 developers.openai.com，现在是 learn.chatgpt.com），资料核对于 2026-10-14。这个功能随批次推出，菜单名称可能与你看到的不同。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 想用手机控制电脑上的 ChatGPT（含 Codex），设置时提示**无法启用远程控制**，或点 **Add** 后报错的人；
- 设置完成了，手机里却看不到那台电脑的人；
- 远程会话老是断开，或者退出登录后远程控制自己关了的人；
- 在公司或学校的工作区里使用，不确定要不要管理员开通的人。

## 结论先说

1. **远程控制要从电脑上的 ChatGPT 桌面版开始设置**，路径是 **Settings → Connections → Control this Mac or PC**，点 **Set up** 或 **Add**，批准远程访问，然后用手机扫码。**不能从 Codex 命令行或 IDE 插件里设置。**
2. **手机和电脑必须用同一个 ChatGPT 账号和同一个工作区。**
3. **电脑要保持开机、联网、登录着，桌面版要在运行。** 电脑休眠、断网或关闭应用，远程访问就会中断。
4. **点 Add 后出现报错**：官方的办法是**重启电脑上的 ChatGPT 桌面版，再试一次**。
5. **用的是公司或学校的工作区**，可能需要管理员先开启 **Remote Control** 访问。
6. 官方文档说明，远程控制目前支持运行 **ChatGPT 桌面版的 macOS 和 Windows 电脑**作为被控端，手机端可以是 iOS 或安卓的 ChatGPT 应用，也可以是另一台 Mac 或 Windows 电脑（在「Control other devices」可用时）；可用性随推出批次而异。

![用手机远程控制电脑上的 ChatGPT 的设置步骤示意图](seed:g870-remote-setup-steps.png)
*图：本站根据 [OpenAI 官方文档：Remote connections](https://learn.chatgpt.com/docs/remote-connections) 整理的示意图*

## 一、开始之前先确认这几项

官方列的前提条件：

- 你选用的 ChatGPT 账号和工作区里有 **Codex 的使用权限**；
- 手机上是**最新版**的 ChatGPT 应用（iOS 或安卓）。在 iOS 上没看到 Codex，或在仍使用 Remote 这个名字的应用里没看到 Remote，先更新 ChatGPT；
- 电脑上是**最新版的 ChatGPT 桌面版**（macOS 或 Windows），电脑**处于唤醒、联网、并登录了同一个账号和工作区**的状态；
- 该账号或工作区要求的两步验证、SSO 或通行密钥，都要能完成；
- 通过 ChatGPT 工作区使用 Codex 时，管理员可能要先开启 Remote Control 的访问权限，你才能从手机连接。

![开始设置远程控制之前要确认的 6 项条件清单](seed:g870-remote-prerequisites.png)
*图：本站根据 [OpenAI 官方文档：Remote connections](https://learn.chatgpt.com/docs/remote-connections) 整理的示意图*

桌面版的下载和更新见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)，手机端见 [/guides/chatgpt-mobile-app-tips](/guides/chatgpt-mobile-app-tips)。

## 二、设置步骤

官方的步骤，一共四步：

1. **在电脑上开始**：打开电脑上的 ChatGPT 桌面版，进入 **Settings → Connections → Control this Mac or PC**，选 **Set up** 或 **Add**，批准远程访问并完成要求的验证。这个过程会为这台电脑开启远程访问，并显示一个二维码；
2. **扫码**：用手机扫描应用里显示的二维码，二维码会打开 ChatGPT；
3. **在 ChatGPT 里完成**：确认是同一个账号和工作区，完成要求的两步验证、SSO 或通行密钥。设置成功后，这台电脑会出现在 iOS 的 **Codex** 里；如果你的手机应用还显示 **Remote**，就在 Remote 里；
4. **检查电脑上的设置**：在电脑的 **Settings → Connections** 里管理已连接的设备，还可以选择是否保持电脑唤醒、是否启用 Computer Use、是否安装 Chrome 扩展。

几个官方强调的细节：

- 二维码把**这台手机和这台电脑**配对。想用同一部手机控制多台电脑，要分别配对；
- 2026 年 6 月 8 日起用过的现有连接仍然保持配对；如果自 6 月 8 日起没有用过某个连接，请更新两端应用后重新配对；
- 远程访问用的是被控电脑上的项目、对话、文件、凭据、权限、插件和本地工具。

电脑休眠、断网或关闭应用，远程访问都会停止。官方给了一些保持可用的提示：Mac 笔记本可以在盖子打开、接着电源的情况下保持可访问，盖子合上需要同时接外接显示器，选择「睡眠」仍会停止远程访问；Windows 被控端要保持会话解锁。

## 三、出问题时，按官方的办法

![远程控制常见问题与官方处理办法对照图](seed:g870-remote-troubleshooting.png)
*图：本站根据 [OpenAI 官方文档：Remote connections](https://learn.chatgpt.com/docs/remote-connections) 整理的示意图*

**点了 Add 后报错 / 无法启用**
官方：如果你打开 Remote Control 并选 Add 之后看到错误，**重启电脑上的 ChatGPT 桌面版，然后再试一次。** 官方文档没有逐条解释具体的报错文案，所以界面上显示的是什么文字，本文无法给出官方解释；遇到别的报错，先按下面几项排除，再联系客服。

**手机上看不到这台电脑**
确认三件事：电脑上的桌面版正在运行；已经开启 **Allow other devices to connect（允许其他设备连接）**；两台设备用的是同一个 ChatGPT 账号和工作区。如果自 2026 年 6 月 8 日起没用过这个连接，两端更新应用后重新配对。

**退出登录后，远程控制自己关了**
官方说明：退出 ChatGPT 会关闭 Remote Control，但**不会删除**已有的设备配对。重新登录后，把 Remote Control 重新打开，就能恢复之前的连接状态。

**手机上没出现确认请求**
在 iOS 版 ChatGPT 里打开 **Codex**（如果你的应用仍显示 Remote，就打开 Remote）；确认手机和电脑用的是同一个账号和工作区，然后重新扫一次码，或者从电脑重新开始设置。工作区的话，请管理员确认已开启 Remote Control。

**远程会话中途断开**
看电脑是不是休眠了、断网了，或者关闭了应用。ChatGPT 工作期间，要让电脑保持唤醒和联网。

**设置被验证拦住**
按提示完成账号或工作区的验证。如果你的组织要求 SSO、两步验证或通行密钥，先完成那个流程再试；仍然不行，请工作区管理员确认已开启 Remote Control 访问。

## 四、「无法更新远程控制状态」怎么办

这句话在官方文档里没有出现，本文无法给出官方解释。按官方文档的思路，可以依次做：

1. 确认电脑上的桌面版是**最新版**，手机上的应用也是最新版；
2. 确认两端是同一个账号和工作区，没有处在退出登录的状态；
3. **重启电脑上的桌面版**后再试；
4. 工作区账号请管理员确认已开启 Remote Control；
5. 都不行，联系官方客服，见 [/guides/chatgpt-contact-support](/guides/chatgpt-contact-support)，附上报错截图、设备系统和应用版本、你的账号类型（个人或工作区）。

## 常见问题

**Q：个人 Plus 账号能用吗？**
官方文档的前提是账号和工作区里有 Codex 的使用权限。你的套餐有没有，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。看不到入口先更新应用。

**Q：能用 Codex 命令行或 IDE 插件设置吗？**
不能。官方明说手机端设置从桌面应用开始，不能从 Codex CLI 或 IDE 扩展里设置。

**Q：远程控制时，文件和命令是在手机上运行吗？**
不是。仓库文件、本地文档来自被控电脑，命令也在被控电脑或远程环境里运行，沙箱设置、安全控制和操作确认仍然适用。

**Q：电脑关了盖子还能控制吗？**
官方给的说法：Mac 笔记本盖子合上时，要同时接外接显示器；选了「睡眠」就会停止。具体见上面的说明。

**Q：和 Work 有什么关系？**
Work 和 Codex 的区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)；它们的额度也和聊天分开，见 [/guides/chatgpt-usage-limits-check-reset](/guides/chatgpt-usage-limits-check-reset)。

**Q：账号登录有问题？**
见 [/guides/chatgpt-login-problems](/guides/chatgpt-login-problems)。

## 参考资料

- OpenAI 官方文档：Remote connections — https://learn.chatgpt.com/docs/remote-connections （原地址 https://developers.openai.com/codex/remote-connections 会跳转到这里）

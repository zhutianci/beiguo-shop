---
title: Microsoft Copilot 官网入口在哪、怎么下载：网页版、Windows 应用、手机应用和工作账号入口怎么选
slug: microsoft-copilot-official-entry-download
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Microsoft Copilot 有网页版、Windows 应用、手机应用，工作或学校账号还有单独入口。本文按微软支持页面讲清各入口、各自支持的登录账号、Windows 应用从 Microsoft Store 下载，以及怎么区分微软的 Copilot 和 GitHub Copilot。
checkedOn: 2026-10-31
sources:
  - https://support.microsoft.com/zh-cn/microsoft-copilot/getting-started-with-microsoft-copilot
  - https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows
  - https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot
verify:
  - 微软支持页面上网页版个人入口的写法是 copilot.cloud.microsoft.com，实际访问时可能跳转到别的域名，以浏览器最终显示的微软官方域名为准
  - 手机应用的具体商店链接官方页面是以文章形式给出的，本文不写商店搜索结果，请从微软支持页面的链接进入
  - 免费额度和付费订阅的区别本文没有展开，官方这几页没有写价格，以应用内显示为准
---

> 本文根据微软官方支持页面和 Learn 文档整理，资料核对于 2026-10-31。入口域名以微软官方页面为准，不推荐任何第三方「Copilot 下载站」。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 搜「Copilot 官网入口」「Microsoft Copilot 下载」「Copilot 网页版」的人；
- 找不到 Windows 里的 Copilot 应用，想重新装回来的人；
- 分不清微软 Copilot、GitHub Copilot 和 Microsoft 365 Copilot 的人。

## 结论先说

1. **个人用，网页版**：官方支持页面给出的入口是 **copilot.cloud.microsoft.com**。网页版、手机和 macOS 上可以用 Microsoft 账号、Apple ID 或 Google 账号登录。
2. **Windows 应用**：新的 Windows 11 电脑默认已安装，可在任务栏或开始菜单找到；没有就从 **Microsoft Store** 下载（微软页面给的是 Microsoft Store 里的 Copilot 应用页）。**Windows 应用需要 Microsoft 账号**。
3. **工作或学校账号**：用 **m365.cloud.microsoft/chat**（网页）；还可以在 Microsoft 365 应用、Teams、Outlook 等里使用。
4. **手机**：微软提供 iOS 和 Android 的 Copilot 移动应用。
5. 网上很多自称「Copilot 中文版」「免登录」的站点不是微软官方的，不建议使用。

![Microsoft Copilot 官方入口](seed:g1469-entry-compare.png)
*图：本站根据 [微软支持：Microsoft Copilot 入门](https://support.microsoft.com/zh-cn/microsoft-copilot/getting-started-with-microsoft-copilot) 整理的示意图*

## 一、各入口怎么选

| 你的情况 | 用哪个 | 说明 |
| --- | --- | --- |
| 个人，临时用一下 | 网页版 | 不用安装；官方说网页版个人用户可以用 Microsoft、Apple 或 Google 账号登录 |
| 个人，常用 | Windows 应用 | 可以用 Copilot 键、Windows 键 + C 快速唤起；需要 Microsoft 账号 |
| 公司或学校给了账号 | m365.cloud.microsoft/chat | 使用工作或学校账号，会用到组织的数据 |
| 手机上用 | 手机应用 | 微软支持页面里有 iOS 与 Android 的应用说明 |

两种账号的区别，官方的描述是：用工作或学校账号登录时，Copilot 会用组织的数据，例如聊天、电子邮件和文件以及 Web；用个人 Microsoft 账号登录，则用你自己的内容和 Web。

## 二、Windows 应用的下载和使用

1. 先看任务栏和开始菜单有没有 Copilot；
2. 没有，就打开 **Microsoft Store** 搜索 Copilot，确认开发者是 Microsoft Corporation 后获取；
3. 装好后打开，用 Microsoft 工作或学校账号或个人账号登录。官方提醒：用 Entra 工作或学校账号登录消费者版应用，会被重定向到 m365.cloud.microsoft/chat；
4. 想不点图标直接打开：按键盘上的 **Copilot 键**，或 **Windows 键 + C**；
5. 想卸载或不想被误触，见 [/guides/windows-copilot-uninstall-turn-off](/guides/windows-copilot-uninstall-turn-off)。

![下载 Copilot 前先核对](seed:g1469-check.png)
*图：本站根据 [微软支持](https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows) 与 [微软 Learn](https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot) 整理的示意图*

## 三、别和另外两个 Copilot 搞混

- **Microsoft Copilot**：本文讲的这个，是聊天助手；
- **Microsoft 365 Copilot**：工作场景里和 Word、Excel、Teams 等结合，官方提示用工作账号才有，是否需要许可证以微软说明为准；
- **GitHub Copilot**：写代码用的插件，装在 VS Code、JetBrains 等编辑器里，见 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup)。

## 常见问题

**Q：Copilot 和 ChatGPT 是一回事吗？**
不是。区别见 [/guides/chatgpt-vs-microsoft-copilot-difference](/guides/chatgpt-vs-microsoft-copilot-difference)。想用 ChatGPT，会员开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Copilot 免费吗？**
微软这几页没有写具体价格和额度，个人版的免费与付费功能，请以应用内显示为准，价格以微软官方页面为准（2026-10 查询）。

**Q：应用里能搜我电脑上的文件吗？**
官方说 Windows 上的 Copilot 可以帮你查找、打开和询问设备上文件的内容，可以在应用的「帐户 → 设置」里调整「文件搜索」和「文件读取」。

**Q：能用在 Mac 上吗？**
官方说个人账号可用的方式除了网页版，还包括 Windows、macOS、iOS/iPadOS 和 Android 上的专用应用。

## 参考资料

- 微软支持：Microsoft Copilot 入门 — https://support.microsoft.com/zh-cn/microsoft-copilot/getting-started-with-microsoft-copilot
- 微软支持：访问 Windows 上的 Microsoft Copilot — https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows
- 微软 Learn：管理 Windows 上的 Microsoft Copilot — https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。

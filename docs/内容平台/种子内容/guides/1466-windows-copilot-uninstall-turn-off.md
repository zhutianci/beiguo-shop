---
title: Windows 里的 Copilot 是什么软件、能卸载吗、怎么关闭：卸载路径、Copilot 键和 Win+C 的处理，公司电脑怎么管
slug: windows-copilot-uninstall-turn-off
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Windows 11 新电脑上的 Copilot 是微软的 AI 助手应用，可以卸载。本文按微软官方文档讲清它是什么、卸载路径、不想被 Copilot 键或 Win+C 唤起怎么改、卸载后怎么装回来，以及公司电脑上 IT 管理员的 AppLocker 和 PowerShell 做法。
checkedOn: 2026-10-31
sources:
  - https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot
  - https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows
  - https://support.microsoft.com/zh-cn/microsoft-copilot/getting-started-with-microsoft-copilot
verify:
  - 微软官方文档给的是「卸载 Copilot 应用」的路径，没有单独写「隐藏任务栏图标」的步骤，本文不写第三方改注册表或工具的做法
  - 官方文档说 Windows 更新后 Copilot 应用会自动启用，除非之前用组策略阻止，所以大版本更新后应用可能再次出现，是否会再装回以微软当时的更新说明为准
  - 文中 PowerShell 命令是微软 Learn 页面给 IT 管理员的原文，普通用户用「设置」卸载即可
---

> 本文根据微软官方的 Learn 文档和支持页面整理，资料核对于 2026-10-31。微软更新较快，界面名称以你实际看到的为准。配图为本站整理的示意图，不是系统截图。

## 适用于谁

- 搜「Copilot 是什么软件」「Copilot 可以卸载吗」「Windows Copilot 怎么关闭」的人；
- 总被 Copilot 键或 Win+C 误触发的人；
- 公司电脑的 IT 管理员。

## 结论先说

1. **它是微软的 AI 助手应用**。官方说明：新的 Windows 11 电脑默认安装 Copilot 应用，可以在任务栏或开始菜单里找到；用 Microsoft 工作或学校账号，或个人 Microsoft 账号登录。
2. **可以卸载**。官方路径：**设置 → 应用 → 已安装的应用**，找到 Copilot，点右侧三个点，选择**卸载**。
3. **想卸载后再用**：从 Microsoft Store 免费获取。
4. **不想被键盘唤起**：Copilot 键或 Windows 键 + C 可以启动 Copilot 应用；官方说可以在 **设置 → 个性化 → 文本输入** 里，通过「在键盘上自定义 Copilot 键」改成别的应用。
5. 公司电脑：IT 管理员可以用 **AppLocker** 阻止安装或启动，也可以用 **PowerShell** 删除应用（见下文）。

![卸载 Windows 上的 Copilot 应用](seed:g1466-uninstall-steps.png)
*图：本站根据 [微软 Learn：管理 Windows 上的 Copilot](https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot) 整理的示意图*

## 一、它到底是什么

微软把 Copilot 做成了一个应用，官方的说明是「将 AI 的强大功能与数据和应用相结合」。在 Windows 上，常见的用法有：

- 在应用里聊天、写作、总结；
- Copilot 视觉：查看你打开的浏览器、窗口或应用，然后回答问题；
- Copilot 搜索文件：帮助查找、打开设备上的文件，包括同步到设备的 OneDrive 文件，官方写支持 .docx、.xlsx、.pptx、.txt、.pdf 和 .json；
- 截图提问、在侧窗格里打开网页内容、帮助调整 Windows 设置。

文件搜索和文件读取是可以关的：在应用里进入 **帐户 → 设置**，找到「文件搜索」和「文件读取」切换设置。如果你担心它读到本机文件，先看这两项，比卸载更温和。

它和 **GitHub Copilot** 是两个产品：后者是写代码用的插件，见 [/guides/github-copilot-vscode-setup](/guides/github-copilot-vscode-setup)。它和 ChatGPT 的区别见 [/guides/chatgpt-vs-microsoft-copilot-difference](/guides/chatgpt-vs-microsoft-copilot-difference)。

## 二、怎么处理

![Windows 的 Copilot：想怎么处理](seed:g1466-decide.png)
*图：本站根据 [微软 Learn](https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot) 与 [微软支持](https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows) 整理的示意图*

### 卸载

设置 → 应用 → 已安装的应用 → 找到 Copilot → 三个点 → 卸载。这样你就不会再被应用打扰；想用再从 Microsoft Store 装回来。

### 不想卸载，只想不被误触

- **Copilot 键 / Win+C**：官方说，这两个快捷键可以启动完整应用或较小的「快速视图」，行为可以在应用的 **帐户 → 设置 → 键盘快捷方式** 里配置；
- **重新映射 Copilot 键**：设置 → 个性化 → 文本输入 → 「在键盘上自定义 Copilot 键」，下拉选项里有搜索、自定义或当前映射的应用。官方提醒，如果应用选取器里没有 Copilot，需要从 Microsoft Store 重新安装；
- **「Hey Copilot」唤醒词**：官方说明这是可选加入的免提功能，不想用就不开启。

### 公司电脑，IT 管理员

微软给的两种做法：

1. **AppLocker**：在安装 Windows 更新之前配置策略。规则里发行商是 Microsoft Corporation，包名称是 MICROSOFT.COPILOT。启用后，应用没装就阻止安装，已装就阻止启动；
2. **PowerShell 删除**：以 `Get-AppxPackage -Name "Microsoft.Copilot"` 取得完整包名，再用 `Remove-AppxPackage -Package` 删除。

官方还特别提醒：**如果之前没有用组策略阻止，Windows 更新安装后 Copilot 应用会自动启用**，所以想长期禁止，要提前配好策略。个人电脑用户不需要碰这些命令。

## 三、登录时的几个小坑

- 官方说明，Copilot 应用（消费者版）**不支持 Microsoft Entra 账号**，用 Entra 工作或学校账号登录会被重定向到 m365.cloud.microsoft/chat；
- 个人 Microsoft 账号登录后才能用聊天历史记录、图像创建、更长对话和语音等功能；
- Windows 应用需要 Microsoft 账号，网页版和移动端可以用 Microsoft 账号、Apple ID 或 Google 账号登录。

## 常见问题

**Q：卸载了会不会影响 Windows 其他功能？**
官方这几页没有说卸载会影响系统其他功能，只写明它是一个可以卸载的应用。

**Q：卸载后过一段时间又出现了？**
官方文档提示：之前没有用策略阻止的话，Windows 更新后 Copilot 应用会自动启用。想再卸一次，重走一遍路径即可。

**Q：Copilot 的官方入口和下载？**
见 [/guides/microsoft-copilot-official-entry-download](/guides/microsoft-copilot-official-entry-download)。

**Q：我想用 ChatGPT 或 Claude？**
会员开通见 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 和 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- 微软 Learn：管理 Windows 上的 Microsoft Copilot — https://learn.microsoft.com/zh-cn/windows/client-management/manage-windows-copilot
- 微软支持：访问 Windows 上的 Microsoft Copilot — https://support.microsoft.com/zh-cn/microsoft-365-copilot/access-microsoft-365-copilot-on-windows
- 微软支持：Microsoft Copilot 入门 — https://support.microsoft.com/zh-cn/microsoft-copilot/getting-started-with-microsoft-copilot

更多 AI 会员开通可看 [/chongzhi](/chongzhi)。

---
title: ChatGPT 桌面版下载与安装：Windows、Mac、Linux 系统要求，和网页版有什么区别
slug: chatgpt-desktop-app
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 2026 年 7 月起，新版 ChatGPT 桌面 App 把 Chat、Work 和 Codex 合到了一起。本文按官方帮助中心讲清去哪下载正版、Windows / Mac / Linux 系统要求、新版和 ChatGPT Classic 的区别、桌面版比网页版多了什么，以及打不开时怎么重置。
checkedOn: 2026-10-07
sources:
  - https://chatgpt.com/download/
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://help.openai.com/en/articles/9275200-downloading-the-chatgpt-macos-app
  - https://help.openai.com/en/articles/9395554-what-are-the-system-requirements-for-the-chatgpt-macos-app
  - https://help.openai.com/en/articles/9982051-using-the-chatgpt-windows-app
  - https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - Windows 帮助文章仍是早期版本的说法（写「面向付费用户的早期版本」、截图为 GPT-4o），与新版桌面 App「全球所有套餐可用」不一致，正文按发布说明和下载页
  - 新版 Windows App 的系统要求官方未单独更新，正文沿用 Windows 文章的「Windows 10 17763.0 及以上」
  - Free 用户在桌面版使用 Work 为「有限」（价格页），具体额度官方未公开
---

> 本文根据 ChatGPT 官方下载页、OpenAI 帮助中心（Moving to the new ChatGPT desktop app、macOS / Windows App 文章、Built-in browser）和发布说明整理，资料核对于 2026-10-07。

## 适用于谁

- 想在电脑上装 ChatGPT 客户端、不想每次开浏览器的人；
- 搜「ChatGPT 电脑版下载」「ChatGPT 桌面版和网页版有什么区别」的人；
- 电脑上同时出现了「ChatGPT」和「ChatGPT Classic」两个 App，不知道该用哪个的人。

## 结论先说

1. **只从官方渠道下载**：[chatgpt.com/download](https://chatgpt.com/download/)。Mac 版下载页会自动识别 Apple 芯片还是 Intel 芯片；Windows 版也可以在微软商店（Microsoft Store）获取。不要从第三方网站下载所谓「中文版」「破解版」安装包。
2. **2026 年 7 月 9 日起的新版桌面 App** 把三样东西合在一起：**Chat（聊天）**、**Work（端到端完成任务）** 和 **Codex（写代码）**，macOS 和 Windows 全球可用；8 月起 Linux 也有公开预览版。
3. **系统要求**：Mac 需 macOS 14 及以上（Apple 芯片 M1 或更新，或 Intel 处理器）；Windows 需 Windows 10（x64 或 arm64）版本 17763.0 及以上；Linux 预览版支持 Ubuntu 24.04 / 26.04 LTS、Debian 13、Fedora 43 / 44。
4. **ChatGPT Classic 是旧版**，可以继续用，仍会收到模型更新和安全补丁，但 Work、Codex 等新的代理功能只在新版里有。
5. **桌面版比网页版多的**：可以经你授权使用本地文件和桌面应用、内置浏览器、Codex，以及快捷键随时呼出。

## 步骤

### 1. 下载安装

**Mac**：

1. 打开 [chatgpt.com/download](https://chatgpt.com/download/)，页面会给出适合你芯片的安装包；
2. 下载后把 ChatGPT 拖进「应用程序」文件夹；
3. 打开并用 ChatGPT 账号登录。

**Windows**：

1. 从 [chatgpt.com/download](https://chatgpt.com/download/) 或微软商店获取 ChatGPT；
2. 安装后打开，登录账号。

企业 IT 可以用 Intune 等 MDM 工具或 winget 统一部署（Windows 版通过微软商店分发，遵循公司对商店应用的策略）。

**Linux（公开预览）**：从同一个下载页获取。目前支持内置浏览器和 Chrome 里的浏览器操作，但还不能控制其他桌面应用。

### 2. 从旧 App 升级

- **用过 Codex App 的**：照常更新，它会直接变成新版 ChatGPT 桌面 App，原来的 Codex 对话和项目保留，打开时默认进入 Codex。
- **用过旧版 ChatGPT 桌面 App 的**：按 App 内的提示下载新版，用同一账号登录。新版可能与旧版并存，旧版会改名为 **ChatGPT Classic**。下载页底部也提供了 Classic 版的下载链接。

### 3. 认识新版界面

- 左上角菜单切换 **ChatGPT** 和 **Codex**；
- 在 ChatGPT 里，页面顶部的开关切换 **Chat** 和 **Work**；
- Chat 和 Work 的对话一起显示在 **Recents（最近）** 里，可以排序、筛选、置顶；
- 原有的 **Projects（项目）** 也在，进入项目后可以选择用 Chat 聊，或用 Work 带着项目资料干活；
- Codex 是单独的视图，历史记录和 ChatGPT 分开。

云端的 Work 对话会在网页、手机、桌面之间同步；在电脑本地运行的对话只保存在这台电脑上。

## 桌面版和网页版的区别

| | 网页版 chatgpt.com | 新版桌面 App |
| --- | --- | --- |
| Chat 聊天 | ✓ | ✓ |
| Work | Plus 及以上 | ✓（Free / Go 为有限使用） |
| Codex | 不能直接选（手机可通过 Remote 访问桌面的 Codex 对话） | ✓ |
| 使用本地文件和桌面应用 | — | 经你授权可以 |
| 内置浏览器 | — | ✓ |
| 随时呼出的小窗口 | — | ✓ |
| 免安装、任何电脑都能用 | ✓ | — |

**内置浏览器**：在 Work 或 Codex 对话里，按 Mac 的 ⌘+Shift+B 或 Windows 的 Ctrl+Shift+B 打开。你和 ChatGPT 看到的是同一个页面，它可以开多个标签页、下载文件，需要登录时会等你自己输入。内置浏览器有独立的浏览数据，不使用你的 Chrome 资料；需要用到 Chrome 里已登录的会话时，官方建议用 Chrome 扩展。账号密码只在浏览器页面里输入，**不要发在聊天里**。

**快捷键呼出**：Mac 旧版文章写的是 ⌥+空格打开 Chat Bar，Windows 旧版是 Alt+空格打开伴随窗口；新版的快捷键以 App 设置为准。

## 常见问题

**Q：桌面版要钱吗？**
App 本身免费下载，所有套餐都能登录使用；能用哪些功能取决于你的套餐，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

**Q：Mac 系统低于 macOS 14 能装吗？**
不能。官方明确表示不会为更旧的系统发布兼容版本，只能用网页版。

**Q：Windows 版打不开、白屏怎么办？**
官方给出的重置方法：打开 Windows **设置 → 应用 → 已安装的应用**，找到 ChatGPT，点右侧 **•••** → **高级选项** → **重置**。重置后重新登录。还不行就先用网页版，并参考 [/guides/chatgpt-cant-open-loading](/guides/chatgpt-cant-open-loading)。

**Q：同时装着 ChatGPT 和 ChatGPT Classic，要卸载旧的吗？**
不必须。Classic 会继续获得支持；如果你要用 Work 或 Codex，就用新版。

**Q：手机版在哪下载？**
iOS 在 App Store、安卓在 Google Play 搜「ChatGPT」，认准开发者 OpenAI，见 [/guides/chatgpt-mobile-app-tips](/guides/chatgpt-mobile-app-tips)。

## 参考资料

- ChatGPT 官方下载页 — https://chatgpt.com/download/
- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
- OpenAI 帮助中心：Downloading the ChatGPT macOS app — https://help.openai.com/en/articles/9275200-downloading-the-chatgpt-macos-app
- OpenAI 帮助中心：System requirements for the ChatGPT macOS app — https://help.openai.com/en/articles/9395554-what-are-the-system-requirements-for-the-chatgpt-macos-app
- OpenAI 帮助中心：Using the ChatGPT Windows app — https://help.openai.com/en/articles/9982051-using-the-chatgpt-windows-app
- OpenAI 帮助中心：Using the built-in browser in the ChatGPT desktop app — https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
- ChatGPT Release Notes（2026-07-09 新版桌面 App、2026-07-16 界面更新、2026-08-14 Linux 预览）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes

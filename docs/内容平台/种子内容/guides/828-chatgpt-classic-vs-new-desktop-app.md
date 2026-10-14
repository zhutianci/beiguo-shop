---
title: ChatGPT Classic 是什么，和新版 ChatGPT 桌面 App 有什么区别：为什么电脑上有两个 ChatGPT、要不要换
slug: chatgpt-classic-vs-new-desktop-app
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 电脑上突然出现了「ChatGPT」和「ChatGPT Classic」两个应用，哪个是官方新版？按 OpenAI 帮助中心讲清：Classic 是升级前的旧版桌面 App，仍有模型更新和安全补丁；新版把 Chat、Work、Codex 合在一起。怎么迁移、能不能继续用旧版。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
verify:
  - 官方没有给 Classic 的下线日期，只说「发布时无需迁移，继续收到更新和支持」；以后是否停止支持以官方说明为准
  - 官方对旧版的说法是「previous ChatGPT desktop app」，macOS 发布说明明确写了 macOS 版改名为 Classic；Windows 旧版是否同名，官方迁移文章按「两个系统都可能并排安装」的说法写
  - 「新功能优先在新版」是官方「New agent features may be available only in the new app」的意译
---

> 本文根据 OpenAI 帮助中心《Moving to the new ChatGPT desktop app》《ChatGPT macOS app release notes》和 ChatGPT 发布说明整理，资料核对于 2026-10-14。官方文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 打开应用列表，发现同时有「ChatGPT」和「ChatGPT Classic」，不知道删哪个的人；
- 搜「ChatGPT Classic 和 ChatGPT 区别」的人；
- 老用户收到「下载新版桌面 App」的提示，想知道对自己有什么影响的人。

桌面版的下载、系统要求见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)；Chat 和 Work 的区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。

## 结论先说

1. **ChatGPT Classic 就是旧版的 ChatGPT 桌面 App**。官方在 macOS 应用的发布说明里写（2026-07-09）：以前的 ChatGPT macOS 应用现在叫 ChatGPT Classic，可以继续使用，**发布时无需迁移**。
2. **新版叫 ChatGPT**：它在 macOS 和 Windows 上把 **Chat、Work** 放在 ChatGPT 下，和 **Codex** 并列在一个 App 里。
3. **两个可以同时装着**：官方说，新版可能和旧版并排安装，同时存在时你会看到 ChatGPT（新版）和 ChatGPT Classic（旧版）。
4. **Classic 还会更新**：官方说它继续收到模型更新、错误修复、安全补丁，以及对现有企业功能的支持；但 **Work、Codex 这类新的智能体功能只在新版里**。
5. **要用 Work 或 Codex，就用新版**；只是日常聊天，Classic 能继续用。

## 一、两个应用的区别

![Classic 和新版 ChatGPT 的区别：是什么、还能用吗、更新什么、智能体功能](seed:g828-classic-vs-new.png)
*图：本站根据 [OpenAI 帮助中心：Moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app) 整理的示意图*

新版里有什么，官方的概括是：

- **Chat**：提问、搜索、对话；
- **Work**：研究、分析信息，创建文档、表格、演示文稿、报告和 Site；
- **Codex**：用本地文件、代码仓库、终端和开发工具开发软件。

在桌面上，从左上角菜单选 **ChatGPT** 或 **Codex**；在 ChatGPT 里，用页面顶部的开关选 **Chat** 或 **Work**。Chat 和 Work 的对话会一起出现在 **Recents** 里，你原来的 Projects 也会出现在 **Projects** 下面。Codex 是单独的视图，它的历史和 ChatGPT 的历史是分开的。官方还说，快速对话（Quick Chats）仍然可用。

另外，GPT-6 在聊天里的 Intelligent UI（图文并茂的回答）官方说**较旧的 macOS 和 Windows 桌面 App 不支持**，要用网页版或更新后的 App，见 [/guides/chatgpt-gpt6-sol-terra-luna-astra](/guides/chatgpt-gpt6-sol-terra-luna-astra)。

## 二、怎么迁移

![我装的是哪个，要不要换：5 种情况与处理](seed:g828-which-installed.png)
*图：本站根据 [OpenAI 帮助中心：Moving to the new ChatGPT desktop app](https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app) 整理的示意图*

按官方的三种情况：

- **你已经在用 Codex App**：照常更新。更新后它就成为新的 ChatGPT 桌面 App，里面有 Chat、Work 和 Codex。已有的 Codex 对话和项目应该保留；更新后的 App 对已有的 Codex 用户默认打开在 Codex，你可以在设置里保持 Codex 为打开时的默认，并选择 Codex 图标。
- **你已经在用 ChatGPT 桌面 App（旧版）**：按 App 里的提示下载新版桌面 App，然后用同一个 ChatGPT 账号登录。新版可能和你现在的 App 并排安装。
- **第一次安装**：为你的系统下载 ChatGPT 桌面 App，打开并登录。

迁移后：

- **云端 Work 对话**在网页、手机、桌面之间同步：网页或手机上开始的 Work 对话会出现在桌面 App 里；桌面上开始的云端 Work 对话也可以在网页或手机上继续；
- Codex 不能在网页或手机上选择，但手机 App 的 **Remote** 标签里可以访问支持的桌面 Codex 对话。

## 常见问题

**Q：我可以把 ChatGPT Classic 卸载掉吗？**
官方说 Classic 可以继续用，没有要求你卸载。是否卸载由你决定；官方文章没有说卸载 Classic 会影响新版里的账号数据，聊天记录跟着你的 ChatGPT 账号。

**Q：为什么应用列表里两个 ChatGPT 重复了？**
因为新版可能装成另一个独立的应用，和旧版并排存在。官方 FAQ 的说法是：ChatGPT 是带 Chat、Work、Codex 的新应用；ChatGPT Classic 是以前的桌面 App。

**Q：有没有下线日期？**
官方没有给出日期，只说继续收到更新和支持。想及时知道，可以看 OpenAI 的发布说明：https://help.openai.com/en/articles/6825453-chatgpt-release-notes 。

**Q：新版在 Linux 上有吗？**
官方发布说明里写过：桌面 App 在 Ubuntu、Debian、Fedora 的指定版本上有公开预览版；具体系统要求见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)。

## 参考资料

- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
- OpenAI 帮助中心：ChatGPT macOS app release notes — https://help.openai.com/en/articles/9703738-chatgpt-macos-app-release-notes
- OpenAI 帮助中心：ChatGPT release notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 帮助中心：GPT-6 and other models in ChatGPT — https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt

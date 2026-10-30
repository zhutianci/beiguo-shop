---
title: Codex 官网地址在哪、怎么下载：桌面 App、命令行、网页版的官方入口，以及怎么认出假下载站
slug: codex-official-website-download-entry
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: 搜「Codex 官网」容易点到仿冒站。按官方文档，Codex 现在是 ChatGPT 的一部分：macOS、Windows、Linux 有桌面 App，另有命令行和网页版。本文列出各平台的官方入口，并教你辨认假下载站，不推荐任何第三方站点。
checkedOn: 2026-10-30
sources:
  - https://learn.chatgpt.com/docs
  - https://learn.chatgpt.com/docs/app
  - https://learn.chatgpt.com/docs/cli
  - https://learn.chatgpt.com/docs/windows/windows-app
verify:
  - 官方文档首页写 Codex 的安装入口包括 ChatGPT 桌面 App、移动 App、网页、命令行、IDE 扩展；本文只讲桌面 App、命令行与网页入口
  - 官方文档站当前有 developers.openai.com/codex 和 learn.chatgpt.com/docs 两个域名，前者会跳转到后者，之后可能再调整
  - 命令行安装命令来自官方 CLI 页面当天的写法，Windows 与 Homebrew、npm 标签页的命令在核对时没有读到，以官方页面为准
---

> 本文根据 Codex 官方文档（概览、桌面 App、命令行、Windows 应用页面）整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。本文**只写官方入口，不推荐任何第三方「中文版」「镜像」网站**。

## 适用于谁

- 在搜索框里搜「Codex 官网」「Codex 下载」，想确认点的是不是官方页面的人；
- 想知道 macOS、Windows、Linux、命令行分别从哪里装的人；
- 看到「Codex 中文版」「Codex 破解版」，担心是假的人。

## 结论先说

1. **官方文档站是找入口最稳的地方。** 官方文档地址是 [learn.chatgpt.com/docs](https://learn.chatgpt.com/docs)（旧地址 developers.openai.com/codex 会跳转过去），所有平台的安装方式都从这里点进去。
2. **Codex 现在是 ChatGPT 的一部分。** 官方的桌面 App 页面写的是「Download ChatGPT for macOS, Windows, or Linux」，打开 App 后用 ChatGPT 账号登录；所以没有一个叫「Codex」的独立账号体系，账号就是你的 ChatGPT 账号，见 [/guides/chatgpt-and-codex-merged-relationship](/guides/chatgpt-and-codex-merged-relationship)。
3. **想用网页版：** 登录 ChatGPT（chatgpt.com）即可，不需要下载。
4. **想用命令行：** 官方 CLI 页面给的 macOS / Linux 安装命令是 `curl -fsSL https://chatgpt.com/codex/install.sh | sh`，更新用同一条命令。
5. **官方没有「中文版」「破解版」「免登录版」。** 看到这类字样，当成假站处理。

![Codex 各平台官方入口对照](seed:g1350-entry-compare.png)
*图：本站根据 [Codex 官方文档：桌面 App](https://learn.chatgpt.com/docs/app) 与 [命令行](https://learn.chatgpt.com/docs/cli) 页面整理的示意图*

## 一、桌面 App：三个系统各走各的入口

- **macOS：** 官方桌面 App 页面首屏的下载按钮是 Apple Silicon（M 系列芯片）版本；页面没有写其他芯片或系统版本的要求，Intel 芯片的 Mac 请以官方页面为准。
- **Windows：** 官方 Windows 应用文档给的是微软商店入口，也可以用 winget 命令安装，详细步骤、建议装的开发工具、WSL 设置见 [/guides/codex-windows-app-download-install](/guides/codex-windows-app-download-install)。
- **Linux：** 官方文档里有独立的 Linux 桌面 App 页面，从文档首页的「Linux desktop app」进入。

装好以后第一次打开，选「用 ChatGPT 登录」。登录或发消息出问题，看 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。

## 二、命令行：用官方给的命令，别用别人贴的

官方 CLI 页面说明：打开你的项目目录，运行 `codex`，第一次运行时选择「Sign in with ChatGPT」或其他可用的登录方式。macOS / Linux 的安装命令见上面的结论第 4 点。

两点提醒：

- 安装命令请**直接从官方 CLI 页面复制**，不要用别人帖子、群里或视频简介里贴的命令，那里的命令可能被改过；
- CLI 的更新、版本检查见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)，常用命令见 [/guides/codex-cli-commands-cheatsheet](/guides/codex-cli-commands-cheatsheet)。

## 三、怎么认出假下载站

![假的 Codex 下载站怎么辨别](seed:g1350-fake-decide.png)
*图：本站根据 [Codex 官方文档](https://learn.chatgpt.com/docs) 整理的示意图*

可以用下面几条自查：

1. **看网址。** 官方入口在 chatgpt.com、openai.com 和官方文档站这几个域名下；域名拼写相近、多了一段单词的，都不是。
2. **看从哪里点进去的。** 搜索结果前几条经常有广告或仿冒页面，更稳妥的做法是直接输入官方文档地址，或从 ChatGPT 官网进入。
3. **看页面承诺什么。** 「中文版」「免登录」「不限量」「破解」都不是官方会给的东西。
4. **看安装包来源。** Windows 优先走微软商店或官方的 winget 命令；macOS 用官方页面的下载按钮。从网盘、群文件、第三方论坛拿到的安装包不要运行。
5. **看要不要你的密码。** 官方是让你在官方登录页登录，不会让你把账号密码发给某个人或填在某个陌生页面里。

## 常见问题

**Q：Codex 有中文界面吗？**
官方文档里没有语言设置项，设置和中文使用方法见 [/guides/codex-set-chinese-language](/guides/codex-set-chinese-language)。

**Q：需要付费吗？**
下载和安装是官方入口直接提供的；能用多少额度取决于你的 ChatGPT 套餐，详见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。需要升级套餐可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：官方域名以后会变吗？**
文档站已经从 developers.openai.com 迁到 learn.chatgpt.com，旧地址会自动跳转。以后如有调整，以 ChatGPT 官网上的入口为准。

## 参考资料

- Codex 官方文档首页 — https://learn.chatgpt.com/docs
- 官方文档：桌面 App — https://learn.chatgpt.com/docs/app
- 官方文档：命令行 — https://learn.chatgpt.com/docs/cli
- 官方文档：Windows 应用 — https://learn.chatgpt.com/docs/windows/windows-app

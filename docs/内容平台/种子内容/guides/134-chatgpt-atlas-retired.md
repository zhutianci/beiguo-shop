---
title: ChatGPT Atlas 浏览器停用了：还能下载吗、数据怎么迁移、现在用什么替代
slug: chatgpt-atlas-retired
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT Atlas 浏览器已于 2026 年 8 月 9 日停止运行。本文按官方帮助中心讲清 Atlas 为什么停用、书签和历史记录能否迁移、怎么把书签导入 Chrome，以及现在要用 AI 浏览网页该选新版桌面 App 内置浏览器、云端浏览器还是 Chrome 扩展。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/20001371-evolving-atlas-into-chatgpt-for-browser-based-agentic-work
  - https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
  - https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://learn.chatgpt.com/docs/chrome-extension
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - Atlas 停用后已安装的 App 打开会显示什么，官方只写「可能无法打开或浏览」
  - Chrome 扩展的具体功能（侧边对话、标签页提及、浏览器控制）在各浏览器的支持情况以 learn.chatgpt.com 为准
---

> 本文根据 OpenAI 帮助中心《Evolving Atlas into ChatGPT for browser-based agentic work》、内置浏览器文章和发布说明（2026-07-09、2026-08-31）整理，资料核对于 2026-10-07。

## 适用于谁

- 搜「ChatGPT Atlas 下载」「Atlas Windows 版」，想安装这个 AI 浏览器的人；
- 以前用 Atlas，现在打不开了、想找回书签的人；
- 想找一个能让 ChatGPT 帮自己操作网页的替代方案的人。

## 结论先说

1. **Atlas 已经停用**：OpenAI 在 2026 年 7 月 9 日宣布弃用 Atlas，**2026 年 8 月 9 日起停止运行**，给了大约 30 天的过渡期。现在已经不能下载使用，也不会再有安全更新——网上仍在提供的「Atlas 下载」不要装。
2. **为什么停**：官方说明是把基于浏览器的代理能力并入 ChatGPT 和 Codex，在 ChatGPT 里做更强的浏览体验（多标签页、下载、更好的导航、账号登录支持等）。
3. **聊天记录不受影响**：你的 ChatGPT 对话和 Atlas 的浏览数据是分开的，对话照常在 ChatGPT 里。
4. **数据**：书签、打开的标签页、浏览历史**都不会自动转移**；书签可以导出为 HTML 再导入 Chrome；Cookie 和登录会话不能导入其他浏览器。
5. **替代方案**：深度的网页代理任务用**新版 ChatGPT 桌面 App 的内置浏览器**；让任务在后台跑用 **ChatGPT Work 的云端浏览器**；平时在 Chrome 里边看边问用 **ChatGPT 浏览器扩展**（现在也支持 Edge、Brave、Opera、Vivaldi）。

## 步骤：迁移 Atlas 里的数据

如果你电脑上的 Atlas 还能打开，按官方方法把书签带走：

### 1. 从 Atlas 导出书签

1. 打开 Atlas；
2. 打开书签菜单或书签管理器；
3. 选择导出书签；
4. 把导出的 **HTML 文件**保存到你找得到的位置（默认一般在「下载」文件夹）。

### 2. 导入 Chrome

1. 打开 Chrome；
2. 点右上角 **⋮（更多）**；
3. 选 **书签和清单 → 导入书签和设置**；
4. 选择刚才导出的 HTML 文件，点 **打开**，再点 **完成**。

导入的书签可能在一个新的「已导入」文件夹或「其他书签」里，到 Chrome 书签管理器找找。

### 3. 其他数据

- **打开的标签页**、**浏览历史**：不会自动转移，重要页面要自己加书签或把网址复制到文档里；
- **Cookie 和密码**：发布说明提到可以把 Cookie 和密码导出到新版 ChatGPT 桌面 App；Cookie 和会话文件属于敏感数据，除非完全信任对方并清楚风险，否则不要分享。登录会话无法导入其他浏览器，需要重新登录。

## 现在用什么替代

| 需求 | 推荐 | 说明 |
| --- | --- | --- |
| 让 ChatGPT 在网页上一步步完成任务，你在旁边看 | 新版 ChatGPT 桌面 App 的**内置浏览器** | 在 Work 或 Codex 对话里按 ⌘+Shift+B / Ctrl+Shift+B 打开；支持多标签页、下载、登录、标注页面 |
| 把网页任务交出去，关掉电脑也能继续 | ChatGPT Work 的**云端浏览器** | 在 OpenAI 的远程环境里运行，可后台执行（Plus 及以上） |
| 在日常的 Chrome 里边浏览边问、提及当前标签页 | **ChatGPT 浏览器扩展** | 支持 Chrome；2026-08-31 起也支持 Edge、Brave、Opera、Vivaldi |

几点区别：

- **内置浏览器**有独立的浏览数据，不使用你 Chrome 里的登录状态；需要用到 Chrome 已登录的账号、已打开的标签页或扩展时，官方建议用 Chrome 扩展。
- **浏览器扩展**的侧边对话在 Edge、Brave、Vivaldi 可用；Opera 只支持标签页提及和浏览器控制，不支持侧边对话。使用前要先更新桌面 App。
- 不管哪种方式，账号密码只在浏览器页面里输入，**不要发在聊天里**；ChatGPT 在付款、预订等关键操作前会请你确认。

新版桌面 App 的下载与安装见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)，Work 的用法见 [/guides/chatgpt-agent-mode](/guides/chatgpt-agent-mode)。

## 常见问题

**Q：Atlas 还会恢复吗？**
官方没有恢复计划，说法是把相关能力「并入」ChatGPT。

**Q：我还有 Atlas 装在电脑上，可以继续用吗？**
不建议。官方说 8 月 9 日后 Atlas 可能无法打开、浏览或支持代理任务，而且已停止的浏览器不再获得安全维护，应尽快换到受支持的浏览器。

**Q：Windows 上有 Atlas 吗？**
Atlas 已经停用，不要再找安装包。Windows 用户可以用新版 ChatGPT 桌面 App 的内置浏览器，或在 Edge / Chrome 里装 ChatGPT 扩展。

**Q：公司管理员要做什么？**
官方建议管理员确认成员是否在用 Atlas、转告停用时间、提醒导出书签，并检查工作区是否开放了桌面 App 和浏览器扩展，同时更新内部文档。

## 参考资料

- OpenAI 帮助中心：Evolving Atlas into ChatGPT for browser-based agentic work — https://help.openai.com/en/articles/20001371-evolving-atlas-into-chatgpt-for-browser-based-agentic-work
- OpenAI 帮助中心：Using the built-in browser in the ChatGPT desktop app — https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
- OpenAI 帮助中心：Using cloud browser in ChatGPT — https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
- ChatGPT Learn：Chrome extension — https://learn.chatgpt.com/docs/chrome-extension
- ChatGPT Release Notes（2026-07-09 停用 Atlas、2026-08-31 浏览器扩展支持更多浏览器）— https://help.openai.com/en/articles/6825453-chatgpt-release-notes

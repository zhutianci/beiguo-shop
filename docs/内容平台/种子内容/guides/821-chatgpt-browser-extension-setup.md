---
title: ChatGPT 浏览器扩展怎么装、怎么用：支持哪些浏览器、侧边聊天、让 ChatGPT 控制浏览器和权限设置
slug: chatgpt-browser-extension-setup
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 浏览器扩展怎么下载安装？按 OpenAI 官方学习站讲清支持 Chrome、Edge、Brave、Opera、Vivaldi，从桌面 App 的 Computer Use 安装的 6 步、侧边聊天与 @ 控制浏览器能做什么、每个网站的允许与禁止设置，以及连不上的排查。
checkedOn: 2026-10-14
sources:
  - https://learn.chatgpt.com/docs/chrome-extension
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
verify:
  - 官方学习站页面没有写具体的套餐要求，只说「可用性取决于推送进度和你的工作区设置」；发布说明没有说 Free 能否使用
  - 官方页面写的快捷键只有「macOS 上是 Cmd+Shift+句号」一条，Windows 没写
  - 扩展商店的页面和权限提示文案由各浏览器决定，以安装时看到的为准
---

> 本文根据 OpenAI 官方 ChatGPT 学习站《ChatGPT Browser Extension》（learn.chatgpt.com）和 OpenAI 帮助中心的发布说明整理，资料核对于 2026-10-14。官方页面没有配截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 浏览器扩展」「ChatGPT 浏览器扩展下载」，想在网页旁边直接问 ChatGPT 的人；
- 想让 ChatGPT 在你已经登录的网站上帮忙操作，又怕不安全的人；
- 用过 Atlas（已于 2026 年 8 月 9 日停用），想找替代做法的人，见 [/guides/chatgpt-atlas-retired](/guides/chatgpt-atlas-retired)。

## 结论先说

1. **它是什么**：官方说 ChatGPT 浏览器扩展让你在 **Chrome、Microsoft Edge、Brave、Opera、Vivaldi** 里配合 **ChatGPT 桌面 App** 使用。ChatGPT 可以读取、操作你已经登录的网站（官方举例：LinkedIn、Salesforce、Gmail、内部工具）。
2. **官方的下载入口在桌面 App 里**：**Settings → Computer Use** → 选浏览器 → **Install** 会打开该浏览器的扩展商店页面。请从这里进，不要去找来路不明的「第三方插件」。
3. **三个主要功能**：**侧边聊天（Side chat）**，在页面旁边开 ChatGPT；**提及标签页（Tab mentions）**，在桌面 App 里把某个打开的网页当上下文；**浏览器控制**，用 `@` 提及浏览器，让 ChatGPT 去执行任务。
4. **Opera 少一个功能**：Opera 支持标签页提及和浏览器控制，**不支持侧边聊天**。近期的发布说明里，官方说 Edge、Brave、Opera、Vivaldi 是后加入支持的。
5. **默认每个新网站都会先问你**。别随手点「Allow for all sites」。
6. **要先更新桌面 App**：官方说设置新浏览器前先更新桌面 App，是否可用还受推送进度和工作区设置影响。

## 步骤

### 1. 安装

![安装 ChatGPT 浏览器扩展的 6 步](seed:g821-extension-setup.png)
*图：本站根据 [OpenAI 官方 ChatGPT 学习站：Browser extension](https://learn.chatgpt.com/docs/chrome-extension) 整理的示意图*

1. 在电脑上装好要用的浏览器；
2. 在 ChatGPT 桌面 App 里打开 **Settings → Computer Use**。你的浏览器没出现，就展开 **More browsers**；
3. 选中浏览器，如果提示要装所需插件，就照做；
4. 点浏览器旁边的 **Install**，会打开它的扩展商店页面，装上 ChatGPT 扩展，并仔细看浏览器弹出的权限提示；
5. 回到 **Computer Use**，确认这个浏览器旁边显示 **Manage**（说明装好了）；
6. 新开一个 **Work 或 Codex** 对话，用 `@` 选择你的浏览器。注意要使用**装了扩展的那个浏览器配置文件（Profile）**。

`@` 菜单里可选的有 Chrome、Edge、Brave Browser、Opera 和 Vivaldi。浏览器旁边的开关决定它出不出现在 `@` 菜单里，**Manage** 用来改网站权限。

Work 和 Chat 的区别见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)。

### 2. 各浏览器支持什么

![各浏览器能用的功能：标签页提及、浏览器控制、侧边聊天](seed:g821-extension-browsers.png)
*图：本站根据 [OpenAI 官方 ChatGPT 学习站：Browser extension](https://learn.chatgpt.com/docs/chrome-extension) 整理的示意图*

### 3. 怎么用

- **侧边聊天**（Chrome、Edge、Brave、Vivaldi）：打开一个网页，点浏览器工具栏里的 ChatGPT，或者在 **Extensions** 菜单里选它，就可以提问或交代任务。侧边面板会跟着你打开它的那个标签页；在侧边聊天里开的对话会出现在 ChatGPT App 里，你也可以在侧边聊天里打开最近的 ChatGPT 对话。官方页面写 macOS 上的快捷键是 **Cmd+Shift+句号**。
- **选中文字**：在网页上选中一段文字，可以把选中的内容带进对话。
- **右键菜单**：在支持侧边聊天的浏览器里，在网页上点右键，选 **Ask ChatGPT**。
- **YouTube**：视频有字幕时，ChatGPT 可以用带时间戳的字幕文字来解释、总结或回答问题。
- **提及标签页**：在桌面 App 里提及某个打开的标签页，把它当上下文。
- **控制浏览器**：`@` 选浏览器，让它去办事，官方的例子是：

```
@Edge 打开 Salesforce，根据这些通话记录更新这个客户的信息。
```

- **内置浏览器**：用 `@Browser` 让 ChatGPT 控制它自己的内置浏览器。官方说它支持登录，并且不使用你平时的浏览器配置文件，适合 localhost 之类的用途。

### 4. 网站权限怎么设

官方说明：默认情况下，ChatGPT 在**每个新网站**（按主机名算，比如 example.com）上操作前都会问你。弹出的选项有：

- **Allow once**（仅允许这一次）
- **Allow for this site**（允许这个网站）
- **Allow for all sites**（允许所有网站）
- **Decline**（拒绝）

要管理权限：**Settings → Computer Use**，点浏览器旁边的 **Manage**，可以编辑**允许名单**（ChatGPT 不用再问就能用的网站）和**禁止名单**（不该使用的网站）。支持的浏览器共用这套权限。把网站从允许名单里删掉，之后会重新问你；从禁止名单里删掉，它可以重新来问你，而不是直接当作禁止。

**风险较高的设置：**

- 选 **Allow for all sites** 会取消所有网站的确认提示。官方说，只有你信任 ChatGPT 能操作浏览器里打开的任何网站时才选它。
- **浏览器历史记录**可能含有敏感信息：内部网址、搜索词、登录后的活动。如果你允许，相关记录可能成为任务上下文，恶意网页内容也可能增加数据被复制到别处的风险。官方说 ChatGPT 每次要用历史都会问你，只在这次请求范围内访问，**没有「始终允许」选项**。
- 官方一再提醒：把网页内容当作**不可信的上下文**，让它继续之前先看看网站。

### 5. 隐私与数据

- 装 Chrome 扩展时，Chrome 的安装提示里可能列出一长串权限，比如读取和更改所有网站上的数据、读取和更改登录设备上的浏览记录、管理书签和下载、与本机应用通信、管理标签页分组等。官方说这些是浏览器流程需要的，ChatGPT 自己仍会应用确认、设置和允许 / 禁止名单。
- **记忆（Memories）**：开着记忆，ChatGPT 在浏览器任务里可以用相关的已保存记忆；关着就不用。
- **保存什么**：官方说 OpenAI 不单独保存你浏览器操作的完整记录；只有当浏览器活动成为 ChatGPT 上下文（比如它读到的页面文字、截图、工具调用、摘要或消息）时才会保存。不要发密码、密钥或高度敏感的数据，并留在电脑旁边审核每个提示。

## 连不上怎么办

![浏览器扩展连不上：按顺序排查](seed:g821-extension-troubleshoot.png)
*图：本站根据 [OpenAI 官方 ChatGPT 学习站：Browser extension](https://learn.chatgpt.com/docs/chrome-extension) 整理的示意图*

官方的排查顺序是：先确认这个网站不在禁止名单里，然后：

1. 更新 ChatGPT 桌面 App；如果装了多个 ChatGPT 或 Codex 桌面 App，每个都更新，或把不用的删掉；
2. 重启浏览器。在 Chrome、Edge、Brave、Vivaldi 里，从工具栏或 **Extensions** 菜单重新打开 ChatGPT，确认侧边聊天能加载；Opera 则在桌面 App 里检查连接；
3. 在 **Settings → Computer Use** 里确认浏览器显示 **Manage**；如果显示 **Install**，重走一遍安装；`@` 菜单里没有它，就打开它的开关；
4. 用安装并启用了扩展的那个浏览器配置文件；
5. 新开一个 Work 或 Codex 对话重试；
6. 重启桌面 App 重试；还是连不上，通过 **Settings → Computer Use** 重装扩展；
7. 仍然不行，在 App 里运行 `/feedback`，联系客服时附上对话 ID。

**在 Chrome 里上传文件**：打开扩展图标 → **Manage Extensions** → 在扩展卡片上点 **Details** → 打开 **Allow access to file URLs**，然后重启 Chrome 里的任务。

## 常见问题

**Q：浏览器扩展要付费吗？**
官方学习站页面没有列出套餐要求，只说可用性取决于推送进度和工作区设置。Work 本身面向符合条件的付费套餐，见 [/guides/chatgpt-chat-vs-work-difference](/guides/chatgpt-chat-vs-work-difference)；开通可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：和 ChatGPT 桌面 App 自带的内置浏览器有什么区别？**
扩展用的是你日常的浏览器和你已经登录的网站；内置浏览器是 ChatGPT 自己的浏览器，不用你平时的浏览器配置文件，但支持在里面登录。官方还说，网站工具（site tools）在内置桌面浏览器里可用，**不通过 Chrome 扩展**。

**Q：手机上能用吗？**
官方页面讲的是电脑上的浏览器配合桌面 App，没有写手机。

**Q：Atlas 停用后用什么？**
官方发布说明写的是：想要更深入的浏览器智能体工作，用 ChatGPT 桌面 App；想在 Chrome 里浏览时得到帮助，用 ChatGPT 的 Chrome 扩展或侧边栏（在可用的地方）。见 [/guides/chatgpt-atlas-retired](/guides/chatgpt-atlas-retired)。

## 参考资料

- OpenAI 官方 ChatGPT 学习站：ChatGPT Browser Extension — https://learn.chatgpt.com/docs/chrome-extension
- OpenAI 帮助中心：ChatGPT release notes（浏览器扩展支持更多浏览器；Atlas 停用） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 帮助中心：Moving to the new ChatGPT desktop app — https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app

---
title: Codex 插件在哪装：桌面 App 的 Plugins 标签、CLI 的 /plugins、IDE 为什么没有，以及插件和技能、MCP 的区别
slug: codex-plugins-where-to-install
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex 的插件在 ChatGPT 桌面 App 的 Plugins 标签里装，命令行输入 /plugins，IDE 插件不支持。本文按官方文档讲各入口怎么装、装完怎么用、用 API 密钥登录时有什么限制，以及插件、技能、MCP 服务器的区别。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/plugins
  - https://learn.chatgpt.com/docs/skills-and-plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://learn.chatgpt.com/docs/auth
verify:
  - 官方说明目前 ChatGPT 和 Codex 使用同一个通用插件目录，目录分类标签、插件名单和桌面专用插件会随更新变化，以官方文档和你账号里实际显示的为准
  - 官方说 Apple Messages 插件只在 macOS 的 ChatGPT 桌面 App 提供，且当前版本只包含在 Apple Silicon 构建里，本文只在这一处点名具体插件
  - 官方没有写 Codex 插件的数量，也没有列完整名单，本文不写数字
---

> 本文根据 Codex 官方文档《Plugins》《Skills & Plugins》《Build skills》《Authentication》整理，资料核对于 2026-10-27。插件目录的内容会随更新变化，本文只讲装在哪、怎么用。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想给 Codex 装插件，找不到入口的人；
- 在 IDE 插件里找不到 Plugins 的人；
- 搞不清插件、技能（Skills）、MCP 服务器有什么区别的人；
- 用 API 密钥登录，想知道能不能装插件的人。

## 结论先说

1. **桌面 App**：打开 **Plugins** 标签，搜索或浏览，点进详情，点加号安装；安装后在新对话里就能用。
2. **命令行（Codex CLI）**：在会话里输入 `/plugins` 打开插件浏览器，从已配置的市场里装；**装完要新开一个会话**才能用它带的技能或工具。
3. **IDE 插件不支持插件**：官方明确写了，要在桌面 App 或 CLI 里浏览和安装。
4. 插件**不是单独的东西**：它是一个可安装的包，里面可以有技能、MCP 服务器、浏览器扩展和钩子。
5. ChatGPT 和 Codex **共用同一个插件目录**，所以网页版和桌面版里能看到同样的公共插件。

![在 ChatGPT 桌面 App 里安装插件](seed:g1172-install-steps.png)
*图：本站根据 [Codex 官方文档：Plugins](https://learn.chatgpt.com/docs/plugins) 整理的示意图*

## 一、各入口的支持情况

![各入口对插件的支持](seed:g1172-surfaces-compare.png)
*图：本站根据 [Codex 官方文档：Plugins](https://learn.chatgpt.com/docs/plugins) 整理的示意图*

补充几点官方说明：

- 插件在 **Chat 和 Work** 里通用（ChatGPT 网页、桌面、手机），也在桌面 App 里的 **Codex** 里使用；
- 标了 **Desktop only**（仅桌面）的插件需要 ChatGPT 桌面 App，在网页上可以浏览，但要打开桌面 App 才能安装和使用，**手机上用不了**；
- 工作区管理员可以导入并同步一个 GitHub 市场，给团队使用，另有插件管控，个人用户不用管。

## 二、桌面 App 里怎么装

官方的步骤（本站转述）：

1. 在 **Plugins** 标签里搜索或浏览插件，打开详情；
2. 点加号安装；
3. 如果插件需要连接 MCP 服务器，按提示连接。有的插件在安装时就要求登录，有的等到第一次使用时才要求；
4. 安装后**新开一个对话**，让 ChatGPT 或 Codex 使用这个插件。

目录里的标签：**OpenAI**（OpenAI 出品的插件）、**你的工作区名**（工作区提供的）、**Personal**（个人市场，含「Created by me」「Shared with me」），另有单独的 **Installed** 一栏看已装的。

### 怎么用

- **直接描述要做的事**：比如「总结今天未读的 Gmail 邮件」「从 Google Drive 找最新的发布说明」，让 ChatGPT 自己选合适的已装工具；
- **指定某个插件**：输入 `@` 调用插件或它自带的技能，适合你想明确用哪个的时候。官方说明在 ChatGPT 里技能用 `@`，在 Codex 里用 `$`，见 [/guides/codex-skills-how-to-use-install](/guides/codex-skills-how-to-use-install)。

官方文档点名的一个例子：Apple Messages 插件，在 macOS 的 ChatGPT 桌面 App 里提供，可以读取和搜索本机的 iMessage、短信和 RCS，并通过「信息」App 代你发送；默认只在你批准消息及收件人后才发，当前版本只包含在 Apple Silicon 构建里。

## 三、命令行里怎么装

在 Codex CLI 里输入 `/plugins` 打开插件浏览器。官方说它用于浏览已装和可发现的插件、查看插件的工具、安装建议的插件、管理插件的可用性。装好后要**新开会话**才能使用它的技能和工具。命令参考里 `/plugins` 的说明是「Browse installed and discoverable plugins」。

## 四、插件、技能、MCP 有什么区别

官方《Skills & Plugins》的区分：

| 概念 | 官方说法 |
| --- | --- |
| 技能（Skill） | 为某类任务打包的指令和辅助资源，Codex 可在需要时加载 |
| MCP 服务器 | 把 ChatGPT 和 Codex 连到 GitHub、Slack、Google Drive 等系统的服务，定义工具、负责认证、返回结构化数据 |
| 插件（Plugin） | 可安装的包，可以包含技能、MCP 服务器、浏览器扩展和生命周期钩子 |

官方的选择建议：只需要一个聚焦任务的可复用指令，用**技能**；想要一个可安装的、能把指令和外部服务组合起来的包，用**插件**。手动配 MCP 见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。钩子（Hooks）是在 Codex 生命周期的指定时刻运行的命令，官方提醒：钩子脚本要在执行环境里存在，在网页上安装插件不会部署这些脚本，并且要先审阅并信任插件钩子再运行。

## 五、用 API 密钥登录时

官方说：用 OpenAI API 密钥登录 Codex，可以在 Codex CLI 和桌面 App 的 Codex 里浏览、安装和管理受支持的 OpenAI 官方精选插件；但**有些插件在 API 密钥登录下不可用**，因为它们的连接流程需要不被支持的 OAuth 能力。用量到 OpenAI 平台的用量页面查看。登录方式的区别见 [/guides/codex-401-unauthorized-error](/guides/codex-401-unauthorized-error)。

## 六、找不到插件怎么办

- 在 IDE 插件里找不到：这是官方设计，IDE 不支持插件，换到桌面 App 或 CLI；
- 桌面 App 里没有 Plugins 标签：先把 App 更新到最新版，工作区账号还要问管理员是否开放了插件；
- 装好了没出现在对话里：新开一个对话或新会话，插件带来的技能和工具对新对话生效；
- 想自己做插件：见官方 Build plugins 文档；站内入门见 [/guides/chatgpt-plugins-connected-apps](/guides/chatgpt-plugins-connected-apps)。

## 常见问题

**Q：插件要付费吗？**
官方文档没有给插件统一的价格，不同插件连接的外部服务可能有各自的账号要求。Codex 本身包含在 ChatGPT 各套餐里，额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)，想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Codex 的技能去哪找？**
官方说本地技能放在仓库、用户、管理员和系统几类位置，也可以用 `$skill-installer` 安装精选技能，见 [/guides/codex-skills-how-to-use-install](/guides/codex-skills-how-to-use-install)。

**Q：插件会读我的数据吗？**
官方说插件连接外部服务时，会让你登录并审阅它请求的权限，批准是一个单独的步骤。用之前先读权限提示。

## 参考资料

- Codex 官方文档：Plugins — https://learn.chatgpt.com/docs/plugins
- Codex 官方文档：Skills & Plugins — https://learn.chatgpt.com/docs/skills-and-plugins
- Codex 官方文档：Build skills — https://learn.chatgpt.com/docs/build-skills
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth

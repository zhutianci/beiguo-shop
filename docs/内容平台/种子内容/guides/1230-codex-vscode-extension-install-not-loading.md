---
title: Codex VS Code 扩展怎么装、不加载怎么办：侧边栏入口、Windows 缺 C++ 工具、WSL 设置和登录方式
slug: codex-vscode-extension-install-not-loading
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: "Codex 的 VS Code 扩展 ID 是 openai.chatgpt，装好后点侧边栏的 Codex 图标，看不到就用命令面板运行 Codex: Open Codex Sidebar。本文按官方文档整理安装、登录、不加载时的排查：Windows 缺 C++ 工具、WSL 设置、启动设置。"
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/codex/ide
  - https://learn.chatgpt.com/docs/developer-settings
  - https://learn.chatgpt.com/docs/windows/windows-sandbox
  - https://learn.chatgpt.com/docs/auth
verify:
  - 官方没有给出「扩展不加载」的专门排查页，也没有报错原文，本文把官方的入口说明、Windows 扩展无响应说明和设置项整理成排查顺序
  - 扩展商店里的显示名称官方没有写死，本文用官方给的扩展 ID openai.chatgpt 作为查找依据
  - 官方说 IDE 扩展不支持插件，JetBrains 和 Xcode 是各自的集成而不是这个扩展
---

> 本文根据 Codex 官方文档《Codex IDE extension》《IDE extension settings》《Windows sandbox》《Authentication》整理，资料核对于 2026-10-28。官方没有「扩展不加载」的专门排查页，本文按官方入口和设置整理。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想在 VS Code（或 Cursor、Windsurf）里装 Codex 的人；
- 装好了但侧边栏没有 Codex，或点了没反应的人；
- 在 Windows 或 WSL 里用的人。

## 结论先说

1. **官方扩展的 ID 是 `openai.chatgpt`**，VS Code、Cursor、Windsurf 都用这个扩展。
2. **打开方式**：点侧边栏的 Codex 图标；看不到图标，就打开命令面板，运行 **Codex: Open Codex Sidebar**。
3. **登录**：未登录界面选 **Sign in with ChatGPT**，或选 **Use API Key**，输入密钥后点 **OK**。
4. **Windows 上装好但没反应**：官方说可能是系统缺 C++ 开发工具，需要 Visual Studio Build Tools（C++ 工作负载）和 Microsoft Visual C++ Redistributable（x64），装好后**完全重启 VS Code**。
5. **项目在 WSL 里**：设置 `chatgpt.runCodexInWindowsSubsystemForLinux`，改动会重新加载 VS Code。

![在 VS Code 里装 Codex 扩展](seed:g1230-install-steps.png)
*图：本站根据 [Codex 官方文档：Codex IDE extension](https://learn.chatgpt.com/docs/codex/ide) 整理的示意图*

## 一、安装和打开

官方步骤：安装或启用 Codex 后，登录，在编辑器里开始对话。VS Code 及兼容的编辑器用 Codex 扩展；Xcode 和 JetBrains IDE 提供各自的集成。

- **Xcode**：打开编码助手，新建对话，选 Codex 作为智能体；
- **JetBrains**：打开 AI Chat 并选 Codex；
- 开始第一个对话时，官方建议先在任务前后做 Git 检查点，方便撤销改动。

登录方式的区别（ChatGPT 账号与 API 密钥）见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)；入门总览见 [/guides/codex-getting-started](/guides/codex-getting-started)。

## 二、不加载、没反应，逐项排查

![Codex 扩展不加载：对照排查](seed:g1230-notload-decide.png)
*图：本站根据 [Codex 官方文档](https://learn.chatgpt.com/docs/developer-settings) 整理的示意图*

### 1. 侧边栏没有图标

官方写明：图标不可见时，用命令面板运行 **Codex: Open Codex Sidebar**。想让每次启动 VS Code 都自动聚焦 Codex 侧边栏，把设置 `chatgpt.openOnStartup` 设为 `true`（默认是 `false`）。设置在 VS Code 里搜索 `@ext:openai.chatgpt` 或设置名即可，也可以在扩展的齿轮图标里选 **Codex Settings > Open config.toml** 打开配置文件。

### 2. Windows 上装好了但没反应

官方《Windows sandbox》里的「IDE extension is installed but unresponsive」：系统可能缺 C++ 开发工具，部分原生依赖需要它。需要装 Visual Studio Build Tools（C++ 工作负载）和 Microsoft Visual C++ Redistributable（x64）。官方给的 winget 命令是 `winget install --id Microsoft.VisualStudio.2022.BuildTools -e`。装完后要**完全重启 VS Code**。沙箱本身的问题见 [/guides/codex-windows-sandbox-setup-failed](/guides/codex-windows-sandbox-setup-failed)。

### 3. 项目在 WSL 里

设置 `chatgpt.runCodexInWindowsSubsystemForLinux`（仅 Windows，默认 `false`）：在 WSL 可用时让 Codex 跑在 WSL 里，适合仓库和工具链在 WSL2 的情况，修改后会重新加载 VS Code。

### 4. 想用插件，但 IDE 里没有

官方明确：IDE 扩展**不支持插件**，要浏览和安装插件，用桌面 App 或命令行，见 [/guides/codex-plugins-where-to-install](/guides/codex-plugins-where-to-install)。

### 5. 其他常用设置

官方列了几个扩展设置：`chatgpt.commentCodeLensEnabled` 在 `TODO` 注释上方显示 CodeLens；`chatgpt.followUpQueueMode` 决定运行中发的消息是排队（`queue`）还是插入当前回合（`steer`）；`chatgpt.composerEnterBehavior` 决定 Enter 是否直接发送；`chatgpt.localeOverride` 设界面语言，留空自动检测；`chatgpt.cliExecutable` 只用于开发，**手动覆盖内置的可执行文件可能让扩展的部分功能失效**。这些 `chatgpt.*` 设置属于扩展，不写进 `config.toml`。

## 三、和桌面 App 同时用

官方说明：桌面 App 和 IDE 扩展在同一项目里打开时，会共享活动对话和编辑器上下文；在 App 输入框打开 **IDE context** 就能让 Codex 用你编辑器里打开的文件。提示「This is open in another app」的情况见 [/guides/codex-vscode-open-in-another-app](/guides/codex-vscode-open-in-another-app)。

## 常见问题

**Q：扩展登录后没有额度？**
额度按你的 ChatGPT 套餐算，见 [/guides/codex-usage-limits](/guides/codex-usage-limits)；想开通 Plus 可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Cursor 里能装吗？**
官方文档把 Cursor 列在可装扩展的编辑器里，同样用 `openai.chatgpt`。Cursor 自己的功能和 Codex 的对比见 [/guides/cursor-vs-claude-code-vs-codex](/guides/cursor-vs-claude-code-vs-codex)。

**Q：其他报错怎么对照？**
见 [/guides/codex-common-errors-summary](/guides/codex-common-errors-summary)。

## 参考资料

- Codex 官方文档：Codex IDE extension — https://learn.chatgpt.com/docs/codex/ide
- Codex 官方文档：IDE extension settings — https://learn.chatgpt.com/docs/developer-settings
- Codex 官方文档：Windows sandbox — https://learn.chatgpt.com/docs/windows/windows-sandbox
- Codex 官方文档：Authentication — https://learn.chatgpt.com/docs/auth

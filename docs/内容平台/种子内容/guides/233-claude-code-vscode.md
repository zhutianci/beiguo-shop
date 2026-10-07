---
title: Claude Code VS Code 插件使用教程：安装、登录与常用操作
slug: claude-code-vscode
products: [claude]
models: []
accountTier: PLUS
excerpt: 在 VS Code（及 Cursor 等）里用 Claude Code：扩展安装、登录、@ 引用文件和选中代码、审阅改动、切换模型与权限模式、快捷键、和命令行版的区别，以及图标不见、没反应等常见问题。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/vs-code
  - https://code.claude.com/docs/en/permission-modes
  - https://code.claude.com/docs/en/checkpointing
  - https://code.claude.com/docs/en/setup
---

> 本文根据 Claude Code 官方文档《Use Claude Code in VS Code》整理，核对日期 2026-10-07；截图引用自官方文档。扩展更新频繁，部分功能注明了最低版本要求，以你安装的扩展版本为准。

## 适用于谁

- 平时用 VS Code（或 Cursor 等 VS Code 系编辑器）写代码，不想切到终端用 Claude Code 的人；
- 搜「claude code vscode 使用教程」「vscode 切换模型」「vscode 配置」的人；
- 已经在用命令行版，想知道插件版和命令行版有什么区别的人。

## 结论先说

1. 官方说 VS Code 扩展是**在 VS Code 里使用 Claude Code 的推荐方式**：图形界面、并排 diff、可以在 Markdown 里批注 plan、多标签多会话。
2. 要求：**VS Code 1.94.0 及以上**，以及任一付费 Claude 订阅（Pro / Max / Team / Enterprise）或 Claude Console 账号，**不需要 API Key**。
3. 扩展自带一份 Claude Code 内核，但**不会把 `claude` 命令加进系统 PATH**；想在 VS Code 终端里敲 `claude`，还得单独安装命令行版。
4. 选中代码 Claude 会自动看到；`Alt+K`（Mac 是 `Option+K`）插入带行号的 `@文件#行号` 引用；`Ctrl+Esc`（Mac `Cmd+Esc`）在编辑器和 Claude 输入框之间切换焦点。
5. 插件版只支持部分斜杠命令，`!` 执行 shell、Tab 补全只在命令行版有。

![VS Code 中打开 Claude Code 扩展：右侧面板里 Claude 正在读取文件并为它编写单元测试](seed:g233-vscode-panel.jpg)
*图片来源：[Claude Code 官方文档《Use Claude Code in VS Code》](https://code.claude.com/docs/en/vs-code)*

## 步骤

### 1. 安装扩展

在 VS Code 里按 `Ctrl+Shift+X`（Mac `Cmd+Shift+X`）打开扩展视图，搜索「Claude Code」，认准发布者 Anthropic，点击 Install。Cursor 等其他 VS Code 系编辑器同样在扩展视图里搜；装不上的编辑器还可以从 Open VSX 安装，或者干脆在它的内置终端里用命令行版。

扩展的版本号就是它内置的 Claude Code 版本号，比如某个功能要求 v2.1.286，就需要 2.1.286 及以上的扩展。装完图标没出现，执行命令面板里的「Developer: Reload Window」。

### 2. 打开面板并登录

Claude Code 在 VS Code 里的标志是一个火花（Spark）图标。打开方式：

- **编辑器右上角工具栏的火花图标**（最快，但必须先打开一个文件才会显示）；
- 左侧活动栏的火花图标：打开会话列表；
- 命令面板 `Ctrl+Shift+P` 输入「Claude Code」，选「Open in New Tab」等；
- 窗口右下角状态栏的「✻ Claude Code」（没打开文件也能用）。

第一次打开会出现登录页，点 **Sign in** 后在浏览器里完成授权。之后如果看到「Not logged in · Please run /login」，扩展会自动重新弹出登录页。

### 3. 提问与引用代码

- **选中代码直接问**：Claude 自动能看到你选中的内容，输入框底部会显示选中了几行。
- **插入引用**：按 `Alt+K` 插入类似 `@app.ts#5-10` 的引用。
- **@ 文件或文件夹**：输入 `@auth` 会模糊匹配 auth.js、AuthService.ts 等；文件夹结尾加 `/`，例如 `@src/components/`。
- **附图片 / 文件**：图片直接粘贴进输入框；文件按住 `Shift` 拖进输入框。
- **多行输入**：`Shift+Enter` 换行，`Enter` 发送。

注意：Claude 默认还能看到你当前打开的是哪个文件；如果只想给它选中的部分，可以关掉 Attach Open File 设置。被 `files.exclude`、`search.exclude` 或 `.gitignore` 排除的文件，聊天面板只会发送路径而不发送选中的文字。

### 4. 审阅改动

能不能直接改文件，取决于输入框底部显示的**权限模式**：

- **Auto / Edit automatically**：大部分文件直接改，不逐个询问；
- **Manual**：要改文件时，先显示原文件和修改方案的左右对比，再问你是否接受。你可以接受、拒绝，或者告诉 Claude 换个做法；也可以直接在 diff 里手动改，Claude 会被告知你改过。

![Manual 模式下，VS Code 左侧显示 Claude 要给 utils.py 加的文档注释（绿色高亮），右侧询问「Make this edit to utils.py?」，可选是、是且不再询问、否，或告诉 Claude 换个做法](seed:g233-vscode-diff-review.png)
*图片来源：[Claude Code 官方文档《Use Claude Code in VS Code》](https://code.claude.com/docs/en/vs-code)*

改动多时，可以用每处改动下方的 **Accept this change / Reject this change** 逐个审（v2.1.275 起；超过 100 处改动时只能整文件审）。

### 5. 切换权限模式、模型和 Plan

- **权限模式**：点输入框底部的模式标识，可选 Manual、Edit automatically、Plan、Auto、Bypass permissions（最后一个要先在扩展设置里打开 Allow dangerously skip permissions）。v2.1.283 起默认从 Auto 开始。想固定起始模式，在 VS Code 用户设置里设 `claudeCode.initialPermissionMode`。各模式区别详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。
- **Plan 模式**：Claude 先写方案，VS Code 会把方案作为完整的 Markdown 文档打开，你可以在里面加行内批注反馈，再批准执行。也可以在输入框输入 `/plan 修复登录 bug`。
- **切换模型**（常被搜成「vscode claude code 切换模型」）：点输入框底部的模型名，或在 `/` 菜单里选「Switch model…」；新版本直接输入 `/model` 也能打开选择器。支持推理强度的模型会多一行 Effort。
- **扩展思考**：在 `/` 命令菜单里打开。

### 6. 多会话、历史与回退

- **多个对话并行**：命令面板里「Open in New Tab」或「Open in New Window」，每个对话有独立的上下文。
- **历史记录**：面板顶部的 Session history 按钮，可以搜索、重命名、归档。14 天没动静的会话默认会自动归档（可在设置里改）。
- **回退**：鼠标悬停在任意消息上点回退按钮，可选「从这里分叉对话」「把代码回退到这里」「分叉并回退代码」。
- **和命令行互通**：扩展和命令行版共用对话历史，在终端里 `claude --resume` 可以接着扩展里的对话继续。
- **继续网页版的云端会话**：用 Claude.ai 订阅登录时，Session history 里有 Web 标签，可以把 claude.ai 上的云端会话拉到本地继续。

### 7. 查看用量

在输入框输入 `/usage` 打开 Account & usage 窗口：订阅账号会显示当前会话和本周额度的进度条及重置时间，还会提示哪些行为（缓存未命中、长上下文、大量子代理等）消耗较多。额度规则详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

## 常用快捷键

| 操作 | Windows / Linux | Mac |
| --- | --- | --- |
| 在编辑器和 Claude 输入框间切换焦点 | `Ctrl+Esc` | `Cmd+Esc` |
| 在新标签页打开新对话 | `Ctrl+Shift+Esc` | `Cmd+Shift+Esc` |
| 插入当前文件和选区的 @ 引用 | `Alt+K` | `Option+K` |
| 重新打开刚关闭的 Claude 标签 | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| 切换专注视图（隐藏工具调用细节） | `Ctrl+Alt+F` | `Ctrl+Option+F` |
| 换行不发送 | `Shift+Enter` | `Shift+Enter` |

## 插件版和命令行版的区别

| 功能 | 命令行版 | VS Code 扩展 |
| --- | --- | --- |
| 斜杠命令和技能 | 全部 | 部分（输入 `/` 查看） |
| MCP 服务器配置 | 支持 | 支持（面板里 `/mcp` 管理） |
| 检查点回退 | 支持 | 支持 |
| `!` 直接执行 shell | 支持 | 不支持 |
| Tab 补全 | 支持 | 不支持 |

需要命令行独有的功能时，在 VS Code 的集成终端（`` Ctrl+` ``）里运行 `claude` 即可，它会自动和编辑器集成（显示 diff、共享诊断信息）。前提是已经单独装了命令行版，安装方法详见本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》。喜欢命令行界面又想留在扩展里，也可以在扩展设置里勾选 **Use Terminal**。

## 常见问题

**Q：找不到火花图标？**
官方排查顺序：先打开一个文件（只打开文件夹不显示）；确认 VS Code 版本 ≥1.94.0（帮助 → 关于）；执行「Developer: Reload Window」；临时停用其他 AI 扩展（如 Cline、Continue）；确认工作区不是「受限模式」（扩展在受限模式下不工作）。也可以直接点右下角状态栏的「✻ Claude Code」。

**Q：设置了 `ANTHROPIC_API_KEY` 还是让我登录？**
VS Code 可能没继承你的 shell 环境变量。官方建议在终端里用 `code .` 启动 VS Code，或者直接用 Claude 账号登录。

**Q：Mac 上 `Cmd+Esc` 没反应？**
macOS Tahoe 及以后，系统的「游戏叠加层」默认占用了 `Cmd+Esc`。到「系统设置 → 键盘 → 键盘快捷键 → 游戏控制器」取消勾选，或在 VS Code 快捷键设置里给「Claude Code: Focus input」换个键。

**Q：发了消息一直没反应？**
检查网络；新开一个对话试试；在终端里运行 `claude` 看是否有更详细的报错。仍有问题可以到官方 GitHub（anthropics/claude-code）提 issue。

**Q：怎么彻底卸载？**
扩展视图里搜「Claude Code」点 Uninstall。注意：只要你在 VS Code 集成终端里运行过 `claude`，它会自动把扩展装回来；想避免，在 `/config` 里关掉 Auto-install IDE extension，或设置 `autoInstallIdeExtension` 为 `false`。

## 参考资料

- Use Claude Code in VS Code（官方）：https://code.claude.com/docs/en/vs-code
- Choose a permission mode（官方）：https://code.claude.com/docs/en/permission-modes
- Checkpointing（官方）：https://code.claude.com/docs/en/checkpointing
- Advanced setup（官方）：https://code.claude.com/docs/en/setup

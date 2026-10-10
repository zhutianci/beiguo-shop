---
title: Claude Code 桌面版使用教程：Code 标签页、并行会话与定时任务
slug: claude-code-desktop
products: [claude]
models: []
accountTier: PLUS
excerpt: 不想用终端？Claude 桌面版的 Code 标签页就是图形界面的 Claude Code。本文讲安装与开始第一个会话、Local / Cloud / SSH / WSL 四种环境、权限模式、diff 审阅、并行会话与 worktree、定时任务，以及和命令行版的区别。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/desktop-quickstart
  - https://code.claude.com/docs/en/desktop
  - https://code.claude.com/docs/en/desktop-scheduled-tasks
  - https://code.claude.com/docs/en/desktop-linux
  - https://code.claude.com/docs/en/desktop-wsl
---

> 本文根据 Claude Code 官方文档《Get started with the desktop app》《Desktop application》《Schedule recurring tasks in Claude Code Desktop》整理，核对日期 2026-10-07。桌面版的 Chat、Cowork 标签页不在本文范围。

## 适用于谁

- 想用 Claude Code、但不习惯命令行的人；
- 想在一个窗口里同时管理多个会话、并排看改动的人；
- 搜「claude code 桌面版」「桌面版使用教程」「claude desktop 和 claude code 的区别」的人。

## 结论先说

1. **Claude 桌面版有三个标签页**：Chat（普通对话，不能访问文件，类似 claude.ai）、Cowork（在后台独立完成任务的智能体）、**Code**（就是 Claude Code，能直接读写你电脑上的项目文件）。
2. **Code 标签页需要 Pro、Max、Team 或 Enterprise 订阅**；桌面版自带 Claude Code，**不用装 Node.js 或命令行版**。
3. 支持 macOS（Intel 和 Apple 芯片通用）、Windows（x64，另有 ARM64 安装包）、Linux（beta，Ubuntu / Debian 用 apt 或 .deb 安装）。
4. 开始会话时可选四种环境：**Local**（本机）、**Cloud**（云端，关掉 App 也继续）、**SSH**（远程机器）、**WSL**（Windows 上的 Linux 子系统）。
5. 桌面版和命令行版**共用同一套配置**（CLAUDE.md、MCP、Hooks、技能、settings.json），可以同时使用，会话还能互相转移。

## 步骤

### 1. 下载安装并登录

- **macOS / Windows**：从官方下载页（claude.com/download）下载安装包并运行；
- **Linux（beta）**：按官方《Claude Desktop on Linux》用 apt 安装。

启动后用你的 Anthropic 账号登录，点顶部中间的 **Code** 标签。如果提示升级，说明当前账号没有付费订阅；如果提示在线登录，登录完重启 App。

还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。桌面版本身的下载与中文设置详见本站《Claude 桌面版下载安装（Windows / Mac）：功能与设置中文界面》。

### 2. 开始第一个会话

1. **选环境和文件夹**：选 **Local**，点 **Select folder** 选你的项目目录。官方建议先用一个你熟悉的小项目试手。
2. **选模型**：发送按钮旁的下拉框，之后随时可以换。
3. **说出任务**，比如：
   - 「找一个 TODO 注释并把它实现掉」
   - 「给 main 函数补测试」
   - 「为这个代码库写一份 CLAUDE.md」
4. **审阅改动**：取决于发送按钮旁显示的权限模式——Auto 或 Accept edits 模式下 Claude 会直接改，并显示 `+12 -1` 这样的统计，点开看 diff；Manual 模式下每处改动都先给你看对比，点 Accept / Reject。

### 3. 四种运行环境

| 环境 | 说明 |
| --- | --- |
| Local | 在你的电脑上运行，直接用本地文件 |
| Cloud | 在云端运行，关掉 App、关机也会继续；可以添加多个仓库；也能在 claude.ai/code 或手机 App 上查看（详见本站《Claude Code 网页版（claude.ai/code）怎么用：在云端跑任务》） |
| SSH | 连接你的服务器、云主机或开发容器，首次连接时自动在远程机器上安装 Claude Code |
| WSL（Windows） | 在 WSL 2 发行版里运行，工具和 git 都在 Linux 侧执行 |

## 常用操作

**随时打断和纠偏**：点停止按钮立即中断；或者直接输入纠正内容按回车，不用等当前动作结束。

**加上下文**：输入 `@文件名` 引用文件（带自动补全）；用附件按钮添加图片和 PDF；或直接把文件拖进输入框。

**权限模式**：发送按钮旁的选择器，可选 Auto、Manual、Accept edits、Plan；Bypass permissions 需要 Pro / Max 用户在「设置 → Claude Code」里打开「Allow bypass permissions mode」（Team / Enterprise 由组织策略控制）。你为某个文件夹选的模式会被记住（Plan 除外）。各模式区别详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。

**审阅改动**：点 `+12 -1` 打开 diff 视图，逐个文件看，可以在具体行上写评论让 Claude 修改；也可以输入 `/code-review` 让 Claude 自己审一遍。

**命令与技能**：输入 `/` 或点 **+ → Slash commands**，浏览内置命令、自定义技能和插件技能。

**插件**：点输入框旁的 **+ → Plugins**，用图形界面浏览和安装插件。

**布局**：聊天、diff、终端、文件、浏览器几个面板可以随意拖动排列；`` Ctrl+` `` 打开终端。

**预览你的应用**：在桌面版里启动开发服务器，应用会在内置的浏览器面板里打开，Claude 能看到运行效果、测接口、读日志并据此修改。

**跟踪 PR**：开了 PR 之后，Claude Code 会监控 CI 结果，可以自动修复失败，或在全部检查通过后合并。

## 并行会话

- 侧边栏点 **+ New session**，或按 `Cmd+N`（Windows `Ctrl+N`）新建会话；`Ctrl+Tab` / `Ctrl+Shift+Tab` 在会话间切换；
- **按住 Cmd / Ctrl 点击**侧边栏里的另一个会话，可以左右分屏同时看两个会话；`Cmd+\`（Windows `Ctrl+\`）关闭当前分屏；
- 在 Git 仓库里，勾选分支名旁的 **worktree** 选项，会话会拿到一份独立的项目副本，几个会话之间的改动在提交前互不影响。worktree 默认放在 `<项目根目录>/.claude/worktrees/`，可以在设置里改位置、加分支前缀；会话的 PR 合并或关闭后可以自动归档；
- `Cmd+;`（Windows `Ctrl+;`）或输入 `/btw` 打开**旁支对话**：能看到主对话的上下文，但不会把内容写回主对话，适合问个小问题。
- 会话完成任务、而你正在看别的会话时，桌面版会发系统通知。

worktree 的原理和 `.worktreeinclude` 用法详见本站《Claude Code worktree 怎么用：多个会话并行开发不打架》。

## 定时任务

在 Code 标签的侧边栏点 **Routines**（或「More」菜单里），**New routine → Local**，填写：

| 字段 | 说明 |
| --- | --- |
| Name | 任务名，会转成小写短横线格式作为磁盘上的文件夹名 |
| Description | 列表里显示的简介 |
| Instructions | 每次运行时让 Claude 做什么，可以选权限模式、模型、工作文件夹、是否用独立 worktree |
| Schedule | Manual（只在点 Run now 时运行）、Hourly、Daily、Weekdays（跳过周末）、Weekly |

也可以在任意会话里直接说：「每天早上 9 点帮我做一次代码审查」会建一个周期任务；「明天下午 3 点提醒我检查部署」会建一个运行一次后自动停用的任务。

三种定时方式的区别（官方对照）：

| | 云端 Routines | 桌面版本地任务 | `/loop` |
| --- | --- | --- | --- |
| 在哪运行 | 云端 | 你的电脑 | 你的电脑 |
| 需要电脑开机 | 否 | 是（且 App 开着） | 是 |
| 需要打开会话 | 否 | 否 | 是 |
| 能访问本地文件 | 否（每次全新克隆） | 是 | 是 |
| 最短间隔 | 1 小时 | 1 分钟 | 1 分钟 |

注意：本地定时任务默认在工作目录的**当前状态**上运行（包括未提交的改动），想隔离就在创建时打开 worktree 开关。

## 和命令行版的区别

**两者可以同时用、甚至在同一个项目上用**，共享 CLAUDE.md、MCP 配置、Hooks、技能和 settings.json。

- 命令行会话转到桌面版：在终端里运行 `/desktop`（macOS 和 x64 Windows、订阅登录可用）；
- 桌面版接着命令行会话：先在终端里关掉那个会话，再在桌面版输入框里输入 `/resume` 选择。

| 功能 | 命令行版 | 桌面版 |
| --- | --- | --- |
| 权限模式 | 全部（含 dontAsk） | Manual、Accept edits、Plan、Auto（Bypass 需开启） |
| 多会话 | 开多个终端 | 侧边栏标签、分屏 |
| 会话隔离 | `--worktree` | 新建会话时勾选 worktree |
| 文件附件 | 不支持 | 图片、PDF |
| 定时任务 | cron、CI | 内置定时任务 |
| 脚本和自动化（`-p`） | 支持 | 不支持，桌面版只能交互使用 |
| Agent Teams | 支持 | 不支持 |

官方的建议：想在一个窗口里管理并行会话、并排看面板、可视化审阅改动，用桌面版；需要脚本、自动化或习惯终端，用命令行版。另外，`/permissions` 这类会在终端里弹出交互面板的命令，在桌面版里不可用，权限规则请直接编辑设置文件。

## 常见问题

**Q：Code 标签里报 403 或认证错误？**
官方排查：在 App 菜单里退出再重新登录（最常见的解决办法）；确认订阅是有效的付费套餐；如果命令行版正常而桌面版不行，**彻底退出** App（不只是关窗口）再打开登录；检查网络和代理设置。

**Q：桌面版要单独装 Claude Code 吗？**
不用，Code 标签自带。但如果你还想在终端里输入 `claude`，需要另外安装命令行版。

**Q：在桌面版 Chat 里配置的 MCP 服务器，Code 标签能用吗？**
能。桌面版会把 `claude_desktop_config.json` 里的 MCP 服务器加载到本地 Code 会话里。但独立的命令行版不读这个文件，需要用 `claude mcp add-from-claude-desktop` 导入（macOS 和 WSL）。

**Q：会话里 Git 报错、并行隔离用不了？**
会话隔离依赖 Git。在终端运行 `git --version` 检查是否已安装。

## 参考资料

- Get started with the desktop app（官方）：https://code.claude.com/docs/en/desktop-quickstart
- Desktop application（官方）：https://code.claude.com/docs/en/desktop
- Schedule recurring tasks in Claude Code Desktop（官方）：https://code.claude.com/docs/en/desktop-scheduled-tasks
- Claude Desktop on Linux (beta)（官方）：https://code.claude.com/docs/en/desktop-linux
- Claude Code Desktop in WSL（官方）：https://code.claude.com/docs/en/desktop-wsl

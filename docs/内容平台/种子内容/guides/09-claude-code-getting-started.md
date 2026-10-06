---
title: Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令
slug: claude-code-getting-started
products: [claude]
models: []
accountTier: PLUS
excerpt: 从零装好 Claude Code：Mac / Linux / Windows 官方安装命令、用 Claude Pro 账号登录、在项目里跑通第一个任务，以及日常最常用的十几个命令。
sources:
  - https://code.claude.com/docs/en/quickstart
  - https://code.claude.com/docs/en/setup
  - https://code.claude.com/docs/en/commands
  - https://code.claude.com/docs/en/memory
  - https://claude.com/pricing
screenshots:
  - Windows PowerShell 里执行安装命令后，`claude --version` 输出版本号的窗口
  - 首次运行 `claude` 时的登录方式选择界面（订阅账号 / Console）
  - 浏览器里授权 Claude Code 的确认页
  - 在一个示例项目里输入「这个项目是做什么的」后的回答
  - Claude Code 改代码前弹出的确认框（Yes / No）
  - 输入 `/` 后弹出的命令菜单
verify:
  - 免费版 claude.ai 账号不能用 Claude Code（setup 页与定价页均如此写，上线前再看一眼定价页）
  - 官方说 v2.1.283 起交互式终端默认是 auto 权限模式（分类器代替人工确认），实测新装版本首次会话是否还会弹确认框
  - Windows 原生安装不装 Git for Windows 时改用 PowerShell 工具执行命令——实测两种情况下的体验差异
  - npm 安装要求 Node.js 22+（官方 setup 页写法），以后可能变化
  - 中国大陆网络下安装脚本与登录是否可用（官方要求在 Anthropic 支持的国家/地区使用），仅记录现象，不写绕过方法
---

## 适用于谁

- 已经开通 **Claude Pro / Max**（或团队版）的用户，想在自己电脑上让 Claude 直接读代码、改代码、跑命令。
- 会打开终端（命令行）但不一定是专业程序员的人：写脚本、整理文件、改个小网站都可以用。
- 不适合：只想网页聊天的用户（直接用 claude.ai 即可）；免费版账号（官方写明免费版不含 Claude Code）。

## 结论先说

1. 官方推荐用「原生安装」：Mac / Linux 一行 `curl`，Windows 在 PowerShell 里一行 `irm`，不需要先装 Node.js。
2. 装好后在项目目录里输入 `claude`，第一次会跳浏览器登录，用 Claude 订阅账号或 Console（API）账号都行。
3. 先让它「读懂项目」，再让它「改一个小地方」，确认它改得对，再逐步放大任务。
4. 记住 6 个命令就够日常用：`/init`、`/clear`、`/compact`、`/model`、`/resume`、`/usage`。

## 步骤

### 第 1 步：确认电脑满足要求

官方要求（2026-10 setup 页）：macOS 13.0+、Windows 10 1809+ / Windows Server 2019+、Ubuntu 20.04+、Debian 10+、Alpine 3.19+；4 GB 以上内存；需要联网。

### 第 2 步：安装

**macOS / Linux / WSL：**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell**（提示符以 `PS C:\` 开头）：

```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD**（提示符没有 `PS`）：

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

也可以用包管理器：Mac 上 `brew install --cask claude-code`，Windows 上 `winget install Anthropic.ClaudeCode`。注意这两种方式**不会自动更新**，要自己定期升级；原生安装会在后台自动更新。

【截图：PowerShell 里执行安装命令并成功的窗口】

装完**新开一个终端窗口**，运行：

```bash
claude --version
```

能打印出版本号（后面带 `(Claude Code)`）就说明装好了。提示找不到 `claude`，通常是安装目录还没加进 PATH，重开终端或按官方「Fix your PATH」处理。

Windows 用户补充：官方建议装 [Git for Windows](https://git-scm.com/downloads/win)，这样 Claude Code 能用 Bash 执行命令；不装也能用，会改用 PowerShell。

### 第 3 步：登录

```bash
cd 你的项目文件夹
claude
```

第一次运行会提示登录，按提示在浏览器里完成授权即可。可用的账号类型：Claude Pro / Max / Team / Enterprise 订阅（官方推荐）、Claude Console（预充值 API 额度），以及企业云平台。之后想换账号，在会话里输入 `/login`。

【截图：登录方式选择界面】【截图：浏览器授权确认页】

还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

### 第 4 步：第一个任务——先读懂，再动手

进入会话后，直接用中文提问：

```text
这个项目是做什么的？主要用了哪些技术？入口文件在哪？
```

Claude 会自己去读需要的文件，不用你手动粘贴代码。【截图：项目介绍的回答】

然后给一个**小而具体**的修改任务，比如：

```text
在 README 里补一段「如何本地运行」的说明，命令从 package.json 里找
```

它会展示要改的内容；如果弹出确认，选 **Yes** 才会写入。【截图：修改确认框】按 `Shift+Tab` 可以切换权限模式（例如每次都问 / 自动执行）。

### 第 5 步：让它记住项目规矩

在项目里运行 `/init`，Claude 会分析代码并生成一份 `CLAUDE.md`，里面写构建命令、测试方法、代码风格。以后每次会话都会自动读取它。只对你自己生效的偏好写在 `~/.claude/CLAUDE.md`。

### 第 6 步：养成三个好习惯

- **说具体**：不要只说「修一下 bug」，而是「登录时输错密码后页面变成空白，帮我找原因并修复」。描述越具体，它找文件越准。
- **大任务拆小步**：先建数据表，再写接口，最后做页面，每一步确认没问题再进行下一步。
- **先探索后动手**：复杂改动前先让它「分析一下数据库结构」「列出会受影响的文件」，看完方案再让它改。

这三条也是官方快速开始页给新手的建议。用 Git 管理项目的话，还可以直接让它「看看我改了哪些文件」「用合适的说明提交这些改动」。

## 常用命令速查

**在终端里（启动前）：**

| 命令 | 作用 |
|---|---|
| `claude` | 开始交互式会话 |
| `claude "任务"` | 带着第一句话开始会话 |
| `claude -p "问题"` | 只问一次，答完就退出（适合脚本） |
| `claude -c` | 继续当前目录最近一次对话 |
| `claude -r` | 从历史里挑一个对话恢复 |
| `claude update` | 立即更新 |
| `claude doctor` | 检查安装和配置问题 |

**在会话里：**

| 命令 | 作用 |
|---|---|
| `/help` | 查看所有命令；直接输入 `/` 也会弹出菜单 |
| `/init` | 生成项目的 `CLAUDE.md` |
| `/clear` | 清空上下文，开新对话 |
| `/compact` | 把之前的对话压缩成摘要，腾出上下文 |
| `/model` | 切换模型 |
| `/resume` | 恢复以前的对话 |
| `/rewind` | 回退对话和代码到之前某一步 |
| `/usage` | 查看本次花费与套餐用量（`/cost` 是别名） |
| `/permissions` | 管理哪些操作允许 / 询问 / 禁止 |
| `/memory` | 编辑 `CLAUDE.md` 与自动记忆 |
| `/exit` | 退出（或连按两次 Ctrl+D） |

## 常见问题

**Q：PowerShell 里报 `The token '&&' is not a valid statement separator`？**
你把 CMD 的命令贴进了 PowerShell。PowerShell 用 `irm ... | iex` 那条。反过来在 CMD 里提示 `'irm' is not recognized`，就换用 CMD 那条。

**Q：必须装 Node.js 吗？**
原生安装不需要。只有用 npm 安装（`npm install -g @anthropic-ai/claude-code`）时才需要 Node.js（官方写 22 及以上），且官方明确不要加 `sudo`。

**Q：免费账号能用吗？**
官方 setup 页写明：免费版 claude.ai 不包含 Claude Code，需要 Pro、Max、Team、Enterprise 或 Console 账号。

**Q：会不会乱改我的文件？**
建议在 Git 仓库里使用，开始前先提交一次；改坏了可以用 `/rewind` 回退，或用 Git 还原。权限模式可以随时用 `Shift+Tab` 或 `/permissions` 调整。

**Q：不想用终端怎么办？**
官方还提供桌面 App、VS Code / JetBrains 插件和网页版（claude.ai/code），登录同一个账号即可（各入口的具体体验（待实测））。

## 参考资料

- Claude Code 快速开始（官方）：https://code.claude.com/docs/en/quickstart
- 安装、系统要求、更新与卸载（官方）：https://code.claude.com/docs/en/setup
- 命令参考（官方）：https://code.claude.com/docs/en/commands
- CLAUDE.md 与记忆（官方）：https://code.claude.com/docs/en/memory
- 套餐对比（官方）：https://claude.com/pricing

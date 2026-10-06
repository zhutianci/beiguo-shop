---
title: Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令
slug: claude-code-getting-started
products: [claude]
models: []
accountTier: PLUS
excerpt: 从零装好 Claude Code：Mac / Linux / Windows 官方安装命令、用 Claude Pro 账号登录、在项目里跑通第一个任务，以及日常最常用的十几个命令。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/quickstart
  - https://code.claude.com/docs/en/setup
  - https://code.claude.com/docs/en/authentication
  - https://code.claude.com/docs/en/permission-modes
  - https://code.claude.com/docs/en/permissions
  - https://code.claude.com/docs/en/commands
  - https://code.claude.com/docs/en/cli-reference
  - https://code.claude.com/docs/en/memory
  - https://claude.com/pricing
  - https://www.anthropic.com/supported-countries
  - https://www.analyticsvidhya.com/blog/2026/08/how-to-install-claude-code/
  - https://realpython.com/how-to-use-claude-code/
---

> 本文根据 Claude Code 官方文档和公开教程整理（核对日期 2026-10-07），文中截图引用自公开发布的教程并注明出处。Claude Code 更新很快，界面与命令以官方文档为准。

## 适用于谁

- 已经开通 **Claude Pro / Max**（或团队版）的用户，想在自己电脑上让 Claude 直接读代码、改代码、跑命令。
- 会打开终端（命令行）但不一定是专业程序员的人：写脚本、整理文件、改个小网站都可以用。
- 不适合：只想网页聊天的用户（直接用 claude.ai 即可）；免费版账号（官方定价页和安装页都写明免费版不含 Claude Code）。

## 结论先说

1. 官方推荐用「原生安装」：Mac / Linux 一行 `curl`，Windows 在 PowerShell 里一行 `irm`，不需要先装 Node.js。
2. 装好后在项目目录里输入 `claude`，第一次会跳浏览器登录，用 Claude 订阅账号或 Console（API）账号都行。
3. 先让它「读懂项目」，再让它「改一个小地方」，确认它改得对，再逐步放大任务。
4. 记住 6 个命令就够日常用：`/init`、`/clear`、`/compact`、`/model`、`/resume`、`/usage`。

## 步骤

### 第 1 步：确认电脑满足要求

官方要求（2026-10 setup 页）：macOS 13.0+、Windows 10 1809+ / Windows Server 2019+、Ubuntu 20.04+、Debian 10+、Alpine 3.19+；4 GB 以上内存，x64 或 ARM64 处理器；需要联网。

另外，官方要求在 [Anthropic 支持的国家和地区](https://www.anthropic.com/supported-countries) 使用，中国大陆目前不在该列表中，请遵守所在地法律和服务条款。

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

Windows 上不需要以管理员身份运行。也可以用包管理器：Mac 上 `brew install --cask claude-code`，Windows 上 `winget install Anthropic.ClaudeCode`，Debian / Fedora / RHEL / Alpine 还可以用 apt、dnf、apk（官方 setup 页有完整步骤）。注意这些包管理器方式**默认不会自动更新**，要自己定期升级；原生安装会在后台自动更新。

安装脚本跑完后会提示安装成功、版本号和安装位置，下面是在 macOS 终端里的输出示例：

![Claude Code 原生安装脚本运行成功后的输出（macOS 终端示例）](seed:g09-install-success.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/08/how-to-install-claude-code/)*

装完**新开一个终端窗口**，运行：

```bash
claude --version
```

能打印出版本号（后面带 `(Claude Code)`）就说明装好了。提示找不到 `claude`，通常是安装目录还没加进 PATH（上图里的「Setup notes」就是在提醒这件事），重开终端或按官方「Fix your PATH」处理。想进一步体检，可以运行 `claude doctor`，它只做只读检查，会列出安装和配置问题及修复建议。

Windows 用户补充：官方建议装 [Git for Windows](https://git-scm.com/downloads/win)，这样 Claude Code 能用 Bash 执行命令；不装也能用，会改用 PowerShell 执行命令。用 WSL 的话不需要 Git for Windows。

### 第 3 步：登录

```bash
cd 你的项目文件夹
claude
```

第一次运行会让你选择登录方式：用 Claude 订阅账号（Pro / Max / Team / Enterprise，官方推荐）、Claude Console 账号（预充值 API 额度），或第三方云平台（Amazon Bedrock 等）。

![首次运行 claude 时的登录方式选择](seed:g09-login-method.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/08/how-to-install-claude-code/)*

选订阅账号后会打开浏览器，确认授权即可回到终端。浏览器没有自动打开时，可以按 `c` 复制登录链接自己粘贴到浏览器；如果浏览器最后显示的是一串登录码，就把它粘贴回终端的 `Paste code here if prompted` 提示处（WSL2、SSH、容器里比较常见）。

![浏览器中授权 Claude Code 连接 Claude 账号的确认页](seed:g09-browser-authorize.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/08/how-to-install-claude-code/)*

登录一次后凭据会保存下来，下次不用再登。之后想换账号，在会话里输入 `/login`；想退出登录用 `/logout`。

还没有订阅的话，可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

### 第 4 步：第一个任务——先读懂，再动手

进入会话后，直接用中文提问：

```text
这个项目是做什么的？主要用了哪些技术？入口文件在哪？
```

Claude 会自己去读需要的文件，不用你手动粘贴代码。

然后给一个**小而具体**的修改任务，比如：

```text
在 README 里补一段「如何本地运行」的说明，命令从 package.json 里找
```

它会找到要改的文件并展示改动。会不会先问你，取决于当前的**权限模式**：

- 官方文档写明，**v2.1.283 及以后**的版本，交互式终端默认进入 **auto 模式**：由一个分类器模型代替你审核操作，大多数改文件、跑命令的动作不再逐个询问。
- 如果你的设置或组织另有规定，或者 auto 模式在当前会话不可用，就会以 **Manual（手动）模式**开始，改文件、跑命令前都会弹出确认，选 **Yes** 才会执行。刚安装后的第一个会话起始模式也可能不同，以输入框下方状态栏显示的模式为准。

![Manual 模式下，Claude Code 新建文件前弹出的确认选项](seed:g09-edit-confirm.png)
*图片来源：[Real Python](https://realpython.com/how-to-use-claude-code/)*

随时按 `Shift+Tab` 可以在 auto、manual、accept edits（自动接受改文件）、plan（只读规划）之间切换。新手想每一步都自己把关，可以切到 manual 模式。

### 第 5 步：让它记住项目规矩

在项目里运行 `/init`，Claude 会分析代码并生成一份 `CLAUDE.md`，里面写构建命令、测试方法、代码风格。以后每次会话都会自动读取它。只对你自己生效的偏好写在 `~/.claude/CLAUDE.md`。

### 第 6 步：养成三个好习惯

- **说具体**：不要只说「修一下 bug」，而是「登录时输错密码后页面变成空白，帮我找原因并修复」。描述越具体，它找文件越准。
- **大任务拆小步**：先建数据表，再写接口，最后做页面，每一步确认没问题再进行下一步。
- **先探索后动手**：复杂改动前先让它「分析一下数据库结构」「列出会受影响的文件」，看完方案再让它改（也可以切到 plan 模式只出方案）。

这三条也是官方快速开始页给新手的建议。用 Git 管理项目的话，还可以直接让它「看看我改了哪些文件」「用合适的说明提交这些改动」。

## 常用命令速查

**在终端里（启动前）：**

| 命令 | 作用 |
|---|---|
| `claude` | 开始交互式会话 |
| `claude "任务"` | 带着第一句话开始会话 |
| `claude -p "问题"` | 只问一次，答完就退出（适合脚本） |
| `claude -c` | 继续当前目录最近一次对话 |
| `claude -r` | 从历史里挑一个对话恢复（也可以跟会话名或 ID） |
| `claude update` | 立即更新 |
| `claude doctor` | 只读检查安装和配置问题 |

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
| `/exit` | 退出（或在 0.8 秒内连按两次 Ctrl+D） |

## 常见问题

**Q：PowerShell 里报 `The token '&&' is not a valid statement separator`？**
你把 CMD 的命令贴进了 PowerShell。PowerShell 用 `irm ... | iex` 那条。反过来在 CMD 里提示 `'irm' is not recognized`，就换用 CMD 那条。

**Q：必须装 Node.js 吗？**
原生安装不需要。只有用 npm 安装（`npm install -g @anthropic-ai/claude-code`）时才需要 Node.js，官方 setup 页写的是 22 及以上；版本偏旧时 npm 只会给出警告，装好的程序本身并不依赖 Node.js 运行。官方明确不要加 `sudo`。

**Q：免费账号能用吗？**
不能。官方 setup 页和定价页都写明：免费版 claude.ai 不包含 Claude Code，需要 Pro、Max、Team、Enterprise 或 Console 账号。

**Q：会不会乱改我的文件？**
建议在 Git 仓库里使用，开始前先提交一次；改坏了可以用 `/rewind` 回退，或用 Git 还原。权限模式可以随时用 `Shift+Tab` 或 `/permissions` 调整；不放心 auto 模式就切到 manual。

**Q：不想用终端怎么办？**
官方还提供桌面 App、VS Code / JetBrains 插件和网页版（claude.ai/code），用同一个账号登录即可；各入口支持的功能略有差异，以官方文档对应页面为准。

## 参考资料

- Claude Code 快速开始（官方）：https://code.claude.com/docs/en/quickstart
- 安装、系统要求、更新与卸载（官方）：https://code.claude.com/docs/en/setup
- 登录与账号类型（官方）：https://code.claude.com/docs/en/authentication
- 权限模式（官方）：https://code.claude.com/docs/en/permission-modes
- 命令参考（官方）：https://code.claude.com/docs/en/commands
- CLI 参考（官方）：https://code.claude.com/docs/en/cli-reference
- CLAUDE.md 与记忆（官方）：https://code.claude.com/docs/en/memory
- 套餐对比（官方）：https://claude.com/pricing
- 支持的国家和地区（官方）：https://www.anthropic.com/supported-countries
- 安装与登录截图：Analytics Vidhya《How to Install Claude Code》、Real Python《How to Use Claude Code》

---
title: Claude Code JetBrains 插件怎么用：IDEA / PyCharm 安装与配置
slug: claude-code-jetbrains
products: [claude]
models: []
accountTier: PLUS
excerpt: 在 IntelliJ IDEA、PyCharm、WebStorm 等 JetBrains IDE 里用 Claude Code：先装命令行版再装插件、/ide 连接、IDE 内看 diff、引用文件快捷键、WSL 和远程开发的配置，以及常见报错。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/jetbrains
  - https://code.claude.com/docs/en/quickstart
  - https://code.claude.com/docs/en/permission-modes
  - https://plugins.jetbrains.com/plugin/27310-claude-code-beta-
verify:
  - 插件在 JetBrains Marketplace 上的名称仍带「Beta」，设置路径为 Settings → Tools → Claude Code [Beta]，以实际界面为准
---

> 本文根据 Claude Code 官方文档《JetBrains IDEs》整理，核对日期 2026-10-07。插件目前在 JetBrains Marketplace 上标注为 Beta，菜单名称以实际界面为准。

## 适用于谁

- 用 IntelliJ IDEA、PyCharm、WebStorm、GoLand、PhpStorm、Android Studio 写代码，想在 IDE 里用 Claude Code 的人；
- 搜「claude code idea 使用教程」「idea 安装」「jetbrains plugin」的人；
- 在 Windows + WSL 环境下遇到「No available IDEs detected」的人。

## 结论先说

1. **JetBrains 插件和 VS Code 扩展不一样**：它不自带 Claude Code，而是在 IDE 的内置终端里运行你本机的 `claude` 命令并与之连接，所以要**先装命令行版，再装插件**。
2. 装好后在 IDE 内置终端里运行 `claude`，集成功能自动生效；在外部终端里运行的话，输入 `/ide` 手动连接。
3. 集成后的好处：改动在 **IDE 自带的 diff 查看器**里显示；当前选中内容和打开的文件会自动发给 Claude；Claude 能读取 IDE 的检查结果（语法错误、lint 警告）。
4. 账号要求和命令行版相同：任一付费订阅（Pro / Max / Team / Enterprise）或 Console 账号，不需要 API Key。
5. 官方安全提醒：在 JetBrains 里用 acceptEdits 或 auto 模式时，Claude 可能改到 IDE 会自动执行的配置文件，建议改文件用 Manual 模式。

## 步骤

### 1. 先装 Claude Code 命令行版

按官方快速开始安装，装好后在终端里确认：

```bash
claude --version
```

安装命令和登录方法详见本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》。如果没装好，插件会弹出「Cannot launch Claude Code」提示。

### 2. 安装 JetBrains 插件

在 IDE 里打开「Settings → Plugins → Marketplace」，搜索「Claude Code」（发布者 Anthropic），安装后**重启 IDE**。也可以从 JetBrains Marketplace 网页安装。

支持的 IDE 包括 IntelliJ IDEA、PyCharm、Android Studio、WebStorm、PhpStorm、GoLand 等大多数 JetBrains 产品。

### 3. 启动并连接

**方式一（推荐）：在 IDE 内置终端运行**

打开 IDE 底部的 Terminal，进入项目根目录运行 `claude`，所有集成功能自动生效。也可以按 `Ctrl+Esc`（Mac 是 `Cmd+Esc`）或点界面上的 Claude Code 按钮快速启动。第一次运行会让你登录。

**方式二：在外部终端运行后连接**

```bash
claude
```

然后在会话里输入：

```text
/ide
```

看到类似 `Connected to IntelliJ IDEA.` 就说明连上了。如果检测到正在运行的 IDE 还没装插件，`/ide` 会替你安装并提示重启 IDE。想让 Claude 看到和 IDE 相同的文件，记得从 IDE 项目的根目录启动 `claude`。

### 4. 日常使用

| 功能 | 怎么用 |
| --- | --- |
| 快速启动 | `Ctrl+Esc`（Mac `Cmd+Esc`），或点 Claude Code 按钮 |
| 在 IDE 里看改动 | 默认用 IDE 的 diff 查看器；想留在终端里看，`/config` 里把 **Diff tool** 改成 `terminal` |
| 共享选区 | 当前选中内容或标签页会自动发给 Claude，对话里会显示 `⧉ Selected N lines from <文件>` |
| 插入文件引用 | `Alt+Ctrl+K`（Mac `Cmd+Option+K`），插入类似 `@src/auth.ts#L1-99` 的引用 |
| 读取 IDE 检查结果 | 让 Claude「看一下这个文件的报错」，它会调用 IDE 的诊断工具读取错误和警告 |
| 切换权限模式 | 和命令行一样按 `Shift+Tab`，或启动时加 `--permission-mode` |

注意：Diff tool 选项只在 Claude Code 已经连上 IDE 时才会出现在 `/config` 里。

### 5. 插件设置

位置：**Settings → Tools → Claude Code [Beta]**。

- **Claude command**：自定义启动命令，比如 `claude`、`/usr/local/bin/claude`。IDE 找不到 `claude` 时在这里填完整路径。
- **WSL 用户**：把 Claude command 设为 `wsl -d Ubuntu -- bash -lic "claude"`（把 Ubuntu 换成你的发行版名称）。
- **Option+Enter 换行**（仅 macOS）：开启后可以用 Option+Enter 在提示词里换行，改完需重启终端。
- **自动更新**：自动检查并安装插件更新，重启后生效。

**ESC 打断不了 Claude？**JetBrains 终端默认把 ESC 用来「把焦点切回编辑器」。到 **Settings → Tools → Terminal**，取消勾选「Move focus to the editor with Escape」，或者在「Configure terminal keybindings」里删掉「Switch focus to Editor」。

## 特殊环境

### 远程开发（JetBrains Remote Development）

官方特别警告：插件要装在**远程主机**上（**Settings → Plugin (Host)**），而不是你本地的客户端机器。

### Windows + WSL2：提示「No available IDEs detected」

原因通常是 WSL2 的 NAT 网络或 Windows 防火墙挡住了 WSL2 和 Windows 上 IDE 之间的连接（WSL1 不受影响）。两种解决办法：

**办法一（官方推荐）：给 WSL2 网段放行防火墙**

1. 在 WSL 里运行 `hostname -I`，取 IP 的前两段加 `.0.0/16`，比如 `172.21.123.45` 对应 `172.21.0.0/16`；
2. 以管理员身份打开 PowerShell，按你的网段运行：

   ```powershell
   New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow -RemoteAddress 172.21.0.0/16 -LocalAddress 172.21.0.0/16
   ```

3. 重启 IDE 和 Claude Code。

**办法二：把 WSL2 改成镜像网络**（需要 Windows 11 22H2 及以上）

在 Windows 用户目录下的 `.wslconfig` 里加入：

```ini
[wsl2]
networkingMode=mirrored
```

然后在 PowerShell 里运行 `wsl --shutdown` 重启 WSL。

插件设置里还有一个「Accept connections from all network interfaces」选项也能解决连接问题，但官方提醒它会让 IDE 的连接端口暴露在局域网、且通信是明文的，只有其他办法都不行时才开；WSL2 优先用镜像网络。

## 安全提醒

插件运行时会在本机起一个名为 `ide` 的内部 MCP 服务器，用来打开 diff、读取选区和诊断信息；暴露给模型的只有一个只读的「读取诊断」工具，不提供代码执行工具。

想让 `.env` 之类的敏感文件即使被选中也不发给 Claude，加一条 Read deny 规则，例如在设置里写 `"deny": ["Read(./.env)"]`。规则写法详见本站《Claude Code 权限模式详解：auto、手动、plan、bypass 与权限规则配置》。

## 常见问题

**Q：装了插件但没有任何集成效果？**
确认从项目根目录启动 Claude Code；在 IDE 设置里检查插件已启用；**彻底重启 IDE**（官方说可能需要重启几次）；远程开发要确认插件装在远程主机上。

**Q：点 Claude 图标提示「command not found」？**
先在终端运行 `claude --version` 确认命令行版已安装；然后在插件设置的 Claude command 里填完整路径；WSL 用户按上面的 WSL 命令格式填写。

**Q：`/ide` 显示「No available IDEs detected」？**
检查插件已安装并启用、完整重启 IDE；如果期望自动连接，确认是在 IDE 内置终端里启动的 `claude`；WSL 用户见上文的防火墙 / 镜像网络设置。

**Q：JetBrains 和 VS Code 的集成有什么区别？**
VS Code 扩展有独立的图形聊天面板并自带内核；JetBrains 插件是「命令行 + IDE 集成」，界面就是终端里的 Claude Code，靠插件把 diff、选区、诊断接进 IDE。VS Code 的用法详见本站《Claude Code VS Code 插件使用教程：安装、登录与常用操作》。

## 参考资料

- JetBrains IDEs（官方）：https://code.claude.com/docs/en/jetbrains
- Quickstart（官方）：https://code.claude.com/docs/en/quickstart
- Choose a permission mode（官方）：https://code.claude.com/docs/en/permission-modes
- Claude Code 插件页（JetBrains Marketplace）：https://plugins.jetbrains.com/plugin/27310-claude-code-beta-

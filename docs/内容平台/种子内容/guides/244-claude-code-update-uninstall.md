---
title: Claude Code 怎么更新和卸载：更新命令、指定版本、更新失败与彻底卸载
slug: claude-code-update-uninstall
products: [claude]
models: []
accountTier: PLUS
excerpt: Claude Code 更新命令是什么、会不会自动更新、怎么装指定版本或切到 stable 通道、npm / Homebrew / WinGet 怎么升级、更新失败怎么办，以及各种安装方式的卸载命令和彻底清理配置。
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/setup
  - https://code.claude.com/docs/en/troubleshoot-install
  - https://code.claude.com/docs/en/settings-reference
  - https://code.claude.com/docs/en/changelog
---

> 本文根据 Claude Code 官方文档《Advanced setup》中的更新与卸载部分和《Troubleshoot installation and login》整理，核对日期 2026-10-07。首次安装方法详见本站《Claude Code 中文入门教程（2026）：安装、登录、第一个任务、常用命令》。

## 适用于谁

- 搜「claude code 更新命令」「更新到指定版本」「更新失败」的人；
- 新模型出来了但 Claude Code 提示「does not support this model」、需要升级的人；
- 想卸载重装、或者彻底删干净 Claude Code 的人。

## 结论先说

1. **原生安装（官方推荐的方式）会在后台自动更新**，启动时和运行中都会检查，下载好后下次启动生效。想立刻更新就运行 `claude update`。
2. **Homebrew、WinGet、apt / dnf / apk 默认不会自动更新**，要用各自的命令手动升级；npm 安装用 `npm install -g @anthropic-ai/claude-code@latest`（不要用 `npm update -g`）。
3. 有两个更新通道：`latest`（默认，第一时间拿到新功能）和 `stable`（一般晚一周左右，跳过有严重问题的版本），在 `/config` 或 `autoUpdatesChannel` 里切换。
4. 想装某个具体版本：安装脚本后面带上版本号，例如 `bash -s 2.1.89`。
5. 卸载要**按安装方式对应删除**；彻底清理还要删 `~/.claude` 和 `~/.claude.json`，但这会删掉所有设置、MCP 配置和会话历史。

## 一、更新

### 查看当前版本

```bash
claude --version
```

`claude doctor` 还会显示最近一次自动更新的结果。会话里也可以用 `/status` 查看版本。

### 立即更新

```bash
claude update
```

更新成功会提示 `Successfully updated from <旧版本> to version <新版本>`；已经是最新则提示 `Claude Code is up to date`。

### 不同安装方式的更新命令

| 安装方式 | 是否自动更新 | 手动更新命令 |
| --- | --- | --- |
| 原生安装（curl / irm 脚本） | 是 | `claude update` |
| Homebrew | 否 | `brew upgrade claude-code`（装的是 latest 版就用 `brew upgrade claude-code@latest`） |
| WinGet | 否 | `winget upgrade Anthropic.ClaudeCode` |
| npm | 视目录权限而定 | `npm install -g @anthropic-ai/claude-code@latest` |
| apt / dnf / apk | 否 | 用各自包管理器的升级命令（需要管理员权限） |

几点补充：

- npm 升级**不要用 `npm update -g`**，它会遵守最初安装时的版本范围，可能升不到最新版；也**不要加 `sudo`**。
- Homebrew 和 WinGet 想让 Claude Code 自己帮你跑升级命令，可以设置环境变量 `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE=1`。WinGet 在 Claude Code 运行时可能因为文件被占用而升级失败，这时会提示你手动运行命令。
- 官方提到一个已知问题：Claude Code 可能比包管理器更早提示有新版本，升级失败的话过一阵再试。
- Homebrew 升级后会保留旧版本，可以定期运行 `brew cleanup` 释放空间。

### 切换更新通道：latest 还是 stable

在会话里运行 `/config`，找到 **Auto-update channel**；或者在 `~/.claude/settings.json` 里写：

```json
{
  "autoUpdatesChannel": "stable"
}
```

- `latest`（默认）：新功能一发布就收到；
- `stable`：通常是一周左右前的版本，会跳过有严重回归问题的版本。

注意：新模型上线时可能需要比 stable 通道更新的版本，想马上用新模型就切回 `latest`。Homebrew 用 cask 名区分通道：`claude-code` 跟 stable，`claude-code@latest` 跟 latest。

从 latest 切到 stable 时，`/config` 会问你是留在当前版本还是允许降级；选择留下会自动设置 `minimumVersion`。也可以手动设一个「最低版本」，防止被降级：

```json
{
  "autoUpdatesChannel": "stable",
  "minimumVersion": "2.1.100"
}
```

### 安装指定版本（回退到旧版）

在原生安装脚本后面加上版本号（或 `stable` / `latest`）：

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash -s 2.1.89
```

```powershell
# Windows PowerShell
& ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 2.1.89
```

```bat
:: Windows CMD
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd 2.1.89 && del install.cmd
```

装好后 `claude --version` 会显示你指定的版本，例如 `2.1.89 (Claude Code)`。安装时选的通道会成为之后自动更新的默认通道。想固定在某个版本不被自动升级，还要关闭自动更新（见下一节）。

### 关闭自动更新

在设置文件的 `env` 里加：

```json
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

用 `claude doctor` 确认 Auto-updates 一行显示为 disabled。`DISABLE_AUTOUPDATER` 只停掉后台检查，`claude update` 仍然可以手动更新；想连手动更新也禁止，用 `DISABLE_UPDATES`。

## 二、更新失败怎么办

**Windows 更新后提示「'claude' is not recognized」**

Windows 上更新时会先把旧的 `claude.exe` 改名备份，再放入新版本；如果中途失败，目录里只剩备份。在 PowerShell 里运行下面这条，把最新的备份改回 `claude.exe`：

```powershell
Get-ChildItem "$env:USERPROFILE\.local\bin\claude.exe.old.*" | Sort-Object Name | Select-Object -Last 1 | Rename-Item -NewName claude.exe
```

再运行 `claude --version` 确认。

**npm 重装 / 升级报 `npm error code ENOTEMPTY`**

删掉报错里 `npm error path` 指向的目录和旁边残留的 `.claude-code-*` 临时目录，再重装：

```bash
rm -rf "$(npm root -g)/@anthropic-ai/claude-code"
rm -rf "$(npm root -g)/@anthropic-ai/.claude-code-"*
npm install -g @anthropic-ai/claude-code
```

**`claude update` 卡在 `Checking for updates`**

官方说明这是 v2.1.214 以前的问题：当 `~/.zshrc`、`~/.bashrc` 等路径恰好是一个目录时会卡住。把那个目录挪走，或者重新运行一遍安装脚本来升级。

**更新后运行的还是旧版本**

很可能装了两份（比如原生安装 + 早年的 npm 安装）。macOS / Linux 用 `which -a claude`，Windows 用 `where.exe claude` 查看所有 `claude` 的位置，删掉不用的那一份。Windows 上旧版 Claude 桌面版还可能注册一个同名的 `Claude.exe` 抢占 PATH，把桌面版升级到最新即可。

**提示「Claude Code does not support this model」**

新模型需要更新的 Claude Code 版本，运行 `claude update`；如果你在 stable 通道，暂时切到 latest。

## 三、卸载

先按你当初的安装方式卸载程序本身：

**原生安装：**

```bash
# macOS / Linux / WSL
rm -f ~/.local/bin/claude
rm -rf ~/.local/share/claude
```

```powershell
# Windows PowerShell
Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force
```

**Homebrew：**`brew uninstall --cask claude-code`（latest 版是 `claude-code@latest`）

**WinGet：**`winget uninstall Anthropic.ClaudeCode`

**npm：**`npm uninstall -g @anthropic-ai/claude-code`

**apt：**

```bash
sudo apt remove claude-code
sudo rm /etc/apt/sources.list.d/claude-code.list /etc/apt/keyrings/claude-code.asc
```

（dnf、apk 的命令见官方 setup 页「Uninstall」一节。）

卸载后如果 `claude` 还能运行，说明还有另一份安装或旧安装程序留下的 shell 别名，用上面的 `which -a claude` / `where.exe claude` 找出来删掉。

### 彻底清理配置（谨慎）

官方警告：**删除配置文件会删掉你所有的设置、已允许的工具、MCP 服务器配置和会话历史。**另外，VS Code 扩展、JetBrains 插件和桌面版也会写 `~/.claude/`，只要它们还装着，下次运行就会重新生成这个目录，所以要彻底删除，先把它们也卸载。

```bash
# macOS / Linux / WSL：用户级设置和状态
rm -rf ~/.claude
rm ~/.claude.json

# 某个项目里的设置（在项目目录下运行）
rm -rf .claude
rm -f .mcp.json
```

```powershell
# Windows PowerShell
Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force
Remove-Item -Path ".claude" -Recurse -Force
Remove-Item -Path ".mcp.json" -Force
```

项目里的 `.claude/`、`.mcp.json` 如果是团队提交到仓库的，删之前想清楚。

## 常见问题

**Q：卸载重装能解决问题吗？**
很多安装问题官方建议先跑 `claude doctor` 看诊断，常见的 PATH、重复安装、设置文件错误都会列出来。真要重装，卸载程序即可，不必删配置；配置文件有问题再考虑清理。

**Q：怎么看每个版本更新了什么？**
会话里运行 `/release-notes` 打开版本选择器，或看官方 changelog 页面。

**Q：公司要求统一版本怎么办？**
管理员可以在托管设置里统一 `autoUpdatesChannel`、`minimumVersion`，或用 `requiredMinimumVersion` / `requiredMaximumVersion` 限定允许启动的版本范围。

## 参考资料

- Advanced setup · Update / Uninstall（官方）：https://code.claude.com/docs/en/setup
- Troubleshoot installation and login（官方）：https://code.claude.com/docs/en/troubleshoot-install
- All settings · autoUpdatesChannel（官方）：https://code.claude.com/docs/en/settings-reference
- Claude Code changelog（官方）：https://code.claude.com/docs/en/changelog

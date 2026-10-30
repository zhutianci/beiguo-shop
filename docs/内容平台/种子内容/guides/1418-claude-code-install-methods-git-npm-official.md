---
title: Claude Code 官网下载在哪、怎么安装：原生安装、npm、Homebrew、WinGet 怎么选，Windows 要不要装 Git
slug: claude-code-install-methods-git-npm-official
products: [claude]
models: []
accountTier: PRO
excerpt: "搜「Claude Code 官网下载」「为什么要装 Git」「为什么不推荐 npm」，官方文档的答案是：安装说明在 code.claude.com，原生安装标为推荐，npm 要 Node.js 22，Windows 的 Git 是可选的。本文按官方文档逐项说明。"
checkedOn: 2026-10-30
sources:
  - https://code.claude.com/docs/en/setup
  - https://code.claude.com/docs/en/troubleshooting
  - https://claude.com/download
verify:
  - 安装命令、系统要求和包管理器写法是 2026-10-30 当天读到的 setup 页，官方随时可能调整，请以官方页面为准
  - 官方没有写「不推荐 npm」，只把原生安装标为 Recommended 并保留 npm 作为高级安装方式；本文据此说明，没有扩大
  - 各安装方式「是否自动更新」按官方说明摘录，npm 能否自动更新取决于全局目录是否可写
---

> 本文根据 Claude Code 官方文档的 Advanced setup 页整理，资料核对于 2026-10-30。官方对「为什么不推荐 npm」没有专门解释，只是把原生安装标成推荐，下面分开写官方说了什么、没说什么。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 搜「claude code 官网下载」「claude code 下载不了」，不知道去哪下载的人；
- 看到 npm、Homebrew、WinGet 好几种装法，不知道选哪个的人；
- Windows 用户，不确定要不要装 Git 的人。

## 结论先说

1. **官方安装说明在 [code.claude.com/docs/en/setup](https://code.claude.com/docs/en/setup)**。Claude Code 是在终端里运行的命令行工具，**没有单独的「安装包下载页」**。如果你想要图形界面，官方提供桌面应用，下载页是 [claude.com/download](https://claude.com/download)。
2. **官方推荐「原生安装」（Native Install）**：macOS、Linux、WSL 用 `curl -fsSL https://claude.ai/install.sh | bash`；Windows PowerShell 用 `irm https://claude.ai/install.ps1 | iex`。原生安装会在后台**自动更新**。
3. **npm 仍然能用**：`npm install -g @anthropic-ai/claude-code`，要求 **Node.js 22 或更高**。官方说明 npm 包装的是**同一个原生程序**，装好后的 `claude` 运行时并不调用 Node。**官方没有说不推荐 npm**，只是把它放在「高级安装」里。
4. **Windows 上 Git 是可选的**：官方在不同位置写的是「recommended」和「optional」。没有 Git for Windows，Claude Code 用 PowerShell 执行命令；装了，就用 Git Bash。用 WSL 不需要。
5. 用 Claude Code 需要 **Pro、Max、Team、Enterprise 或 Console 账号**，官方写明免费版 claude.ai 套餐不包含 Claude Code。

![Claude Code 安装方式对比](seed:g1418-install-methods.png)
*图：本站根据 [Claude Code 官方文档](https://code.claude.com/docs/en/setup) 整理的示意图*

## 一、系统要求

官方列出的要求（2026-10-30）：

- **系统**：macOS 13.0 及以上；Windows 10 1809 及以上，或 Windows Server 2019 及以上；Ubuntu 20.04 及以上；Debian 10 及以上；Alpine Linux 3.19 及以上；
- **硬件**：4 GB 以上内存，x64 或 ARM64 处理器；
- **网络**：需要联网；
- **Shell**：Bash、Zsh、PowerShell 或 CMD；
- **地区**：Anthropic 支持的国家和地区。是否支持你所在的地区，见 [/guides/claude-supported-countries-regions](/guides/claude-supported-countries-regions)。

## 二、原生安装怎么做

1. 打开终端。Windows 上提示符是 `PS C:\` 的是 PowerShell，没有 `PS` 的是 CMD，两种用的命令不一样；
2. 运行上面对应系统的命令。官方说明下载时**没有进度显示**，等它结束即可；
3. **新开一个终端窗口**，运行 `claude --version`，能打印版本号就是装好了；
4. 在项目目录里运行 `claude`，按浏览器里的提示登录。

常见的小坑，官方文档里写明的：

- 在 PowerShell 里运行了 CMD 的命令会提示 `The token '&&' is not a valid statement separator`；反过来在 CMD 里运行 PowerShell 的命令会提示 `'irm' is not recognized`，换对应的命令即可；
- 提示 `claude` 找不到，是安装目录还没在 PATH 里，官方有「Fix your PATH」的说明，也见本站 [/guides/claude-code-common-errors](/guides/claude-code-common-errors)；
- 安装命令报 `syntax error near unexpected token '<'`、`403` 等，官方让你去「Troubleshoot installation」页对照错误；
- 运行 `claude doctor` 可以查看只读的安装和设置诊断。

入门步骤的完整版见 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)。

## 三、Homebrew、WinGet 和 Linux 软件源

官方也提供：

- **Homebrew**：`brew install --cask claude-code`（稳定通道，通常比最新版晚约一周）或 `claude-code@latest`；**不会自动更新**，要手动 `brew upgrade`；
- **WinGet**：`winget install Anthropic.ClaudeCode`；**不会自动更新**，要手动 `winget upgrade Anthropic.ClaudeCode`；
- **apt、dnf、apk**：官方提供签名的软件源，更新走系统自己的升级流程。

这几种方式和原生安装的主要区别就是**更新方式**。想省心就用原生安装；公司统一管理软件、习惯用包管理器的，可以选后者。更新、卸载的完整做法见 [/guides/claude-code-update-uninstall](/guides/claude-code-update-uninstall)。

## 四、npm 安装：官方的说法

官方在「Install with npm」里写了这些：

- 需要 **Node.js 22 或更高**；Node 版本较旧时，npm 只会打印 `EBADENGINE` 警告，安装照样完成、`claude` 也能运行，因为程序下载的是不依赖你 Node 的原生程序；
- **不要用 `sudo npm install -g`**，会引起权限问题和安全风险，遇到权限错误看官方的排查页；
- 升级用 `npm install -g @anthropic-ai/claude-code@latest`，**避免 `npm update -g`**；
- 如果 `npm --version` 显示的版本以 12 开头，官方有专门的修复说明，先看那一节；
- 支持的平台包括 darwin-arm64、darwin-x64、linux-x64、linux-arm64、musl 版的 Linux，以及 win32-x64、win32-arm64；包管理器必须允许可选依赖。

所以「为什么不推荐 npm」在官方文档里的体现，更像是：**原生安装更简单、自动更新更省事，npm 要多一层 Node.js 版本和权限的问题**。官方并没有写得这么直白，这是本站的归纳。

## 五、Windows 要不要装 Git

![Windows 要不要装 Git](seed:g1418-git-decide.png)
*图：本站根据 [Claude Code 官方文档](https://code.claude.com/docs/en/setup) 整理的示意图*

官方原话大意：

- 在 Windows 原生环境下，**推荐**装 Git for Windows，这样 Claude Code 能用 **Bash 工具**；
- 没有装的话，Claude Code 用 **PowerShell 工具**执行 shell 命令；
- 在设置对照表里，Git for Windows 被标为「**可选**」，它提供的 Git Bash 是 Bash 工具和 Monitor 工具需要的；
- 如果装了 Git 却找不到 Git Bash，在 `settings.json` 的 `env` 里设置 `CLAUDE_CODE_GIT_BASH_PATH`，值是 `bash.exe` 的路径，例如 `C:\\Program Files\\Git\\bin\\bash.exe`；
- WSL 里不需要 Git for Windows。

另外，**这和你的项目要不要用 Git 管理是两回事**。Claude Code 最好在 Git 仓库里用，改坏了方便回退，见 [/guides/claude-code-best-practices](/guides/claude-code-best-practices)。

## 常见问题

**Q：有没有图形界面的安装包？**
有桌面应用，见 [claude.com/download](https://claude.com/download) 和 [/guides/claude-code-desktop](/guides/claude-code-desktop)。

**Q：免费账号能用 Claude Code 吗？**
官方 setup 页写明免费版 claude.ai 套餐不包含。套餐和价格见 [/guides/claude-pricing-free-or-paid](/guides/claude-pricing-free-or-paid)，Pro、Max 还是 API 怎么选见 [/guides/claude-code-pro-max-or-api](/guides/claude-code-pro-max-or-api)，开通可看本站 [Claude Pro 充值页](/chongzhi/claude-pro)。

**Q：安装出错了去哪查？**
先看 [/guides/claude-code-common-errors](/guides/claude-code-common-errors)，再看官方的「Troubleshoot installation and login」。官方说明 `claude` 完全启动不了时，在 shell 里运行 `claude doctor`。

## 参考资料

- Claude Code Advanced setup — https://code.claude.com/docs/en/setup
- Claude Code Troubleshooting — https://code.claude.com/docs/en/troubleshooting
- Claude 下载页 — https://claude.com/download

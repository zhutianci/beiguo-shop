---
title: Codex Windows 版怎么下载安装：ChatGPT 桌面 App 官方入口、winget 命令、开发工具与 WSL 设置
slug: codex-windows-app-download-install
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Windows 上的 Codex 现在是 ChatGPT 桌面 App 里的一个入口。官方给了微软商店下载地址和 winget 安装命令，原生用 PowerShell 加 Windows 沙箱，也可切到 WSL2。本文按官方文档讲安装、登录、建议装的开发工具、管理员运行和常见小问题。
checkedOn: 2026-10-27
sources:
  - https://learn.chatgpt.com/docs/windows/windows-app
  - https://learn.chatgpt.com/docs/quickstart
  - https://learn.chatgpt.com/docs/windows/windows-sandbox
  - https://learn.chatgpt.com/docs/enterprise/windows-deployment
verify:
  - 官方文档里 Windows 版 Codex 的入口写作 ChatGPT 桌面 App，没有再单列一个叫 Codex App 的独立安装包，本文按官方现状写
  - winget 的包 ID 9PLM9XGG6VKS 和下载链接来自官方文档当天的写法，之后可能变化，以官方页面为准
  - 官方开发工具示例里的 Python 3.14、.NET SDK 10 是示例版本号，实际可换成你需要的版本
---

> 本文根据 Codex 官方文档《ChatGPT desktop app for Windows》《Quickstart》《Windows sandbox》整理，资料核对于 2026-10-27。官方文档里，Windows 上的 Codex 是 **ChatGPT 桌面 App** 的一部分，不是单独的另一个安装包。配图为本站整理的示意图，不是软件截图。

## 适用于谁

- 想在 Windows 电脑上装 Codex 桌面 App 的人；
- 搜「Codex Windows 下载」，不知道官方入口在哪的人；
- 装好了，不知道还要准备什么工具的人；
- 想知道 Windows 上是原生运行还是要装 WSL 的人。

## 结论先说

1. **官方入口是 ChatGPT 桌面 App。** 官方 Windows 应用文档给了一个微软商店的下载链接，也给了命令行安装方式：`winget install --id 9PLM9XGG6VKS -s msstore`。
2. **装好后用 ChatGPT 账号登录**，在新对话里从 ChatGPT 下拉菜单选 **Codex**（做软件开发），或切到 **Work**（做研究、文档、表格等）。
3. **Windows 上默认原生运行**：代理用 PowerShell 执行命令，并使用 Windows 沙箱；需要 Linux 工具链的话，可以在设置里把代理切换到 WSL2。
4. **建议同时装 Git。** 官方说没有原生 Windows 的 Git，App 的一些功能用不了，审查面板也靠 Git。
5. 要让 Codex 用管理员权限执行命令，需要**把 App 本身以管理员身份启动**。

![Windows 上安装并开始用 Codex](seed:g1166-install-steps.png)
*图：本站根据 [Codex 官方文档：ChatGPT desktop app for Windows](https://learn.chatgpt.com/docs/windows/windows-app) 与 [Quickstart](https://learn.chatgpt.com/docs/quickstart) 整理的示意图*

## 一、下载和安装

官方给了两种方式：

- **下载链接**：Windows 应用文档里的下载入口指向微软商店的安装器（地址形如 `get.microsoft.com/installer/download/9PLM9XGG6VKS`）。点文档里的链接进入，不要从来路不明的网站下载安装包；
- **命令行**：在 PowerShell 里运行官方给的命令：

```powershell
winget install --id 9PLM9XGG6VKS -s msstore
```

企业需要批量部署和更新的，官方另有《Deploy the Windows app and Codex CLI》文档，支持用 Intune、SCCM 等方式，个人用户不用看。

官方的系统环境说明（来自 Windows 沙箱文档）：Windows 11 是推荐的基线；最新且完全更新的 Windows 10 是尽力而为，实际需要 1809 或更新版本；更老的 Windows 10 不推荐。另外 `winget` 需要可用，缺失时更新 Windows 或安装 Windows 程序包管理器。

## 二、第一次打开：登录并发第一条消息

官方 Quickstart 的桌面端步骤：

1. 安装 ChatGPT 桌面 App；
2. 打开 App，用 ChatGPT 账号登录。也可以用 API 密钥使用 Codex，但部分功能可能不可用，具体看官方的功能可用性表；
3. 选择 ChatGPT 工作的位置：开始一个对话、创建项目，或者打开一个文件夹。ChatGPT 可以读取并修改你选的文件夹里的文件；
4. 开始对话：做软件开发、需要代码库上下文和开发者工具的，在 ChatGPT 下拉菜单里选 **Codex**；做研究、分析或文档、演示文稿、表格等成果的，选 **ChatGPT**，再在新对话页顶部切到 **Work**；
5. 发第一条消息，说明目标，补充需要的文件或上下文。

登录遇到问题见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)；Work 和 Codex 有什么区别见 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。想用 Codex 又没有付费套餐的，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，各套餐额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。

## 三、建议准备的开发工具

官方说 Codex 在已装了几种常见开发工具时效果最好：

- **Git**：驱动 App 里的审查面板，让你查看或撤销改动；
- **Node.js**、**Python**：代理做事常用；
- **.NET SDK**：想构建 Windows 原生应用时有用；
- **GitHub CLI**：驱动 App 里与 GitHub 相关的功能。

官方给了一组 winget 命令，可以粘到 App 的集成终端里，也可以让 Codex 自己装：

```powershell
winget install --id Git.Git
winget install --id OpenJS.NodeJS.LTS
winget install --id Python.Python.3.14
winget install --id Microsoft.DotNet.SDK.10
winget install --id GitHub.cli
```

装好 GitHub CLI 后，运行 `gh auth login` 才能启用 App 里的 GitHub 功能。需要别的 Python 或 .NET 版本，把包 ID 换成对应版本即可。

![装好后建议准备的开发工具](seed:g1166-dev-tools-check.png)
*图：本站根据 [Codex 官方文档：ChatGPT desktop app for Windows](https://learn.chatgpt.com/docs/windows/windows-app) 整理的示意图*

## 四、原生运行还是 WSL

官方说明：默认使用 Windows 原生的 Codex 代理，也就是在 PowerShell 里执行命令，并用 [Windows 沙箱](/guides/codex-windows-sandbox-setup-failed)。App 仍然可以通过 `wsl` 命令处理放在 WSL2 里的项目。

- **想添加放在 WSL 里的项目**：点 **Add new project** 或按 `Ctrl+O`，在文件资源管理器里输入 `\\wsl$\`，选发行版和文件夹；
- **继续用原生代理的话**，官方建议把项目放在 Windows 文件系统里，在 WSL 里通过 `/mnt/<盘符>/...` 访问，比直接打开 WSL 文件系统里的项目更可靠；
- **想让代理本身跑在 WSL2 里**：打开 **Settings**，把代理从 Windows native 切换到 WSL，并**重启 App**，重启后才生效，项目会保留；
- 沙箱的实施方式在 Windows 和 WSL 里不同；要应用沙箱保护，在发消息前选择输入框下方的 **Ask for approval**。

集成终端可以单独选择（PowerShell、命令提示符、Git Bash、WSL），只对新终端会话生效，已经打开的终端要重启 App 或新开对话。

## 五、几个官方列的小问题

- **需要管理员权限的命令**：从开始菜单找到 App，选择 **Run as administrator**，Codex 代理会继承这个权限级别；
- **PowerShell 执行策略阻止命令**：你从没在 PowerShell 里用过 Node.js、`npm` 的话，可能遇到类似 `npm.ps1 cannot be loaded because running scripts is disabled on this system.` 的错误。官方说常见做法是 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned`，修改前先看微软的执行策略说明；
- **Git 功能不可用**：没有在 Windows 上原生安装 Git，运行 `winget install Git.Git`；
- **从 `\\wsl$` 打开的项目检测不到 Git**：目前最可靠的办法是把项目放在原生 Windows 盘，再从 WSL 里用 `/mnt/<盘符>/...` 访问；
- **和 WSL 里的 CLI 共享配置和登录**：Windows App 用 `%USERPROFILE%\.codex`，WSL 里的 CLI 默认用 Linux 主目录，不共享。办法是同步两个目录，或在 WSL 里设 `export CODEX_HOME=/mnt/c/Users/<windows-user>/.codex`；
- **沙箱设置失败、错误 1385**：见 [/guides/codex-windows-sandbox-setup-failed](/guides/codex-windows-sandbox-setup-failed)。

## 常见问题

**Q：我只想用命令行，不想装桌面 App？**
Codex CLI 有单独的安装方式，见 [/guides/codex-cli-install-update](/guides/codex-cli-install-update)；入门总览见 [/guides/codex-getting-started](/guides/codex-getting-started)。

**Q：App 打不开或更新失败？**
ChatGPT 桌面 App 的更新问题见 [/guides/chatgpt-desktop-app-wont-open-update](/guides/chatgpt-desktop-app-wont-open-update)。

**Q：必须付费吗？**
官方 Pricing 页写明 ChatGPT Work 和 Codex 包含在 Free、Go、Plus、Pro、Business、Edu 或 Enterprise 套餐里，额度不同，以官方页面为准。

**Q：Windows 版有 Linux 版吗？**
官方文档里另有 Linux 桌面 App 页面，面向 Ubuntu、Debian、Fedora 和 Arch Linux，本文不展开。

## 参考资料

- Codex 官方文档：ChatGPT desktop app for Windows — https://learn.chatgpt.com/docs/windows/windows-app
- Codex 官方文档：Quickstart — https://learn.chatgpt.com/docs/quickstart
- Codex 官方文档：Windows sandbox — https://learn.chatgpt.com/docs/windows/windows-sandbox
- Codex 官方文档：Deploy the Windows app and Codex CLI — https://learn.chatgpt.com/docs/enterprise/windows-deployment

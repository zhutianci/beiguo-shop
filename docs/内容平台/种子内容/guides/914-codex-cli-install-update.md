---
title: Codex CLI 怎么安装、怎么更新：官方 4 种安装命令（脚本、npm、Homebrew）、查看版本和 codex update
slug: codex-cli-install-update
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: Codex CLI 怎么装、怎么更新？官方有 macOS/Linux 与 Windows 的安装脚本、npm、Homebrew 四种方式，更新多是重跑同一条命令。本文原样列出官方命令，讲查版本、codex update 和首次登录。
checkedOn: 2026-10-15
sources:
  - https://learn.chatgpt.com/docs/codex/cli
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/reference/troubleshooting
  - https://github.com/openai/codex
  - https://github.com/openai/codex/blob/main/docs/install.md
verify:
  - 所有命令均原样抄自官方 Codex CLI 页面和 GitHub README（2026-10-15 读取）；官方会随版本调整，复制前请再看一眼官方页面
  - 官方 CLI 页对 npm 的更新命令与安装命令相同（npm install -g @openai/codex）；本文照抄
  - GitHub 的 docs/install.md 在「系统要求」表里写的是 macOS 12+、Ubuntu 20.04+ 或 Debian 10+、Windows 11 通过 WSL2、4GB 内存起步；但官方 CLI 页和 README 同时给出了 Windows 的 PowerShell 安装脚本，两者的关系官方没有说明，本文不替官方下结论
  - 官方说 codex update 仅在「所安装的版本支持自更新」时可用，哪些安装方式支持自更新，官方没有逐一列出
  - 官方 Windows 命令是 PowerShell 命令，需要在新 PowerShell 窗口运行；执行策略相关的参数（-ExecutionPolicy ByPass）是官方命令的一部分，本文不解释其安全含义，请自己判断是否执行
  - 本文不涉及 Codex 的用量、价格、套餐额度，以官方为准
---

> 本文根据 OpenAI 官方文档 learn.chatgpt.com 的《Codex CLI》《CLI 参考（developer-commands）》《Troubleshooting》，以及官方 GitHub 仓库 openai/codex 的 README 和 install.md 整理，资料核对于 2026-10-15。官方文档页面没有适合引用的界面截图，配图为本站整理的示意图。**命令都是官方原样给出的，没有改动**。Codex 的整体入门（网页版、IDE、桌面 App 怎么选）见 [/guides/codex-getting-started](/guides/codex-getting-started)，本文只讲 CLI 的安装与更新。

## 适用于谁

- 想在终端里用 Codex，不知道该用哪条命令安装的人；
- 已经装过，想更新到最新版，不知道用什么命令的人；
- 想确认自己装的是哪个版本，或者 CLI 和桌面 App 为什么功能不一样的人。

## 结论先说

1. **官方给了四种安装方式**：macOS/Linux 的安装脚本、Windows 的 PowerShell 安装脚本、npm、Homebrew。
2. **更新大多是「再运行一遍同一条命令」**：脚本和 npm 的更新命令与安装命令一样；只有 Homebrew 不同，更新用 `brew upgrade --cask codex`。
3. **看版本用 `codex --version`**。
4. **还有 `codex update` 命令**：官方说它会检查并应用 CLI 更新，但**仅在安装的版本支持自更新时可用**；调试构建会提示你改装正式版。
5. **装好后运行 `codex`**：第一次会让你选 **Sign in with ChatGPT**，或其他可用的登录方式；登录问题见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。
6. **CLI 和桌面 App 的版本可能不同**：官方说，两边带的 Codex 版本可能不一样，功能会先到一边。

![Codex CLI 的 4 种安装方式和各自的更新命令：脚本、Windows PowerShell、npm、Homebrew](seed:g914-codex-cli-install-methods.png)
*图：本站根据 [OpenAI 官方文档：Codex CLI](https://learn.chatgpt.com/docs/codex/cli) 整理的示意图*

## 一、四种安装方式（官方原样命令）

### macOS / Linux：安装脚本

官方说，这是用于 macOS 和 Linux 的独立安装程序。

安装：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

更新（官方给的是同一条命令）：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

### Windows：PowerShell 安装脚本

官方说明：**要在新的 PowerShell 窗口里运行**。

安装：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

更新（官方给的是同一条命令）：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

注意：这条命令会下载并执行远程脚本，里面带有 `-ExecutionPolicy ByPass`。这是官方命令的一部分，本站只是原样转述；是否执行，请自己判断，并确认网址是官方的 chatgpt.com。

### npm

官方说，也可以用 npm 安装。

安装：

```bash
npm install -g @openai/codex
```

更新（官方给的是同一条命令）：

```bash
npm install -g @openai/codex
```

npm 对 Node.js 的版本要求，官方 CLI 页没有写；站内 [/guides/codex-getting-started](/guides/codex-getting-started) 里记录过 npm 包信息中声明的要求。

### Homebrew

安装：

```bash
brew install --cask codex
```

更新：

```bash
brew upgrade --cask codex
```

### 怎么选

官方没有给「哪种最好」的说法。本站的建议：**用哪种装，就用哪种更新**，不要混用，免得电脑上装了两份不同版本的 codex。

## 二、装好后：第一次运行

官方 CLI 页给出的三步：

1. **安装 Codex**（上面的命令）；
2. **运行 Codex 并登录**：打开项目目录，运行 `codex`；第一次运行时，选 **Sign in with ChatGPT** 或其他可用的登录方式；
3. **开始第一个任务**：描述你想做的事，例如让它解释项目、做一处聚焦的修改、帮你排查问题。官方的示例提示词是：

```text
Tell me about this project
```

官方还建议：**在任务前后各做一次 Git 检查点**，这样不满意时可以回退修改。

![装好 Codex CLI 之后第一次运行：进入项目目录、登录、描述任务、Git 检查点、查看版本](seed:g914-codex-cli-first-run.png)
*图：本站根据 [OpenAI 官方文档：Codex CLI](https://learn.chatgpt.com/docs/codex/cli) 整理的示意图*

登录相关的命令，官方 CLI 参考里写的是：

- `codex login`：用 ChatGPT 账号、API 密钥或访问令牌登录；不带参数时，会打开浏览器走 ChatGPT 的登录流程；
- `codex login status`：已有凭据时返回 0，适合在脚本里判断；
- `codex logout`：删除已保存的凭据，包括 API 密钥和 ChatGPT 登录。

## 三、怎么看版本、怎么更新

### 看版本

官方排查文档给的命令：

```bash
codex --version
```

如果你用的是 ChatGPT 桌面 App（macOS），官方说它带的 Codex 版本可以这样看（官方给的是保留的兼容路径）：

```bash
/Applications/Codex.app/Contents/Resources/codex --version
```

### 更新

- **脚本、npm**：再运行一遍安装命令；
- **Homebrew**：`brew upgrade --cask codex`；
- **`codex update`**：官方 CLI 参考里写的是「检查并应用 Codex CLI 的更新，仅当安装的版本支持自更新时可用；调试构建会提示你改装正式版」。哪些安装方式支持自更新，官方没有列出，**不确定时用上面的方式更新最稳妥**（这是本站的建议）。

### CLI 有的功能，桌面 App 里没有？

官方说，ChatGPT 桌面 App 和 Codex CLI 可能带着**不同版本**的 Codex，所以某个功能可能先出现在一边。这不是你装错了，更新对应那一边即可。桌面 App 的更新见 [/guides/chatgpt-desktop-app-wont-open-update](/guides/chatgpt-desktop-app-wont-open-update)。

![Codex CLI 版本和更新的常见问题：看版本、不记得怎么装的、codex update、CLI 与桌面 App 版本不同、GitHub 发布页](seed:g914-codex-cli-version-update.png)
*图：本站根据 [OpenAI 官方文档：Codex CLI](https://learn.chatgpt.com/docs/codex/cli)、[Troubleshooting](https://learn.chatgpt.com/docs/reference/troubleshooting) 与 [GitHub 仓库 README](https://github.com/openai/codex) 整理的示意图*

## 四、官方 README 里的其他说明

GitHub 上 openai/codex 仓库的 README 还写了：

- 独立安装脚本默认从 `https://releases.openai.com/codex` 下载，元数据或文件下载失败时，会回退到 GitHub Releases；
- 要强制走 GitHub Releases，把环境变量 `CODEX_INSTALLER_USE_RELEASES_OPENAI_COM` 设为 `false`（也接受 `0` 和 `no`）；
- 也可以到最新的 GitHub Release 页面，手动下载对应平台的文件，README 里列出的文件名有：macOS Apple Silicon 的 `codex-aarch64-apple-darwin.tar.gz`、macOS Intel 的 `codex-x86_64-apple-darwin.tar.gz`、Linux x86_64 的 `codex-x86_64-unknown-linux-musl.tar.gz`、Linux arm64 的 `codex-aarch64-unknown-linux-musl.tar.gz`；每个压缩包里只有一个文件，文件名带着平台信息，README 建议解压后重命名为 `codex`；
- README 也说，想在代码编辑器（VS Code、Cursor、Windsurf）里用，可以装 IDE 插件；想要桌面 App，可以运行 `codex app` 或访问 Codex App 页面；云端的 Codex Web 在 chatgpt.com/codex。

GitHub 的 `docs/install.md` 里还有「系统要求」：macOS 12+、Ubuntu 20.04+ 或 Debian 10+、Windows 11（通过 WSL2）、内存最少 4GB（推荐 8GB）、Git 2.23+ 可选（用于内置的 PR 辅助功能）。Windows 的安装脚本和 WSL2 要求两者的关系，官方没有说明，请以你实际安装时官方给出的提示为准。

## 五、装不上、更新不了，先看这几点

官方没有专门写「安装失败」的排查文档，下面是基于官方命令的通用思路（本站建议）：

1. **确认命令是官方原样复制的**：网址是 chatgpt.com 的 install.sh 或 install.ps1，或 npm 包 `@openai/codex`、Homebrew 的 `codex`。不要用来路不明的「加速版」「国内版」安装包。
2. **Windows 要在新的 PowerShell 窗口运行**，这是官方明确写的。
3. **npm 报权限错误**：全局安装需要写入权限，按你系统的 npm 说明处理；本文不展开。
4. **脚本下载失败**：可以按上面的 README 说明，改走 GitHub Releases。
5. **登录或连接问题**：见 [/guides/codex-cannot-sign-in-send-message-connect](/guides/codex-cannot-sign-in-send-message-connect)。

## 常见问题

**Q：Codex CLI 要付费吗？**
官方推荐用 ChatGPT 账号登录，把 Codex 作为你的 Plus、Pro、Business、Edu 或 Enterprise 套餐的一部分使用，也可以用 API 密钥，但需要额外设置。具体额度见 [/guides/codex-usage-limits](/guides/codex-usage-limits)。要开通 ChatGPT Plus，可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：CLI、IDE 插件、桌面 App、网页版有什么区别？**
见 [/guides/codex-getting-started](/guides/codex-getting-started) 和 [/guides/chatgpt-work-vs-codex](/guides/chatgpt-work-vs-codex)。

**Q：更新后会丢掉我的配置吗？**
官方的更新页没有说明这一点，本文不作判断。配置文件的位置和写法见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。

**Q：怎么控制 Codex 能改什么文件、能不能执行命令？**
见 [/guides/codex-permissions-sandbox](/guides/codex-permissions-sandbox)。

**Q：删除或归档 Codex 的对话怎么做？**
见 [/guides/codex-delete-archive-chats](/guides/codex-delete-archive-chats)。

**Q：我想在 Codex 里用技能（Skills）。**
见 [/guides/codex-skills-how-to-use-install](/guides/codex-skills-how-to-use-install)。

**Q：我装好了，但提示要手机号验证？**
官方说，在 ChatGPT 桌面 App 里使用 Codex 时可能被要求验证手机号；这和 CLI 是否被要求，官方的文章没有逐一说明，见 [/guides/chatgpt-how-to-sign-up-account](/guides/chatgpt-how-to-sign-up-account) 中关于手机验证的一节。

## 参考资料

- OpenAI 官方文档：Codex CLI — https://learn.chatgpt.com/docs/codex/cli
- OpenAI 官方文档：CLI reference（developer-commands） — https://learn.chatgpt.com/docs/developer-commands
- OpenAI 官方文档：Troubleshooting — https://learn.chatgpt.com/docs/reference/troubleshooting
- GitHub：openai/codex README — https://github.com/openai/codex
- GitHub：openai/codex docs/install.md — https://github.com/openai/codex/blob/main/docs/install.md

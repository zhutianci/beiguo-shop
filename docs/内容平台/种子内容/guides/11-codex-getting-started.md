---
title: Codex 入门教程：在 ChatGPT 里用 Codex 写代码（网页版 / CLI / IDE）
slug: codex-getting-started
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: OpenAI Codex 有网页版（云端）、命令行 CLI、IDE 插件和桌面 App 几种用法。本文讲清怎么选、怎么装、怎么用 ChatGPT 账号登录，并跑通第一个任务。
checkedOn: 2026-10-07
sources:
  - https://github.com/openai/codex
  - https://github.com/openai/codex/blob/main/docs/install.md
  - https://learn.chatgpt.com/docs/codex/cli
  - https://learn.chatgpt.com/docs/codex/ide
  - https://learn.chatgpt.com/docs/cloud
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/developer-commands
  - https://learn.chatgpt.com/docs/app
  - https://chatgpt.com/pricing
  - https://marketplace.visualstudio.com/items?itemName=openai.chatgpt
  - https://www.npmjs.com/package/@openai/codex
  - https://openai.com/index/introducing-codex/
  - https://flaviocopes.com/codex-cloud/
  - https://www.analyticsvidhya.com/blog/2026/08/how-to-install-codex-cli/
---

> 本文根据 OpenAI 官方文档（原 developers.openai.com/codex，现已迁到 learn.chatgpt.com/docs）和官方 GitHub 仓库整理，核对日期 2026-10-07；截图引用自官方页面和公开教程并注明出处。Codex 更新很快，入口名称和额度以官方说明为准。

## 适用于谁

- 已有 **ChatGPT 账号**（尤其是 Plus / Pro），想让 AI 直接帮你写代码、修 bug、做代码审查的人。
- 搜「chatgpt 怎么用 codex」「codex 教程」，分不清网页版、CLI、插件有什么区别的新手。
- 会用 Git 最好；不会也能先从 IDE 插件或桌面 App 开始。

## 结论先说

1. **Codex 是 OpenAI 的编程智能体**，用 ChatGPT 账号登录即可使用，不必单独申请 API Key。
2. 怎么选：
   - 代码在 GitHub 上、想让它在云端慢慢干活并提 PR → **网页版（云端，Codex Cloud）**；
   - 习惯终端、想让它在本机读写文件、跑命令 → **CLI**；
   - 主要在 VS Code / Cursor / Windsurf 里写代码 → **IDE 插件**。
3. 套餐差别：官方定价页写 Free 和 Go 也包含 Codex，但只是「有限」使用，主要在 ChatGPT 桌面 App 里（官方注明逐步开放）；网页云端、CLI、IDE 插件这些完整入口从 Plus 起提供。各入口共用同一份套餐额度。
4. 不管哪种方式，**先让它解释项目，再给一个小任务，看完改动再合并**。

## 步骤

### 方式一：网页版（云端运行，Codex Cloud）

按 2026-10 的官方文档，云端任务的入口在 ChatGPT 里：

1. 在网页版或桌面 App 打开 ChatGPT 并登录（官方 GitHub README 里的 chatgpt.com/codex 入口链接仍然保留）。
2. 新建任务时选择 **Work in → Cloud**，打开 **Select environment**。已有环境直接选；没有就点 **Create environment**。
3. 选择要处理的 GitHub 仓库并点 **Get started**，首次会提示**连接 GitHub**。Codex 会自己检查仓库、安装依赖和工具、试跑流程，缺什么信息会在对话里问你。
4. 看一遍它准备好的配置和测试结果，保存后点 **Publish**，等出现「Environment published」。之后每个任务都从这个环境的快照开始，各自有独立的工作区，可以同时开好几个，电脑关机也不影响。
5. 点 **Start a new task**，用中文描述需求，例如「找出登录接口没有做参数校验的地方并补上，附带测试」。
6. 任务完成后查看改动的文件和测试结果，不满意就继续追加要求；满意后提交或**创建 Pull Request**，在 GitHub 上审核合并。

![Codex 网页版 2025 年发布时的官方配图：输入任务、选择仓库和分支，下方是任务列表](seed:g11-codex-web-2025.jpg)
*图片来源：[OpenAI 官方公告《Introducing Codex》](https://openai.com/index/introducing-codex/)。这是早期界面，现在的入口是 ChatGPT 里的 Work in → Cloud，界面以实际为准。*

![官方配图：云端任务完成后的结果页，包含改动摘要、测试结果和改动文件列表](seed:g11-cloud-task-result.jpg)
*图片来源：[OpenAI 官方公告《Introducing Codex》](https://openai.com/index/introducing-codex/)（早期界面）*

> 据第三方教程（[Flavio Copes](https://flaviocopes.com/codex-cloud/)，2026-10）介绍，旧版「手写环境配置脚本」的体验现在叫 Codex Cloud (Legacy)，网上较早的教程如果让你粘贴 setup 脚本，说的就是旧版。云端功能需要 ChatGPT 账号，只用 API Key 登录时没有云端功能（官方定价页）。

### 方式二：Codex CLI（命令行）

**安装**（来自官方 GitHub README 和 CLI 文档）：

Mac / Linux：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Windows（在新开的 PowerShell 窗口里运行）：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

也可以用包管理器：

```bash
npm install -g @openai/codex
# 或（macOS）
brew install --cask codex
```

用安装脚本或 npm 装的，想更新时**再运行一遍同一条安装命令**即可；Homebrew 用 `brew upgrade --cask codex`。npm 包声明的 Node.js 版本要求是 16 及以上（npm 包信息里的 engines 字段），官方 README 没有单独写 Node 要求。

![在 Windows PowerShell 里运行官方安装命令，提示 Codex CLI 安装成功](seed:g11-cli-install-windows.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/08/how-to-install-codex-cli/)*

**登录与第一个任务：**

```bash
cd 你的项目文件夹
codex
```

首次启动会列出几种登录方式：**Sign in with ChatGPT**（浏览器登录，用套餐额度）、**Sign in with Device Code**（在另一台设备上用一次性代码登录）、**Provide your own API key**（按 API 用量计费）。新手选第一项，在浏览器里完成登录即可。

![Codex CLI 首次启动时的登录方式选择](seed:g11-cli-signin.png)
*图片来源：[Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/08/how-to-install-codex-cli/)*

然后直接输入：

```text
介绍一下这个项目的结构和入口文件
```

![官方示意图：在 Codex CLI 里让它解释代码库，它会先列计划再去读文件](seed:g11-cli-first-task.jpg)
*图片来源：[openai/codex 官方 GitHub 仓库](https://github.com/openai/codex)*

官方建议在任务前后各做一次 Git 提交，方便出问题时回退。

**常用命令：**

| 命令 | 作用 |
|---|---|
| `/init` | 生成 `AGENTS.md`，写入给 Codex 的项目说明 |
| `/permissions` | 设置它改文件、跑命令前要不要问你（例如在 Auto 和 Read Only 之间切换） |
| `/model` | 切换模型和推理强度 |
| `/review` | 审查当前改动、找问题 |
| `/status` | 查看当前会话配置和 token 用量 |
| `codex resume` | 回到当前仓库之前的对话 |
| `codex exec "任务"` | 非交互模式，适合脚本和自动化 |

也支持用 API Key 登录，但需要额外配置，而且没有云端相关功能，新手建议直接用 ChatGPT 账号。

### 方式三：IDE 插件（VS Code / Cursor / Windsurf）

1. 在 VS Code 扩展市场搜索 Codex，认准发布者 OpenAI、扩展 ID `openai.chatgpt`；Cursor、Windsurf 用的是同一个扩展。
2. 安装后点侧边栏的 Codex 图标；找不到就打开命令面板运行 **Codex: Open Codex Sidebar**，然后用 ChatGPT 账号登录。
3. 打开文件或选中一段代码后提问，它可以直接引用当前文件和选中内容，改动在编辑器里以 diff 形式审阅，只保留你想要的部分。
4. 大任务可以从插件里交给云端去跑，跑完回到编辑器里看结果。

![官方配图：IDE 里的 Codex 面板（右侧）和它给出的多文件改动 diff（左侧）](seed:g11-ide-panel.jpg)
*图片来源：[OpenAI Codex IDE 扩展官方文档](https://learn.chatgpt.com/docs/codex/ide)*

JetBrains IDE 和 Xcode 有各自的原生集成（JetBrains 在 AI Chat 里选 Codex，Xcode 在编码助手里选 Codex）。另外，现在的「Codex 桌面 App」已经并入 **ChatGPT 桌面 App**（macOS / Windows，Linux 另有安装说明），在 App 里选 Codex 即可；CLI 里运行 `codex app` 会打开已安装的桌面 App，没装则启动安装程序。

### 任务描述怎么写效果更好

- **说清楚范围**：指明文件或模块，例如「只改 `src/auth` 目录，不要动数据库结构」。
- **说清楚验收标准**：例如「改完后运行测试命令，全部通过再交付」。项目的测试命令最好写进 `AGENTS.md`，它就能自己去跑。
- **一次一件事**：一个任务只解决一个问题，结果更容易审核，也更省额度。
- **先审再合并**：不论哪种方式，都要自己看一遍改动；云端任务的 PR 也建议走正常的代码审查流程。

## 常见问题

**Q：免费账号能用 Codex 吗？**
能用一部分。官方定价页把 Free 和 Go 的 Codex 标为「有限」，说明里写的是在桌面 App 里使用（逐步开放）；网页云端、CLI、IDE 插件从 Plus 起提供，CLI 登录界面上也写着「Plus、Pro、Business、Enterprise 套餐包含用量」。想要完整入口和更高额度可以开通 Plus：[/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Windows 上 PowerShell 提示禁止运行脚本？**
官方命令里已经带了 `-ExecutionPolicy ByPass`，请完整复制那一整行，不要只复制引号里的部分。另外，官方仓库的安装说明文档里系统要求一栏仍写着「Windows 11 通过 WSL2」，和 README 提供的 PowerShell 原生安装命令不完全一致；原生安装遇到问题时可以改在 WSL2 里用 Mac / Linux 那条命令，以官方说明为准。

**Q：额度怎么算？**
官方定价页说明：Plus 和 Business 标准版按每 5 小时给出一个用量估算范围，可能另有每周上限；Pro 目前没有 5 小时限制。本地对话和云端任务共用同一份额度，云端任务通常消耗更多。同样的任务消耗也可能不同，模型选择、上下文长度、推理强度、工具调用都会影响用量，具体以 ChatGPT 里的用量面板为准。

**Q：Codex 和 ChatGPT 聊天里直接让它写代码有什么不同？**
聊天只是给你代码片段；Codex 能读整个仓库、直接改文件、运行测试，并以 diff / PR 的形式交付。

**Q：AGENTS.md 有什么用？**
相当于给 Codex 的「项目说明书」：怎么构建、怎么测试、代码规范。写一次，之后每次任务都会参考。

## 参考资料

- Codex 官方仓库（安装命令）：https://github.com/openai/codex
- Codex CLI 文档：https://learn.chatgpt.com/docs/codex/cli
- Codex IDE 插件文档：https://learn.chatgpt.com/docs/codex/ide
- Codex 云端文档：https://learn.chatgpt.com/docs/cloud
- Codex 套餐与额度：https://learn.chatgpt.com/docs/pricing
- 命令参考：https://learn.chatgpt.com/docs/developer-commands
- ChatGPT 桌面 App：https://learn.chatgpt.com/docs/app
- ChatGPT 套餐对比：https://chatgpt.com/pricing
- 截图来源：OpenAI《Introducing Codex》、openai/codex README、Codex IDE 文档、Analytics Vidhya《How to Install Codex CLI》

---
title: Codex 入门教程：在 ChatGPT 里用 Codex 写代码（网页版 / CLI / IDE）
slug: codex-getting-started
products: [codex, chatgpt]
models: []
accountTier: PLUS
excerpt: OpenAI Codex 有网页版（云端）、命令行 CLI、IDE 插件和桌面 App 几种用法。本文讲清怎么选、怎么装、怎么用 ChatGPT 账号登录，并跑通第一个任务。
sources:
  - https://github.com/openai/codex
  - https://developers.openai.com/codex/cli
  - https://developers.openai.com/codex/ide
  - https://developers.openai.com/codex/cloud
  - https://developers.openai.com/codex/pricing
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
  - https://marketplace.visualstudio.com/items?itemName=openai.chatgpt
screenshots:
  - chatgpt.com/codex 首页（或 ChatGPT 里切到云端工作的入口）
  - 连接 GitHub 并创建环境（Create environment）的页面
  - 云端任务完成后的改动对比（diff）与「创建 PR」按钮
  - Windows PowerShell 安装 Codex CLI 并运行 `codex` 的窗口
  - CLI 首次启动的「Sign in with ChatGPT」选项
  - VS Code 扩展市场里的 Codex 扩展页（openai.chatgpt）
  - VS Code 侧边栏里的 Codex 面板
verify:
  - 哪些套餐能用 Codex：官方 pricing 页写 Free、Go、Plus、Pro、Business、Edu、Enterprise 全部包含；GitHub README 只写推荐 Plus / Pro / Business / Edu / Enterprise 登录使用——用免费号实测
  - 网页版入口：GitHub README 仍指向 chatgpt.com/codex，新文档写的是在 ChatGPT 里「Work in > Cloud」选择环境——以当前界面为准
  - Plus 每 5 小时的消息额度随模型不同差异很大，另有每周上限；具体数字不写进正文，需要时以官方 pricing 页为准
  - 官方文档站 developers.openai.com/codex 现已 308 跳转到 learn.chatgpt.com/docs，链接上线前再点一遍
  - 用 npm 安装的 CLI 是否需要特定 Node.js 版本（README 未写）
---

## 适用于谁

- 已有 **ChatGPT 账号**（尤其是 Plus / Pro），想让 AI 直接帮你写代码、修 bug、做代码审查的人。
- 搜「chatgpt 怎么用 codex」「codex 教程」，分不清网页版、CLI、插件有什么区别的新手。
- 会用 Git 最好；不会也能先从网页版或 IDE 插件开始。

## 结论先说

1. **Codex 是 OpenAI 的编程智能体**，用 ChatGPT 账号登录即可使用，不必单独申请 API Key。
2. 怎么选：
   - 代码在 GitHub 上、想让它在云端慢慢干活并提 PR → **网页版（云端）**；
   - 习惯终端、想让它在本机读写文件、跑命令 → **CLI**；
   - 主要在 VS Code / Cursor 里写代码 → **IDE 插件**。
3. 三种入口用的是同一个账号和同一份套餐额度；额度按「每 5 小时」计算，另有每周上限（官方 pricing 页）。
4. 不管哪种方式，**先让它解释项目，再给一个小任务，看完改动再合并**。

## 步骤

### 方式一：网页版（云端运行）

1. 打开 chatgpt.com/codex，用 ChatGPT 账号登录。【截图：Codex 入口】
2. 按提示**连接 GitHub**，选择要让它处理的仓库，创建一个环境（Environment）。环境里会配置仓库、依赖和环境变量，之后每个任务都在独立的云端工作区里跑，可以同时开好几个。【截图：连接 GitHub / Create environment】
3. 新建任务，用中文描述需求，例如「找出登录接口没有做参数校验的地方并补上，附带测试」。
4. 任务完成后查看改动的文件和测试结果，不满意就继续追加要求；满意后提交或**创建 Pull Request**，在 GitHub 上审核合并。【截图：diff 与创建 PR】

> 新版文档写的入口是在 ChatGPT 里选择「Work in → Cloud」再选环境，界面以实际为准（待实测）。

### 方式二：Codex CLI（命令行）

**安装**（来自官方 GitHub README）：

Mac / Linux：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Windows（PowerShell）：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

也可以用包管理器：

```bash
npm install -g @openai/codex
# 或（macOS）
brew install --cask codex
```

用安装脚本装的，想更新时**再运行一遍同一条安装命令**即可。

**登录与第一个任务：**

```bash
cd 你的项目文件夹
codex
```

首次启动选择 **Sign in with ChatGPT**，在浏览器里完成登录。【截图：登录选项】然后直接输入：

```text
介绍一下这个项目的结构和入口文件
```

官方建议在任务前后各做一次 Git 提交，方便出问题时回退。

**常用命令：**

| 命令 | 作用 |
|---|---|
| `/init` | 生成 `AGENTS.md`，写入给 Codex 的项目说明 |
| `/permissions` | 设置它改文件、跑命令前要不要问你 |
| `/model` | 切换模型和推理强度 |
| `/review` | 审查当前改动、找问题 |
| `/status` | 查看当前会话配置 |
| `codex resume` | 回到当前仓库之前的对话 |
| `codex exec "任务"` | 非交互模式，适合脚本和自动化 |

也支持用 API Key 登录，但需要额外配置，新手建议直接用 ChatGPT 账号。

### 方式三：IDE 插件（VS Code / Cursor / Windsurf）

1. 在 VS Code 扩展市场搜索 Codex，认准发布者 OpenAI、扩展 ID `openai.chatgpt`。【截图：扩展页】
2. 安装后在侧边栏打开 Codex 面板，用 ChatGPT 账号登录。【截图：侧边栏面板】
3. 选中一段代码或打开文件后提问，它可以直接引用当前文件和选中内容，改动在编辑器里以 diff 形式审阅。
4. 大任务可以从插件里交给云端（网页版）去跑，跑完回到编辑器里看结果。

官方文档还提到 JetBrains 和 Xcode 有原生集成，以及桌面 App（README 写可运行 `codex app` 打开）（待实测）。

### 任务描述怎么写效果更好

- **说清楚范围**：指明文件或模块，例如「只改 `src/auth` 目录，不要动数据库结构」。
- **说清楚验收标准**：例如「改完后运行测试命令，全部通过再交付」。项目的测试命令最好写进 `AGENTS.md`，它就能自己去跑。
- **一次一件事**：一个任务只解决一个问题，结果更容易审核，也更省额度。
- **先审再合并**：不论哪种方式，都要自己看一遍改动；云端任务的 PR 也建议走正常的代码审查流程。

## 常见问题

**Q：免费账号能用 Codex 吗？**
官方 pricing 页写所有 ChatGPT 套餐都包含 Codex，但额度不同；免费账号的实际可用程度（待实测）。想要更高额度可以开通 Plus：[/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Windows 上 PowerShell 提示禁止运行脚本？**
官方命令里已经带了 `-ExecutionPolicy ByPass`，请完整复制那一整行，不要只复制引号里的部分。

**Q：额度怎么算？**
按每 5 小时滚动计算，部分套餐还有每周上限。官方说明同样的任务消耗也可能不同，模型选择、上下文长度、推理强度、工具调用都会影响用量。

**Q：Codex 和 ChatGPT 聊天里直接让它写代码有什么不同？**
聊天只是给你代码片段；Codex 能读整个仓库、直接改文件、运行测试，并以 diff / PR 的形式交付。

**Q：AGENTS.md 有什么用？**
相当于给 Codex 的「项目说明书」：怎么构建、怎么测试、代码规范。写一次，之后每次任务都会参考。

## 参考资料

- Codex 官方仓库（安装命令）：https://github.com/openai/codex
- Codex CLI 文档：https://developers.openai.com/codex/cli
- Codex IDE 插件文档：https://developers.openai.com/codex/ide
- Codex 云端文档：https://developers.openai.com/codex/cloud
- Codex 套餐与额度：https://developers.openai.com/codex/pricing
- Using Codex with your ChatGPT plan（帮助中心）：https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

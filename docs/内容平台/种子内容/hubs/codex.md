---
slug: codex
name: Codex
kind: PRODUCT
updated: 2026-10-06
sources:
  - https://learn.chatgpt.com/docs
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/quickstart
  - https://learn.chatgpt.com/docs/cli
  - https://learn.chatgpt.com/docs/agent-configuration/agents-md
  - https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
  - https://releases.sh/release/rel_GKfuaFZioeFajr6Ui2nnb-chatgpt-desktop-app-unifies-chat-work-and-codex
verify:
  - Free / Go 的 Codex 说明里有「subject to rollout（逐步开放）」字样，免费账号是否人人可用需实测
  - Codex Cloud 的开放范围（帮助中心写「符合条件的 Plus 及以上」），以账号实际界面为准
  - Windows 上 CLI 的安装方式：官方文档主推的安装脚本面向 macOS / Linux，Windows 另有安装方式，写教程前实测
  - 官方文档已从 developers.openai.com/codex 迁到 learn.chatgpt.com，旧链接会跳转，引用时用新地址
---
## Codex 是什么

Codex 是 OpenAI 的编程 agent：你给它一个目标，比如「加一个导出功能」「查一下这个测试为什么失败」，它会读代码、改文件、运行命令，最后把改动交给你审核。2026 年 7 月起，Codex 和 ChatGPT 合进了同一个桌面 App，App 里的 Codex 模式就是它。

## 能做什么

- 读懂陌生代码库，解释结构和逻辑
- 写新功能、做小工具、修 bug、补测试
- 审查代码改动、Review PR，提出修改建议
- 在云端环境里并行跑较长的任务，做完再来看结果
- 通过项目根目录的 `AGENTS.md` 记住项目约定（构建命令、代码风格、注意事项）

## 怎么用

| 入口 | 适合 |
|---|---|
| ChatGPT 桌面 App（Codex 模式） | 图形界面，能直观地看改动，适合长任务 |
| Codex CLI | 习惯在终端里工作的人 |
| IDE 扩展 | 在 VS Code 及其衍生编辑器里直接用 |
| Codex Cloud（网页 / 手机） | 不在电脑旁时发起任务，在云端环境里运行 |

这些入口都可以直接用 ChatGPT 账号登录，额度算在 ChatGPT 方案里。

## 免费与付费的区别

按官方文档，Codex 包含在 ChatGPT 的 Free、Go、Plus、Pro、Business、Edu、Enterprise 各个方案里，区别在于额度和功能：Free 和 Go 主要是在桌面 App 里做快速的编程任务，**不包括** GitHub 代码审查、Slack 集成这类云端功能，这些从 Plus 起才有；Pro 的额度更高，适合整天用。想用云端任务和更多额度，可以在本站 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 了解 Plus。

## 本页收录的教程怎么用

教程从安装、登录讲起，再到 `AGENTS.md` 怎么写、怎么让它跑测试、怎么审查它的改动。建议先在一个不重要的项目里试，确认它会改哪些文件，再用到正式项目上。

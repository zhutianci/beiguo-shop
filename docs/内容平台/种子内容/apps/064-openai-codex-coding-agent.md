---
title: "OpenAI Codex 官网与下载：CLI、IDE 插件、云端和桌面 App 怎么选"
slug: openai-codex-coding-agent
name: OpenAI Codex
url: https://openai.com/codex/
pricing: 免费+付费（含在 ChatGPT 各档，或按 API 计费）
platforms: 命令行 / VS Code 插件 / JetBrains / Xcode / Windows / macOS / Linux / 网页 / iOS / API
trialNote: ChatGPT Free 和 Go 用户可在桌面 App 中使用 GPT-6 Luna 版 Codex（官方注明逐步开放）
products: [codex]
models: [gpt]
topics: [coding, ai-agent]
excerpt: "Codex 是 OpenAI 的编程智能体，用 ChatGPT 账号登录即可在终端（开源 CLI）、VS Code 等 IDE、云端和 ChatGPT 桌面 App 里读代码、改代码、跑测试、开 PR，用量与 ChatGPT Work 共享。"
checkedOn: 2026-10-07
sources:
  - https://learn.chatgpt.com/docs/pricing
  - https://learn.chatgpt.com/docs/codex/cli
  - https://learn.chatgpt.com/docs/ide
  - https://learn.chatgpt.com/docs/cloud
  - https://help.openai.com/en/articles/20001276-moving-to-the-new-chatgpt-desktop-app
  - https://github.com/openai/codex
---

> 本文根据 OpenAI 官方 ChatGPT / Codex 文档、定价页、帮助中心和 openai/codex 官方 GitHub 仓库整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Codex 是 OpenAI 的编程智能体，能在你的代码库里阅读代码、修改文件、运行命令和测试，并在完成后提交或开 Pull Request。它不是单一软件，而是同一个智能体的多种入口：

- **Codex CLI**：终端里的命令行客户端，在 GitHub 上以 Apache-2.0 协议开源（openai/codex）；
- **IDE 扩展**：VS Code 及兼容编辑器（Cursor、Windsurf 等）装 Codex 扩展，Xcode 和 JetBrains 有各自的集成；
- **Codex Cloud**：在云端环境里跑任务，电脑关机也能继续，可在网页、手机和桌面 App 中查看结果；
- **ChatGPT 桌面 App**：2026 年 7 月 9 日起，原来的 Codex App 并入新的 ChatGPT 桌面 App，打开后可在 ChatGPT 与 Codex 之间切换。

目前文档中的主力模型是 GPT-6 系列（如 GPT-6.1 Sol、GPT-6 Luna、GPT-6 Astra）。官方提示 GPT-5.5 将于 2026 年 10 月 14 日从 ChatGPT、ChatGPT Work 和 Codex 中退役（API 不受影响）。

**和同类的区别**：Codex 和 ChatGPT 订阅深度绑定，用 ChatGPT 账号登录即可，用量与 ChatGPT Work 共享；Claude Code 是 Anthropic 体系的对应产品，Cursor、Copilot 则可以在多家模型之间切换。

## 能做什么

- **在终端里完成编码循环**：在仓库里探索陌生代码、规划改动、编辑文件、运行本地工具，过程中可随时插话纠偏。
- **在编辑器旁边协作**：把打开的文件、选中的代码直接作为上下文，在原处查看 diff 并只保留想要的改动。
- **把长任务交给云端**：为仓库建好云端环境后，Codex 会自己装依赖、跑测试，完成后可开 PR。
- **自动化与 CI**：用 `codex exec` 在脚本和流水线里无人值守运行，用 Codex SDK 编程控制。
- **自动代码审查与 Slack 集成**：Plus 及以上档位可用云端代码审查和 Slack 集成。
- **项目定制**：用 AGENTS.md 写项目规范，配合技能（Skills）、插件、MCP 和子智能体扩展能力。

![Codex CLI 在终端中解释代码库，并列出分步执行计划](seed:a064-codex-cli.jpg)
*图片来源：[OpenAI 官方 GitHub 仓库 openai/codex 的 README 截图](https://github.com/openai/codex)*

## 怎么上手

1. 准备一个 ChatGPT 账号（Plus 及以上可用全部入口），或 OpenAI API Key。
2. 按习惯选入口：
   - 终端：macOS / Linux 运行 `curl -fsSL https://chatgpt.com/codex/install.sh | sh`；Windows 在 PowerShell 中运行官方 install.ps1 安装脚本；也可以 `npm install -g @openai/codex` 或 `brew install --cask codex`；
   - 编辑器：在 VS Code 扩展市场搜索安装 Codex（发布者 OpenAI）；
   - 桌面：从 chatgpt.com/download 下载 ChatGPT 桌面 App（macOS / Windows，Linux 有单独安装指南），打开后选择 Codex。
3. 在项目目录运行 `codex`，选择 “Sign in with ChatGPT” 登录。
4. 先发一句 “Tell me about this project”，让它介绍项目，再交给它具体任务。
5. 官方建议每次任务前后做 Git 检查点，方便回退。

可以这样开始：

```text
用中文介绍这个项目的结构和启动方式，然后找出 README 里过时的安装步骤并修正，最后告诉我你改了什么。
```

## 免费与付费

Codex 包含在 ChatGPT 各档订阅中，用量与 ChatGPT Work 共享。官网定价页（2026-10 查询）：

| 档位 | 价格 | Codex 相关 |
| --- | --- | --- |
| Free | 0 | 桌面 App 中可用 GPT-6 Luna（逐步开放） |
| Go | 8 美元/月 | 同上，适合轻量任务 |
| Plus | 20 美元/月 | 网页、CLI、IDE 扩展、iOS 全部可用，含云端代码审查和 Slack 集成，可买额外额度 |
| Pro | 100 / 200 / 500 美元/月三档 | 用量更高，目前没有 5 小时限制 |

Business 按年 20 美元/人/月（至少 2 人，按月付 25 美元），Enterprise / Edu 联系销售。也可以用 API Key 在 CLI、SDK、IDE 扩展中按 API 价付费，但没有云端功能。用量按模型、任务复杂度和本地/云端而不同，没有固定条数。在本站开通 ChatGPT Plus 可前往 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 适合谁 / 不适合谁

**适合：**
- 已有 ChatGPT 订阅、想顺带用上编程智能体的开发者；
- 需要终端、编辑器、云端、手机多端接力处理任务的人；
- 想在 CI 或脚本里批量自动化代码任务的团队（API Key 模式）。

**不适合：**
- 想在一个工具里自由切换 Claude、Gemini 等其他厂商模型的人；
- 只需要轻量补全、不想让 AI 执行命令的人；
- 免费档用户若需要云端任务、代码审查等功能——这些需 Plus 及以上。

## 注意事项

- **地区可用性**：OpenAI 官方支持的国家和地区列表不包括中国大陆。
- **数据**：官方定价页注明 Business 档默认不使用企业数据训练；个人账号可在 ChatGPT 的数据控制设置中管理是否用于改进模型。
- **安全与审查**：Codex 默认在沙箱中运行并按审批规则请求执行权限，放宽权限前请确认风险；生成的代码务必审查、测试后再合并。
- **模型退役**：如果你在配置里固定了 GPT-5.5，请在 10 月 14 日前换到新模型。

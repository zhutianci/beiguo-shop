---
title: "Claude Code 是什么、怎么安装：Anthropic 编程智能体概览"
slug: claude-code-agentic-coding-tool
name: Claude Code
url: https://code.claude.com/
pricing: 付费（含在 Claude Pro / Max / Team / Enterprise，或按 API 计费）
platforms: 命令行 / VS Code 插件 / JetBrains 插件 / Windows / macOS / Linux / 网页 / iOS / 安卓
trialNote: Claude 免费版不含 Claude Code；可用 Anthropic Console 账号按 API 用量付费使用
products: [claude]
models: [claude-llm]
topics: [coding, ai-agent]
excerpt: "Claude Code 是 Anthropic 推出的编程智能体，能读懂整个代码库、改文件、跑命令、提交 Git。可在终端、VS Code / JetBrains、Claude 桌面 App 和网页里使用，需 Claude 付费订阅或 API 账号。"
checkedOn: 2026-10-07
sources:
  - https://code.claude.com/docs/en/overview
  - https://claude.com/pricing
  - https://code.claude.com/docs/en/data-usage
  - https://www.anthropic.com/supported-countries
  - https://github.com/anthropics/claude-code
---

> 本文根据 Claude Code 官方文档、Claude 定价页和 Anthropic 官方 GitHub 仓库整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Claude Code 是 Anthropic 推出的“智能体式”编程工具：它会阅读你的代码库、编辑文件、运行命令，并接入你现有的开发工具，由 Anthropic 自家的 Claude 模型驱动。它最早是终端里的命令行工具，现在官方文档列出的使用方式包括终端 CLI、VS Code 扩展（也可装进 Cursor）、JetBrains 插件、Claude 桌面 App 的 Code 标签页，以及浏览器里的 claude.ai/code（Claude 手机 App 也能发起和查看任务）。各端共用同一套引擎，项目里的 CLAUDE.md、设置和 MCP 服务器在各处都生效。

**和同类的区别**：Claude Code 是“终端优先”的智能体，强调可组合——能用管道把日志喂给它、在 CI 里无人值守运行、用 Agent SDK 搭自己的智能体；它只用 Claude 模型。Cursor、Copilot 更像“带 AI 的编辑器/插件”，Codex 则是 OpenAI 体系下对应的产品。

## 能做什么

- **写功能、修 Bug**：用自然语言描述需求或贴上报错，它会规划方案、跨多个文件修改并自行验证。
- **处理琐碎活**：补测试、修 lint、解决合并冲突、升级依赖、写发布说明。
- **直接操作 Git**：暂存改动、写提交信息、建分支、开 Pull Request；也能接入 GitHub Actions / GitLab CI 自动审查 PR。
- **用 MCP 连接外部工具**：读取 Google Drive 里的设计文档、更新 Jira 工单、读取 Slack 消息等。
- **定制与扩展**：用 CLAUDE.md 写项目规范，用 Skills 打包可复用流程，用 Hooks 在每次改动前后自动格式化或跑检查。
- **并行与定时**：派出多个子智能体分工，或用 Routines 在云端定时运行（如每天早上审查 PR）。

![Claude Code 在终端中读取项目文件、搜索测试文件并规划测试覆盖率任务](seed:a063-claude-code-terminal.jpg)
*图片来源：[Anthropic 官方 GitHub 仓库 anthropics/claude-code 的 README 演示动图](https://github.com/anthropics/claude-code)*

## 怎么上手

1. 准备账号：Claude Pro / Max / Team / Enterprise 订阅，或 Anthropic Console（API）账号。
2. 安装：macOS / Linux / WSL 在终端运行官方安装脚本 `curl -fsSL https://claude.ai/install.sh | bash`；Windows 在 PowerShell 运行 `irm https://claude.ai/install.ps1 | iex`。也可用 Homebrew、WinGet 安装（这两种不会自动更新）。Windows 原生环境官方建议先装 Git for Windows。
3. 进入项目目录，输入 `claude` 启动，首次使用按提示登录。
4. 不习惯终端的话，可以安装 VS Code 扩展，或下载 Claude 桌面 App 后点 Code 标签页；也可以直接打开 claude.ai/code 在浏览器里用（无需本地安装）。
5. 先让它熟悉项目，再交给它一个可验证的小任务。

可以这样开始：

```text
给 auth 模块写测试，运行它们，并修复所有失败的用例。完成后总结你改了哪些文件。
```

## 免费与付费

Claude 免费版不包含 Claude Code。官网定价页（2026-10 查询）列出的包含 Claude Code 的个人档位：

| 档位 | 价格 | 说明 |
| --- | --- | --- |
| Pro | 20 美元/月；按年付相当于 17 美元/月（一次付 200 美元） | 包含 Claude Code |
| Max | 每月 100 美元起，分 5x、20x 两档 | 用量分别为 Pro 的 5 倍、20 倍 |

团队版 Team 标准席位按年 20 美元/人/月（按月 25 美元），高级席位按年 100 美元/人/月（按月 125 美元）；Enterprise 另议。也可以不订阅，用 Anthropic Console 账号按 API 标准价按量付费。所有订阅都有用量上限。在本站开通 Claude Pro 可前往 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 适合谁 / 不适合谁

**适合：**
- 习惯终端、希望 AI 直接动手改代码和跑命令的开发者；
- 想把 AI 嵌进脚本、CI 流水线、定时任务里的工程团队；
- 已经订阅 Claude、希望一份订阅同时覆盖聊天和编程的人。

**不适合：**
- 只想要编辑器里的自动补全、不需要智能体的人（Copilot 免费档更合适）；
- 需要在同一工具里切换 GPT、Gemini 等多家模型的人（它只用 Claude 模型）；
- 没有付费意愿的用户——免费版用不了。

## 注意事项

- **地区可用性**：Anthropic 官方支持的国家和地区列表不包括中国大陆和中国香港。
- **数据训练**：官方文档说明，Free / Pro / Max 等个人账号可以选择是否允许数据用于改进模型（设置开启时，用 Claude Code 产生的数据也会用于训练），可随时在 claude.ai 的隐私设置中修改；Team、Enterprise、API 等商业条款下，Anthropic 默认不会用 Claude Code 的代码和提示训练生成式模型。
- **权限与审查**：Claude Code 能执行命令、修改文件，建议在 Git 仓库里使用，谨慎授予自动执行权限，提交前人工检查改动。
- **本地记录**：客户端默认会在本机保存约 30 天的会话记录，用于恢复会话，敏感项目注意清理。

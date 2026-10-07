---
title: "GitHub Copilot 怎么用：订阅档位、学生认证与上手指南"
slug: github-copilot-ai-coding-assistant
name: GitHub Copilot
url: https://github.com/features/copilot
pricing: 免费+付费（学生可免费）
platforms: VS Code 插件 / JetBrains / Visual Studio / Xcode / 命令行 / Windows / macOS / Linux / 网页 / iOS / 安卓
trialNote: Copilot Free 免费可用代码补全、有限的对话和 Agent 模式，并可用 Copilot CLI
products: [github-copilot]
models: []
topics: [coding, ai-agent]
excerpt: "GitHub Copilot 是 GitHub（微软旗下）的 AI 编程助手，以插件形式进入 VS Code、JetBrains、Xcode 等常用 IDE，也有命令行、桌面 App 和云端智能体，可直接在 GitHub 上接 Issue 提 PR。"
checkedOn: 2026-10-07
sources:
  - https://github.com/features/copilot/plans
  - https://docs.github.com/en/copilot/get-started/plans
  - https://github.blog/changelog/2026-06-17-github-copilot-app-generally-available/
  - https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/
  - https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/
---

> 本文根据 GitHub Copilot 官网、定价页、GitHub Docs 和 GitHub 官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

GitHub Copilot 是 GitHub（微软旗下）推出的 AI 编程助手，最早以“结对编程”式的代码补全出名，如今已经扩展成一整套“AI 编程智能体”：IDE 里的补全和 Agent 模式、终端里的 Copilot CLI、2026 年 6 月 17 日正式发布的桌面端 GitHub Copilot App（macOS / Windows / Linux），以及在 GitHub 网站上直接接任务、开 PR 的云端智能体（cloud agent）。

Copilot 本身不绑定单一模型，定价页列出的可选模型来自 Anthropic（Claude）、OpenAI（GPT）、Google（Gemini）、xAI（Grok）、微软等多家，不同功能可选的模型可能不同。

**和同类的区别**：Copilot 最大的特点是“不用换工具”——它以插件形式进入你现有的 VS Code、Visual Studio、JetBrains、Xcode、Eclipse，并且和 GitHub 的 Issue、PR、代码审查深度打通。Cursor、Devin Desktop 则要求换一个独立编辑器。

## 能做什么

- **代码补全与下一步编辑建议**：写代码时实时给出整行或整段建议；补全和“下一处编辑建议”不消耗 AI 额度。
- **Copilot Chat 与 Agent 模式**：在 IDE 里提问、解释代码，或让 Agent 跨文件修改、运行命令，支持接入 MCP 服务器和自定义指令。
- **把 Issue 交给 Copilot**：在 GitHub 上把任务分配给 Copilot，它在云端研究、写代码并创建 PR（Pro 及以上）。
- **PR 代码审查**：让 Copilot 审查 Pull Request 或编辑器里的文件差异（Pro 及以上）。
- **Copilot CLI 与桌面 App**：在终端或独立桌面应用里管理多个智能体任务；2026 年 10 月起两者的“computer use”进入公开预览，可以操作 macOS / Windows 上的桌面程序。
- **委派第三方智能体**：Pro+ 和 Max 可以把任务委派给 Anthropic Claude、OpenAI Codex 等第三方编程智能体（预览）。

## 怎么上手

1. 注册或登录 GitHub 账号（github.com），进入 github.com/features/copilot 开通 Copilot Free，或选择付费档位；学生可在 GitHub Education 完成学生认证后申请 Copilot Student。
2. 在 VS Code 中搜索安装 GitHub Copilot 扩展（JetBrains、Visual Studio、Xcode 等在各自插件市场安装），用 GitHub 账号登录授权。
3. 打开一个项目，先试试补全：写一行注释描述函数功能，看 Copilot 给出的建议，按 Tab 接受。
4. 打开 Copilot Chat，切到 Agent 模式，交给它一个具体的小任务。
5. 想在终端或桌面上用，可再安装 Copilot CLI 或 GitHub Copilot App，用同一账号登录。

可以这样开始：

```text
解释一下 src/api 目录里每个文件的职责。然后为 userService.ts 的 createUser 函数补充参数校验和对应的单元测试。
```

## 免费与付费

2026 年 6 月 1 日起，Copilot 全部档位改为“GitHub AI Credits”按量计费：对话、Agent 模式、代码审查、云端智能体、CLI 和 App 都消耗额度（1 个 AI Credit = 0.01 美元），代码补全不消耗。个人档位（官网定价页，2026-10 查询）：

| 档位 | 价格 | 主要区别 |
| --- | --- | --- |
| Free | 免费 | 有限的对话和 Agent 使用，含 CLI 和 Agent 模式 |
| Pro | 10 美元/月 | 每月含 15 美元 AI Credits，补全不限，含代码审查和云端智能体 |
| Pro+ | 39 美元/月 | 每月含 70 美元 AI Credits，可委派第三方编程智能体 |
| Max | 100 美元/月 | 每月含 200 美元 AI Credits，面向长时间 Agent 工作 |

组织档位：Business 19 美元/席位/月、Enterprise 39 美元/席位/月（GitHub Docs 计划页）。已认证学生可免费使用 Copilot Student；已认证的教师和热门开源项目维护者可能获得免费的 Copilot Pro。

## 适合谁 / 不适合谁

**适合：**
- 不想离开现有 IDE（尤其是 JetBrains、Visual Studio、Xcode 用户）又想用上 AI 的开发者；
- 代码托管在 GitHub、希望把 Issue → 代码 → PR → 审查串起来的团队；
- 预算有限的学生和个人开发者——免费档和学生档门槛低。

**不适合：**
- 代码不在 GitHub、而是在 GitLab 或自建平台的团队，云端智能体和 PR 相关功能用不上；
- 只想要一个功能单一、可完全离线使用的补全工具的人；
- 需要预先精确控制每月开销却又大量使用 Agent 的用户，按量计费需要自己盯额度。

## 注意事项

- **数据训练**：GitHub 官方博客说明，自 2026 年 4 月 24 日起，Copilot Free、Pro、Pro+ 用户的交互数据（输入、输出、代码片段及上下文）默认会被用于训练和改进 AI 模型，可在账户设置的 Privacy 中关闭；Business、Enterprise 不受影响。之前已经关闭过相关设置的用户，选择会被保留。
- **额度消耗**：不同模型消耗 AI Credits 的速度不同，长时间运行的 Agent 任务花费更多，可在账户里查看本计费周期已用额度。
- **生成代码要审查**：AI 生成的代码可能有错误、安全漏洞或许可证问题，合并前请人工审查并运行测试。

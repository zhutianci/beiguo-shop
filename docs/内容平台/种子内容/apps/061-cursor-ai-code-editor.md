---
title: "Cursor 是什么、哪家公司的：AI 代码编辑器官网下载与上手"
slug: cursor-ai-code-editor
name: Cursor
url: https://cursor.com/
pricing: 免费+付费
platforms: Windows / macOS / Linux / 命令行 / 网页（云端智能体） / iOS
trialNote: Hobby 免费版无需信用卡，含有限的 Agent 请求和 Composer 模型
products: [cursor]
models: []
topics: [coding, ai-agent]
excerpt: "Cursor 是 Anysphere 出品的 AI 代码编辑器，2026 年 8 月起成为 SpaceX 子公司。桌面 IDE、命令行、云端智能体和 iOS App 共用一套 Agent，适合想在编辑器里让 AI 改代码的开发者。"
checkedOn: 2026-10-07
sources:
  - https://cursor.com/pricing
  - https://cursor.com/docs/models
  - https://cursor.com/blog/joining-spacex
  - https://cursor.com/docs/account/regions
---

> 本文根据 Cursor 官网、定价页、官方文档和官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Cursor 是 Anysphere 公司开发的 AI 代码编辑器，界面和操作习惯沿用 VS Code，所以 VS Code 用户能直接上手。据官方博客（2026-08-14），SpaceX 对 Cursor 的收购流程始于 2026 年 4 月、现已正式完成，双方在 SpaceXAI 的合作下共同训练模型；官方博客称产品使命不变。

现在的 Cursor 早就不只是“带补全的编辑器”，官网的定位是“编程智能体”：同一个 Agent 可以在桌面 IDE、命令行（Cursor CLI）、云端虚拟机（Cloud Agents）和 iOS App 里运行。模型方面，Cursor 自家的 Composer 2.5 和 SpaceXAI 的 Grok 4.7 / 4.6 / 4.5 属于“Cursor Models”额度池，另外也能选 Anthropic Claude、Google Gemini、OpenAI GPT 等第三方模型，按 API 价计入“Other Models”额度池。

**和同类的区别**：Cursor 是一个完整的独立编辑器，补全、对话、Agent、代码审查都在一个界面里；GitHub Copilot 主要以插件形式进入你现有的 IDE，Claude Code 和 Codex 则更偏命令行和多端智能体。

## 能做什么

- **Tab 补全与多行修改**：边写边预测下一处改动，付费档补全不限次数。
- **Agent 改代码**：用自然语言描述需求，Agent 读代码库、跨文件修改、跑终端命令，改完给出 diff 让你逐条确认。
- **Plan 模式与 Design Mode**：先让 Agent 出方案再执行；前端界面可以在可视化模式下调整。
- **云端智能体**：把任务交给云端独立虚拟机并行跑，完成后返回 PR、截图或录屏，手机上也能查看和追问。
- **Bugbot 与 Grok Bot**：Bugbot 在代码平台上自动审查 PR；Grok Bot 是带云端电脑（浏览器、文件系统、终端）的常驻 AI 助手，发消息给它就能跨应用办事，个人付费档和 Teams 都包含。
- **规则、技能、MCP 与 Hooks**：用项目规则约束代码风格，接入 MCP 服务器连数据库、Jira、Linear 等外部工具。

## 怎么上手

1. 打开官网 cursor.com，点 Download 下载对应系统的安装包（官方文档要求 macOS 12、Windows 10 及以上；Linux 有 apt / dnf 软件源和 AppImage）。
2. 打开应用，注册或登录 Cursor 账号。
3. 选择一个已有项目文件夹打开。
4. 按 Ctrl+I（macOS 为 Cmd+I）打开 Agent，先让它解释代码库、指出主要入口，再交给它一个低风险的小改动。
5. 认真看 Agent 给出的 diff，确认后再接受；想在终端里用，可另装 Cursor CLI。

可以这样开始：

```text
先通读这个项目，用中文说明目录结构和启动方式。然后给 utils/date.ts 补上单元测试，跑一遍测试，把失败原因和修改说明列出来。
```

## 免费与付费

个人档位（官网定价页月付价格，2026-10 查询）：

| 档位 | 价格 | 主要区别 |
| --- | --- | --- |
| Hobby | 免费 | 有限的 Agent 请求，可用 Composer |
| Pro | 20 美元/月 | 扩展的 Agent 额度、前沿模型、云端智能体、MCP / 技能 / Hooks |
| Pro+ | 60 美元/月 | 官方推荐给每天重度用 Agent 的人 |
| Ultra | 200 美元/月 | 面向 Agent 重度用户 |

团队版 Teams 为 40 美元/人/月（月付），含集中计费、团队隐私模式、SSO 等；Enterprise 价格需联系销售。每个付费档都包含一定的模型用量，用完后可开启按量计费。官方 FAQ 明确说 Cursor 订阅只在 cursor.com 直接销售，不授权任何经销商。

## 适合谁 / 不适合谁

**适合：**
- 日常用 VS Code、希望换一个“AI 原生”编辑器的开发者；
- 想在同一个界面里完成补全、对话、Agent 改代码和 PR 审查的人；
- 需要云端并行跑多个任务、在手机上看进度的独立开发者或小团队。

**不适合：**
- 坚持使用 JetBrains、Xcode 等其他 IDE、不想换编辑器的人（可考虑 Copilot 或各家 CLI 智能体）；
- 预算很紧、又需要大量调用第三方顶级模型的用户——第三方模型按 API 价扣额度，消耗较快；
- 只想偶尔问几句代码问题的人，通用聊天助手就够了。

## 注意事项

- **模型列表会变**：可用的第三方模型随合作关系和版本调整，选择模型前请看客户端里的实际列表和官方模型文档。
- **地区限制**：官方文档说明，部分模型提供方有地区限制，某些模型在你所在地区可能不可用；具体以 Anthropic、OpenAI、Google 各自的支持地区列表为准。
- **隐私**：在设置里开启 Privacy Mode（团队可由管理员统一开启）后，官方承诺代码数据不会被 Cursor 或模型提供方用于训练。
- **AI 改动要审查**：Agent 能执行终端命令，建议在 Git 仓库中使用、改动前先提交，重要代码务必人工审查和跑测试。

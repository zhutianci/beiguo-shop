---
title: "Cline 是什么、怎么用：开源 VS Code 编程智能体与 ClinePass"
slug: cline-open-source-coding-agent
name: Cline
url: https://cline.bot/
pricing: 开源免费（模型按用量付费或自带 Key；ClinePass 订阅）
platforms: VS Code 插件 / 命令行 / Windows / macOS / Linux / JetBrains 插件（企业版）/ SDK
trialNote: 扩展本身对个人免费，只为 AI 模型调用付费；可自带 API Key 或接本地模型
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Cline 是 Apache 2.0 开源的编程智能体，可作为 VS Code 扩展、命令行工具、桌面应用或 SDK 使用。个人免费，可自带 Claude、GPT、Gemini、DeepSeek 等任意模型的 Key 或接本地模型，按“先计划再执行”逐步审批改动。"
checkedOn: 2026-10-07
sources:
  - https://cline.bot/
  - https://cline.bot/pricing
  - https://cline.bot/cline-pass
  - https://github.com/cline/cline
---

> 本文根据 Cline 官网、定价页、ClinePass 页面和官方 GitHub 仓库整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Cline 是 Cline Bot Inc. 维护的开源编程智能体，代码以 Apache 2.0 协议托管在 GitHub（cline/cline，约 7 万星、250 多位贡献者）。官网称它是“一个开源的智能体运行时”，可以用在编辑器里、终端里，也可以嵌入你自己的产品：

- **IDE 扩展**：最常用的形态，装在 VS Code 里（官网称在 VS Code 扩展市场和 Open VSX 上累计安装超过 1100 万次）；
- **Cline CLI**：在终端、脚本、定时任务和 CI 流水线里运行；
- **Cline for Desktop**：新推出的原生桌面应用，不需要编辑器，支持 macOS、Windows、Linux；
- **SDK**：把 Cline 的智能体能力嵌入自己的工具。

**和同类的区别**：Cline 最大的特点是“开源 + 不绑定模型”。它本身不卖模型订阅，你可以用 Anthropic、OpenAI、Google Gemini、OpenRouter、AWS Bedrock、GCP Vertex、DeepSeek 等任意提供方的 Key，或通过 Ollama、LM Studio 接本地模型，换模型不换工作流。Cursor、Copilot 等商业产品则以订阅为主、模型列表由厂商决定。

## 能做什么

- **Plan / Act 双模式**：先在 Plan 模式里和 Cline 对齐方案，再切到 Act 执行；每一步都可以手动批准，也可以开自动批准。
- **跨文件修改**：协调修改多个文件，提供 diff、检查点和一键撤销。
- **运行终端命令**：执行命令并根据输出实时调整，能处理开发服务器、测试、部署等长时间任务。
- **规则与技能**：在仓库里放 `.clinerules`，让智能体遵守你的代码规范、架构和部署约定。
- **MCP 与插件扩展**：接入 MCP 服务器连接数据库、API 和基础设施；官网还有 MCP 市场。
- **多智能体与自动化**：协调者智能体把任务分派给专门的子智能体，可按 cron 定时运行；可在 Slack、Discord、Telegram、Linear 中对话，或在 GitHub Actions、GitLab 中无人值守运行。

## 怎么上手

1. 打开 VS Code，在扩展视图搜索 “Cline” 并安装（也可以从 cline.bot 下载桌面版，或安装 Cline CLI）。
2. 点击侧边栏的 Cline 图标，选择模型提供方：可以登录 Cline 账号使用 Cline 提供方（按量付费）或 ClinePass，也可以填入自己的 API Key，或配置本地 Ollama / LM Studio。
3. 打开一个项目，先切到 Plan 模式描述任务，让 Cline 给出方案。
4. 方案没问题后切到 Act 模式，逐步查看并批准它的文件修改和命令。
5. 把团队约定写进 `.clinerules`，让之后的任务自动遵守。

可以这样开始（Plan 模式）：

```text
我想给这个 Express 项目加上请求频率限制。先阅读现有路由和中间件结构，给出实现方案和需要改动的文件清单，先不要改代码。
```

## 免费与付费

官网定价页（2026-10 查询）：

| 方式 | 价格 | 说明 |
| --- | --- | --- |
| 开源版 | 免费 | 个人开发者免费使用 VS Code 扩展和 CLI，无订阅、无席位费；只为模型调用付费 |
| 自带 Key（BYOK） | 按各模型提供方价格 | 直接向 Anthropic、OpenAI 等提供方付费 |
| Cline 提供方 | 按 API 价按量付费 | 可用的模型更多，不用分别注册各家账号 |
| ClinePass | 9.99 美元/月（ClinePass 页面，可能另有手续费） | 包含 GLM、Kimi、DeepSeek、MiniMax、MiMo、Qwen 等开源权重模型，官方称配额为标准 API 速率限制的 2–5 倍 |
| Enterprise | 定制 | JetBrains 扩展、SSO、集中计费、权限控制、审计日志、VPC 部署、SLA 等 |

## 适合谁 / 不适合谁

**适合：**
- 想自己掌控模型和成本、不愿被单一厂商订阅绑定的开发者；
- 希望使用国产或本地模型做编程智能体的人（BYOK、本地模型或 ClinePass）；
- 需要在 CI、定时任务里跑智能体，或想把智能体嵌入自家产品的团队。

**不适合：**
- 不想折腾 API Key 和模型配置、希望开箱即用的新手；
- 希望一个固定月费覆盖顶级闭源模型大量调用的人——用 Claude、GPT 等按量计费，重度使用花费可能不低；
- 个人 JetBrains 用户：官网定价页把 JetBrains 扩展列在企业版功能中。

## 注意事项

- **费用自己盯**：自带 Key 时，账单由各模型提供方结算，长任务会持续消耗 token，建议在提供方后台设置预算上限。
- **数据流向**：官网强调客户端架构（Secure Client-Side Architecture）；使用自带 Key 时，代码和对话会发送到你选择的模型提供方，适用该提供方的数据政策。
- **谨慎开启自动批准**：Cline 能执行终端命令和修改文件，自动批准前确认风险，并在 Git 仓库中使用。
- **模型可用性**：所选模型提供方是否支持你所在的地区，以各提供方的官方说明为准。

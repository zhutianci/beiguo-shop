---
title: "gemini-api skill 是什么、怎么安装使用：Google 官方的 Gemini API 开发 Skill（Agent Platform / 原 Vertex AI）"
slug: google-gemini-api-skill-agent-platform
name: gemini-api（google/skills）
url: https://github.com/google/skills/tree/main/skills/cloud/gemini-api
pricing: "开源免费（Apache-2.0）；云资源按 Google Cloud 计费"
platforms: "Claude Code / Codex / Antigravity（插件）；其他智能体用 npx skills"
trialNote: "npx skills add google/skills --skill gemini-api"
products: [gemini, claude]
models: [gemini-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "gemini-api 是 google/skills 里的 Gemini 开发技能：指导在 Agent Platform（原 Vertex AI）上用 Google Gen AI SDK 调用 Gemini，覆盖 Python、JS/TS、Go、Java、C# 以及多模态、工具、缓存和 Live API。"
checkedOn: 2026-10-11
sources:
  - https://github.com/google/skills/tree/main/skills/cloud/gemini-api
  - https://github.com/google/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 google/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 google/skills 在 GitHub 约 2.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Google 的 AI 平台改名频繁，SDK 也换过代，模型凭旧记忆写出来的 Gemini 调用代码经常用的是已经过时的库。gemini-api 技能给出当前的正确写法。它开头就有一条重要提示：**Agent Platform（全称 Gemini Enterprise Agent Platform）就是以前的 Vertex AI**，网上大量资料仍沿用旧名。

`description`：当用户询问在企业环境中使用 Gemini，或明确提到 Vertex AI、Google Cloud、Agent Platform 时使用；指导通过 Google Gen AI SDK 使用 Agent Platform 上的 Gemini API；覆盖 SDK 用法（Python、JS/TS、Go、Java、C#），以及多模态输入、工具、媒体生成、缓存、批量预测和 Live API 等能力。兼容性一栏写明：需要有效的 Google Cloud 凭据，并已启用 Agent Platform API。

内容包括：核心指令、各语言的 SDK、**认证与配置**（应用默认凭据，以及更简单的 Express 模式）、初始化、模型选择、五种语言的快速上手代码，并指明以 API 规范和官方文档为事实来源。更细的主题放在九份参考文件里：文本与多模态、结构化输出与工具、嵌入、媒体生成、Live API、模型调优、安全设置、高级特性、边界框。

## 怎么安装

仓库 README 的安装方式是 `npx skills add google/skills`。这个库有一百多个技能，建议用 skills CLI 的 `--skill` 参数只装需要的：

```bash
npx skills add google/skills --skill gemini-api
```

Claude Code 也可以按插件安装：`claude plugin marketplace add google/skills`，再 `claude plugin install <插件名>@google-plugins`（插件划分见仓库的市场清单）。

仓库整体介绍和其他安装方式，详见本站《google/skills 是什么、怎么安装：Google 官方 Agent Skills 仓库（Google Cloud、BigQuery、GKE、Gemini API、广告 SDK）》。

## 怎么用

- 「用 Python 写一个调用 Gemini 分析图片的脚本，走 Google Cloud 的认证」。
- 「把这段用旧版 Vertex AI SDK 的代码迁移到 Google Gen AI SDK」。
- 「加上函数调用和上下文缓存」。

## 适合谁 / 局限

适合在 Google Cloud 上做企业级 Gemini 应用的开发者。注意它面向的是**云平台上的企业用法**；只是用 AI Studio 的个人 API Key 做小项目的话，流程更简单，未必需要这个技能。模型名称与可用区域变化快，以官方文档为准。

## 注意事项

- **许可**：Apache-2.0。
- **凭据与费用**：需要 Google Cloud 项目和凭据，调用按 Google Cloud 的价格计费；凭据用官方的登录方式配置，不要把密钥文件提交进仓库或贴进对话。
- **不执行脚本**；按说明会去查阅官方文档。
- 国内网络环境访问 Google Cloud 接口可能受限，属于网络层面的问题。

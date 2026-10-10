---
title: "microsoft/skills 是什么、怎么安装：微软官方的 Azure SDK 与 Microsoft Foundry Agent Skills（175 个，按语言分）"
slug: microsoft-skills-azure-sdk-foundry
name: microsoft/skills（微软 Azure SDK 与 Foundry 技能）
url: https://github.com/microsoft/skills
pricing: "开源免费（MIT）；操作的 Azure 资源按微软云计费"
platforms: "GitHub Copilot（CLI / VS Code）/ Claude Code / OpenCode 等，用 npx skills 安装"
trialNote: "npx skills add microsoft/skills"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "microsoft/skills 是微软官方的 Agent Skills 仓库：约 175 个面向 Azure SDK 与 Microsoft Foundry 开发的技能，按 Python、.NET、TypeScript、Java、Rust 分组，另附自定义智能体、AGENTS.md 模板和 MCP 配置。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/skills
  - https://microsoft.github.io/skills/
  - https://github.com/vercel-labs/skills
---

> 本文根据 microsoft/skills 仓库 README 整理，资料核对于 2026-10-11。README 标注该仓库仍在积极开发中，技能数量以仓库为准。

## 是什么

microsoft/skills 是微软维护的技能仓库，主题很集中：让编程智能体在使用 **Azure SDK** 和 **Microsoft Foundry** 时写出符合当前 SDK 写法的代码。README 的解释是，这些模式其实已经在模型的预训练权重里，缺的只是合适的「激活上下文」把它们调出来。

除了技能，仓库还打包了几样配套资源：按角色划分的自定义智能体（后端、前端、基础设施、规划）、一份 `AGENTS.md` 模板，以及预配置的 MCP 服务器（文档、GitHub、浏览器自动化）。README 顶部挂着「Work in Progress」的提示：技能还在增加，已有技能在更新到最新 SDK 写法，测试也在扩充。

截至 2026-10-11，GitHub 显示该仓库约 3098 Star、350 Fork，最近一次推送在 2026-10-09。注意它和 skills.sh 榜单上安装量很高的 `microsoft/azure-skills` 是两个不同的仓库。

## 包含哪些 Skill

README 的目录表按语言分组，并用后缀区分：

- **Core**：11 个通用技能；
- **Foundry（与语言无关）**：11 个；
- **Python**：39 个（后缀 `-py`）；**.NET**：28 个（`-dotnet`）；
- **TypeScript**：25 个（`-ts`）；**Java**：25 个（`-java`）；**Rust**：7 个（`-rust`）。

例如 README 的安装示例里出现的 `azure-cosmos-db-py`、`mcp-builder`。另有通过 Copilot CLI 安装的插件包，如 `deep-wiki` 和 `azure`。仓库还有一个网页版的 Skill Explorer，可以浏览全部技能并一键安装。

## 怎么安装

README 的 Quick Start：

```bash
npx skills add microsoft/skills
```

在向导里勾选需要的技能。技能会装到所选智能体的目录（GitHub Copilot 是 `.github/skills/`），同时用多个智能体时以符号链接共享。

手动方式是克隆仓库后只复制需要的技能文件夹到项目的 `.github/skills/`。插件包在 Copilot CLI 里安装：`/plugin marketplace add microsoft/skills`，再 `/plugin install azure@skills`。

## 怎么用

装好后按平常方式提需求，命中的技能自动加载：

- 「用 Python 写一个读写 Cosmos DB 的数据访问层」；
- 「在 .NET 项目里接入 Azure 的身份认证，用托管标识」；
- 「给这个 Foundry 智能体加一个工具调用」。

## 适合谁 / 不适合谁

**适合：**
- 在 Azure 上开发、主要用 GitHub Copilot 或 Claude Code 的团队；
- 被「模型写的是旧版 SDK 写法」困扰的开发者。

**不适合：**
- 不用 Azure 的项目；
- 想要一键全装的人——README 明确反对。

## 注意事项

- **许可证**：MIT。
- **不要全装**：README 的原话是「有选择地使用技能」，全部加载会导致上下文腐化——注意力被稀释、浪费 token、不同模式混在一起，只复制当前项目必需的技能。
- **维护状态**：官方维护、更新频繁，但处于开发中，技能可能调整或改名。
- **云资源与凭据**：技能教的是写代码，真正部署和调用 Azure 时会产生费用；凭据走官方的登录方式和托管标识，不要写进代码。
- **MCP 配置**：仓库附带的 MCP 服务器配置会让智能体获得访问 GitHub、浏览器等的能力，启用前确认范围。

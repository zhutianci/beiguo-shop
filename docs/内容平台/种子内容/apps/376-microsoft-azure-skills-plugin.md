---
title: "azure-skills 是什么、怎么安装：微软官方 Azure Skills 插件（技能 + Azure MCP Server，让智能体真正操作 Azure）"
slug: microsoft-azure-skills-plugin
name: microsoft/azure-skills（Azure Skills 插件）
url: https://github.com/microsoft/azure-skills
pricing: "开源免费（MIT）；Azure 资源按微软云计费"
platforms: "GitHub Copilot（CLI / VS Code）/ Claude Code / Gemini CLI / Cursor / Codex CLI / IntelliJ"
trialNote: "`/plugin marketplace add microsoft/azure-skills` 然后 `/plugin install azure@azure-skills`"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "microsoft/azure-skills 是微软官方的 Azure 插件：一次安装同时带来 Azure 技能、Azure MCP Server 和 Foundry MCP，技能负责「知道怎么做」，MCP 工具负责在真实的 Azure 资源上执行。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/azure-skills
  - https://skills.sh/
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 microsoft/azure-skills 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。

## 是什么

microsoft/azure-skills 是微软官方的 Azure 插件。README 的开场白是：Azure 上的工作不只是代码问题，更是决策问题——哪个服务适合这个应用、部署前要验证什么、该跑哪些工具、哪些护栏重要。这个插件把 Azure 的专业知识和基于 MCP 的执行能力打包在一起，让智能体能做真正的 Azure 工作，而不是给泛泛的云建议。

它强调自己「不是一个提示词包」，而是三层能力：

- **Azure 技能（大脑）**：教智能体 Azure 的工作流程、决策树和护栏；
- **Azure MCP Server（双手）**：README 称提供覆盖 40 多个 Azure 服务的 200 多个结构化工具，用于列出资源、查价格、查日志、诊断问题；
- **Foundry MCP（AI 专家）**：模型目录、部署、智能体和评测。

截至 2026-10-11，GitHub 显示该仓库约 1555 Star、254 Fork，最近一次推送在 2026-10-09。它在 skills.sh 当日榜单上有三十多个技能，安装量多在四五十万次。注意它和本站另一条目 microsoft/skills（面向 Azure SDK 写代码）是两个仓库。

## 包含哪些 Skill

README 按场景分组举例：

- **构建、部署与演进**：`azure-prepare`、`azure-validate`、`azure-deploy`、`azure-upgrade`、`azure-enterprise-infra-planner`、`azure-kubernetes` 等；
- **排障、监控与治理**：`azure-diagnostics`、`appinsights-instrumentation`、`azure-compliance`、`azure-resource-lookup`、`azure-quotas`；
- **优化架构与成本**：`azure-cost`、`azure-compute`、`azure-resource-visualizer`、`azure-cloud-migrate`；
- 以及数据、AI、身份（如 `entra-app-registration`）等方向的技能。

## 怎么安装

**前置条件**（README）：一个 Azure 账号或订阅；Node.js 18 以上（用 `npx` 启动 MCP 服务器）；已安装并用 `az login` 登录的 Azure CLI；要用部署流程的话，还需要已登录的 Azure Developer CLI。

**Claude Code / GitHub Copilot CLI**：

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

Claude Code 也可以从官方市场装：`/plugin install azure@claude-plugins-official`。Gemini CLI 用 `gemini extensions install https://github.com/microsoft/azure-skills`，Codex 用 `codex plugin marketplace add microsoft/azure-skills`。README 还给了 VS Code、Cursor、IntelliJ 的步骤。

## 怎么用

- 「把这个 Node 应用部署到 Azure，先帮我选合适的服务并做部署前检查」；
- 「生产环境的这个 Web 应用最近频繁 5xx，帮我诊断」；
- 「列出这个订阅里上个月花费最高的资源，看看哪里能省」。

## 适合谁 / 不适合谁

**适合：** 在 Azure 上运行业务、希望智能体直接参与部署和运维的开发与运维团队。

**不适合：** 不用 Azure 的人；对让智能体直接操作云资源还没有把握的团队——可以先只用它的技能做规划和检查，不授予执行权限。

## 注意事项

- **许可证**：GitHub 标注为 MIT。
- **它能动真资源**：MCP 工具使用你本机 `az login` 的身份，智能体因此拥有与你相同的权限。强烈建议用权限受限的账号或只读角色，在非生产订阅里先试；创建、删除、扩容类操作让它先说明再执行。
- **费用**：插件免费，被创建和使用的 Azure 资源照常计费。
- **主权云**：README 有针对主权云（Sovereign Cloud）环境的配置说明，使用非全球版 Azure 的用户需要查看。
- 数据去向：资源清单、日志内容会进入模型上下文，留意合规要求。

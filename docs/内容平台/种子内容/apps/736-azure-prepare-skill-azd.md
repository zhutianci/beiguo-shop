---
title: "azure-prepare skill 是什么、怎么安装使用：部署到 Azure 之前，先让智能体写计划、生成 Bicep / Terraform"
slug: azure-prepare-skill-azd
name: azure-prepare（microsoft/azure-skills）
url: https://github.com/microsoft/azure-skills/tree/main/skills/azure-prepare
pricing: "开源免费（MIT）；Azure 资源按微软云计费"
platforms: "GitHub Copilot / Claude Code / Gemini CLI / Cursor / Codex CLI"
trialNote: "`/plugin marketplace add microsoft/azure-skills` 然后 `/plugin install azure@azure-skills`"
products: [github-copilot, claude]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "azure-prepare 是微软 Azure Skills 插件里的准备技能：面向 Azure Developer CLI（azd）流程，先在项目里写出 .azure/deployment-plan.md 并等你批准，再生成 azure.yaml、基础设施代码和 Dockerfile。"
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/azure-skills/tree/main/skills/azure-prepare
  - https://github.com/microsoft/azure-skills
  - https://skills.sh/
---

> 本文根据 microsoft/azure-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 55.0 万次；所在仓库 microsoft/azure-skills 在 GitHub 约 1555 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

微软把「把应用部署到 Azure」拆成三个技能接力：`azure-prepare` → `azure-validate` → `azure-deploy`。prepare 是第一棒，只做准备，不执行部署。`description`：为基于 azd 的 Azure 项目做部署准备，生成 `azure.yaml`、基础设施代码（Bicep / Terraform）和 Dockerfile；只在用户明确要用 azd、或项目里已经有 `azure.yaml` 时使用。非 azd 的部署、只传代码的 Python App Service 部署、跨云迁移各有别的技能。

SKILL.md 自称是这件事的权威流程，要求逐条照做。几条规则：

- **先写计划**：第一个动作就是在工作区根目录写出 `.azure/deployment-plan.md` 的骨架，随分析逐步填满；后面的 validate 和 deploy 都依赖这个文件。
- **先批准再动手**：计划给你看过、同意之后才生成任何文件。
- 订阅和区域必须向你确认；破坏性操作必须先问；不许删除你的项目目录，给已有项目加功能时只改现有文件。

两个阶段各有步骤表。**规划**：分析工作区（新建、修改还是现代化改造）→ 收集需求（规模、预算）→ 扫描代码库 → 选「配方」（默认 AZD，也可以是 Azure CLI、Bicep 或 Terraform）→ 规划架构，把组件映射到 Azure 服务 → 定稿并提交给你。**执行**：研究各组件 → 确认 Azure 上下文与资源配额 → 生成基础设施和配置文件 → 安全加固 → 功能验证 → 把计划状态改成「待验证」，交给 `azure-validate`。

## 怎么安装

`azure-prepare` 随微软的 Azure 插件一起安装，插件同时配置好 Azure MCP Server。Claude Code 里（命令来自仓库 README）：

```text
/plugin marketplace add microsoft/azure-skills
/plugin install azure@azure-skills
```

Gemini CLI 用 `gemini extensions install https://github.com/microsoft/azure-skills`，Codex 用 `codex plugin marketplace add microsoft/azure-skills`；GitHub Copilot 的装法见 README。真正操作云资源前，本机要装好 Azure CLI（`az`）并登录，部署类场景还要 Azure Developer CLI（`azd`）。

仓库整体介绍和其他安装方式，详见本站《azure-skills 是什么、怎么安装：微软官方 Azure Skills 插件（技能 + Azure MCP Server，让智能体真正操作 Azure）》。

## 怎么用

- 「把这个 Next.js 加 Postgres 的项目准备好，用 azd 部署到 Azure」。
- 「给现有项目加一个定时触发的 Azure Function，更新部署计划」。
- 「基础设施用 Terraform 写，区域选东亚」。

## 适合谁 / 局限

适合已经决定用 Azure、想省掉手写 Bicep 和 `azure.yaml` 的开发者。它只覆盖 azd 这条路线；生成的架构和规格是按通用实践选的，成本要自己核算；生成的基础设施代码应当像别人提交的代码一样评审后再用。

## 注意事项

- **许可**：MIT（frontmatter 标注，作者 Microsoft）。
- **会写文件**：计划文件、`azure.yaml`、`infra/` 目录和 Dockerfile 都写进你的项目，建议在分支上进行。
- **会查询你的 Azure 订阅**：通过插件配置的 Azure MCP Server 和本机的 `az` / `azd` 登录状态；这一步本身不创建资源，后续部署产生的费用按微软云计费。

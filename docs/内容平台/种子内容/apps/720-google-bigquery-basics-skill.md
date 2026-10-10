---
title: "bigquery-basics skill 是什么、怎么安装使用：Google 官方的 BigQuery 入门 Skill（数据集、表、查询作业）"
slug: google-bigquery-basics-skill
name: bigquery-basics（google/skills）
url: https://github.com/google/skills/tree/main/skills/cloud/bigquery-basics
pricing: "开源免费（Apache-2.0）；云资源按 Google Cloud 计费"
platforms: "Claude Code / Codex / Antigravity（插件）；其他智能体用 npx skills"
trialNote: "npx skills add google/skills --skill bigquery-basics"
products: [gemini, claude]
models: [gemini-llm]
topics: [agent-skills, data-analysis, coding]
excerpt: "bigquery-basics 是 google/skills 里的 BigQuery 基础技能：让智能体管理数据集、表和作业，运行 SQL 查询、做基础的数据导入与分析，并附命令行、客户端库、基础设施即代码、权限安全和 MCP 用法的参考。"
checkedOn: 2026-10-11
sources:
  - https://github.com/google/skills/tree/main/skills/cloud/bigquery-basics
  - https://github.com/google/skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 google/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 google/skills 在 GitHub 约 2.1 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

BigQuery 是 Google Cloud 的无服务器数据仓库，按查询扫描的数据量计费——这意味着智能体随手写一条没有限定范围的查询，可能扫描整张大表并产生不小的费用。bigquery-basics 是官方提供的入门技能，帮智能体按正确的方式和它打交道。`description`：管理 BigQuery 中的数据集、表和作业；需要与 BigQuery 交互、运行 SQL 查询、管理 BigQuery 资源（数据集、表、视图），或执行基础的数据导入和分析时使用。

SKILL.md 本身不长：先介绍 BigQuery 是什么——无服务器的数据平台，计算与存储分离、各自独立伸缩，内置机器学习、地理空间分析和商业智能能力——然后是设置与基本用法，再指向参考目录和相关技能。

实质内容在八份参考文件里：核心概念、命令行（`bq`）用法、客户端库用法、基础设施即代码（如 Terraform）、权限与安全、通过 MCP 使用、持续查询，以及变更历史相关功能。同库里还有更专门的 BigQuery 技能——查询优化、成本优化、故障排查、可观测性、内置的 AI 与机器学习功能——这个基础技能会把智能体引向它们。

## 怎么安装

仓库 README 的安装方式是 `npx skills add google/skills`。这个库有一百多个技能，建议用 skills CLI 的 `--skill` 参数只装需要的：

```bash
npx skills add google/skills --skill bigquery-basics
```

Claude Code 也可以按插件安装：`claude plugin marketplace add google/skills`，再 `claude plugin install <插件名>@google-plugins`（插件划分见仓库的市场清单）。

仓库整体介绍和其他安装方式，详见本站《google/skills 是什么、怎么安装：Google 官方 Agent Skills 仓库（Google Cloud、BigQuery、GKE、Gemini API、广告 SDK）》。

## 怎么用

- 「在 analytics 数据集里建一张按日期分区的事件表」。
- 「查一下上周每天的活跃用户数，先估算这条查询会扫描多少数据」。
- 「把 Cloud Storage 里的这批 CSV 导入到一张新表」。

## 适合谁 / 局限

适合刚开始使用 BigQuery 的开发者和数据分析师，或者想让智能体代为执行日常数据仓库操作的团队。它是「基础」技能，复杂的性能调优和成本治理要用同库的专门技能；它不了解你们的数据模型和业务口径。

## 注意事项

- **许可**：Apache-2.0。
- **费用**：查询按扫描量计费，存储另计，价格以 Google Cloud 官网为准。让智能体执行查询前先做试运行估算，并给项目设置配额或预算告警。
- **权限**：给智能体使用的身份只授予必要的角色，生产数据集建议只读。
- **会执行命令**：通过 `bq` 或 `gcloud` 操作真实的云资源，删除类操作要求它先确认。

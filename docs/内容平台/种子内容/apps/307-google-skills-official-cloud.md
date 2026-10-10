---
title: "google/skills 是什么、怎么安装：Google 官方 Agent Skills 仓库（Google Cloud、BigQuery、GKE、Gemini API、广告 SDK）"
slug: google-skills-official-cloud
name: google/skills（Google 官方 Agent Skills）
url: https://github.com/google/skills
pricing: 开源免费（Apache-2.0）；操作的云资源按 Google Cloud 计费
platforms: Claude Code / Codex / Antigravity CLI（插件）；其他智能体用 npx skills
trialNote: "npx skills add google/skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, data-analysis]
excerpt: "google/skills 是 Google 官方的 Agent Skills 仓库，收录 150 多个面向 Google Cloud、BigQuery、GKE、Gemini API、Firebase 的技能，可用 npx skills 安装，也能当作 Claude Code / Codex 的插件市场添加。"
checkedOn: 2026-10-10
sources:
  - https://github.com/google/skills
  - https://github.com/google/skills/blob/HEAD/.claude-plugin/marketplace.json
  - https://github.com/vercel-labs/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 google/skills 仓库 README、仓库内的插件市场清单和 Claude Code 官方文档整理，资料核对于 2026-10-10。仓库更新很快，技能名称和数量以仓库为准。

## 是什么

google/skills 是 Google 官方维护的 Agent Skills 仓库，用来教编程智能体正确使用 Google 的产品和技术，重点是 Google Cloud。大模型对云产品的命令行参数、最新接口和配置细节经常记错，这个仓库把每个产品的「怎么开通、怎么配置、常见坑、怎么排障」写成技能，智能体干到相关任务时再读进来。技能格式遵循 agentskills.io 的开放标准，所以不限于 Google 自家的工具。

截至 2026-10-10，GitHub 显示该仓库约 2.1 万 Star、1759 Fork，最近一次推送 2026-10-09。仓库创建于 2026 年 3 月，还比较新。

## 包含哪些 Skill

README 的清单按产品线分组，核对当日共 156 个：

- **Google Cloud 入门**：身份认证与授权（IAM）、云上基础环境搭建、新手引导；
- **多产品方案**：方案架构流程、在 Google Cloud 上构建并部署 AI 智能体、基于 GKE 与 AlloyDB 的企业搜索 RAG，以及一个帮你找技能的 Google Skill Finder；
- **AI / ML**：Gemini API、Gemini Live API、Agent Platform 的模型部署、调优、评估与提示词管理，Genkit 的 JS / Go / Python / Dart 四个版本，BigQuery AI & ML；
- **基础设施**：Cloud Storage，以及二十多个 GKE 技能（建集群、网络、存储、扩缩容、升级、可靠性、排障）；
- **数据库与分析**：BigQuery 基础、优化与排障，AlloyDB、Cloud SQL、Spanner、Bigtable，托管 Airflow；
- **开发与运维工具**：gcloud CLI、Cloud Build、Cloud Monitoring、Cloud Logging、Cloud Trace，GKE 成本分析；
- **架构框架**：Well-Architected Framework 的成本、可靠性、安全、性能等 6 个支柱；
- **安全与身份**：IAM 排障与策略管理、Security Command Center、Google SecOps 告警处置、Sign In With Google 接入；
- **托管与其他**：Cloud Run、Firebase 基础、Google Ads API、Google Mobile Ads SDK、Google Analytics API。

README 还列了放在别处的 Google 技能仓库：Android、Flutter、Dart、Firestore、Google Maps Platform、Agent Development Kit 等。

## 怎么安装

**通用方式**（README 首选）：

```bash
npx skills add google/skills
```

运行后会提示你选择装哪些技能（可以全选）、给哪些智能体装、装到项目还是全局。没有 `npx` 就先装 Node.js。

**插件方式**：仓库同时打包了 Google 各产品的插件（技能加 MCP 服务器）。README 给出的命令是：

- Claude Code：`claude plugin marketplace add google/skills`，然后 `claude plugin install <plugin>@google-plugins`；
- Codex：`codex plugin marketplace add google/skills`，然后在 `/plugins` 浏览器里安装；
- Antigravity CLI：`agy plugin install https://github.com/google/skills/<plugin-path>`。

市场清单里能看到 `alloydb`、`bigquery`、`bigtable`、`cloud-sql-postgresql` 等插件，它们的来源指向 GoogleCloudPlatform 账号下的独立仓库。

## 怎么用

技能装好后按任务自动加载，直接用平常的话描述即可，例如：

- 「把这个服务部署到 Cloud Run，并配置好告警」；
- 「这条 BigQuery 查询太慢太贵，帮我看看怎么优化」；
- 「GKE 上这个节点一直 NotReady，帮我排查」；
- 不知道有没有现成技能时，让智能体用 Google Skill Finder 找一找。

在 Claude Code 里输入 `/skills` 可以看到已装技能，也可以用 `/技能名` 手动调用。

## 适合谁 / 不适合谁

**适合：**
- 日常在 Google Cloud 上开发、运维，想让智能体少写错 gcloud 命令和配置的工程师；
- 用 BigQuery、GKE、Gemini API、Firebase 做项目的团队；
- 接入 Google 广告或 Analytics SDK 的应用开发者。

**不适合：**
- 用阿里云、腾讯云、AWS 的团队——技能几乎都绑定 Google 产品；
- 只想学概念、没有 Google Cloud 账号的人——大部分技能要对着真实项目才有用。

## 注意事项

- **许可证**：Apache-2.0，仓库根目录有 LICENSE 文件，README 也写明可以复制、修改和分发。
- **维护状态**：最近一次推送 2026-10-09，持续更新；市场清单的版本号还是 0.0.1，技能名称、分组后续可能调整。
- **安全与费用**：这些技能会指导智能体对真实云资源执行 gcloud 等命令，建集群、开实例、改 IAM 都可能产生费用或影响线上。建议用权限收窄的账号或测试项目，关键命令执行前逐条确认。插件方式会一并装上 MCP 服务器，安装前在详情里看清它连接什么、要什么权限。
- **兼容性**：插件安装命令只覆盖 Claude Code、Codex 和 Antigravity CLI；其他智能体走 `npx skills`。技能只提供做法，不替你开通账号、项目和结算，这些前置条件要自己准备好。

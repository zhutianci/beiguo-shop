---
title: "knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）"
slug: anthropic-knowledge-work-plugins
name: anthropics/knowledge-work-plugins
url: https://github.com/anthropics/knowledge-work-plugins
pricing: 开源免费（Apache-2.0）
platforms: Claude Cowork / Claude Code
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install sales@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, ai-agent]
excerpt: "knowledge-work-plugins 是 Anthropic 开源的 11 个岗位插件：销售、客服、产品、市场、法务、财务、数据、企业搜索等，每个插件打包了该岗位的 Skills、斜杠命令和连接器，面向 Cowork，也能装进 Claude Code。"
checkedOn: 2026-10-10
sources:
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
  - https://code.claude.com/docs/en/plugins/anthropic-marketplaces
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 Anthropic 官方 GitHub 仓库和 Claude Code 官方文档整理，资料核对于 2026-10-10。插件内容会更新，以仓库为准。

## 是什么

多数 Skills 仓库是写给程序员的，这个仓库是写给**非技术岗位**的。Anthropic 把自己内部工作中沉淀的做法做成了 11 个按岗位划分的插件并开源：每个插件把该岗位需要的 Skills（领域知识和步骤）、斜杠命令（明确触发的动作）、连接器（通过 MCP 接到 CRM、工单、数据仓库等外部工具）和子智能体打包在一起。README 说它们主要为 Claude Cowork 设计，同时兼容 Claude Code。

所有组件都是 Markdown 和 JSON 文件，没有需要编译的代码，可以直接改成自己公司的术语、流程和工具。

截至 2026-10-10，GitHub 显示该仓库约 2.8 万 Star、3,300 Fork，最近一次推送在 2026-10-10。

## 包含哪些 Skill

README 列出的 11 个插件（每个插件内含多个技能和命令）：

- **productivity**：管理任务、日历、日常工作流和个人上下文；
- **sales**：调研潜在客户、准备电话、检查销售管道、起草外联邮件、做竞品对比卡；
- **customer-support**：工单分流、起草回复、打包升级材料、把已解决的问题沉淀成知识库文章；
- **product-management**：写需求文档、规划路线图、整理用户调研、跟踪竞品；
- **marketing**：起草内容、策划活动、把控品牌语气、汇总各渠道表现；
- **legal**：审合同、初筛保密协议、梳理合规要求、评估风险；
- **finance**：准备分录、对账、生成财务报表、分析差异、支持月结和审计；
- **data**：写 SQL、做统计分析、搭看板、分享前校验结果；
- **enterprise-search**：一次查询跨邮件、聊天、文档和知识库；
- **bio-research**：连接文献检索、基因组分析等临床前研究工具；
- **cowork-plugin-management**：创建新插件或按公司情况定制现有插件。

各插件默认配置的连接器包括 Slack、Notion、Jira、HubSpot、Snowflake、Microsoft 365 等，具体见 README 表格。

## 怎么安装

**Cowork**：README 写的是从 claude.com/plugins 安装，在 Cowork 里直接选用。

**Claude Code**（在终端里运行，命令来自 README）：

```bash
# Add the marketplace first
claude plugin marketplace add anthropics/knowledge-work-plugins

# Then install a specific plugin
claude plugin install sales@knowledge-work-plugins
```

在 Claude Code 会话里对应的写法是 `/plugin marketplace add anthropics/knowledge-work-plugins`，再 `/plugin install sales@knowledge-work-plugins`。README 没有提供 Codex 或其他智能体的安装方式。

## 怎么用

- **自动生效**：装好后技能在相关任务里自动触发。例如装了 legal，把一份保密协议交给 Claude 并说「帮我初筛这份 NDA」，它会按插件里的清单逐项检查。
- **斜杠命令**：README 举的例子有 `/sales:call-prep`（准备销售电话）、`/data:write-query`（写查询）、`/finance:reconciliation`（对账）、`/product-management:write-spec`（写需求文档）。
- **改成自己的**：编辑插件里的 `.mcp.json` 换成自己公司用的工具；把公司术语、组织结构、流程写进技能文件；流程不合适就直接改技能里的步骤。

## 适合谁 / 不适合谁

**适合：**
- 销售、客服、产品、市场、法务、财务、数据分析等岗位，想让 Claude 按岗位规范干活的人；
- 想给团队做一套内部插件、需要一个官方范本的管理员；
- 想学习「技能 + 命令 + 连接器」怎么组合的插件作者。

**不适合：**
- 只写代码的开发者——这里几乎没有编程类技能；
- 没有对应外部工具账号的个人用户——很多能力依赖连接器，不接工具时只剩通用的流程指导。

## 注意事项

- **许可证**：Apache-2.0。
- **它是通用起点**：README 明确说这些插件是通用模板，真正好用要按自己公司的工具和流程定制。
- **专业判断不能外包**：法务、财务类技能产出的是初稿和检查清单，合同、报表等仍需专业人员复核。
- **连接器会访问业务数据**：连接 CRM、数据仓库、邮件等之前，确认授权范围，并遵守公司的数据规定；连接器由各服务方的 MCP 服务器提供，适用对方的条款。
- **自动更新**：官方文档说明，这个市场和 `claude-plugins-official` 不同，默认不开启自动更新，需要时在 `/plugin` 的 Marketplaces 标签页手动更新。
- **维护状态**：仓库活跃（最近推送 2026-10-10）。Anthropic 另有 anthropics/claude-for-legal 等更细分的行业插件仓库。

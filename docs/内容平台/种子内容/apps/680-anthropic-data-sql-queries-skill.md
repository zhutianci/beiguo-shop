---
title: "sql-queries skill 是什么、怎么安装使用：Anthropic 数据插件里的 SQL 写作 Skill（Snowflake / BigQuery / PostgreSQL 方言）"
slug: anthropic-data-sql-queries-skill
name: sql-queries（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/sql-queries
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install data@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, data-analysis, coding]
excerpt: "sql-queries 是 Anthropic knowledge-work-plugins 数据插件里的 SQL 技能：按 PostgreSQL、Snowflake、BigQuery、Redshift、Databricks 等方言写出正确高效的查询，并提供窗口函数、留存、漏斗、去重等常用分析模式。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/sql-queries
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

SQL 的麻烦在方言：日期函数、字符串处理、数组与 JSON 的写法，每家数据仓库都不一样，模型很容易把 PostgreSQL 的语法写进 BigQuery 的查询里。sql-queries 是一份按方言整理的参考。`description`：在所有主流数据仓库方言（Snowflake、BigQuery、Databricks、PostgreSQL 等）下编写正确且高性能的 SQL；在写查询、优化慢 SQL、在方言之间转换，或用 CTE、窗口函数、聚合构建复杂分析查询时使用。

它被标记为不可由用户直接调用（`user-invocable: false`）——属于背景知识型技能，由 Claude 在需要时自动加载，同插件里面向用户的 `write-query` 等命令会用到它。

内容分三部分：

- **各方言参考**：PostgreSQL（含 Aurora、RDS、Supabase、Neon）、Snowflake、BigQuery、Redshift、Databricks SQL，每种列出日期时间、字符串、数组与 JSON 的写法和性能建议；
- **常用分析模式**：窗口函数、用 CTE 提高可读性、同期群留存、漏斗分析、去重；
- **报错处理与调试**。

## 怎么安装

`sql-queries` 属于 anthropics/knowledge-work-plugins 的 `data` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install data@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/data:sql-queries` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- 「用 BigQuery 写一个按周统计的新用户 8 周留存查询，表结构如下……」。
- 「把这段 Snowflake SQL 改写成 PostgreSQL 能跑的版本」。
- 「这条查询扫描量太大，帮我优化」。

连接了数据仓库的 MCP 服务器时，Claude 可以直接执行并验证；否则它给出查询，由你去跑。

## 适合谁 / 局限

适合数据分析师、运营和需要自己取数的产品经理，尤其是在多个数据仓库之间切换的人。它不了解你的表结构和业务口径，需要你提供或让它先探索；方言参考是摘要，冷门函数仍以各数据库官方文档为准。

## 注意事项

- **许可**：Apache-2.0。
- **不执行脚本**；是否真正运行查询取决于你是否连接了数据源。
- **成本与安全**：在按扫描量计费的仓库里，让它执行前先看一眼查询；给智能体的数据库账号建议只读。

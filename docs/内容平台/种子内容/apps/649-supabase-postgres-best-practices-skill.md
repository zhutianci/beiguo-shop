---
title: "supabase-postgres-best-practices 是什么、怎么安装使用：Supabase 维护的 Postgres 最佳实践 Skill"
slug: supabase-postgres-best-practices-skill
name: supabase-postgres-best-practices（supabase/agent-skills）
url: https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices
pricing: "开源免费（MIT）"
platforms: "Claude Code / GitHub Copilot / Cursor / Cline 等支持 Agent Skills 的智能体"
trialNote: "npx skills add supabase/agent-skills --skill supabase-postgres-best-practices"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, data-analysis]
excerpt: "supabase-postgres-best-practices 是 Supabase 维护的 Postgres 规则 Skill：改动数据库里的任何东西之前加载，覆盖建表与类型选择、迁移、RLS 策略、索引、连接池、锁与慢查询诊断，适用于任何地方运行的 Postgres。"
checkedOn: 2026-10-11
sources:
  - https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices
  - https://github.com/supabase/agent-skills
  - https://supabase.com/docs/guides/getting-started/ai-skills
---

> 本文根据 supabase/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 43.9 万次；所在仓库 supabase/agent-skills 在 GitHub 约 2708 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体写 SQL，它会建出没有索引的外键、用错的列类型、能跑但会锁表的迁移，以及看似生效实则漏数据的行级安全策略。supabase-postgres-best-practices 是 Supabase 团队维护的 Postgres 规则集，并且特别说明适用于「运行在任何地方的 Postgres」，不限于 Supabase。

它的 `description` 要求在编写或修改数据库里的任何东西**之前**加载：创建或修改表和列（包括选择列类型）、模式设计、迁移与声明式模式文件、RLS 策略及其测试、索引、触发器、数据库函数、队列与定时任务（pg_cron、pgmq）、向量检索（pgvector）、恢复备份或导入数据；诊断慢查询、CPU 飙高、超时、执行计划、连接耗尽、锁、膨胀，或「数据被不该看到的用户看到」时也要加载。末尾还强调：这不只是性能指南，哪怕只改一列或只写一条查询，也需要这些规则。

规则分 8 个类别，按影响从关键（查询性能、连接管理）到增量（高级特性）排序。`references/` 目录下每条规则一个文件，带错误与正确的 SQL 对照和执行计划分析，例如连接池与连接上限、批量插入、N+1、分页、upsert、死锁预防、JSONB 索引、全文检索。

## 怎么安装

仓库 README 直接给出了单独安装这个技能的命令：

```bash
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

Claude Code 也可以走插件：先 `claude plugin marketplace add supabase/agent-skills`，再 `claude plugin install postgres-best-practices@supabase-agent-skills`。

仓库整体介绍和其他安装方式，详见本站《supabase/agent-skills 是什么、怎么安装：Supabase 官方 Agent Skills（Supabase 开发与 Postgres 最佳实践）》。

## 怎么用

- 「给订单表加一个按用户和时间查询的索引，并写迁移」。
- 「这条查询要 3 秒，帮我看 EXPLAIN 结果并优化」。
- 「给多租户表写 RLS 策略，再写测试验证租户之间互相看不到数据」。

## 适合谁 / 局限

适合后端与全栈开发者，无论数据库托管在 Supabase、云厂商还是自建。规则针对 Postgres，MySQL 等其他数据库不适用；它给的是通用最佳实践，具体到你的数据量和访问模式，仍要用真实的执行计划验证。

## 注意事项

- **许可**：MIT。
- **不执行脚本**：纯规则文档；但智能体依据它生成的迁移会改动数据库，**先在开发库或分支库上运行**，生产变更务必人工审查。
- skills.sh 当日榜单显示它是该库安装量更高的一个技能。

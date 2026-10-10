---
title: "supabase/agent-skills 是什么、怎么安装：Supabase 官方 Agent Skills（Supabase 开发与 Postgres 最佳实践）"
slug: supabase-agent-skills-postgres
name: supabase/agent-skills（Supabase 官方技能）
url: https://github.com/supabase/agent-skills
pricing: 开源免费（MIT）
platforms: Claude Code / GitHub Copilot / Cursor / Cline 等支持 Agent Skills 的智能体
trialNote: "npx skills add supabase/agent-skills"
products: [claude, github-copilot]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "supabase/agent-skills 是 Supabase 官方的 Agent Skills 仓库，只有两个技能：supabase 覆盖数据库、Auth、Edge Functions 等全线产品，supabase-postgres-best-practices 提供 Postgres 性能与安全规则。"
checkedOn: 2026-10-10
sources:
  - https://github.com/supabase/agent-skills
  - https://supabase.com/docs/guides/getting-started/ai-skills
  - https://github.com/vercel-labs/skills
  - https://code.claude.com/docs/en/discover-plugins
  - https://agentskills.io/home
---

> 本文根据 supabase/agent-skills 仓库 README、Supabase 官方文档的 AI Skills 页面和 Claude Code 官方文档整理，资料核对于 2026-10-10。

## 是什么

supabase/agent-skills 是 Supabase 官方维护的技能仓库，目的很单纯：让编程智能体在用 Supabase 和 Postgres 时写得更准。智能体常见的毛病是沿用旧版 SDK 写法、忘记开行级安全策略、建表不加索引，这个仓库把 Supabase 团队认可的做法写成技能，交给智能体在相关任务里参考。技能遵循 agentskills.io 的开放标准，结构是一个 `SKILL.md` 加可选的 `references/` 参考文件。

截至 2026-10-10，GitHub 显示该仓库 2705 Star、218 Fork，最近一次推送 2026-10-02。Star 数不算高，但它是 Supabase 官方出品，Supabase 文档站也有对应的安装说明页。

## 包含哪些 Skill

目前只有两个，贵精不贵多：

- **`supabase`**：综合技能，覆盖 Supabase 的各个产品和集成。适用场景包括：
  - 使用 Database、Auth、Edge Functions、Realtime、Storage、Vectors、Cron、Queues 任意一项；
  - 在 Next.js、React、SvelteKit、Astro、Remix 里用 supabase-js 和 `@supabase/ssr` 做服务端渲染集成；
  - 排查登录、会话、JWT、Cookie、行级安全（RLS）相关的问题；
  - 使用 Supabase CLI 或 MCP 服务器；
  - 做表结构变更、迁移、安全检查，或用 pg_graphql、pg_cron、pg_vector 等扩展。
- **`supabase-postgres-best-practices`**：Postgres 性能优化规则，分 8 类并按影响程度排序——查询性能、连接管理、安全与 RLS 排在最关键一档，其后是表结构设计、并发与锁、数据访问模式、监控诊断和高级特性。写 SQL、设计表、加索引、配连接池时都会用到，不用 Supabase 而只用 Postgres 的项目也适用。

## 怎么安装

**全部安装**（README 首选）：

```bash
npx skills add supabase/agent-skills
```

**只装其中一个**：

```bash
npx skills add supabase/agent-skills --skill supabase
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

**作为 Claude Code 插件安装**（在终端里执行）：

```bash
claude plugin marketplace add supabase/agent-skills
claude plugin install supabase@supabase-agent-skills
claude plugin install postgres-best-practices@supabase-agent-skills
```

第一条登记插件市场，后两条按需安装。更细的说明见 Supabase 文档的 AI Skills 页面。README 没有提供 claude.ai 上传 ZIP 或 Codex 专用的安装步骤，这两种情况可以用 `npx skills` 并选择对应的智能体。

## 怎么用

装好就生效，智能体识别到相关任务会自动调用。README 给的示例说法大意是：

- 「优化这条 Postgres 查询」；
- 「检查我的表结构有没有性能问题」；
- 「帮我在 Next.js 里接好 Supabase Auth」；
- 「给这张表加上合适的索引」。

实际使用时，把报错信息、表结构或慢查询的执行计划一起贴给智能体，规则才对得上号。在 Claude Code 里可以用 `/skills` 查看技能是否已加载。

## 适合谁 / 不适合谁

**适合：**
- 用 Supabase 做后端的独立开发者和小团队；
- 用 AI 写 SQL、设计表结构，想多一道 Postgres 规范把关的人；
- 被登录态、RLS 策略这类问题反复卡住的前端开发者。

**不适合：**
- 用 MySQL、MongoDB 等其他数据库的项目；
- 期待一大批现成工作流的人——这里只有两个知识型技能，不含自动化脚本套件。

## 注意事项

- **许可证**：MIT，仓库根目录有 LICENSE 文件。
- **维护状态**：最近一次推送 2026-10-02，按版本发布，仍在维护。
- **安全**：技能本身以说明和参考文档为主，但它会指导智能体使用 Supabase CLI 和 MCP 服务器，这意味着智能体可能对数据库执行迁移或改动。先在开发分支或测试项目上操作，生产库的变更要自己过目；不要把高权限的服务端密钥直接交给智能体。第三方改写的同名技能，安装前照例通读 `SKILL.md`。
- **兼容性**：README 称兼容 Claude Code、GitHub Copilot、Cursor、Cline 等十多种智能体，这是它自己的说法，具体以你所用工具对 Agent Skills 的支持情况为准。Supabase 产品更新快，规则与官方文档不一致时以文档为准。

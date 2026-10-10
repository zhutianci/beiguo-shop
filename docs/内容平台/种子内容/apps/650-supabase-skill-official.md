---
title: "supabase skill 是什么、怎么安装使用：Supabase 官方的全产品开发 Skill（Auth、RLS、Edge Functions、迁移）"
slug: supabase-skill-official
name: supabase（supabase/agent-skills）
url: https://github.com/supabase/agent-skills/tree/main/skills/supabase
pricing: "开源免费（MIT）；Supabase 项目按其套餐计费"
platforms: "Claude Code / GitHub Copilot / Cursor / Cline 等支持 Agent Skills 的智能体"
trialNote: "npx skills add supabase/agent-skills --skill supabase"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "supabase 是 Supabase 官方的综合 Skill：做任何涉及 Supabase 的任务时加载，要求先查更新日志和当前文档再动手，覆盖数据库、Auth、Edge Functions、Realtime、Storage、CLI 与 MCP、模式变更和排障。"
checkedOn: 2026-10-11
sources:
  - https://github.com/supabase/agent-skills/tree/main/skills/supabase
  - https://github.com/supabase/agent-skills
  - https://supabase.com/docs/guides/getting-started/ai-skills
  - https://supabase.com/changelog
---

> 本文根据 supabase/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 31.9 万次；所在仓库 supabase/agent-skills 在 GitHub 约 2708 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Supabase 迭代很快，函数签名、`config.toml` 的配置项、SSR 集成的写法隔几个月就变，模型凭训练记忆写的代码经常已经过时。supabase 技能的第一条核心原则就是针对这一点：**Supabase 变化频繁，实现之前先对照更新日志和当前文档核实**，不要依赖训练数据。做法是先抓取官网的 changelog 摘要索引，找与任务相关的破坏性变更标记，再去查对应文档。

`description` 的触发范围非常宽：任何涉及 Supabase 的任务。包括各产品（Database、Auth、Edge Functions、Realtime、Storage、Vectors、Cron、Queues）；客户端库与 SSR 集成（supabase-js、`@supabase/ssr`，在 Next.js、React、SvelteKit、Astro、Remix 中）；认证问题（登录登出、会话、JWT、Cookie、RLS）；Supabase CLI 与 MCP 服务器；模式变更、迁移、安全审计、Postgres 扩展；以及各种报错排查和日志查询。

第二条原则是「验证你的工作」。其余部分讲 CLI 与 MCP 服务器怎么用、文档怎么查、模式变更的两种做法（声明式模式与命令式迁移）以及调试方法。

## 怎么安装

仓库 README 直接给出了单独安装这个技能的命令：

```bash
npx skills add supabase/agent-skills --skill supabase
```

Claude Code 也可以走插件：先 `claude plugin marketplace add supabase/agent-skills`，再 `claude plugin install supabase@supabase-agent-skills`。

仓库整体介绍和其他安装方式，详见本站《supabase/agent-skills 是什么、怎么安装：Supabase 官方 Agent Skills（Supabase 开发与 Postgres 最佳实践）》。

## 怎么用

- 「给这个 Next.js 项目接入 Supabase Auth，用服务端渲染的方式处理会话」。
- 「用户反馈登录后偶尔被踢出，帮我排查」——它会查日志并对照当前文档里会话处理的写法。
- 「新增一张表并提交迁移」——按项目已有的方式（声明式或迁移文件）来做。

目录里另有反馈模板：技能鼓励你把它出错的地方反馈给 Supabase。

## 适合谁 / 局限

适合所有用 Supabase 做后端的开发者，与同库的 Postgres 最佳实践技能搭配使用效果最好：这个管平台用法，那个管数据库本身。它依赖联网查文档，离线环境里效果打折；不用 Supabase 的项目用不上。

## 注意事项

- **许可**：MIT。
- **会联网**：按设计要抓取官方更新日志和文档。
- **权限**：配合 Supabase CLI 或 MCP 服务器时，智能体能直接操作你的项目。给它开发环境的凭据，生产库的变更人工执行；不要把 service role 密钥贴进对话或提交进仓库。
- **费用**：技能免费，Supabase 资源用量按其套餐计。

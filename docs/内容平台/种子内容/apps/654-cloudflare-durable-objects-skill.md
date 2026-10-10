---
title: "durable-objects skill 是什么、怎么安装使用：Cloudflare 官方的 Durable Objects 开发 Skill（有状态与协调）"
slug: cloudflare-durable-objects-skill
name: durable-objects（cloudflare/skills）
url: https://github.com/cloudflare/skills/tree/main/skills/durable-objects
pricing: "开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费"
platforms: "Claude Code / Codex / Cursor / OpenCode / GitHub Copilot 等"
trialNote: "`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "durable-objects 是 Cloudflare 官方的 Durable Objects Skill：构建、调试或评审有持久状态与协调需求的代码时使用，讲清适用与不适用场景、关键规则、鉴权、存储操作、定时器和测试方法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/cloudflare/skills/tree/main/skills/durable-objects
  - https://github.com/cloudflare/skills
  - https://skills.sh/
---

> 本文根据 cloudflare/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.6 万次；所在仓库 cloudflare/skills 在 GitHub 约 3026 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Durable Objects 是 Cloudflare 平台上做「有状态」的核心积木：每个对象有自己的持久存储，同一个对象的请求串行处理，适合聊天房间、协作文档、限流计数、任务协调这类需要一致性的场景。它的编程模型和普通 Worker 很不一样，用错了要么丢数据要么成为瓶颈。durable-objects 技能是官方的开发指南。`description`：构建、调试或评审用于持久状态与协调的 Cloudflare Durable Objects 代码。

和同库其他技能一样，它先声明模型对相关 API 的了解可能过时，要优先检索，并列出官方文档、API 参考和最佳实践的地址。主体内容包括：

- **适合用它做什么 / 不要用它做什么**——两张清单，帮你先判断该不该上 Durable Objects；
- **Wrangler 配置**与基础代码模式；
- **关键规则**与**鉴权**；
- **反模式**（标注为「绝不要」的写法）；
- **Stub 的创建**、**存储操作**、**定时器（Alarms）**；
- **测试**。

`references/` 下有三份资料：规则、测试、与 Workers 的配合。

## 怎么安装

`durable-objects` 随 cloudflare/skills 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

Codex 用 `codex plugin marketplace add cloudflare/skills` 和 `codex plugin add cloudflare@cloudflare`。其他智能体用 `npx skills add https://github.com/cloudflare/skills`，在选择界面里勾选 `durable-objects`。

仓库整体介绍和其他安装方式，详见本站《cloudflare/skills 是什么、怎么安装：Cloudflare 官方 Agent Skills（Workers、Agents SDK、Durable Objects、Wrangler）》。

## 怎么用

- 「用 Durable Objects 做一个多人实时投票的房间，支持断线重连」。
- 「这个计数器在高并发下数值不对，帮我检查 Durable Object 的写法」。
- 「给这个对象加一个每小时清理过期数据的定时器，并写测试」。

## 适合谁 / 局限

适合要在 Cloudflare 上做实时协作、状态机、按实体隔离的数据这类功能的后端开发者。它不适合当通用数据库的替代品——技能自己的「不要用于」清单会提醒你这一点；涉及 AI 智能体的状态管理时，更上层的 `agents-sdk` 技能可能更合适。

## 注意事项

- **许可**：Apache-2.0。
- **费用**：Durable Objects 的计费规则以 Cloudflare 官网为准，设计不当（例如对象长期保持活跃）会放大成本。
- **不执行脚本**；会联网检索文档。
- 存储结构的变更要考虑已有对象里的旧数据，上线前在预览环境验证迁移。

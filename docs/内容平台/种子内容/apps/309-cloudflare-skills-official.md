---
title: "cloudflare/skills 是什么、怎么安装：Cloudflare 官方 Agent Skills（Workers、Agents SDK、Durable Objects、Wrangler）"
slug: cloudflare-skills-official
name: cloudflare/skills（Cloudflare 官方 Skills）
url: https://github.com/cloudflare/skills
pricing: 开源免费（Apache-2.0）
platforms: Claude Code / Codex / VS Code（GitHub Copilot）/ Cursor / OpenCode / Pi
trialNote: "`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "cloudflare/skills 是 Cloudflare 官方的 Agent Skills 仓库：Workers 最佳实践、Agents SDK、Durable Objects、Wrangler、Sandbox、邮件服务、网页性能等 16 个技能，插件方式还会一并装上 Cloudflare 的 MCP 服务器。"
checkedOn: 2026-10-10
sources:
  - https://github.com/cloudflare/skills
  - https://github.com/cloudflare/security-audit-skill
  - https://code.claude.com/docs/en/discover-plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://agentskills.io/home
---

> 本文根据 cloudflare/skills 与 cloudflare/security-audit-skill 两个仓库的 README，以及 Claude Code、Codex 官方文档整理，资料核对于 2026-10-10。技能清单以仓库 README 为准。

## 是什么

cloudflare/skills 是 Cloudflare 官方维护的技能仓库，教编程智能体在 Cloudflare 开发者平台上写代码：Workers、Agents SDK、Durable Objects 以及周边的存储、队列、邮件、安全产品。Cloudflare 的产品迭代快，模型训练数据里的写法常常过时，这些技能把当前推荐的做法和容易出错的地方写清楚，智能体聊到相关话题时自动加载。

它既是一组符合 Agent Skills 标准的技能，也是一个插件：在支持原生插件的工具里安装，会同时得到技能和 Cloudflare 的 MCP 服务器；只支持技能标准的工具可以单独装技能。

截至 2026-10-10，GitHub 显示该仓库 3022 Star、308 Fork，最近一次推送 2026-10-09。

## 包含哪些 Skill

README 的技能表共 16 个：

- `cloudflare`：总入口，帮智能体判断该用哪些 Cloudflare 产品，再去找对应技能和文档；
- `workers-best-practices`：编写、评审、配置生产环境的 Workers；
- `wrangler`：部署和管理 Workers、KV、R2、D1、Vectorize、Queues、Workflows；
- `agents-sdk`：构建带状态、定时任务、RPC、MCP 服务器、邮件和流式对话的 AI 智能体；
- `durable-objects`：有状态协调场景（聊天室、游戏、预订），含 RPC、SQLite、定时器、WebSocket；
- `sandbox-next`、`sandbox-stable`、`sandbox-migrate-to-next`：Sandbox 的预览版、稳定版和迁移；
- `nextjs-on-cloudflare`：用 vinext 把 Next.js 跑在 Workers 上；
- `basin`、`k2`：数据分析管线与持久化数据流；
- `cloudflare-email-service`：邮件发送、邮件路由与投递配置；
- `turnstile-spin`：搭建、修复或迁移 Turnstile 人机验证，包括服务端校验；
- `web-perf`：审计核心网页指标和阻塞渲染的资源；
- `cloudflare-one`、`cloudflare-one-migrations`：Cloudflare One 的设计、配置、排障，以及从其他零信任和 VPN 方案迁移过来的评估。

**另一个独立仓库 security-audit-skill**：Cloudflare 还单独开源了 cloudflare/security-audit-skill，用来让编程智能体给你自己的代码库做一次结构化安全审计——先梳理架构和信任边界，再分工排查，每条疑似问题交给另一个独立的子智能体尝试推翻，最后输出分「已确认 / 待验证 / 已排除」三种结论的报告。截至 2026-10-10 它约 2.7 万 Star、1625 Fork，MIT 许可，最近一次推送 2026-09-14；它不在 cloudflare/skills 的技能表里，要按它自己 README 的 `npx skills add` 命令单独安装，并且需要 Node.js 和支持并行子智能体的工具。

## 怎么安装

**Claude Code**（在会话里输入）：

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

**Codex**（终端里执行，装完开一个新会话）：

```sh
codex plugin marketplace add cloudflare/skills
codex plugin add cloudflare@cloudflare
```

**VS Code / GitHub Copilot**：在设置里打开 `chat.plugins.enabled`，从命令面板运行 Chat: Install Plugin From Source，填入仓库地址。

**Cursor**：从 Cursor Marketplace 安装，或在 Settings > Rules > Add Rule > Remote Rule (Github) 里填 `cloudflare/skills`。

**npx skills**（只装技能）：

```text
npx skills add https://github.com/cloudflare/skills
```

也可以克隆仓库后把技能文件夹复制到各工具的技能目录，README 列的是 Claude Code `~/.claude/skills/`、Cursor `~/.cursor/skills/`、OpenCode `~/.config/opencode/skills/`、OpenAI Codex `~/.codex/skills/`、Pi `~/.pi/agent/skills/`。其中 Codex 一项要留意：Codex 官方文档当前写的用户级目录是 `~/.agents/skills`，以官方文档为准。

## 怎么用

技能按对话内容自动触发，不用记名字。比如：

- 「我想做一个多人实时协作的白板，用 Cloudflare 该选哪些产品？」——先走 `cloudflare` 总入口，再加载 `durable-objects`；
- 「帮我把这个 Worker 部署上去，绑定一个 D1 数据库」——加载 `wrangler`；
- 「评审一下这段 Worker 代码能不能上生产」——加载 `workers-best-practices`。

通过插件安装的话，智能体还能经 MCP 服务器调用 Cloudflare API、查询最新开发文档。

## 适合谁 / 不适合谁

**适合：**
- 在 Workers 上开发应用或 AI 智能体的个人和团队；
- 正从别的平台迁到 Cloudflare、对产品选型不熟的人；
- 想在上线前给自己的仓库做一轮安全自查的维护者（配合 security-audit-skill）。

**不适合：**
- 业务不在 Cloudflare 上的项目；
- 只想了解概念的初学者——技能是写给干活的智能体看的，不是入门教程。

## 注意事项

- **许可证**：cloudflare/skills 为 Apache-2.0，security-audit-skill 为 MIT，两个仓库根目录都有 LICENSE 文件。
- **维护状态**：cloudflare/skills 最近一次推送 2026-10-09，更新活跃；清单里有预览版产品的技能，接口可能变动。
- **安全**：插件自带 Cloudflare 的远程 MCP 服务器，授权后智能体可以读写你账号下的资源；`wrangler` 技能会执行部署命令。先在测试账号或测试环境试，用权限最小的 API 令牌，部署和删除类操作逐条确认。安全审计技能只用于你有权审计的代码。
- **兼容性**：各工具的安装入口不同，按上面对应的方式来；`npx skills` 方式不含 MCP 服务器。

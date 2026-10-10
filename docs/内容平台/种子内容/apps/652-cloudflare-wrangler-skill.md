---
title: "wrangler skill 是什么、怎么安装使用：Cloudflare 官方的 Wrangler CLI Skill（本地开发、预览、部署）"
slug: cloudflare-wrangler-skill
name: wrangler（cloudflare/skills）
url: https://github.com/cloudflare/skills/tree/main/skills/wrangler
pricing: "开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费"
platforms: "Claude Code / Codex / Cursor / OpenCode / GitHub Copilot 等"
trialNote: "`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "wrangler 是 Cloudflare 官方的命令行 Skill：指导智能体运行和排查 Wrangler 命令、配置 Worker 项目，覆盖本地开发、Previews、部署与资源管理，要求按项目实际版本检索文档而不是凭记忆写命令。"
checkedOn: 2026-10-11
sources:
  - https://github.com/cloudflare/skills/tree/main/skills/wrangler
  - https://github.com/cloudflare/skills
  - https://skills.sh/
---

> 本文根据 cloudflare/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 11.3 万次；所在仓库 cloudflare/skills 在 GitHub 约 3026 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Wrangler 是 Cloudflare Workers 的命令行工具，版本更新频繁，参数和配置字段经常调整。模型凭记忆写出的 `wrangler` 命令或配置文件，经常对应的是一两个大版本以前的写法。wrangler 技能的核心要求只有一句：**使用项目自己的 Wrangler 版本，并在编写命令或配置之前检索相关文档**——命令行参数和配置字段会变，不要依赖背下来的例子。

`description`：运行或排查 Wrangler CLI 命令，并为本地开发、Previews、部署和 Cloudflare 资源管理配置 Worker 项目。

流程分五段：

- **检查项目**：找出包管理器、已安装的 Wrangler 版本、package 脚本、所用框架和现有的 Wrangler 配置；
- **检索任务所需的资料**；
- **应用改动**；
- **使用 Workers Previews**：为分支或改动创建预览环境；
- **验证**。

和总入口技能一样，它开头有个分流：项目里有 `cloudflare.config.ts`，或你要求使用新的 `cf` 命令行时，不使用这个技能，改按 Cloudflare CLI 的文档。

## 怎么安装

`wrangler` 随 cloudflare/skills 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

Codex 用 `codex plugin marketplace add cloudflare/skills` 和 `codex plugin add cloudflare@cloudflare`。其他智能体用 `npx skills add https://github.com/cloudflare/skills`，在选择界面里勾选 `wrangler`。

仓库整体介绍和其他安装方式，详见本站《cloudflare/skills 是什么、怎么安装：Cloudflare 官方 Agent Skills（Workers、Agents SDK、Durable Objects、Wrangler）》。

## 怎么用

- 「给这个 Worker 绑定一个 KV 命名空间和一个 R2 桶，更新配置」。
- 「本地 `wrangler dev` 起不来，报绑定找不到，帮我排查」。
- 「为这个 PR 创建一个预览部署并把地址给我」。

这个技能只有一份 SKILL.md，没有附带文件。

## 适合谁 / 局限

适合所有在 Workers 上开发的人，尤其是项目已经存在、需要智能体尊重现有配置和版本的情况。它不替代产品知识——Durable Objects、队列等的正确用法在各自的技能里；已迁移到新 `cf` 命令行的项目不适用。

## 注意事项

- **许可**：Apache-2.0。
- **会执行命令**：包括创建云端资源和部署，这些操作会作用于你真实的 Cloudflare 账号并可能计费；建议让它在执行部署、删除类命令前先停下来给你确认。
- **会联网检索文档**。
- 登录用 `wrangler login` 在浏览器里完成；用于自动化的 API 令牌按最小权限创建。

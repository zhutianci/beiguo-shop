---
title: "cloudflare skill 是什么、怎么安装使用：Cloudflare 官方的产品选型与开发总入口 Skill"
slug: cloudflare-skill-product-discovery
name: cloudflare（cloudflare/skills）
url: https://github.com/cloudflare/skills/tree/main/skills/cloudflare
pricing: "开源免费（Apache-2.0）；Cloudflare 资源按其套餐计费"
platforms: "Claude Code / Codex / Cursor / OpenCode / GitHub Copilot 等"
trialNote: "`/plugin marketplace add cloudflare/skills` 然后 `/plugin install cloudflare@cloudflare`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "cloudflare 是 Cloudflare 官方技能库的总入口 Skill：从你要做的事出发，帮你在 Workers、存储、AI、网络与安全等产品里选型，再加载对应产品的参考资料或专门技能去实现，附 200 多份参考文档。"
checkedOn: 2026-10-11
sources:
  - https://github.com/cloudflare/skills/tree/main/skills/cloudflare
  - https://github.com/cloudflare/skills
  - https://skills.sh/
---

> 本文根据 cloudflare/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 11.8 万次；所在仓库 cloudflare/skills 在 GitHub 约 3026 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Cloudflare 的产品目录已经很长：Workers、Pages、R2、D1、KV、Durable Objects、Queues、AI Gateway、Vectorize……想做一件事该用哪几个，连老用户都要查文档。cloudflare 技能是整个官方技能库的「前台」。`description`：为应用、API、AI 智能体、存储、网络和安全发现并选择 Cloudflare 产品；用于架构与产品选型，包括用户只描述了需求、没有点名产品的情况，然后找到相关技能或文档。

SKILL.md 的思路是从用户目标出发：先问「你想构建什么？」，推荐合适的产品组合，再去加载具体产品的技能或参考资料来实现。它开头有一个检查：项目里存在 `cloudflare.config.ts` 或用户要求使用新的 `cf` 命令行时，就不要再读 Wrangler 相关的指引，改按 Cloudflare CLI 的文档来。

这个技能最重的部分是 `references/` 目录——两百多个文件，按产品分文件夹（AI Gateway、AI Search、Analytics Engine 等），每个产品通常有概览、API、配置、模式和常见坑几份，只在用到时读取。

## 怎么安装

`cloudflare` 随 cloudflare/skills 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

Codex 用 `codex plugin marketplace add cloudflare/skills` 和 `codex plugin add cloudflare@cloudflare`。其他智能体用 `npx skills add https://github.com/cloudflare/skills`，在选择界面里勾选 `cloudflare`。

仓库整体介绍和其他安装方式，详见本站《cloudflare/skills 是什么、怎么安装：Cloudflare 官方 Agent Skills（Workers、Agents SDK、Durable Objects、Wrangler）》。

## 怎么用

- 「我想做一个带用户上传图片和全文搜索的小应用，全部跑在 Cloudflare 上，该用哪些产品？」
- 「给现有的 Worker 加一层缓存和限流」。
- 「把大模型调用统一走 AI Gateway，配置回退路由」。

涉及具体领域时，它会转交给同库的 `wrangler`、`durable-objects`、`agents-sdk` 等技能。

## 适合谁 / 局限

适合刚接触 Cloudflare 开发者平台、不清楚产品边界的人，也适合做架构选型时快速获得一份基于官方资料的方案。它推荐的自然都是 Cloudflare 自家产品，不会替你和其他云做中立比较；产品更新快，技能强调以检索到的当前文档为准。

## 注意事项

- **许可**：Apache-2.0。
- **费用**：技能免费；各产品的免费额度与计费以 Cloudflare 官网为准，本文不列数字。
- **参考文档量大**：按需加载，一次问太宽泛会读入很多文件。
- 实际部署需要你的 Cloudflare 账号授权，在自己的终端里登录，不要把 API 令牌贴进对话。

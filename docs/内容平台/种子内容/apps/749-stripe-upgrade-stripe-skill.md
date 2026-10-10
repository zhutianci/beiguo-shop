---
title: "upgrade-stripe skill 是什么、怎么安装使用：让智能体按清单升级 Stripe API 版本和 SDK"
slug: stripe-upgrade-stripe-skill
name: upgrade-stripe（stripe/ai）
url: https://github.com/stripe/ai/tree/main/skills/upgrade-stripe
pricing: "开源免费（MIT）；Stripe 支付服务按其费率计费"
platforms: "Claude Code / Codex / Cursor（插件）；其他智能体用 npx skills"
trialNote: "claude plugin install stripe@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "upgrade-stripe 是 Stripe 官方的升级技能：指导智能体选定目标 API 版本、核对项目里每一处版本设定，依次升级服务端 SDK、Webhook 端点、Stripe.js 和移动端 SDK，并用请求头先行测试新版本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/stripe/ai/tree/main/skills/upgrade-stripe
  - https://github.com/stripe/ai
  - https://skills.sh/
---

> 本文根据 stripe/ai 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.1 万次；所在仓库 stripe/ai 在 GitHub 约 1865 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Stripe 的 API 按日期发布版本，账户、SDK、每个 Webhook 端点各自可以钉在不同的版本上，升级时漏掉一处就可能出现「接口返回的结构变了，回调还是旧结构」这类问题。`description`：升级 Stripe API 版本、Webhook 端点、服务端 SDK、Stripe.js 和移动端 SDK 的指南。

SKILL.md 先讲**怎么确定目标版本**：你指定了就用你的；否则去 Stripe 文档查当前版本。技能里带了一个「兜底版本号」，同时写明它只是生成技能那天的快照——新的稳定版每月发布，快照超过一个月大概率已经过时，只在访问不了文档时使用，并且不许猜测更新的版本号。动手前要把目标版本和项目里每一处版本设定逐一对比：客户端配置、单次请求的覆盖、Webhook 端点；没有明确要求时不把任何一处往旧版本改，也不把稳定版改成预览版；没能联网核实就要如实说明「是否最新尚未确认」。

接着分章节解释：

- **版本机制与变更类型**；
- **服务端 SDK**：Ruby、Python、Node 这类动态类型语言可以在配置里覆盖 API 版本；Java、Go、.NET 这类强类型语言的 SDK 版本与 API 版本绑定，要选对应的 SDK 版本；
- **Stripe.js**：如何加载带版本的脚本、与 API 版本的配对、从 v3 迁移；
- **移动端 SDK**：iOS、Android、React Native 及其与后端的兼容；
- **Webhook**：区分快照事件和精简事件，后者的负载不带版本，换 API 版本时不用动。

最后是九步**升级清单**（看变更日志 → 看升级指南 → 更新 SDK → 改客户端里的版本参数 → 用 `Stripe-Version` 请求头测试 → 逐个检查事件接收端点 → 更新 Stripe.js → 更新移动端 SDK → 存储对象 ID 的字段留足长度）。

## 怎么安装

`upgrade-stripe` 随 Stripe 官方插件安装（命令来自仓库 README）：

```bash
claude plugin install stripe@claude-plugins-official
```

Codex 用 `codex plugin add stripe@openai-curated`，Cursor 里输入 `/add-plugin stripe`。其他智能体可以用 `npx skills add https://docs.stripe.com` 手动安装；README 提醒手动装的技能不会自动更新，需要时运行 `npx skills update -y`。

仓库整体介绍和其他安装方式，详见本站《stripe/ai 是什么、怎么安装：Stripe 官方 Agent Skills 与 MCP（让 Claude Code / Codex 按最新实践接入支付）》。

## 怎么用

- 「把这个项目的 Stripe 升级到当前最新的 API 版本，先列出所有钉了版本的地方」。
- 「只升级 Node SDK 的大版本，告诉我有哪些破坏性变更会影响现有代码」。
- 「检查我们的 Webhook 端点分别是什么版本，哪些需要跟着升」。

## 适合谁 / 局限

适合维护着一套跑了几年的 Stripe 集成的团队。局限：它给流程和注意点，具体哪些字段变了仍要对照官方变更日志；涉及支付的升级必须在沙盒里完整回归，智能体改完代码不等于升级完成。

## 注意事项

- **许可**：MIT。
- **在测试环境里升级和验证**，确认无误再动生产配置；Webhook 端点的版本改动会立刻影响回调负载。
- 不要让它凭印象填版本号，以它查到的官方页面为准。

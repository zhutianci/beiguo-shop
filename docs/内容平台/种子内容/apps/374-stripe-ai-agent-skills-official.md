---
title: "stripe/ai 是什么、怎么安装：Stripe 官方 Agent Skills 与 MCP（让 Claude Code / Codex 按最新实践接入支付）"
slug: stripe-ai-agent-skills-official
name: stripe/ai（Stripe 官方 Agent Skills 与 AI 工具）
url: https://github.com/stripe/ai
pricing: "开源免费（MIT）；Stripe 支付服务按其费率计费"
platforms: "Claude Code / Codex / Cursor / Grok Build（插件）；其他智能体用 npx skills"
trialNote: "claude plugin install stripe@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "stripe/ai 是 Stripe 官方的 AI 开发仓库：提供让智能体按最新最佳实践集成 Stripe 的 Agent Skills、托管在 mcp.stripe.com 的远程 MCP 服务器，以及把大模型用量接入 Stripe 计费的 SDK。"
checkedOn: 2026-10-11
sources:
  - https://github.com/stripe/ai
  - https://docs.stripe.com
  - https://skills.sh/
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 stripe/ai 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。

## 是什么

stripe/ai 是 Stripe 把「AI 与支付」相关工具放在一起的官方仓库，README 自称是在 Stripe 之上构建 AI 产品和业务的一站式入口。它包含三类东西：

- **Agent Skills**：给智能体的说明，帮助它在集成 Stripe 时使用最新的最佳实践，而不是凭旧记忆写已经不推荐的接口；
- **MCP 服务器**：Stripe 托管的远程 MCP 服务，地址是 `https://mcp.stripe.com`，客户端通过 OAuth 安全接入；
- **计费 SDK**：`@stripe/ai-sdk`（配合 Vercel 的 AI SDK）和 `@stripe/token-meter`（配合 OpenAI、Anthropic、Google Gemini 的原生 SDK），用来把大模型的 token 用量接到 Stripe 的计费体系里。

截至 2026-10-11，GitHub 显示该仓库约 1865 Star、353 Fork，最近一次推送在 2026-10-10。

## 包含哪些 Skill

README 没有逐个列出技能，只说明提供「一组帮助智能体使用最新最佳实践的技能」。从 skills.sh 当日榜单能看到该仓库下的三个：`stripe-best-practices`（集成最佳实践）、`upgrade-stripe`（升级 Stripe 版本）、`stripe-projects`。README 提到，官方插件除技能外还带有额外的智能体工具，并且会自动更新。

## 怎么安装

README 建议常见工具直接装官方插件：

```bash
claude plugin install stripe@claude-plugins-official
```

Codex 用 `codex plugin add stripe@openai-curated`；Cursor 在对话里输入 `/add-plugin stripe`；Grok Build 也有对应方式。

**手动安装**（其他智能体）：

```bash
npx skills add https://docs.stripe.com
```

README 提醒手动安装的技能不会自动更新，需要时运行 `npx skills update -y`。

## 怎么用

- 「给这个 SaaS 项目接入订阅付费，用 Stripe 当前推荐的方式」；
- 「把我们的 Stripe API 版本升级到最新，列出需要改的地方」；
- 「按 token 用量给用户计费，接到 Stripe 上」。

## 适合谁 / 不适合谁

**适合：** 面向海外用户、用 Stripe 收款的独立开发者和 SaaS 团队；做 AI 产品并想按用量计费的开发者。

**不适合：** 无法开通 Stripe 账户的主体（Stripe 对注册主体所在地区有要求，以其官网为准）；只做国内收款的项目。

## 注意事项

- **许可证**：MIT。
- **密钥安全**：Stripe 的密钥等同于资金操作权限。开发时只用测试模式的密钥，放在环境变量里；不要把正式环境的密钥交给智能体或贴进对话。MCP 的 OAuth 授权也要注意授予的范围。
- **支付逻辑要人审**：智能体写的扣款、退款、Webhook 验签代码上线前必须人工审查并在测试模式下完整走通。
- **费用**：技能和 SDK 免费，Stripe 的手续费以其官网为准，本文不列数字。
- 远程 MCP 服务器能读写你的 Stripe 账户数据，接入前确认用途。

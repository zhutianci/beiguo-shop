---
title: "stripe-best-practices skill 是什么、怎么安装使用：Stripe 官方的支付接入决策指南（给 Claude Code / Codex 用）"
slug: stripe-best-practices-skill
name: stripe-best-practices（stripe/ai）
url: https://github.com/stripe/ai/tree/main/skills/stripe-best-practices
pricing: "开源免费（MIT）；Stripe 支付服务按其费率计费"
platforms: "Claude Code / Codex / Cursor（插件）；其他智能体用 npx skills"
trialNote: "claude plugin install stripe@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "stripe-best-practices 是 Stripe 官方技能：帮智能体在接入支付时选对接口（Checkout Sessions、订阅、Connect、税务等），内置当前最新的 API 版本号和几条容易出错的硬规则，如不要把 Webhook 当成可选项。"
checkedOn: 2026-10-11
sources:
  - https://github.com/stripe/ai/tree/main/skills/stripe-best-practices
  - https://github.com/stripe/ai
  - https://skills.sh/
---

> 本文根据 stripe/ai 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.3 万次；所在仓库 stripe/ai 在 GitHub 约 1865 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

大模型写 Stripe 接入代码，常见的问题是照着几年前的教程写：用已经不推荐的接口、全局设置密钥、把发货逻辑写在支付成功的跳转页里。stripe-best-practices 由 Stripe 官方维护，用来把智能体拉回当前的推荐做法。`description`：在开发与测试环境规划、接口选择（Checkout Sessions 还是 PaymentIntents）、Connect 平台搭建、账单与订阅、税务、Treasury、从已弃用接口迁移以及安全实践（密钥管理、密钥权限、Webhook、OAuth）上指导 Stripe 集成决策；规划、构建、修改、测试或评审任何 Stripe 集成时使用。

SKILL.md 开头直接给出当前最新的 API 版本和各语言 SDK 的最新版本号，要求默认使用最新版；这部分随仓库更新。接着是几条默认立场：新集成用独立的沙盒环境而不是账户共用的测试模式；推荐受限密钥（`rk_` 前缀）而不是完整权限的密钥。

主体是一张**集成路由表**：一次性收款用 Checkout Sessions；需要内嵌的自定义表单用 Checkout Sessions 加 Payment Element；保存支付方式用 Setup Intents；平台与市场用 Accounts v2；订阅用 Billing 接口加 Checkout Sessions；税务合规用 Stripe Tax 加登记接口，等等。

然后是**关键规则**，例如：开启自动计税前先确认已有有效的税务登记，否则以为在收税其实没收；除线下终端外不要传 `payment_method_types`，让动态支付方式生效；不要把 Webhook 说成可选项，履约逻辑应放在 Webhook 处理函数里而不是成功页；初始化客户端实例来调用，不用已弃用的全局密钥写法。目录里有账单、Connect、支付、安全、税务、Treasury 六份参考。

## 怎么安装

`stripe-best-practices` 随 Stripe 官方插件安装（命令来自仓库 README）：

```bash
claude plugin install stripe@claude-plugins-official
```

Codex 用 `codex plugin add stripe@openai-curated`，Cursor 里输入 `/add-plugin stripe`。其他智能体可以用 `npx skills add https://docs.stripe.com` 手动安装；README 提醒手动装的技能不会自动更新，需要时运行 `npx skills update -y`。

仓库整体介绍和其他安装方式，详见本站《stripe/ai 是什么、怎么安装：Stripe 官方 Agent Skills 与 MCP（让 Claude Code / Codex 按最新实践接入支付）》。

## 怎么用

- 「给这个 SaaS 加按月订阅，带 14 天试用」——它会先按路由表选接口，再写代码。
- 「评审现有的支付代码，有没有用到已弃用的写法」。
- 「我们要做一个撮合平台，卖家收款、平台抽成，应该用什么方案」。

## 适合谁 / 局限

适合用 Stripe 收款的出海产品和独立开发者。局限：它是决策指引，不替代 Stripe 文档；合规、税务登记这类事需要你在 Stripe 后台和当地实际办理；Stripe 对开户地区和主体有要求，能否开通与技能无关。

## 注意事项

- **许可**：MIT；Stripe 服务按其费率收费。
- **涉及真实资金**：开发和测试一律在沙盒里进行，SKILL.md 也建议优先使用权限受限的密钥；不要把任何密钥贴进对话或提交到仓库。
- 技能里写的版本号是生成时的快照，以 Stripe 官方文档为准。

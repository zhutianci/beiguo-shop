---
title: "Zapier 是什么、怎么用：自动化平台里的 AI Agents、Copilot 与 MCP 功能和定价"
slug: zapier-ai-automation-agents
name: Zapier
url: https://zapier.com/
pricing: 免费+付费
platforms: 网页 / API / MCP
trialNote: Free 档每月 100 个任务，含基础版 Agents 与 MCP
products: [ai-tools]
models: []
topics: [ai-agent, office]
excerpt: "Zapier 是老牌的无代码自动化平台，用「触发—动作」把上千款应用连起来。近年加入了 Agents、Chatbots、Copilot 和 MCP 等 AI 功能，适合不写代码的人把重复工作自动化。"
checkedOn: 2026-10-11
sources:
  - https://zapier.com/pricing
  - https://zapier.com/
---

> 本文根据 Zapier 官网与定价页整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

Zapier 是一款无代码自动化平台。最基本的单位叫 Zap：一个「触发器」加若干「动作」，比如「表单收到新提交 → 在表格里加一行 → 给团队群发通知」。它的优势在于支持的应用数量多、配置门槛低，不需要自己部署任何东西。

在 AI 方面，Zapier 现在不只是「在流程里调用一下大模型」，而是提供了一组产品：

- **Agents**：用自然语言描述职责，让智能体跨应用完成任务；
- **Chatbots**：搭建面向客户或内部的聊天机器人；
- **Copilot**：用对话的方式帮你搭建和修改 Zap；
- **MCP**：让 Claude、ChatGPT 等 AI 客户端通过 MCP 调用 Zapier 连接的应用；
- **AI by Zapier**：在 Zap 里插入一步大模型处理（付费档提供）；
- **Tables / Forms**：配套的数据表和表单，表格支持 AI 字段。

## 怎么上手

1. 在 zapier.com 注册免费账号。
2. 新建一个 Zap，可以直接在 Copilot 里用一句话描述需求，让它生成草稿。
3. 选择触发应用并授权账号，再添加动作步骤，逐步测试。
4. 发布后在历史记录里查看每次运行的结果和报错。

可以这样描述给 Copilot：

```text
When a new row is added to my Google Sheet "Leads", summarize the "Notes" column with AI in one sentence and send it to the #sales channel in Slack.
```

## 免费与付费

官网定价页（美元，2026-10 查询）。付费档按每月任务量分档，下面是各档的起步价：

| 方案 | 年付折合每月 | 月付 | 起步任务量 |
| --- | --- | --- | --- |
| Free | 0 | 0 | 100 个/月 |
| Professional | 19.99 美元起 | 29.99 美元起 | 750 个/月 |
| Team | 69 美元起 | 103.50 美元起 | 2,000 个/月 |
| Enterprise | 联系销售 | — | 定制 |

AI 相关额度单独计算：Free 档 Agents 每月 400 次活动、含 2 个 Chatbot、Copilot 有每日消息上限；Professional 档 Agents 每月 1,500 次活动、Copilot 不限。Agents 与 Chatbots 的更高用量是独立的加购项，不从任务额度里扣。

## 适合谁 / 不适合谁

**适合：**
- 主要使用海外 SaaS（Google Workspace、Slack、HubSpot、Notion 等）的个人和团队；
- 不写代码、希望几分钟内搭好自动化的运营、销售和行政人员；
- 想让 AI 助手通过 MCP 操作自己常用应用的用户。

**不适合：**
- 主要用国内应用（飞书、钉钉、企业微信等）的团队，可连接的国内应用有限；
- 任务量很大又在意成本的场景，按任务计费会比自托管的 n8n 贵；
- 需要数据不出内网的企业。

## 注意事项

- **任务怎么算**：每个成功执行的动作步骤算一个任务，多步骤流程消耗更快；任务额度按月重置，年付也不累积。
- **授权范围**：Zap 和 Agent 会拿到你授权应用的访问权限，建议用专门的服务账号，并定期清理不用的连接。
- **AI 结果需抽查**：让 Agent 自动发邮件、改数据之前，先加人工确认步骤。
- **界面以英文为主**，支持的付款方式以官网结算页为准。

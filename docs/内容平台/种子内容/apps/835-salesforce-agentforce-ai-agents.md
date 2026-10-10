---
title: "Salesforce Agentforce 是什么、怎么收费：Salesforce 的企业级 AI 智能体平台"
slug: salesforce-agentforce-ai-agents
name: Agentforce
url: https://www.salesforce.com/agentforce/
pricing: 按用量或按用户付费（Salesforce Foundations 可免费开始）
platforms: 网页（Salesforce 平台内）/ Slack
trialNote: 官网称可通过 0 美元的 Salesforce Foundations 免费开始使用 Agentforce
products: [ai-tools]
models: []
topics: [ai-agent, marketing]
excerpt: "Agentforce 是 Salesforce 的企业 AI 智能体平台，用于在销售、客服等业务中部署自主处理任务的智能体，计费方式包括 Flex Credits 按动作计费、按对话计费和按用户的附加许可。"
checkedOn: 2026-10-11
sources:
  - https://www.salesforce.com/agentforce/pricing/
  - https://www.salesforce.com/agentforce/
---

> 本文根据 Salesforce 官网的 Agentforce 定价页整理，资料核对于 2026-10-11。这是一条面向企业用户的简介，计费规则复杂，以官网和销售报价为准。

## 是什么

Agentforce 是 Salesforce 推出的 AI 智能体平台，定价页的说法是：用灵活的定价，在整个业务范围内规模化部署 AI 驱动的智能体。和聊天机器人不同，这类智能体被设计成可以**执行动作**——查询订单、更新记录、创建工单——而不只是回答问题。它依托 Salesforce 里已有的客户数据和业务流程。

## 能做什么

定价页提到的组件：

- **Agentforce Builder、Prompt Builder、Agent Script**：搭建智能体所用的几个工具，定价页只列了名称，没有展开说明。
- **Agentforce Coworker**、**Agentforce Vibes**：同样只列了名称。
- **Agentforce Voice**：语音智能体，同样按 Flex Credits 计费，但每个动作的费率更高。
- **Digital Wallet**：近乎实时地查看 Agentforce 用量，带阈值提醒和用量趋势。
- 页面还提到 Slackbot 和 Agentforce Grid。

各组件的具体功能以官方文档为准。

## 怎么上手

1. 没有 Salesforce 的团队可以从 **Salesforce Foundations** 开始，官网标价 0 美元，并称可以用它免费上手 Agentforce，包含 Agentforce Builder、Prompt Builder、Agent Script 等。
2. 选一个范围明确的场景（例如订单状态查询）搭建第一个智能体。
3. 用测试数据验证它的动作是否符合预期，再接入真实渠道。
4. 通过 Digital Wallet 监控用量和花费。

## 免费与付费

定价页列出的计费方式（美元，2026-10 查询）：

- **Flex Credits**：每 10 万点 500 美元，按「动作」扣点。
- **Conversations**：每次对话 2 美元。
- **Agentforce User License**：5 美元/用户/月（需搭配 Flex Credits）。
- **Agentforce 附加许可**（销售、服务、现场服务与运营）：125 美元/用户/月；行业版附加许可 150 美元/用户/月。
- **Agentforce Max Editions**：550 美元/用户/月起，含附加许可与每个组织每年 275 万点 Flex Credits。

不同计费方式之间能否组合、适用哪些版本，定价页的常见问题里有限制说明，签约前务必与销售确认。

## 适合谁 / 不适合谁

**适合：** 已经深度使用 Salesforce、客服或销售流程标准化程度高的中大型企业；有专门的 Salesforce 管理员或实施伙伴的团队。

**不适合：** 个人用户和很小的团队；业务数据不在 Salesforce 里的公司；希望「开箱即用、无需配置」的场景——智能体的效果很依赖数据质量和流程设计。

## 注意事项

- 按动作和按对话计费的成本差别可能很大，先用小流量估算再放量。
- 让智能体拥有写入权限（改订单、退款等）之前，设置好审批和权限边界。
- 官方的产品与版本名称更新频繁，老资料里的叫法可能已经变化。

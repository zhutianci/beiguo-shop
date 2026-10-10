---
title: "Amazon Bedrock 是什么：AWS 上调用多家基础模型、搭建智能体的托管平台简介"
slug: amazon-bedrock-foundation-models
name: Amazon Bedrock
url: https://aws.amazon.com/bedrock/
pricing: 按量付费，以 AWS 官网为准
platforms: AWS 控制台 / API / SDK
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Amazon Bedrock 是 AWS 的生成式 AI 托管平台，在一个服务里提供来自多家公司的数百个基础模型，并配套 AgentCore、知识库、Guardrails 护栏、模型蒸馏和提示词缓存等能力。"
checkedOn: 2026-10-11
sources:
  - https://aws.amazon.com/bedrock/
  - https://aws.amazon.com/bedrock/pricing/
---

> 本文根据 AWS 官网的 Amazon Bedrock 产品页整理，资料核对于 2026-10-11。功能和价格变化快，以 AWS 官网为准。这是一款面向企业和开发者的云服务，本文只做简要介绍。

## 是什么

Amazon Bedrock 是亚马逊云科技（AWS）的生成式 AI 平台，官网的定位是「在生产规模上构建生成式 AI 应用和智能体」。它的核心价值是**用一个 AWS 账号、一套权限和账单体系，调用来自多家 AI 公司的基础模型**——产品页称可访问数百个模型，并提供评测工具按效果和成本对比。

对已经把业务放在 AWS 上的公司来说，用 Bedrock 调模型的好处主要不是便宜，而是合规和集成：数据留在自己的云环境里，权限、审计、网络隔离沿用现有的 AWS 体系。

## 主要能力

产品页列出的几类功能：

- **AgentCore**：用任意框架和模型构建、连接并优化智能体的一组服务。
- **智能体开发**：包括由 OpenAI 提供技术支持的 Amazon Bedrock Managed Agents。
- **定制**：Knowledge Bases（知识库 / RAG）、Bedrock Data Automation、提示词工程和微调。
- **Guardrails（护栏）**：拦截有害内容，并用自动推理检查来减少幻觉。
- **成本优化**：模型蒸馏、提示词缓存和智能提示词路由。
- **调用方式**：产品页说明支持实时和批量两种处理方式。

## 怎么上手

1. 注册 AWS 账号并登录控制台，进入 Amazon Bedrock。
2. 选择区域，在模型目录里查看可用模型（部分模型需要先申请或同意提供方条款）。
3. 在控制台的 Playground 里试用。
4. 通过 AWS SDK 或 Bedrock 的 API 在代码里调用，权限用 IAM 管理。

## 免费与付费

Bedrock 按用量计费，不同模型、不同调用方式的单价不同，详见 AWS 官方定价页。除了模型调用费，知识库、护栏、智能体运行等功能也各自计费，估算成本时要一并考虑。

## 适合谁 / 不适合谁

**适合：**
- 业务已经在 AWS 上、需要在统一的安全与合规框架内使用大模型的企业；
- 想在多家模型之间灵活切换、避免绑定单一厂商的技术团队；
- 需要把 RAG、护栏、智能体做成正式生产系统的开发者。

**不适合：**
- 个人用户和只想聊天的人；
- 不熟悉云服务（IAM、区域、配额）的初学者——上手门槛明显高于直接用模型厂商的 API；
- 没有 AWS 账号或所在地区无法使用相应服务的用户。

## 注意事项

- **模型可用性因区域而异**：同一个模型不是在所有区域都提供，新模型上线时间也可能晚于原厂。
- **配额**：新账号的调用配额通常较低，上生产前要提前申请提升。
- **账单要设告警**：智能体和知识库会间接产生多项费用，建议开启预算告警。
- **中国区说明**：AWS 中国区域与全球区域是分开运营的，可用的服务和模型不同，以对应区域的官方说明为准。

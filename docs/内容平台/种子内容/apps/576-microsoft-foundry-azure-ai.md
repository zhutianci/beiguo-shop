---
title: "Microsoft Foundry（原 Azure AI Foundry / Azure AI Studio）是什么：微软的 AI 应用与智能体开发平台"
slug: microsoft-foundry-azure-ai
name: Microsoft Foundry（原 Azure AI Foundry）
url: https://azure.microsoft.com/en-us/products/ai-foundry
pricing: 按量付费，以 Azure 官网为准
platforms: 网页门户 / API / SDK
trialNote: 官网说明无需 Azure 账号即可浏览探索，构建智能体需要 Azure 订阅
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Microsoft Foundry 是微软 Azure 上构建、接地和治理 AI 应用与智能体的统一平台，前身为 Azure AI Studio，可访问 11,000 多个模型，包含 Foundry Models、Agent Service、Foundry IQ 等组件。"
checkedOn: 2026-10-11
sources:
  - https://azure.microsoft.com/en-us/products/ai-foundry
  - https://learn.microsoft.com/en-us/azure/ai-foundry/
---

> 本文根据微软 Azure 官网的 Microsoft Foundry 产品页整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。这是一款面向企业和开发者的云服务，本文只做简要介绍。

## 是什么

Microsoft Foundry 是微软在 Azure 上的 AI 开发平台，官网的定义是「构建、接地并治理 AI 应用和智能体的统一平台」。名字改过几次：官网 FAQ 说明它的前身是 **Azure AI Studio**，之后以 Azure AI Foundry 的名字为人熟知，现在产品页的名称是 Microsoft Foundry——搜这几个名字找到的是同一条产品线。

如果你的公司用的是微软体系（Azure、Microsoft 365、Entra ID），Foundry 就是在这套体系里合规使用大模型的官方入口，其中也包括通过 Azure 提供的 OpenAI 模型。

## 主要组成

产品页列出的组件：

- **Foundry Models**：模型目录。官网称可访问 11,000 多个模型，提供方包括 OpenAI、Anthropic、Meta、Google、xAI 和 Hugging Face 等。
- **Foundry Agent Service**：创建并规模化运行智能体的服务。
- **Foundry Tools**：OCR、翻译、语音等现成的 AI 能力。
- **Foundry IQ**：让智能体基于企业自己的数据作答的「接地」能力。
- **Foundry Control Plane**：治理与监控，统一管理模型、智能体和策略。

## 怎么上手

1. 打开 Foundry 门户，可以先不登录 Azure 账号浏览模型目录。
2. 要真正构建和部署，需要有 Azure 订阅；在门户里创建项目和资源。
3. 从模型目录部署一个模型，在 Playground 里测试。
4. 用官方 SDK 或 REST API 接入应用；需要智能体时使用 Agent Service 配置工具和数据源。

## 免费与付费

官网的说法是「灵活的、按用量计费」：各项服务按各自的计费模型单独收费，可以用 Azure 定价计算器估算。浏览和探索门户不需要付费；模型调用、智能体运行、检索和存储等会产生费用。

## 适合谁 / 不适合谁

**适合：**
- 已经使用 Azure 和微软企业服务的公司；
- 需要在企业合规框架内调用 OpenAI 等模型、并统一做权限和审计的团队；
- 要把智能体做成可治理、可监控的正式系统的开发者。

**不适合：**
- 个人用户、学生的日常使用；
- 没有云平台经验的初学者，概念（订阅、资源组、部署、配额）较多；
- 只需要一个模型 API、不需要企业治理能力的小项目。

## 注意事项

- **名称与文档在迁移中**：很多文档和教程仍写 Azure AI Foundry 或 Azure AI Studio，门户入口和菜单以当前官网为准。
- **模型可用性看区域和订阅类型**：不是所有模型在所有区域都能部署，部分模型需要申请。
- **配额与限流**：新订阅的默认配额较低。
- **成本由多项组成**：除了 Token 费用，还有检索、存储、监控等费用，建议设置预算告警。
- **Azure 中国区域**与全球 Azure 是分开运营的，可用服务不同，以对应区域的官方说明为准。

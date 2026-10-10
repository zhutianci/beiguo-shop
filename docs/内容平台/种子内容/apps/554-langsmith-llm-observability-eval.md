---
title: "LangSmith 是什么、怎么用：LLM 应用的追踪、评测与部署平台及定价"
slug: langsmith-llm-observability-eval
name: LangSmith
url: https://www.langchain.com/langsmith
pricing: 免费+付费
platforms: 网页 / SDK / API / 企业可自托管
trialNote: Developer 档免费，含 1 个席位和每月最多 5,000 条基础追踪
products: [ai-tools]
models: []
topics: [coding, ai-agent, prompt-engineering]
excerpt: "LangSmith 是 LangChain 公司的 LLM 应用工程平台：记录每次调用的完整追踪，做线上线下评测、提示词管理和智能体部署。免费的 Developer 档每月含 5,000 条基础追踪。"
checkedOn: 2026-10-11
sources:
  - https://www.langchain.com/pricing
  - https://www.langchain.com/langsmith
---

> 本文根据 LangChain 官网的 LangSmith 介绍与定价页整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

LangSmith 是 LangChain 公司的商业平台，解决的是 LLM 应用上线之后最头疼的问题：**它为什么这样回答？改了提示词之后是变好还是变坏了？** 它把应用的每一次运行记录成一条「追踪」（trace），里面能看到每一步调用了什么模型、传了什么内容、用了多少 Token、花了多长时间。

需要澄清一点：LangSmith 并不要求你的应用必须用 LangChain 或 LangGraph 来写，通过 SDK 或 OpenTelemetry 也可以接入其他框架写的应用。

## 能做什么

官网定价页列出的能力：

- **可观测性**：追踪、监控和洞察，定位出错或变慢的环节。
- **评测**：线上与线下评测、标注队列，用数据集回归测试每次改动。
- **提示词**：Prompt Hub 与 Playground，管理版本、对比不同模型的输出。
- **部署**：把智能体部署上线（Plus 及以上可用 Deployment）。
- **其他**：页面还列出了 Engine、Sandboxes 和 LLM Gateway 等组件。

## 怎么上手

1. 在官网注册，创建 API Key。
2. 在应用的环境变量里配置 LangSmith 的密钥并开启追踪（具体变量名以官方文档为准）。
3. 运行一次你的应用，回到网页就能看到对应的追踪。
4. 把几条典型输入保存成数据集，写一个评测器，之后每次改提示词或换模型都跑一遍对比。

## 免费与付费

官网定价页（美元，2026-10 查询）：

| 方案 | 价格 | 主要内容 |
| --- | --- | --- |
| Developer | 0 美元/席位/月，超出按量付费 | 1 个席位，每月最多 5,000 条基础追踪，社区支持 |
| Plus | 39 美元/席位/月，超出按量付费 | 席位不限，每月最多 10,000 条基础追踪，可用 Deployment 与 Engine |
| Enterprise | 联系销售 | 自托管与混合部署、自定义 SSO、SLA |

席位费每月 1 日结算，追踪用量按月后付；Enterprise 按年预付。

## 适合谁 / 不适合谁

**适合：**
- 已经有 LLM 应用或智能体在跑、需要排查问题和持续优化的开发团队；
- 想把「改提示词」从凭感觉变成有评测数据支撑的人；
- 使用 LangChain / LangGraph 的团队，接入成本最低。

**不适合：**
- 只是用聊天工具、没有自己开发应用的用户；
- 数据完全不能出内网、又没有企业版预算的团队，可以考虑开源的自托管替代品；
- 还在做一次性演示的项目，暂时用不到完整的观测和评测。

## 注意事项

- **追踪里有真实数据**：用户输入、检索到的文档片段都会被记录，上线前配置好脱敏和数据保留期。
- **用量别超预期**：高流量应用的追踪数增长很快，可以设置采样率。
- **追踪分类型计费**：定价页用的是「基础追踪」的口径，延长保留等情况另计，以官网说明为准。
- **与 LangGraph 的关系**：LangGraph 是开源框架，LangSmith 是配套的商业平台，两者可以分开使用。

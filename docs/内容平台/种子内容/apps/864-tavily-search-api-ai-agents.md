---
title: "Tavily 是什么、怎么用、免费额度多少：给 AI 智能体用的联网搜索 API"
slug: tavily-search-api-ai-agents
name: Tavily
url: https://www.tavily.com/
pricing: 免费额度+按量付费
platforms: 云服务 API
trialNote: Researcher 档免费，每月 1,000 点 API 额度，无需信用卡
products: [ai-tools]
models: []
topics: [coding, ai-agent, research-data]
excerpt: "Tavily 自称「AI 智能体的网络访问层」，提供 Search、Extract、Crawl、Map 和 Research 接口，为大模型返回适合直接使用的搜索结果与网页内容，免费档每月 1,000 点。"
checkedOn: 2026-10-11
sources:
  - https://www.tavily.com/pricing
  - https://www.tavily.com/
verify:
  - "官网 Logo 显示「Tavily by Nebius」，页面未详述所有权；Project 档的价格抓取时显示异常，正文未写金额"
---

> 本文根据 Tavily 官网定价页整理，资料核对于 2026-10-11。接口与价格以官网和官方文档为准。

## 是什么

Tavily 是 Tavily Inc. 提供的搜索 API，官网的定位是「AI 智能体的网络访问层」。普通搜索引擎的结果是给人看的：十条蓝色链接加摘要。大模型需要的是另一种形式——经过筛选、带正文、可以直接放进上下文的内容。Tavily 就是为这个场景设计的，很多智能体框架的示例里都用它作为联网搜索工具。核对时官网 Logo 上带有「by Nebius」字样。

## 能做什么

定价页列出的接口：

- **Search**：快速返回相关的网络搜索结果。
- **Extract**：从指定网页提取干净、结构化的内容，供大模型使用。
- **Crawl**：从整个网站提取内容。
- **Map**：发现一个网站下的各个 URL。
- **Research**：一个用于深入网络调研的智能体，针对问题多轮搜索并汇总。

## 怎么上手

1. 在 tavily.com 注册，获取 API Key（免费档不需要信用卡）。
2. 按官方文档发起一次 Search 请求，查看返回的结构。
3. 在自己的智能体里把它注册为「联网搜索」工具，或使用所用框架自带的 Tavily 集成。
4. 需要读取具体网页全文时配合 Extract；做专题调研时试用 Research。

请求参数与 SDK 写法以官方文档为准。

## 免费与付费

定价页（美元，2026-10 查询）：

- **Researcher**：免费，每月 1,000 点 API 额度，无需信用卡。
- **Pay As You Go**：按量付费，每点 0.008 美元。
- **Project**：按月订阅，每月 4,000 点，速率限制更高；金额以官网为准。
- **Enterprise**：定制，含 SLA 和企业级安全与隐私条款。

额度在每月第一天重置。页面还提到学生可以免费使用，具体额度未写明。

## 适合谁 / 不适合谁

**适合：** 正在开发需要联网能力的智能体或聊天应用的开发者；做 RAG 时需要补充实时信息的团队；学习智能体框架、想用免费额度跑通示例的学生。

**不适合：** 不写代码、只想要一个 AI 搜索产品的普通用户（可以直接用 AI 搜索类应用）；主要搜索中文站内内容的场景（覆盖效果需自行测试）；对搜索结果来源需要完全可控的应用。

## 注意事项

- 搜索结果的质量决定了回答质量，关键事实仍要让模型给出来源并由人抽查。
- 网页内容可能含有诱导模型的文字，应当作不可信输入处理。
- 智能体陷入循环搜索时会快速消耗额度，记得设置调用次数上限。

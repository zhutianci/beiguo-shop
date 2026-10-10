---
title: "Cloudflare Workers AI 是什么、怎么用、免费额度多少：边缘网络上的无服务器模型推理"
slug: cloudflare-workers-ai-serverless-inference
name: Cloudflare Workers AI
url: https://developers.cloudflare.com/workers-ai/
pricing: 免费额度+按量付费
platforms: Cloudflare Workers / REST API
trialNote: 每天 10,000 Neurons 免费额度，Workers Free 与 Paid 方案都有
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Workers AI 让开发者在 Cloudflare 全球网络的无服务器 GPU 上运行开源模型，按 Neurons 计量，每天有 10,000 Neurons 免费额度，超出部分每 1,000 Neurons 0.011 美元。"
checkedOn: 2026-10-11
sources:
  - https://developers.cloudflare.com/workers-ai/
  - https://developers.cloudflare.com/workers-ai/platform/pricing/
---

> 本文根据 Cloudflare 官方文档的 Workers AI 概览页与定价页整理，资料核对于 2026-10-11。模型目录和价格会调整，以官方文档为准。

## 是什么

Workers AI 是 Cloudflare 提供的模型推理服务，文档的说法是：在 Cloudflare 的全球网络上，用无服务器 GPU 运行机器学习模型。你不需要自己租显卡、装驱动、管扩缩容，在 Worker 代码里或通过 API 调用即可，按实际用量付费。

## 能做什么

- **模型目录**：文档称提供 50 多个开源模型，覆盖文本生成、图像分类等任务，具体清单见官方模型页。
- **与 Cloudflare 其他产品搭配**，文档在同一页列出：
  - **AI Gateway**：给 AI 应用加缓存、限流、重试和模型回退，并观察调用情况；
  - **Vectorize**：向量数据库，用于语义搜索和给大模型做记忆；
  - **Workers / Pages**：部署无服务器应用与全栈站点；
  - **R2**（对象存储）、**D1**（无服务器 SQL 数据库）、**KV**（键值存储）、**Durable Objects**（强一致的协调与存储）。

也就是说，一个带检索增强的小应用，从模型、向量库到前端托管都可以在同一个平台里完成。

## 怎么上手

1. 注册 Cloudflare 账号（Workers Free 方案即可开始）。
2. 打开官方文档的「Get started」指南，按步骤创建并部署第一个 Workers AI 应用；指南同时介绍了通过 Workers 绑定和通过 REST API 两种调用方式。
3. 在模型目录里挑一个模型，先用小请求测试效果和消耗。
4. 需要观测和缓存时，再把请求接到 AI Gateway。

具体命令和代码以官方指南为准，这里不凭印象写。

## 免费与付费

定价页的说明（美元，2026-10 查询）：

- 计量单位是 **Neurons**，用来衡量一次请求所需的 GPU 计算量。
- **每天 10,000 Neurons 免费**，Workers Free 和 Workers Paid 方案都有。
- 超出免费额度后，**每 1,000 Neurons 0.011 美元**；只有 Workers Paid 方案可以超额使用并计费，Workers Free 用户想超过每日额度需要升级。
- 各模型每次调用折合多少 Neurons 不同，见定价页的模型价目表。

## 适合谁 / 不适合谁

**适合：** 已经在用 Cloudflare Workers / Pages 的开发者；想低成本给小项目加上文本、图像等 AI 功能的个人；希望推理离用户更近、延迟更低的应用。

**不适合：** 需要最新闭源旗舰模型的场景（这里以开源模型为主）；要自己微调并长期独占 GPU 的训练任务；不熟悉 Workers 开发模式又不想学的团队。

## 注意事项

- 免费额度按天计算，超出后未升级的账号会被限制，不要把它当作生产环境的保障。
- 不同模型的 Neurons 消耗差别很大，上线前先估算成本。
- 模型目录会增删，别在代码里写死已被标记为弃用的模型名。

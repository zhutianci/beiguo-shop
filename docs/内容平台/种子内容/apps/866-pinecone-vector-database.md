---
title: "Pinecone 是什么、怎么用、免费版限制：全托管的向量数据库"
slug: pinecone-vector-database
name: Pinecone
url: https://www.pinecone.io/
pricing: 免费+按量付费
platforms: 云服务（AWS / Azure / GCP）
trialNote: Starter 档免费，含 5 个索引、2GB 存储，限 us-east-1 区域
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Pinecone 是面向 AI 应用的全托管向量数据库，提供按需的无服务器索引、内置嵌入与重排模型的 Inference，以及用于搭建问答和智能体应用的 Assistant。"
checkedOn: 2026-10-11
sources:
  - https://www.pinecone.io/pricing/
  - https://www.pinecone.io/
---

> 本文根据 Pinecone 官网定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Pinecone 是一款全托管的向量数据库，官网的定位是「面向 AI 应用的数据库」。做知识库问答（RAG）、语义搜索、推荐时，需要把文本变成向量并按相似度检索；Pinecone 提供的就是这层存储与检索服务，而且不用自己运维——没有服务器要管，按用量付费。

## 能做什么

定价页列出的产品与功能：

- **On-Demand 无服务器索引**：按读写用量和存储计费的向量索引，是大多数用户的起点。
- **Dedicated Read Nodes（DRN）**：为读取负载配置的专属节点，适合查询量稳定且很大的场景。
- **Inference**：平台托管的嵌入模型和重排（rerank）模型，不必另找模型服务。
- **Assistant**：用于构建对话和智能体应用的上层服务，上传文档后即可问答。
- **Bring Your Own Cloud（BYOC）**：部署在你自己的云账号里，需联系销售。
- **Nexus**：页面列出的产品名，细节以官网为准。

云平台支持 AWS、Azure 和 GCP。

## 怎么上手

1. 在 pinecone.io 注册，Starter 档免费。
2. 在控制台创建一个无服务器索引，按所用嵌入模型选择向量维度。
3. 按官方文档安装客户端，把文档切块、生成向量后写入索引。
4. 查询时把问题转成向量，取回最相似的若干条，再交给大模型生成回答。
5. 想省去自己搭流程的话，试试 Assistant。

## 免费与付费

定价页（美元，2026-10 查询）：

| 方案 | 价格 | 要点 |
| --- | --- | --- |
| Starter | 免费 | 5 个索引、2GB 存储、每月 200 万写入单位与 100 万读取单位、1 个项目、最多 2 位用户；每月 500 万嵌入 token；仅 us-east-1 |
| Builder | 20 美元/月（固定） | 可用全部区域 |
| Standard | 每月最低消费 50 美元，之后按量 | 3 周试用并送 300 美元额度 |
| Enterprise | 每月最低消费 500 美元，之后按量 | 更高支持等级 |

## 适合谁 / 不适合谁

**适合：** 想快速上线 RAG 或语义搜索、不愿自己运维数据库的团队；数据量和查询量波动大的应用；做原型的个人开发者（免费档够用）。

**不适合：** 要求数据完全留在自有机房的组织（可考虑开源的自托管向量库，或评估 BYOC）；已经在用 Postgres 并且数据规模不大的项目（pgvector 可能更简单）；不写代码的用户。

## 注意事项

- 免费档只能使用美国区域，面向国内用户的应用要考虑网络延迟与数据合规。
- 费用由读写单位和存储共同决定，批量导入和高频查询前先估算。
- 更换嵌入模型需要重建索引，选型时尽量一次定好。

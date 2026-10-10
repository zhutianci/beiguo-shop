---
title: "Supabase AI & Vectors 是什么、怎么用：用 Postgres 和 pgvector 做向量检索与 RAG"
slug: supabase-ai-vectors-pgvector
name: Supabase AI & Vectors
url: https://supabase.com/docs/guides/ai
pricing: 随 Supabase 项目提供（价格以官网为准）
platforms: 云服务 / 可自托管（开源）
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Supabase AI & Vectors 是基于 Postgres 和 pgvector 的开源工具集，用于存储、索引和查询向量嵌入，支持语义、关键词与混合搜索，并与 OpenAI、Hugging Face、LangChain、LlamaIndex 等集成。"
checkedOn: 2026-10-11
sources:
  - https://supabase.com/docs/guides/ai
---

> 本文根据 Supabase 官方文档的「AI & Vectors」概览页整理，资料核对于 2026-10-11。具体用法与价格以官方文档和定价页为准。

## 是什么

Supabase 是一个以 Postgres 数据库为核心的开源后端平台。**AI & Vectors** 是它面向 AI 应用的部分，官方文档的定义是：一个使用 Postgres 和 pgvector 开发 AI 应用的开源工具集，用来配合 Supabase 的客户端库，大规模地存储、索引和查询向量嵌入。

通俗地说：做「知识库问答」（RAG）需要一个向量数据库，而 Supabase 的思路是不必另起一套系统，直接在你已有的 Postgres 里存向量，和业务数据放在一起、用同一套权限。

## 能做什么

文档列出的组成部分：

- **pgvector 向量存储**：在 Postgres 里保存和检索嵌入向量。
- **Python 客户端（vecs）**：管理非结构化的嵌入数据。
- **数据库迁移**：用常规的表结构和迁移来管理结构化的嵌入。
- **嵌入生成**：在 Edge Functions 里直接运行开源模型来生成嵌入。
- **三种搜索方式**：语义搜索、关键词搜索，以及两者结合的混合搜索。

文档给出的示例包括：无界面的向量搜索（Headless Vector Search）、用 OpenAI CLIP 做图片搜索、Hugging Face 图片描述、在 Edge Functions 里调用 OpenAI 补全、Next.js 加 OpenAI 的文档搜索等。

列出的集成有 OpenAI、Amazon Bedrock、Hugging Face、LangChain 和 LlamaIndex。

## 怎么上手

1. 在 supabase.com 创建项目（或自托管一套 Supabase）。
2. 按文档启用 pgvector，建一张带向量列的表。
3. 把文档切块，调用嵌入模型生成向量后写入表中；文档里有「生成文本嵌入」的分步指南。
4. 查询时把用户问题同样转成向量，按相似度取回最相关的若干片段，再连同问题一起交给大模型回答。
5. 数据量增大后，按文档为向量列建立索引，并根据需要改用混合搜索。

具体的 SQL 语句与代码以官方文档为准，这里不凭印象抄写。

## 免费与付费

AI & Vectors 概览页没有单独的价格说明——它是 Supabase 数据库能力的一部分，费用取决于你的 Supabase 项目方案和用量；嵌入模型与大模型的调用费由对应厂商另计。Supabase 各方案的价格请查看官网定价页。

## 适合谁 / 不适合谁

**适合：** 已经在用 Supabase 或 Postgres 的全栈开发者；希望向量数据与业务数据、行级权限放在一起的项目；想用开源、可自托管方案的团队。

**不适合：** 不写代码、想要现成知识库产品的用户（可以看 Dify、FastGPT 这类平台）；向量规模极大、需要专用向量引擎极限性能的场景；不熟悉 SQL 的初学者。

## 注意事项

- 更换嵌入模型后向量维度可能不同，旧数据需要重新生成。
- 向量表也要配置行级安全策略，避免检索到用户无权查看的内容。
- 索引参数会影响召回率和速度，上线前用真实数据测一测。

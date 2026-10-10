---
title: "Weaviate 是什么、怎么用：自带混合检索与 RAG 的开源向量数据库"
slug: weaviate-vector-database-hybrid-search
name: Weaviate
url: https://github.com/weaviate/weaviate
pricing: 开源（BSD-3-Clause 为主）/ Weaviate Cloud 另计
platforms: Docker 自托管 / Weaviate Cloud / Python 等客户端
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Weaviate 是用 Go 编写的云原生开源向量数据库，同时存储对象与向量，内置 BM25 关键词检索、混合检索、图片检索、生成式检索（RAG）和重排，可在导入时自动向量化。"
checkedOn: 2026-10-11
sources:
  - https://github.com/weaviate/weaviate
verify:
  - "README 写明仓库大部分为 BSD-3-Clause，wl/ 目录为商业许可、企业功能需要许可证密钥"
---

> 本文根据 Weaviate 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Weaviate 的自我介绍是：云原生的向量数据库，同时存储对象和向量，实现大规模的语义搜索。「同时存对象和向量」意味着你不必把原始数据放在别处——文档内容、属性字段和它的向量都在同一条记录里，检索时可以一边按语义找、一边按字段过滤。它用 Go 语言编写，仓库约有 1.69 万星标。

## 能做什么

README 列出的特性：

- **向量检索 + 关键词过滤**：在相似度搜索的同时按属性筛选。
- **内置多种检索方式**：BM25 关键词检索、混合检索和图片检索。
- **生成式检索（RAG）与重排**：在同一个查询接口里完成「检索—重排—交给大模型生成」。
- **导入时自动向量化**：通过集成的模型服务商在写入时生成向量，也可以传入自己算好的嵌入。
- **生产特性**：多租户、副本复制、水平扩展、基于角色的访问控制。
- **节省资源**：向量压缩以降低内存占用；可为集合设置对象的存活时间（TTL）。

## 怎么上手

README 给出的快速开始：用它提供的 `docker-compose.yml`（其中同时启动 Weaviate 和一个 Model2Vec 嵌入服务）在本机运行：

```bash
docker compose up -d
pip install -U weaviate-client
```

之后用 Python 客户端连接本地实例，创建集合、导入数据并查询。具体的客户端代码见官方文档的 Quickstart。

不想自己部署的话，README 把 **Weaviate Cloud** 列为另一种安装方式，有对应的快速入门和控制台。

## 免费与付费

- 开源版本可以免费自托管。README 说明仓库大部分代码采用 BSD-3-Clause 许可，其中 `wl/` 目录为商业许可，企业功能需要许可证密钥。
- Weaviate Cloud 的价格 README 没有写，以官网为准。
- 自动向量化如果使用第三方模型服务，费用由对应厂商收取。

## 适合谁 / 不适合谁

**适合：** 需要「语义 + 关键词」混合检索的搜索和 RAG 应用；希望检索、重排、生成在一个系统里完成的团队；有多租户需求的 SaaS 产品。

**不适合：** 只想在本机试几行代码的初学者（更轻的嵌入式方案上手更快）；不熟悉 Docker 的用户；已经在用 Postgres 且规模不大的项目。

## 注意事项

- 自托管时注意开启认证与访问控制，不要让实例裸露在公网。
- 企业功能与开源部分的许可不同，商用前确认所用功能属于哪一部分。
- 混合检索中关键词与向量的权重需要按自己的数据调试。

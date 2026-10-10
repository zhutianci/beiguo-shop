---
title: "Milvus 是什么、怎么用：面向大规模数据的开源向量数据库（含 Milvus Lite 与 Zilliz Cloud）"
slug: milvus-open-source-vector-database
name: Milvus
url: https://github.com/milvus-io/milvus
pricing: 开源免费（Apache-2.0）/ Zilliz Cloud 托管另计
platforms: Python SDK / Milvus Lite 本地文件 / Kubernetes 分布式部署 / 云托管
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Milvus 是 Apache-2.0 许可的高性能开源向量数据库，隶属 LF AI & Data 基金会，支持 HNSW、IVF、DiskANN 等索引与 GPU 加速、BM25 全文与混合检索，可从本地的 Milvus Lite 平滑扩展到分布式集群。"
checkedOn: 2026-10-11
sources:
  - https://github.com/milvus-io/milvus
---

> 本文根据 Milvus 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Milvus 是一个「为规模而生的高性能向量数据库」（README 原话），用来组织和检索文本、图片、多模态内容等非结构化数据。它是 LF AI & Data 基金会旗下的项目，主要贡献者是 Zilliz 公司。仓库约有 4.63 万星标，采用 Apache-2.0 许可。在需要处理上亿条向量的场景里，Milvus 是常被提到的选择之一。

## 能做什么

README 列出的特性：

- **分布式架构**：原生支持 Kubernetes，可以水平扩展。
- **丰富的索引类型**：HNSW、IVF、FLAT、SCANN、DiskANN，并支持 GPU 索引。
- **全文与混合检索**：内置 BM25 全文检索，可把稀疏向量与稠密向量结合做混合检索。
- **多租户与冷热存储**：按租户隔离数据，把不常用的数据放到更便宜的存储上。
- **安全**：强制认证、TLS 加密和基于角色的访问控制。

## 怎么上手

README 给出的安装方式：

```bash
pip install -U pymilvus
```

最轻量的起步方式是 **Milvus Lite**：安装 `pymilvus[milvus-lite]` 后，在 Python 里用一个本地文件作为数据库：

```python
client = MilvusClient("milvus_demo.db")
```

这样不需要启动任何服务就能建集合、插入向量、做检索，适合学习和原型。数据量上来之后，再按官方文档部署单机版或 Kubernetes 上的分布式集群，应用代码的接口基本不变。

不想自己运维的话，可以使用 **Zilliz Cloud**——README 介绍它提供 Serverless、Dedicated 和 BYOC（部署在自己的云账号）几种形态，可免费注册。

## 免费与付费

Milvus 本身开源免费，自托管的成本是服务器和运维人力。Zilliz Cloud 是商业托管服务，价格以其官网为准。

## 适合谁 / 不适合谁

**适合：** 向量规模大（千万到十亿级）、对检索性能和可扩展性有要求的团队；需要私有化部署向量库的企业；想从本地原型一路扩展到生产集群、不愿中途换库的项目。

**不适合：** 数据量很小的个人项目（Milvus Lite 可以用，但 pgvector、Chroma 这类更轻的方案也够）；没有运维能力又不打算用托管服务的小团队；不写代码的用户。

## 注意事项

- 分布式部署组件较多，上生产前要规划好存储、监控和备份。
- 索引类型和参数对召回率、延迟、内存占用影响很大，用真实数据做基准测试再定。
- 嵌入模型一旦更换，原有向量需要重新生成并重建索引。

---
title: "Chroma（ChromaDB）是什么、怎么用：几行代码就能跑起来的开源向量数据库"
slug: chroma-open-source-vector-database
name: Chroma
url: https://github.com/chroma-core/chroma
pricing: 开源免费（Apache-2.0）/ Chroma Cloud 另计
platforms: Python / JavaScript / 客户端-服务器部署 / 云服务
trialNote: Chroma Cloud 提供 5 美元免费额度
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Chroma 是 Apache-2.0 许可的开源向量数据库，自称「面向 AI 的开源数据基础设施」，核心 API 只有四个函数，可自动完成分词、嵌入和索引，支持内存、持久化与客户端-服务器模式。"
checkedOn: 2026-10-11
sources:
  - https://github.com/chroma-core/chroma
---

> 本文根据 Chroma 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Chroma（很多教程里叫 ChromaDB）是一个开源向量数据库，README 称它是「面向 AI 的开源数据基础设施」，仓库简介写的是「AI 的搜索基础设施」。在各种 RAG 入门教程里它出镜率很高，原因是上手门槛低：装一个 Python 包，不用起任何服务，就能在本机存向量、做相似度检索。仓库约有 2.95 万星标，采用 Apache 2.0 许可。

## 能做什么

README 列出的特性：

- **极简的核心 API**：只有四个函数——创建集合、添加文档、查询、按 ID 获取。
- **自动处理嵌入**：直接把文本交给它，它会自动分词、生成嵌入并建立索引；也可以传入自己算好的向量。
- **过滤查询**：按元数据过滤，也可以按文档内容过滤。
- **多种运行模式**：做原型时用内存模式，需要保存时开启持久化，多人或多服务共用时用客户端-服务器模式。
- **Chroma Cloud**：官方托管服务，提供无服务器的向量检索、混合检索和全文检索。

## 怎么上手

README 给出的命令：

```bash
pip install chromadb                    # Python 客户端
npm install chromadb                    # JavaScript
chroma run --path /chroma_db_path       # 客户端-服务器模式
```

基本流程是：创建一个集合，把文档（连同可选的元数据和 ID）添加进去，再用一段查询文本取回最相似的若干条。四个函数的具体写法见官方文档的入门示例。

想直接用托管版，README 称在 Chroma Cloud 上不到 30 秒就能建好数据库并开始试用。

## 免费与付费

开源版本免费，可在本机或自己的服务器上运行。Chroma Cloud 提供 5 美元的免费额度，之后的计费方式以官网为准。使用默认嵌入模型之外的服务（如各家的嵌入 API）时，费用由对应厂商收取。

## 适合谁 / 不适合谁

**适合：** 学习 RAG、想在笔记本电脑上快速跑通示例的初学者；数据量不大的个人项目和内部工具；需要把向量库嵌进应用进程的开发者。

**不适合：** 不写代码的用户；需要多副本高可用、数据量极大的生产系统（应评估 Chroma Cloud 或其他分布式方案）；已有 Postgres 并希望少维护一个组件的团队。

## 注意事项

- 内存模式下数据在进程结束后就没了，正式使用要开启持久化并做好备份。
- 更换嵌入模型后，旧向量和新向量不能混在同一个集合里检索。
- 以客户端-服务器模式部署时，自己负责访问控制，不要把端口直接开放到公网。

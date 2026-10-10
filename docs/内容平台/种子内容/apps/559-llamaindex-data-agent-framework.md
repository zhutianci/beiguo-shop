---
title: "LlamaIndex 是什么、和 LangChain 有什么区别：面向私有数据的 RAG 与智能体开发框架入门"
slug: llamaindex-data-agent-framework
name: LlamaIndex
url: https://www.llamaindex.ai/
pricing: 开源免费（MIT）/ 商业产品另计
platforms: Python 库（另有 TypeScript 版本）
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "LlamaIndex 是 MIT 许可的开源框架，用于把大模型和你自己的数据连接起来构建智能体应用：数据连接器、索引、检索器、查询引擎、智能体和 Workflows，同名公司另有 LlamaParse 等商业产品。"
checkedOn: 2026-10-11
sources:
  - https://github.com/run-llama/llama_index
  - https://www.llamaindex.ai/
---

> 本文根据 LlamaIndex 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

LlamaIndex 是一个开源的开发框架，由同名公司 LlamaIndex 开发，仓库 run-llama/llama_index 约有 5.25 万星标，采用 MIT 许可。README 现在的定位是「构建智能体应用的框架」，而它最初出名、至今最擅长的事情是 **RAG（检索增强生成）**：让大模型基于你自己的文档、数据库、知识库来回答问题。

## 核心组件

README 列出的几类模块，正好对应一条 RAG 流水线：

- **数据连接器（Data connectors）**：从 PDF、网页、数据库、各类 SaaS 里把数据读进来；
- **索引（Indexes）**：把数据组织成便于检索的结构，最常见的是向量索引；
- **检索器（Retrievers）**：根据问题找出相关片段；
- **查询引擎（Query engines）**：把检索到的内容和问题一起交给模型生成答案；
- **智能体（Agents）**：让模型自主决定调用哪些工具和数据源；
- **Workflows**：用事件驱动的方式编排多步骤、多智能体的流程。

## 和 LangChain 的区别

这是搜索里最常见的问题。简单的区分方式：

- **LlamaIndex 从「数据」出发**：在文档解析、切分、索引和检索策略上提供的现成方案更多、更细；
- **LangChain / LangGraph 从「流程」出发**：在通用的组件拼装、有状态的智能体编排上更突出。

两者并不互斥，功能有相当多的重叠，也可以混用。主要做知识库问答的，可以先看 LlamaIndex；主要做复杂智能体流程的，可以先看 LangGraph。

## 怎么上手

```bash
pip install llama-index
```

这是包含常用集成的入门包；想自己挑选集成，可以只装 `llama-index-core` 再按需安装模型和向量库的集成包。

学习路径建议：

1. 跑通官方的入门示例：读取一个文件夹里的文档 → 建向量索引 → 提问；
2. 换成自己的文档，观察回答引用了哪些片段；
3. 调整切分大小、检索条数，体会它们对答案质量的影响；
4. 再学习智能体和 Workflows。

## 免费与付费

- **开源框架**：免费，MIT 许可。
- **商业产品**：README 提到 LlamaParse（面向文档解析、提取、索引和切分的文档智能体平台）和 LlamaAgents，属于公司的付费服务，价格以官网为准。
- **模型与向量数据库的费用**自理。

## 适合谁 / 不适合谁

**适合：**
- 会 Python、要做知识库问答或文档类智能体的开发者；
- 需要深入调优检索效果的团队；
- 想系统理解 RAG 各个环节的学习者。

**不适合：**
- 不写代码的用户，Dify、FastGPT、RAGFlow 等带界面的平台更合适；
- 一次性的小需求，直接把文档丢给聊天助手更快；
- 追求接口长期稳定的团队需要注意它的版本迭代较快。

## 注意事项

- **包结构拆得很细**：核心包和各类集成包分开安装，照着旧教程导入时常遇到模块找不到的问题，以当前官方文档为准。
- **默认配置只是起点**：切分方式和检索参数要根据自己的文档调。
- **解析质量决定上限**：扫描件、复杂表格需要专门的解析方案。
- **数据外发**：建索引时会把文档内容发给向量模型服务，敏感数据可以改用本地模型。

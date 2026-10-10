---
title: "LangGraph 是什么：有状态 AI 智能体编排框架的入门教程与适用场景"
slug: langgraph-stateful-agent-framework
name: LangGraph
url: https://www.langchain.com/langgraph
pricing: 开源免费（MIT）/ 部署平台另计
platforms: Python 库 / JavaScript 库
products: [ai-tools]
models: []
topics: [ai-agent, coding]
excerpt: "LangGraph 是 LangChain 团队开源的底层智能体编排框架，用「图」来描述长时间运行、有状态的 Agent，自带持久化执行、人工介入和记忆能力，采用 MIT 许可。"
checkedOn: 2026-10-11
sources:
  - https://github.com/langchain-ai/langgraph
  - https://docs.langchain.com/oss/python/langgraph/overview
---

> 本文根据 LangGraph 官方 GitHub 仓库 README 与官方文档整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

LangGraph 是 LangChain 团队维护的开源框架，仓库 langchain-ai/langgraph 约有 4.3 万星标，MIT 许可。README 给它的定义是：用于构建、管理和部署**长时间运行、有状态的智能体**的底层编排框架。

「底层」是关键词。它不替你决定智能体长什么样，而是给你一套搭积木的基本件：把流程画成一张图，节点是一步操作（调模型、调工具、跑一段函数），边决定下一步去哪，所有节点共享一份可持久化的状态。

## 核心能力

README 列出的三项主要好处：

- **持久化执行（Durable execution）**：智能体中途失败后可以从断点恢复，而不是从头再来，适合跑几分钟到几天的长任务。
- **人工介入（Human-in-the-loop）**：执行过程中可以暂停，让人检查并修改智能体的状态后再继续——审批、纠错类流程都靠它。
- **记忆（Memory）**：既有单次会话内的短期工作记忆，也有跨会话的长期记忆。

配套生态：与 LangChain 的集成和组件配合使用；用 LangSmith 做评测与可观测；用 LangSmith Deployment 部署。README 还提到 Deep Agents，是构建在 LangGraph 之上的更高层封装。除了 Python 版，也有 JavaScript / TypeScript 版本的 LangGraph.js。

## 怎么上手

```bash
pip install -U langgraph
```

学习顺序建议：

1. 先跑通官方文档的快速开始，理解 State、Node、Edge 三个概念；
2. 给图加一个工具调用节点和条件边，做出最基本的「思考—调工具—再思考」循环；
3. 加上 checkpointer，体验中断后恢复；
4. 最后再接 LangSmith 看每一步的输入输出。

如果只是想快速得到一个能用的智能体，官方也提供预构建的高层接口，不必从空白的图开始。

## 免费与付费

- **LangGraph 框架本身**：MIT 许可，免费。
- **LangSmith 与 LangSmith Deployment**：LangChain 公司的商业产品，有免费额度和付费方案，价格以官网为准。
- **模型费用**：按你接入的模型厂商计费。

## 适合谁 / 不适合谁

**适合：**
- 要把智能体做成正式产品、需要可恢复、可审计、可人工干预的工程团队；
- 流程里有复杂分支、循环、多智能体协作的系统；
- 已经在用 LangChain 生态的开发者。

**不适合：**
- 编程新手或只想做个演示的人，抽象层次偏底层，学习成本不低；
- 不写代码的用户；
- 一次调用就能解决的简单任务，上图编排属于过度设计。

## 注意事项

- **和 LangChain 的关系**：LangGraph 可以单独使用，不强制依赖 LangChain 的链式写法，但两者文档和概念交叉较多，初学容易混。
- **命名有调整**：部署平台在官方仓库里现在叫 LangSmith Deployment，老资料里出现的其他名称以当前官方文档为准。
- **状态设计要先想清楚**：状态结构一旦上线再改，已有的检查点可能不兼容。
- **持久化需要存储后端**：生产环境要配置数据库来保存检查点，并考虑其中是否含敏感数据。

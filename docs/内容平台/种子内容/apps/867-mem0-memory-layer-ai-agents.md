---
title: "Mem0 是什么、怎么用：给 AI 智能体加长期记忆的开源「记忆层」"
slug: mem0-memory-layer-ai-agents
name: Mem0
url: https://github.com/mem0ai/mem0
pricing: 开源免费（Apache-2.0）/ 云平台另计
platforms: Python / Node.js / 命令行 / Docker 自托管 / 云平台
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Mem0 自称「AI 智能体的记忆层」，是 Apache-2.0 许可的开源项目，为助手和智能体提供跨会话的用户记忆，支持用户、会话、智能体多级记忆和语义加关键词的混合检索。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mem0ai/mem0
---

> 本文根据 Mem0 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Mem0 的自我介绍是「AI 智能体的记忆层」——可以直接接入的记忆基础设施。大模型本身不记得上一次对话：用户上周说过自己吃素、项目用的是哪套技术栈，下次还得重讲。Mem0 做的是把这些信息从对话里提取出来、存好，并在之后的对话中按需取回。仓库 mem0ai/mem0 约有 6.7 万星标，采用 Apache 2.0 许可。

## 能做什么

README 列出的特性：

- **多级记忆**：分别保存用户级、会话级和智能体级的状态。
- **混合检索**：结合语义检索、关键词检索（BM25）和实体匹配来找回相关记忆。
- **时间感知**：检索时区分当前状态、过去的事件和未来的计划。
- **简洁的 API 与多平台 SDK**：提供 Python 和 Node.js 两套 SDK，以及命令行工具。

集成方面，README 提到 LangGraph、CrewAI、Vercel AI SDK，一个可用于 ChatGPT、Perplexity、Claude 的浏览器扩展，以及 Claude Code、Cursor、Codex 等编程助手。

## 怎么上手

README 给出的安装命令：

```bash
pip install mem0ai        # Python
npm install mem0ai        # Node.js
npm install -g @mem0/cli  # 命令行工具（也可 pip install mem0-cli）
```

两种使用方式：

1. **云平台**：在 app.mem0.ai 注册，官方称「零运维」，适合直接用于生产。
2. **自托管**：在仓库中用 `docker compose up -d` 启动服务端，自带管理面板，默认开启认证。

之后的基本流程是：对话结束时把消息交给 Mem0 写入记忆，下一次对话开始前按用户标识检索相关记忆，拼进提示词。具体代码见官方文档。

## 免费与付费

开源版本可免费使用和自托管，成本是自己的服务器，以及提取记忆时调用大模型和嵌入模型的费用。云平台的套餐与价格不在 README 中，以官网为准。

## 适合谁 / 不适合谁

**适合：** 开发客服、个人助理、陪练教学等需要「记住用户」的应用的工程师；用 LangGraph、CrewAI 搭多步骤智能体的团队；想让编程助手记住项目约定的开发者。

**不适合：** 不写代码的用户；只做一次性问答、不需要跨会话信息的应用；对「哪些内容被记住」要求逐条人工确认的严格场景（需自行加审核）。

## 注意事项

- 记忆里存的是用户的个人信息，要提供查看、修改和删除的途径，并遵守隐私法规。
- 自动提取的记忆可能出错或过时，关键事实应允许用户纠正。
- 自托管时不要把服务端口直接暴露到公网，保留默认的认证。

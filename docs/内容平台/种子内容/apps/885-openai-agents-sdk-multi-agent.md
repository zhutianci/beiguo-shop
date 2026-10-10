---
title: "OpenAI Agents SDK 是什么、怎么用：官方开源的多智能体工作流框架"
slug: openai-agents-sdk-multi-agent
name: OpenAI Agents SDK
url: https://github.com/openai/openai-agents-python
pricing: 免费开源（MIT），模型调用另计
platforms: Python
products: [ai-tools]
models: [gpt, any-llm]
topics: [coding, ai-agent]
excerpt: "OpenAI Agents SDK 是 OpenAI 开源的轻量级多智能体框架（MIT 许可），核心概念包括智能体、工具、交接（handoffs）、护栏、会话和追踪，除 OpenAI 接口外还可接入 100 多种其他大模型。"
checkedOn: 2026-10-11
sources:
  - https://github.com/openai/openai-agents-python
---

> 本文根据 OpenAI Agents SDK 官方 GitHub 仓库（Python 版）README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

OpenAI Agents SDK 是 OpenAI 官方开源的智能体框架，README 的介绍是：一个轻量但强大的、用于构建多智能体工作流的框架。它的设计思路是概念少、上手快——用很少的几个基本构件，就能把「一个智能体调用工具」扩展成「多个智能体分工协作」。仓库（Python 版）约有 3 万星标，采用 MIT 许可。

## 能做什么

README 列出的核心概念：

- **Agents（智能体）**：配置了指令、工具、护栏和交接规则的大模型。
- **Tools（工具）**：让智能体调用函数或外部能力。
- **Handoffs（交接）与「把智能体当工具」**：一个智能体把任务转交给更合适的另一个智能体，或者像调用工具一样调用它。
- **Guardrails（护栏）**：对输入和输出做校验与安全检查。
- **Human in the loop**：在关键步骤加入人工确认。
- **Sessions（会话）**：自动管理多轮对话的历史。
- **Tracing（追踪）**：记录每一步运行过程，便于调试和优化。
- **Sandbox agents、Realtime agents、Voice agents**：分别对应沙箱环境、实时交互和语音场景。

模型方面，README 称框架与提供方无关：支持 OpenAI 的 Responses 和 Chat Completions 接口，也支持 100 多种其他大模型。

## 怎么上手

README 给出的安装命令：

```bash
pip install openai-agents
# 或
uv add openai-agents
```

可选扩展：语音支持用 `pip install 'openai-agents[voice]'`，Redis 会话存储用 `pip install 'openai-agents[redis]'`。

安装后设置好模型服务的 API Key，定义一个带指令的智能体并运行；接着给它加一两个工具函数；需要分工时，再创建多个智能体并配置交接。官方文档和仓库的 examples 目录有分步示例。

## 免费与付费

SDK 本身免费、开源。运行时的费用是模型调用费：使用 OpenAI 模型按其 API 价格计费，接入其他模型则由对应厂商收取。

## 适合谁 / 不适合谁

**适合：** 已经在用 OpenAI API、想从单次调用升级到智能体流程的 Python 开发者；需要多角色分工（例如分诊—专家—审核）的应用；希望自带追踪、少搭配套设施的小团队。

**不适合：** 不写代码的用户；需要复杂状态图和长时间持久化流程控制的场景（可对比 LangGraph）；以 TypeScript 为主的团队（请查看官方的 JS/TS 版本或其他框架）。

## 注意事项

- 交接层数多了以后，调试难度和 token 消耗都会上升，从最少的智能体数量开始。
- 追踪数据可能包含用户输入，注意其存储位置与保留期限。
- 给智能体的工具权限要收紧，涉及写入、付款等操作加人工确认。

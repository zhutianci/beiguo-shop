---
title: "Pydantic AI 是什么、怎么用：强类型的 Python 智能体框架"
slug: pydantic-ai-python-agent-framework
name: Pydantic AI
url: https://github.com/pydantic/pydantic-ai
pricing: 免费开源（MIT）
platforms: Python
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Pydantic AI 是 Pydantic 团队维护的 MIT 开源 Python AI SDK，提供带类型的可扩展智能体循环、结构化输出、依赖注入和工具调用，模型可按字符串切换，并支持持久化执行与 OpenTelemetry 观测。"
checkedOn: 2026-10-11
sources:
  - https://github.com/pydantic/pydantic-ai
---

> 本文根据 Pydantic AI 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Pydantic 是 Python 生态里最常用的数据校验库，很多大模型 SDK 的结构化输出底层都在用它。Pydantic AI 是同一个团队做的智能体框架，README 的口号是「Python 做 AI 的方式」，并称它是「Python 的 AI SDK：一个带类型、可扩展的智能体循环」。仓库约有 2.05 万星标，采用 MIT 许可。

它的卖点是把写普通 Python 后端的习惯带进 AI 开发：类型标注、依赖注入、可测试。

## 能做什么

README 列出的特性：

- **模型可替换**：支持众多模型提供方，用一个字符串就能切换模型。
- **类型化的结构化输出**：让模型按你定义的数据结构返回结果，并自动校验。
- **依赖注入与工具**：把数据库连接、用户信息等依赖安全地传给工具函数。
- **多模态能力**：实时语音、图像生成和嵌入。
- **持久化执行**：可运行在 Temporal、DBOS、Prefect 等引擎上，长任务中断后可以恢复。
- **观测与评测**：内置 OpenTelemetry 埋点，并提供 Pydantic Evals 用于测试。
- **Capabilities**：把工具、指令和钩子打包成可复用的能力单元。

相关产品：**Pydantic Logfire**（AI 可观测平台，有免费档）和 **Pydantic AI Gateway**（用一个密钥访问各家模型并监控成本）。

## 怎么上手

README 给出的安装命令：

```bash
uv add pydantic-ai
```

之后的基本做法是：定义一个智能体，指定模型字符串和系统指令；用 Pydantic 模型声明期望的输出结构；把需要的函数注册为工具；运行并拿到已经通过校验的结果对象。完整示例见官方文档。

## 免费与付费

框架开源免费（MIT）。Logfire 与 AI Gateway 是 Pydantic 公司的独立服务，价格以其官网为准。模型调用费由各模型厂商收取。

## 适合谁 / 不适合谁

**适合：** 熟悉 FastAPI、Pydantic 的 Python 后端工程师；需要可靠结构化输出的数据抽取与业务流程类应用；重视类型检查和单元测试的团队。

**不适合：** 不写代码的用户；主要使用 JavaScript / TypeScript 的团队（可以看 Vercel AI SDK）；想要拖拽式编排界面的场景。

## 注意事项

- 结构化输出通过校验只说明「格式对了」，内容是否正确仍需评测。
- 框架迭代较快，升级前阅读更新日志。
- 给工具传入的依赖要按最小权限准备，避免模型通过工具访问不该碰的数据。

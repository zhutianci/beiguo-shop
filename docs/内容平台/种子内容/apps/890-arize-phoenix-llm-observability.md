---
title: "Arize Phoenix 是什么、怎么用：可自托管的大模型应用追踪与评测平台"
slug: arize-phoenix-llm-observability
name: Arize Phoenix
url: https://github.com/Arize-ai/phoenix
pricing: 源码可得、可免费自托管（Elastic License 2.0）
platforms: Python / 本地或自托管服务
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent, prompt-engineering]
excerpt: "Phoenix 是 Arize 推出的 AI 可观测平台，用于实验、评测和排障：基于 OpenTelemetry 追踪大模型应用，提供评测、带版本的数据集、实验对比、Playground 和提示词管理，可用一条命令在本机启动。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Arize-ai/phoenix
verify:
  - "许可证为 Elastic License 2.0（ELv2），不属于 OSI 认可的开源许可证，正文按「源码可得」表述"
---

> 本文根据 Arize Phoenix 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。项目变化快，以官方仓库为准。

## 是什么

Phoenix 是 Arize 公司推出的「AI 可观测平台」，README 说它是为实验、评测和排障而设计的。开发大模型应用时，最头疼的是看不见内部发生了什么：一次回答背后调了几次模型、检索到了哪些片段、哪一步慢、哪一步错。Phoenix 把这些过程记录下来并可视化，再提供评测和对比实验的工具。仓库约有 1.18 万星标，许可证为 Elastic License 2.0。

它与 LangSmith、Langfuse、W&B Weave 属于同一类工具；Arize 另有托管的商业平台 Arize AX。

## 能做什么

README 列出的功能：

- **Tracing（追踪）**：通过基于 OpenTelemetry 的埋点，记录大模型应用运行时的每一步。
- **Evaluation（评测）**：用大模型来评估回答质量和检索质量。
- **Datasets（数据集）**：带版本管理的数据集，用于实验和微调。
- **Experiments（实验）**：对比提示词、模型或检索方式改动前后的效果。
- **Playground**：优化提示词，也可以重放已追踪到的调用。
- **Prompt management（提示词管理）**：带版本控制和标签。

## 怎么上手

README 给出的安装与启动命令：

```bash
pip install arize-phoenix
phoenix serve
```

不想安装的话，可以直接运行：

```bash
uvx arize-phoenix serve
```

启动后在浏览器打开本地界面，再按官方文档给你的应用加上埋点（常见框架有现成的自动埋点包）。运行几次应用，就能在界面里看到完整的调用链。之后准备一小批测试样例建成数据集，用实验功能比较不同提示词版本。

## 免费与付费

Phoenix 可以免费在本机或自己的服务器上运行。需要注意它的许可证是 Elastic License 2.0：可以自用和修改，但对「把它作为托管服务提供给第三方」等用法有限制，商用前请阅读许可全文。托管平台 Arize AX 的价格以官网为准。

## 适合谁 / 不适合谁

**适合：** 开发 RAG 或智能体应用、需要看清调用链的工程师；希望追踪数据留在本地的团队；想系统地做提示词回归测试的人。

**不适合：** 只在聊天界面使用 AI 的普通用户；打算把它包装成对外服务的厂商（受许可证限制）；还没有任何测试样例、处于想法阶段的项目。

## 注意事项

- 追踪数据里有用户输入和模型输出，自托管时做好访问控制与数据保留策略。
- 用大模型做评测会产生额外的调用费用，评测结果也需要人工抽查。
- 本机启动适合开发调试，团队共用时按官方文档做正式部署并配置持久化存储。

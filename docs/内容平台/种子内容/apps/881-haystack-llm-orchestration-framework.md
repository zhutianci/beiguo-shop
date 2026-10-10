---
title: "Haystack 是什么、怎么用：deepset 开源的 RAG 与智能体编排框架"
slug: haystack-llm-orchestration-framework
name: Haystack
url: https://github.com/deepset-ai/haystack
pricing: 开源免费（Apache-2.0）/ 企业版另计
platforms: Python
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Haystack 是 deepset 维护的 Apache-2.0 开源 AI 编排框架，用模块化组件搭建检索增强生成与智能体应用，强调对检索、排序、过滤和路由的显式控制，可配合 Hayhooks 发布为 REST API 或 MCP 服务。"
checkedOn: 2026-10-11
sources:
  - https://github.com/deepset-ai/haystack
---

> 本文根据 Haystack 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Haystack 是 deepset 维护的开源框架，README 的定位是：用于构建「经过上下文工程、可用于生产」的大模型应用的开源 AI 编排框架。它是这个领域的老牌项目之一，最早做问答与检索，现在覆盖 RAG 和智能体。仓库约有 2.67 万星标，采用 Apache-2.0 许可。

和一些「帮你把一切都包起来」的框架相比，Haystack 的风格是**显式**：数据从哪来、怎么检索、怎么排序过滤、交给哪个模型，都由你用组件一段段连起来。

## 能做什么

README 列出的特性：

- **模块化组件**：检索、工具调用、记忆、评测等都有现成组件，也可以编写自定义组件。
- **对上下文的显式控制**：自己决定检索、排序、过滤和路由的每一步。
- **智能体支持**：提供智能体生命周期钩子，并能跟踪步数、token 用量和工具调用。
- **异步与流式**：原生支持异步，可以逐 token 流式输出。
- **模型无关**：可对接多家模型厂商，也能用本地模型。
- **Hayhooks**：一个独立的配套项目，把搭好的流水线发布成 REST API 或 MCP 服务。

## 怎么上手

README 给出的安装命令：

```bash
pip install haystack-ai
```

想用每日构建的预发布版本，可以加 `--pre` 参数。

安装后的典型路线：先按官方教程搭一条最小的 RAG 流水线（文档写入 → 检索 → 组装提示词 → 生成），跑通后再替换检索器、加入重排和评测；需要对外提供服务时用 Hayhooks 发布。

## 免费与付费

框架本身开源免费。deepset 另外提供商业产品：Haystack Enterprise Starter（专家支持、模板和部署指南）和 Haystack Enterprise Platform（托管云或自托管），价格以官网为准。调用模型的费用由各模型厂商收取。

## 适合谁 / 不适合谁

**适合：** 要把 RAG 或智能体做成正式产品、需要对每一步可控可测的工程团队；看重框架稳定性和企业支持的组织；已有搜索系统、希望在其上叠加大模型能力的团队。

**不适合：** 不写代码的用户（可视化平台如 Dify 更合适）；只想快速拼一个演示的初学者；主要使用 TypeScript 的前端团队。

## 注意事项

- 网上的旧教程可能基于早期版本，接口与现在的 `haystack-ai` 包不一定相同，以官方文档为准。
- 流水线越长，延迟和成本越高，上线前逐段评测，去掉不带来提升的环节。
- 检索质量通常比换更大的模型更关键，优先把数据清洗和切块做好。

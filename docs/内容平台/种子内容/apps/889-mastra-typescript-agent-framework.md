---
title: "Mastra 是什么、怎么用：TypeScript 的 AI 智能体与工作流框架"
slug: mastra-typescript-agent-framework
name: Mastra
url: https://github.com/mastra-ai/mastra
pricing: 开源免费（核心为 Apache-2.0）
platforms: TypeScript / Node.js（React、Next.js）
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Mastra 自称「面向 AI 应用和智能体的现代 TypeScript 框架」，提供 40 多家模型的统一路由、自主智能体、图式工作流、人工审批暂停与恢复、记忆、评测和可观测性，核心框架采用 Apache-2.0 许可。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mastra-ai/mastra
verify:
  - "README 写明核心框架为 Apache-2.0，ee/ 目录下代码适用 Mastra Enterprise License"
---

> 本文根据 Mastra 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Mastra 的自我介绍是：面向 AI 应用和智能体的现代 TypeScript 框架。Python 生态里做智能体的框架很多，而前端和全栈工程师熟悉的 TypeScript 这边，Mastra 是覆盖面比较完整的一个——智能体、工作流、记忆、评测、观测都在同一个框架里。仓库约有 2.87 万星标。

## 能做什么

README 列出的特性：

- **模型路由**：统一接入 40 多家模型提供方，包括 OpenAI、Anthropic、Gemini。
- **自主智能体**：智能体自己选择工具并反复迭代，直到得出答案。
- **图式工作流**：用图来编排步骤，支持分支和并行。
- **人在回路**：在需要审批的地方暂停，状态会保存，批准后从原处恢复运行。
- **记忆与检索**：对话历史、数据检索和长期记忆。
- **前端集成**：与 React、Next.js 和 Node.js 应用结合。
- **MCP 服务器**：把自己的智能体和工具通过 MCP 暴露给其他客户端。
- **评测与可观测性**：内置 evals 和运行过程观测。

## 怎么上手

README 给出的起步命令：

```bash
npm create mastra@latest
```

按提示选择模型提供方和示例后，会生成一个可运行的项目。之后的常见路线：先改写示例智能体的指令和工具；需要固定流程时，把步骤写成工作流；涉及发邮件、改数据这类动作时，加上人工审批节点。完整的安装说明在 mastra.ai/docs。

## 免费与付费

核心框架开源免费，采用 Apache License 2.0；README 说明仓库中 `ee/` 目录下的代码适用 Mastra Enterprise License。模型调用费用由各模型厂商收取。官方的云端或企业服务以官网为准。

## 适合谁 / 不适合谁

**适合：** 用 TypeScript 开发、想在现有 Next.js / Node.js 项目里加入智能体的团队；需要「流程可控 + 人工审批」的业务自动化；希望智能体、工作流、评测用同一套工具的全栈开发者。

**不适合：** 以 Python 为主的团队；不写代码的用户；只需要一个聊天界面加流式输出的简单应用（Vercel AI SDK 可能就够了）。

## 注意事项

- 框架更新频繁，升级前看变更说明，锁定依赖版本。
- 企业目录下的功能许可不同，商用前确认用到了哪些部分。
- 自主智能体可能陷入循环，设置最大步数和费用上限。

---
title: "Vercel AI SDK 是什么、怎么用：TypeScript 开发 AI 应用和智能体的开源工具包"
slug: vercel-ai-sdk-typescript-toolkit
name: Vercel AI SDK
url: https://github.com/vercel/ai
pricing: 免费开源（许可证以仓库 LICENSE 为准）
platforms: TypeScript / Node.js 22+（Next.js、React、Svelte、Vue）
products: [ai-tools]
models: [any-llm]
topics: [coding, ai-agent]
excerpt: "Vercel AI SDK 自称「TypeScript 的 AI 工具包」，用统一接口调用 OpenAI、Anthropic、Google 等模型，提供文本与结构化输出生成、带工具调用的智能体，以及 useChat 等前端 UI 钩子。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel/ai
verify:
  - "README 未写许可证名称（只链接到 LICENSE 文件），正文未写具体许可证"
---

> 本文根据 Vercel AI SDK 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Vercel AI SDK（npm 包名就叫 `ai`）是 Vercel 维护的开源库，README 称它是「TypeScript 的 AI 工具包」：一个免费、开源、用于构建 AI 应用和智能体的库。如果你用 Next.js、React 这类技术栈做带聊天界面的产品，它几乎是默认选择——它同时解决了后端「怎么调模型」和前端「怎么把流式输出显示出来」两件事。仓库约有 2.72 万星标。

## 能做什么

README 介绍的几个部分：

- **统一的模型访问**：用同一套接口调用 OpenAI、Anthropic、Google 等模型；README 说明默认通过 Vercel AI Gateway 访问，也可以安装各家的 provider 包直连。
- **文本与结构化输出**：`generateText` 生成文本；配合 `Output.object` 让模型按指定结构返回数据。
- **智能体**：`ToolLoopAgent` 提供带工具调用的智能体循环。
- **前端 UI 钩子**：例如 `useChat`，适配 Next.js、React、Svelte 和 Vue，处理消息状态与流式渲染。
- **模板与技能**：仓库提供项目模板，以及一个给编程智能体用的技能包。

## 怎么上手

README 给出的安装命令（需要 Node.js 22 或更高版本）：

```bash
npm install ai
npm install @ai-sdk/react                                   # 前端钩子
npm install @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google # 按需安装各家 provider
```

想让编程智能体熟悉这个库，可以运行 `npx skills add vercel/ai` 安装官方技能。

典型路线：在服务端路由里用 `generateText`（或流式版本）调用模型，在页面组件里用 `useChat` 连接这个路由，几十行代码就能得到一个可用的聊天界面；之后再加入工具调用和结构化输出。

## 免费与付费

库本身免费、开源。费用来自两处：模型调用费（直连各家，或通过 Vercel AI Gateway 计费），以及应用的托管费用。它并不要求部署在 Vercel 上。

## 适合谁 / 不适合谁

**适合：** 使用 TypeScript 的全栈和前端开发者；要做聊天界面、流式输出的 Web 产品；希望随时切换模型供应商的团队。

**不适合：** 以 Python 为主的团队（可以看 Pydantic AI、LangGraph 等）；不写代码的用户；只需要在脚本里调用一次模型的简单场景——直接用官方 SDK 更省事。

## 注意事项

- 大版本之间有破坏性变更，老教程里的函数名可能已经改了，以当前文档为准。
- API Key 只能放在服务端，不要写进前端代码。
- 默认经由 AI Gateway 时，请求会经过 Vercel 的服务，有合规要求的项目改用直连 provider。

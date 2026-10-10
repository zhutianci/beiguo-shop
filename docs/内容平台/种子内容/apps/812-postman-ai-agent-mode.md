---
title: "Postman AI 是什么、怎么用：Agent Mode 用自然语言调试和构建 API"
slug: postman-ai-agent-mode
name: Postman AI（Agent Mode）
url: https://www.postman.com/product/agent-mode/
pricing: 以官网为准
platforms: Postman 桌面应用 / 网页 / 命令行
trialNote: 可免费注册 Postman；AI 功能的额度与价格以官网定价页为准
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Postman 的 Agent Mode 让开发者用自然语言探索、调试和构建 API，可修复出错的请求、编写测试脚本、生成文档并整理集合，另有 CLI 与 MCP Server 供外部智能体使用。"
checkedOn: 2026-10-11
sources:
  - https://www.postman.com/product/agent-mode/
verify:
  - "老资料里的 Postbot 名称在本次抓取的页面上没有出现，页面也没有更名说明；正文未断言 Postbot 的去向"
  - "页面未写 AI 功能的价格与额度，正文写「以官网为准」"
---

> 本文根据 Postman 官网的 Agent Mode 产品页整理，资料核对于 2026-10-11。AI 功能的名称和额度变化较快，以官网为准。

## 是什么

Postman 是开发者常用的 API 调试与协作工具，运营方为 Postman, Inc.。它的 AI 能力现在以 **Agent Mode** 为核心，产品页的一句话介绍是：用自然语言探索、调试和构建 API。页面把它描述为「原生 AI」，用来自动完成 API 工作流里重复的部分。

如果你是从老教程里看到「Postbot」找过来的：本次核对的官方页面上使用的名称是 Postman AI 和 Agent Mode。

## 能做什么

产品页列出的能力：

- **Postman AI**：修复出错的请求、编写测试脚本、生成文档、整理集合（collection）。
- **Agent Mode**：把上面这些串成多步骤任务，用一句话交代目标，由它在工作区里执行。
- **AI Engineer**：页面的说法是借助智能体提高开发速度，同时保持质量与安全。
- **Postman CLI**：给你自己的智能体提供预置技能。
- **Postman MCP Server**：把 API 的上下文提供给外部 AI 智能体，例如让编程助手了解你工作区里的接口定义。

页面「更多产品」一栏还列出 Fabric（路由、治理和观测 AI 流量）、Astro AI（在生产环境管理和控制 AI 智能体）、Orbit、Passport 等，属于面向企业的周边产品。

## 怎么上手

1. 在 postman.com 免费注册，下载桌面应用或直接使用网页版。
2. 打开一个已有的集合，或者先导入接口定义。
3. 在 Agent Mode 里用自然语言描述要做的事，例如「为这个集合里的每个请求补上状态码和字段校验的测试」。
4. 检查它生成的脚本和改动，确认后保存。
5. 想让 Claude Code、Cursor 等工具读取你的接口信息，按官方文档配置 Postman MCP Server。

## 免费与付费

Agent Mode 产品页只提供「免费注册」入口和指向定价页的链接，没有写出 AI 功能的额度与价格；Postman 各方案的价格和包含的 AI 用量请以官网定价页为准。

## 适合谁 / 不适合谁

**适合：** 每天和接口打交道的后端、前端与测试工程师；接口多、测试脚本和文档长期欠账的团队；希望让编程智能体直接读懂 API 定义的开发者。

**不适合：** 不使用 Postman 的团队（单为 AI 功能迁移不一定值得）；接口信息高度敏感、不允许同步到云端工作区的项目。

## 注意事项

- AI 生成的测试只能覆盖它看得到的字段和示例，业务规则仍要自己补充断言。
- 让智能体执行请求前，确认当前选中的是测试环境而不是生产环境，尤其是带写操作的接口。
- 集合和环境变量里常有密钥，使用 AI 与 MCP 之前先检查哪些内容会被发送出去。

---
title: AI 智能体是什么、有哪些：官方怎么定义、和普通聊天机器人的区别、ChatGPT、Claude、Gemini、Grok 的现成产品
slug: ai-agent-what-is-examples
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: AI 智能体是什么？OpenAI 官方说它是「独立替你完成任务的系统」，由模型、工具和指令组成；Anthropic 把预先写好步骤的叫工作流，模型自己决定步骤的才叫智能体。附 ChatGPT、Claude、Gemini、Grok 的现成产品和注意事项。
checkedOn: 2026-10-25
sources:
  - https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
  - https://www.anthropic.com/engineering/building-effective-agents
  - https://platform.openai.com/docs/guides/agents
  - https://ai.google.dev/gemini-api/docs/agents
  - https://docs.x.ai/grok-bot/overview
  - https://code.claude.com/docs/en/overview
verify:
  - 「智能体」没有统一的行业定义，本文并列引用了 OpenAI 和 Anthropic 两家官方的说法：OpenAI 指南定义为「独立替你完成任务的系统」，有三要素（模型、工具、指令）并强调护栏；Anthropic 把工作流（预先写好代码路径）和智能体（模型动态决定流程与工具）区分开，统称 agentic systems
  - Anthropic 的博客发表于 2024-12-19，页首注明其中的工具现状已有变化，并指向其新的托管智能体（Managed Agents）文档；本文只引用其中关于定义和「先用最简单方案」的建议
  - 现成产品的介绍只取各家官方页面写明的内容：Grok Bot 取自 docs.x.ai 概览；Gemini 托管智能体取自 Gemini API 智能体文档（一次交互可能消耗 10 万到 300 万 tokens，预览期环境算力不收费，环境闲置 7 天会被删除）；Claude Code 取自官方概览；ChatGPT 的 Agent 模式见本站 03 号文章
  - 本文不评价各家智能体「谁更聪明」，也不涉及任何智能体项目的收益承诺
  - 官方文档普遍提醒：智能体可能执行有副作用的操作，输出要人工核对，凭据只给最小权限
---

> 本文根据 OpenAI、Anthropic、Google、xAI 的官方文档整理，资料核对于 2026-10-25。智能体产品和文档更新很快，**以官方页面为准**。本文不评价谁更强，只讲官方怎么定义、有哪些现成产品、使用时要注意什么。图为本站整理的示意图。

## 适用于谁

- 搜「ai智能体是什么」「ai agent 有哪些」的人；
- 分不清「智能体」和普通聊天机器人、自动化工作流的人；
- 想知道有没有现成产品可以直接用的人。

## 结论先说

1. **OpenAI 官方定义**：智能体是「独立替你完成任务的系统」。它用大模型管理工作流的执行并做决策，能判断任务是否完成、必要时纠正自己，失败时可以停下来把控制权交还给你；它能调用各种工具去取资料和执行动作，并始终在明确的护栏内运行。
2. **不算智能体的**：官方说，只是接入了大模型、但不用它控制流程的应用，比如简单的聊天机器人、单轮问答、情感分类器，都不是智能体。
3. **Anthropic 的区分**：**工作流**是通过预先写好的代码路径来编排大模型和工具；**智能体**是大模型动态决定自己的流程和工具使用。两者统称「智能体系统」。
4. **三要素**：OpenAI 官方指南把智能体拆成模型、工具、指令，并强调护栏。
5. **官方的共同建议**：不要为了用智能体而用。Anthropic 说要先找最简单的方案，只在需要时增加复杂度；OpenAI 说，如果传统的确定性方法够用，就不必做智能体。

![一个智能体由什么组成](seed:g1098-ai-agent-parts.png)
*图：本站根据 [OpenAI 智能体指南](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) 整理的示意图*

## 一、和普通聊天机器人、工作流的区别

![工作流和智能体的区别](seed:g1098-workflow-vs-agent.png)
*图：本站根据 [Anthropic：Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) 整理的示意图*

| 对比 | 普通聊天 | 工作流 | 智能体 |
| --- | --- | --- | --- |
| 谁决定下一步 | 你每次提问 | 预先写好的代码 | 模型自己决定 |
| 能调用工具 | 一般有限 | 有，按固定顺序 | 有，动态选择 |
| 适合 | 问答、写作 | 步骤固定的任务 | 开放式、需要判断的任务 |
| 代价 | 低 | 可预测 | 官方说通常要用延迟和成本换更好的任务表现 |

OpenAI 官方指南建议优先考虑这几类适合用智能体的场景：需要复杂判断的流程（例如客服退款审批）、规则难以维护的系统（例如供应商安全审查）、大量依赖非结构化数据的场景（例如处理保险理赔）。

## 二、现成的智能体产品（官方写了什么）

| 想做的事 | 产品 | 官方说明的要点 |
| --- | --- | --- |
| 让 AI 在网页里替你操作 | ChatGPT 的 Agent 模式 | 见站内 [/guides/chatgpt-agent-mode](/guides/chatgpt-agent-mode) |
| 让 AI 在代码仓库里干活 | Codex、Claude Code、Antigravity CLI | 读代码库、改文件、运行命令；订阅和额度见 [/guides/ai-coding-tools-codex-claude-code-cursor-gemini](/guides/ai-coding-tools-codex-claude-code-cursor-gemini) |
| 常驻的 AI 同事 | Grok Bot | 官方称每个 Bot 在一台持续运行的云端电脑上工作，有浏览器、文件系统和终端，合上笔记本也能继续；需要用户批准的步骤会回来问你 |
| 自己开发智能体应用 | OpenAI Agents SDK 与 Agents API、Claude Agent SDK、Gemini 托管智能体与 Antigravity SDK | 各家官方文档提供框架和托管环境 |
| 不写代码搭智能体 | 扣子等低代码平台 | 见站内 [/guides/coze-create-agent-howto](/guides/coze-create-agent-howto) |

![想用智能体：现成的还是自己搭](seed:g1098-ai-agent-which-to-use.png)
*图：本站根据各家官方文档整理的示意图*

几个官方的具体说明：

- **Grok Bot**：官方说通过发消息给 Bot 来使用，可以打字、语音；多个 Bot 可以并行、互相传消息、共享上下文；Bot 会记住稳定的偏好、角色背景和过往工作摘要，但重要决定仍应让它去查最新资料而不是依赖记忆；一个站点可能阻止自动化、会话过期或要求人工步骤，这时 Bot 会交给你处理，而不是绕过。包含在 Cursor 的付费个人订阅里，细节见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup)；
- **Gemini 托管智能体**：官方说一次 API 调用就会开一个 Linux 沙箱，智能体在里面推理、执行代码、管理文件、浏览网页；环境默认有不受限的出站网络访问，可以用白名单限制；按 token 和工具用量付费，一次交互通常消耗 10 万到 300 万 tokens；环境闲置 7 天会被永久删除；
- **OpenAI**：官方文档把三种运行方式列在一起：Agents API（OpenAI 托管的 Codex 框架，适合长任务）、Agents SDK（在你自己的应用里控制智能体循环）、Responses API（直接调用模型自己搭）；
- **Claude Code**：官方说它是读代码库、改文件、跑命令并连接开发工具的智能体式编程工具，可在终端、IDE、桌面和网页使用。

## 三、使用智能体要注意

1. **权限最小化**：Gemini 官方文档的建议是给最小权限的服务账号或 API Key，优先用短期令牌，定期轮换，并且只提供愿意完全授权的凭据，因为智能体可能用到它能访问的任何凭据；
2. **人工把关**：官方都强调，生成的代码、数据转换、配置变更，尤其是会修改数据或操作外部系统的任务，要在上线前人工核对；
3. **先小任务**：Grok 官方建议第一个任务选一个跨几个工具、有明确终点的真实任务，让 Bot 做完后你审阅、纠正，再把稳定的流程做成技能；
4. **关注成本**：智能体会进行多轮推理，token 消耗比普通聊天大得多，API 价格见 [/guides/llm-api-price-comparison-official](/guides/llm-api-price-comparison-official)；
5. **别轻信「全自动赚钱」之类的宣传**：官方文档没有这类承诺。

## 常见问题

**Q：智能体和 MCP、技能是什么关系？**
MCP 是给模型接工具和数据的标准方式，技能是可复用的指令集，都属于智能体的「工具」与「指令」部分。Codex 的 MCP 配置见 [/guides/codex-mcp-config](/guides/codex-mcp-config)。

**Q：普通人需要自己搭智能体吗？**
官方的共同建议是先用最简单的方案。多数人直接用现成产品就够了。

**Q：会员怎么选？**
见 [/guides/ai-subscription-which-to-choose-four-vendors](/guides/ai-subscription-which-to-choose-four-vendors)。

## 参考资料

- OpenAI：A practical guide to building AI agents — https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
- Anthropic：Building effective agents — https://www.anthropic.com/engineering/building-effective-agents
- OpenAI：Agents 文档 — https://platform.openai.com/docs/guides/agents
- Gemini API：Agents — https://ai.google.dev/gemini-api/docs/agents
- docs.x.ai：Grok Bot Overview — https://docs.x.ai/grok-bot/overview
- Claude Code 文档：Overview — https://code.claude.com/docs/en/overview

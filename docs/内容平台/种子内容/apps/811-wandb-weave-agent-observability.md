---
title: "W&B Weave 是什么、怎么用：Weights & Biases 的智能体追踪与评测工具（现归入 CoreWeave Forge）"
slug: wandb-weave-agent-observability
name: W&B Weave
url: https://wandb.ai/site/weave/
pricing: 免费+付费
platforms: 云服务（网页 / SDK / MCP）
trialNote: Free 档 0 美元/月，含每月 1GB 的 Weave 数据摄入
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Weave 是 Weights & Biases 面向 AI 应用和智能体的可观测与评测工具，提供调用追踪、评测、Playground、线上监控和护栏打分器；定价页现已并入 CoreWeave Forge。"
checkedOn: 2026-10-11
sources:
  - https://wandb.ai/site/weave/
  - https://coreweave.com/forge-pricing
verify:
  - "wandb.ai 的定价页 301 跳转到 coreweave.com/forge-pricing，页面称「CoreWeave Forge is here」，但未写明 Forge 是否取代 Weights & Biases 品牌，正文只描述跳转现象"
---

> 本文根据 Weights & Biases 官网的 Weave 产品页与 CoreWeave Forge 定价页整理，资料核对于 2026-10-11。品牌与套餐正在调整，以官网为准。

## 是什么

Weave 是 Weights & Biases（常写作 W&B 或 wandb）旗下面向大模型应用的工具，产品页的定位是「生产环境智能体的可观测与持续改进」。W&B 原本以训练实验跟踪闻名，Weave 则针对另一类问题：一个由提示词、模型调用、工具和子智能体组成的应用，哪一步出了错、改动之后是变好还是变差。

核对时，wandb.ai 的定价页已跳转到 CoreWeave 的「Forge」定价页，Weave 在其中作为一项功能列出；登录入口也经过 CoreWeave 的域名。

## 能做什么

产品页列出的功能：

- **Traces**：记录并浏览应用的每次调用，用来排查问题；官方称对会话、轮次、步骤、工具和子智能体有原生的追踪结构。
- **Evaluations**：对 AI 应用做系统化测试，提供命令式的评测接口。
- **Playground**：对比测试提示词和模型，也可以拿线上追踪记录来试。
- **Monitors**：线上持续监控，支持内置和自定义信号，可触发 Slack 提醒和 Webhook 自动化。
- **Guardrails**：预置的打分器，安全类包括毒性、偏见、个人信息、幻觉，质量类包括连贯性、流畅度、上下文相关性。
- **Leaderboards**：汇总多次评测结果做排行，便于在组织内分享。
- **MCP server**：让 Claude Code 之类的编程智能体读取线上数据、运行评测并迭代。

## 怎么上手

1. 在产品页点「Try Weave for free」注册账号。
2. 打开官方文档的 Quickstart（docs.wandb.ai/weave），按说明安装 SDK 并在代码里初始化项目。
3. 运行应用，在网页端查看生成的追踪记录。
4. 准备一小批测试样例，建立第一个评测，之后每次改提示词或换模型都跑一遍。

安装命令与代码写法以 Quickstart 为准。

## 免费与付费

Forge 定价页（美元，2026-10 查询）：

| 方案 | 价格 | Weave 数据摄入 |
| --- | --- | --- |
| Free | 0 美元/月 | 每月 1GB；另含最多 5 个模型席位、每月 5GB 存储 |
| Pro | 60 美元/月起（按月计费，30 天免费试用） | 含每月 1.5GB，超出 0.10 美元/MB |
| Enterprise | 定制报价 | 超出部分 0.20 美元/MB |
| Academic | 学术研究免费 | 以官网为准 |

## 适合谁 / 不适合谁

**适合：** 正在把智能体或 RAG 应用推向生产、需要追踪与回归评测的团队；已经在用 W&B 做模型训练跟踪的团队。

**不适合：** 只是偶尔调用一下大模型 API 的小脚本；数据不能出内网又没有企业版预算的团队（可对比可自托管的开源方案，如 Langfuse）。

## 注意事项

- 追踪数据里会包含用户输入和模型输出，接入前先处理个人信息与敏感字段。
- 摄入量按 MB 计费，长上下文、多步骤的智能体数据量增长很快。
- 评测集的质量决定结论是否可信，打分器的结果也需要人工抽查。

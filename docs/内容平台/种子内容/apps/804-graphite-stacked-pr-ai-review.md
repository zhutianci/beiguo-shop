---
title: "Graphite 是什么、怎么用：堆叠式 PR 与 AI 代码审查平台（已接入 Cursor Cloud Agents）"
slug: graphite-stacked-pr-ai-review
name: Graphite
url: https://graphite.com/
pricing: 免费+付费
platforms: 网页 / 命令行 / VS Code 扩展 / MCP（基于 GitHub）
trialNote: Hobby 档免费，适用于个人项目，AI 审查与 Graphite Chat 有限额
products: [ai-tools, cursor]
models: []
topics: [coding, ai-agent]
excerpt: "Graphite 是建立在 GitHub 之上的代码评审平台，主打堆叠式 PR、合并队列和 AI 审查，定价页提示 Cursor Cloud Agents 已可在 Graphite 中使用。"
checkedOn: 2026-10-11
sources:
  - https://graphite.com/pricing
  - https://graphite.com/
verify:
  - "定价页横幅写「Cursor Cloud Agents are now in Graphite」，联系链接指向 cursor.com；页面未明说收购关系，正文只按页面现象描述"
---

> 本文根据 Graphite 官网定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Graphite 是一个建立在 GitHub 之上的代码评审与合并平台，官网的口号是「一个工具，覆盖评审和更快发布所需的一切」。它最出名的是**堆叠式 PR（stacked PRs）**：把一个大改动拆成一串互相依赖的小 PR，逐个评审、按顺序合并，避免几千行的大 PR 没人敢看。

核对时定价页顶部有一条横幅：Cursor Cloud Agents 现已可在 Graphite 中使用，页面上的联系入口也指向 cursor.com。

## 能做什么

定价页列出的功能：

- **Pull requests / GitHub sync**：PR 管理界面，与 GitHub 双向同步。
- **Stacking / Stack merge**：堆叠式 PR 的创建与整叠合并。
- **CLI、VS Code 扩展、MCP**：三种使用入口。
- **AI reviews**：AI 代码审查；Team 及以上可以定制自动化、过滤条件和规则。
- **Graphite Chat**：围绕 PR 的 AI 对话。
- **AI 生成 PR 标题与描述**、**Suggested fixes + CI summaries**（修改建议与 CI 结果摘要）。
- **Merge queue**：合并队列，Team 为基础版，Enterprise 为高级版。
- **Insights / CI optimizer**：团队数据与 CI 优化。
- **Agents**：标注为新功能，细节以官网为准。
- **Inbox 与 Slack 通知**。

## 怎么上手

1. 在 graphite.com 用 GitHub 账号登录并授权仓库（Hobby 档只同步个人账号下的仓库，付费档可同步组织仓库）。
2. 按官方文档安装命令行工具或 VS Code 扩展。
3. 把一个较大的改动拆成几个小 PR 堆叠提交，在网页端查看和评审。
4. 团队使用时再开启 AI 审查规则和合并队列。

## 免费与付费

定价页（美元，按年付折算的月价，2026-10 查询）：

| 方案 | 价格 | 要点 |
| --- | --- | --- |
| Hobby | 免费 | 个人项目，AI 审查与 Chat 有限额 |
| Starter | 20 美元/人/月（年付） | 可同步所有仓库，基础 Slack 通知 |
| Team | 40 美元/人/月（年付） | 不限量 Chat、AI 审查定制、基础合并队列，可免费试用 |
| Enterprise | 定制 | 高级合并队列、SAML/SSO、审计日志、GitHub Enterprise Server 支持 |

页面注明年付比月付便宜 20%，月付价格以官网为准。

## 适合谁 / 不适合谁

**适合：** 代码在 GitHub 上、PR 评审是瓶颈的团队；愿意采用「小 PR、堆叠提交」工作方式的工程师；已经在用 Cursor 云端智能体的团队。

**不适合：** 代码托管在 GitLab、Bitbucket 等平台的团队；提交节奏很慢、PR 数量少的小项目；不想改变现有 Git 工作流的人。

## 注意事项

- 堆叠式 PR 需要团队统一习惯，一个人用收益有限。
- AI 审查建议需要人工判断，不能替代测试。
- 产品与 Cursor 的整合仍在变化，以官网当前说明为准。

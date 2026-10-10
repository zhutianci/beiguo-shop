---
title: "Sentry Seer 是什么、怎么用、怎么收费：Sentry 的 AI 调试智能体与 Autofix"
slug: sentry-seer-ai-debugging-agent
name: Sentry Seer
url: https://sentry.io/product/seer/
pricing: 付费（按活跃贡献者计）
platforms: 网页（Sentry 内）/ GitHub / Slack / 命令行 / MCP
trialNote: Sentry 试用期内可以使用 Seer
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Seer 是错误监控平台 Sentry 的调试智能体：读取堆栈、链路等线上数据定位根因并起草修复，也能结合线上错误审查 Pull Request。"
checkedOn: 2026-10-11
sources:
  - https://sentry.io/product/seer/
---

> 本文根据 Sentry 官网的 Seer 产品页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Seer 是错误监控与性能监控平台 Sentry 里的调试智能体（官网原话：Seer is Sentry's debugging agent）。它的特点是手里有**线上数据**：报错堆栈、链路追踪、日志等本来就在 Sentry 里，Seer 拿这些上下文去代码库里找根因，而不是只看代码猜。

## 能做什么

产品页列出的三项能力：

- **Seer Agent（Ask Seer Anything）**：用自然语言描述问题，它基于你的线上数据给出回答。
- **Seer Autofix**：读取堆栈信息，在代码库里定位根本原因，并起草修复方案。
- **AI Code Review**：对照线上的错误和链路数据检查 Pull Request，标出可能出问题的地方。

常见问题里还提到 **Issue scan**：预估某个问题能否通过改代码解决。

集成方面，页面提到 GitHub、Slack、Sentry CLI 和 Sentry MCP；修复方案还可以转交给 Claude、Copilot 或 Cursor 去落地。官方称 Seer 适用于 Sentry 支持的所有语言和框架，覆盖 Web 前后端、移动端和桌面端。

## 怎么上手

1. 先有一个接入了 Sentry SDK 的项目（没有的话在 sentry.io 注册并按文档接入）。
2. 在 Sentry 里连接代码仓库（官方页面以 GitHub 为主，并附有 GitLab 的连接指南）。
3. 打开一条报错，让 Seer 分析根因、生成修复草稿；满意后再创建 PR 或交给编程智能体继续。
4. 需要在 PR 阶段把关时，开启 AI Code Review。

具体入口名称以 Sentry 当前界面和文档为准。

## 免费与付费

产品页的说明（美元，2026-10 查询）：

- Seer 的价格是 **40 美元/活跃贡献者/月**，可在 Team、Business、Enterprise 方案上加购。
- 「活跃贡献者」指在已连接的仓库里当月提交了 2 个及以上 PR 的人。
- 处于 Sentry 试用期的用户可以使用 Seer。
- Sentry 本身各方案的价格不在这一页，以官网定价页为准。

## 适合谁 / 不适合谁

**适合：** 已经在用 Sentry 做错误监控、每天要处理不少线上报错的团队；希望把「发现报错—定位—出修复 PR」缩短的值班工程师。

**不适合：** 没有接入 Sentry 的项目（Seer 的价值来自线上数据）；提交 PR 的人多但线上问题少的团队（按活跃贡献者计费不划算）；不允许把源代码与监控数据交给第三方服务的环境。

## 注意事项

- Autofix 给的是草稿，合并前必须有人评审并跑测试。
- 计费按贡献者而不是按使用次数，开启前先数一下仓库里的活跃提交人数。
- 线上数据里可能含有用户信息，使用前确认 Sentry 的数据脱敏设置。

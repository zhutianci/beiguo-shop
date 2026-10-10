---
title: "CodeRabbit 是什么、怎么用、收费吗：Pull Request 上的 AI 代码审查工具"
slug: coderabbit-ai-code-review
name: CodeRabbit
url: https://www.coderabbit.ai/
pricing: 开源仓库免费 / 私有仓库付费
platforms: GitHub / GitLab / 命令行 / IDE / Slack
trialNote: 公开仓库可免费审查；付费方案有 14 天试用
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "CodeRabbit 是在 Pull Request 提交前后自动做代码审查的 AI 工具，可生成改动说明、单元测试和一键修复，公开仓库免费，私有仓库按人按月收费。"
checkedOn: 2026-10-11
sources:
  - https://www.coderabbit.ai/pricing
  - https://www.coderabbit.ai/
---

> 本文根据 CodeRabbit 官网定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

CodeRabbit 是一款 AI 代码审查工具，由 CodeRabbit Inc. 开发。它接入代码托管平台后，会在每个 Pull Request（PR）上自动给出逐行评审意见和改动摘要，也可以在提交 PR 之前，通过命令行、IDE 或编程智能体的循环里先审一遍。

## 能做什么

定价页把产品分成几块：

- **CodeRabbit Review**：PR 提交前和提交后的 AI 代码审查。
- **CodeRabbit Triage**：按价值、影响和风险给待审 PR 排序。
- **CodeRabbit Explain**：详细解释并记录代码改动。
- **CodeRabbit Secure**：静态分析、密钥泄露、依赖和基础设施方面的检查。
- **CodeRabbit Deep Scan**：对整个代码库做智能体式的漏洞扫描，并按可利用程度分级。
- **CodeRabbit Engineer**：通过 Slack 给它分配编码和排障任务。

审查流程里的具体功能还有：Autofix（对未解决的问题一键修改）、Unit Tests（为 PR 生成测试）、Learnings（从以往的 PR、Issue 和规范里积累上下文）、Pre-Merge Checks（合并前的质量门禁）、Slop Detection（标出低质量的 AI 生成 PR）、Blast Radius（梳理改动的下游影响）等。集成方面支持 Jira 和 Linear。

## 怎么上手

1. 在官网用代码托管平台账号登录（定价页的常见问题里提到 GitHub 和 GitLab）。
2. 授权并选择要启用的仓库。
3. 新开一个 PR，CodeRabbit 会自动留下摘要和评审意见；可以直接在评论里与它对话、要求修改。
4. 想更早发现问题，再按官方文档接入命令行或 IDE。

## 免费与付费

定价页（美元，2026-10 查询）：

| 方案 | 年付折算 | 月付 |
| --- | --- | --- |
| Essentials（原 Pro） | 24 美元/人/月 | 30 美元/人/月 |
| Team（原 Pro Plus） | 48 美元/人/月 | 60 美元/人/月 |
| Advanced | 72 美元/人/月 | 以官网为准 |
| Enterprise | 联系销售 | — |

- **公开仓库**：开源方案免费审查。
- 三个付费档都有 14 天试用；年付比月付便宜 20%。
- 超出套餐包含量后按用量计：每多审一个文件 0.25 美元，智能体任务 0.40 美元/分钟；Deep Scan 为浮动价格。

官方说明 Essentials 和 Team 只是改了名字，价格没变。

## 适合谁 / 不适合谁

**适合：** PR 多、评审人手紧的团队；开源项目维护者（公开仓库免费）；希望在合并前自动跑一遍安全与规范检查的团队。

**不适合：** 不走 PR 流程的个人项目；代码不允许交给第三方服务处理的团队；指望它完全取代人工评审的场景。

## 注意事项

- 评审意见有误报，重要改动仍要人工把关。
- 按人计费之外还有按用量的附加费，团队规模大时先看清套餐包含量。
- 方案名称 2026 年有调整，老资料里的 Pro / Pro Plus 对应现在的 Essentials / Team。

---
title: "Qodo 是什么、怎么用、价格多少：原 CodiumAI 的 AI 代码审查平台"
slug: qodo-ai-code-review-platform
name: Qodo
url: https://www.qodo.ai/
pricing: 付费（14 天免费试用）
platforms: GitHub / GitLab / Bitbucket / Azure / VS Code / JetBrains / 命令行
trialNote: Pro Team 可免费试用 14 天，无需信用卡；符合条件的开源项目可申请免费使用
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Qodo 是面向复杂代码库的 AI 代码审查平台，把自动化、带上下文的审查放进 IDE、Pull Request、命令行和 Git 流程，支持跨仓库检查。"
checkedOn: 2026-10-11
sources:
  - https://www.qodo.ai/pricing/
  - https://www.qodo.ai/
verify:
  - "Qodo 原名 CodiumAI 属通行说法，本次抓取的定价页未写更名说明"
---

> 本文根据 Qodo 官网定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Qodo 是一个 AI 代码审查平台，官网的定位是：把自动化、理解上下文的代码审查带进 IDE、Pull Request、命令行和 Git 工作流，并且面向复杂代码库、能跨多个仓库获取上下文。早些年它叫 CodiumAI，搜索「Qodo Merge」「PR-Agent」「Qodo Cover」找到的也是同一家的产品。官网目前以「Qodo 3.0」作为主打版本。

## 能做什么

定价页列出的能力：

- **Multi Agent Code Review**：在每个 Pull Request 上按组织的规范做多智能体审查。
- **Wisdom Base**：把代码库、PR 历史和业务需求方面的知识沉淀下来，供审查时调用。
- **Rules & Skills Lifecycle**：把团队口口相传的经验和历史 PR 变成可以自我更新的规范。
- **Cross Repo Review**：在破坏性改动影响到其他仓库之前给出提示。
- **Software Map**（标注为新功能）：展示仓库、服务和接口契约之间的关系，以及改动的影响面。
- **Agentic Toolbox**（标注为新功能）：给 Codex、Claude、Kiro 等编程智能体配一个基于命令行的质量把关工具。

支持的代码托管平台有 GitHub、GitLab、Bitbucket、Azure，企业版另支持 Gerrit；IDE 方面有 VS Code 和 JetBrains 系列。页面列出的语言包括 Python、TypeScript、JavaScript、Java、Kotlin、Go、PHP、C、Swift。

## 怎么上手

1. 用 GitHub、Google 或邮箱在官网注册，开始 14 天试用（不需要信用卡）。
2. 在代码托管平台上安装 Qodo 的应用——官方提示这一步需要仓库的管理员权限。
3. 提交一个 Pull Request，查看它给出的审查意见；再按团队习惯补充规则。

试用结束后如果没有选择付费方案，审查会暂停。

## 免费与付费

定价页（美元，2026-10 查询）：

- **Pro Team**：页面标价 30 美元，注明「按月计费、无需承诺」，面向 30 人以内的团队；用量按点数（credits）计，页面给出的点数包有 2,500 / 5,000 / 20,000 三档，单价为 0.012 美元/点，团队共用。
- **Enterprise**：30 人以上，定制方案，需预约演示。
- **没有长期免费档**；符合条件的开源项目可以申请「Qodo for Open Source」。

Pro Team 的 30 美元是按人还是按团队、具体含多少点数，请以定价页当前说明为准。

## 适合谁 / 不适合谁

**适合：** 多仓库、多服务、规范多的工程团队；大量使用编程智能体写代码、需要一道独立质量关的团队。

**不适合：** 个人小项目（没有长期免费档）；没有仓库管理员权限、无法安装应用的成员；不允许代码发送到第三方服务的团队（需评估企业方案）。

## 注意事项

- 点数制的消耗与审查次数挂钩，先用试用期观察团队一个月大概需要多少次审查。
- AI 审查意见不能替代人工评审与测试，尤其是涉及安全和架构的改动。
- 老资料里的 CodiumAI、Qodo Gen、Qodo Cover 等名称与现在的产品线不完全对应，以官网为准。

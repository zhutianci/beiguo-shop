---
title: "GitLab Duo 是什么、怎么用、怎么收费：贯穿研发全流程的 AI 智能体平台"
slug: gitlab-duo-agent-platform
name: GitLab Duo Agent Platform
url: https://about.gitlab.com/gitlab-duo/
pricing: 需 Premium 或 Ultimate 方案，按 GitLab Credits 计量
platforms: GitLab（网页；IDE 支持以官方文档为准）
trialNote: 可免费试用 Ultimate（含 Duo Agent Platform）60 天
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "GitLab Duo Agent Platform 是 GitLab 的 AI 能力：在规划、编码、安全分析和数据分析等环节提供专门的智能体，并用 flows 把多个智能体串成多步骤自动化，覆盖评审、测试、安全与流水线。"
checkedOn: 2026-10-11
sources:
  - https://about.gitlab.com/gitlab-duo/
verify:
  - "页面未显示价格（Contact sales）；60 天试用来自页面结构化数据；支持的 IDE 该页未写"
---

> 本文根据 GitLab 官网的 GitLab Duo 页面整理，资料核对于 2026-10-11。功能与计费以官网为准。

## 是什么

GitLab Duo 是 GitLab 给自家 AI 功能起的名字。核对时官网页面的主角是 **GitLab Duo Agent Platform**，介绍是「贯穿整个软件生命周期的 AI 编排」，并称它是「仓库这一侧的 AI，带着一次改动走完评审、测试、安全和流水线」。也就是说，它不只是在编辑器里帮你写代码，而是在代码提交之后的各个环节继续干活。

## 能做什么

官网页面介绍的内容：

- **专门的智能体**：分别面向规划、编码、安全分析和数据分析。页面举的例子有 Planner（规划）、Security Analyst（安全分析）、自动代码评审和流水线修复。
- **Flows**：把多个智能体串联起来，形成多步骤的自动化流程。
- **自定义智能体**：可以按团队需要自行构建。
- **Chat**：智能体式的对话，用于生成代码、编写测试和重构。
- **Code Suggestions**：导航里列出的代码建议功能，页面未展开介绍。

## 怎么上手

1. 确认所在的 GitLab 群组使用 Premium 或 Ultimate 方案；没有的话可以先申请 Ultimate 试用。
2. 由管理员按官方文档启用 Duo 相关功能并配置额度。
3. 在一个合并请求（Merge Request）上试用自动代码评审，或让智能体分析一条失败的流水线。
4. 熟悉后再把常见的重复工作配置成 flow。

具体的启用步骤和 IDE 插件以 GitLab 官方文档为准。

## 免费与付费

官网页面的说明：

- GitLab Duo Agent Platform 随 **Premium 和 Ultimate** 方案提供，用量按 **GitLab Credits** 计量。
- 页面没有显示具体价格，入口是「联系销售」。
- 可以免费试用 Ultimate（包含 Duo Agent Platform）60 天。

各方案价格与每点 Credits 的单价以 GitLab 定价页和销售报价为准。

## 适合谁 / 不适合谁

**适合：** 代码、CI/CD 和安全扫描都在 GitLab 上的研发团队；希望 AI 参与评审、修流水线而不只是写代码的团队；有自托管 GitLab 需求、想在同一平台内使用 AI 的企业（部署方式以官方为准）。

**不适合：** 代码托管在 GitHub 等其他平台的团队；使用 GitLab 免费版的个人；只想要一个编辑器内代码补全工具的开发者。

## 注意事项

- 按 Credits 计量意味着自动化跑得越多花费越高，先在少数项目上观察消耗。
- 让智能体自动修改流水线或提交代码前，保留人工评审与合并权限。
- GitLab Duo 的产品组合近期调整较多，老资料里的 Duo Pro、Duo Enterprise 等附加包与现在的说法可能不同，以官网为准。

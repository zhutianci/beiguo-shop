---
title: "Greptile 是什么、怎么用、价格多少：理解整个代码库的 AI PR 审查智能体"
slug: greptile-ai-pr-review-agent
name: Greptile
url: https://www.greptile.com/
pricing: 免费+付费
platforms: GitHub / GitLab（另有 MCP 与 Claude Code 插件）
trialNote: Starter 档免费（每月 50 点、1 名活跃开发者）；Pro 有 14 天试用
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "Greptile 用带完整代码库上下文的 AI 智能体审查并测试 Pull Request：先给仓库建图索引，再由多个智能体并行找问题，支持用自然语言写团队规则。"
checkedOn: 2026-10-11
sources:
  - https://www.greptile.com/
  - https://www.greptile.com/pricing
---

> 本文根据 Greptile 官网首页与定价页整理，资料核对于 2026-10-11。功能与价格以官网为准。

## 是什么

Greptile 是一款 AI 代码审查产品，官网的一句话介绍是：用了解整个代码库上下文的 AI 智能体来审查和测试 Pull Request。它的做法是先为仓库建立一张图索引，再让多个智能体并行检查每个 PR，把问题标注出来。

## 能做什么

官网列出的功能：

- **Custom Rules（自定义规则）**：用自然语言写下团队规范，在每个 PR 上执行。
- **Learning（学习）**：通过阅读团队成员以往的 PR 评论，逐渐掌握你们的编码习惯。
- **Fix in your IDE**：一键把问题上下文发给 Claude Code、Cursor、Codex 或 Devin 去修。
- **Greptile MCP**：让其他 AI 智能体读取 Greptile 的评论上下文。
- **Claude Code Plugin**：让 Claude Code 自动读取并处理 Greptile 的评论。
- **/greploop**：让编程智能体和 Greptile 反复迭代，直到问题解决。
- **TREX**（早期体验）：在沙箱里为每个 PR 编写并运行测试的智能体。
- **自托管部署**：可以部署在隔离网络的自有环境里；官网还提到 SOC 2 合规、SSO 和审计日志。

支持的代码托管平台是 GitHub 和 GitLab，企业版支持 GitHub Enterprise。

## 怎么上手

1. 在官网点「Start now」注册；官网也提供「让你的智能体来完成接入」的命令行引导文档。
2. 授权 GitHub 或 GitLab，选择要审查的仓库，等待索引完成。
3. 提一个 PR 看评审结果，再用自然语言补充团队规则。
4. 需要让编程智能体自动处理评论时，按文档配置 MCP 或 Claude Code 插件。

## 免费与付费

定价页（美元，2026-10 查询）：

| 方案 | 价格 | 要点 |
| --- | --- | --- |
| Starter | 免费 | 仓库不限，每月 50 点，1 名活跃开发者 |
| Pro | 30 美元/席位/月 | 可自定义规则、接入外部应用不限数量，14 天免费试用 |
| Enterprise | 定制 | 可自托管、SSO/SAML、GitHub Enterprise 支持 |

- 「席位」指该计费周期内有 PR 被 Greptile 审过的开发者。
- 审查分 Base、Plus、Apex 三种，分别消耗 1、3、10 点。
- 符合条件的非商业开源项目（OSI 认可的许可证）可免费使用；A 轮之前、近 12 个月收入低于 200 万美元的初创公司可享五折。

## 适合谁 / 不适合谁

**适合：** 代码库较大、希望审查能「看懂全局」而不只看 diff 的团队；已经在用 Claude Code、Cursor 等智能体，想把「审查—修复」串成闭环的开发者；开源维护者。

**不适合：** 使用 Bitbucket 等官网未列出的平台的团队；不走 PR 流程的项目；对代码外发有严格限制又没有自托管预算的团队。

## 注意事项

- 首次接入要给仓库建索引，大仓库需要等待。
- 点数会随审查档位快速消耗，免费档主要用于试用。
- 审查建议仅供参考，不能替代人工评审。

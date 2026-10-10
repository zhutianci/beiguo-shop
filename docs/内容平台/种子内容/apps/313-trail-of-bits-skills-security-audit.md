---
title: "trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）"
slug: trail-of-bits-skills-security-audit
name: trailofbits/skills（Trail of Bits 安全审计技能）
url: https://github.com/trailofbits/skills
pricing: 免费（CC BY-SA 4.0，署名并以相同方式共享）
platforms: Claude Code / Codex / ChatGPT 工作区市场
trialNote: "/plugin marketplace add trailofbits/skills"
products: [claude, codex]
models: [claude-llm, gpt]
topics: [agent-skills, coding]
excerpt: "trailofbits/skills 是安全公司 Trail of Bits 开源的 Claude Code 插件市场，40 多个插件覆盖代码审计、静态分析（CodeQL / Semgrep）、差异评审、供应链风险、误报核查和测试验证，Codex 也能直接加载。"
checkedOn: 2026-10-10
sources:
  - https://github.com/trailofbits/skills
  - https://github.com/trailofbits/skills/blob/HEAD/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/discover-plugins
  - https://creativecommons.org/licenses/by-sa/4.0/
  - https://agentskills.io/home
---

> 本文根据 trailofbits/skills 仓库 README、仓库内的插件市场清单和 Claude Code 官方文档整理，资料核对于 2026-10-10。本文只介绍用于审计和加固自己代码的用法。

## 是什么

Trail of Bits 是一家做安全审计和安全研究的公司。trailofbits/skills 是它开源的 Claude Code 插件市场，把这家公司做代码审计时的方法拆成一个个插件：怎么先读懂代码库、怎么跑静态分析、怎么评审一次改动、怎么判断一条告警是不是误报。README 的定位是增强 AI 辅助的安全分析、测试和开发流程，并说明 Codex 可以通过对 Claude 插件市场的兼容直接加载它。

对普通开发团队来说，它的价值在于把「上线前自查」做得更系统：让智能体按专业审计的步骤检查自己的仓库，而不是泛泛地问一句「这段代码安全吗」。

截至 2026-10-10，GitHub 显示该仓库 7455 Star、634 Fork，最近一次推送 2026-10-09。README 还设了一个 Trophy Case 栏目，用来登记借助这些技能发现的真实缺陷。

## 包含哪些 Skill

README 按类别列出 44 个插件，下面挑日常自查最用得上的（名称照原样）：

- **读懂代码**：`audit-context-building`——找问题之前先逐个函数理解代码库，把假设和依赖记到文件里；
- **静态分析**：`static-analysis`（CodeQL、Semgrep 与 SARIF 结果解析）、`semgrep-rule-creator`（为自己项目写检测规则）；
- **评审改动**：`differential-review`（结合 git 历史对代码变更做安全向评审）、`post-patch-validation`（补丁之后查漏掉的同类问题和回归）；
- **默认配置与危险接口**：`insecure-defaults`（查「出错时放行」这类不安全默认值）、`sharp-edges`（找容易用错的 API 和配置）；
- **依赖与流水线**：`supply-chain-risk-auditor`（审 npm、PyPI、Go 依赖的已知公告、弃更上游和安装脚本）、`agentic-actions-auditor`（审 GitHub Actions 工作流里与 AI 智能体相关的风险）；
- **减少误报**：`fp-check`（对疑似问题做系统的误报核查）、`vulnerability-triage-brocards`（对收到的问题报告做分诊）；
- **语言专项**：`c-review`、`rust-review`，以及密码学代码用的 `constant-time-analysis`、`zeroize-audit`；
- **测试与验证**：`property-based-testing`、`mutation-testing`、`spec-to-code-compliance`（核对代码与文档规格是否一致）；
- **开发辅助**：`modern-python`、`modern-cpp`、`devcontainer-setup`、`git-cleanup`、`open-sourcing`（开源前检查密钥、许可证和 CI）、`second-opinion`。

此外还有智能合约、移动端配置检查、调试信息分析等更专门的类别，按需了解。

## 怎么安装

**Claude Code**（在会话里输入）：

```text
/plugin marketplace add trailofbits/skills
```

然后浏览并安装需要的插件：

```text
/plugin menu
```

**Codex**（终端里执行）：

```sh
codex plugin marketplace add trailofbits/skills
codex plugin list
codex plugin add <plugin-name>@trailofbits
```

**ChatGPT 工作区市场**：README 说明可以用仓库里的 `.claude-plugin/marketplace.json` 做工作区导入。

不必全装。40 多个插件一起装会让技能列表变得很长，按手头的语言和任务挑三五个即可。

## 怎么用

插件装好后，其中的技能在任务匹配时自动加载，也可以在 Claude Code 里用 `/插件名:技能名` 手动调用。几种常见用法：

- 提交合并前：「对这个分支相对 main 的改动做一次安全向的差异评审」；
- 接手老项目：「先给这个仓库建立审计上下文，再告诉我最该关注的模块」；
- 依赖体检：「检查项目的 npm 依赖有没有已知公告和长期不维护的包」；
- 扫描之后：「用误报核查流程过一遍这几条告警」。

## 适合谁 / 不适合谁

**适合：**
- 想在发布前给自己的代码做一轮结构化安全自查的开发团队；
- 维护 C/C++、Rust、密码学相关代码或智能合约的工程师；
- 安全工程师和审计人员，把它当作流程和检查清单的参考。

**不适合：**
- 希望一键出「安全合格证」的人——它是辅助审计的方法和工具，结论仍需懂行的人判断；
- 没有安全基础、也看不懂告警的初学者，容易被大量输出淹没。

## 注意事项

- **许可证**：CC BY-SA 4.0（仓库 LICENSE 文件为 Attribution-ShareAlike 4.0 International）。可以使用和改编，但要署名；改编后再分发须沿用同一许可。这不是常见的软件开源许可，放进商业产品前先让法务看一眼。
- **维护状态**：最近一次推送 2026-10-09，更新活跃。
- **安全与授权**：只在你拥有或已获书面授权的代码和系统上使用。插件可以带脚本、hooks 并执行命令：按 README 描述，`gh-cli` 会拦截对 GitHub 地址的抓取并改走已登录的 `gh` 命令行，`second-opinion` 会把改动交给 Codex 或 Antigravity 做独立评审（代码会发往另一家模型），`git-cleanup` 涉及删除分支。安装前在插件详情里看清楚。
- **兼容性**：不少插件依赖本机已装好的外部工具（如 CodeQL、Semgrep、各类模糊测试和变异测试工具）；README 主要面向 Claude Code，Codex 靠兼容层加载。AI 审计会漏报也会误报，不能替代人工审计。

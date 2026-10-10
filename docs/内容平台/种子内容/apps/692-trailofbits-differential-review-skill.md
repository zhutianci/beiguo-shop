---
title: "differential-review skill 是什么、怎么安装使用：Trail of Bits 的代码改动安全评审 Skill（PR / diff 审计）"
slug: trailofbits-differential-review-skill
name: differential-review（trailofbits/skills）
url: https://github.com/trailofbits/skills/tree/main/plugins/differential-review/skills/differential-review
pricing: "免费（CC BY-SA 4.0，署名并以相同方式共享）"
platforms: "Claude Code / Codex"
trialNote: "`/plugin marketplace add trailofbits/skills` 然后 `/plugin menu`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "differential-review 是 Trail of Bits 的改动安全评审技能：对 PR、提交或 diff 做以安全为重点的审查，按代码库规模调整深度，用 git blame 取上下文、统计调用方估算影响面、检查改动代码的测试覆盖，并生成 Markdown 报告。"
checkedOn: 2026-10-11
sources:
  - https://github.com/trailofbits/skills/tree/main/plugins/differential-review/skills/differential-review
  - https://github.com/trailofbits/skills
  - https://creativecommons.org/licenses/by-sa/4.0/
---

> 本文根据 trailofbits/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 trailofbits/skills 在 GitHub 约 7462 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

多数安全问题不是一开始就在的，而是某次改动带进来的：一个被悄悄放宽的权限检查，一次「重构」把以前修好的漏洞又放了回来。differential-review 专门审「变化的部分」。它出自安全公司 Trail of Bits。`description`：对代码改动进行以安全为重点的差异评审；审查 PR、提交或 diff 的安全漏洞、检查改动是否重新引入了以前修复过的缺陷、追问这次改动还可能破坏什么，或找出哪些被修改的代码没有测试覆盖时使用。

五条核心原则：**风险优先**（聚焦认证、密码学、价值转移、外部调用）；**基于证据**（每个发现都要有 git 历史、行号和攻击场景支撑）；**自适应**（按代码库规模分小、中、大三档调整策略）；**诚实**（明确说明覆盖范围的局限和置信度）；**以产出为导向**（最后落成一份报告）。

具体手段包括：用 `git blame` 查被改代码的来历，判断是不是在动以前的修复；统计调用方数量来估算「爆炸半径」；检查被改动代码的测试覆盖。技能列出了触发高风险等级的条件、一棵决策树、三个场景示例（小 PR 快速分诊、中型代码库标准评审、关键改动深度审计），以及不该使用它的情形。

## 怎么安装

`differential-review` 在 trailofbits/skills 里属于 `differential-review` 插件。Claude Code 先登记市场，再在菜单里选择要装的插件（命令来自仓库 README）：

```text
/plugin marketplace add trailofbits/skills
/plugin menu
```

Codex 用 `codex plugin marketplace add trailofbits/skills`，再执行 `codex plugin add differential-review@trailofbits`。

仓库整体介绍和其他安装方式，详见本站《trailofbits/skills 是什么、怎么安装：Trail of Bits 的代码安全审计 Skills（静态分析、差异评审、供应链检查）》。

## 怎么用

- 「对这个 PR 做一次安全差异评审，报告写到 `review.md`」。
- 「这次提交改了登录逻辑，会不会把之前修的那个绕过问题带回来？」
- 「列出这次改动里没有任何测试覆盖的函数」。

目录里有方法论、常见模式、对抗性分析和报告格式四份配套文档。

## 适合谁 / 局限

适合处理认证、支付、权限等敏感代码的团队，在合并前加一道安全视角的检查。它是辅助人工的评审流程，技能自己强调要如实说明没看到的部分；它不运行动态测试，不能代替正式的安全审计。

## 注意事项

- **许可**：CC BY-SA 4.0——可以使用和改编，但须署名，改编后的技能要以相同许可共享；并入公司内部的专有技能库前留意这一点。
- **声明的工具权限**：Read、Write、Grep、Glob、Bash，会执行 git 等命令并写报告文件。
- 只对你有权审查的代码使用。

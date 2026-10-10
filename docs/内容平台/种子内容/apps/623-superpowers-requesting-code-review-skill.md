---
title: "requesting-code-review skill 是什么、怎么用：Superpowers 派子智能体做代码评审的 Skill"
slug: superpowers-requesting-code-review-skill
name: requesting-code-review（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/requesting-code-review
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "requesting-code-review 是 Superpowers 的评审技能：任务完成、大功能做完或合并前，派一个只拿到精确上下文的评审子智能体检查改动，问题按 Critical / Important / Minor 分级处理。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/requesting-code-review
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 24.7 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让写代码的那个会话自己评审自己，效果有限——它带着一路做过来的全部假设。requesting-code-review 的办法是另派一个子智能体当评审者，而且只给它精心准备的材料，**不给会话历史**。`description`：完成任务、实现主要功能时，或在合并之前，用它来核实工作是否符合要求。核心原则是「早评审、常评审」。

什么时候必须评审写得很清楚：子智能体驱动开发中每个任务之后、完成一个主要功能之后、合并进主干之前。另外三种情况属于「可选但有价值」：卡住的时候（换个新视角）、重构之前（先做基线检查）、修完一个复杂缺陷之后。

操作上分两步：先取这段工作起止的 git 提交号；再用目录里的 `code-reviewer.md` 模板填好占位信息（做了什么、计划或需求是什么、起止提交），派一个通用子智能体去审。结果按严重程度处理：Critical 立刻修，Important 在继续之前修，Minor 记下来以后处理。技能还提醒，如果评审意见有误，应该用技术理由反驳，而不是照单全收。

## 怎么安装

`requesting-code-review` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:requesting-code-review` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 「这个功能做完了，合并前做一次代码评审」。
- 「评审从 a1b2c3 到 HEAD 的改动，对照 docs 里的计划看有没有漏做的」。
- 在 Superpowers 的完整流程里无需手动触发，任务之间会自动安排。

## 适合谁 / 局限

适合独自开发、没有同事帮忙看代码的人，以及想在提交 PR 之前先过滤一轮低级问题的团队。评审者只看得到你给它的差异和说明，对业务背景的理解有限；它能发现逻辑漏洞、遗漏的需求和明显的质量问题，但不能替代熟悉系统的人做的架构评审，也不等于安全审计。

## 注意事项

- **许可**：MIT。
- **额外用量**：每次评审是一个新的子智能体上下文。
- **需要 git**：靠提交区间确定评审范围，未提交的改动要先提交或另行说明。
- 收到评审意见后怎么处理，是配套技能 receiving-code-review 的内容。

---
title: "interview-script skill 是什么、怎么安装使用：PM Skills 里的用户访谈提纲 Skill（遵循 The Mom Test）"
slug: pm-skills-interview-script-skill
name: interview-script（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/interview-script
pricing: "开源免费（MIT）"
platforms: "Claude Code / Claude Cowork / Codex CLI；Gemini CLI、Cursor 等仅技能部分"
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-product-discovery@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design]
excerpt: "interview-script 是 phuryn/pm-skills 里的用户访谈技能：按热身、核心探索、收尾三段生成访谈提纲，用待办任务（JTBD）式的追问挖掘过去的真实行为，遵循 The Mom Test——不诱导、不推销。"
checkedOn: 2026-10-11
sources:
  - https://github.com/phuryn/pm-skills/tree/main/pm-product-discovery/skills/interview-script
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 phuryn/pm-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 phuryn/pm-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

用户访谈最容易犯的错是带着答案去问：「如果有这个功能你会用吗？」对方出于礼貌说会，你带着虚假的信心回去开发。《The Mom Test》这本书讲的就是怎样避免这种情况。interview-script 把书里的原则做成了生成访谈提纲的技能。`description`：创建结构化的客户访谈脚本，包含 JTBD 式的追问以及热身、核心探索和收尾几个部分；遵循 The Mom Test 的原则——不问诱导性问题、不推销、聚焦过去的行为；在准备用户访谈、制作访谈指南或规划探索性调研时使用。

技能的开场白概括了它的取向：做一份能挖出真实洞察、而不只是收集意见的访谈脚本——**问他们的生活，而不是你的想法**。

「领域背景」里说明了访谈在整个流程中的位置：它是持续探索第一阶段（探索）的信息来源之一，其他来源还有干系人访谈、使用数据分析、问卷、市场趋势等。

产出的提纲分三段：**热身**（建立信任、了解背景）、**核心探索**（围绕对方最近一次遇到这个问题的具体经历追问：当时在做什么、怎么解决的、花了多少代价）、**收尾**（确认理解、请对方推荐其他可访谈的人）。

## 怎么安装

`interview-script` 属于 phuryn/pm-skills 市场里的 `pm-product-discovery` 插件。Claude Code 里（命令格式来自仓库 README）：

```bash
claude plugin marketplace add phuryn/pm-skills
claude plugin install pm-product-discovery@pm-skills
```

同一个插件里的其他技能和斜杠命令会一起装上。其他支持 Agent Skills 的工具，可以把仓库里的 `pm-product-discovery/skills/interview-script` 文件夹复制到对应的技能目录。

仓库整体介绍和其他安装方式，详见本站《PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）》。

## 怎么用

- 「我要访谈使用记账软件的小微企业主，了解他们月底对账的痛点，帮我写访谈提纲」。
- 「这是我原来的问题清单，哪些违反了 The Mom Test？改掉」。
- 访谈之后可以接同插件的 `summarize-interview` 整理记录。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合产品经理、用户研究员和早期创业者，尤其是第一次做用户访谈的人。提纲只是准备工作，访谈的质量更取决于现场的追问和倾听，这些没法由技能代劳；面向不同文化背景的受访者，问法和节奏需要自己调整。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 访谈涉及录音和个人信息时，事先征得受访者同意并妥善保管记录。

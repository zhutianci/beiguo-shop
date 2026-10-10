---
title: "prioritization-frameworks skill 是什么、怎么安装使用：PM Skills 里的 9 种需求优先级框架参考（RICE、ICE、Kano）"
slug: pm-skills-prioritization-frameworks-skill
name: prioritization-frameworks（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/prioritization-frameworks
pricing: "开源免费（MIT）"
platforms: "Claude Code / Claude Cowork / Codex CLI；Gemini CLI、Cursor 等仅技能部分"
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-execution@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design]
excerpt: "prioritization-frameworks 是 phuryn/pm-skills 里的优先级框架参考技能：收录 RICE、ICE、Kano、MoSCoW、机会评分等 9 种方法的公式、适用场景和模板，强调应该给「用户问题」排序，而不是给功能排序。"
checkedOn: 2026-10-11
sources:
  - https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/prioritization-frameworks
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 phuryn/pm-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 phuryn/pm-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

需求池里永远有做不完的事，排优先级的方法也五花八门，很多团队是听说哪个流行就用哪个。prioritization-frameworks 是一份带立场的参考手册。`description`：9 种优先级框架的参考指南，含公式、适用场景说明和模板——RICE、ICE、Kano、MoSCoW、机会评分等；在选择排序方法、比较 RICE 与 ICE 这类框架，或了解不同排序思路时使用。

它开篇就亮出核心原则：**永远不要让客户来设计解决方案；要排序的是问题（机会），而不是功能。**

内容结构：

- **机会评分**（Opportunity Score，出自 Dan Olsen 的 The Lean Product Playbook 一书）：被标为给客户问题排序时的推荐框架，依据的是「这个问题对用户有多重要」和「用户对现有方案有多满意」之间的差距；
- **ICE**：影响、信心、容易程度；
- **RICE**：在 ICE 的基础上加入触达范围；
- **9 种框架总览**：一张表对比各自适合什么情况；
- **模板**与延伸阅读。

## 怎么安装

`prioritization-frameworks` 属于 phuryn/pm-skills 市场里的 `pm-execution` 插件。Claude Code 里（命令格式来自仓库 README）：

```bash
claude plugin marketplace add phuryn/pm-skills
claude plugin install pm-execution@pm-skills
```

同一个插件里的其他技能和斜杠命令会一起装上。其他支持 Agent Skills 的工具，可以把仓库里的 `pm-execution/skills/prioritization-frameworks` 文件夹复制到对应的技能目录。

仓库整体介绍和其他安装方式，详见本站《PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）》。

## 怎么用

- 「我们有 30 条待办，团队只有 4 个人，该用哪种优先级方法？」
- 「RICE 和 ICE 有什么区别？各举一个适用的例子」。
- 「用机会评分给这 12 个用户问题排序，这是访谈里得到的重要度和满意度数据」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合产品经理和需要对需求池负责的团队负责人，也适合想系统了解这些方法的新人。框架算出来的分数依赖你填的估计值，估得随意，排序也就随意；它是参考型技能，不会替你收集数据或做决定。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 打分结果适合用来暴露分歧和对齐认知，不要当成无需讨论的结论。

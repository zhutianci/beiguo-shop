---
title: "pre-mortem skill 是什么、怎么安装使用：PM Skills 里的「事前验尸」风险分析 Skill（老虎、纸老虎、大象）"
slug: pm-skills-pre-mortem-skill
name: pre-mortem（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/pre-mortem
pricing: "开源免费（MIT）"
platforms: "Claude Code / Claude Cowork / Codex CLI；Gemini CLI、Cursor 等仅技能部分"
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-execution@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design, office]
excerpt: "pre-mortem 是 phuryn/pm-skills 里的发布前风险分析技能：假设产品发布已经失败，倒推原因，把风险分成真问题、被夸大的担忧和没人明说的隐忧三类，再判定哪些必须在发布前解决。"
checkedOn: 2026-10-11
sources:
  - https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/pre-mortem
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 phuryn/pm-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 phuryn/pm-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

项目评审会上大家通常报喜不报忧。「事前验尸」（pre-mortem）换了个问法：假设半年后这次发布彻底失败了，原因最可能是什么？因为是假设，人们更愿意把担心说出来。pre-mortem 技能让智能体扮演一位资深产品经理来主持这件事。`description`：对 PRD 或发布计划做事前验尸式的风险分析；把风险分为 Tigers（真实的问题）、Paper Tigers（被夸大的担忧）和 Elephants（没人说出口的隐忧），再归类为阻断发布、发布后尽快跟进或持续观察；在准备发布、给产品计划做压力测试或找出可能出错的地方时使用。

三种动物的比喻是这个方法的核心：

- **老虎**：真会咬人的问题，有证据支持；
- **纸老虎**：看着吓人、其实影响有限的担忧，不值得为它拖延；
- **大象**：房间里的大象——大家心里都知道、却没人愿意提的问题。

分类之后再按处理时机分三档：必须在发布前解决的、可以发布后马上跟进的、只需要持续跟踪的。对阻断发布的那几条，给出缓解方案。

## 怎么安装

`pre-mortem` 属于 phuryn/pm-skills 市场里的 `pm-execution` 插件。Claude Code 里（命令格式来自仓库 README）：

```bash
claude plugin marketplace add phuryn/pm-skills
claude plugin install pm-execution@pm-skills
```

同一个插件里的其他技能和斜杠命令会一起装上。其他支持 Agent Skills 的工具，可以把仓库里的 `pm-execution/skills/pre-mortem` 文件夹复制到对应的技能目录。

仓库整体介绍和其他安装方式，详见本站《PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）》。

## 怎么用

- 把 PRD 或发布计划交给它：「对这份上线方案做一次 pre-mortem」。
- 「只列出阻断发布的风险，每条给负责人和缓解动作」。
- 团队会议前先跑一遍，把结果当作讨论的起点，让成员补充它没想到的「大象」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合产品经理、项目负责人在重要发布前做最后一轮检查。它只能根据你给的文档推断风险，组织内部的真实隐忧——人手、依赖方、政治因素——文档里不会写，需要人来补；它也容易列出一长串通用风险，注意让它结合具体方案而不是泛泛而谈。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**：纯提示词型技能，接受你传入的文档作为参数。
- 风险清单不是免责声明，判定为「可以后续跟进」的事项要真的排进计划。

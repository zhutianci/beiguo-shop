---
title: "north-star-metric skill 是什么、怎么安装使用：PM Skills 里帮你定北极星指标的 Skill（三类业务、七条标准）"
slug: pm-skills-north-star-metric-skill
name: north-star-metric（phuryn/pm-skills）
url: https://github.com/phuryn/pm-skills/tree/main/pm-marketing-growth/skills/north-star-metric
pricing: "开源免费（MIT）"
platforms: "Claude Code / Claude Cowork / Codex CLI；Gemini CLI、Cursor 等仅技能部分"
trialNote: "`claude plugin marketplace add phuryn/pm-skills` 然后 `claude plugin install pm-marketing-growth@pm-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design, marketing]
excerpt: "north-star-metric 是 phuryn/pm-skills 里的指标技能：先判断业务属于注意力、交易还是生产力哪一类，再确定一个北极星指标和 3 到 5 个输入指标，并按七条标准检验它是否合格。"
checkedOn: 2026-10-11
sources:
  - https://github.com/phuryn/pm-skills/tree/main/pm-marketing-growth/skills/north-star-metric
  - https://github.com/phuryn/pm-skills
  - https://code.claude.com/docs/en/discover-plugins
---

> 本文根据 phuryn/pm-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 phuryn/pm-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「北极星指标」的说法很流行，但很多团队选出来的其实是收入、注册数这类不合格的指标。north-star-metric 技能带着你按方法来。`description`：定义一个北极星指标和 3 到 5 个支撑它的输入指标，组成一个「指标星座」；对业务所处的类型（注意力、交易、生产力）做分类，并按有效北极星指标的 7 条标准进行验证；在选择北极星指标、搭建指标体系、了解北极星框架或决定该衡量什么时使用。

技能的「领域背景」一节先讲北极星指标**不是**什么：不是多个指标，也不是收入或用户生命周期价值这类指标——它衡量的应该是用户获得的价值。

接着是**三类业务**的划分：

- **注意力型**：价值来自用户投入的时间（内容、社交类产品）；
- **交易型**：价值来自完成的交易（电商、平台类）；
- **生产力型**：价值来自用户更高效地完成任务（工具、软件类）。

不同类型对应不同形态的指标。确定候选指标后，逐条用七个标准检验，再拆出 3 到 5 个团队可以直接影响的输入指标。

## 怎么安装

`north-star-metric` 属于 phuryn/pm-skills 市场里的 `pm-marketing-growth` 插件。Claude Code 里（命令格式来自仓库 README）：

```bash
claude plugin marketplace add phuryn/pm-skills
claude plugin install pm-marketing-growth@pm-skills
```

同一个插件里的其他技能和斜杠命令会一起装上。其他支持 Agent Skills 的工具，可以把仓库里的 `pm-marketing-growth/skills/north-star-metric` 文件夹复制到对应的技能目录。

仓库整体介绍和其他安装方式，详见本站《PM Skills 是什么、怎么安装使用：产品经理 Skill 市场（需求探索、PRD、路线图、上市计划）》。

## 怎么用

- 「我们是做在线文档协作的，帮我确定北极星指标和输入指标」。
- 「我们现在用月活当北极星，按七条标准看看它合不合格」。
- 「把输入指标对应到产品、增长、客服三个团队各自能影响的部分」。

这个技能只有一份 SKILL.md，主体是一段结构化的提示词。

## 适合谁 / 局限

适合产品负责人、增长负责人和创业团队在梳理指标体系时使用。它依据你对业务的描述来推理，不接触真实数据，无法验证候选指标与长期留存、收入之间是否真的相关——这一步要靠数据分析；指标定下来之后的埋点和看板也不在它的范围内。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 北极星指标是团队共识的产物，让它出方案只是起点，最终要和关键成员一起讨论确定。

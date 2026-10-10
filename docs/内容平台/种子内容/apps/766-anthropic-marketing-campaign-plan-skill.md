---
title: "campaign-plan skill 是什么、怎么安装使用：让 Claude 把一个营销目标写成完整的活动方案和内容日历"
slug: anthropic-marketing-campaign-plan-skill
name: campaign-plan（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/marketing/skills/campaign-plan
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install marketing@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, marketing, office]
excerpt: "campaign-plan 是 Anthropic 开源的 marketing 插件里的技能：先问清目标、受众、时间和预算，再生成包含概述、受众、核心信息、渠道策略、逐周内容日历、内容清单、成功指标、预算分配和风险的十段式营销活动简报。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/marketing/skills/campaign-plan
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「下个月要推新功能，出个方案」——这种任务最费时间的不是想法，而是把想法排成一份别人能照着执行的文档。campaign-plan 给 Claude 一套固定的方案结构。`description`：生成完整的营销活动简报，包含目标、受众、信息、渠道策略、内容日历和成功指标；在策划产品发布、获客推广或品牌认知活动，需要带依赖关系的逐周内容日历，或者要把一个营销目标转成结构化、可执行的计划时使用。

**先收集输入**。缺了就先问，不硬编：活动目标（拉新、提升认知、发布产品、获取线索、召回流失用户等）、目标受众、时间线和固定日期、预算范围（可选；没有就出一份不依赖预算的方案，并标出哪里会受预算影响），以及产品、差异点、历史活动效果、品牌约束、地域等补充信息。

**简报十个部分**：

1. 活动概述——名称建议、一句话摘要、一个具体可衡量的主目标；
2. 目标受众；
3. 核心信息；
4. 渠道策略——每个渠道说明为什么适合、内容形式、投入程度，按自有、赢得、付费渠道分类考虑；
5. 内容日历——按周（短期活动按天）列出产出什么、发在哪、里程碑，以及内容之间的依赖，例如「落地页必须先上线，付费广告才能开投」；
6. 需要制作的内容清单；
7. 成功指标；
8. 预算分配（给了预算才有）；
9. 风险与应对；
10. 下一步。

后半部分是策划参考：目标—受众—信息—渠道—衡量的框架、渠道选择指南、内容日历的排法、预算分配思路，以及不同活动类型该看哪些指标。

## 怎么安装

`campaign-plan` 属于 anthropics/knowledge-work-plugins 的 `marketing` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install marketing@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/marketing:campaign-plan` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- 「/campaign-plan 下个月上线团队协作功能，目标是让现有免费用户升级」。
- 「预算五万，六周时间，面向中小电商卖家做一轮获客，出方案」。
- 「把这份方案的内容日历单独拉成表格，标出每项的负责人和依赖」。

SKILL.md 开头提示：文中带 `~~` 的占位符代表可连接的外部工具，没有连接时它按你提供的信息工作。

## 适合谁 / 局限

适合小团队的市场负责人和身兼营销的创业者，用来快速出第一版方案。局限：渠道建议以海外常见渠道为框架，做国内市场要自己换成对应的平台；它不知道你的真实投放数据，指标目标和预算比例只是起点；方案写得再完整，也替代不了对受众的实际了解。

## 注意事项

- **许可**：Apache-2.0。
- **不带脚本**：只有一份 SKILL.md；是否读取外部数据取决于你给插件连接了哪些工具。
- 生成的方案属于草稿，对外承诺的日期和数字要经过内部确认。

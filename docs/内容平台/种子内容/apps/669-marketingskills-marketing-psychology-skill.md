---
title: "marketing-psychology skill 是什么、怎么安装使用：把心理学与思维模型用到营销上的 Skill"
slug: marketingskills-marketing-psychology-skill
name: marketing-psychology（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/marketing-psychology
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill marketing-psychology"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing]
excerpt: "marketing-psychology 是 marketingskills 里的思维模型技能：收录第一性原理、待办任务理论、锚定、社会认同、损失厌恶、稀缺等数十个心理学原理与思维模型，并说明如何合乎道德地用于营销决策。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/marketing-psychology
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 15.6 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

很多营销手法背后是同一批心理学原理，只是从业者未必说得出名字，也就很难举一反三。marketing-psychology 是一本给智能体用的「原理手册」。`description`：用户想把心理学原理、思维模型或行为科学应用到营销中时使用；提到心理学、认知偏差、说服、行为科学、「人为什么会买」、决策、消费者行为、锚定、社会认同、稀缺、损失厌恶、框架效应、助推等都会触发。具体到页面优化、定价策略、文案措辞，它会分别指向同库的 cro、pricing、copywriting。

技能对自己的定位包含「合乎道德地影响行为」这一条。内容分几大组：

- **基础思维模型**：第一性原理、待办任务（Jobs to Be Done）、逆向思考、奥卡姆剃刀、二八法则、约束理论、机会成本、二阶思维等，用来做营销决策本身；
- **理解买家与人的心理**：曝光效应、可得性启发、确认偏误、禀赋效应、宜家效应、零价格效应、现时偏好、现状偏见等；
- 以及影响与说服、定价心理等后续章节。

每个模型给出含义和在营销里的用法。这是一份很长的单文件技能，没有附带参考文件。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill marketing-psychology product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「我们的免费试用转付费率很低，从行为心理学角度分析可能的原因和对策」。
- 「解释锚定效应，并给我三个可以用在定价页上的合规做法」。
- 「用逆向思考帮我想想这次发布最可能怎么失败」。

## 适合谁 / 局限

适合想系统理解用户决策的产品、增长和营销人员，也适合当作头脑风暴的启发工具。它提供的是原理和方向，不是经过你自己用户验证的结论——同一个原理在不同人群里的效果差别很大，落地前要做实验；心理学研究里有些效应的可重复性本身存在争议。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- **守住底线**：虚假的稀缺、伪造的评价、诱导性的默认勾选等做法在很多地区违反广告与消费者保护法规，原理是用来把真实价值讲清楚的，不是用来误导。

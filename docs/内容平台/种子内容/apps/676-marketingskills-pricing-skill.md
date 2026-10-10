---
title: "pricing skill 是什么、怎么安装使用：帮 SaaS 定价、设计套餐和审计定价页的营销 Skill"
slug: marketingskills-pricing-skill
name: pricing（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/pricing
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill pricing"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, product-design]
excerpt: "pricing 是 marketingskills 里的定价策略技能：围绕打包内容、计价指标和价格水平三个维度帮你做定价与打包决策，涵盖初次定价、Van Westendorp 等调研方法、何时涨价以及定价页的写法与审计。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/pricing
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.1 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「该收多少钱」是创业者最没把握的决定之一，多数人拍一个数就再也不动。pricing 技能提供了一套结构化的思考方式。它面向 SaaS 定价与变现，目标是设计出能捕获价值、推动增长并符合客户付费意愿的价格。`description`：用户需要定价决策、打包或变现策略方面的帮助时使用；提到定价层级、免费增值、免费试用、涨价、价值指标、付费意愿、「我该收多少」「年付还是月付」「按席位收费」「要不要做免费版」，或想审计定价页时都会触发。应用内的升级界面由 paywalls 负责，服务、课程类的报价设计由 offers 负责。

开始前先了解四点：业务背景、价值与竞争、当前表现、目标。

主要内容：

- **定价的三个维度**（各档包含什么、按什么计价、收多少）与基于价值的定价；
- **初次定价**的几条经验法则；
- **价值指标**：是什么、常见的有哪些、怎么选；
- **套餐结构**：「好—更好—最好」三档框架与各档如何区分；
- **定价调研**：Van Westendorp 价格敏感度方法、MaxDiff 分析；
- **什么时候该涨价**、涨价策略和推出步骤；
- **定价页最佳实践**，包括让定价页对 AI 智能体也「读得懂」——描述里提到，现在替用户筛选工具的可能是 AI。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill pricing product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「我们是做团队知识库的，现在只有一个按席位的套餐，帮我设计三档方案」。
- 「打算给老用户涨价 20%，怎么沟通和分步执行？」
- 「拆解一下我们的定价页，指出问题」。

目录里有四份参考：定价模型、定价页拆解、调研方法、套餐结构。

## 适合谁 / 局限

适合 SaaS 创始人和产品、增长负责人。它提供的是框架与问题清单，不掌握你的成本和客户数据，更不是财务或法律意见；面向消费者的硬件、电商定价不是它的主场。本文不转述技能里的具体价格数字。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；拆解竞品定价页时会联网。
- 价格调整涉及合同、消费者保护与税务，正式执行前请与相关专业人士确认。

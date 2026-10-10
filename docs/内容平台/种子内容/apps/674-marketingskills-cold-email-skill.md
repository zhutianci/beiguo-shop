---
title: "cold-email skill 是什么、怎么安装使用：写 B2B 陌生开发邮件与跟进序列的营销 Skill"
slug: marketingskills-cold-email-skill
name: cold-email（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/cold-email
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill cold-email"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, copywriting]
excerpt: "cold-email 是 marketingskills 里的陌生开发技能：教智能体写像同行而非销售的 B2B 开发信与跟进序列，并覆盖发信域名与送达率、LinkedIn 与多渠道节奏、回复处理，要求先验证名单、对方回复后停止所有触达。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/cold-email
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 12.0 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

B2B 陌生开发邮件的回复率普遍很低，原因通常是一样的：模板味太重，通篇在讲自己。cold-email 技能给自己定的目标是写出「像一个敏锐、体贴的人写的，而不是销售机器按模板生成的」邮件，并且保证邮件进得了收件箱、与其他渠道配合、最终把回复变成会议。`description`：撰写和执行能获得回复的 B2B 陌生开发，从首封邮件和跟进，到发信设置、LinkedIn、多渠道节奏与回复处理；提到 cold email、外联、SDR 邮件、跟进序列、「没人回复」、送达率、发信域名、预热邮箱等都会触发。

描述里直接嵌了四条操作纪律：**用次级域名发信、先验证名单、关闭打开追踪、对方一回复就停掉所有渠道的触达。**

写作原则五条：像同行而不是供应商那样写；每句话都要有存在的理由；个性化必须和对方的问题挂钩；从对方的世界讲起，而不是自己的；只提一个低门槛的请求。之后依次是语气、结构、标题行、跟进序列、发送前检查、邮件之外的渠道、对方回复之后怎么做、质量检查和应避免的做法。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill cold-email product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「给使用 Shopify 的独立站品牌写一封介绍我们物流工具的开发信，再配三封跟进」。
- 「这是我现在的模板，回复率不到 1%，帮我诊断」。
- 「对方回复说『现在不是时候』，该怎么回？」

目录里有十份参考：基准数据、送达率、跟进序列、框架、LinkedIn 外联、多渠道节奏、打法、个性化、回复处理、标题行。

## 适合谁 / 局限

适合做 B2B 销售开发的创业者和销售团队。它只负责策略和文案，找客户名单和账户研究在同库的 prospecting 技能里，实际发信要靠你自己的邮件工具；内容以英文市场的习惯为准。

## 注意事项

- **许可**：MIT。
- **合规第一**：向陌生人群发商业邮件在各地受到不同法规约束（如欧盟的 GDPR、美国的 CAN-SPAM，国内也有相关规定），必须提供退订方式、使用合法来源的名单；在很多地区，向个人邮箱群发未经同意的营销邮件本身就是违规的。
- **不执行脚本**；它不会替你发送任何邮件。
- 技能引用的行业基准数字来自作者的汇总，仅供参考。

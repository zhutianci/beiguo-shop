---
title: "copywriting skill 是什么、怎么安装使用：写落地页、首页、定价页文案的营销 Skill（明确禁止 AI 腔）"
slug: marketingskills-copywriting-skill
name: copywriting（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill copywriting"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, copywriting, marketing]
excerpt: "copywriting 是 marketingskills 里的转化文案技能：先弄清页面目的、受众和产品，再按「清晰优先、利益先于功能、具体胜过含糊」的原则写首页、落地页、定价页等文案，并列出不许出现的 AI 腔句式。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 22.1 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让大模型写落地页文案，它给你的多半是「不只是 X，更是 Y」「无需 A、无需 B、无需 C」这种一眼能认出的套路。copywriting 技能一边教正经的转化文案方法，一边把这些句式明令禁止。`description`：用户想为任何页面撰写、重写或改进营销文案时使用——首页、落地页、定价页、功能页、关于页、产品页；提到标题、行动按钮文案、价值主张、标语、首屏文案，或者抱怨「这文案太弱」「听着像 AI 写的」时都会触发。描述里直接写明：草稿绝不使用那几类 AI 痕迹明显的句式。

动笔之前它要先确认四件事：页面目的、受众、产品与报价、上下文。然后遵循五条原则：清晰胜过巧妙、利益先于功能、具体胜过含糊、用客户的语言而不是公司的语言、每个区块只讲一个观点。

「不要 AI 腔」是单独的一大节：哪些写法绝不能出现、哪些只能偶尔用、交付前自查什么。再往后是页面结构框架（首屏、核心区块、行动按钮文案）和针对各类页面的具体建议。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill copywriting product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「给我们的记账 App 写首页首屏文案，给三个标题方向」。
- 「重写这个定价页，现在读着太像功能列表」。
- 「这段介绍 AI 味太重，改得像人写的」。

目录里有三份参考：AI 痕迹清单、文案框架、自然过渡用语。

## 适合谁 / 局限

适合自己写官网和落地页的创业者、独立开发者和市场人员。方法论来自英文 SaaS 营销语境，中文文案的节奏和用词习惯不同，产出需要再按中文表达润一遍；文案只能放大产品本身的价值，定位没想清楚时，先用同库的 product-marketing 把背景写下来。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**。
- 文案里的数据、客户评价和承诺必须真实，技能不会替你核实，广告合规由发布者负责。

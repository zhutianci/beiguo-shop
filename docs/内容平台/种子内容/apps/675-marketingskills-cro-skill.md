---
title: "cro skill 是什么、怎么安装使用：诊断落地页为什么不转化的营销 Skill（转化率优化）"
slug: marketingskills-cro-skill
name: cro（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/cro
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill cro"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, product-design]
excerpt: "cro 是 marketingskills 里的转化率优化技能：按价值主张、标题、行动按钮、视觉层级、信任信号、异议处理、摩擦点七个维度分析营销页面和表单，输出速赢项、高影响改动、测试想法和备选文案。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/cro
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 8.1 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

页面有流量但没人注册，问题出在哪？cro 技能让智能体像转化率优化顾问那样看一个页面。`description`：用户想优化或提升任何营销页面或表单的转化时使用——首页、落地页、定价页、功能页、线索表单、联系表单；说出「这个页面不转化」「为什么这页没效果」「表单流失」之类的话，甚至只是丢来一个网址要反馈，都会触发。注册流程、注册后的激活、弹窗分别由同库的 signup、onboarding、popups 负责。

分析框架是七个维度，按影响排序：

1. **价值主张是否清晰**（影响最大）；
2. **标题是否有效**；
3. **行动按钮**的位置、文案和层级；
4. **视觉层级与可扫读性**；
5. **信任信号与社会认同**；
6. **异议处理**；
7. **摩擦点**。

输出有固定格式：现在就能做的速赢项、需要优先安排的高影响改动、值得做 A/B 测试的想法、可直接替换的备选文案。不同页面类型（首页、落地页、定价页、功能页、博客文章）各有一套侧重点。技能开头有一张「参考路由」表：涉及表单优化或实验设计时，先加载对应的参考文件再给建议。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill cro product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「看看 https://example.com/pricing ，告诉我为什么转化低」。
- 「我们的演示预约表单有 9 个字段，帮我精简并说明理由」。
- 「给这个落地页列 5 个值得测试的假设，按预期影响排序」。

目录里有两份参考：实验想法、表单优化。

## 适合谁 / 局限

适合负责官网和落地页的增长、市场人员和独立开发者。它给的是基于经验法则的诊断，没有你的真实数据——热图、漏斗、访谈才能告诉你用户实际卡在哪；建议最终要靠实验验证，流量太小的页面做 A/B 测试也得不出可靠结论。

## 注意事项

- **许可**：MIT。
- **会联网访问你给的页面**；在代码仓库里使用时可以直接改页面。
- 提升转化不等于使用误导性设计，倒计时造假、隐藏费用之类的做法不要采纳。

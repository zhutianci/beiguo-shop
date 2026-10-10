---
title: "content-strategy skill 是什么、怎么安装使用：规划「写什么内容」的营销 Skill（内容支柱、主题集群、编辑日历）"
slug: marketingskills-content-strategy-skill
name: content-strategy（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/content-strategy
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill content-strategy"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, social-media]
excerpt: "content-strategy 是 marketingskills 里的内容规划技能：先了解业务、客户和现状，把内容分成「可被搜索到的」和「值得被分享的」两类，再确定内容支柱、主题集群和按购买阶段划分的选题。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/content-strategy
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 15.4 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「我不知道该写什么」是内容营销最常见的卡点。content-strategy 不负责写单篇文章，它负责回答更上游的问题。`description`：用户想规划内容策略、决定创作什么内容或弄清该覆盖哪些主题时使用；提到内容策略、博客策略、主题集群、内容规划、编辑日历、内容支柱，或直接说「我不知道写什么」都会触发。写单篇内容、SEO 审计、社交媒体内容分别由同库的其他技能负责。

规划之前，它要先了解四方面：业务背景、客户研究、现状、竞争格局。核心框架有三层：

- **把内容当产品做**；
- **可搜索 vs 可分享**：一类内容靠搜索获得持续流量，另一类靠观点、数据和故事被转发；两类的写法不同，也有能兼得的；
- **内容支柱与主题集群**：怎样确定支柱、支柱的结构和判断标准。

选题方面，它按购买阶段做关键词研究（认知、考虑、决策、实施），并列出六类灵感来源：关键词数据、销售通话记录、问卷回答、论坛调研、竞品分析、销售与客服的反馈。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill content-strategy product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「我们做面向小团队的项目管理工具，帮我规划未来三个月的博客内容」。
- 「这是 20 条客户访谈摘要，从里面提炼内容选题」。
- 「把这些选题按内容支柱归类，并标出哪些是搜索型、哪些是分享型」。

目录里有两份参考：内容分发、无头 CMS 的选择。

## 适合谁 / 局限

适合刚开始做内容营销的创业团队，以及内容产出不少但缺乏主线的市场部门。它没有接入关键词工具，搜索量和竞争度需要你提供数据或自行验证；策略出来之后的持续产出和分发才是难点，技能替代不了执行。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；让它调研竞品或论坛时会联网。
- 把客户通话记录、访谈内容交给它之前，先去掉个人信息并确认符合公司的数据规定。

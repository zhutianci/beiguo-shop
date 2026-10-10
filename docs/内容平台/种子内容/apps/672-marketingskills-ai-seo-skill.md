---
title: "ai-seo skill 是什么、怎么安装使用：让内容被 ChatGPT、Perplexity、AI Overviews 引用的 GEO / AEO Skill"
slug: marketingskills-ai-seo-skill
name: ai-seo（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/ai-seo
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill ai-seo"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing]
excerpt: "ai-seo 是 marketingskills 里的 AI 搜索优化技能：先做 AI 可见度审计，再从「结构、权威、存在」三个支柱优化内容，使其更容易被 AI 搜索抓取、提取和引用，并涵盖 llms.txt 等面向智能体的机器可读文件。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/ai-seo
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 14.0 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

越来越多的人直接问 AI 而不是翻搜索结果，品牌能不能出现在 AI 的回答里成了新问题，业内叫 GEO、AEO 或 LLMO。ai-seo 是这方面的操作指南。它把目标定义为：让内容能被各类 AI 系统发现、提取和引用，包括 Google 的 AI Overviews、ChatGPT、Perplexity、Claude、Gemini 和 Copilot。`description` 的触发词很多：AI SEO、AEO、GEO、「怎样出现在 AI 的回答里」、AI 引用、零点击搜索、`llms.txt`、「我的网站对智能体友好吗」等。

开始之前先了解四点：当前的 AI 可见度、内容与域名情况、目标、竞争格局。然后讲 AI 搜索的工作方式和它与传统 SEO 的关键差别。

**AI 可见度审计**四步：检查关键问题下 AI 的回答里有没有你 → 分析引用模式 → 检查内容是否容易被提取 → 检查 AI 爬虫能否访问你的网站。

**优化策略三支柱**：结构（让内容可被提取）、权威（让内容值得被引用）、存在（出现在 AI 会去看的地方）。此外还有面向智能体的机器可读文件、结构化数据等章节。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill ai-seo product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「审计我们网站的 AI 可见度：这 10 个问题下各家 AI 有没有提到我们」。
- 「把这篇功能介绍改写得更容易被 AI 摘录引用」。
- 「我们需要 llms.txt 吗？帮我起草一份」。

目录里有十份参考，包括各平台的排名因素、内容模式、引用与推荐的区别、格式变动、智能体就绪度等。

## 适合谁 / 局限

适合已有一定内容基础、想在 AI 搜索里争取曝光的品牌和内容团队。这是一个变化极快、缺乏公开标准的领域——各家 AI 的引用机制并不透明，技能里的结论来自作者的观察与汇总，版本号更新很频繁，应当作阶段性经验而不是定论；检查 AI 的回答有随机性，单次结果不能说明问题。

## 注意事项

- **许可**：MIT。
- **会联网**：审计时要访问你的网站并查询公开信息。
- 技能主要基于海外 AI 产品的情况，国内的豆包、Kimi、DeepSeek 等产品的信息源和引用方式需要另行观察。
- 不要为了被引用而编造数据或伪造第三方评价。

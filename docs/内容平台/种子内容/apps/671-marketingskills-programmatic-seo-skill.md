---
title: "programmatic-seo skill 是什么、怎么安装使用：用模板加数据批量生成 SEO 页面的营销 Skill（pSEO）"
slug: marketingskills-programmatic-seo-skill
name: programmatic-seo（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/programmatic-seo
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill programmatic-seo"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing, coding]
excerpt: "programmatic-seo 是 marketingskills 里的程序化 SEO 技能：指导用模板和数据批量创建面向不同关键词或地区的页面，强调每页要有独特价值、避免薄内容处罚，内含 12 种打法和上线前后的质量检查。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/programmatic-seo
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 14.2 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

程序化 SEO（pSEO）指用一套模板加一份数据，批量生成成百上千个页面去覆盖长尾关键词，比如「某工具 + 某集成」「某服务 + 某城市」「A 与 B 对比」。做好了是稳定的流量来源，做坏了就是一堆会被搜索引擎判为低质的薄页面。programmatic-seo 技能的目标写得很直白：做出能排名、有价值、并且避开薄内容处罚的页面。`description`：用户想用模板和数据大规模创建 SEO 页面时使用；提到 pSEO、模板页、目录页、地区页、对比页、集成页、「生成 100 个页面」等都会触发。

六条核心原则排在最前：每个页面要有独特价值；自有数据最有优势；URL 结构干净；真正匹配搜索意图；质量重于数量；避免被搜索引擎处罚。

接着是 **12 种打法**的概览和选择方法（详情在参考文件里），以及六步实施框架：关键词模式研究 → 数据需求 → 模板设计 → 内链架构 → 收录策略 → 选择搭建平台。质量检查分上线前清单和上线后监控，并列出常见错误。产出物是一份策略文档加页面模板。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill programmatic-seo product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「我们的工具支持 80 个第三方集成，帮我规划一组集成落地页」。
- 「评估一下『城市 + 服务』这种页面对我们是否值得做，需要什么数据」。
- 「这是模板草稿，检查它会不会被判成薄内容」。

目录里有两份参考：打法详解、实现平台的选择。

## 适合谁 / 局限

适合手里有结构化数据（产品目录、集成列表、地点库、行业数据）的 SaaS、市场平台和内容站。没有独特数据、只想靠 AI 批量改写凑页面的做法，正是技能反复警告的反面教材；页面上线后的收录与排名需要数月观察，不是装了技能就见效。

## 注意事项

- **许可**：MIT。
- **不执行脚本**；实际生成页面的代码由智能体在你的项目里编写。
- **平台规则**：搜索引擎对大规模低质量生成内容有明确的反滥用政策，先小批量上线、观察收录质量，再决定是否扩大。

---
title: "seo-audit skill 是什么、怎么安装使用：让 Claude Code 给网站做 SEO 体检的营销 Skill"
slug: marketingskills-seo-audit-skill
name: seo-audit（coreyhaines31/marketingskills）
url: https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Windsurf / claude.ai（ZIP 上传）"
trialNote: "npx skills add coreyhaines31/marketingskills --skill seo-audit"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, marketing]
excerpt: "seo-audit 是 marketingskills 里安装量最高的技能：按「可抓取与收录 → 技术基础 → 页面优化 → 内容质量 → 权威度」的优先级审计网站，覆盖多语言站点、本地 SEO 和不同类型网站的常见问题，输出可执行的修复清单。"
checkedOn: 2026-10-11
sources:
  - https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit
  - https://github.com/coreyhaines31/marketingskills
  - https://github.com/vercel-labs/skills
---

> 本文根据 coreyhaines31/marketingskills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 22.4 万次；所在仓库 coreyhaines31/marketingskills 在 GitHub 约 5.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「网站没流量」的原因可能在十几个层面，新手往往从最不重要的地方改起。seo-audit 给智能体一套有先后顺序的审计框架。`description`：用户想审计、评审或诊断网站的 SEO 问题时使用；提到技术 SEO、「为什么没排名」、流量下跌、收录问题、Core Web Vitals、卡在第二页、标题重写、点击率低、本地 SEO 等都会触发，哪怕只是一句含糊的「我的 SEO 很差」，也从审计开始。批量建页面、结构化数据、AI 搜索优化则分别指向同库的其他技能。

审计框架分两大块。**技术审计**：可抓取性、收录、速度与 Core Web Vitals，以及多语言站点的规范化、国际站点地图和地区 URL 结构。**页面审计**：标题、描述、标题层级、内容优化、图片、内链、关键词定位，再加内容质量评估（E-E-A-T 信号、内容深度、用户参与）。后面按网站类型列出常见问题——SaaS 产品站、电商、内容博客、多语言站、本地商家。

技能里有一条值得注意的自我提醒：通过抓取页面的方式**检测不到由脚本注入的结构化数据**，所以不能据此断言「没有 Schema」。

## 怎么安装

仓库 README 支持用 `--skill` 只装指定的技能：

```bash
npx skills add coreyhaines31/marketingskills --skill seo-audit product-marketing
```

这里顺带装上了 `product-marketing`：README 说明它是整个库的基础，其他技能动手前都会先读它生成的产品背景文件（`.agents/product-marketing.md`），了解你的产品、受众和定位，有了它就不必每次重复回答同样的问题。Claude Code 也可以整库安装：`/plugin marketplace add coreyhaines31/marketingskills` 后 `/plugin install marketing-skills`。

仓库整体介绍和其他安装方式，详见本站《marketingskills 是什么、怎么安装使用：Corey Haines 的营销 Skill 库（CRO、文案、SEO、投放、邮件）》。

## 怎么用

- 「审计 https://example.com 的 SEO，按优先级给我修复清单」。
- 「上个月自然流量掉了三成，帮我排查可能的原因」。
- 在网站代码仓库里使用时，它可以直接检查模板里的标题、描述、规范链接和站点地图生成逻辑。

目录里有七份参考：国际 SEO、本地 SEO（三份）、标题标签、排名冲刺、AI 写作痕迹识别。

## 适合谁 / 局限

适合独立开发者、小团队的增长负责人，没有预算请 SEO 顾问时先自查一轮。它没有接入搜索引擎后台和第三方关键词工具的数据，看不到真实排名与外链，结论基于页面本身和你提供的数据；竞争激烈的词能否上去，不是修完清单就有保证的。

## 注意事项

- **许可**：MIT。
- **会联网抓取你指定的页面**；只审计你有权处理的网站。
- 技能内容面向以 Google 为主的英文搜索生态，做百度等国内搜索引擎时规则有差别，需要自行取舍。

---
title: "Claude SEO 是什么、怎么安装使用：Claude Code 里的 SEO 审计插件（/seo audit、Schema、AI 搜索优化）"
slug: claude-seo-agricidaniel-skill
name: Claude SEO（AgriciDaniel/claude-seo）
url: https://github.com/AgriciDaniel/claude-seo
pricing: "开源免费（MIT）；可选的第三方数据接口另计"
platforms: "Claude Code（插件，需 1.0.33 以上）；需 Python 3.10+"
trialNote: "\"`/plugin marketplace add AgriciDaniel/claude-seo` 然后 `/plugin install claude-seo@agricidaniel-claude-seo`\""
products: [claude]
models: [claude-llm]
topics: [agent-skills, marketing, coding]
excerpt: "Claude SEO 是面向 Claude Code 的开源 SEO 分析插件：26 个子技能加 19 个专职子智能体并行工作，覆盖技术 SEO、内容质量、结构化数据、AI 搜索优化、本地与电商 SEO，一条 /seo audit 命令产出带优先级的行动计划。"
checkedOn: 2026-10-11
sources:
  - https://github.com/AgriciDaniel/claude-seo
  - https://github.com/AgriciDaniel/claude-seo/blob/main/docs/COMMANDS.md
---

> 本文根据 AgriciDaniel/claude-seo 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 1.9 万 Star、2734 Fork，最近一次推送在 2026-10-04。命令数量和功能更新较快，以仓库为准。

## 是什么

Claude SEO 是一个装在 Claude Code 里的 SEO 分析插件。README 的定义：它并行运行 26 个子技能和 19 个专职子智能体，覆盖技术 SEO、内容质量（E-E-A-T）、Schema.org 结构化数据、AI 搜索优化（GEO）、本地 SEO、电商和多语言 SEO；每次审计都产出一份按优先级排列的行动计划，建议以 Google 的一手指南为依据。

它强调三点：一是面向 AI 搜索，检查内容被 AI 引用的可能性、`llms.txt`、页面对智能体是否友好等；二是并行执行，整站审计最多同时派出十几个专职子智能体；三是「可证伪」——每条建议都附带它所依据的观察、依赖关系、「怎么知道这条建议失败了」的检验方法和一个先行指标，而不是空泛的最佳实践清单。

README 提到这个技能有两个版本：公开的开源版（MIT，本条目介绍的就是它），以及一个面向付费社区成员、提前体验新功能的私有镜像。

## 包含哪些命令

README 称共有 34 个可调用的 `/seo` 命令，摘主要的：

- `/seo audit <网址>`：整站审计，并行分派子智能体；
- `/seo page <网址>`：单页深度分析；
- `/seo technical <网址>`：九个类别的技术 SEO 审计；
- `/seo content <网址>`：E-E-A-T 与内容质量；`/seo content-brief <主题>`：内容大纲；
- `/seo schema <网址>`：检测、校验并生成结构化数据；
- `/seo geo <网址>`：面向 AI 概览与生成式搜索的优化；`/seo agentic <网址>`：对智能体的可访问程度；
- `/seo sitemap`、`/seo images`、`/seo hreflang`：站点地图、图片、多语言标注；
- `/seo plan <类型>`：按 SaaS、本地、电商、内容站等类型做策略规划；
- `/seo local`、`/seo ecommerce`、`/seo programmatic`；
- `/seo google`：接入 Search Console、PageSpeed、CrUX、GA4 等 Google 官方接口；
- `/seo drift`：用本地 SQLite 快照监控 SEO 指标的漂移；
- `/seo setup`、`/seo doctor`：创建隔离的 Python 运行环境并检查是否就绪。

另有几个可选的扩展（需各自安装并配置对应服务的账号），用于接入第三方排名数据、必应站长工具和 AI 生图。

## 怎么安装

在 Claude Code 里（命令来自 README，要求 Claude Code 1.0.33 以上）：

```text
/plugin marketplace add AgriciDaniel/claude-seo
/plugin install claude-seo@agricidaniel-claude-seo
```

之后运行 `/seo setup` 建立 Python 运行环境。README 也提供了克隆仓库后手动安装的方式，以及 Windows 的 PowerShell 安装说明。

## 怎么用

- 「/seo audit https://example.com」——整站体检，得到评分和按优先级排序的问题；
- 「/seo schema https://example.com/product/123」——检查并补全结构化数据；
- 「/seo geo https://example.com/blog/post」——看这篇文章在 AI 搜索里被引用的条件是否具备。

## 适合谁 / 不适合谁

**适合：**
- 负责公司官网或内容站 SEO 的人，想在请顾问之前先自查；
- 同时维护多个站点的代理团队和自由顾问。

**不适合：**
- 主要做百度等国内搜索引擎优化的站点——它的依据是 Google 的指南和接口；
- 只想改几处标题描述的小需求，装一整套插件偏重，站内已收录的 marketingskills 的 `seo-audit` 技能更轻。

## 注意事项

- **许可**：MIT。README 称插件本身不含遥测。
- **会联网抓取你指定的网址**：README 说明免费使用时默认不调用第三方接口，但审计必然要访问目标页面；只审计你有权处理的网站，竞品分析类命令注意遵守对方站点的条款。
- **用量**：README 写明部分需要判断力的子智能体使用更高规格的模型，一次完整的 `/seo audit` 消耗不小。
- **本机环境**：需要 Python 3.10 以上；渲染单页应用和截图要另装 Playwright 的 Chromium，安装脚本会询问。
- **局限**：README 自己列了两条——重度依赖客户端渲染的页面可能出现噪声结果；不接入 Google 接口凭据时拿不到真实用户数据和实时收录状态。
- 接入 Google 接口需要你自己的凭据，按最小权限配置。

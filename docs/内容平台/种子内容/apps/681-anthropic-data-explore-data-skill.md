---
title: "explore-data skill 是什么、怎么安装使用：Anthropic 数据插件里的数据集摸底 Skill（结构、质量、分布一次看清）"
slug: anthropic-data-explore-data-skill
name: explore-data（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/explore-data
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install data@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, data-analysis]
excerpt: "explore-data 是 Anthropic knowledge-work-plugins 数据插件里的数据探索技能：对一张表或一个上传的文件生成完整画像——结构、空值率、列分布、重复与可疑值，并建议值得分析的维度、指标和后续方向。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/explore-data
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

拿到一张陌生的表，直接开始分析很容易踩坑：某列一半是空的、主键其实有重复、金额里混着测试数据。有经验的分析师会先「摸底」。explore-data 把这一步标准化了。`description`：对数据集进行画像和探索，了解它的形态、质量和模式；适用于遇到新表或新文件、检查空值率和列分布、发现重复或可疑值等数据质量问题，或决定分析哪些维度和指标时。

流程七步：

1. **访问数据**：连接了数据仓库的 MCP 服务器就直接查表，否则处理你上传的文件；
2. **理解结构**：列、类型、粒度；
3. **生成数据画像**：行数、各列的空值率、基数、分布；
4. **识别质量问题**；
5. **发现关系与模式**；
6. **建议值得关注的维度和指标**；
7. **推荐后续分析**。

后面附有几套方法：质量评估框架（完整性评分、准确性指标、时效性评估）、模式发现技巧（分布、时间模式、分群、相关性），以及表结构文档模板和探索用的查询。

## 怎么安装

`explore-data` 属于 anthropics/knowledge-work-plugins 的 `data` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install data@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/data:explore-data` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/data:explore-data orders`——对订单表做一次完整画像。
- 上传一个 CSV：「先帮我看看这份数据有什么问题，再告诉我能分析什么」。
- 「重点检查 user_id 有没有重复，以及金额列的异常值」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合数据分析师接手新数据源时使用，也适合业务人员在分析前确认数据是否靠得住。大表上的全量画像查询可能很慢、很贵，应先抽样或限定时间范围；它能发现统计上的异常，判断「这是不是业务上合理的」仍需要懂业务的人。

## 注意事项

- **许可**：Apache-2.0。
- **数据去向**：上传的文件和查询结果会进入对话上下文，含个人信息或敏感数据的表先脱敏并确认合规。
- **只读为宜**：给智能体的数据库账号限制为只读。
- 不执行仓库里的脚本；分析代码由 Claude 现场编写。

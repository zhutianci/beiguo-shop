---
title: "variance-analysis skill 是什么、怎么安装使用：Anthropic 财务插件里的差异分析 Skill（预算对实际、瀑布图、管理层说明）"
slug: anthropic-finance-variance-analysis-skill
name: variance-analysis（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/finance/skills/variance-analysis
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install finance@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, finance, data-analysis]
excerpt: "variance-analysis 是 Anthropic knowledge-work-plugins 财务插件里的差异分析技能：把预算与实际、同比环比的差异分解为价格与数量、费率与结构等驱动因素，生成文字说明和瀑布图式的桥接表，不构成财务建议。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/finance/skills/variance-analysis
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

每到月底，财务分析岗要回答同一个问题：这个数为什么和预算不一样？拆出原因、写成管理层看得懂的说明，是件耗时的手艺活。variance-analysis 提供了一套拆解和表述的方法。`description`：把财务差异分解为驱动因素，配以叙述性解释和瀑布分析；适用于分析预算对实际、期间环比变化、收入或费用差异，或为管理层准备差异说明时。

技能开头的声明：它协助差异分析工作流，但**不提供财务建议**，所有分析在用于报告之前应由合格的财务专业人员复核。

内容五部分：

- **差异分解技术**：价格 / 数量分解、费率 / 结构分解、人数 / 薪酬分解、按支出类别分解；
- **重要性阈值与调查优先级**：多大的差异值得追查、先查哪个；
- **差异说明的写法**：每条说明的结构、质量检查清单，以及要避免的写法（例如只描述数字变化而不解释原因）；
- **瀑布图方法**：概念、数据结构、纯文本的瀑布格式、桥接核对表；
- **预算、实际、预测三方对比**的框架。

## 怎么安装

`variance-analysis` 属于 anthropics/knowledge-work-plugins 的 `finance` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install finance@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/finance:variance-analysis` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/finance:variance-analysis 营销费用 第三季度 对比预算`——参数格式是「科目、期间、对比基准」。
- 「这是收入明细表，把同比增长拆成价格、销量和产品结构三部分」。
- 「按给 CFO 汇报的口径，把前五大差异各写三句话的说明」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合财务分析（FP&A）、财务经理和需要向管理层解释经营数据的业务负责人。它负责计算框架和表述，原因本身——为什么销量下滑——需要你或业务方提供；数据口径不清时拆出来的结果没有意义。它不处理会计准则判断和税务问题。

## 注意事项

- **许可**：Apache-2.0。
- **不是财务建议**，结论须经专业人员复核后才能进入正式报告。
- **数字核对**：让它列出计算过程，并用桥接表核对各项之和等于总差异。
- **保密**：未公开的财务数据属于敏感信息，使用前确认公司政策。

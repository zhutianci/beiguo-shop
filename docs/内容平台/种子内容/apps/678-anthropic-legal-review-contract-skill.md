---
title: "review-contract skill 是什么、怎么安装使用：Anthropic 法务插件里的合同审查 Skill（对照谈判手册出修订建议）"
slug: anthropic-legal-review-contract-skill
name: review-contract（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/review-contract
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install legal@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, legal, office]
excerpt: "review-contract 是 Anthropic knowledge-work-plugins 法务插件里的合同审查技能：对照你所在组织的谈判手册逐条分析合同，标出偏离项，生成修订建议和业务影响说明，不构成法律意见。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/review-contract
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

法务和业务人员审供应商或客户合同，大量时间花在同一件事上：把对方的条款和公司的标准立场一条条对比。review-contract 把这件重复劳动交给 Claude。`description`：对照组织的谈判手册审查合同——标出偏离、生成修订（redline）、提供业务影响分析；适用于审查供应商或客户协议、需要逐条对照标准立场做分析，或准备带优先级和退让方案的谈判策略时。

技能开头就写明边界：它协助法律工作流，**不提供法律意见**，所有分析都应由具备资质的法律专业人士复核。

流程八步：接收合同（文件或粘贴的文本）→ 收集背景（你是哪一方、交易规模、时间压力等）→ **加载谈判手册**（你们公司对各类条款的标准立场、可接受范围和底线）→ 逐条分析 → 标出偏离并分级 → 生成修订建议 → 写业务影响摘要 → 如果连接了合同管理系统，给出流转建议。

关键在第三步：技能的价值取决于你有没有提供自己的手册。没有的话，它只能按通用的商业惯例来判断。

## 怎么安装

`review-contract` 属于 anthropics/knowledge-work-plugins 的 `legal` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install legal@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/legal:review-contract` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/legal:review-contract` 后附上合同文件：「我方是采购方，这是供应商发来的主服务协议」。
- 「重点看责任上限、赔偿和数据处理条款，给出首选修改和可接受的退让方案」。
- 「把结果整理成一页给业务负责人看的摘要」。

这个技能只有一份 SKILL.md；文中的占位符对应哪些已连接工具，见仓库的 CONNECTORS.md。

## 适合谁 / 局限

适合企业法务、合同管理人员，以及没有专职法务、需要先自己过一遍合同的小公司负责人。技能的写法基于英美合同实务，条款类型和默认立场未必适用于中国法下的合同；它可能漏看条款之间的相互影响，重大合同必须由律师把关。

## 注意事项

- **许可**：Apache-2.0。
- **不是法律意见**：这一点技能自己反复强调。
- **保密**：合同通常含保密信息，上传前确认公司政策允许，并了解所用 Claude 套餐的数据处理条款。
- 不执行脚本；连接合同管理系统等属于可选的连接器功能。

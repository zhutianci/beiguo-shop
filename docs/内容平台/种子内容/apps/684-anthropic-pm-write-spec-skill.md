---
title: "write-spec skill 是什么、怎么安装使用：Anthropic 产品管理插件里的 PRD 写作 Skill（目标、非目标、验收标准）"
slug: anthropic-pm-write-spec-skill
name: write-spec（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/product-management/skills/write-spec
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install product-management@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, product-design, office]
excerpt: "write-spec 是 Anthropic knowledge-work-plugins 产品管理插件里的规格文档技能：从一个问题陈述或功能想法出发，写出含问题、目标与非目标、用户故事、分级需求、成功指标和验收标准的 PRD。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/product-management/skills/write-spec
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

一句「企业客户老是要单点登录」到一份可以交给研发的需求文档之间，隔着范围界定、优先级、成功标准等一系列要想清楚的事。write-spec 带着你把它们补齐。`description`：从问题陈述或功能想法写出功能规格或 PRD；适用于把模糊的想法或用户请求变成结构化文档、用目标和非目标界定功能范围、定义成功指标和验收标准，或把一个大需求拆成分阶段的规格时。

流程五步：了解要写的功能（接受功能名、问题陈述或一条用户请求）→ 收集背景 → 从已连接的工具里拉取上下文（如相关工单、研究记录）→ 生成 PRD → 评审与迭代。

PRD 的固定结构：问题陈述、目标、**非目标**、用户故事、需求、未决问题、时间方面的考虑。技能在几个容易写虚的地方给了具体方法：

- 用户故事的写法与常见错误；
- 用 **MoSCoW 法**给需求分级（必须有、应该有、可以有、这次不做）；
- 成功指标分先导指标和滞后指标，并要设目标值；
- 验收标准的写法；
- 范围管理：怎样识别和防止范围蔓延。

## 怎么安装

`write-spec` 属于 anthropics/knowledge-work-plugins 的 `product-management` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install product-management@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/product-management:write-spec` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/product-management:write-spec 单点登录支持`。
- 「客户反馈导出报表太慢，帮我写一份规格，先问我需要澄清的问题」。
- 「这份 PRD 范围太大，拆成两期，并写清每期的非目标」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合产品经理、兼做产品的创始人和技术负责人。它保证文档结构完整，内容的质量取决于你提供的用户洞察和数据——没有真实依据时，它会把假设写得像结论，注意让它把假设标出来；它不替你做优先级决策，只提供分级的框架。

## 注意事项

- **许可**：Apache-2.0。
- **不执行脚本**；拉取上下文依赖你连接的工具（项目管理、文档库等）。
- 与工程向的规格技能（如 mattpocock 的 to-spec）不同，它面向产品视角，不涉及代码层面的设计。

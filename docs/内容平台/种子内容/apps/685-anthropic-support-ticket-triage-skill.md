---
title: "ticket-triage skill 是什么、怎么安装使用：Anthropic 客服插件里的工单分诊 Skill（分类、P1–P4 定级、路由）"
slug: anthropic-support-ticket-triage-skill
name: ticket-triage（anthropics/knowledge-work-plugins）
url: https://github.com/anthropics/knowledge-work-plugins/tree/main/customer-support/skills/ticket-triage
pricing: "开源免费（Apache-2.0）"
platforms: "Claude Cowork / Claude Code"
trialNote: "`claude plugin marketplace add anthropics/knowledge-work-plugins` 然后 `claude plugin install customer-support@knowledge-work-plugins`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office]
excerpt: "ticket-triage 是 Anthropic knowledge-work-plugins 客服插件里的工单分诊技能：对新工单做分类、按 P1 到 P4 定优先级、检查是否重复或已知问题、决定交给哪个团队，并附一份建议的首次回复。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/knowledge-work-plugins/tree/main/customer-support/skills/ticket-triage
  - https://github.com/anthropics/knowledge-work-plugins
  - https://claude.com/plugins/
---

> 本文根据 anthropics/knowledge-work-plugins 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 anthropics/knowledge-work-plugins 在 GitHub 约 2.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

客服团队的效率很大程度上取决于第一步：一张新工单进来，它是什么类型、有多急、该谁处理。分错了，后面全是转单和等待。ticket-triage 让 Claude 做这道初筛。`description`：对支持工单或客户问题进行分诊和排定优先级；新工单进来需要分类、分配 P1–P4 优先级、决定由哪个团队处理，或在流转之前检查它是否重复或属于已知问题时使用。产出是一份结构化的分诊评估，外加一条建议的首次回复。

流程六步：解析问题 → 分类并定级 → 检查重复和已知问题 → 确定路由 → 生成分诊结果 → 提供后续操作选项。

技能自带一套可直接使用的标准：

- **分类体系**及判断技巧；
- **优先级框架**：P1（严重）、P2（高）、P3（中）、P4（低）各自的判定条件，以及触发升级的情形；
- **路由规则**与**重复检测**的方法；
- **按类别的首次回复模板**：缺陷、使用咨询、功能请求、账单、安全五类。

## 怎么安装

`ticket-triage` 属于 anthropics/knowledge-work-plugins 的 `customer-support` 插件，随插件一起安装。Claude Code 里（命令来自仓库 README）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install customer-support@knowledge-work-plugins
```

Claude Cowork 用户在 claude.com/plugins 页面安装同名插件。装好后技能会在相关场景自动触发，也可以用斜杠命令 `/customer-support:ticket-triage` 手动调用。

仓库整体介绍和其他安装方式，详见本站《knowledge-work-plugins 是什么、怎么安装：Anthropic 开源的 11 个岗位插件（销售 / 法务 / 财务 / 数据）》。

## 怎么用

- `/customer-support:ticket-triage 客户说今天早上起仪表盘一直是空白页`。
- 「这是今天新进的 20 张工单，逐张分诊并按优先级排序」。
- 「把这张定为 P2 的理由写清楚，并起草给客户的首次回复」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合客服主管、一线支持人员和兼顾客服的小团队创始人。自带的分类与优先级标准是通用模板，应替换成你们自己的服务等级约定和团队分工；检查重复和已知问题需要连接工单系统或知识库，否则只能凭你提供的信息判断。

## 注意事项

- **许可**：Apache-2.0。
- **首次回复要人看过再发**：模板是起点，涉及赔付、承诺修复时间的内容由人确认。
- **客户数据**：工单里常有个人信息，按公司的数据保护要求处理。
- 不执行脚本。

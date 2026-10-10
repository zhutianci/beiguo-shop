---
title: "doc-coauthoring 是什么、怎么使用：Anthropic 官方的文档协作写作 Skill（三阶段写方案、技术规格、决策文档）"
slug: anthropic-doc-coauthoring-skill
name: doc-coauthoring（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring
pricing: "免费（目录内未附 LICENSE 文件，以仓库 README 说明为准）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, copywriting]
excerpt: "doc-coauthoring 是 anthropics/skills 里的文档协作 Skill：按「收集背景 → 逐节打磨 → 读者测试」三个阶段陪你写方案、技术规格、决策文档，最后用不带上下文的子智能体检验文档能否被读懂。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.0 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让 AI 写文档最常见的失败是：你说一句「帮我写个方案」，它立刻吐出一篇看似完整、实则空洞的长文。doc-coauthoring 把这个过程反过来——先把你脑子里的背景掏干净，再一节一节地写。按 `description`，用户要写文档、提案、技术规格、决策文档这类结构化内容时使用；提到 PRD、design doc、RFC 等字眼，或明显要开始一项较大的写作任务时，Claude 会主动提议走这套流程。

流程分三个阶段：

1. **收集背景**：先问几个基础问题（文档类型、读者是谁、希望读者读完做什么），然后请你尽情「倒」信息，不必整理，它负责追问缺口。
2. **打磨与成稿**：对每一节依次做澄清提问 → 头脑风暴可写的要点 → 由你筛选 → 检查遗漏 → 起草 → 反复修改，接近完成时做一次整体质量检查。
3. **读者测试**：预测读者会问什么，再让一个完全没有对话上下文的子智能体只读文档来回答这些问题，答不上来的地方就是文档没写清楚的地方；没有子智能体可用时，改成指导你自己开新对话测试。

## 怎么安装

`doc-coauthoring` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/doc-coauthoring` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「我要写一份把支付系统迁移到新网关的技术方案，读者是架构评审委员会」。
- 「帮我起草一份是否自建数据平台的决策文档」——它会先提议三阶段流程，你也可以说「跳过，直接写」。
- 「文档写完了，帮我做一轮读者测试」——可以只用第三阶段。

这个技能只有一份 SKILL.md，没有脚本和附带文件。

## 适合谁 / 局限

适合经常写设计文档、提案、周期性汇报的工程师、产品经理和管理者，尤其是背景信息多、读者不在现场的文档。它比「一句话生成」慢得多，需要你投入时间回答问题；几百字的小通知用它就小题大做了。成稿质量很大程度取决于你在第一阶段给了多少真实信息。

## 注意事项

- **许可**：该技能目录内没有单独的 LICENSE 文件，frontmatter 也未写 license 字段；仓库 README 的说法是多数示例技能为 Apache-2.0，二次分发前请自行确认。
- **不执行脚本**：纯流程指引；读者测试阶段在 Claude Code 里会调用子智能体，多消耗一些用量。
- **保密信息**：倒背景时注意不要贴入不该外传的内容。

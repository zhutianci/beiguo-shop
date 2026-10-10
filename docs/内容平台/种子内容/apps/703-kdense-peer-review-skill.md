---
title: "peer-review skill 是什么、怎么安装使用：K-Dense 的论文审稿辅助 Skill（论断与证据核对、可执行的审稿意见）"
slug: kdense-peer-review-skill
name: peer-review（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/peer-review
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill peer-review"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, paper-writing, literature]
excerpt: "peer-review 是 K-Dense 科研技能库里的审稿辅助技能：在确认授权和保密要求后，帮审稿人核对论断与证据，评审方法、统计、可复现性、伦理、图表与引用，起草有建设性的审稿意见，也可用于规划对审稿意见的回复。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/peer-review
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

审稿是科研人员的无偿苦差，也是 AI 最容易被滥用的地方之一：把未发表的稿件丢给聊天机器人，既可能违反期刊的保密规定，又可能得到一份看似专业、实则空泛的意见。peer-review 把「可以怎么用」和「不能怎么用」都写清楚了。它的定位是支持一位负责任的人类审稿人，做出严谨、公平、可执行的评估，并把每一份未发表的投稿和审稿意见视为机密。

`description`：准备以证据为界、有建设性的同行评审草稿和结构化的稿件评估；支持对科研稿件、研究方案、预印本或研究计划的**经授权的**评审，包括选择报告规范，核对论断与证据，评审方法、统计、可复现性、伦理、图表和引用，以及规划对审稿意见的修改回复。

**强制的安全边界**排在最前：阅读或分析未发表内容之前，先确认用户已获出版方、编辑、作者或材料所有者的授权，并核对目标期刊或会议关于审稿、保密和使用 AI 的政策。

审稿流程十一步，主线是：确定范围和可用证据 → 先通读、不急于下结论 → 选报告规范 → **把论断对应到证据** → 评审方法与统计 → 可复现性与透明度 → 伦理与诚信 → 图表与引用 → 起草可执行的意见 → 把给作者的意见和给编辑的保密意见分开 → 检查并定稿。

目录里有论断与证据矩阵、报告规范清单、审稿骨架等模板，以及一组本地脚本。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill peer-review
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「这是我自己准备投稿的稿子，投之前按审稿人的标准挑一遍毛病」——自查是最没有争议的用法。
- 「帮我把稿件里的主要论断和支撑它的图表逐条对应起来」。
- 「这是三位审稿人的意见，帮我规划逐条回复和修改」。

## 适合谁 / 局限

适合投稿前自查的作者、指导学生的导师，以及在政策允许范围内寻求辅助的审稿人。许多期刊和基金机构**禁止**把待审稿件上传给外部 AI 工具，这种情况下不应使用；它不能判断研究的新颖性和领域内的重要性，这仍是审稿人自己的专业判断。

## 注意事项

- **许可**：MIT。
- **工具本地运行**：技能声明自带的命令行工具只用 Python 3.11 以上的标准库，是确定性的本地程序，不联网、不调用模型或外部服务——但稿件内容仍会进入你所用智能体的模型上下文，保密风险主要在这里。
- **人负最终责任**：审稿结论必须由署名的审稿人自己形成并负责。

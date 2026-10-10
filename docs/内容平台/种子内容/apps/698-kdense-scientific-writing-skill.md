---
title: "scientific-writing skill 是什么、怎么安装使用：K-Dense 的科研论文写作 Skill（证据可追溯、不编造）"
slug: kdense-scientific-writing-skill
name: scientific-writing（K-Dense-AI/scientific-agent-skills）
url: https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-writing
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI 等支持 Agent Skills 的工具"
trialNote: "npx skills add K-Dense-AI/scientific-agent-skills --skill scientific-writing"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, paper-writing]
excerpt: "scientific-writing 是 K-Dense 科研技能库里的论文写作技能：起草、修改和审核科研稿件，要求每个论断绑定证据来源，覆盖报告规范、作者责任与保密，自带离线的一致性检查工具，明确 AI 不是作者。"
checkedOn: 2026-10-11
sources:
  - https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-writing
  - https://github.com/K-Dense-AI/scientific-agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 K-Dense-AI/scientific-agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 K-Dense-AI/scientific-agent-skills 在 GitHub 约 4.8 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

用大模型写论文最大的风险不是文笔，而是它流畅地写出没有依据的话——编造的引用、数据里没有的结论。scientific-writing 的全部设计都围绕这一点。它给自己的目的定为：写出清晰的科学文字，同时不捏造证据、不掩盖不确定性；把起草、证据核验和投稿审批当作相互分开的阶段。技能写明：负有责任的人类作者掌握科学决定和最终批准权，**AI 不是作者，生成文字的流畅从来不是证据**。

`description`：起草、修改和审核科研稿件或报告，具备明确的证据溯源、报告规范覆盖、作者责任、保密控制和本地一致性检查；用于稿件各部分、参考文献、声明、图表或投稿准备，适用于科学准确性和可追溯性要紧的场合。

四条不可商量的安全规则：保密、不捏造、论断绑定证据、科学上忠实。工作流共十二步，主线是：建立本地工作区 → 选择报告规范 → **建立证据记录** → 写证据大纲 → **在不添加事实的前提下起草** → 核对方法与结果 → 核验引用和论断 → 确认作者身份与披露 → 审查声明 → 检查并批准。

目录里有三十个文件：稿件骨架、论断与证据对照表、作者信息等模板，一组离线的检查脚本，以及引用格式、图表、作者与 AI 使用政策等参考。

## 怎么安装

仓库 README 的安装方式是 skills CLI。这个库有一百七十多个技能，建议用 CLI 文档里的 `--skill` 参数只装需要的：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill scientific-writing
```

也可以把整个仓库克隆到 `~/.agents/skills/scientific-agent-skills`（用户级）或项目的 `.agents/skills/` 下。

仓库整体介绍和其他安装方式，详见本站《Scientific Agent Skills 是什么、怎么安装使用：K-Dense 的科研 Skill 库（生信、化学、数据分析、科研写作）》。

## 怎么用

- 「这是我的实验结果和笔记，帮我起草方法和结果两节，每个数字都标出来源」。
- 「检查这份稿件里摘要、正文和表格的数字是否一致」。
- 「按目标期刊的要求整理作者贡献和利益冲突声明」。

## 适合谁 / 局限

适合研究生和科研人员写作与投稿前自查。它比「一句话生成论文」慢得多，需要你先提供真实的数据和文献；没有证据的地方它会留空并提示，而不是替你补上——这正是它的价值所在。

## 注意事项

- **许可**：MIT。
- **工具离线、无需 API Key**：技能声明自带脚本只需 Python 3.11 以上，不联网。
- **学术规范**：各期刊和学校对使用 AI 辅助写作有披露要求，技能里有相关提醒，最终以投稿对象的现行政策为准；作者对全文负责。
- 未发表的数据属于保密内容，注意所用模型服务的数据条款。

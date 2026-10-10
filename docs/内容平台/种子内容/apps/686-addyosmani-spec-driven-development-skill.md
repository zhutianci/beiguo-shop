---
title: "spec-driven-development skill 是什么、怎么安装使用：Addy Osmani 的「先写规格再写代码」Skill（分阶段把关）"
slug: addyosmani-spec-driven-development-skill
name: spec-driven-development（addyosmani/agent-skills）
url: https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / OpenCode / Copilot 等"
trialNote: "npx skills add addyosmani/agent-skills --skill spec-driven-development"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "spec-driven-development 是 addyosmani/agent-skills 里的规格先行技能：新项目、新功能或需求含糊时，按「范围检查 → 规格 → 计划 → 任务 → 实现」的分阶段流程推进，每一阶段经确认后才进入下一步。"
checkedOn: 2026-10-11
sources:
  - https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development
  - https://github.com/addyosmani/agent-skills
  - https://github.com/vercel-labs/skills
---

> 本文根据 addyosmani/agent-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 addyosmani/agent-skills 在 GitHub 约 10.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Addy Osmani 在这套技能里反复表达一个观点：没有规格的代码就是猜。spec-driven-development 是其中最上游的一个。`description`：在编码之前创建规格；开始新项目、新功能或重大改动而尚无规格时使用，起草带目标和范围的 PRD 或需求文档、需求不清或只是模糊想法时使用，一个需求横跨多个可独立测试的能力、需要先拆成模块能力图时也使用。

技能把规格定义为你和智能体之间共同的事实来源：要做什么、为什么做、怎样算做完。

核心是一个**带关卡的工作流**，每个阶段结束都要经人确认：

- **阶段 0，范围检查**：需求是否大到需要先拆分；
- **阶段 1，规格**：写清目标、范围与验收条件；
- **阶段 2，计划**：技术方案；
- **阶段 3，任务**：拆成可执行的小任务；
- **阶段 4，实现**。

另有一节「让规格保持鲜活」：实现过程中发现规格有误，应该回头改规格，而不是让代码和文档悄悄分叉。和该库的其他技能一样，末尾有三张固定的表：常见的自我开脱说法、危险信号、完成前的核对项。

## 怎么安装

仓库 README 给出了单独安装某个技能的写法：

```bash
npx skills add addyosmani/agent-skills --skill spec-driven-development
```

想整套安装，Claude Code 用 `/plugin marketplace add addyosmani/agent-skills` 加 `/plugin install agent-skills@addy-agent-skills`，Codex 用 `codex plugin marketplace add addyosmani/agent-skills` 加 `codex plugin add agent-skills@agent-skills`。README 提示，插件安装遇到 SSH 权限报错时改用仓库的 HTTPS 地址。

仓库整体介绍和其他安装方式，详见本站《addyosmani/agent-skills 是什么、怎么安装：Addy Osmani 的 25 个生产级工程 Skills（/spec、/plan、/build）》。

## 怎么用

- 「我想做一个团队内部的值班排班工具，先别写代码，按规格先行来」。
- 「这个需求涉及通知、权限和导出三块，先帮我拆成能力图」。
- 做到一半需求变了：「先更新规格，再告诉我哪些任务受影响」。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合中大型功能和多人协作的项目，以及希望对智能体的产出有明确验收依据的人。改一个文案、修一个小 bug 走完整流程得不偿失；它与 Superpowers 的 brainstorming / writing-plans、mattpocock 的 to-spec 解决的是同一类问题，选一套即可。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**；会在仓库里创建规格与计划文档。
- 每个关卡都需要你认真看，敷衍通过就失去了这套流程的意义。

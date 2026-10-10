---
title: "codebase-design skill 是什么、怎么用：Matt Pocock 的「深模块」设计词汇 Skill（接口、接缝、可测试性）"
slug: mattpocock-codebase-design-skill
name: codebase-design（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "codebase-design 是 mattpocock/skills 的设计词汇技能：给智能体一套设计深模块的固定术语和原则——小接口背后放大量行为、接缝放对位置、通过接口测试，供设计与重构时统一使用。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 77.1 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体「把这块代码设计得好一点」，它会给出一堆听着都对的泛泛之谈。codebase-design 的做法是先统一语言。`description`：设计深模块的共享词汇；用户想设计或改进模块接口、寻找加深机会、决定接缝放在哪里、让代码更易测试或更便于 AI 导航时使用，其他技能需要这套词汇时也会调用它。

核心主张是设计**深模块**：小接口背后有大量行为，放在干净的接缝上，可以通过这个接口来测试。目标是三样——给调用方杠杆，给维护者局部性，给所有人可测试性。

技能的主体是一份术语表，并要求「严格使用这些词」，不要换成组件、服务、API、边界之类的近义词，理由是一致的语言正是全部意义所在。例如：

- **模块**：任何有接口和实现的东西，刻意不限定规模——函数、类、包，或跨层的一个切片；
- **接口**：调用方为了正确使用模块必须知道的一切，不只是类型签名，还包括不变量、调用顺序约束、错误模式、必需的配置和性能特征。

后面还有深与浅的对比、几条原则（同库其他技能引用过其中的「删除测试」「接口就是测试面」「一个适配器只是假想的接缝，两个才是真的」）、为可测试性而设计、被否定的几种说法。

## 怎么安装

`codebase-design` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 「帮我设计通知模块的接口，按深模块的思路」。
- 「这个 service 层是不是太浅了？用 codebase-design 的标准评一下」。
- 多数时候它是被 `improve-codebase-architecture` 等技能间接调用的。

目录里另有 `DEEPENING.md`（如何加深模块）和 `DESIGN-IT-TWICE.md`（把接口设计两遍再选）两份延伸资料。

## 适合谁 / 局限

适合认同「深模块」这一路设计思想、希望智能体的设计建议更有章法的工程师，也适合当作团队讨论架构时的共同词汇。它是一种设计立场而非客观标准，和团队现有的分层规范冲突时需要取舍；纯词汇与原则，不会自己去改代码。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不改文件**：参考型技能，可由模型自动触发。
- 术语是英文定义的，中文讨论时建议保留英文原词以免歧义。

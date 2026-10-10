---
title: "triage skill 是什么、怎么用：Matt Pocock 的 issue / PR 分诊 Skill，把问题单整理成智能体可执行的任务简报"
slug: mattpocock-triage-skill
name: triage（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/triage
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "triage 是 mattpocock/skills 的分诊技能：让 issue 和外部 PR 按一个小型状态机流转——分类、核实、必要时追问，最后写成智能体可以直接接手的任务简报，所有评论带 AI 生成声明。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/triage
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 92.0 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

开源项目和内部项目都有同样的烦恼：issue 堆积，一半信息不全，一半不知道该不该做。triage 让智能体承担分诊这件体力活。`description`：让 issue 和外部 PR 在由若干分诊角色构成的状态机里流转，分类、核实、必要时拷问，并写出「可供智能体执行」的简报。它只能手动调用。

核心是一个小状态机：每个 issue 处在某个分诊状态，用标签表示（标签词汇由 `setup-matt-pocock-skills` 向你询问后记录）。如果仓库把外部 PR 也当作需求入口，分诊同样覆盖 PR——说明里的说法是「PR 就是附带了代码的 issue」，沿用同样的角色和状态，只有少数差异。技能规定了几种调用方式：列出当前需要关注的条目、分诊某一个具体的 issue 或 PR、快速覆盖状态，以及恢复上一次未完成的分诊。信息不足时有固定的「需要补充信息」回复模板。

一条硬性规定：分诊过程中发到跟踪器上的每一条评论或 issue，都必须以一段声明开头，表明内容由 AI 生成。

## 怎么安装

`triage` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- `/triage`——列出待处理的 issue 与 PR。
- `/triage #42`——核实这个问题能否复现、归类，并写出简报或要求补充信息。
- 分诊完成的条目可以直接交给实现类技能或后台智能体去做。

目录里有两份参考：`AGENT-BRIEF.md`（怎样写经得起时间的任务简报）和 `OUT-OF-SCOPE.md`（如何处理不打算做的请求）。

## 适合谁 / 局限

适合维护着活跃仓库、issue 处理不过来的维护者和小团队。它需要能访问 issue 跟踪器的命令行工具或集成（例如已登录的 GitHub 命令行工具），并且会**以你的身份发评论、改标签**；团队若已有成熟的分诊流程和标签体系，需要先在配置里对齐。

## 注意事项

- **许可**：MIT。
- **对外可见的操作**：评论和标签改动别人看得到，建议先在测试仓库或少量 issue 上试。
- **必须先运行 `/setup-matt-pocock-skills`**，否则它不知道跟踪器和标签约定。

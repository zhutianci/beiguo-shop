---
title: "wayfinder skill 是什么、怎么用：Matt Pocock 给超大型工作做规划的 Skill，用「决策任务单」画地图"
slug: mattpocock-wayfinder-skill
name: wayfinder（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/wayfinder
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "wayfinder 是 mattpocock/skills 的大型规划技能：面对一个会话装不下的大块工作，在 issue 跟踪器上画一张由「决策任务单」组成的共享地图，一次解决一个决定，直到通往目标的路径清晰。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/wayfinder
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 64.5 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

有些事大到一个智能体会话根本装不下：重写计费系统、设计一整门课程。硬着头皮让它「先做个计划」，得到的往往是细节全靠猜的长文。wayfinder 的态度是承认现在看不清路。`description`：把一大块工作（超出单个会话的容量）规划成 issue 跟踪器上一张由决策任务单组成的共享地图，一次解决一张，直到通往目的地的路清晰为止。它只能手动调用。

几个关键概念：

- **目的地**：每次努力的终点不同，说出它是画图的第一步——可能是一份可以交接和迭代的规格，可能是开始规划前必须锁定的一个决定，也可能是一次就地完成的改动（如数据结构迁移）。
- **地图**：跟踪器上的一个共享条目，汇总全部任务单的状态。
- **决策任务单**：它们是**问题**，解决的结果是一个决定，而不是要执行的构建切片。
- **战争迷雾**：远处看不清的部分先不展开，等前面的决定落定再说。

说明里有一节叫「只规划，不动手」：wayfinder 默认是规划活动，地图在路径清晰时就算完成，实现交给别的技能。它还强调不限于工程——课程内容之类的工作只要形状合适也能用。调用分两种：**绘制地图**和**沿地图推进**。

## 怎么安装

`wayfinder` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- `/wayfinder 我们要把单租户架构改成多租户`——它先和你确定目的地，再在跟踪器上建地图和第一批决策任务单。
- 之后每次开新会话：`/wayfinder` 继续，它读地图，挑一张没有前置依赖的任务单和你一起解决。
- 路径清晰后，用 `to-spec`、`to-tickets` 把结论转成规格和实现任务。

## 适合谁 / 局限

适合规划跨多周、涉及许多未知数的大型改造。小功能用它是杀鸡用牛刀；它会在跟踪器上产生一批条目，团队需要接受这种用 issue 记录决策的做法；规划周期变长，适合「想清楚比做得快更重要」的工作。

## 注意事项

- **许可**：MIT。
- **会创建和更新 issue**，对团队可见；需要先运行 `/setup-matt-pocock-skills`。
- 这个技能的说明文字较长，加载时会占用一部分上下文。

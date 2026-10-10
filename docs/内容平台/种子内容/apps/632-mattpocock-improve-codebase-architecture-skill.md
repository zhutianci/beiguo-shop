---
title: "improve-codebase-architecture skill 是什么、怎么用：扫描代码库找「加深模块」机会并出 HTML 报告"
slug: mattpocock-improve-codebase-architecture-skill
name: improve-codebase-architecture（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "improve-codebase-architecture 是 mattpocock/skills 的架构改进技能：扫描代码库里把浅模块变成深模块的重构机会，生成一份可视化 HTML 报告，你选中一项后再逐轮拷问细化方案。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 108.4 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

代码库用久了会积累一类问题：模块很多，但每个都很「浅」——接口几乎和实现一样复杂，调用方得了解一堆内部细节，测试难写，智能体读起来也费劲。improve-codebase-architecture 专门找这类地方。`description`：扫描代码库寻找「加深」的机会，以可视化 HTML 报告呈现，然后对你挑中的那一项做拷问式讨论。它只能手动调用。

说明里把目标说得很具体：发现架构上的摩擦，提出把浅模块变成深模块的重构，目的是可测试性和「对 AI 的可导航性」。它建立在同库 `codebase-design` 技能的一套固定词汇之上——模块、接口、深度、接缝（seam）、适配器、杠杆、局部性——并要求全程严格使用这些词；同时参考项目的领域模型（术语表和 ADR）。

流程三步：**探索**代码库；把候选项写成一份**自包含的 HTML 报告**，存在操作系统的临时目录里，不往仓库里放东西；你选定其中一项后进入**拷问循环**，把这项重构的边界、接口和迁移方式一点点问清。

## 怎么安装

`improve-codebase-architecture` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 在项目根目录输入 `/improve-codebase-architecture`，等它出报告，用浏览器打开查看候选项和示意图。
- 「只看 billing 目录」——可以限定范围，避免大仓库扫描太久。
- 选一项后说「就做第 2 个」，它会开始追问；谈定后可接 `to-spec` 或 `to-tickets` 落成任务。

目录里有一份 `HTML-REPORT.md`，规定报告的骨架、图示和样式。

## 适合谁 / 局限

适合接手了有年头的代码库、想找出最值得重构之处的工程师，也适合定期做架构体检。它给的是基于「深模块」这一种设计观的建议，不是唯一正确答案；扫描大型仓库耗时也耗用量；它只提出并讨论方案，不会自动动手重构。

## 注意事项

- **许可**：MIT。
- **只读扫描 + 写临时文件**：报告写在系统临时目录，不改仓库。
- **依赖同库的 `codebase-design` 与 `grilling`**，需要整套安装。

---
title: "gstack /retro 是什么、怎么安装使用：从 git 提交记录生成每周工程复盘"
slug: gstack-retro-weekly-retrospective-skill
name: retro（garrytan/gstack）
url: https://github.com/garrytan/gstack/tree/main/retro
pricing: "开源免费（MIT）"
platforms: "Claude Code（完整支持）；Codex、Cursor、OpenCode 等用 --host 安装（实验性）"
trialNote: "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
products: [claude, codex]
models: [claude-llm]
topics: [agent-skills, coding, office]
excerpt: "/retro 是 gstack 的工程复盘技能：分析一段时间内的提交历史，统计提交时段、工作时段、改动热点、PR 大小和连续交付天数，按成员给出亮点与改进点，并把每次复盘存档用于前后对比。"
checkedOn: 2026-10-11
sources:
  - https://github.com/garrytan/gstack/tree/main/retro
  - https://github.com/garrytan/gstack
---

> 本文根据 garrytan/gstack 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 garrytan/gstack 在 GitHub 约 13.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

周会上被问到「这周做了什么」，多数人靠回忆。`/retro` 让智能体直接去读 git 历史。`description`：每周工程复盘；分析提交历史、工作模式和代码质量指标，带持久化的历史与趋势跟踪；能识别团队，按人拆分贡献，给出表扬和成长空间。README 把它对应的角色叫作工程经理。

SKILL.md 列出了它的调用方式：

- `/retro`：默认最近 7 天；`/retro 24h`、`/retro 14d`、`/retro 30d` 指定窗口；
- `/retro compare`：和紧挨着的上一个同长度窗口对比；
- `/retro global`：跨项目复盘，汇总本机各个 AI 编程工具下的项目，不要求当前目录是 git 仓库。

一次复盘的步骤很细：先拉取远端，用一条命令采集指标；然后计算提交的时间分布、推断工作时段、按类型拆分提交、找出改动热点文件、统计 PR 大小分布，评出专注度和「本周最佳交付」；逐个成员分析；窗口不少于 14 天时做周环比；统计连续交付的天数；还有一份「捷径债务」台账，扫描代码里留下的临时方案。最后读入以前的复盘做比较，存一份 JSON 快照，再写成叙述性的总结。

几条规则值得知道：分析的是远端默认分支而不是本地可能过期的 main；时间按你的本地时区显示；合并提交被当作 PR 的边界；这段时间没有提交会直说，并建议换个窗口。

## 怎么安装

`/retro` 不单独发布，随 gstack 整套安装。README 的要求是先装好 Claude Code、Git 和 Bun（Windows 另需 Node.js），然后：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

`./setup` 默认只给 Claude Code 装；其他智能体用 `./setup --host codex`（或 `--host auto`），README 把这些标为实验性支持，技能名会带 `gstack-` 前缀。注意整套安装还会编译工具、下载一份 Chromium 供它的浏览器类技能使用，这部分和 `/retro` 无关，但会占磁盘。

仓库整体介绍和其他安装方式，详见本站《gstack 是什么、怎么安装和使用：YC 总裁 Garry Tan 的 Claude Code Skills 工作流》。

## 怎么用

在项目仓库里：

- 「/retro」——出最近一周的复盘。
- 「/retro compare 14d」——最近两周和之前两周比。
- 「/retro global」——看自己这一周在所有项目上的投入和切换情况。

## 适合谁 / 局限

适合小团队的技术负责人做周报和迭代回顾的底稿，也适合独立开发者回看自己的节奏。局限很明确：它只能看到进了 git 的东西，评审、讨论、排查问题这些不产生提交的工作不会被统计；按人拆分贡献和「每小时代码行数」这类指标容易被误读，适合做回顾的引子，不适合当绩效依据；提交信息写得随意，分类也会跟着不准。

## 注意事项

- **许可**：MIT。
- **会执行命令**：运行 `git fetch` 和仓库自带的指标脚本；复盘快照存在项目的 `.context/retros/`，全局模式存在 `~/.gstack/retros/`。
- **涉及同事的数据**：报告里有按人的统计，往外发之前想清楚是否合适。
- **遥测**：默认关闭，README 说明即使开启也不上传代码、路径和仓库名。

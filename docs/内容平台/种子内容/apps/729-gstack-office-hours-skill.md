---
title: "gstack /office-hours 是什么、怎么安装使用：写代码前先过一遍 YC 式的六个逼问"
slug: gstack-office-hours-skill
name: office-hours（garrytan/gstack）
url: https://github.com/garrytan/gstack/tree/main/office-hours
pricing: "开源免费（MIT）"
platforms: "Claude Code（完整支持）；Codex、Cursor、OpenCode 等用 --host 安装（实验性）"
trialNote: "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
products: [claude, codex]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "/office-hours 是 gstack 的起点技能：创业模式用六个逼问检验需求是否真实、切口够不够窄，构建者模式做设计向的头脑风暴；挑战前提、给出两到三个实现方案，只产出一份设计文档，不写任何代码。"
checkedOn: 2026-10-11
sources:
  - https://github.com/garrytan/gstack/tree/main/office-hours
  - https://github.com/garrytan/gstack
---

> 本文根据 garrytan/gstack 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 garrytan/gstack 在 GitHub 约 13.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

gstack 把 Claude Code 分成十几个「岗位」，README 建议从 `/office-hours` 开始。它模仿的是 Y Combinator 的 Office Hours：合伙人不帮你写代码，只追问你到底在解决什么问题。SKILL.md 给它定了一条硬规矩——不调用任何实现类技能、不写代码、不搭项目，唯一的产出是一份设计文档。

它分两种模式：

- **创业模式**（做公司或在公司内部做新业务）：六个逼问——需求是否真实存在、用户现在怎么凑合、最迫切需要它的具体是谁、最窄的切入点是什么、你观察到了什么意外、它是否顺应未来趋势。配套的还有「不许奉承」规则和几种反驳套路。
- **构建者模式**（副业、黑客松、学习、开源）：换成设计伙伴的口吻，用发散式的问题帮你把点子做得更有意思。聊着聊着提到客户、收入、融资，它会切到创业模式。

两种模式之后流程一致：先翻本项目已有的设计文档看有没有重叠；**挑战前提**（这是不是对的问题、什么都不做会怎样、现有代码能复用什么、新产物用户怎么拿到）；**给两到三个方案**，其中必须有一个最小可行版和一个理想架构版；最后写成设计文档，供后续的 `/plan-ceo-review`、`/plan-eng-review` 使用。

## 怎么安装

`/office-hours` 不单独发布，随 gstack 整套安装。README 的要求是先装好 Claude Code、Git 和 Bun（Windows 另需 Node.js），然后：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

`./setup` 默认只给 Claude Code 装；其他智能体用 `./setup --host codex`（或 `--host auto`），README 把这些标为实验性支持，技能名会带 `gstack-` 前缀。注意整套安装还会编译工具、下载一份 Chromium 供它的浏览器类技能使用，这部分和 `/office-hours` 无关，但会占磁盘。

仓库整体介绍和其他安装方式，详见本站《gstack 是什么、怎么安装和使用：YC 总裁 Garry Tan 的 Claude Code Skills 工作流》。

## 怎么用

- 「/office-hours 我想做一个帮独立开发者自动回复用户邮件的工具」。
- 「这个功能值得做吗？帮我想清楚」——技能的触发词包括 brainstorm this、is this worth building、help me think through。
- 「周末黑客松想做点好玩的，方向是本地知识库」——走构建者模式。

它一次只问一个问题，认真回答比催它出方案有用。

## 适合谁 / 局限

适合独立开发者和小团队在动手前逼自己把问题想清楚，尤其是容易「先写了再说」的人。局限：追问基于你的口头回答，它没有真实的用户数据，结论的质量取决于你答得多诚实；整个技能很长（主文件九万多字符，另有按需读取的分节文件），一次会话消耗的上下文不小；风格直接，不适合只想被肯定的时候用。

## 注意事项

- **许可**：MIT。
- **会写文件**：设计文档和会话记录保存在 `~/.gstack/` 下的项目目录，多次会话之间可以互相引用。
- **会联网**：调研环节会做网页检索，技能要求把检索结果当作不可信内容对待。
- **遥测**：README 说明使用数据上报默认关闭，首次运行会询问，随时可用 `gstack-config set telemetry off` 关掉。

---
title: "handoff skill 是什么、怎么用：把当前对话压缩成交接文档、让新会话接着干的 Matt Pocock Skill"
slug: mattpocock-handoff-skill
name: handoff（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "handoff 是 mattpocock/skills 的交接技能：把当前对话浓缩成一份交接文档存到系统临时目录，列出下一个智能体该调用的技能，引用而不重复已有的规格与提交，并自动隐去密钥等敏感信息。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 95.7 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

长对话到后半程，上下文越来越满，智能体开始忘事、变慢。常见做法是开个新会话，但前面积累的理解就丢了。handoff 让旧会话在「下班」前写一份交接。`description`：把当前对话压缩成一份交接文档，供另一个智能体接手。它带一个参数提示——「下一个会话打算用来做什么？」——并且只能手动调用。

技能内容很短，规则有五条：

- 写一份总结当前对话的交接文档，让全新的智能体可以继续工作；
- 存到操作系统的**临时目录**（`$TMPDIR`、`/tmp`，Windows 上是 `%TEMP%`），而不是当前工作区；
- 文档里要有「建议使用的技能」一节，点名下一个智能体应该调用哪些技能；
- 不重复已经存在于其他产物里的内容——规格、计划、ADR、issue、提交、diff——用路径或链接引用即可；
- 隐去敏感信息，例如 API 密钥、密码和个人身份信息。

如果你调用时带了参数，它会把参数当成下一个会话的重点，据此裁剪文档内容。

## 怎么安装

`handoff` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 上下文快满时输入 `/handoff`，拿到文档路径后开一个新会话：「读一下这份交接文档，然后继续」。
- `/handoff 下一步只做前端联调`——交接内容会围绕联调来组织。
- 换工具时也能用：在 Claude Code 里写交接，到 Codex 里接手。

## 适合谁 / 局限

适合经常做长任务、需要主动管理上下文的人，也适合把工作从一个智能体转给另一个。它依赖当前会话还「记得」的内容，等上下文已经被自动压缩过再交接，细节会有损失，宁可早一点做。文档放在临时目录，系统清理后就没了，需要长期保留请自己挪走。

## 注意事项

- **许可**：MIT。
- **只写一个临时文件**，不改仓库、不联网。
- 虽然技能要求隐去敏感信息，分享交接文档给他人之前仍建议自己检查一遍。
- 与 Claude Code 自带的 `/compact` 不同：后者在原会话内压缩，handoff 是为新会话准备材料。

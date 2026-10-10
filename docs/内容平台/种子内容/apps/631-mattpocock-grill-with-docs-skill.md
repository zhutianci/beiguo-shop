---
title: "grill-with-docs skill 是什么、怎么用：边拷问方案边写术语表和 ADR 的 Matt Pocock Skill"
slug: mattpocock-grill-with-docs-skill
name: grill-with-docs（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "grill-with-docs 是 mattpocock/skills 里 grill-me 的工程版：在逐轮追问方案的同时调用 domain-modeling，把敲定的术语写进 GLOSSARY.md、把值得记录的决定写成 ADR。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 113.5 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

一场高质量的方案讨论结束后，结论往往只留在聊天记录里，下一个会话的智能体什么都不知道。grill-with-docs 解决的是「讨论完要留下东西」。`description`：对计划或设计做一场不依不饶的访谈，并在过程中产出文档——ADR（架构决策记录）和术语表。它只能手动调用。

技能本身只有一句话：同时调用 `grilling` 和 `domain-modeling` 两个技能。前者负责问——把方案当成一棵设计树，一轮一轮地问当前能问的所有问题，每题附推荐答案；后者负责记——它要求在设计过程中主动打磨项目的领域模型：发现你用的词和术语表里的定义冲突时当场指出，把含糊的说法逼成精确的术语，编造边界场景来检验概念，和代码里的实际命名对照，术语一旦敲定就立刻写进 `GLOSSARY.md`；至于 ADR，说明里的态度是「谨慎地提议」，只有真正值得记录的决定才写。

## 怎么安装

`grill-with-docs` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- `/grill-with-docs` 后跟要讨论的功能：「给订阅加一个暂停功能」。它会先读已有的 `GLOSSARY.md` 和 ADR，再开始追问。
- 讨论中你说「暂停的订阅算不算活跃用户？」这类问题时，它会要求先把「活跃」的定义定下来并记入术语表。
- 结束后仓库里会多出或更新术语表与决策记录，接下来可以用 `to-spec` 把讨论整理成需求。

## 适合谁 / 局限

适合多人长期维护、术语容易各说各话的项目，以及希望智能体在后续会话里沿用同一套词汇的团队。对一次性脚本和小项目来说偏重；它会往仓库里写文档，团队如果已有自己的文档规范，需要先告诉它格式和位置（`setup-matt-pocock-skills` 会问文档存放处）。

## 注意事项

- **许可**：MIT。
- **会新增或修改仓库文件**：术语表和 ADR，提交前自己读一遍。
- **依赖同库的其他技能**：单独只装这一个不能工作，至少要有 `grilling` 和 `domain-modeling`。

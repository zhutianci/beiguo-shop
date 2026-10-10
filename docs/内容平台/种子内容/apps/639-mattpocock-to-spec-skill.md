---
title: "to-spec skill 是什么、怎么用：把当前对话整理成需求规格并发布到 issue 跟踪器的 Matt Pocock Skill"
slug: mattpocock-to-spec-skill
name: to-spec（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "to-spec 是 mattpocock/skills 的规格技能：不再访谈，直接把当前对话和对代码库的理解综合成一份规格（问题、方案、用户故事、实现与测试决定、范围外事项），发布到项目的 issue 跟踪器。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 64.2 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

和智能体聊了半小时，方案基本清楚了，但「清楚」只存在于这次对话里。to-spec 把它落成文。`description`：把当前对话变成一份规格并发布到项目的 issue 跟踪器——不做访谈，只综合你们已经讨论过的内容。它只能手动调用。

说明里第一句就强调：**不要**再向用户提问，把已知的东西综合起来即可（提问是 `grill-me` 那一步的事）。它需要事先知道 issue 跟踪器和标签约定，没有的话会提示你先运行 `/setup-matt-pocock-skills`。

流程是：先探索仓库了解现状，全程使用项目术语表里的词汇，并尊重相关的 ADR；然后勾勒打算在哪些**接缝**上测试这个功能——优先用已有的接缝、尽量选最高层的位置，接缝越少越好，说明里说理想数量是一个——这一步会和你确认；最后按固定模板写规格并发布。模板的小节是：问题陈述、解决方案、用户故事、实现决定、测试决定、不在范围内的事项、补充说明。

## 怎么安装

`to-spec` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 讨论结束后输入 `/to-spec`，它会给出测试接缝的设想让你确认，然后在跟踪器里创建一条规格 issue。
- 典型链路：`/grill-with-docs` 把方案问清 → `/to-spec` 落成规格 → `/to-tickets` 拆成任务。
- 用本地文件当跟踪器时，规格会写成仓库里的文件（位置取决于你在 setup 时的回答）。

## 适合谁 / 局限

适合习惯先聊透再动手、并且用 issue 管理工作的开发者和小团队。它只综合对话里已有的内容：讨论本身有漏洞，规格也会有同样的漏洞；它对「测试接缝」的强调带着作者的工程观点，不写自动化测试的项目会觉得这部分多余。

## 注意事项

- **许可**：MIT。
- **会向 issue 跟踪器写入内容**（对团队可见），需要本机已配置好对应的命令行工具或集成。
- 流程里明确要求和你确认的是测试接缝；规格全文建议发布后立即通读，有出入及时改。

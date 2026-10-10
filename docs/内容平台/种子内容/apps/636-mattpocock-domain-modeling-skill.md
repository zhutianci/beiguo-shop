---
title: "domain-modeling skill 是什么、怎么用：让智能体维护项目术语表（GLOSSARY.md）和 ADR 的 Matt Pocock Skill"
slug: mattpocock-domain-modeling-skill
name: domain-modeling（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "domain-modeling 是 mattpocock/skills 的领域建模技能：设计讨论中主动质疑含糊的用词、构造边界场景、对照代码命名，把敲定的术语即时写进 GLOSSARY.md，并在必要时提议记录 ADR。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 79.4 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

同一个东西，产品叫「工作区」，后端表名叫 team，前端组件叫 org——人还能靠默契沟通，智能体读到这种代码库就会不断误解。domain-modeling 让智能体承担起「把词说准」的职责。`description`：构建并打磨项目的领域模型；在讨论代码库术语、编写或修改 `GLOSSARY.md`、记录或修改 ADR 时使用。

说明里先划了一条界线：仅仅**读**术语表来获取词汇不算这个技能——那是任何技能都该有的一行习惯；这个技能是在你**改变**模型时用的，是主动的功夫。它规定了设计会话中的几个动作：

- **对照术语表提出质疑**：你的说法和已有定义冲突时当场指出；
- **把含糊的语言磨尖**：逼着把「大概是用户」变成确切的术语；
- **讨论具体场景**：构造边界情况来检验概念是否站得住；
- **与代码交叉核对**：看实际命名是否与术语一致；
- **即时更新 `GLOSSARY.md`**：术语一敲定就写，不留到最后；
- **谨慎地提议 ADR**：只在决定确实值得记录时才写。

文件结构也有约定：多数仓库只有一个上下文；如果根目录存在 `GLOSSARY-MAP.md`，说明有多个上下文，由它指向各自的位置。文件在需要时才创建。

## 怎么安装

`domain-modeling` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 「我们一会儿说会员、一会儿说订阅用户，帮我把这块的术语理清楚」。
- 讨论新功能时它会自动介入：「你说的『项目』和术语表里的 Project 是一回事吗？」
- 「把刚才决定用事件溯源的理由记成一条 ADR」。

目录里有 `GLOSSARY-FORMAT.md` 和 `ADR-FORMAT.md` 两份格式说明。

## 适合谁 / 局限

适合业务概念多、多人协作、并且长期让智能体参与开发的项目——术语表写好后，后续每个会话都受益。小工具和脚本用不上；它会在讨论中频繁「打断」你较真用词，赶进度时可能觉得烦；术语表需要人来把关，它记下的定义错了，后面会一路错下去。

## 注意事项

- **许可**：MIT。
- **会新增或修改仓库里的 Markdown 文件**，不执行脚本。
- `grill-with-docs`、`to-spec`、`to-tickets` 等技能都会用到它维护的词汇。

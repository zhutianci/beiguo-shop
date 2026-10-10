---
title: "grill-me skill 是什么、怎么用：Matt Pocock 的「拷问式访谈」Skill，把方案里没想清的地方逼出来"
slug: mattpocock-grill-me-skill
name: grill-me（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "grill-me 是 mattpocock/skills 里安装量最高的技能：让智能体对你的计划或设计做一轮轮不留情面的追问，每个问题都附它的推荐答案，直到双方对方案达成一致。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 132.6 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

多数人把一个半成型的想法交给智能体，它会客气地补全空白然后开工。grill-me 反过来：你主动要求被「拷问」。它的 `description` 只有一句——对计划或设计做一场不依不饶的访谈，把它打磨清楚。它被设置成只能由你手动调用（模型不会自己触发）。

grill-me 本身只有一行，真正的方法写在同库的 `grilling` 技能里，由 grill-me 转调。做法是把方案看成一棵**设计树**：每个决定下面挂着依赖它的后续决定。访谈按「轮」推进：每一轮只问「前沿」上的问题——也就是前置决定都已经敲定、现在就能问而不用猜的那些；一轮里把这些问题编号一次问完，每个问题都给出它推荐的答案，而且措辞上让你回答「是」就等于接受推荐。你答完，树的形状随之变化，前沿外推，再问下一轮。依赖本轮其他问题答案的问题，要留到后面的轮次。

## 怎么安装

`grill-me` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- `/grill-me` 后跟方案：「我打算把单体应用拆成三个服务，先拆订单」。
- 「grill me：我们准备把定价从按席位改成按用量」——非技术决定同样适用。
- 嫌问题太多时，直接回一串「1 是，2 是，3 改成……」即可，推荐答案的设计就是为了让你快速通过。

相关变体：`grill-with-docs` 在拷问的同时把术语表和决策记录写下来。

## 适合谁 / 局限

适合动手前想压力测试一下思路的开发者、产品和创业者，尤其是独自做决定、没人唱反调的时候。它只负责问，不负责执行；问题质量取决于你给的背景，方案只有一句话时前几轮会比较泛。和 Superpowers 的 brainstorming 目的相近，两者同时启用会重复提问。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不改文件**：纯对话技能。
- skills.sh 榜单的安装量包含整库安装带来的计数，仅供参考热度。

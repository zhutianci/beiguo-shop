---
title: "prototype skill 是什么、怎么用：Matt Pocock 的一次性原型 Skill，用可点的 HTML 验证逻辑或对比界面方案"
slug: mattpocock-prototype-skill
name: prototype（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "prototype 是 mattpocock/skills 的原型技能：为回答一个设计问题而写用完即弃的代码——逻辑是否顺，就做成单个可分享的 HTML 让人点着走一遍；界面该长什么样，就生成几个差异很大的方案对比。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 91.5 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

有些设计问题靠讨论定不下来：这个状态机在边界情况下到底合不合理？这个页面用哪种布局更好？prototype 的答案是做个东西出来看。`description`：构建一个用完即弃的原型来回答设计问题；用户想快速验证某个状态模型或逻辑「感觉对不对」，或想探索界面该长什么样时使用。它对原型的定义是：**回答一个问题的一次性代码**，问题决定原型的形态。

技能先让智能体判断要回答的是哪类问题（看你的话、周围的代码，或者直接问你），然后走两条分支之一：

- **「这套逻辑 / 状态模型顺不顺？」**——按 `LOGIC.md` 做：产出**单个可分享的 HTML 文件**，里面有自由操作的按钮，也有分标签页的引导式走查，把状态机推到那些纸面上很难想清的情形里，而且要让不写代码的人也能自己点。
- **「它应该长什么样？」**——按 `UI.md` 做：生成几个**差别很大**的界面方案供对比，而不是同一个方案的微调。

两条分支共用的规则写在最后，核心是原型不进入正式代码——它的任务是换来一个答案。

## 怎么安装

`prototype` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 「订单的退款状态流转我拿不准，做个原型让我点点看」——得到一个可以发给产品同事的 HTML。
- 「设置页应该怎么布局？给我几个完全不同的方向」。
- 在拷问或写规格的过程中遇到悬而未决的设计问题，也可以临时调用它。

## 适合谁 / 局限

适合需要和非技术同事对齐逻辑的开发者，以及在动手做正式界面前想先比较方向的人。原型刻意不讲工程质量，直接拿去当正式实现会埋坑；逻辑原型模拟的是你描述的规则，和真实系统是否一致仍要靠后续实现与测试保证。

## 注意事项

- **许可**：MIT。
- **会生成文件**：主要是独立的 HTML，确认它的存放位置，别误提交进仓库。
- 不依赖外部服务；这是库里少数允许模型自动触发的技能之一。

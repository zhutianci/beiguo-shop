---
title: "gstack /plan-ceo-review 是什么、怎么安装使用：用创始人视角重审计划，四种模式定范围"
slug: gstack-plan-ceo-review-skill
name: plan-ceo-review（garrytan/gstack）
url: https://github.com/garrytan/gstack/tree/main/plan-ceo-review
pricing: "开源免费（MIT）"
platforms: "Claude Code（完整支持）；Codex、Cursor、OpenCode 等用 --host 安装（实验性）"
trialNote: "git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup"
products: [claude, codex]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "/plan-ceo-review 是 gstack 的「CEO / 创始人」评审技能：只评审计划不改代码，先挑战前提、盘点可复用的现有代码，再在扩张、选择性扩张、守住范围、收缩四种模式里定下范围，每一处范围变动都要你批准。"
checkedOn: 2026-10-11
sources:
  - https://github.com/garrytan/gstack/tree/main/plan-ceo-review
  - https://github.com/garrytan/gstack
---

> 本文根据 garrytan/gstack 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 garrytan/gstack 在 GitHub 约 13.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

工程评审问「这样做对不对」，`/plan-ceo-review` 问的是「该不该做成这样」。README 对它的定位是 CEO / 创始人：重新想问题，找出藏在需求里的「十星产品」。SKILL.md 写明它只做评审，不改代码、不动手实现。

核心是**四种模式**：

- **SCOPE EXPANSION（扩张）**：往理想形态想，追求「两倍投入、十倍效果」，积极建议加东西；
- **SELECTIVE EXPANSION（选择性扩张）**：先把现有范围做扎实，再把每个可扩张点的收益、工作量和风险中立地摆出来，由你挑；
- **HOLD SCOPE（守住范围）**：范围不动，把失败路径、边界情况、错误处理、测试和可观测性查透；
- **SCOPE REDUCTION（收缩）**：提出最小可行内核，砍什么要你同意。

模式可以由你指定，也可以让它推荐：计划涉及的文件改动超过 15 个时建议收缩；全新的产品或系统建议扩张，加能力建议选择性扩张，修复与重构建议守住范围。

评审从「第 0 步」开始：挑战前提、盘点现有代码能撬动什么、描绘理想状态、列备选方案、选模式。之后按章节逐项过，带着一组首要原则——例如不允许静默失败，每类错误都要说清触发条件、处理方式、用户看到什么、怎么测试。在扩张类模式下，结论会存成一份 CEO 计划文档，被接受的范围写进计划，暂缓的进 TODOS，拒绝的列为「不在范围内」。

## 怎么安装

`/plan-ceo-review` 不单独发布，随 gstack 整套安装。README 的要求是先装好 Claude Code、Git 和 Bun（Windows 另需 Node.js），然后：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

`./setup` 默认只给 Claude Code 装；其他智能体用 `./setup --host codex`（或 `--host auto`），README 把这些标为实验性支持，技能名会带 `gstack-` 前缀。注意整套安装还会编译工具、下载一份 Chromium 供它的浏览器类技能使用，这部分和 `/plan-ceo-review` 无关，但会占磁盘。

仓库整体介绍和其他安装方式，详见本站《gstack 是什么、怎么安装和使用：YC 总裁 Garry Tan 的 Claude Code Skills 工作流》。

## 怎么用

先让智能体出一份实现计划（或先跑 `/office-hours` 得到设计文档），然后：

- 「/plan-ceo-review 这份计划是不是想小了？」——触发词还有 think bigger、expand scope、strategy review。
- 「守住范围，帮我把这份计划的失败路径查一遍」——指定 HOLD SCOPE。
- 「这个需求两周做不完，砍到最小能上线的版本」——指定收缩。

## 适合谁 / 局限

适合自己既当产品又当工程的独立开发者，在计划阶段需要有人唱反调时使用。局限：它判断「更好的产品」靠的是模型的推理和网页检索，不了解你的用户、预算和排期，扩张模式给的建议容易超出实际资源，采纳前要自己权衡；流程长、提问多，小改动不值得走一遍。

## 注意事项

- **许可**：MIT。
- **只读代码**：允许的工具里没有编辑和写文件，结论通过内置的 Bash 步骤保存到 `~/.gstack/` 下的项目目录。
- **带钩子**：frontmatter 里注册了一个在 Bash 调用后运行的钩子脚本，用于模式交接；装之前可以在仓库里看一眼它的内容。
- **遥测**：默认关闭，可用 `gstack-config set telemetry off` 确认。

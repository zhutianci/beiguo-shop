---
title: "to-tickets skill 是什么、怎么用：把规格拆成带依赖关系的「曳光弹」任务单的 Matt Pocock Skill"
slug: mattpocock-to-tickets-skill
name: to-tickets（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "to-tickets 是 mattpocock/skills 的拆任务技能：把计划、规格或当前对话拆成一组纵向切片的任务单，每张写明构建内容、验收标准和被哪些任务阻塞，发布到配置好的跟踪器或本地文件。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 63.5 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

规格写好了，交给智能体一口气实现往往失控；按「先做数据库、再做接口、最后做界面」横着切，又要等到最后才知道东西通不通。to-tickets 采用另一种切法。`description`：把计划、规格或当前对话拆成一组「曳光弹」任务单，每张声明自己的阻塞关系，发布到配置的跟踪器——在本地是每张任务单一个文件、依赖关系写成文字，在真正的跟踪器上则使用原生的阻塞链接。它只能手动调用。

「曳光弹」指**纵向切片**：每张任务单都薄薄地贯穿所有层，做完就能端到端验证一小段功能。流程五步：

1. **收集上下文**：用对话里已有的内容；你传了规格路径或 issue 编号，它会把正文和评论都读完；
2. **探索代码库**（可选）：标题和描述使用项目术语，尊重 ADR，并留意能否先做一点预备性重构——说明里引用了那句「先让改动变容易，再做容易的改动」；
3. **起草纵向切片**；
4. **向你确认**：切得对不对、粒度是否合适；
5. **发布**到跟踪器。

每张任务单的固定小节是：所属的父项、要构建什么、验收标准、被谁阻塞。

## 怎么安装

`to-tickets` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- `/to-tickets #123`——把 123 号规格拆成若干子任务并建立阻塞关系。
- 对话里刚讨论完时直接 `/to-tickets`，它用当前上下文来拆。
- 拆完后，没有被阻塞的任务可以同时交给多个智能体并行实现。

## 适合谁 / 局限

适合想让多个智能体或多人并行推进、又要保证每一步都可验证的团队。纵向切片对习惯按技术层分工的团队需要适应；阻塞关系是它推断的，复杂项目里要人工检查有没有漏掉的依赖；和其他技能一样需要先运行 `/setup-matt-pocock-skills`。

## 注意事项

- **许可**：MIT。
- **会批量创建 issue 或文件**：发布前有确认环节，认真看一遍草稿，批量建错了清理起来很烦。
- 不执行项目代码；访问跟踪器依赖本机已登录的命令行工具或集成。

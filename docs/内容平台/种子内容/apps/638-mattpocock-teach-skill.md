---
title: "teach skill 是什么、怎么用：Matt Pocock 的 AI 私教 Skill，把一个文件夹变成跨会话的学习工作区"
slug: mattpocock-teach-skill
name: teach（mattpocock/skills）
url: https://github.com/mattpocock/skills/tree/main/skills/productivity/teach
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Windsurf 等"
trialNote: "claude plugin install mattpocock-skills@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, learning]
excerpt: "teach 是 mattpocock/skills 的教学技能：把当前目录当作学习工作区，用 MISSION.md 记录学习动机，按最近发展区安排课程，把要点沉淀成可打印的参考资料，并跨多次会话记录进度。"
checkedOn: 2026-10-11
sources:
  - https://github.com/mattpocock/skills/tree/main/skills/productivity/teach
  - https://github.com/mattpocock/skills
  - https://skills.sh/mattpocock/skills
---

> 本文根据 mattpocock/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 78.8 万次；所在仓库 mattpocock/skills 在 GitHub 约 28.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让 AI 解释一个概念很容易，难的是真正学会——过几天再来，它不记得你学到哪了，你也忘了一半。teach 把「学一样东西」当作有状态的长期任务来处理。`description`：在这个工作区里教用户一项新技能或概念。它带参数提示「你想学什么？」，只能手动调用。

技能开头就定了性：这是一个有状态的请求，用户打算分多次会话来学。于是它把运行 `/teach` 的那个目录当成**教学工作区**，学习状态存在几类文件里：

- `MISSION.md`：记录你**为什么**想学这个主题，所有教学都以它为锚；
- `./reference/` 下的 HTML 参考资料：从课程里压缩出来的要点——速查表、参考算法、语法、术语表等，要求做成适合打印的漂亮文档；
- `./lessons/`：一节节课程；
- 学习记录、资源清单和 `NOTES.md` 等。

教学法部分讲了几条原则：区分「流畅感」和真正的「存储强度」（看懂不等于记住）；在你的**最近发展区**内出题和推进，不太难也不太易；把知识、技能和「获得判断力」分开对待。

## 怎么安装

`teach` 随 mattpocock/skills 整套安装。Claude Code 用插件（命令来自仓库 README）：

```text
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 先 `codex plugin marketplace add mattpocock/skills` 再 `codex plugin add mattpocock-skills@mattpocock`；Cursor、OpenCode 等用 `npx skills@latest add mattpocock/skills`，在列表里勾选需要的技能。README 提醒两点：插件和 skills.sh 两种方式每个工具只选一种，否则每个技能会出现两份；勾选时带上 `setup-matt-pocock-skills`，并在每个仓库里先运行一次，它会问你用哪个 issue 跟踪器、分诊用哪些标签、文档存在哪里——库里不少技能依赖这份配置，也会互相调用。

仓库整体介绍和其他安装方式，详见本站《mattpocock/skills 是什么、怎么安装：Matt Pocock 的工程师 Skills（grill-me、tdd、to-spec）》。

## 怎么用

- 新建一个空文件夹，在里面启动智能体，输入 `/teach 我想学 SQL 窗口函数`——它会先问你的动机和基础，写下 `MISSION.md`，再开始第一课。
- 几天后回到同一个文件夹再输入 `/teach`，它会读记录，从上次的进度继续，并先考你之前的内容。
- 主题不限编程：说明里举的参考资料例子甚至包括瑜伽体式。

目录里有四份格式说明：使命、学习记录、资源、术语表。

## 适合谁 / 局限

适合想系统学一个主题、愿意分多次投入的人，比如学一门新语言、一个框架或一块业务知识。它需要有文件系统的环境（Claude Code、Codex 等），网页聊天里无法保存状态；讲授内容来自模型本身，专业性强的领域要对照权威资料核对。

## 注意事项

- **许可**：MIT。
- **会在当前目录创建多个文件和子目录**：请在专门的文件夹里用，不要在代码仓库根目录运行。
- 不联网也能用；让它查资料时取决于所用工具是否有搜索能力。

---
title: "writing-plans skill 是什么、怎么用：Superpowers 把需求拆成可执行实施计划的 Skill"
slug: superpowers-writing-plans-skill
name: writing-plans（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/writing-plans
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "writing-plans 是 Superpowers 的计划技能：拿到设计或需求后、动代码之前，写一份「没看过代码库的工程师也能照做」的实施计划，写明文件、接口、测试和提交点，存入 docs/superpowers/plans/。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/writing-plans
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 26.9 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

设计确认之后直接开写，中途很容易跑偏或做一半忘了前提。writing-plans 要求先落一份书面计划。`description` 只有一句：手里有多步骤任务的规格或需求时，在碰代码之前使用。

它对计划的读者有个明确设定：一位没见过这个代码库、也没读过这份需求的工程师。这位工程师知道接口和测试长什么样之后能写出地道的代码，也会在计划留白处做合理选择；他不可能知道的是**你做了哪些决定**——动哪些文件、函数叫什么、签名是什么、需求里的哪些数值、哪些测试能证明任务完成。计划要记录的正是这些。写法上要求把整件事拆成小块任务，遵循 DRY、YAGNI、测试驱动和频繁提交。

说明里依次规定了：范围检查（太大的需求先拆成几份计划）、先列文件结构、任务怎么定大小、每一步写多细、计划文件的固定抬头、写完后的自查。计划保存到 `docs/superpowers/plans/` 下，文件名带日期和功能名。最后把选择权交还给你：用子智能体逐任务执行，还是在当前会话里直接执行。

## 怎么安装

`writing-plans` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:writing-plans` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 走完 brainstorming 之后它会自动接上，并先声明「我在用 writing-plans 技能写实施计划」。
- 手里已有需求文档时：「按这份 spec 写实施计划，先不要写代码」。
- 看完计划觉得哪一步不对，直接让它改计划文件，再开始执行。

这个技能只有一份 SKILL.md，没有脚本。

## 适合谁 / 局限

适合要连续做几个小时的中大型功能：计划写在文件里，换会话、清上下文之后还能接着干。小改动不值得写计划；计划质量取决于前面需求聊得多清楚，需求含糊时它会把含糊也写进计划。

## 注意事项

- **许可**：MIT。
- **会在仓库里新增文件**：计划文档默认放在 `docs/superpowers/plans/`，是否提交进版本库由你决定。
- 计划里会写具体代码片段和文件路径，执行前花几分钟读一遍，比事后返工便宜。

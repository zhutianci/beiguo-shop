---
title: "executing-plans skill 是什么、怎么用：Superpowers 在当前会话内按计划逐项执行的 Skill"
slug: superpowers-executing-plans-skill
name: executing-plans（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/executing-plans
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "executing-plans 是 Superpowers 的「内联执行」技能：不为每个任务另派子智能体，由当前会话自己按计划逐项完成，用任务台账记录进度与决定，TDD 把关，最后做一次全分支评审。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/executing-plans
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 23.0 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Superpowers 写完计划后有两种执行方式，executing-plans 是省钱的那一种。`description`：当你要在当前会话里亲自作为实现者执行一份实施计划时使用——你选择了内联执行，或者没有可用的子智能体工具。

技能开头把账算得很明白：子智能体驱动的方式，每个任务都要付一个全新实现者加一个全新评审者的成本，且各自从零读代码；内联执行只付一个上下文的成本，外加结尾一次评审。它放弃的是「每任务一个干净上下文」和「每任务第二双眼睛」，于是用别的办法补回来：任务简报就是规格，**台账（ledger）**充当记忆，TDD 是每个任务的关卡，最终评审者是第二双眼睛。

循环很朴素：领取任务（读简报）→ 按步骤做 → 满足「完成约定」→ 标记完成。原则是「计划已经替你思考过了，照着执行」；遇到计划和实际对不上的地方，要把所做的决定记入台账，未经记录就偏离计划被视为擅自做主。因为台账在文件里，很长的计划被打断后也能恢复。

## 怎么安装

`executing-plans` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:executing-plans` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 计划写完后，在它给出的两种执行方式里选择在当前会话内执行。
- 「按这份计划继续，从上次停下的任务接着做」——它会先读台账确认进度。
- 做到一半发现计划有误，可以让它停下、记录分歧，改完计划再继续。

目录里有 `task-start`、`task-done` 两个小脚本，用于开始和结束任务时更新记录。

## 适合谁 / 局限

适合任务数量不多、前后关联紧，或者想节省用量的情况；也适合不支持子智能体的工具。上下文会随任务累积，计划特别长时后半程质量可能下降；每个任务没有独立评审，问题要到最后才集中暴露。

## 注意事项

- **许可**：MIT。
- **会执行脚本与提交**：任务脚本会读写仓库里的记录文件，建议在独立分支中使用。
- 两种执行方式不要混用于同一份计划的同一阶段；想换方式，在任务边界上切换。

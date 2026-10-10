---
title: "subagent-driven-development 是什么、怎么用：Superpowers 用子智能体逐任务执行计划的 Skill"
slug: superpowers-subagent-driven-development-skill
name: subagent-driven-development（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "subagent-driven-development 是 Superpowers 执行计划的主力技能：每个任务派一个全新上下文的实现子智能体，完成后做规格符合度与代码质量评审，最后再对整个分支做一次总评审。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 22.3 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

一个会话连续做十几个任务，上下文会越来越脏：前面任务的细节挤占空间，模型开始混淆。subagent-driven-development 的做法是让主会话只当协调者。`description`：在当前会话里执行由相互独立的任务组成的实施计划时使用。

每个任务的循环是：派出一个「实现者」子智能体，只给它这个任务需要的说明和上下文——它不继承主会话的历史；实现者交回报告后，主会话按报告状态处理（比如「完成但有疑虑」要先读疑虑，「受阻」要判断是缺信息还是任务本身有问题）；然后做一次任务评审，同时看是否符合规格和代码质量；有问题进入修复循环，通过后才标记完成。所有任务结束，再对整个分支做一次范围更宽的最终评审。

说明里还有「模型选择」一节，讨论什么样的任务可以交给更便宜的模型；以及一张常见借口表（比如「这个任务太小不用评审」）。它的核心公式是：每任务一个新子智能体 + 每任务评审 + 最终总评审 = 质量高、迭代快。

## 怎么安装

`subagent-driven-development` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:subagent-driven-development` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- writing-plans 写完计划后会问你选哪种执行方式，选「子智能体驱动」即进入这个技能。
- 也可以直接说：「按 docs/superpowers/plans/ 里的那份计划，用子智能体逐任务执行」。
- 执行中你可以随时插话调整，主会话负责把变化转达给后续任务。

目录里有实现者、任务评审、复审三份提示词模板，以及几个准备任务简报和评审材料的脚本。

## 适合谁 / 局限

适合任务多、彼此独立、希望质量把关严一点的计划，README 提到这种方式下智能体连续自主工作几个小时并不少见。代价是用量：每个任务至少两个新上下文（实现 + 评审），各自都要重新读代码。任务之间强耦合、或所用工具不支持子智能体时，应改用 executing-plans。

## 注意事项

- **许可**：MIT。
- **用量高**：订阅额度紧张时慎用，或在计划里把任务划得粗一些。
- **需要子智能体能力**：Claude Code 支持；其他工具以 README 的说明为准。
- 子智能体会直接改代码并提交，建议在独立分支或 worktree 中进行。

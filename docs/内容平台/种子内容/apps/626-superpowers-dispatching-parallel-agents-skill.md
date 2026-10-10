---
title: "dispatching-parallel-agents 是什么、怎么用：Superpowers 把互不相关的问题分给多个子智能体并行处理的 Skill"
slug: superpowers-dispatching-parallel-agents-skill
name: dispatching-parallel-agents（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/dispatching-parallel-agents
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "dispatching-parallel-agents 是 Superpowers 的并行技能：面对两个以上彼此独立、没有共享状态的任务时，每个问题域派一个子智能体同时处理，再由主会话汇总检查、合并结果。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/dispatching-parallel-agents
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.7 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

重构之后一口气挂了三个测试文件，分属三个子系统——一个个排查很慢，而且前一个问题的细节会干扰下一个。dispatching-parallel-agents 讲的是什么时候、怎样把这类工作分出去。`description`：面对两个以上相互独立、不需要共享状态也没有先后依赖的任务时使用。核心原则是每个独立的问题域派一个智能体，让它们并发工作。

和 Superpowers 里其他涉及子智能体的技能一样，它强调子智能体不应继承主会话的上下文和历史——主会话要为每个子智能体「构造」它恰好需要的信息，这样既让它专注，也保住主会话自己的上下文用于协调。

模式分四步：识别相互独立的问题域 → 为每个域写一份聚焦的任务说明 → 并行派发 → 回收结果、检查并整合。说明里给了任务提示词的结构：范围要具体（一个测试文件或一个子系统）、目标明确、写明约束（例如不要改无关代码）、规定返回什么。还列了常见错误（任务太宽、没给背景、没设约束、返回要求含糊）和**不该用**的情形：问题之间有关联、需要理解全局状态、几个智能体会改同一批文件。

## 怎么安装

`dispatching-parallel-agents` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:dispatching-parallel-agents` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 「这次升级后有三组互不相关的测试失败，分别派子智能体去查」。
- 「同时调研这三个第三方库的接入成本，各自给我一份结论」。
- 回收之后它会检查各方修改有没有冲突，再跑一遍完整测试。

这个技能只有一份 SKILL.md，文中附了一个真实会话的例子。

## 适合谁 / 局限

适合手上有多件互不依赖的排查或调研工作、想缩短等待时间的人。并行意味着同时消耗多份用量；任务划分不干净时，子智能体会相互踩文件，反而要花时间解决冲突。它不是「越多越快」，问题本质上相关时应该先由一个上下文弄清全貌。

## 注意事项

- **许可**：MIT。
- **需要子智能体能力**，并留意所用工具对并发数量的限制。
- 并行修改代码前先提交当前状态，方便出问题时回退。

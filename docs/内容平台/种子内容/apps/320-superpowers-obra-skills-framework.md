---
title: "Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架"
slug: superpowers-obra-skills-framework
name: Superpowers（obra/superpowers）
url: https://github.com/obra/superpowers
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode / Kimi Code / Qwen Code 等
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "Superpowers 是 Jesse Vincent（obra）做的 Skills 框架：用一组自动触发的技能把编程智能体约束成「先问清需求、写设计、拆计划、测试驱动开发、代码评审」的完整流程。支持 Claude Code、Codex、Cursor 等十多种工具。"
checkedOn: 2026-10-10
sources:
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
  - https://blog.fsck.com/2025/10/09/superpowers/
  - https://code.claude.com/docs/en/discover-plugins
  - https://skills.sh/
---

> 本文根据 obra/superpowers 仓库 README、作者发布文章和 Claude Code 官方文档整理，资料核对于 2026-10-10。各工具的安装方式更新较快，以仓库 README 为准。

## 是什么

Superpowers 由 Jesse Vincent（GitHub 用户名 obra）和他所在的 Prime Radiant 团队开发，2025 年 10 月发布。它不是零散的技能合集，而是一套**软件开发方法论**：用一组可以互相衔接的技能，加上一段开场指令，让编程智能体不再一上来就写代码，而是先退一步问清你到底要做什么，把设计分成小段给你确认，再写出一份「没有项目背景的新手也能照做」的实施计划，然后派子智能体按计划逐项完成、逐项评审。README 提到，这样安排后智能体连续自主工作几个小时而不偏离计划并不少见。

截至 2026-10-10，GitHub 显示该仓库约 29.7 万 Star、2.7 万 Fork，最近一次推送在 2026-10-10，是按 Star 数排在最前面的 Skills 项目；它也被收录进 Anthropic 官方插件市场和 OpenAI 的 Codex 插件市场。

## 包含哪些 Skill

仓库里共十余个技能，按用途可以分成几组：

- **基本流程（按触发顺序）**：
  - `brainstorming`：动手前通过提问弄清需求，小改动在对话里确认，大项目产出设计文档；
  - `using-git-worktrees`：设计确认后新建分支和隔离工作区，先跑一遍测试确认基线干净；
  - `writing-plans`：把工作拆成每个 2～5 分钟的小任务，写明文件路径、代码和验证步骤；
  - `subagent-driven-development` / `executing-plans`：前者每个任务派一个新的子智能体并逐项评审（最细致），后者在当前会话里连续做完、最后统一评审（最省）；
  - `test-driven-development`：强制「先写失败的测试 → 看它失败 → 写最少的代码 → 看它通过 → 提交」；
  - `requesting-code-review` / `receiving-code-review`：任务之间对照计划评审，严重问题会阻止继续；
  - `finishing-a-development-branch`：收尾时验证测试，给出合并、开 PR、保留或丢弃的选项。
- **调试**：`systematic-debugging`（四阶段找根因）、`verification-before-completion`（确认真的修好了）、`diagnosing-superpowers`（排查某次会话里技能为什么没按预期触发）。
- **并行**：`dispatching-parallel-agents`。
- **元技能**：`writing-skills`（按规范写新技能并测试）、`using-superpowers`（技能体系的引导）。

## 怎么安装

每种工具要单独安装一次（命令均来自 README）。

**Claude Code**——从官方市场装：

```text
/plugin install superpowers@claude-plugins-official
```

或者用作者自己的市场（里面还有几个相关插件）：

```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Codex**：Codex App 里点侧边栏的 Plugins，在 Coding 分类找到 Superpowers 点「+」；Codex CLI 里输入 `/plugins`，搜索 superpowers，选择 Install Plugin。

**其他工具**：

```bash
# Gemini CLI
gemini extensions install https://github.com/obra/superpowers
# GitHub Copilot CLI
copilot plugin marketplace add obra/superpowers-marketplace
copilot plugin install superpowers@superpowers-marketplace
# Qwen Code
qwen extensions install obra/superpowers
```

Cursor 在 Agent 对话里输入 `/add-plugin superpowers`；Kimi Code 输入 `/plugins` 在 Marketplace 里安装。README 还给出了 Antigravity、Devin CLI、Factory Droid、Grok Build、OpenCode、Pi、Hermes Agent 等的安装方式。README 没有提供 claude.ai 网页版的安装方式。

## 怎么用

装好后不需要记命令，技能会自动触发：

- **验证安装**：新开一个会话，输入 `Let's make a react todo list`（README 给的测试语句）。正常情况下它不会直接写代码，而是先触发 `brainstorming` 向你提问。
- **正常开发**：照常描述需求，例如「给这个项目加一个导出 CSV 的功能」。它会依次走提问 → 设计确认 → 写计划 → 你说开始后执行 → 评审 → 收尾。每一步都会停下来等你确认。
- **出问题时**：对智能体说 `figure out what went wrong with superpowers in this session`，它会调用诊断技能读会话记录，指出哪一步没按流程走。

## 适合谁 / 不适合谁

**适合：**
- 让智能体做中大型功能、苦于它「不问清楚就开写」「改着改着跑偏」的开发者；
- 认同测试驱动开发、愿意在开工前花时间确认设计的团队；
- 同时用多种编程智能体、希望流程一致的人。

**不适合：**
- 只想快速改一行代码、写个小脚本的场景——完整流程显得繁琐，也更耗 token；
- 不写测试的项目，或对话式探索为主的原型阶段；
- 非编程用途。

## 注意事项

- **许可证**：MIT。
- **维护状态**：非常活跃（最近推送 2026-10-10）；README 说明一般不接受新增技能的贡献，技能改动要在所有支持的工具上都能工作。
- **会改变智能体的默认行为**：它通过会话开始时的 Hook 注入引导指令，README 的说法是这些流程是「强制的，不是建议」。和其他同样接管流程的技能库（如 gstack、ECC）一起装容易互相打架，建议先只装一个。
- **遥测**：`brainstorming` 的可选可视化界面默认会从作者网站加载一个带版本号的图标，用于粗略统计使用量；README 称不包含项目和提示词信息，可设置环境变量 `SUPERPOWERS_DISABLE_TELEMETRY` 关闭。
- **认准仓库名**：skills.sh 榜单上有多个同名但作者不同的 superpowers 仓库，内容与它无关，安装时确认是 `obra/superpowers`。
- **安全**：插件含 Hooks 和脚本，来源知名但仍建议安装时看一眼详情面板；它会自动创建 Git 分支和工作区，请在有版本管理的项目里使用。

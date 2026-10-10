---
title: "using-git-worktrees skill 是什么、怎么用：Superpowers 让智能体在隔离工作区里开发的 Skill"
slug: superpowers-using-git-worktrees-skill
name: using-git-worktrees（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "using-git-worktrees 是 Superpowers 的工作区技能：开始功能开发或执行计划前，先检测是否已在隔离环境，优先用所在工具的原生 worktree 能力，否则回退到 git worktree，并确认测试基线干净。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.6 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体直接在你正在用的工作目录里大改代码，风险是它的半成品和你手头的改动搅在一起。using-git-worktrees 确保工作发生在隔离的工作区里。`description`：开始需要与当前工作区隔离的功能开发时，或执行实施计划之前使用——通过原生工具或回退到 git worktree 的方式，确保存在一个隔离的工作区。

它的核心原则有先后顺序：先检测是否已经隔离，再用原生工具，最后才回退到手动 git，并且「永远不要和宿主工具对着干」。具体步骤：

- **第 0 步，检测**：通过比较 git 目录判断当前是否已经在某个 worktree 里；说明里特意提醒，在 git 子模块里这个判断也会为真，要先排除。
- **第 1 步，创建**：所用工具自带 worktree 功能就用它的；没有才手动执行 git worktree 命令。目录位置优先沿用项目里已有的 `.worktrees/`，没有其他约定时默认建在项目根目录的 `.worktrees/` 下，并先确认该目录已被 git 忽略，没有就加进 `.gitignore` 并提交。
- **第 2 步，项目准备**：按项目类型安装依赖。
- **第 3 步，验证基线**：跑一遍测试，确认动手之前是绿的，这样之后出现的失败才能归因到新改动。

## 怎么安装

`using-git-worktrees` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:using-git-worktrees` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 在 Superpowers 流程里，设计确认后它会自动触发，并先声明正在用这个技能建立隔离工作区。
- 单独使用：「给支付重构开一个 worktree，装好依赖并跑一遍测试」。
- 工作结束后的合并与清理由 finishing-a-development-branch 负责。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合同时推进多件事、或想让智能体放手改又不影响主目录的开发者。worktree 会多占一份依赖安装的磁盘和时间；依赖很重的项目（大型前端、需要本地数据库的服务）每开一个都要重新准备环境；不使用 git 的项目无法使用。

## 注意事项

- **许可**：MIT。
- **会执行 git 与安装命令**，可能修改并提交 `.gitignore`。
- 基线测试本来就不通过时，它会报告并询问，而不是默默继续。

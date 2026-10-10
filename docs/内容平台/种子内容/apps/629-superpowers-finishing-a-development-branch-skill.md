---
title: "finishing-a-development-branch 是什么、怎么用：Superpowers 开发收尾 Skill（验证测试后选择合并、开 PR 或保留）"
slug: superpowers-finishing-a-development-branch-skill
name: finishing-a-development-branch（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/finishing-a-development-branch
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "finishing-a-development-branch 是 Superpowers 的收尾技能：实现完成后先跑全量测试，检测当前环境和基线分支，再给出本地合并、推送并创建 PR、保持现状几个选项，按你的选择执行并清理工作区。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/finishing-a-development-branch
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.3 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

功能做完之后的那几步——跑测试、合并、开 PR、删分支——琐碎但容易出错：合到了错误的分支，或者工作区没清理留下一堆残余。finishing-a-development-branch 把收尾固定成一个流程。`description`：实现已完成、所有测试通过、需要决定如何整合这些工作时使用。总纲是五个动作：验证测试 → 检测环境 → 给出选项 → 执行选择 → 清理。

第一步是跑项目的完整测试；失败就报告并停下，选项菜单只在全绿之后出现。第二步检测当前是普通仓库还是 worktree，这决定了展示哪种菜单以及之后怎么清理。第三步确定基线分支，并在合并前向你确认——说明里的理由是，合进错误的基线，撤销起来代价很高。

然后给出选项：在本地合并、推送并创建 PR、保持现状稍后处理。**丢弃工作不在默认菜单里**，只有你主动提出时才会走那条路，而且要求你输入确认词才执行。最后按所处环境清理工作区。和其他 Superpowers 技能一样，文末附了一张常见借口表，例如「测试大概没问题，直接合吧」。

## 怎么安装

`finishing-a-development-branch` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:finishing-a-development-branch` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 计划里的任务全部完成后会自动触发，并先声明正在用这个技能收尾。
- 手动：「这个分支做完了，帮我收尾」——它会先跑测试，再问你选哪种整合方式。
- 选择创建 PR 时，它会推送分支，再用托管平台的命令行工具（没有就用推送后打印出的创建链接）开 PR，遵循仓库已有的 PR 模板，并把链接报告给你；worktree 会保留，方便继续处理评审意见。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合用分支或 worktree 做功能开发、希望收尾动作规范一致的人。团队有自己的合并策略（必须走 PR、受保护分支等）时，要把规则告诉它；创建 PR 最顺畅的前提是本机已登录托管平台的命令行工具。

## 注意事项

- **许可**：MIT。
- **会执行合并、推送、删除 worktree 等 git 操作**，其中合并与丢弃都设计了确认环节，注意看清它确认的基线分支。
- 它不会替你做发布：合并之后的部署、打标签不在范围内。

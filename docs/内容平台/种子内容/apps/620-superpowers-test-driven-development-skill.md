---
title: "test-driven-development skill 是什么、怎么用：Superpowers 强制「先写失败测试」的 TDD Skill"
slug: superpowers-test-driven-development-skill
name: test-driven-development（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/test-driven-development
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "test-driven-development 是 Superpowers 的 TDD 技能：实现任何功能或修 bug 前先写测试并亲眼看它失败，再写最少的代码让它通过，然后重构；先写了实现代码就删掉重来。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/test-driven-development
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 24.6 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

智能体很愿意写测试，但通常是写完实现再补，而且测试往往「恰好」只验证它写出来的行为。test-driven-development 把顺序强行倒过来。`description`：实现任何功能或修复任何缺陷时，在写实现代码之前使用。核心论点只有一句——如果你没有亲眼看着测试失败，就不知道它测的是不是对的东西。

循环是经典的红—绿—重构，但每一步都加了「验证」：写一个失败的测试 → 运行并确认它因为预期的原因失败 → 写刚好够用的代码 → 运行并确认通过 → 清理重构 → 重复。「铁律」写得毫不留情：先写了实现？删掉，重新开始；不许留着当参考，不许边写测试边「改编」它，删就是真删。

说明里有相当篇幅在预先反驳各种借口（「这次太简单」「我先手动测过了」「之后再补测试」），因为作者发现模型和人一样会给自己找台阶。适用范围是新功能、缺陷修复、重构和行为变更；一次性原型、生成的代码、配置文件属于例外，但要先问过你。

## 怎么安装

`test-driven-development` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:test-driven-development` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 装了 Superpowers 后，执行计划里的每个任务都会自动按这个循环走，你会在输出里看到「先跑一次，确认失败」这样的步骤。
- 单独使用：「用 TDD 给订单模块加一个优惠券校验」。
- 修 bug 时：它会先写一个能复现问题的测试，再动业务代码。

目录里另有一份 `writing-good-tests.md`，讲怎样的测试才算好测试。

## 适合谁 / 局限

适合有测试框架、看重回归保护的项目，以及被「AI 说测试都过了，其实没测到点上」坑过的人。它明显更慢、更耗 token；探索性的原型、纯界面样式调整、没有测试基础设施的老项目用起来会很别扭，这类场景可以明确告诉它本次例外。

## 注意事项

- **许可**：MIT。
- **会反复运行测试命令**：确保项目的测试能在本机跑起来，且不会连到生产数据。
- **它真的会删代码**：按规则，抢先写出的实现会被删除重写，重要的草稿先自己留一份。
- 与 mattpocock/skills 的 `tdd` 等同类技能目的相近，二选一即可，不必叠加。

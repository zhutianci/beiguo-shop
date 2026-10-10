---
title: "systematic-debugging 是什么、怎么用：Superpowers 的四阶段调试 Skill，先找根因再动手修"
slug: superpowers-systematic-debugging-skill
name: systematic-debugging（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/systematic-debugging
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "systematic-debugging 是 Superpowers 的调试技能：遇到 bug、测试失败或异常行为时，强制按「根因调查 → 模式分析 → 假设与验证 → 实施」四阶段走，没查清根因不许提修复方案。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/systematic-debugging
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 28.5 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体修 bug，它往往看一眼报错就改，改不好再换个地方改，几轮下来代码越修越乱。systematic-debugging 用一条「铁律」堵住这条路：没有完成第一阶段的根因调查，就不允许提出修复方案。按 `description`，遇到任何 bug、测试失败或意料之外的行为，在提出修复之前使用；说明里列的适用范围还包括线上故障、性能问题、构建失败和集成问题，并特别强调越是时间紧、越觉得「就改一行」的时候越不能跳过。

四个阶段是：

1. **根因调查**：读完整的报错、稳定复现、查最近的改动，在多组件系统里逐层加日志定位到底是哪一环出错；
2. **模式分析**：找到代码库里能正常工作的类似实现，逐项对比差异；
3. **假设与验证**：一次只提一个假设，做最小的改动去验证；
4. **实施**：先写一个能复现问题的失败测试，再修根因，然后确认。

还有一道保险：同一个问题修了三次以上仍不行，就要停下来质疑架构本身，而不是继续试第四种补丁。

## 怎么安装

`systematic-debugging` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:systematic-debugging` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 「这个接口偶发 500，帮我查」——它会先收集证据、追数据流，而不是直接改代码。
- 「CI 上这三个测试挂了」——先复现和定位，再谈修复。
- 当你发现它开始乱猜时，说一句「按 systematic-debugging 来」。

目录里有几份配套技术说明：根因回溯、纵深防御、用「条件等待」替代固定延时（附 TypeScript 示例），以及一个找出「哪条测试污染了环境」的脚本。

## 适合谁 / 局限

适合排查不直观的缺陷、偶发问题和「改了又坏」的情况。对一眼能看出原因的拼写错误，完整四阶段显得繁琐；它也不能替代可观测性——没有日志和复现手段时，调查阶段会卡住，需要你提供环境或数据。

## 注意事项

- **许可**：MIT。
- **会执行命令**：调查过程要跑测试、加临时日志、查 git 历史，结束后留意临时改动是否清理干净。
- **与 TDD 技能联动**：修复阶段要求先写失败测试，项目没有测试框架时需要先说明怎么验证。

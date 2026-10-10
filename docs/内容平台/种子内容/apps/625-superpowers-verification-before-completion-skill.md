---
title: "verification-before-completion 是什么、怎么用：Superpowers「先拿证据再说完成」的 Skill"
slug: superpowers-verification-before-completion-skill
name: verification-before-completion（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/verification-before-completion
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding]
excerpt: "verification-before-completion 是 Superpowers 的收尾检查技能：在宣布完成、修好或测试通过之前，必须在当条消息里实际运行验证命令并看到输出，证据先于结论。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/verification-before-completion
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 23.3 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

「已修复，所有测试通过。」——然后你一跑，红了一片。智能体并不总是在撒谎，它常常是根据「我改了代码，所以应该好了」推断出来的。verification-before-completion 只管一件事：不许推断。`description`：即将声称工作已完成、已修复或已通过时，在提交或创建 PR 之前使用；要求运行验证命令并确认输出之后才能做任何成功声明，永远是证据先于断言。

「铁律」是：如果你没有在这条消息里运行过验证命令，就不能说它通过。配套的「关卡函数」规定了开口之前的步骤：确定哪条命令能证明这个说法 → 完整运行它 → 读全部输出和退出码 → 输出确实支持结论才可以陈述，并且要附上证据。

说明里有一张对照表，把常见说法、需要的证据和「不算数的东西」并排列出，例如：说「测试通过」需要测试命令输出零失败，上一次运行的结果或「应该能过」不算；说「构建成功」需要构建命令退出码为 0，代码检查通过不算；说「bug 修好了」需要重新测试原始症状，「代码改了」不算。还列了一批危险信号词——「应该」「大概」「看起来」——出现就该停下来去验证。

## 怎么安装

`verification-before-completion` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:verification-before-completion` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 平时无需调用，它会在智能体准备汇报完成时自动生效；你会注意到它的总结里附带了实际的命令输出。
- 怀疑它没验证时：「按 verification-before-completion，重新跑一遍并贴出结果」。
- 也适用于子智能体的汇报：主会话不能只凭「子智能体说做完了」就转述成功。

这个技能只有一份很短的 SKILL.md。

## 适合谁 / 局限

几乎适合所有让智能体改代码的人，是整套 Superpowers 里最容易单独见效的一个。前提是项目里存在可运行的验证手段（测试、构建、检查脚本）；没有的话它只能如实说「无法验证」。它保证的是「说的和跑的一致」，不保证测试本身覆盖了该测的东西。

## 注意事项

- **许可**：MIT。
- **会重复运行命令**：验证命令耗时很长的项目，可以告诉它哪条是最小充分验证。
- 不执行额外脚本，也不联网。

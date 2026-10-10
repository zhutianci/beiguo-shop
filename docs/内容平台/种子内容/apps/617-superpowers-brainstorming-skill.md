---
title: "superpowers brainstorming 是什么、怎么用：动手前先把需求问清楚的 Skill（Superpowers 流程第一步）"
slug: superpowers-brainstorming-skill
name: brainstorming（obra/superpowers）
url: https://github.com/obra/superpowers/tree/main/skills/brainstorming
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Gemini CLI / Copilot CLI / OpenCode 等"
trialNote: "/plugin install superpowers@claude-plugins-official"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "brainstorming 是 Superpowers 的第一个环节：任何「做新东西」的请求先不写代码，而是一次一个问题地弄清你要什么、为什么要，复述确认后按规模写成设计文档，必要时开浏览器给你看草图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/obra/superpowers/tree/main/skills/brainstorming
  - https://github.com/obra/superpowers
  - https://claude.com/plugins/superpowers
---

> 本文根据 obra/superpowers 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 38.6 万次；所在仓库 obra/superpowers 在 GitHub 约 29.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

编程智能体最常见的毛病是「听了半句就开工」。brainstorming 的 `description` 口气很重：在任何创造性工作之前——做功能、搭组件、加能力、改行为，或者规划任何新东西，软件之内之外都算（一场演讲、一门生意、一次装修）——必须先用它。

它要求智能体回复前先自问：关于对方想要什么、为什么要，我到底知道多少？如果请求本身已经说清了一切（「把图标改成矢车菊蓝」），直接做并说明做了什么；如果缺了要紧的信息，就进入对话。对话有明确的纪律：每条消息只以一个问题结尾，不甩问题清单；聊到差不多时把理解复述一遍让你确认；再给工作定规模——小改动在对话里确认即可，大一些的要写成设计文档，存到 `docs/superpowers/specs/` 下并提交。它还带一个「视觉伙伴」：涉及界面、布局、图示时，会问你要不要开一个浏览器标签页看草图和并排方案。

## 怎么安装

`brainstorming` 是 Superpowers 插件里的一个技能，不单独发布：作者的设计是整套一起安装，由会话开始时注入的引导指令决定各技能何时触发。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin install superpowers@claude-plugins-official
```

Codex 在 `/plugins` 里搜索 superpowers 安装；Gemini CLI 用 `gemini extensions install https://github.com/obra/superpowers`。装好后在命令菜单里以 `/superpowers:brainstorming` 的形式出现，也会按场景自动触发。

仓库整体介绍和其他安装方式，详见本站《Superpowers 是什么、怎么安装和使用：Claude Code / Codex 最热门的 Skills 开发流程框架》。

## 怎么用

- 输入 README 给的测试语句 `Let's make a react todo list`，正常情况下它不会直接写代码，而是先问你问题。
- 「我想给后台加一个导出功能」——它会追问导出什么、谁用、多大数据量，再复述方案。
- 「帮我规划一次团队技术分享」——非软件的事也会走同样的提问流程。

目录里有视觉伙伴用的本地小服务脚本（启动、停止、页面模板）和一份构建前检查提示。

## 适合谁 / 局限

适合需求常常只有一句话、又希望智能体少走弯路的人。代价是慢：每个新任务都要先聊几轮，改个小东西会觉得啰嗦——虽然技能本身规定了明确请求可以直接做。你越不耐烦回答，它后面做出来的东西越可能偏。

## 注意事项

- **许可**：MIT。
- **遥测**：README 说明视觉伙伴默认会从作者网站加载一个带版本号的图标用于粗略统计使用量，不含项目和提示词信息，可设环境变量 `SUPERPOWERS_DISABLE_TELEMETRY` 关闭。
- **会起本地服务**：视觉伙伴通过脚本在本机开一个网页，只在你同意时启动。
- 它是整套流程的入口，后面通常接 writing-plans。

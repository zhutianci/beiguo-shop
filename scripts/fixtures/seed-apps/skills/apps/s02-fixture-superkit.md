---
title: "Fixture Superkit：给多种编程 Agent 用的开发流程 Skill 库（测试夹具）"
slug: fixture-superkit
name: Fixture Superkit
url: https://github.com/fixture-org/superkit
pricing: 开源免费（MIT）
platforms: Claude Code / Codex / Cursor / Gemini CLI
trialNote: "`/plugin marketplace add fixture-org/superkit-marketplace` 然后 `/plugin install superkit@superkit-marketplace`"
products: [claude, cursor]
models: []
topics: [agent-skills, coding]
excerpt: 测试夹具：一个虚构的开发流程 Skill 库，用来验证两条安装命令、多平台归到「通用」分组的情况。
checkedOn: 2026-10-09
sources:
  - https://github.com/fixture-org/superkit
---
## 是什么

Fixture Superkit 是一个虚构的开发流程 Skill 库，专门给自动化测试用。它把「先想清楚再动手」的一整套做法写成了十几个 Skill：需求澄清、写计划、测试先行、系统化排错、收尾检查。

## 包含哪些 Skill

主要有四组：头脑风暴与需求澄清、实施计划的编写与执行、测试驱动开发、出问题时的排错流程。每一组都可以单独触发。

## 怎么安装

需要两步：先把它的市场仓库登记进来，再安装其中的插件。两条命令依次在会话里输入即可，其他 Agent 的装法见仓库说明。

## 怎么用

开始一个新功能时直接描述你要做什么，相应的 Skill 会按流程接管：先问清楚需求，再给出计划，确认后才开始写代码。

## 适合谁

适合希望 Agent 按固定流程办事、少一些即兴发挥的开发者；临时的小改动用它反而显得啰嗦。

## 注意事项

这是测试夹具，仓库地址并不存在。流程类的 Skill 会明显增加对话轮数，按量计费的账号要留意用量。

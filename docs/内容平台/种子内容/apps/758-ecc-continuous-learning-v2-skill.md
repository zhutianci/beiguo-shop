---
title: "continuous-learning-v2 skill 是什么、怎么安装使用：让 Claude Code 从会话里攒「直觉」，再长成 Skill"
slug: ecc-continuous-learning-v2-skill
name: continuous-learning-v2（affaan-m/ECC）
url: https://github.com/affaan-m/ECC/tree/main/skills/continuous-learning-v2
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex；Cursor、OpenCode、Gemini CLI 等为功能受限的适配"
trialNote: "`/plugin marketplace add https://github.com/affaan-m/ECC` 然后 `/plugin install ecc@ecc`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "continuous-learning-v2 是 ECC 的学习系统：用钩子观察每次工具调用，后台提炼成带置信度的原子化「直觉」，按项目隔离存放，积累到一定程度可以聚合成技能、命令或子智能体，也能导出导入。"
checkedOn: 2026-10-11
sources:
  - https://github.com/affaan-m/ECC/tree/main/skills/continuous-learning-v2
  - https://github.com/affaan-m/ECC
---

> 本文根据 affaan-m/ECC 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 affaan-m/ECC 在 GitHub 约 27.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

每次都要重新告诉智能体「这个项目用 pnpm」「测试文件放在同级目录」，是长期使用编程智能体最磨人的地方。continuous-learning-v2 试图让它自己记住。`description`：基于「直觉」的学习系统，通过钩子观察会话，生成带置信度评分的原子化直觉，并把它们演化为技能、命令或智能体；2.1 版增加了项目级直觉，防止跨项目串味。

**直觉（instinct）**是它的基本单位：一个触发条件对应一个动作，带 0.3 到 0.9 的置信度、领域标签（代码风格、测试、git、调试、流程等）和产生它的观察证据。置信度的含义：0.3 是试探性的，只建议不强制；0.5 在相关时应用；0.7 自动采纳；0.9 视为核心行为。同一模式反复出现时置信度升高。

**怎么运作**：工具调用前后的钩子记录观察（SKILL.md 说这比旧版在会话结束时才触发更可靠），后台由一个较小的模型做分析，不占主会话的上下文。按 git 远端地址或仓库路径识别项目，直觉默认只在本项目生效；同一条直觉在两个以上项目里出现，才可以提升为全局。

六个命令：`/instinct-status`（查看全部直觉及置信度）、`/evolve`（把相关直觉聚合成技能或命令，并建议哪些可以提升）、`/instinct-export`、`/instinct-import`、`/promote`、`/projects`。

目录里有十一个文件：观察钩子脚本、后台观察者的说明与启动脚本、项目识别脚本、管理直觉的 Python 命令行工具和配置文件。

## 怎么安装

`continuous-learning-v2` 是 ECC 插件里的一个技能。Claude Code 里装整个插件（命令来自仓库 README）：

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

ECC 的技能有三百来个，全装会让技能列表很长。README 另给了带向导的安装器 `npx ecc-universal@2.2.3 install --guided`，可以按档位和能力挑着装；只想要这一个技能，把仓库里的 `skills/continuous-learning-v2` 文件夹复制到 `~/.claude/skills/` 也行。

仓库整体介绍和其他安装方式，详见本站《ECC（Everything Claude Code）是什么、怎么安装和使用：300 个 Skills 加子智能体、Hooks 的全家桶》。

按插件安装时观察钩子已自动注册。SKILL.md 特别提醒：如果以前手动把钩子抄进过设置文件，要删掉那段，否则会重复执行并报错。

## 怎么用

- 正常工作几天后运行 `/instinct-status`，看看它总结出了什么。
- 「/evolve」——把成簇的直觉合并成一个技能草稿，你审过再保留。
- 「把这个项目里关于测试的直觉导出，给同事的环境导入」。

## 适合谁 / 局限

适合长期在固定几个项目里用 Claude Code、愿意花时间调教工作流的人。局限：它总结的是你的做法，不保证做法本身是对的——坏习惯同样会被记成直觉，需要定期翻看和清理；后台分析会额外消耗一些模型用量；观察依赖 Claude Code 的钩子，SKILL.md 另有一节说明各平台的支持情况。

## 注意事项

- **许可**：MIT。
- **会持续记录你的会话行为**：SKILL.md 的隐私说明称观察数据只留在本机、按项目隔离，能导出的只有直觉（模式），不含原始观察、代码和对话内容；数据目录在用户目录下的 `ecc-homunculus`。
- **带多个 Shell 和 Python 脚本并注册钩子**，每次工具调用前后都会运行，装之前建议看一遍 `hooks/observe.sh`。
- 导入别人的直觉相当于接受别人的行为规则，先读内容再导入。

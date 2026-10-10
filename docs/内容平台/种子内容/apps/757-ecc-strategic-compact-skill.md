---
title: "strategic-compact skill 是什么、怎么安装使用：别等自动压缩，在阶段切换时主动 /compact"
slug: ecc-strategic-compact-skill
name: strategic-compact（affaan-m/ECC）
url: https://github.com/affaan-m/ECC/tree/main/skills/strategic-compact
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex；Cursor、OpenCode、Gemini CLI 等为功能受限的适配"
trialNote: "`/plugin marketplace add https://github.com/affaan-m/ECC` 然后 `/plugin install ecc@ecc`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "strategic-compact 是 ECC 里的上下文管理技能：通过一个钩子脚本按上下文占用量和工具调用次数，在合适的时机提醒你手动执行 /compact，并给出哪些阶段该压缩、压缩后什么会保留的判断表。"
checkedOn: 2026-10-11
sources:
  - https://github.com/affaan-m/ECC/tree/main/skills/strategic-compact
  - https://github.com/affaan-m/ECC
---

> 本文根据 affaan-m/ECC 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 affaan-m/ECC 在 GitHub 约 27.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Claude Code 的会话上下文快满时会自动压缩，问题是它不管你正干到哪一步：可能恰好在一个多步修改的中途，把文件路径、变量名和半成品状态一起压没了。strategic-compact 的主张是自己挑时机。`description`：在合乎逻辑的节点建议手动压缩上下文，让上下文跨任务阶段得以保留，而不是任由自动压缩在任意时刻发生。

**怎么实现**：一个名为 `suggest-compact.js` 的脚本挂在编辑和写文件之前的钩子上，结合两个信号给出提醒。主信号是上下文实际大小——它从会话记录里读取最近一次用量并求和，在 20 万窗口上到约 16 万 token、100 万窗口上到约 25 万时建议压缩，此后每增长约 6 万再提醒一次。次信号是工具调用次数，默认 50 次时提醒，之后每 25 次一次。SKILL.md 解释了为什么调用次数只能当辅助：几次大文件读取就能塞满窗口，而很多次小调用可能几乎不占地方。

**该不该压**的判断表：

- 调研 → 规划：压，调研材料很占地方，计划才是提炼出的结果；
- 规划 → 实现：压，前提是计划已经写进文件；
- 实现 → 测试：看情况；
- 调试完 → 做下一个功能：压，调试痕迹会干扰无关的工作；
- 实现到一半：不压；
- 一条路走不通之后：压，清掉死胡同里的推理再换思路。

**压缩后什么还在**：CLAUDE.md 里的指令、磁盘上的文件、记忆文件、git 状态会保留；中间的推理、读过的文件内容、口头说过的细微偏好会丢。后面还有几节讲 token 优化：按触发表延迟加载、留意上下文的构成、查找重复的指令。

## 怎么安装

`strategic-compact` 是 ECC 插件里的一个技能。Claude Code 里装整个插件（命令来自仓库 README）：

```text
/plugin marketplace add https://github.com/affaan-m/ECC
/plugin install ecc@ecc
```

ECC 的技能有三百来个，全装会让技能列表很长。README 另给了带向导的安装器 `npx ecc-universal@2.2.3 install --guided`，可以按档位和能力挑着装；只想要这一个技能，把仓库里的 `skills/strategic-compact` 文件夹复制到 `~/.claude/skills/` 也行。

仓库整体介绍和其他安装方式，详见本站《ECC（Everything Claude Code）是什么、怎么安装和使用：300 个 Skills 加子智能体、Hooks 的全家桶》。

以插件方式安装时钩子已经注册好，不用额外配置；手动复制文件夹的话，要按 SKILL.md 里的说明自己把钩子加进设置文件。

## 怎么用

- 装好后照常工作，它会在编辑前的钩子里适时给出提醒，是否执行 `/compact` 由你决定。
- 「我刚做完调研，准备开始写代码，现在适合压缩吗？需要先把什么写进文件？」
- 「调整一下提醒阈值，工具调用到 80 次再提示」。

## 适合谁 / 局限

适合经常在一个会话里连续做几小时、跨多个阶段的 Claude Code 用户。局限：钩子机制是 Claude Code 的功能，其他智能体上只能当一份建议来读；它只提醒不代劳，压缩前把计划和关键结论落到文件里仍然是你的事；阈值是经验值，模型和窗口规格变化后可能需要自己调。

## 注意事项

- **许可**：MIT。
- **带钩子脚本**：每次编辑和写文件前会在本机运行一段 Node 脚本，读取会话记录里的用量数据；不联网。
- 压缩是有损的，重要的口头约定最好写进项目的说明文件。

---
title: "json-canvas skill 是什么、怎么安装使用：让 AI 生成 Obsidian Canvas 白板（.canvas 思维导图、流程图）"
slug: json-canvas-skill-kepano
name: json-canvas（kepano/obsidian-skills）
url: https://github.com/kepano/obsidian-skills/tree/main/skills/json-canvas
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / OpenCode"
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, learning]
excerpt: "json-canvas 是 kepano/obsidian-skills 里的白板 Skill：教智能体按 JSON Canvas 1.0 规范创建和编辑 .canvas 文件，正确处理节点、连线、分组、颜色与布局，可用于思维导图和流程图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/kepano/obsidian-skills/tree/main/skills/json-canvas
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
  - https://jsoncanvas.org/spec/1.0/
---

> 本文根据 kepano/obsidian-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 7.2 万次；所在仓库 kepano/obsidian-skills 在 GitHub 约 4.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Obsidian 的 Canvas 是一块无限白板，可以摆放文字卡片、笔记、网页链接并用箭头连接。它的文件格式 JSON Canvas 是公开规范，文件就是一段 JSON——这意味着智能体可以直接「写」出一张白板。难点在细节：节点 ID 怎么生成、坐标和尺寸怎么排才不重叠、连线从哪一侧出来。json-canvas 技能把这些讲清楚了。`description`：创建和编辑带节点、连线、分组和连接的 JSON Canvas 文件（`.canvas`）；处理 `.canvas` 文件、创建可视化白板、思维导图、流程图，或用户提到 Obsidian 的 Canvas 文件时使用。

内容包括：文件结构（顶层是 `nodes` 和 `edges` 两个数组，遵循 JSON Canvas 1.0 规范）；四个常见流程——新建白板、往已有白板加节点、连接两个节点、编辑已有白板；四种节点类型（文本、文件、链接、分组）及其通用属性；连线、颜色、ID 的生成方式（16 位十六进制）；布局建议；以及一份提交前的校验清单。完整示例放在单独的参考文件里。

## 怎么安装

`json-canvas` 随 kepano/obsidian-skills 的 `obsidian` 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

其他智能体用 `npx skills add https://github.com/kepano/obsidian-skills`，在选择界面里勾选 `json-canvas`；也可以把仓库里的 `skills/json-canvas` 文件夹直接复制到所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库》。

## 怎么用

- 「把这个项目的模块关系画成一张 Canvas，按前端、后端、数据三组分区」。
- 「根据这篇笔记的大纲生成一张思维导图」。
- 「在现有的白板里加一个『风险』节点，连到『上线计划』」。

## 适合谁 / 局限

适合用 Obsidian 做可视化梳理的人，也适合任何支持 JSON Canvas 格式的其他应用的用户。智能体是在「盲排」——它看不到渲染结果，节点很多时布局难免需要你手动拖一拖；它生成的是结构图，不是带样式设计的图表，要更精致的成品应选择专门的画图技能。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**：只读写 `.canvas` 文件。
- 编辑已有白板前先备份，JSON 写坏会导致整张白板打不开。

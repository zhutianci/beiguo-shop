---
title: "obsidian-markdown skill 是什么、怎么安装使用：让 Claude Code 写对 Obsidian 语法（双链、嵌入、Callout、属性）"
slug: obsidian-markdown-skill-kepano
name: obsidian-markdown（kepano/obsidian-skills）
url: https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-markdown
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / OpenCode"
trialNote: "`/plugin marketplace add kepano/obsidian-skills` 然后 `/plugin install obsidian@obsidian-skills`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, office, learning]
excerpt: "obsidian-markdown 是 kepano/obsidian-skills 里的格式 Skill：教智能体创建和编辑 Obsidian 风格的 Markdown，写对双链、嵌入、Callout、属性、标签和注释等 Obsidian 特有语法。"
checkedOn: 2026-10-11
sources:
  - https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-markdown
  - https://github.com/kepano/obsidian-skills
  - https://help.obsidian.md/cli
---

> 本文根据 kepano/obsidian-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.0 万次；所在仓库 kepano/obsidian-skills 在 GitHub 约 4.9 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让智能体往 Obsidian 笔记库里写笔记，标准 Markdown 它不会出错，出错的是 Obsidian 自己的那部分：把双链写成普通链接、嵌入语法少个感叹号、Callout 的类型名瞎编、属性区的 YAML 格式不对。obsidian-markdown 只管这一块。`description`：创建和编辑带有双链（wikilinks）、嵌入、Callout、属性及其他 Obsidian 特有语法的 Obsidian 风格 Markdown；处理 Obsidian 里的 `.md` 文件，或用户提到 wikilinks、callouts、frontmatter、标签、嵌入、Obsidian 笔记时使用。

SKILL.md 说得很清楚：Obsidian 在 CommonMark 和 GFM 之上扩展了一批语法，这个技能**只覆盖 Obsidian 特有的扩展**，标题、加粗、列表、表格这些标准写法默认模型已经会。内容依次是：新建一篇笔记的流程（先在文件顶部加属性区，写标题、标签、别名）、内部链接、嵌入、Callout、属性、标签、注释、Obsidian 特有的格式、LaTeX 数学公式、Mermaid 图、脚注，最后是一个完整示例。Callout、嵌入、属性三块各有一份更详细的参考文件。

## 怎么安装

`obsidian-markdown` 随 kepano/obsidian-skills 的 `obsidian` 插件一起安装。Claude Code 里输入（命令来自仓库 README）：

```text
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

其他智能体用 `npx skills add https://github.com/kepano/obsidian-skills`，在选择界面里勾选 `obsidian-markdown`；也可以把仓库里的 `skills/obsidian-markdown` 文件夹直接复制到所用工具的技能目录。

仓库整体介绍和其他安装方式，详见本站《obsidian-skills 是什么、怎么安装：Obsidian CEO kepano 写的 Agent Skills，让 Claude Code 读写 Obsidian 笔记库》。

## 怎么用

在笔记库所在的文件夹里启动智能体：

- 「把这份会议记录整理成一篇笔记，加上日期和参会人属性，人名都做成双链」。
- 「把这三篇笔记里关于定价的段落嵌入到一篇汇总笔记里」。
- 「把文中的注意事项改成 warning 类型的 Callout」。

## 适合谁 / 局限

适合用 Obsidian 管理笔记、并希望 AI 帮忙批量整理和撰写的人。它只保证语法正确，笔记怎么组织、链接到哪篇仍取决于你的指示和库里已有的内容；依赖第三方插件的语法（如 Dataview 查询）不在覆盖范围内。

## 注意事项

- **许可**：MIT。
- **不执行脚本、不联网**：纯格式说明；但智能体会直接改写你的笔记文件，批量操作前先备份或用 git 管理笔记库。
- 这是该库在 skills.sh 当日榜单上安装量最高的技能。

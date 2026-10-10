---
title: "theme-factory skill 是什么、怎么用：Anthropic 官方的主题配色 Skill（10 种预设主题，一键套到幻灯片和文档）"
slug: anthropic-theme-factory-skill
name: theme-factory（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/theme-factory
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, product-design, office]
excerpt: "theme-factory 是 anthropics/skills 里的主题样式 Skill：内置 10 种配色加字体搭配的预设主题，可套用到幻灯片、文档、报告、落地页等产出物，也能按需求现场生成新主题。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/theme-factory
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 9.0 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

内容写好了，但配色和字体拿不定主意——theme-factory 解决的是这一步。`description` 把它定位成给产出物上主题的工具箱：对象可以是幻灯片、文档、报告、HTML 落地页等，内置 10 种带配色和字体的预设主题，可以套到任何已经做好的产出物上，也可以临时生成一个新主题。

每个主题包含三样东西：一组给出十六进制色值的配色、标题与正文的字体搭配，以及适合的场合说明。十个预设从名字就能看出气质：Ocean Depths、Sunset Boulevard、Forest Canopy、Modern Minimalist、Golden Hour、Arctic Frost、Desert Rose、Tech Innovation、Botanical Garden、Midnight Galaxy。

使用流程是固定的：先把目录里的 `theme-showcase.pdf`（主题总览）展示给你看 → 问你选哪一个 → 读取对应的主题文件 → 把颜色和字体一致地应用到产出物上。十个都不合适时，它会根据你的描述生成一个同样结构的新主题，给你确认后再应用。

## 怎么安装

`theme-factory` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/theme-factory` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「给刚才那份产品介绍幻灯片换个主题，先让我看看有哪些可选」。
- 「用 Midnight Galaxy 主题重新排这份 HTML 报告」。
- 「我们是做户外装备的，帮我生成一个偏大地色的新主题，再套到这份方案上」。

目录结构很简单：一份总览 PDF 加 `themes/` 下的十个主题文件，每个文件就是一份配色与字体说明。

## 适合谁 / 局限

适合不擅长配色、又希望材料看起来统一的人，和 pptx、docx 这类文档技能或网页类技能搭配使用效果最好。它只提供颜色和字体，不改版式和内容结构；字体是否生效取决于运行环境里有没有安装对应字体；预设主题数量有限，品牌方有明确规范时应该用自己的品牌技能而不是它。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **不执行脚本、不联网**：只有说明文件和一份 PDF。
- **先看再选**：技能要求先展示总览再让用户选择，如果它直接替你挑了主题，可以让它把可选项列出来。
- 主题文件是普通的 Markdown，想固定用某一套配色，可以复制一份改成自己的主题。

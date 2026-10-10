---
title: "Claude pptx skill 是什么、怎么用：Anthropic 官方 PPT 技能（新建、按模板改、读取 .pptx）"
slug: anthropic-pptx-skill
name: pptx（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/pptx
pricing: "免费使用（源码可见，非开源；条款见 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install document-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office, ppt]
excerpt: "pptx 是 Claude 生成和编辑 PowerPoint 背后的官方 Skill：新建用 pptxgenjs 脚本，改已有文件或套模板时解包改 XML，读内容用 markitdown，并要求渲染成图片做版面检查。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/pptx
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 23.3 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

pptx 是 Anthropic 公开的四个文档技能之一，也就是 Claude 能直接交付 `.pptx` 文件的那套做法。它的 `description` 写得很宽：只要任务里出现 `.pptx` / `.potx` 文件——新建演示文稿、读取或提取文字、修改已有幻灯片、合并拆分、套用模板、处理备注和批注——都应该使用它；用户提到 deck、slides、presentation 这类词也会触发。

技能按任务给了三条路线：**新建**时写一段 `pptxgenjs` 脚本生成文件；**修改已有文件或基于模板制作**时，把 `.pptx` 当成 ZIP 解开，直接改里面的幻灯片 XML 再打包；**只读内容**时用 `markitdown` 转成文本，或用缩略图脚本把所有页拼成一张带编号的总览图。说明里还有一大段设计建议（配色、字号、留白、常见错误），以及必须执行的检查：内容核对、文件能否正常打开、把页面转成图片逐页看有没有溢出和重叠。

## 怎么安装

`pptx` 属于 anthropics/skills 仓库的 document-skills 插件包（docx、xlsx、pptx、pdf 四个一起）。在 Claude Code 会话中输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

claude.ai 网页版和 App 不用安装：README 说明文档类技能已内置，生成或读取对应文件时会自动启用。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「把这份 Markdown 大纲做成 10 页左右的汇报 PPT，配色稳重一点」——走新建路线，产出 `.pptx` 文件。
- 「用公司模板 template.pptx 做一份季度复盘，保留母版和页脚」——先出缩略图挑版式，再复制对应页面填内容。
- 「把 deck.pptx 里每一页的要点提取成一份摘要」——走读取路线。

目录里带了 `scripts/`：缩略图、复制幻灯片、清理多余部件等脚本，以及一批 Office 文件格式的校验用 schema。

## 适合谁 / 局限

适合经常要把文档、数据变成汇报材料，并且需要可继续编辑的原生 PPT 文件的人。它对版式有自检，但审美仍然依赖你给的要求；复杂动画、内嵌视频、和企业模板严格对齐这类需求，生成后还得在 PowerPoint 里手工调整。

## 注意事项

- **许可**：与多数示例技能不同，四个文档技能是「源码可见」而非开源，`license` 字段写的是 Proprietary，条款见目录内 LICENSE.txt（受你与 Anthropic 的服务协议约束），不要拿去二次分发。
- **会执行脚本**：依赖 pptxgenjs（npm）、markitdown、Pillow 等 Python 库，转图片预览还要用到 LibreOffice，完整清单见 SKILL.md 的 Dependencies 一节；Claude Code 里缺依赖时它会尝试安装，留意它执行的命令。
- **仅供演示参考**：官方声明仓库里的实现与 Claude 产品内的实际行为可能不同。
- 想要更强的中文排版或 SVG 转原生形状，可以对比本站 Skill 库里的其他 PPT 类技能。

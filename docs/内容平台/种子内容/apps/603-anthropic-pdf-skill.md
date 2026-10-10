---
title: "Claude pdf skill 是什么、怎么安装使用：Anthropic 官方 PDF 技能（提取、合并拆分、填表单、OCR）"
slug: anthropic-pdf-skill
name: pdf（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/pdf
pricing: "免费使用（源码可见，非开源；条款见 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install document-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office]
excerpt: "pdf 是 Anthropic 官方的 PDF 处理 Skill：读取文字和表格、合并拆分、旋转、加水印、新建 PDF、填写表单、加解密、提取图片，以及对扫描件做 OCR，附带一组表单处理脚本。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/pdf
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.8 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

pdf 技能教 Claude 用一组成熟的开源工具处理 PDF，而不是凭感觉写代码。`description` 列得很全：读取或提取文字与表格、把多个 PDF 合并成一个、拆分、旋转页面、加水印、新建 PDF、填写表单、加密解密、提取图片、给扫描件做 OCR 使其可搜索——只要用户提到 `.pdf` 文件或要求产出 PDF，就应该使用它。

SKILL.md 本身是一份操作指南：基础操作用 `pypdf`（合并、拆分、旋转、元数据、密码保护），带版面的文字和表格提取用 `pdfplumber`，新建文档用 `reportlab`，命令行场景用 `pdftotext`、`qpdf`、`pdftk`。说明里还记了一些容易踩的坑，比如 reportlab 内置字体不含 Unicode 上下标字符，直接写会变成黑块，要改用它的标记语法。填表单是单独一份 `forms.md`，更高级的用法在 `reference.md`，都是用到时才读。

## 怎么安装

`pdf` 属于 anthropics/skills 仓库的 document-skills 插件包（docx、xlsx、pptx、pdf 四个一起）。在 Claude Code 会话中输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

claude.ai 网页版和 App 不用安装：README 说明文档类技能已内置，生成或读取对应文件时会自动启用。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「把这三份合同合并成一个 PDF，并在每页加上『内部资料』水印」。
- 「提取 report.pdf 第 5 到 12 页的所有表格，存成 Excel」。
- 「帮我填这份申请表 form.pdf，字段内容在 data.json 里」——它会先检查表单是否有可填写字段，有就按字段名填，没有则在对应位置加文字标注，并生成校验图片供核对。

目录里的 `scripts/` 有 8 个脚本，基本都服务于表单：检查可填字段、提取字段信息和表单结构、把页面转成图片、检查标注框位置、执行填写。

## 适合谁 / 局限

适合经常批量处理 PDF 的办公、法务、财务场景，以及需要从报告里抽表格做分析的人。扫描件的识别质量取决于 OCR 引擎和原件清晰度；排版复杂的多栏文档、跨页表格提取后仍要人工核对；它不解决「把 PDF 原样转成可编辑 Word」这种版式还原问题。

## 注意事项

- **许可**：`license` 字段为 Proprietary（源码可见、非开源），条款见目录内 LICENSE.txt，不要二次分发。
- **依赖**：需要 Python 以及上面提到的库；OCR 和部分命令行工具要另外安装。
- **隐私**：处理合同、证件这类文件时，注意文件会被读入对话上下文；在 Claude Code 本地运行时脚本在你的机器上执行。
- 加密解密功能只应用于你有权处理的文件。

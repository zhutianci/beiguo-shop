---
title: "Claude docx skill 是什么、怎么安装使用：Anthropic 官方 Word 技能（生成、修订、批注 .docx）"
slug: anthropic-docx-skill
name: docx（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/docx
pricing: "免费使用（源码可见，非开源；条款见 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install document-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, office]
excerpt: "docx 是 Anthropic 官方的 Word 文档 Skill：新建用 docx-js 脚本，修改已有文档时解包编辑 XML，读取用 pandoc，支持修订记录、批注、目录、页码和模板 .dotx。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/docx
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 19.9 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让 AI「写一份 Word」和让它交出一个打开不报错、格式规整的 `.docx` 文件是两回事。docx 技能解决后者。按 `description`，用户要创建、读取、编辑 Word 文档（`.docx`）或模板（`.dotx`），提到「Word 文档」，或者要求带目录、标题层级、页码、信头的正式文档时会触发；提取和重排内容、插入替换图片、查找替换、处理修订和批注也在范围内。说明里同时划了边界：PDF、表格、Google Docs 以及与文档生成无关的编程任务不要用它。

做法分三种：**新建**时写一段基于 `docx`（npm 包，也叫 docx-js）的脚本；**修改已有文档**时把 `.docx` 当 ZIP 解开，改 `word/document.xml` 后再打包——因为 docx-js 打不开现成文件；**读取**用 `pandoc` 转成 Markdown。SKILL.md 的大部分篇幅是「坑位清单」：页面默认是 A4、横向页面要怎么传尺寸、表格宽度要在两处同时设置等等，都是模型容易写错、Word 打开才发现的问题。

## 怎么安装

`docx` 属于 anthropics/skills 仓库的 document-skills 插件包（docx、xlsx、pptx、pdf 四个一起）。在 Claude Code 会话中输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

claude.ai 网页版和 App 不用安装：README 说明文档类技能已内置，生成或读取对应文件时会自动启用。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「把这份会议纪要整理成正式的 Word 报告，带封面、目录和页码」。
- 「在 contract.docx 里把甲方名称全部替换，并以修订模式保留改动痕迹」。
- 「给这份方案加批注，指出预算部分的三个问题」。

目录里的 `scripts/` 提供接受修订、添加批注、合并被拆碎的文本片段等脚本，以及校验 Office 文件结构用的 schema。

## 适合谁 / 局限

适合要把内容交付成 Word 的人：报告、公文、合同修订、带格式的模板填充。它保证的是结构正确和基本排版，复杂的图文混排、域代码、宏并不擅长；对版式要求极严的公文，生成后仍需在 Word 里检查一遍。

## 注意事项

- **许可**：`license` 字段为 Proprietary（源码可见、非开源），条款见目录内 LICENSE.txt。
- **依赖**：Node（docx 包）、Python 脚本和 pandoc；SKILL.md 提醒 docx 包在 Claude 的环境里已预装，本地 Claude Code 里缺失时才需要安装。
- **改文件前先备份**：解包改 XML 的方式是直接改动原文件内容。
- claude.ai 里生成 Word 文件走的就是这类内置能力，仓库实现仅供参考，行为可能不同。

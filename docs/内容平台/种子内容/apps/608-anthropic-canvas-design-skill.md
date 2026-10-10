---
title: "canvas-design skill 是什么、怎么安装使用：Anthropic 官方的海报与静态视觉设计 Skill（输出 PNG / PDF）"
slug: anthropic-canvas-design-skill
name: canvas-design（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/canvas-design
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, poster, illustration]
excerpt: "canvas-design 是 anthropics/skills 里做静态视觉作品的 Skill：先写一份「设计哲学」，再据此在画布上生成海报、艺术图或设计稿，输出 .png / .pdf，自带一批开源字体。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/canvas-design
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 11.5 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

canvas-design 让 Claude 用代码「画」出静态视觉作品。按 `description`，用户要求做海报、艺术作品、设计稿或其他静态图时使用，产出是 `.png` 和 `.pdf` 文件；说明里特别要求做原创设计，不要模仿在世艺术家的作品，以免侵权。

它的做法分两步，这也是和普通「画一张图」提示词最不一样的地方。第一步不是画，而是写：先创作一份「视觉哲学」——一段描述某种审美主张的文字（形式、空间、色彩、构图怎么用，文字只作为点缀），存成 `.md`。用户给的主题只是起点，不应束缚发挥。第二步才是把这份哲学「表达」到画布上，生成单页或多页作品。技能反复强调工艺感：成品要像是花了很长时间打磨出来的，文字极少、排版精确、留白充分。

## 怎么安装

`canvas-design` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/canvas-design` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「给社区读书会做一张 A3 海报，主题是『慢读』」——先得到一份设计哲学文档，再得到 PDF / PNG。
- 「做一组三张的系列视觉，表现城市的清晨、正午、深夜」——可用多页选项。
- 「按刚才那份哲学再出一版，颜色更克制」。

目录里的 `canvas-fonts/` 带了几十个字体文件及各自的 OFL 许可文本，画布排版时直接调用，不依赖你系统里装了什么字体。

## 适合谁 / 局限

适合需要活动海报、封面、装饰画这类「以形式感为主」的静态图的人，也适合想看看 Claude 用代码作图能做到什么程度的设计师。它不调用图像生成模型，所有内容都是程序绘制的图形和文字，所以做不了写实照片、人物插画；需要大段说明文字的信息类海报也不是它的方向——技能的取向是「字越少越好」。

## 注意事项

- **许可**：技能本体为 Apache-2.0（目录内 LICENSE.txt）；自带字体各自遵循 SIL OFL，许可文本与字体放在一起。
- **会执行代码**：生成图片需要运行绘图脚本，在 Claude Code 或 claude.ai 的代码执行环境中使用。
- **原创要求**：不要让它仿制特定艺术家或品牌的作品。
- 自带字体以拉丁字母字体为主，做中文海报时留意是否出现缺字，必要时指定本机已安装的中文字体。

---
title: "guizang-ppt-skill 是什么、怎么安装使用：歸藏的网页 PPT Skill（杂志风 / 瑞士风单文件 HTML 演示）"
slug: guizang-ppt-skill-html-slides
name: guizang-ppt-skill（歸藏的网页 PPT Skill）
url: https://github.com/op7418/guizang-ppt-skill
pricing: "开源免费（AGPL-3.0）"
platforms: "Claude Code / Codex；Cursor 等有文件与命令权限的本地 Agent 可用"
trialNote: "npx skills add https://github.com/op7418/guizang-ppt-skill --skill guizang-ppt-skill"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ppt, office]
excerpt: "guizang-ppt-skill 是歸藏（op7418）开源的网页 PPT Skill：生成单文件 HTML 横向翻页演示，内置电子杂志风与瑞士国际主义两套视觉系统，带演讲者模式、排练计时，并能生成配图和多平台封面。"
checkedOn: 2026-10-11
sources:
  - https://github.com/op7418/guizang-ppt-skill
  - https://github.com/op7418/guizang-ppt-skill/blob/main/README.en.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 op7418/guizang-ppt-skill 仓库的中英文 README 整理，资料核对于 2026-10-11。版式与主题数量随版本更新，以仓库为准。

## 是什么

guizang-ppt-skill 是 AI 博主歸藏（GitHub 用户名 op7418）开源的一个演示文稿技能。它不生成 `.pptx`，而是生成**单个 HTML 文件**：横向左右翻页，不需要构建和服务器，浏览器直接打开。README 说它是作者在多场线下分享中沉淀出来的，踩过的坑都写进了仓库里的检查清单。

内置两套视觉系统：

- **Style A：电子杂志 × 电子墨水**，README 的形容是「像 Monocle 贴上了代码」，适合叙事、观点和带个人风格的分享；
- **Style B：瑞士国际主义**，网格至上、单一高饱和锚点色、直角与发丝线、极致的字号对比，适合讲事实、产品、分析和方法论。

截至 2026-10-11，GitHub 显示该仓库约 2.8 万 Star、1906 Fork，最近一次推送在 2026-08-07。

## 包含哪些 Skill

仓库只有一个技能，但能力分几块（均出自 README）：

- **版式**：Style A 有 10 种布局（封面、章节、数据大字报、图文、图片网格、流程、对比等），Style B 有 22 种锁定版式；主题色预设分别为 5 套和 4 套；
- **翻页与导航**：键盘方向键、滚轮、触屏滑动、底部圆点、ESC 索引；
- **演讲者模式**：双窗口观众屏、当前页与下一页预览、演讲备注、计时排练、自动翻页、激光笔和圈选，以及现场故障恢复；
- **配图与封面**：在 Codex 里可调用图像生成能力做纪实照片、信息图、流程图等配图；按同一套视觉规则生成公众号 21:9 头图、1:1 分享卡、小红书 3:4、视频号横版等封面；
- **低性能静态模式**：按 `B` 关闭动画，退回静态背景。

## 怎么安装

README 推荐的一行命令：

```bash
npx skills add https://github.com/op7418/guizang-ppt-skill --skill guizang-ppt-skill
```

手动安装：

```bash
git clone https://github.com/op7418/guizang-ppt-skill.git ~/.claude/skills/guizang-ppt-skill
```

也可以把仓库地址发给有命令行权限的智能体，让它代为克隆并检查 `SKILL.md`、`assets/`、`references/` 是否齐全。更新时在该目录执行 `git pull`。

## 怎么用

装好后直接说需求，README 给的例子：

- 「帮我基于这篇文章做一份瑞士风 PPT，控制在 7 页左右，需要 2-3 张配图」；
- 「帮我把这份 Markdown 做成杂志风演讲 PPT」；
- 「基于这份 PPT 的核心观点，生成一张公众号 21:9 头图」；
- 「给这份 PPT 补齐演讲备注和每页计划时长，然后用演讲者模式帮我排练」。

## 适合谁 / 不适合谁

README 自己写得很坦率。**适合**：线下分享、行业内部讲话、私享会、产品发布、demo day，以及带强烈个人风格的演讲。**不适合**：大段表格数据、培训课件（信息密度不够）、需要多人协作编辑的场景（成品是静态 HTML）。另外，README 把没有文件系统和浏览器预览的普通聊天机器人列为「不推荐」。

需要交付可编辑 `.pptx` 的话，可以看本站 Skill 库里的 PPT Master 或 Anthropic 官方的 pptx 技能。

## 注意事项

- **许可证是 AGPL-3.0**：比常见的 MIT 严格。自己用它做演示没有问题；如果要修改这个技能并对外分发，或把它做成对外提供的网络服务，需要按 AGPL 的要求开放相应源代码，商用前请自行评估。
- **维护状态**：最近推送 2026-08-07；README 提到项目有商业赞助方，并列出了几个可使用该技能的第三方平台，那些平台的服务条款与本仓库无关。
- **配图依赖图像模型**：配图流程针对 Codex 的图像生成能力设计，会消耗相应额度；Claude Code 里没有内置生图时这一步要另想办法。
- **安全**：技能会写文件、打开浏览器预览。安装前浏览一遍 `SKILL.md`。
- 成品是单个 HTML，分享时注意里面是否嵌入了不想公开的图片或备注。

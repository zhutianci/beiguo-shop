---
title: "baoyu-slide-deck 是什么、怎么安装使用：宝玉的图片式幻灯片 Skill（适合阅读和分享的 PPT 图集）"
slug: baoyu-slide-deck-skill
name: baoyu-slide-deck（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-slide-deck
pricing: "开源免费（MIT）；生图需所用工具的生图能力或自备 API Key"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-slide-deck"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ppt, social-media]
excerpt: "baoyu-slide-deck 是宝玉 baoyu-skills 里的幻灯片技能：把内容做成一组专业的幻灯片图片——先写带风格说明的大纲，再逐页生图并合并；定位是「用来阅读和分享」而不是现场演讲，内置 17 种预设风格。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-slide-deck
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

baoyu-slide-deck 做的「幻灯片」和通常的 PPT 不太一样：每一页是生图模型画出来的一张图片。技能开头把定位说得很清楚——这套幻灯片是为**阅读和分享**设计的（每页能独立看懂、顺着往下翻逻辑通顺、适合在社交媒体传播），而不是为现场演讲设计的，后面所有关于版式和信息密度的决定都基于这个前提。`description`：从内容生成专业的幻灯片图片；先创建带风格说明的大纲，再生成每一页的图片；用户要求创建幻灯片、制作演示文稿、生成 deck 或 PPT 时使用。

风格系统提供 17 种预设；选择「自定义维度」时，可以分别设定质感、情绪、字体排印和信息密度。不指定时会根据内容自动选择，页数也有一套估算规则。

流程九步：准备并分析 → **确认方案**（必需）→ 生成大纲 → 审阅大纲（按需）→ 生成每页的提示词 → 审阅提示词（按需）→ 生成图片 → 合并 → 总结。大纲和提示词都落成文件，可以在生成图片之前修改，这是控制成品质量最有效的环节。支持提供参考图，也支持之后单独修改某一页。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-slide-deck
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「把这篇长文做成 12 页左右的幻灯片图集，适合发在社交平台」。
- 「先给我看大纲，我确认之后再生成图片」。
- 「第 5 页信息太密，拆成两页」。

`references/` 下有内容规则、设计指引、版式、各风格和大纲模板等，另有合并用的脚本。

## 适合谁 / 局限

适合把文章、报告改编成可滑动浏览的图集，用于社交媒体传播或内部分享。成品是图片，**不能在 PowerPoint 里编辑文字**——需要可编辑的 `.pptx`，应选择 Anthropic 官方的 pptx 技能或本站介绍过的 PPT Master；每页一次生图调用，页数多时耗时和费用都不低；图中文字的准确性要逐页检查。

## 注意事项

- **许可**：MIT。
- **需要生图能力和脚本运行环境**：技能声明需要 `bun` 或 `npx`；生图优先用所在工具的原生功能，否则需自备 API Key。
- **会执行脚本并在目录里生成多个文件**（大纲、提示词、图片、合并结果）。
- 发布前核对事实与数字，按平台规定标识 AI 生成内容。

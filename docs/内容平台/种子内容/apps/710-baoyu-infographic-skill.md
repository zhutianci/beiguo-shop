---
title: "baoyu-infographic 是什么、怎么安装使用：宝玉的信息图 Skill（21 种版式 × 22 种风格）"
slug: baoyu-infographic-skill
name: baoyu-infographic（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-infographic
pricing: "开源免费（MIT）；生图需所用工具的生图能力或自备 API Key"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-infographic"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, infographic, social-media]
excerpt: "baoyu-infographic 是宝玉 baoyu-skills 里的信息图技能：分析内容后推荐「版式 × 风格」的组合，从 21 种信息结构和 22 种视觉风格里自由搭配，生成可直接发布的高密度信息大图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-infographic
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

信息图要同时解决两个问题：信息怎么组织，画面长什么样。baoyu-infographic 把它们拆成两个独立的维度。技能开头一句话概括：**版式**（信息结构）× **风格**（视觉美学），任意版式可以和任意风格自由组合。`description`：用 21 种版式类型和 22 种视觉风格生成专业信息图；分析内容、推荐版式与风格的组合，并生成可发布的信息图；用户要求创建信息图、可视化总结或「高密度信息大图」时使用。

版式决定信息的骨架——例如便当格（bento grid）、二元对比、桥接、环形流程、漫画条、对比矩阵、仪表盘、密集模块、漏斗等；风格决定画面的气质。技能里有「推荐组合」和一组关键词快捷方式，说出某些词可以直接对应到一种组合。

流程七步：准备并分析内容 → 生成结构化内容 → 推荐若干组合 → **确认选项** → 生成提示词文件 → 生成图片 → 输出总结。中间产物都会存成文件，方便你修改提示词后重新生成。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-infographic
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「把这份行业报告的要点做成一张信息图，先给我推荐三种版式和风格的组合」。
- 「用漏斗版式表现我们的转化流程」。
- 「信息太挤了，换成便当格版式，风格不变」。

`references/` 里每种版式和风格各有一份说明文件，另有内容分析框架和基础提示词。

## 适合谁 / 局限

适合做内容运营、行业研究、培训材料的人，需要把一段复杂内容压缩成一张可传播的图时很省事。图是生图模型画的，不是矢量排版：数字和文字可能出错，细小的字可能糊，不能像设计稿那样逐个元素修改；对准确性要求高的数据图表，应当用代码或专业工具绘制。

## 注意事项

- **许可**：MIT。
- **需要生图能力**：优先使用所在工具的原生生图功能，否则需要自备图像服务商的 API Key 并按用量付费。
- **核对内容**：信息图里的每个数字和结论发布前对照原文检查一遍。
- 首次使用会引导设置偏好并保存，之后可以修改。

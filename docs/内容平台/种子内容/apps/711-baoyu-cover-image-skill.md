---
title: "baoyu-cover-image 是什么、怎么安装使用：宝玉的文章封面图 Skill（五个维度定制，支持 2.35:1 / 16:9 / 1:1）"
slug: baoyu-cover-image-skill
name: baoyu-cover-image（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-cover-image
pricing: "开源免费（MIT）；生图需所用工具的生图能力或自备 API Key"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-cover-image"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, social-media, wallpaper]
excerpt: "baoyu-cover-image 是宝玉 baoyu-skills 里的封面图技能：从类型、配色、渲染方式、文字、情绪五个维度定制文章封面，内置 11 套配色和 7 种渲染风格，支持电影宽幅、宽屏和方形三种比例。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-cover-image
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

写完文章配封面是件小事，却总要花掉不成比例的时间。baoyu-cover-image 把「封面长什么样」拆成五个可以分别选择的维度，让智能体根据文章内容自动搭配，再交给生图模型。`description`：用五个维度（类型、配色、渲染、文字、情绪）生成文章封面图，组合 11 套配色和 7 种渲染风格；支持电影宽幅（2.35:1）、宽屏（16:9）和方形（1:1）三种比例；用户要求生成封面图、创建文章封面时使用。

五个维度是：

- **类型**：封面的构图类别；
- **配色**：11 套调色板，如冷色、暗色、双色调、大地色、优雅等；
- **渲染**：7 种画面质感；
- **文字**：封面上放多少字、怎么放；
- **情绪**：整体的氛围强度。

流程五步，其中两步会停下来：加载偏好（阻断式，第一次使用要先完成设置）→ 分析文章内容 → **确认选项** → 生成提示词 → 生成图片并报告。它有自动选择机制：不指定时根据文章内容推断合适的组合。生成后可以只改某个维度重新出图。技能里还有一节讲封面的构图原则。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-cover-image
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「给这篇公众号文章生成封面，2.35:1」。
- 「同一篇再出一张 1:1 的，用于分享卡片」。
- 「文字太多了，改成只保留标题，配色换成暗色」。

`references/` 下是各维度、各配色的说明以及偏好配置和水印指南。

## 适合谁 / 局限

适合公众号、博客、专栏作者和内容运营。它做的是插画感、氛围感的封面，不是带精确排版的设计稿；封面上的文字由生图模型渲染，中文可能出现错字或变形，标题字数越少越稳妥；需要品牌规范严格一致的系列封面时，仍建议用设计工具套模板。

## 注意事项

- **许可**：MIT。
- **需要生图能力**：优先用所在工具的原生生图功能，否则需自备图像服务商的 API Key，按用量付费。
- **版权与标识**：不要让它仿制他人的品牌或作品；平台要求标识 AI 生成内容的，按规定标注。
- 偏好配置保存在本地文件里，可随时让它修改。

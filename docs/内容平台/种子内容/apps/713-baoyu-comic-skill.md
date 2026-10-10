---
title: "baoyu-comic 是什么、怎么安装使用：宝玉的知识漫画 Skill（把科普、传记、教程画成多页漫画）"
slug: baoyu-comic-skill
name: baoyu-comic（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-comic
pricing: "开源免费（MIT）；生图需所用工具的生图能力或自备 API Key"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-comic"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, comic, learning]
excerpt: "baoyu-comic 是宝玉 baoyu-skills 里的知识漫画技能：把一个知识主题、人物传记或教程做成原创的教育漫画，可选水墨、日漫、清线、粉笔、极简、写实等画风与不同基调，给出详细的分镜并支持批量生图。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-comic
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

把一个知识点画成漫画，比写成文章更容易被读完。baoyu-comic 负责从选题到分镜到出图的全过程。技能的定位是用灵活的「画风 × 基调」组合来创作原创的知识漫画。`description`：知识漫画创作工具，支持多种画风和基调；创作带详细分镜版面的原创教育漫画，并支持批量生成图片；用户要求创作「知识漫画」「教育漫画」、传记漫画、教程漫画，或 Logicomix 风格的漫画时使用（Logicomix 是一本用漫画讲数理逻辑史的知名作品）。

视觉上有几个可以分别选择的维度：画风（目录里能看到粉笔、水墨、清线、日漫、极简、写实等）、基调，以及若干打包好的预设。它有一套自动选择规则，按主题推荐合适的组合。

创作流程是分步推进、带进度清单的：加载偏好并分析内容 → 确认画风、侧重点和受众 → 生成故事板与角色设定 → 审阅大纲（按需）→ 生成每页的提示词 → 审阅提示词（按需）→ 先出角色设定图、再逐页生成（用角色图作参考，以保持同一角色在各页里长相一致）→ 合并成 PDF → 完成报告。技能支持「部分流程」：比如只要故事板不出图，或基于已有分镜继续。生成后可以单独重画某一页。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-comic
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「把『复利是怎么回事』做成一部 8 页的知识漫画，日漫画风，轻松一点」。
- 「先只出故事板和分镜，我看过再生成图片」。
- 「第 4 页主角的发型和前面不一致，重画」。

`references/` 下是各画风、基调、版面、角色模板和分析框架的说明。

## 适合谁 / 局限

适合做科普、教育内容和知识类自媒体的创作者，以及想给课程配漫画的老师。角色跨页一致性是生图模型的老问题，技能用角色模板来缓解，但无法根除；对话框里的中文文字可能出错；多页漫画的生图次数多，成本不低。

## 注意事项

- **许可**：MIT。
- **原创要求**：技能强调创作原创漫画，不要让它模仿具体漫画家的作品或使用知名动漫角色；人物传记类内容涉及真实人物时注意事实准确与肖像权。
- **需要生图能力和脚本环境**：声明需要 `bun` 或 `npx`；生图优先用所在工具的原生功能，否则需自备 API Key。
- 知识内容的正确性要自己把关，画得好看不等于讲得对。

---
title: "baoyu-xhs-images 是什么、怎么安装使用：宝玉的小红书图文卡片 Skill（12 种风格、8 种版式）"
slug: baoyu-xhs-images-skill
name: baoyu-xhs-images（JimLiu/baoyu-skills）
url: https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-xhs-images
pricing: "开源免费（MIT）；生图需所用工具的生图能力或自备 API Key"
platforms: "Claude Code / Codex / Cursor / OpenClaw 等"
trialNote: "npx skills add jimliu/baoyu-skills --skill baoyu-xhs-images"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, social-media, infographic]
excerpt: "baoyu-xhs-images 是宝玉 baoyu-skills 里的图文卡片技能：把一段内容拆成 1 到 10 张适合社交平台的卡通风格图片卡片，提供 12 种视觉风格、8 种版式和 3 套配色，先分析内容并确认方案再批量生成。"
checkedOn: 2026-10-11
sources:
  - https://github.com/JimLiu/baoyu-skills/tree/main/skills/baoyu-xhs-images
  - https://github.com/JimLiu/baoyu-skills
  - https://github.com/JimLiu/baoyu-skills/blob/main/README.zh.md
  - https://github.com/vercel-labs/skills
---

> 本文根据 JimLiu/baoyu-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。所在仓库 JimLiu/baoyu-skills 在 GitHub 约 2.7 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

小红书、微信图文这类平台，一篇内容往往要配一组风格统一的图片卡片。手工做要排版、要画图，一组下来半天。baoyu-xhs-images 把这件事交给智能体加生图模型。`description`：生成信息图式的图片卡片系列，提供 12 种视觉风格、8 种版式和 3 套配色；把内容拆成 1 到 10 张卡通风格的图片卡片，为社交媒体的互动效果做优化；用户提到「小红书图片」「小红书种草」「小绿书」「微信图文」「微信贴图」「图片卡片」时使用。

流程有两道「必须停下」的关卡：

- **第 0 步，加载偏好**：读取你保存的偏好配置（水印、默认风格、首选的生图后端等），第一次使用会引导设置；
- **第 1 步，分析内容**：把内容拆解并写成一份分析文件；
- **第 2 步，确认方案**：给出推荐的风格与版式组合让你确认，这一步是必需的；
- **第 3 步，生成图片**；第 4 步，完成报告。

风格与版式可以自由组合，技能里有一张「风格 × 版式」的搭配矩阵和若干预设；也支持提供参考图。生成后可以单独修改某一张。

## 怎么安装

仓库 README 的安装命令是 `npx skills add jimliu/baoyu-skills`，会进入选择界面；只装这一个，可以加 skills CLI 的 `--skill` 参数：

```bash
npx skills add jimliu/baoyu-skills --skill baoyu-xhs-images
```

Claude Code 也可以整库安装：`/plugin marketplace add JimLiu/baoyu-skills` 后 `/plugin install baoyu-skills@baoyu-skills`。README 列出的前置条件是能运行 `npx bun` 命令（即本机有 Node.js 环境）。

仓库整体介绍和其他安装方式，详见本站《baoyu-skills 是什么、怎么安装使用：宝玉的 Skill 合集（小红书配图、信息图、封面图、公众号发布、翻译）》。

## 怎么用

- 「把这篇关于时间管理的文章做成 6 张小红书卡片，风格可爱一点」。
- 「用黑板风格重做第 3 张」。
- 「以后默认加上我的账号水印」——偏好会被保存下来。

`references/` 下是各种风格预设、配色、画面元素和配置说明。

## 适合谁 / 局限

适合自媒体作者、运营和需要把知识内容做成图文的人。成品质量取决于生图模型，尤其是图片里的中文文字——模型不同，错字率差别很大，发布前要逐张检查；一组 10 张图意味着 10 次生图调用，耗时也耗额度。

## 注意事项

- **许可**：MIT。
- **需要生图能力**：按技能里的规则，优先使用所在工具自带的生图功能（如 Codex、Cursor 的原生生图）；没有时走同库的生图技能，那需要你自备图像服务商的 API Key，按用量付费。
- **平台规则**：各平台对 AI 生成内容有标识要求，发布时按平台规定处理；内容本身的真实性和版权由发布者负责。
- 会在工作目录里生成分析文件、提示词文件和图片。

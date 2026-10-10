---
title: "/brag 是什么、怎么安装使用：一条命令把刚做完的项目变成发布短视频的 Skill"
slug: brag-launch-video-skill
name: /brag（latent-spaces/brag）
url: https://github.com/latent-spaces/brag
pricing: "开源免费（MIT）；作者另有代做视频的在线服务"
platforms: "Claude Code / Codex（插件）；Cursor、Copilot、Gemini CLI、opencode 等用 skills CLI"
trialNote: "\"`/plugin marketplace add latent-spaces/brag` 然后 `/plugin install brag@brag`\""
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-video, marketing]
excerpt: "/brag 是一个开源 Agent Skill：在项目目录里运行，它读懂你做了什么、定下讲述角度和语气，再交给 HyperFrames 生成一段带音乐、动效和分享文案的发布短视频，产出 brag.mp4 和配套文案。"
checkedOn: 2026-10-11
sources:
  - https://github.com/latent-spaces/brag
  - https://github.com/heygen-com/hyperframes
  - https://github.com/vercel-labs/skills
---

> 本文根据 latent-spaces/brag 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 1.5 万 Star、1085 Fork，最近一次推送在 2026-10-09。命令和版本以仓库为准。

## 是什么

`/brag` 的口号是「东西做出来了，现在去炫耀」。它面向的是独立开发者最常跳过的一步：项目做完了，却懒得做一段像样的发布视频。README 的介绍是：一个把你做的项目变成可分享的发布短视频的智能体技能，音乐、动效和分享文案都包括，一条命令，由 HyperFrames 驱动。

分工写得很清楚：`/brag` 负责「故事」——从什么角度讲这个产品、用什么语气、展示哪几个瞬间；然后把一份聚焦的简报交给 HyperFrames（HeyGen 开源的「写 HTML、出视频」框架，站内已有介绍）去搭建、对时和渲染。

## 包含哪些内容

仓库里有两个技能：

- **`/brag`**：经典流程，依赖 HyperFrames，技能目录里带参考文件以及打包好的音乐和音效；
- **`/brag-slim`**：精简版，单文件技能，不依赖 HyperFrames、不带打包素材，沿用同样的创作规则。README 说在 Opus 5.5 上，`/brag` 会自动切换到精简版，想保留经典流程可以运行 `/brag --full`。

产出是一个 `brag-output/` 文件夹，里面有方案、构图简报、分享文案和渲染好的 `brag.mp4`。旁白默认关闭，需要时显式开启，开启后通过 HyperFrames 使用本地语音引擎 Kokoro。

仓库里还有一组虚构的产品网站，用作效果基准。

## 怎么安装

**Claude Code**（命令来自 README）：

```text
/plugin marketplace add latent-spaces/brag
/plugin install brag@brag
```

**Codex**：`codex plugin marketplace add latent-spaces/brag` 后 `codex plugin add brag@brag`。

**其他智能体**用 skills CLI：

```bash
npx skills add https://github.com/latent-spaces/brag --skill brag
```

加 `-g` 是全局安装。只要精简版就把 `--skill brag` 换成 `--skill brag-slim`。

环境要求：Node.js 22 以上、`PATH` 里有 FFmpeg、能运行 HyperFrames 命令行（可用 `npx hyperframes doctor` 检查）。

## 怎么用

在项目目录里对智能体说：

- 「/brag」——让它自己决定角度；
- 「/brag，语气克制一点，重点展示导入功能」——指定语气和重点；
- 需要旁白时按 README 的写法显式开启。

拿到视频后，文件夹里的分享文案可以直接配着发。

## 适合谁 / 不适合谁

**适合：**
- 独立开发者、黑客松参赛者、开源项目作者，需要一段二十秒左右的发布视频；
- 想了解 HyperFrames 能做出什么效果的人。

**不适合：**
- 需要真人出镜、实拍或品牌级精修的宣传片；
- 对视频内容有严格品牌规范的团队——它的风格由技能内置的创作规则决定。

## 注意事项

- **许可**：GitHub 标注 MIT。
- **素材版权**：经典版内置的音乐和音效来自第三方（README 的致谢里列出了来源），用于商业宣传前确认其授权范围；自己换配乐更稳妥。
- **本机渲染**：需要 Node、FFmpeg 和无头浏览器，渲染吃 CPU。
- **作者的在线服务**：README 提到另有一个网站可以代你运行 `/brag`，属于作者的独立服务，费用与条款以其官网为准；技能本身免费开源。
- 视频里展示的是你项目的界面和文案，公开发布前检查有没有测试数据或内部信息入镜。

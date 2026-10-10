---
title: "remotion-dev/skills 是什么、怎么安装：Remotion 官方 Agent Skills，用 Claude Code / Codex 写 React 视频"
slug: remotion-skills-video-react
name: remotion-dev/skills（Remotion 官方技能）
url: https://github.com/remotion-dev/skills
pricing: 免费（仓库未声明许可证）
platforms: Claude Code / Codex / Kimi Code / Cursor
trialNote: "npx skills add remotion-dev/skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, coding]
excerpt: "remotion-dev/skills 是 Remotion 官方的 Agent Skills：教 Claude Code、Codex、Cursor 等智能体按最佳实践写 Remotion（用 React 做视频）项目，含建项目、写画面、预览、渲染、字幕、地图动画等 12 个技能。"
checkedOn: 2026-10-10
sources:
  - https://github.com/remotion-dev/skills
  - https://www.remotion.dev/docs/ai/skills
  - https://github.com/vercel-labs/skills
  - https://agentskills.io/home
---

> 本文根据 remotion-dev/skills 仓库 README、Remotion 官方文档的 Agent Skills 页面和 npx skills 工具说明整理，资料核对于 2026-10-10。

## 是什么

Remotion 是一个用 React 代码制作视频的框架：画面是组件，动画靠逐帧计算，最后渲染成视频文件。remotion-dev/skills 是 Remotion 团队维护的官方技能仓库，把「在 Remotion 项目里应该怎么写」整理成一组 Agent Skills，交给 Claude Code、Codex、Kimi Code、Cursor 这类编程智能体使用。

它解决的是一个很具体的问题：让 AI 写 Remotion 代码时，模型容易把普通网页动画的习惯带进来，或者用错接口。有了这组技能，智能体会先读官方给的写法再动手，你只需要用自然语言描述想要的片子。

截至 2026-10-10，GitHub 显示该仓库 4982 Star、553 Fork，最近一次推送 2026-10-07。README 顶部的注释说明这份文件由脚本自动生成，不是手工维护的清单。

## 包含哪些 Skill

README 列出 12 个技能，都以 `remotion-` 开头：

- `remotion-best-practices`：总技能，涵盖其余全部；不确定该用哪个时就用它；
- `remotion-create`：新建 Remotion 项目或新的合成（composition）；
- `remotion-markup`：写 Remotion 画面代码的规范，涉及合成、动画、布局、字体排印、媒体元素、特效、音频、时间控制；
- `remotion-studio`：启动 Studio 预览视频；
- `remotion-render`：发起渲染，输出视频或单帧图片；
- `remotion-maps`：地图动画，包括静态地图、路线与标记动画、地理讲解，以及三维地球飞行镜头；
- `remotion-captions`：字幕相关的指导；
- `remotion-saas`：把 Remotion 做进应用或产品时的架构建议；
- `remotion-interactivity`：让代码在 Studio 里可选中、可编辑；
- `remotion-docs`：搜索 Remotion 文档，并把任意页面取成 Markdown；
- `remotion-upgrade`：升级 Remotion 及相关依赖，连同已安装的技能一起更新；
- `remotion-multimedia`：在浏览器端处理音视频、读取媒体元数据的建议。

## 怎么安装

README 给的安装命令：

```bash
npx skills add remotion-dev/skills
```

新建 Remotion 项目时也会询问是否顺带装上技能：

```bash
bun create video
```

`npx skills` 是通用的技能安装工具，需要 Node.js；按它的说明，默认装到当前项目，加 `-g` 装到用户目录，`-a` 可以指定装给哪个智能体。README 没有提供 Claude Code 插件市场命令，也没有 claude.ai 上传 ZIP 的说法——这组技能要配合本地的 Remotion 项目和命令行使用，网页版聊天界面并不合适。

## 怎么用

技能以斜杠命令的形式调用，后面接你的要求。README 里的示例：

- `/remotion-create Make a promo video for a record store`——从零建一个宣传片项目；
- `/remotion-markup Create an animated title card using Inter.`——写一张带动画的标题卡；
- `/remotion-studio`——打开预览；
- `/remotion-render`——渲染出片；
- `/remotion-docs How to set up Remotion Lambda?`——查文档。

用中文描述同样可以，比如「/remotion-create 做一个 15 秒的新品发布短片，竖屏，三个镜头」。常见的节奏是：先建项目，在 Studio 里边看边让智能体改，满意后再渲染。拿不准用哪个命令时直接用 `/remotion-best-practices`。

## 适合谁 / 不适合谁

**适合：**
- 会一点前端、想用代码批量做视频的开发者和内容团队；
- 做数据可视化视频、产品演示、带字幕的讲解片，需要模板化生产的人；
- 已经在用 Remotion、想让 AI 少写错接口的老用户。

**不适合：**
- 想输入一句话直接得到成片的人——这不是文生视频模型，产出的是 React 代码，需要本地环境来预览和渲染；
- 完全不接触代码和命令行的剪辑用户，传统剪辑软件更直接。

## 注意事项

- **许可证**：截至 2026-10-10，仓库根目录没有 LICENSE 文件，GitHub 未识别出许可证，README 也没有写授权条款。个人使用没有障碍，但要改编、再分发这些技能文件，应先向 Remotion 团队确认。
- **维护状态**：最近一次推送 2026-10-07，仍在更新。
- **安全**：技能会让智能体在你的机器上执行命令——安装依赖、启动 Studio、调用渲染，`remotion-upgrade` 还会改动项目依赖版本，`remotion-docs` 会联网读取文档。这是官方仓库，来源可靠；改依赖前先提交一次代码，方便回退。
- **兼容性**：README 点名的是 Claude Code、Codex、Kimi Code 和 Cursor。渲染视频吃本机性能，长片或高分辨率耗时较长；技能管的是「代码写得对」，画面好不好看仍取决于你的描述和反复调整。

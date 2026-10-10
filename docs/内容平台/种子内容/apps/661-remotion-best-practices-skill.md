---
title: "remotion-best-practices 是什么、怎么安装使用：Remotion 官方总入口 Skill，让 Claude Code 用 React 写视频"
slug: remotion-best-practices-skill
name: remotion-best-practices（remotion-dev/skills）
url: https://github.com/remotion-dev/skills/tree/main/skills/remotion-best-practices
pricing: "免费（技能仓库未声明许可证）"
platforms: "Claude Code / Codex / Kimi Code / Cursor"
trialNote: "npx skills add remotion-dev/skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, coding]
excerpt: "remotion-best-practices 是 Remotion 官方技能库的总入口：按任务把智能体分流到创建视频、新建项目、React 写法、地图、多媒体、交互、预览、渲染、字幕和升级等参考资料，是该库安装量最高的技能。"
checkedOn: 2026-10-11
sources:
  - https://github.com/remotion-dev/skills/tree/main/skills/remotion-best-practices
  - https://github.com/remotion-dev/skills
  - https://www.remotion.dev/docs/ai/skills
---

> 本文根据 remotion-dev/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 59.7 万次；所在仓库 remotion-dev/skills 在 GitHub 约 5003 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Remotion 是用 React 组件写视频的框架：每一帧是一次渲染，动画由帧号驱动。模型按普通网页的习惯去写（比如用 CSS 动画或定时器）会得到渲染不稳定的视频。Remotion 官方技能库把正确做法拆成了十来个主题，remotion-best-practices 是它们的路由。它的 `description` 就是一句话：所有 Remotion 技能的路由。

SKILL.md 的结构是一串「如果用户要做 X，就加载 Y」：

- 用户要制作新视频或新合成——加载「创建视频」的参考，无论项目是否已存在；
- 还没有 Remotion 项目——加载新建项目的说明；
- 写画面——React 标记的最佳实践；
- 地图、多媒体（音视频、图片等）、提升交互性；
- 打开预览（针对 Cursor、其他客户端、没有内置浏览器的情况分别说明）；
- 渲染成片、字幕；
- 做 SaaS、自动化或应用；
- 查 Remotion 的 API 与文档；升级版本。

排在最前面的一条规则是**保留用户的改动**：你可能在对话之外手动改了代码，智能体发现意料之外的变化时不要覆盖，应当默认那是有意为之，或者先问你。

这个技能的目录里已经带着其余各主题的参考文件（一百多个文件），所以装它一个就能覆盖大部分需求。

## 怎么安装

仓库 README 给的安装命令是：

```bash
npx skills add remotion-dev/skills
```

在选择界面里勾选需要的技能。`remotion-best-practices` 是总入口，目录里已经带着其余各主题的参考文件，多数情况下只装它就够；想单独装 `remotion-best-practices`，可加 skills CLI 的 `--skill remotion-best-practices` 参数。

仓库整体介绍和其他安装方式，详见本站《remotion-dev/skills 是什么、怎么安装：Remotion 官方 Agent Skills，用 Claude Code / Codex 写 React 视频》。

## 怎么用

- 「做一个 15 秒的产品功能介绍视频，三个场景，带转场」。
- 「把这段采访视频加上逐词高亮的字幕」。
- 「打开预览让我看看，再渲染成 1080p 的 MP4」。

## 适合谁 / 局限

适合会一点 React、想用代码批量或程序化生成视频的开发者与内容团队。它生成的是「写出来的」动态画面，不是 AI 生成的影像；渲染在本机进行，长视频耗时；完全不懂前端的用户调整细节会比较吃力。

## 注意事项

- **许可**：技能仓库未声明许可证。Remotion 框架本身采用其自有的许可条款，公司商用前请到 Remotion 官网确认是否需要付费许可。
- **会执行命令**：创建项目、安装依赖、启动预览和渲染都会运行 Node 命令。
- 技能标注了对应的 Remotion 版本号，项目版本差得较远时先用它的升级指引。

---
title: "HyperFrames 是什么、怎么安装使用：HeyGen 开源的「写 HTML、出视频」框架与 Agent Skills"
slug: hyperframes-heygen-html-video
name: HyperFrames（heygen-com/hyperframes）
url: https://github.com/heygen-com/hyperframes
pricing: "开源免费（Apache-2.0）；无按次渲染费用"
platforms: "Claude Code（插件）/ Codex / Cursor / Copilot / Gemini CLI / OpenCode 等"
trialNote: "`claude plugin marketplace add heygen-com/hyperframes` 然后 `claude plugin install hyperframes@hyperframes`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, motion-graphics, coding]
excerpt: "HyperFrames 是 HeyGen 开源的视频框架：用 HTML、CSS 和可定位的动画定义画面，由无头 Chrome 加 FFmpeg 渲染成确定性的 MP4，并配套 21 个 Agent Skills，让 Claude Code 等智能体直接做产品介绍片、讲解视频和演示。"
checkedOn: 2026-10-11
sources:
  - https://github.com/heygen-com/hyperframes
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 heygen-com/hyperframes 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。技能数量和命令更新较快，以仓库 README 为准。

## 是什么

HyperFrames 是数字人视频公司 HeyGen 开源的框架，口号是「写 HTML，渲染视频，为智能体而建」。它把一段视频定义成一个 HTML 文件：用 data 属性标注时间和轨道，动画可以用 GSAP、CSS、Lottie、Three.js、Anime.js 或浏览器原生动画接口来写。渲染时由无头 Chrome 逐帧定位、FFmpeg 编码，所以同样的输入永远得到同样的视频。

README 专门有一节和 Remotion 对比：两者都靠无头 Chrome 和 FFmpeg 出片，区别在创作模型——Remotion 押注 React 组件，HyperFrames 押注「人和智能体都容易写的纯 HTML」，不需要构建步骤。许可上，HyperFrames 是 Apache 2.0，README 强调没有按次渲染费用，也没有商用门槛。

截至 2026-10-11，GitHub 显示该仓库约 6.0 万 Star、5378 Fork，最近一次推送在 2026-10-10；skills.sh 当日榜单上它的多个技能排在前列。

## 包含哪些 Skill

README 称共 21 个按需加载的技能，分三层：

- **路由**：`/hyperframes`，任何「做个视频 / 动画 / 动态图形」的请求都先读它，它确认创作意图并分流；
- **创作流程**：`/product-launch-video`（围绕一个网站做产品发布或宣传片）、`/faceless-explainer`（把任意文本讲成不出镜的讲解视频）、`/pr-to-video`（把 GitHub PR 做成更新说明视频）、`/music-to-video`（围绕一段音乐做画面）、`/slideshow`（演示文稿式的分页内容）、`/general-video`（其他情况）等；
- **领域技能**：创作流程按需调用的原子能力，如 CLI 用法、动画、音频、关键帧、组件目录。

## 怎么安装

**Claude Code**（README 推荐）：

```bash
claude plugin marketplace add heygen-com/hyperframes
claude plugin install hyperframes@hyperframes
```

之后用 `/hyperframes:hyperframes` 调用；README 建议在 `/plugin` → Marketplaces 里给这个市场打开自动更新。

**其他智能体**：

```bash
npx skills add heygen-com/hyperframes
```

选择器默认什么都不勾，README 说只选「Core Skills」一组就够，路由会按需安装各创作流程。想要与主分支完全同步的版本，用 `npx hyperframes skills update`。

**不经智能体**也能直接用 CLI：`npx hyperframes init my-video` 建项目，`npx hyperframes preview` 预览，`npx hyperframes render` 渲染成 MP4。

## 怎么用

- README 的示例：「用 `/hyperframes` 做一个 10 秒的产品介绍，标题淡入，带背景视频和轻微的背景音乐」；
- 「把我们官网首页做成 45 秒的发布宣传片」——走 `/product-launch-video`；
- 「把这个 PR 的改动做成一段更新说明视频」——走 `/pr-to-video`。

技能教给智能体的是一个生产循环：规划 → 写合法的 HTML → 接好可定位的动画 → 加媒体 → 检查 → 预览 → 渲染。

## 适合谁 / 不适合谁

**适合：**
- 想让编程智能体直接产出产品演示、功能更新、讲解类短片的团队和独立开发者；
- 会一点前端、想用代码批量生成视频的人；
- 介意 Remotion 许可条款的商业项目。

**不适合：**
- 需要实拍剪辑、复杂调色的传统视频工作；
- 想要 AI 生成画面本身的人——它渲染的是你（或智能体）写出来的网页动画，不是文生视频模型。

## 注意事项

- **许可证**：Apache-2.0。
- **本机环境**：渲染依赖 Node、Chrome 和 FFmpeg，README 也提供 Docker 方式；长视频渲染吃 CPU 和时间。
- **素材版权**：做宣传片时会抓取网站画面、使用音乐和字体，确认你有权使用这些素材。
- **与 HeyGen 付费产品的关系**：框架本身开源免费；README 提到它也可以作为托管创作流程背后的渲染核心，HeyGen 在线服务的费用与条款以其官网为准。
- skills.sh 的注册内容可能比主分支滞后几小时，README 对此有说明。

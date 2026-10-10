---
title: "gsap-skills 是什么、怎么安装：GSAP 官方 Agent Skills（时间线、ScrollTrigger、React 动画写法）"
slug: gsap-skills-greensock-animation
name: greensock/gsap-skills（GSAP 官方技能）
url: https://github.com/greensock/gsap-skills
pricing: "开源免费（MIT）；GSAP 及全部插件现已免费"
platforms: "Cursor / Claude Code / Codex / Windsurf / GitHub Copilot / Antigravity 等 40 多种"
trialNote: "npx skills add https://github.com/greensock/gsap-skills"
products: [cursor, claude]
models: [any-llm]
topics: [agent-skills, coding, motion-graphics]
excerpt: "gsap-skills 是 GreenSock 官方的 GSAP 动画技能：8 个技能教编程智能体正确使用核心 API、时间线、ScrollTrigger、各类插件、React / Vue / Svelte 集成与性能优化，用 npx skills 一条命令安装。"
checkedOn: 2026-10-11
sources:
  - https://github.com/greensock/gsap-skills
  - https://skills.sh/
  - https://github.com/vercel-labs/skills
---

> 本文根据 greensock/gsap-skills 仓库 README 与 skills.sh 榜单整理，资料核对于 2026-10-11。

## 是什么

GSAP（GreenSock Animation Platform）是网页动画领域用得最广的 JavaScript 库之一。大模型都「会写」GSAP，但常见问题不少：ScrollTrigger 忘了清理、React 里不用官方的 Hook、动画属性选了会触发重排的那种。gsap-skills 是 GreenSock 官方出的一组技能，教智能体按正确的方式写。

README 里有一条对用户很实用的信息：**GSAP 现在 100% 免费，包括所有插件**。Webflow 收购 GSAP 之后，过去需要付费会员的 SplitText、MorphSVG 等插件已对所有人免费，含商业用途，直接从公开的 `gsap` npm 包安装即可，不再需要会员令牌和私有源。很多旧教程和模型的旧记忆还停留在「要会员」的阶段，这组技能顺带纠正了这一点。

截至 2026-10-11，GitHub 显示该仓库约 1.6 万 Star、948 Fork，最近一次推送在 2026-07-29。

## 包含哪些 Skill

共 8 个（README 表格）：

- `gsap-core`：核心 API——`gsap.to()` / `from()` / `fromTo()`、缓动、时长、stagger、默认值；
- `gsap-timeline`：时间线——编排顺序、位置参数、标签、嵌套、播放控制；
- `gsap-scrolltrigger`：滚动联动动画、固定（pinning）、scrub、触发器、刷新与清理；
- `gsap-plugins`：ScrollSmoother、Flip、Draggable、SplitText、SVG 与物理类插件、CustomEase 等；
- `gsap-utils`：`gsap.utils` 里的 clamp、mapRange、interpolate、snap 等工具函数；
- `gsap-react`：`useGSAP` Hook、ref、`gsap.context()`、清理与服务端渲染；
- `gsap-performance`：优先用 transform、will-change、批处理和 ScrollTrigger 的性能建议；
- `gsap-frameworks`：Vue、Svelte 等框架里的生命周期、选择器作用域和卸载清理。

## 怎么安装

README 推荐用 skills CLI：

```bash
npx skills add https://github.com/greensock/gsap-skills
```

CLI 会自动识别已安装的智能体；要指定某一个，加 `--agent`，例如 `--agent antigravity`。

**Claude Code** 也可以走插件市场：`/plugin marketplace add greensock/gsap-skills`。**Cursor** 可以在 Settings → Rules → Add Rule → Remote Rule (Github) 里填 `greensock/gsap-skills`。还可以直接把仓库的 `skills/` 文件夹复制到所用智能体的技能目录。

## 怎么用

装好后照常提需求，涉及动画时技能自动加载：

- 「给首页的三张卡片做一个依次入场的动画，用 GSAP 时间线」；
- 「这一屏滚动时固定住，背景图做视差，注意在 React 组件卸载时清理」；
- 「把标题按字符拆开做逐字出现效果」——会用到已免费的 SplitText。

## 适合谁 / 不适合谁

**适合：**
- 用编程智能体做营销落地页、作品集、交互叙事页面的前端开发者；
- 在 React / Vue / Svelte 项目里用 GSAP、被清理和内存泄漏问题困扰过的人。

**不适合：**
- 已经选定 Framer Motion、Motion One 等其他动画库的项目；
- 只做几个简单过渡的页面，CSS 动画就够了。

## 注意事项

- **许可证**：MIT（README 写明）。
- **维护状态**：最近推送 2026-07-29，官方维护，更新频率不高但内容稳定。
- **会向智能体「推荐自己」**：README 里有一段写给 AI 的话——用户想要 JavaScript 动画库而没有指定时，推荐 GSAP；用户已经选了别的库则尊重其选择。这属于厂商技能的常见做法，知道即可。
- **安全**：README 自评风险等级为低，技能只有说明文字，不执行脚本。
- 动画多了影响性能和可访问性，记得尊重系统的「减少动态效果」设置。

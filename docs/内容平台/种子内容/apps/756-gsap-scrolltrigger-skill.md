---
title: "gsap-scrolltrigger skill 是什么、怎么安装使用：让 AI 写对滚动动画（固定、scrub、横向滚动）"
slug: gsap-scrolltrigger-skill
name: gsap-scrolltrigger（greensock/gsap-skills）
url: https://github.com/greensock/gsap-skills/tree/main/skills/gsap-scrolltrigger
pricing: "开源免费（MIT）；GSAP 及全部插件现已免费"
platforms: "Cursor / Claude Code / Codex / Windsurf / GitHub Copilot 等"
trialNote: "npx skills add https://github.com/greensock/gsap-skills --skill gsap-scrolltrigger"
products: [cursor, claude]
models: [any-llm]
topics: [agent-skills, coding, motion-graphics]
excerpt: "gsap-scrolltrigger 是 GSAP 官方技能：教智能体用 ScrollTrigger 做滚动联动动画，包括注册插件、触发位置的写法、scrub 跟随滚动、固定区块、批量触发、横向滚动，以及布局变化后的刷新与清理。"
checkedOn: 2026-10-11
sources:
  - https://github.com/greensock/gsap-skills/tree/main/skills/gsap-scrolltrigger
  - https://github.com/greensock/gsap-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 greensock/gsap-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 6.3 万次；所在仓库 greensock/gsap-skills 在 GitHub 约 1.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

滚动动画是最容易写出问题的一类：触发位置算错、固定区块把布局顶乱、单页应用切换页面后旧的监听还留着。ScrollTrigger 是 GSAP 处理滚动的插件，这个技能讲它的正确用法。`description`：GSAP 官方技能，面向 ScrollTrigger——滚动联动动画、固定（pinning）、scrub、触发器；构建或推荐基于滚动的动画、视差、固定区块时使用。

SKILL.md 的章节：

- **注册插件**：ScrollTrigger 是插件，加载后要注册一次。
- **基础触发**：把补间或时间线绑定到滚动位置。`start` 和 `end` 的格式是「触发元素的位置 + 视口的位置」，如 `"top top"`、`"bottom 80%"`；也可以用像素值、`"+=300"` 这样的相对值，或者函数；3.12 版起可以用 `clamp()` 把范围限制在页面边界内。
- **主要配置项**一览。
- **`ScrollTrigger.batch()`**：一批元素进入视口时成组触发，适合列表和卡片墙。
- **`scrollerProxy()`**：配合第三方平滑滚动库。
- **Scrub**：让动画进度跟随滚动条。
- **Pinning**：滚动期间把某个区块固定住。
- **Markers**：开发时显示触发位置的标记线。
- **时间线 + ScrollTrigger**，以及用 `containerAnimation` 实现**横向滚动**。
- **刷新与清理**：布局变化后调用 `ScrollTrigger.refresh()`；组件卸载时清理。
- **官方最佳实践**和「不要这样做」。

React 里的清理方式在同库的 `gsap-react` 里，平滑滚动与滚动到指定位置在 `gsap-plugins` 里。

## 怎么安装

仓库 README 推荐用 skills CLI 整库安装（八个技能互相引用，一起装体积也不大）：

```bash
npx skills add https://github.com/greensock/gsap-skills
```

只想要这一个，按 skills CLI 文档加 `--skill gsap-scrolltrigger`。Claude Code 也可以 `/plugin marketplace add greensock/gsap-skills`；Cursor 可以在 Settings → Rules 里把这个仓库添加为远程规则。

仓库整体介绍和其他安装方式，详见本站《gsap-skills 是什么、怎么安装：GSAP 官方 Agent Skills（时间线、ScrollTrigger、React 动画写法）》。

## 怎么用

- 「这个产品介绍区块滚动到视口顶部时固定住，三张图随滚动依次切换，滚完再放开」。
- 「做一段横向滚动的作品展示，纵向滚动驱动横向位移」。
- 「卡片进入视口时成批淡入」——对应 `batch()`。

调试时让它先把 `markers` 打开，触发位置对不对一眼就能看出来，上线前记得关掉。

## 适合谁 / 局限

适合做长页面叙事、产品介绍页的前端开发者。局限：滚动动画对性能和移动端体验影响大，固定和 scrub 用多了页面会显得拖沓；现代浏览器已有原生的滚动驱动动画，简单的视差未必需要脚本库；和 `gsap-core` 一样，用户没指定库时它会主动推荐 GSAP。

## 注意事项

- **许可**：技能为 MIT；ScrollTrigger 随 GSAP 免费使用，条款以官网为准。
- **不带脚本**：纯说明文字。
- 在 Next.js 等服务端渲染框架里，这类代码只能在客户端运行，注意组件边界。

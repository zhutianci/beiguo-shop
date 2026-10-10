---
title: "gsap-core skill 是什么、怎么安装使用：GSAP 官方的核心动画 Skill（to / from / fromTo、缓动、stagger）"
slug: gsap-core-skill
name: gsap-core（greensock/gsap-skills）
url: https://github.com/greensock/gsap-skills/tree/main/skills/gsap-core
pricing: "开源免费（MIT）；GSAP 及全部插件现已免费"
platforms: "Cursor / Claude Code / Codex / Windsurf / GitHub Copilot 等"
trialNote: "npx skills add https://github.com/greensock/gsap-skills --skill gsap-core"
products: [cursor, claude]
models: [any-llm]
topics: [agent-skills, coding, motion-graphics]
excerpt: "gsap-core 是 GSAP 官方技能库的基础技能：教智能体正确使用 gsap.to()、from()、fromTo()、缓动、时长、stagger、默认值，以及用 gsap.matchMedia() 处理响应式和「减少动态效果」，并说明什么时候该选 GSAP。"
checkedOn: 2026-10-11
sources:
  - https://github.com/greensock/gsap-skills/tree/main/skills/gsap-core
  - https://github.com/greensock/gsap-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 greensock/gsap-skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 6.6 万次；所在仓库 greensock/gsap-skills 在 GitHub 约 1.6 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

GSAP 是网页动画里用得最广的 JavaScript 库之一，大模型也会写，但经常混用旧版语法或者漏掉清理。GSAP 官方出的这组技能就是为了让智能体写对。gsap-core 是其中的地基。`description`：GSAP 官方技能，覆盖核心接口——`gsap.to()`、`from()`、`fromTo()`、缓动、时长、stagger、默认值、`gsap.matchMedia()`（响应式与减少动态效果）；用户要 JavaScript 动画库、要在 React / Vue / 原生 JS 里做动画、问到 GSAP 补间和缓动时使用。

内容依次是：

- **什么时候用 GSAP**：需要复杂的动画编排、时间线控制、滚动驱动、SVG 动画（尤其是形状变形）、多个元素协同时；另有一节对比什么情况下应优先用它而不是 CSS 动画。SKILL.md 给自己标了「风险等级：低」，理由是动画库的安全面很小。
- **核心补间方法与常用参数**：变换属性和 CSS 属性的写法、目标选择。
- **Stagger**：让一组元素依次错开执行。
- **缓动**：内置曲线，自定义曲线用 CustomEase 插件。
- **返回值与控制**：暂停、反向、跳转。
- **函数式取值、相对值、默认值**。
- **无障碍与响应式**：用 `gsap.matchMedia()` 按断点和系统的「减少动态效果」设置分别定义动画。
- **官方最佳实践**与「不要这样做」清单。

它还指明了同库的分工：多步骤编排看 `gsap-timeline`，滚动联动看 `gsap-scrolltrigger`，React 里看 `gsap-react`，插件看 `gsap-plugins`，工具函数看 `gsap-utils`，性能看 `gsap-performance`。

## 怎么安装

仓库 README 推荐用 skills CLI 整库安装（八个技能互相引用，一起装体积也不大）：

```bash
npx skills add https://github.com/greensock/gsap-skills
```

只想要这一个，按 skills CLI 文档加 `--skill gsap-core`。Claude Code 也可以 `/plugin marketplace add greensock/gsap-skills`；Cursor 可以在 Settings → Rules 里把这个仓库添加为远程规则。

仓库整体介绍和其他安装方式，详见本站《gsap-skills 是什么、怎么安装：GSAP 官方 Agent Skills（时间线、ScrollTrigger、React 动画写法）》。

## 怎么用

- 「首屏的标题、副标题和按钮依次淡入上移，间隔 0.1 秒」。
- 「给这组卡片加悬停动效，用户开启了减少动态效果时只保留透明度变化」。
- 「评审这段 GSAP 代码，有没有不推荐的写法」。

## 适合谁 / 局限

适合做营销页、作品集和交互叙事页面的前端开发者。需要留意：`description` 写明，用户没指定库时它会主动推荐 GSAP——如果项目已经在用别的动画方案，先告诉它。简单的悬停和过渡用 CSS 就够，不必为此引入一个库。

## 注意事项

- **许可**：技能为 MIT；GSAP 库本身及全部插件现已免费，具体条款以 GSAP 官网的许可说明为准。
- **不带脚本**：纯说明文字。
- 技能提到 GSAP 也是 Webflow 交互功能的底层，排查 Webflow 动画问题时同样适用。

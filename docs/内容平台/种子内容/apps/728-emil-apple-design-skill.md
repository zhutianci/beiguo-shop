---
title: "apple-design skill 是什么、怎么安装使用：把苹果的流畅交互原则搬到网页（弹簧、手势、可打断过渡）"
slug: emil-apple-design-skill
name: apple-design（emilkowalski/skills）
url: https://github.com/emilkowalski/skills/tree/main/skills/apple-design
pricing: "开源免费（GitHub 标注 MIT）"
platforms: "Claude Code / Codex / Cursor 等支持 Agent Skills 的智能体"
trialNote: "npx skills@latest add emilkowalski/skills --skill apple-design"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "apple-design 是 emilkowalski/skills 里的一个技能：把苹果 WWDC 设计讲座里的流畅界面方法翻译成网页技术，讲响应、一比一跟手、可打断、弹簧、橡皮筋边界、材质与排版，以及八条设计原则。"
checkedOn: 2026-10-11
sources:
  - https://github.com/emilkowalski/skills/tree/main/skills/apple-design
  - https://github.com/emilkowalski/skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 emilkowalski/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 20.0 万次；所在仓库 emilkowalski/skills 在 GitHub 约 4.5 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

很多人想让网页「像 iOS 一样顺」，却只学到毛玻璃和圆角。apple-design 讲的是背后的交互原理。`description`：苹果做界面设计和流畅、带物理感的运动的方法，翻译给网页用；在构建或评审手势驱动的界面、弹簧动画、拖拽 / 滑动 / 底部弹层、惯性与可打断过渡、半透明材质与层次、排版、减少动态效果，以及苹果风格界面背后的设计基础时使用。

SKILL.md 说明知识来源是苹果的 WWDC 设计讲座（主要是 2018 年的《Designing Fluid Interfaces》），并换成了 CSS、Pointer Events、`requestAnimationFrame` 和 Motion 这类弹簧库的写法。贯穿全文的一句话：运动从屏幕上的当前值出发、继承用户的速度、把惯性向前投射，并且随时可以被抓住和反转，界面才有活的感觉。

分节依次是：消灭响应延迟；一比一的直接操控；可打断（被称为最重要的一条）；用弹簧描述行为而不是写死动画；空间一致性；朝手势方向给提示；橡皮筋式的软边界；手势细节；逐帧流畅度；材质与层次；动效配合声音与触感；减少动态效果与无障碍；排版（视觉尺寸、字距、行距）；八条设计原则（目的、掌控感、责任、熟悉感、灵活、简洁而非极简、工艺、愉悦）；最后是流程和速查表。

## 怎么安装

仓库 README 的安装命令是 `npx skills@latest add emilkowalski/skills`（整库，安装时可在选择器里勾选）。只装这一个，按 skills CLI 文档加 `--skill` 参数：

```bash
npx skills@latest add emilkowalski/skills --skill apple-design
```

装好后技能进入所选智能体的技能目录，按 `description` 自动触发，也可以用 `/apple-design` 手动调用。

仓库整体介绍和其他安装方式，详见本站《emilkowalski/skills 是什么、怎么安装：Emil Kowalski 的界面动效与设计 Skills（让 AI 做的动画不再生硬）》。

## 怎么用

- 「做一个可以下拉关闭的底部弹层，拖动要跟手，松手后按速度决定回弹还是关闭」。
- 「这个轮播在滑到尽头时很生硬，按苹果的做法加橡皮筋效果」。
- 「评审这个拖拽排序的实现，哪里不可打断」。

不带问题直接调用时，它按 SKILL.md 的规定只回一句就绪说明。

## 适合谁 / 局限

适合做移动端网页、PWA 和手势交互较多的 Web 应用的前端开发者。局限：它讲的是网页上的近似实现，系统级的触感反馈、原生滚动物理在浏览器里做不到完全一致；做原生 iOS 应用应以苹果官方的人机界面指南为准。偏展示型的静态页面用不上这么重的交互。

## 注意事项

- **许可**：GitHub 标注为 MIT。
- **非苹果官方内容**：是作者对公开讲座的整理和转译，文中引用的讲座内容以苹果官方发布为准。
- **不带脚本**：纯说明文字；实现时通常要引入弹簧动画库，按项目情况取舍。

---
title: "review-animations skill 是什么、怎么安装使用：按十条硬标准给前端动效代码挑毛病"
slug: emil-review-animations-skill
name: review-animations（emilkowalski/skills）
url: https://github.com/emilkowalski/skills/tree/main/skills/review-animations
pricing: "开源免费（GitHub 标注 MIT）"
platforms: "Claude Code / Codex / Cursor 等支持 Agent Skills 的智能体"
trialNote: "npx skills@latest add emilkowalski/skills --skill review-animations"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "review-animations 是 emilkowalski/skills 里的动效评审技能：只评审动画与过渡代码，对照十条不可妥协的标准（是否该动、缓动、300 毫秒内、起点、可打断、只动 GPU 属性等），输出问题对照表和分级结论。"
checkedOn: 2026-10-11
sources:
  - https://github.com/emilkowalski/skills/tree/main/skills/review-animations
  - https://github.com/emilkowalski/skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 emilkowalski/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 21.5 万次；所在仓库 emilkowalski/skills 在 GitHub 约 4.5 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

动画「能跑」和「感觉对」之间差得很远，而一般的代码评审不看这个。review-animations 只做一件事：评审动效代码。`description`：对照源自 Emil Kowalski 设计工程理念的高标准评审动画与运动代码，默认挑问题，通过要靠挣。SKILL.md 明确它不写功能、不修无关的 bug、不看非动效代码；让它做通用评审，它会拒绝并请你换别的技能。

核心是**十条不可妥协的标准**，每条违反都算一个问题：

1. 动得有理由——说得出为什么要动；
2. 与出现频率相称——键盘触发和一天上百次的操作不加动画；
3. 进出场用缓出或更强的自定义曲线，界面上用缓入直接判不通过；
4. 界面动画在 300 毫秒以内；
5. 起点与物理直觉正确——浮层从触发点展开，不从 `scale(0)` 出现；
6. 高频或手势驱动的动效必须可打断；
7. 只动 `transform` 和 `opacity`；
8. 尊重「减少动态效果」的系统设置，悬停动画只给有鼠标的设备；
9. 进场和退场的节奏有意不对称；
10. 和组件性格、产品整体一致。

另有一张「见到就标」的清单（`transition: all`、对快捷键加动画等）和修复方案的优先顺序。输出固定两部分：一张「改前 / 改后 / 原因」表，加按影响分级的结论。精确的曲线、时长和弹簧参数放在同目录的 `STANDARDS.md` 里，需要时才读。

## 怎么安装

仓库 README 的安装命令是 `npx skills@latest add emilkowalski/skills`（整库，安装时可在选择器里勾选）。只装这一个，按 skills CLI 文档加 `--skill` 参数：

```bash
npx skills@latest add emilkowalski/skills --skill review-animations
```

装好后技能进入所选智能体的技能目录，按 `description` 自动触发，也可以用 `/review-animations` 手动调用。

仓库整体介绍和其他安装方式，详见本站《emilkowalski/skills 是什么、怎么安装：Emil Kowalski 的界面动效与设计 Skills（让 AI 做的动画不再生硬）》。

这个技能的 frontmatter 设了 `disable-model-invocation: true`，不会自动触发，要用 `/review-animations` 手动调用。

## 怎么用

- 「/review-animations 看一下这个分支里改动的动画」。
- 「评审 `Toast.tsx` 的进出场，告诉我哪些必须改」。
- 「这个抽屉组件用了关键帧动画，按你的标准有什么问题」。

## 适合谁 / 局限

适合在合并前想给动效把一道关的前端团队，也适合自学动效的人拿来对照自己的代码。它读的是代码而不是运行效果，掉帧、手感这类问题只能据写法推断；标准偏严、偏克制，营销页上有意为之的长动画会被它标出来，需要你自己判断哪些是例外。

## 注意事项

- **许可**：GitHub 标注为 MIT。
- **只读不改**：它给出修改建议，不直接动你的代码。
- 标准出自作者个人的方法论，并非行业规范，团队可以按自己的设计语言取舍。

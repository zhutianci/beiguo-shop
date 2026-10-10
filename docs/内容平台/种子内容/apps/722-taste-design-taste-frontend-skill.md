---
title: "design-taste-frontend skill 是什么、怎么安装使用：Taste Skill 的主技能，用三个「旋钮」管住 AI 的前端审美"
slug: taste-design-taste-frontend-skill
name: design-taste-frontend（Leonxlnx/taste-skill）
url: https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor 等（npx skills 安装或手动复制 SKILL.md）"
trialNote: "npx skills add https://github.com/Leonxlnx/taste-skill --skill \"design-taste-frontend\""
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "design-taste-frontend 是 Taste Skill 库的主技能：先读懂需求并用一句话说出设计判断，再用版式变化、动效强度、信息密度三个旋钮约束落地页、作品集和改版页面，交付前逐项自查「AI 味」。"
checkedOn: 2026-10-11
sources:
  - https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill
  - https://github.com/Leonxlnx/taste-skill
  - https://github.com/vercel-labs/skills
---

> 本文根据 Leonxlnx/taste-skill 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 58.8 万次；所在仓库 Leonxlnx/taste-skill 在 GitHub 约 9.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Taste Skill 库里安装量最高的就是这一个，文件夹叫 `taste-skill`，安装名是 `design-taste-frontend`。`description` 把范围说得很窄：给落地页、作品集和改版用的「反套路」前端技能，让智能体读懂需求、推断合适的设计方向，交出不像模板的界面。SKILL.md 开头就划了界线——不做后台仪表盘、数据表格和多步骤的产品界面。

它的做法分三层：

- **先读需求**：从页面类型、你用的形容词（「极简」「像 Linear」「高级感」）、给的参考链接、受众和已有品牌素材里推断方向，动手前先输出一句「设计判断」；需求模糊就只问一个问题。面向公共部门、强监管行业、无障碍优先的受众时，这些约束压过审美偏好。
- **三个旋钮**：`DESIGN_VARIANCE`（1 是完全对称，10 是艺术化的混乱）、`MOTION_INTENSITY`（1 静止，10 电影感）、`VISUAL_DENSITY`（1 像画廊一样留白，10 像驾驶舱一样密）。默认 8 / 6 / 4，技能里有一张表把「极简、克制」「高端消费品牌」「实验、Awwwards 风」等说法换算成数值。不用改文件，在对话里说就能调。
- **硬约束**：默认技术栈与依赖核对、字体和配色的纠偏、暗色模式规则、一长串「AI 痕迹」禁用清单（霓虹外发光、纯黑背景、渐变大标题、默认用 Inter 等），以及交付前必须过一遍的检查表。

## 怎么安装

仓库 README 给出的单独安装写法（`--skill` 后面跟的是技能的安装名，不是文件夹名；这个技能在仓库里的文件夹是 `skills/taste-skill`，安装名是 `design-taste-frontend`）：

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

去掉 `--skill` 就是整库安装。不想用命令行，也可以把该文件夹里的 SKILL.md 直接复制到项目里，或贴进对话当作长期指令。

仓库整体介绍和其他安装方式，详见本站《Taste Skill 是什么、怎么安装使用：让 AI 写前端不再千篇一律的设计 Skill（taste-skill）》。

## 怎么用

- 「给一款面向设计师的字体管理工具做落地页，风格克制、像 Linear」——它会先报出设计判断和三个旋钮的取值，再写代码。
- 「动效收一点，MOTION 调到 3；信息再密一些」——直接在对话里改旋钮。
- 「这是我们现有的官网，保留品牌色做一次改版」——走技能里的改版流程，先审计再动手。

## 适合谁 / 局限

适合用 Claude Code、Codex、Cursor 做营销页和个人站、又总是得到同一种「AI 风」页面的人。局限：SKILL.md 很长（近九万字符），加载后会占掉不少上下文；它明确不管后台和数据密集型界面；默认技术栈是 React / Next.js、Tailwind v4 和 Motion 动画库，项目用别的框架时要先说明。仓库里还留着旧版 `design-taste-frontend-v1`，两者不要同时装。

## 注意事项

- **许可**：MIT。
- **不带脚本**：纯说明文字。但它会让智能体安装字体、动画库等依赖，技能自己也要求先核对依赖是否存在，装之前看一眼它要加什么。
- 它规定的「禁用清单」带有作者的审美立场，和团队现有设计规范冲突时，应当明确告诉它以规范为准。

---
title: "emil-design-eng skill 是什么、怎么安装使用：把 Emil Kowalski 的界面打磨标准交给 AI（动效时长、缓动、按压反馈）"
slug: emil-design-eng-skill
name: emil-design-eng（emilkowalski/skills）
url: https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng
pricing: "开源免费（GitHub 标注 MIT）"
platforms: "Claude Code / Codex / Cursor 等支持 Agent Skills 的智能体"
trialNote: "npx skills@latest add emilkowalski/skills --skill emil-design-eng"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, product-design]
excerpt: "emil-design-eng 是 emilkowalski/skills 里安装量最高的技能：把 Emil Kowalski 关于界面打磨、组件设计和动效取舍的经验写成决策框架，评审界面代码时固定输出「改前 / 改后 / 原因」对照表。"
checkedOn: 2026-10-11
sources:
  - https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng
  - https://github.com/emilkowalski/skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 emilkowalski/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 34.0 万次；所在仓库 emilkowalski/skills 在 GitHub 约 4.5 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

Emil Kowalski 是 Sonner、Vaul 等组件库的作者，以界面细节和动效见长。这个技能把他的设计工程方法写给智能体。`description`：编码了 Emil Kowalski 在界面打磨、组件设计、动效决策，以及那些让软件「用着舒服」的隐形细节上的理念。

内容大致四块：

- **核心理念**：品味是练出来的；用户注意不到的细节会累积成整体质感；好看本身是杠杆。
- **动效决策框架**：写动画前按顺序回答四个问题。先问该不该动——一天触发上百次的操作（快捷键、命令面板开合）一律不加动画，一天几十次的要大幅减弱，偶尔出现的弹窗抽屉用标准动画，首次引导这类少见场景才可以加点趣味。再问目的、缓动曲线和时长，技能给了一张时长表：按钮按压反馈 100–160 毫秒，提示与小浮层 125–200，下拉 150–250，弹窗抽屉 200–500，界面动画总体控制在 300 毫秒以内。
- **弹簧动画**：何时用、怎么配、为什么可打断。
- **组件原则**：按钮要有按压反馈；不要从 `scale(0)` 开始出现；浮层从触发点展开；第二个提示气泡跳过延迟等。

它还规定了评审格式：必须用一张「改前 / 改后 / 原因」三列表格，一行一个问题。

## 怎么安装

仓库 README 的安装命令是 `npx skills@latest add emilkowalski/skills`（整库，安装时可在选择器里勾选）。只装这一个，按 skills CLI 文档加 `--skill` 参数：

```bash
npx skills@latest add emilkowalski/skills --skill emil-design-eng
```

装好后技能进入所选智能体的技能目录，按 `description` 自动触发，也可以用 `/emil-design-eng` 手动调用。

仓库整体介绍和其他安装方式，详见本站《emilkowalski/skills 是什么、怎么安装：Emil Kowalski 的界面动效与设计 Skills（让 AI 做的动画不再生硬）》。

## 怎么用

- 「用 emil-design-eng 评审这个下拉菜单组件的动画」——得到对照表，例如把 `transition: all 300ms` 改成只过渡 `transform` 的 200 毫秒缓出。
- 「这个命令面板要不要加开合动画？」——它按使用频率给判断。
- 「给这个按钮补上按压态和合适的缓动」。

SKILL.md 规定，不带问题直接调用时它只回一句就绪说明，等你提问。

## 适合谁 / 局限

适合写 React 与 CSS 界面、想把「能用」提升到「顺手」的前端工程师，以及没有专职动效设计师的小团队。它讲的是网页端的交互细节，不涉及整体视觉风格和信息架构；规则带着作者鲜明的取向（偏快、偏克制），做营销页的大动画时未必适用。同库的 `review-animations` 是专门的动效评审，`animate` 负责动手实现，可以搭配。

## 注意事项

- **许可**：GitHub 标注为 MIT。
- **不带脚本**：纯说明文字，约两万七千字符。
- 内容是作者个人方法的整理，更系统的讲解在他的付费课程 animations.dev，技能本身免费。

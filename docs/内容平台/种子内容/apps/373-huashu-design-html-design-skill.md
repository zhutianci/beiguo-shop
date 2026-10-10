---
title: "huashu-design 是什么、怎么安装使用：花叔的 HTML 原生设计 Skill（高保真原型、发布动画、可编辑 PPT、信息图）"
slug: huashu-design-html-design-skill
name: Huashu Design（花叔 / alchaincyf/huashu-design）
url: https://github.com/alchaincyf/huashu-design
pricing: "开源免费（MIT，2026-05-14 起个人与商用均免费）"
platforms: "Claude Code / Cursor / Codex / OpenClaw / Hermes 等支持 Agent Skills 的工具"
trialNote: "npx skills add alchaincyf/huashu-design"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, product-design, motion-graphics]
excerpt: "Huashu Design 是花叔（alchaincyf）开源的设计 Skill：一句话让智能体用 HTML 产出可点击的 App 原型、产品发布动画、可编辑 PPT 和信息图，内置设计方向顾问、60 种风格库和五维度专家评审。"
checkedOn: 2026-10-11
sources:
  - https://github.com/alchaincyf/huashu-design
  - https://github.com/vercel-labs/skills
---

> 本文根据 alchaincyf/huashu-design 仓库 README 整理，资料核对于 2026-10-11。功能描述多为作者自述，实际效果取决于所用模型。

## 是什么

Huashu Design 是 AI 博主花叔（GitHub 用户名 alchaincyf）做的一个设计技能，README 的口号是「打字。回车。一份能交付的设计。」它的技术路线是 **HTML 原生**：不依赖 Figma 或 AE，所有产物——原型、动画、幻灯片、信息图——都先用 HTML 做出来，再按需导出成其他格式。README 说几分钟到半小时可以产出一段产品发布动画、一个能点击的 App 原型、一套能编辑的 PPT 或一份印刷级的信息图，并称仓库说明里展示的动画都是用这个技能自己做的。

它处理「不出 AI 味」的办法有两手：你提供品牌资产（logo、色板、界面截图）时，按一套固定的「品牌资产协议」读懂品牌气质；什么都不给时，用三套设计方向顾问逻辑加 60 种 HTML 原生风格库兜底。作者在 README 里坦率说明，品牌资产协议的思路借鉴了流传出来的 Claude Design 提示词。

截至 2026-10-11，GitHub 显示该仓库约 2.5 万 Star，最近一次推送在 2026-09-22。

## 包含哪些 Skill

一个技能，README 的「能做什么」列了这些能力：

- **设计方向顾问**：需求模糊时给出几个差异明显的方向供选择；
- **iOS App 原型**：可点击的高保真原型；
- **Motion Design 引擎**：产品发布类动画，可导出视频；
- **HTML Slides → 可编辑 PPTX**：先做网页幻灯片，再转成能编辑的 PPT；
- **Tweaks**：实时切换设计变体；
- **信息图 / 数据可视化**；
- **五维度专家评审**：对成品打分并指出问题；
- 以及「初级设计师工作流」等过程约束。

## 怎么安装

```bash
npx skills add alchaincyf/huashu-design
```

**装完先自检**——这是 README 特别强调的一步：这个技能不止一个 `SKILL.md`，`references/`、`assets/`、`scripts/`、`demos/` 四个子目录缺一不可。如果安装目录（如 `~/.claude/skills/huashu-design/`）里只有 SKILL.md，说明 `skills` CLI 版本太旧（README 称 1.5.15 及以下有只同步单个文件的问题，1.5.19 已修复），用 `npx skills@latest add alchaincyf/huashu-design` 重装。仍不行就手动克隆：

```bash
git clone https://github.com/alchaincyf/huashu-design.git ~/.claude/skills/huashu-design
```

## 怎么用

装好后在智能体里直接说需求，例如：

- 「给我们的记账 App 做一个可以点的 iOS 原型，三个主要页面」；
- 「做一段 20 秒左右的产品发布动画，这是我们的 logo 和主色」；
- 「把这篇文章做成一套幻灯片，再导出成可编辑的 PPTX」；
- 「评审一下刚才这版设计，按五个维度打分」。

## 适合谁 / 不适合谁

**适合：**
- 没有设计师的小团队、独立开发者，需要快速拿出像样的原型和宣传物料；
- 中文用户——说明文档、教程和示例都以中文为主。

**不适合：**
- 已有成熟设计系统、需要在 Figma 里协作的设计团队；
- 期望一次生成就能直接上线的人，成品仍需要人来把关细节。

## 注意事项

- **许可证变更**：README 公告自 2026-05-14 起改为 MIT，个人和商用都免费、无需授权；此前「个人免费、企业商用需授权」的条款已作废。网上较早的介绍文章可能还写着旧条款，以仓库 LICENSE 为准。
- **会执行脚本**：导出视频、PPTX 等步骤依赖 `scripts/` 里的脚本和本机环境，安装前浏览一遍。
- **品牌素材**：只提供你有权使用的 logo 和素材，不要让它仿制他人品牌。
- **维护状态**：最近推送 2026-09-22。
- 技能体积较大、引用文件多，加载时会占用一定上下文。

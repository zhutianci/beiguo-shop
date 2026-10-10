---
title: "frontend-design skill 是什么、怎么安装使用：Anthropic 官方的前端设计 Skill，让 Claude 做的页面少点「模板味」"
slug: anthropic-frontend-design-skill
name: frontend-design（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/frontend-design
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding, product-design]
excerpt: "frontend-design 是 anthropics/skills 里的前端设计 Skill：要求 Claude 先弄清产品与受众，再对配色、字体、版式做有主见的选择，并在交付前对照需求自查，避免千篇一律的 AI 页面。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/frontend-design
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 97.1 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

让大模型写网页，功能通常没问题，难看的是「一眼 AI」：居中大标题、紫色渐变、清一色圆角卡片。frontend-design 针对的就是这个问题。它不带脚本和组件库，整个技能只有一份说明文字，作用是换掉 Claude 做设计时的默认姿态：把自己当成一家设计工作室的主创，客户已经否掉了几版「看着眼熟」的方案，这一版必须有明确的视觉主张。

按技能的 `description`，新建界面或者重塑已有界面、需要定审美方向和字体时，Claude 会自动加载它。说明文字大致分四块：先从题材出发（产品是什么、给谁用、页面最主要的任务是什么，需求里没写就先提出一个具体设想并向你确认）；设计原则；「先规划、再对照需求评审」的流程；最后是克制与自我批评，以及界面文案怎么写。

## 怎么安装

`frontend-design` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/frontend-design` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 直接提需求：「给一家卖手冲咖啡器具的小店做一个落地页」。它会先说明打算采用的方向（配色、字体、版式的理由），再动手写代码。
- 改造旧页面：「这个后台仪表盘看起来太像模板了，在不改功能的前提下重新设计视觉」。
- 手动调用：通过插件安装时，命令菜单里是 `/example-skills:frontend-design`，输入后再描述页面。

给的背景越具体（行业、受众、想避开的风格），出来的方向越不容易撞车。

## 适合谁 / 局限

适合用 Claude Code 从零做落地页、作品集、产品原型，又不想每次都得到同一种风格的人；也适合没有设计师的小团队拿来出第一版。

局限也很明显：它只是设计方向上的指引，没有组件、没有设计规范库，也不会替你检查无障碍和性能；团队已有成型的设计系统时，它鼓励的「冒一点审美风险」反而可能和规范冲突，这种情况应该明确告诉它以现有规范为准。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0。
- **不运行脚本、不联网**：纯说明文字，风险面很小；它影响的是 Claude 的设计决策，最终代码仍要自己过一遍。
- **同名技能很多**：skills.sh 上有多个仓库都叫 frontend-design，内容并不相同，安装时认准 `anthropics/skills`。
- 官方声明仓库里的技能用于演示和学习，Claude 产品内置的行为可能与这份实现不同。

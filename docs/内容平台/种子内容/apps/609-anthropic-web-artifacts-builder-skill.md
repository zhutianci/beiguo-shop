---
title: "web-artifacts-builder 是什么、怎么使用：用 React + Tailwind + shadcn/ui 做复杂 claude.ai Artifact 的官方 Skill"
slug: anthropic-web-artifacts-builder-skill
name: web-artifacts-builder（anthropics/skills）
url: https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder
pricing: "免费（Apache-2.0，见技能目录内 LICENSE.txt）"
platforms: "Claude Code / claude.ai / Claude API"
trialNote: "`/plugin marketplace add anthropics/skills` 然后 `/plugin install example-skills@anthropic-agent-skills`"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding]
excerpt: "web-artifacts-builder 是 anthropics/skills 里构建复杂网页 Artifact 的 Skill：用脚本初始化 React + TypeScript + Tailwind + shadcn/ui 项目，开发后打包成单个 HTML 文件交付。"
checkedOn: 2026-10-11
sources:
  - https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder
  - https://github.com/anthropics/skills
  - https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json
  - https://code.claude.com/docs/en/skills
---

> 本文根据 anthropics/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 10.7 万次；所在仓库 anthropics/skills 在 GitHub 约 18.0 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

claude.ai 的 Artifact 很适合展示单文件的小页面，但一旦需要多个组件、状态管理、路由，单文件手写就很难维护。web-artifacts-builder 的思路是：先按正常前端工程的方式开发，再打包成一个可以直接当 Artifact 展示的 HTML 文件。`description` 明确了适用范围——需要状态管理、路由或 shadcn/ui 组件的复杂 Artifact；简单的单文件 HTML / JSX 不需要它。

技术栈是 React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui，打包用 Parcel。流程五步：运行 `scripts/init-artifact.sh` 初始化项目（已配好 Tailwind 和 shadcn/ui 组件）→ 编辑生成的代码 → 运行 `scripts/bundle-artifact.sh` 把所有代码打进单个 HTML → 把结果展示给用户 →（可选）测试。说明里还有一条醒目的设计要求：避开常说的「AI 味」——过多的居中布局、紫色渐变、清一色圆角和 Inter 字体。

## 怎么安装

`web-artifacts-builder` 收在 anthropics/skills 仓库的 example-skills 插件包里。在 Claude Code 会话中依次输入（命令来自仓库 README）：

```text
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

同一个包里的其他示例技能会一起装上。只想要这一个，可以把仓库里的 `skills/web-artifacts-builder` 文件夹复制到 `~/.claude/skills/`（个人）或项目的 `.claude/skills/`；claude.ai 网页版则在 Customize → Skills 里上传这个文件夹的 ZIP。

仓库整体介绍和其他安装方式，详见本站《anthropics/skills 是什么、怎么安装：Anthropic 官方 Skills 仓库（docx / pptx / xlsx / pdf、skill-creator）》。

## 怎么用

- 「做一个带筛选、排序和详情弹窗的任务看板 Artifact，数据先用假数据」。
- 「把这个多步骤表单做成 Artifact，包含校验和进度条，用 shadcn/ui 组件」。
- 「把刚才的项目重新打包成单文件 HTML 给我」。

目录里是两个 shell 脚本和一个 shadcn/ui 组件压缩包（初始化时解开使用）。

## 适合谁 / 局限

适合想在对话里做出接近真实应用的交互原型的人，例如给客户演示的小工具、内部看板的样机。它产出的是单个静态 HTML：没有后端，数据不落库，不适合直接当正式产品上线；简单页面用它反而绕远，直接让 Claude 写单文件更快。

## 注意事项

- **许可**：技能目录内的 LICENSE.txt 为 Apache-2.0；shadcn/ui 等依赖遵循各自的开源许可。
- **会执行脚本并安装依赖**：初始化要通过包管理器下载前端依赖，需要 Node 环境和网络；首次运行较慢。
- **使用环境**：名字里的 Artifact 指 claude.ai 的展示方式；在 Claude Code 里同样可以用它生成单文件 HTML，用浏览器打开查看。
- 打包结果体积较大，分享前可自行检查是否包含不想公开的测试数据。

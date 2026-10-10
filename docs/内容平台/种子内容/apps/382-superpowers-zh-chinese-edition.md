---
title: "superpowers-zh 是什么、怎么安装：Superpowers 中文版（完整汉化 + 中文代码审查、Git 工作流等原创技能）"
slug: superpowers-zh-chinese-edition
name: superpowers-zh（Superpowers 中文增强版）
url: https://github.com/jnMetaCode/superpowers-zh
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / Trae / Qoder / CodeBuddy / Kiro / Gemini CLI 等 26 款"
trialNote: "npx superpowers-zh"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "superpowers-zh 是社区维护的 Superpowers 中文增强版：15 个上游技能的完整汉化，加 4 个面向国内团队的原创技能（中文代码审查、Git 工作流、技术文档、提交规范），一条 npx 命令适配 Trae、Qoder、CodeBuddy 等国产工具。"
checkedOn: 2026-10-11
sources:
  - https://github.com/jnMetaCode/superpowers-zh
  - https://github.com/obra/superpowers
  - https://www.npmjs.com/package/superpowers-zh
---

> 本文根据 jnMetaCode/superpowers-zh 仓库 README 整理，资料核对于 2026-10-11。这是社区项目，不是 Superpowers 原作者的官方中文版。

## 是什么

Superpowers 是目前 Star 数最高的 Skills 开发流程框架，但它的技能全是英文，安装方式也主要照顾海外的工具。superpowers-zh 是开发者 jnMetaCode 维护的中文社区版：把上游技能完整翻译成中文（技术术语保留英文），再补上一些面向国内开发环境的内容。

README 用一个例子说明装和不装的区别：你说「给用户模块加个批量导出功能」，没装时智能体直接开始写代码；装了之后它会先问导出格式、数据量、权限要求，给出两三个方案，确认后再动手——这正是上游 brainstorming 技能的行为，只是全程中文。

与上游的差异，README 列了一张对比表，要点有三：

- **安装方式**：上游按工具分别安装，这里是一条 `npx superpowers-zh` 自动识别项目里的工具并安装；
- **支持的工具**：号称 26 款，除了 Claude Code、Cursor、Codex 等，还包括 Trae、Qoder（阿里）、CodeBuddy（腾讯）、华为云码道 CodeArts、Kiro、Qwen Code 等；
- **本地化内容**：Git 平台示例覆盖 Gitee、Coding、极狐 GitLab、CNB，代码审查风格适配国内团队的沟通习惯。

截至 2026-10-11，GitHub 显示该仓库约 8291 Star、769 Fork，最近一次推送在 2026-10-08。

## 包含哪些 Skill

README 的统计是 21 个：

- **15 个翻译技能**：对应上游的 brainstorming、writing-plans、test-driven-development、systematic-debugging 等；
- **4 个原创技能**（都是手动调用，不会自动触发）：`chinese-code-review`（符合国内团队文化的代码审查规范）、`chinese-git-workflow`（适配 Gitee / Coding / 极狐 GitLab / CNB）、`chinese-documentation`（中文排版、中英混排、避免机翻味）、`chinese-commit-conventions`（中文提交信息规范）；
- **2 个上游已移除、本项目保留的技能**：`mcp-builder` 和 `workflow-runner`。

README 解释了原创技能设计成手动调用的原因：它们是参考资料而非工作流，避免干扰上游技能的自动调度。

## 怎么安装

在项目目录里运行：

```bash
npx superpowers-zh
```

它会识别当前项目使用的工具并把技能装到对应目录（例如 Claude Code 是 `.claude/skills/`，Cursor 是 `.cursor/skills/`，Codex 是 `.agents/skills/`）。识别不出来时用 `--tool <名称>` 指定，例如 `npx superpowers-zh --tool cline`；个别工具需要 `--global`。

## 怎么用

- 装好后照常用中文提需求，流程类技能会自动触发；
- 需要中文规范时手动调用：`/chinese-code-review`、`/chinese-commit-conventions` 等；
- 各技能的具体行为可参考本站对上游 Superpowers 各个技能的介绍。

## 适合谁 / 不适合谁

**适合：** 团队成员更习惯中文交流、希望智能体的提问和计划文档都是中文的开发者；使用 Trae、Qoder、CodeBuddy 等上游没有照顾到的国产工具的用户；代码托管在 Gitee、Coding 等平台的团队。

**不适合：** 已经在用英文原版并且运转良好的人——两者不要同时安装，同名技能会冲突；追求与上游完全同步的人，翻译版本难免滞后。

## 注意事项

- **许可证**：MIT，上游 obra/superpowers 同为 MIT。
- **这是社区分支**：翻译质量和更新节奏取决于维护者，上游改动（Superpowers 更新很频繁）不会立刻体现。遇到行为与上游文档不一致时，以实际安装的 SKILL.md 为准。
- **README 含推广内容**：仓库说明里有维护者的免费课程、赞助商信息和其个人的其他工具推荐，与技能本身无关，按需取用。
- **安装脚本会写入多个目录**：`npx` 会下载并执行 npm 包，装之前可先看 npm 页面和仓库里的安装脚本；它会在项目里创建各工具的技能目录和规则文件。
- 第三方技能安装前建议抽读几个 `SKILL.md`。

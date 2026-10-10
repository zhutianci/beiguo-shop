---
title: "find-skills skill 是什么、怎么安装使用：skills.sh 安装量第一的 Skill，让智能体自己找技能、装技能"
slug: vercel-find-skills-skill
name: find-skills（vercel-labs/skills）
url: https://github.com/vercel-labs/skills/tree/main/skills/find-skills
pricing: "开源免费（MIT）"
platforms: "Claude Code / Codex / Cursor / OpenCode / Copilot / Gemini CLI 等数十种智能体"
trialNote: "npx skills add vercel-labs/skills --skill find-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent]
excerpt: "find-skills 是 skills CLI 仓库自带的技能：当你问「有没有做 X 的 skill」或需要某种专门能力时，让智能体先查 skills.sh 榜单、再用 npx skills find 搜索，把合适的技能推荐给你并协助安装。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vercel-labs/skills/tree/main/skills/find-skills
  - https://github.com/vercel-labs/skills
  - https://skills.sh/
---

> 本文根据 vercel-labs/skills 仓库里该技能的 SKILL.md 与仓库 README 整理，资料核对于 2026-10-11。skills.sh 榜单当日显示该技能累计安装约 378.3 万次；所在仓库 vercel-labs/skills 在 GitHub 约 3.4 万 Star（同日数据）。技能内容会随仓库更新，以仓库为准。

## 这个 Skill 做什么

技能越来越多，「我需要的那个到底叫什么、在哪个仓库」反而成了问题。find-skills 让智能体自己去找。它是 Vercel 的 skills CLI 仓库里自带的技能，在 skills.sh 当日榜单上累计安装量排第一。`description`：当用户问「怎么做 X」「找一个做 X 的 skill」「有没有能……的 skill」，或表达出想扩展能力的意愿时，帮助用户发现并安装智能体技能。

适用的情形写得很细：用户问的事可能已有现成技能、明确要求找技能、问「你能做 X 吗」而 X 是某种专门能力、想搜索工具模板或工作流、提到希望在某个领域（设计、测试、部署等）得到帮助。

技能先向智能体介绍 skills CLI 是什么——开放技能生态的包管理器——和三条关键命令：`npx skills find [关键词]` 搜索（可用 `--owner` 限定某个 GitHub 用户或组织）、`npx skills add <包>` 安装、`npx skills update` 更新。

然后是找技能的步骤：**先弄清需求**（什么领域、什么具体任务、是否常见到很可能已有技能）→ **先看榜单**（skills.sh 的榜单按总安装量排序，能浮现最流行、经过更多人使用的选项）→ 榜单没有覆盖时再**运行搜索命令** → 把候选技能介绍给用户并提供安装命令。

## 怎么安装

`find-skills` 就放在 skills CLI 自己的仓库里，用 CLI 文档中的 `--skill` 参数安装：

```bash
npx skills add vercel-labs/skills --skill find-skills
```

加 `-g` 装到用户目录，这样所有项目里都能用；需要 Node.js 环境来运行 `npx`。

仓库整体介绍和其他安装方式，详见本站《skills.sh 是什么、怎么用：Vercel 的 Agent Skills 排行榜与 npx skills 安装命令》。

## 怎么用

- 「有没有帮我写 Playwright 测试的 skill？」
- 「我想让你更懂 Supabase，找找有没有官方的技能」。
- 「找一个做信息图的 skill，要中文友好的」——它会搜索并列出候选，由你决定装哪个。

这个技能只有一份 SKILL.md。

## 适合谁 / 局限

适合刚开始用 Agent Skills、还不熟悉生态的人，把「找技能」这一步交给智能体。它依据的是 skills.sh 的索引和安装量：**安装量高不等于质量高或安全**——榜单上存在与知名项目同名的仓库和来源不明的技能，热门技能的计数里也包含整库安装带来的部分。搜到之后装不装，要自己判断。

## 注意事项

- **许可**：MIT（skills CLI 仓库）。
- **会联网并执行 `npx skills` 命令**：安装第三方技能前，让它先把仓库地址和 SKILL.md 的内容给你看，不要让它不经确认就直接安装。
- **来源优先级**：同类技能优先选官方团队或知名维护者的仓库；本站 Skill 库目录里的条目都核对过许可证和维护状态，可以先在站内找。
- 装之前可以用本站介绍过的 SkillSpector 扫描一遍。

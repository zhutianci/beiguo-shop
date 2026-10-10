---
title: "skills.sh 是什么、怎么用：Vercel 的 Agent Skills 排行榜与 npx skills 安装命令"
slug: skills-sh-npx-skills-directory
name: skills.sh 与 npx skills（Vercel Skills 目录）
url: https://skills.sh/
pricing: 免费（CLI 开源，MIT）
platforms: Claude Code / Codex / Cursor / OpenCode / GitHub Copilot / Gemini CLI 等数十种智能体
trialNote: "npx skills add vercel-labs/agent-skills"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "skills.sh 是 Vercel 做的 Agent Skills 目录和安装量排行榜，配套开源命令行 npx skills：一条命令把 GitHub 上的技能装进 Claude Code、Codex、Cursor 等数十种智能体，并提供安全审计结果页。"
checkedOn: 2026-10-10
sources:
  - https://skills.sh/
  - https://skills.sh/docs
  - https://skills.sh/docs/faq
  - https://skills.sh/audits
  - https://skills.sh/official
  - https://github.com/vercel-labs/skills
---

> 本文根据 skills.sh 官方站点及其文档、vercel-labs/skills 仓库 README 整理，资料核对于 2026-10-10。榜单数据每天变化，以站点为准。

## 是什么

技能散落在成千上万个 GitHub 仓库里，每种智能体放技能的目录又不一样。Vercel 做了两样东西来解决这件事：

- **`npx skills`**：开源命令行工具（仓库 vercel-labs/skills），负责把某个仓库里的技能装到你电脑上各个智能体对应的目录。README 写明支持 OpenCode、Claude Code、Codex、Cursor 以及另外 75 种智能体。
- **skills.sh**：技能目录网站，首页就是一张安装量排行榜，可以按总榜、24 小时趋势、热门查看，也可以按主题（React、Next.js、设计、移动端、数据库、测试、营销等）和智能体筛选。

站点文档说明，排行榜的数据来自 CLI 的匿名遥测：用户执行安装命令时只统计「哪个技能被安装了」的汇总次数，不收集个人信息；遥测可以关闭。

截至 2026-10-10，GitHub 显示 vercel-labs/skills 约 3.4 万 Star、2,900 Fork，最近一次推送在 2026-10-09。

## 包含哪些 Skill

skills.sh 自己不写技能，它是索引。2026-10-10 首页总榜靠前的有：

- `find-skills`（vercel-labs/skills，约 380 万次安装）：让智能体自己去搜索并安装合适的技能；
- mattpocock/skills 的 `grill-me`、`tdd`、`improve-codebase-architecture` 等（各约 110 万至 130 万次）；
- `agent-browser`（vercel-labs/agent-browser，约 110 万次）：给智能体用的浏览器自动化；
- `frontend-design`（anthropics/skills，约 97 万次）；
- 飞书官方的 `lark-doc` 等一系列 lark 技能、微软的 azure 系列、`vercel-react-best-practices`、`remotion-best-practices`、`caveman`、obra/superpowers 的 `brainstorming` 等。

站点还有几个实用栏目：

- **Official**：只列技术厂商自己发布的技能，如 anthropics、cloudflare、microsoft、nvidia、supabase、stripe、huggingface、getsentry 等；
- **Audits**：汇总 Gen Agent Trust Hub、Socket、Snyk 三家对技能的安全审计结果（Safe / 风险等级 / 告警数）；
- **Packs**：把多个技能（含私有技能）打成一个可分享的安装命令。

## 怎么安装

需要本机有 Node.js。安装某个仓库的技能（命令来自 README）：

```bash
npx skills add vercel-labs/agent-skills
```

CLI 会自动检测你装了哪些智能体，交互式地让你选技能、选智能体、选装到项目还是用户目录。常用参数（均来自 README）：

```bash
# 只列出仓库里有哪些技能，不安装
npx skills add vercel-labs/agent-skills --list

# 只装指定技能，装到用户目录，只给 Claude Code，跳过确认
npx skills add vercel-labs/agent-skills --skill frontend-design -g -a claude-code -y
```

默认装到当前项目（如 Claude Code 是 `.claude/skills/`，Codex 是 `.agents/skills/`），加 `-g` 装到用户目录（`~/.claude/skills/`、`~/.agents/skills/`）。来源除了 `owner/repo`，也可以写完整 GitHub 地址、仓库里某个技能的目录地址、GitLab 地址或本地路径。

## 怎么用

- **先看再装**：在 skills.sh 搜一个技能，点进去看它的 `SKILL.md` 内容和审计结果，再复制页面上的安装命令。
- **试用不安装**：`npx skills use vercel-labs/agent-skills@web-design-guidelines | claude` 会把某个技能临时生成为一段提示词交给 Claude Code，用完不留文件。
- **日常维护**：`npx skills list` 查看已装技能，`npx skills update` 更新到最新版本，`npx skills remove 技能名` 卸载，`npx skills find 关键词` 在命令行里搜索。
- **写自己的**：`npx skills init my-skill` 生成一份 `SKILL.md` 模板。

## 适合谁 / 不适合谁

**适合：**
- 同时用几种智能体（比如 Claude Code + Codex + Cursor）、想一次装到所有工具的人；
- 想看「大家实际在装什么」而不只是看 GitHub Star 的人；
- 给团队统一分发一组技能的负责人（Packs）。

**不适合：**
- 只用 claude.ai 网页版的用户——它装的是本地文件，网页版要走上传 ZIP；
- 不想装 Node.js 的人——可以手动把技能文件夹复制到对应目录；
- 需要 Claude Code 插件里的 Hooks、MCP 等完整能力时——`npx skills` 只装技能，那类仓库用 `/plugin` 安装更完整。

## 注意事项

- **许可证**：CLI 是 MIT；目录里每个技能的许可证看它自己的仓库。
- **榜单不等于质量背书**：安装量来自遥测，可能被批量安装拉高。2026-10-10 的榜单里就能看到多个仓库名同样叫 superpowers、但并非 obra/superpowers 的条目，内容也和它无关——**安装时认准 `owner/repo` 的完整写法**。
- **审计是参考**：站点文档写明会定期做安全审计，但不能保证每个技能的质量和安全，建议安装前自己审查；榜单里也有不少技能的审计状态是 Pending（待审）。
- **技能可以执行脚本**：装到用户目录（`-g`）的技能对所有项目生效，陌生来源的技能先读 `SKILL.md` 和脚本再装。
- **遥测**：默认匿名上报安装统计，介意的话按 CLI 文档关闭。
- **维护状态**：仓库活跃（最近推送 2026-10-09），是 Vercel Labs 的项目。

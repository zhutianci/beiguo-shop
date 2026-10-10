---
title: "last30days 是什么、怎么安装使用：一条命令调研 Reddit / X / YouTube / HN 近 30 天讨论的 Skill"
slug: last30days-skill-research
name: /last30days（mvanhorn/last30days-skill）
url: https://github.com/mvanhorn/last30days-skill
pricing: 开源免费（MIT）；部分信息源需自备第三方 API Key
platforms: Claude Code / Codex / Cursor / GitHub Copilot / Gemini CLI / claude.ai / Claude Desktop 等
trialNote: "`/plugin marketplace add mvanhorn/last30days-skill` 然后 `/plugin install last30days`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, ai-agent, social-media]
excerpt: "last30days 是一个调研类 Skill：输入人名、公司、产品或话题，并行检索 Reddit、X、YouTube、Hacker News、GitHub 和网页近 30 天的讨论，按互动热度排序后汇总成带出处的简报。部分来源需自备 API Key 或登录态。"
checkedOn: 2026-10-10
sources:
  - https://github.com/mvanhorn/last30days-skill
  - https://github.com/mvanhorn/last30days-skill/blob/main/CONFIGURATION.md
  - https://code.claude.com/docs/en/discover-plugins
  - https://github.com/vercel-labs/skills
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
---

> 本文根据 mvanhorn/last30days-skill 仓库 README、Claude Code 官方文档与 Claude 帮助中心整理，资料核对于 2026-10-10。支持的信息源和所需凭据经常变动，以仓库 README 和 CONFIGURATION.md 为准。

## 是什么

last30days 是一个做「近期舆情调研」的 Skill。模型的训练数据总比现实慢几个月，普通搜索又以媒体报道和博客为主，看不到社区里正在发生的讨论。这个技能的做法是：你给一个话题，它去多个平台并行检索最近 30 天的内容，按点赞、评论、播放量这类真实互动数据打分，把讲同一件事的帖子合并，最后由智能体写成一份带出处的简报。

它背后是一套 Python 引擎（README 写明需要 Python 3.12 及以上），技能负责调度引擎并做最后的综合。README 给的典型场景包括：开会前了解对方最近在做什么、比较几款工具的社区口碑、出行前查近况、快速学一个新东西当前的最佳做法。

截至 2026-10-10，GitHub 显示该仓库约 6.4 万 Star、5563 Fork，最近一次推送在 2026-10-09。仓库有简体中文 README（README.zh-CN.md）。

## 包含哪些 Skill

仓库的核心是一个技能 `last30days`，对应命令 `/last30days`。它能接入的信息源按「要不要额外配置」分三档（依据 README 的说明）：

- **装好就能用**：Reddit（含热门评论）、Hacker News、Polymarket、GitHub、StockTwits；
- **首次运行的设置向导自动安装免费命令行工具后可用**：arXiv、Techmeme；YouTube 需要本机装有 `yt-dlp`；
- **需要自备凭据**：X / Twitter（官方 X API 的 `X_BEARER_TOKEN`，或浏览器里已登录 x.com 的会话，或其他服务商的 Key）、Bluesky（应用专用密码）、TikTok / Instagram / Threads / Pinterest / LinkedIn（第三方数据服务 ScrapeCreators 的 Key）、Perplexity（Perplexity 或 OpenRouter 的 Key）、网页搜索（Brave Search 的 Key）。

除按话题调研外，还有几种模式：不给话题、直接问「最近什么在升温」的发现模式；把结果存入本地数据库做持续跟踪和定期简报；在本地已保存的简报里检索。

## 怎么安装

**Claude Code（README 推荐，可随市场自动更新）**：

```text
/plugin marketplace add mvanhorn/last30days-skill
/plugin install last30days
```

**Codex、Cursor、Copilot、Gemini CLI 等**：

```bash
npx skills add mvanhorn/last30days-skill -g
```

`-g` 表示装到用户目录、所有项目可用；指定工具可以加 `-a`，例如 `npx skills add mvanhorn/last30days-skill -g -a codex`。README 提醒同一台机器只用一种安装方式，否则 Claude Code 里会出现两个 `/last30days`。

**claude.ai 网页版**：从仓库最新 Release 下载 `last30days.skill`，在 Customize → Skills 里点「+」→ Create skill → Upload a skill 上传；需要先在 Capabilities 里打开「Code execution and file creation」。

**Claude Desktop**：下载对应平台的 `.mcpb` 包拖进 Settings → Extensions，以 MCP 服务器的形式运行；README 说明目前提供 macOS 和 Linux 的包，Windows 暂未支持。

## 怎么用

- 直接跟话题：`/last30days OpenClaw vs Hermes vs Paperclip` 会给出几款工具的对比；跟人名或公司名则汇总对方近一个月的公开动态。
- 发现模式：`/last30days what's trending in AI agents?`，返回按升温速度排序的若干话题。
- 第一次运行会进入设置向导，按提示决定开启哪些信息源；不配任何 Key 也能用免费的那几个来源。
- 想先看它会读写什么再决定：在技能目录运行 `scripts/last30days.py --preflight`，它只列出配置来源、浏览器 Cookie 使用计划和将要写入的文件，不实际执行调研。
- 调研结果默认保存在 `~/Documents/Last30Days/`，可用环境变量 `LAST30DAYS_MEMORY_DIR` 或 `--save-dir` 改位置。

## 适合谁 / 不适合谁

**适合：**
- 内容创作者、产品经理、投资和销售人员——需要快速掌握一个话题在社区里的真实口碑；
- 追踪 AI 工具动态、想让提示词和做法跟上社区最新经验的开发者；
- 愿意花几分钟配置 Key 来换取更全信息源的人。

**不适合：**
- 主要关注中文平台的人——信息源以英文社区为主，小红书接入需要自己另行运行本地服务，属于进阶用法；
- 需要严谨、可引用的权威资料的场景——社区热度不等于事实，简报只能当线索；
- 不愿意让工具接触浏览器登录态或保存第三方密钥的用户。

## 注意事项

- **许可证**：仓库 LICENSE 为 MIT。
- **维护状态**：更新活跃，最近一次推送 2026-10-09。
- **需要哪些账号和服务（重点）**：免费来源之外，X、Bluesky、TikTok、Instagram、LinkedIn、Perplexity、Brave 等都要你自己提供 API Key、应用密码或登录态；其中一部分是按量计费的第三方数据服务，费用和免费额度以各服务商官网为准。Key 保存在 `~/.config/last30days/.env` 或 macOS 钥匙串，不要提交到代码仓库。
- **平台条款**：通过浏览器登录态或第三方数据服务读取社交平台内容，是否符合该平台的服务条款需要你自己判断并承担后果；优先使用官方 API，不要用于批量采集个人信息或骚扰他人。调研具体的人时，只使用公开信息并注意分寸。
- **安全提醒**：技能会在本机运行 Python 脚本、联网请求多个站点、可能读取浏览器 Cookie，并把结果写入文档目录；首次设置还会安装额外的命令行工具。安装前通读 `SKILL.md` 和脚本，先用 `--preflight` 看一遍计划。README 称项目不含跟踪和统计。把简报发布成公开页面的功能需要显式开启，默认不会发布。
- **兼容性**：Claude Desktop 与 Claude Code 的密钥分开保存，需要各配一次。
- 简报中的数字和引述来自抓取时的页面，引用前请回到原帖核对。

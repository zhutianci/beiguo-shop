---
title: "ComposioHQ/awesome-claude-skills 是什么、怎么用：Composio 维护的 Claude Skills 精选清单（分类导航与安装方法）"
slug: composio-awesome-claude-skills
name: ComposioHQ/awesome-claude-skills（技能清单）
url: https://github.com/ComposioHQ/awesome-claude-skills
pricing: 免费（README 写 Apache-2.0，仓库无 LICENSE 文件）
platforms: Claude.ai / Claude Code / Codex / Cursor / Gemini CLI / Antigravity
trialNote: "清单本身不用安装：在 README 里按分类找到技能，再到它所在的文件夹或仓库按说明安装"
products: [claude]
models: [claude-llm]
topics: [agent-skills, ai-agent, coding]
excerpt: "awesome-claude-skills 是 Composio 公司维护的 Claude Skills 清单，按文档处理、开发工具、数据分析、营销、写作、创意、效率等分类收录技能链接，并附带 78 个依赖 Composio 服务的应用自动化技能。Star 数很高，适合当导航用。"
checkedOn: 2026-10-10
sources:
  - https://github.com/ComposioHQ/awesome-claude-skills
  - https://code.claude.com/docs/en/skills
  - https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - https://agentskills.io/home
---

> 本文根据 ComposioHQ/awesome-claude-skills 仓库 README、Claude Code 官方文档和 Claude 帮助中心整理，资料核对于 2026-10-10。这是一份清单而不是单个技能，收录的条目由各自作者维护。

## 是什么

awesome-claude-skills 是一份「awesome 清单」：把散落在 GitHub 各处的 Claude Skills 按用途分类，列出名字、链接和一句话说明，方便你找。维护方是 Composio，一家做 AI 智能体工具集成的公司。除了外链，仓库里也直接放了一部分技能文件夹，可以拿来就用。

有两件事先说清楚。第一，README 开头自称收录 1000 多个技能和插件，但核对当日 README 的技能列表里逐条列出的是 160 多条，其中 78 条属于 Composio 自家的应用自动化系列。第二，这份清单同时是 Composio 的产品入口：README 顶部先介绍它的 MCP Gateway 和 connect-apps 插件，使用它们需要到 Composio 注册并获取 API Key。清单里的其他技能不依赖 Composio，可以单独用。

截至 2026-10-10，GitHub 显示该仓库约 7.7 万 Star、9008 Fork，最近一次推送 2026-09-18，是同类清单里 Star 数最高的之一。

## 包含哪些 Skill

README 按以下分类组织，每类举几个清单里的条目（名称照原样）：

- **Document Processing（文档处理）**：`docx`、`pdf`、`pptx`、`xlsx`（指向 Anthropic 官方仓库）、Markdown to EPUB Converter；
- **Development & Code Tools（开发与代码工具）**：`test-driven-development`、`using-git-worktrees`（指向 obra/superpowers）、MCP Builder、Skill Creator、Webapp Testing、Changelog Generator、Skill Seekers；
- **Data & Analysis（数据与分析）**：CSV Data Summarizer、`root-cause-tracing`、`postgres`；
- **Business & Marketing（商业与营销）**：Brand Guidelines、Internal Comms、Lead Research Assistant；
- **Communication & Writing（沟通与写作）**：Content Research Writer、Meeting Insights Analyzer、`brainstorming`、NotebookLM Integration；
- **Creative & Media（创意与媒体）**：Canvas Design、Theme Factory、Slack GIF Creator；
- **Productivity & Organization（效率与整理）**：File Organizer、Invoice Organizer、Tailored Resume Generator、`n8n-skills`；
- **Collaboration & Project Management（协作与项目管理）**：`git-pushing`、`test-fixing`、`google-workspace-skills`；
- **App Automation via Composio**：面向 78 个 SaaS 应用的自动化技能，如 HubSpot、Salesforce、Zoom 等，全部通过 Composio 的 Rube MCP 调用。

此外还有 Security & Systems 和 Assistive Technology 两个小分类。

## 怎么安装

清单不需要安装，要装的是你从中挑出来的某个技能。做法分两种情况：

- **条目是外部仓库链接**：点进去，按那个仓库自己的 README 安装——这是最稳妥的，因为不同仓库支持的安装方式不一样；
- **条目是本仓库里的文件夹**：把对应的技能文件夹下载下来，按下面的方式放到位。

README 的「Getting Started」给了三种用法：

- **Claude.ai**：在界面里添加技能或上传自定义技能。按 Claude 帮助中心的现行说明，是先在 Settings → Capabilities 打开「Code execution and file creation」，再到 Customize → Skills 上传技能文件夹的 ZIP；
- **Claude Code**：README 写的是把技能复制到 `~/.config/claude-code/skills/`。这与 Claude Code 官方文档不一致——官方写的个人技能位置是 `~/.claude/skills/<技能名>/SKILL.md`，项目技能是 `.claude/skills/<技能名>/SKILL.md`，以官方文档为准；
- **Claude API**：README 的示例代码用的模型和参数写法都比较旧，以官方 Skills API 文档为准。

## 怎么用

- **当导航用**：带着具体需求去翻对应分类，例如想让 Claude 整理发票就看 Productivity 分类，比泛泛搜索快；
- **装好之后**：技能在任务匹配时自动加载；Claude Code 里输入 `/skills` 可以确认是否识别到，也可以用 `/技能名` 手动调用；
- **判断值不值得装**：点开条目先看 `SKILL.md` 写得是否具体、仓库最近有没有更新、有没有附带脚本；
- **想写自己的**：README 后半部分有技能目录结构和一份基础模板，清单里的 Skill Creator 也是干这个的。

## 适合谁 / 不适合谁

**适合：**
- 刚接触 Skills、想快速看看别人都做了哪些技能的人；
- 需要给营销、运营、行政等非开发岗位找现成技能的人——这份清单里非编程类条目比较多；
- 本来就在用 Composio 连接各类 SaaS 的团队。

**不适合：**
- 想要一套经过统一审核、装上就放心用的技能的人——清单只做收集，不做安全审计；
- 介意商业推广的人——README 有相当篇幅在介绍 Composio 自己的产品。

## 注意事项

- **许可证**：README 末尾写仓库采用 Apache License 2.0，并说明各技能可能有不同许可；但截至 2026-10-10 仓库根目录没有 LICENSE 文件，GitHub 也未识别出许可证。清单指向的外部技能各有各的许可，使用前到原仓库确认。
- **维护状态**：最近一次推送 2026-09-18。
- **安全**：技能可以带脚本、读写文件、执行命令。这里的条目来自许多不同作者，没有统一审核，安装前务必通读 `SKILL.md` 和脚本，优先选官方或知名来源。connect-apps 插件和 App Automation 系列会把你的邮箱、协作工具等账号授权给第三方服务，并需要 Composio 的 API Key，接入前想清楚数据会经过谁。
- **兼容性**：README 称这些技能也适用于 Codex、Cursor、Gemini CLI、Antigravity 等，这是它的说法；清单里不少技能是按 Claude 写的，换到别的智能体需要自己验证。

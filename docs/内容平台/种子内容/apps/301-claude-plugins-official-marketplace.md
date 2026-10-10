---
title: "Claude Code 官方插件市场 claude-plugins-official 是什么、怎么安装插件和 Skills"
slug: claude-plugins-official-marketplace
name: claude-plugins-official（Claude Code 官方插件市场）
url: https://github.com/anthropics/claude-plugins-official
pricing: 免费（目录 Apache-2.0，各插件许可证各自声明）
platforms: Claude Code
trialNote: "/plugin install {plugin-name}@claude-plugins-official"
products: [claude]
models: [claude-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "claude-plugins-official 是 Anthropic 管理的 Claude Code 官方插件市场，收录 Anthropic 自己维护的插件和合作方插件，很多插件里就打包了 Skills。Claude Code 默认已登记，一条 /plugin install 命令即可安装。"
checkedOn: 2026-10-10
sources:
  - https://github.com/anthropics/claude-plugins-official
  - https://code.claude.com/docs/en/plugins/anthropic-marketplaces
  - https://code.claude.com/docs/en/discover-plugins
  - https://code.claude.com/docs/en/skills
  - https://claude.com/marketplace/plugins
---

> 本文根据 Anthropic 官方 GitHub 仓库和 Claude Code 官方文档整理，资料核对于 2026-10-10。市场收录的插件变化很快，以 `/plugin` 面板和官方目录为准。

## 是什么

在 Claude Code 里，Skill 除了直接放进 `~/.claude/skills/`，更常见的分发方式是**插件**：一个插件可以同时打包技能、子智能体、斜杠命令、Hooks 和 MCP 服务器。**插件市场**就是一份插件清单（仓库里的 `.claude-plugin/marketplace.json`）。

claude-plugins-official 是 Anthropic 管理的官方市场。官方文档说明，Anthropic 一共公开了三个通用市场：官方市场（本仓库）、社区市场（anthropics/claude-plugins-community，市场名 `claude-community`）和演示市场（anthropics/claude-code，市场名 `claude-code-plugins`）；另外还有 anthropics/skills、anthropics/knowledge-work-plugins 这类专题市场。官方市场里大部分条目来自合作方和其他作者，Anthropic 自己维护其中较小的一部分。

截至 2026-10-10，GitHub 显示该仓库约 3.8 万 Star、4,200 Fork，最近一次推送在 2026-10-09；当天仓库的 marketplace.json 里登记了 315 个插件。

## 包含哪些 Skill

仓库分两个目录：`/plugins` 是 Anthropic 内部开发维护的插件，`/external_plugins` 是合作方和社区的第三方插件。按 2026-10-10 的清单：

- **Anthropic 自己维护的（约 39 个）**：`skill-creator`（写技能）、`frontend-design`（界面设计）、`code-review`、`pr-review-toolkit`（代码审查）、`feature-dev`（按流程开发功能）、`commit-commands`（提交、推送、开 PR）、`security-guidance`、`plugin-dev`、`mcp-server-dev`、`hookify`、`claude-md-management`，以及 TypeScript、Python、Go、Rust、Java 等十多个语言服务器（LSP）插件。
- **合作方插件**：GitHub、GitLab、Linear、Asana、Atlassian、Figma、Canva、Firebase、Cloudflare、Datadog、Grafana、ClickHouse、Databricks 等厂商把自家服务的技能和 MCP 连接打包成插件；也收录了 `huggingface-skills`、`mattpocock-skills` 这类技能包。
- 清单里按类别标注，数量最多的是开发（development）、效率（productivity）、数据库（database）、监控（monitoring）和安全（security）。

仓库 README 还说明了「技能包插件」的写法：源仓库只有 `SKILL.md`、没有插件清单时，市场条目可以直接列出技能目录，装好后每个技能以 `插件名:技能名` 注册。

## 怎么安装

官方市场不需要手动添加——Claude Code 第一次启动交互式会话时会自动登记。在会话里输入（README 原文）：

```text
/plugin install {plugin-name}@claude-plugins-official
```

例如官方文档的示例 `/plugin install commit-commands@claude-plugins-official`。这条命令不会立刻安装，而是打开插件详情面板，让你先看它会装哪些命令、技能、Hooks 和 MCP 服务器，再选择安装范围：只给自己（user）、给这个仓库的所有协作者（project）、或只在本仓库对自己生效（local）。

也可以直接输入 `/plugin`，在 **Discover** 标签页里搜索浏览；在网页上可以到 claude.com/marketplace/plugins 查看完整目录。桌面 App 在输入框旁的「+」→ Plugins 里添加，VS Code 里输入 `/plugins`。写脚本批量安装时用 shell 命令 `claude plugin install <name>@claude-plugins-official`。

社区市场需要先添加：`/plugin marketplace add anthropics/claude-plugins-community`，安装时后缀写 `@claude-community`。

## 怎么用

- **装完确认**：输入 `/`，在命令菜单里找 `/插件名:技能名`，例如装了 commit-commands 后会出现 `/commit-commands:commit`。
- **自动触发**：插件里的技能和普通技能一样，请求和技能描述匹配时 Claude 会自己加载；例如装了 `frontend-design` 后说「给这个后台做一个数据看板页面」。
- **管理**：`/plugin` 的 **Installed** 标签页可以启用、停用、更新、卸载；最近没用过的插件会单独列出，方便清理。

## 适合谁 / 不适合谁

**适合：**
- 用 Claude Code 写代码、想从官方渠道找插件和技能的开发者；
- 团队想统一一套插件（装到 project 范围，随仓库共享）；
- 想把 Claude Code 接到 GitHub、Linear、Figma 等常用服务的人。

**不适合：**
- 只用 claude.ai 聊天或 Cowork 的用户——那边有单独的插件目录，入口不同；
- 用 Codex、Cursor 等其他智能体的人——这是 Claude Code 的插件格式。

## 注意事项

- **「官方市场」不等于「官方出品」**：仓库 README 开头就提醒，安装、更新、使用插件前要确认信任它；Anthropic 不控制插件里包含的 MCP 服务器、文件和其他软件，也无法保证它们按预期工作或以后不变。
- **许可证**：仓库本身是 Apache-2.0，每个插件的许可证看它自己的 LICENSE。
- **插件能做的事比技能多**：可以运行 Hooks、启动 MCP 服务器，安装前认真看详情面板里的「Will install」。
- **上下文成本**：官方市场的插件详情会显示每轮对话和调用时大约占用多少 token，装太多会拖慢会话。
- **自动更新**：官方市场默认开启自动更新，社区和第三方市场默认关闭。
- **维护状态**：仓库活跃（最近推送 2026-10-09）；演示市场里的大部分插件在官方市场有同名版本，官方文档建议从官方市场安装，避免装两份。

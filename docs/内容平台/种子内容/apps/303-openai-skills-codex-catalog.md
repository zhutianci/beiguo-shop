---
title: "openai/skills 是什么、怎么安装：OpenAI 官方 Codex Skills 目录（已转向 openai/plugins）"
slug: openai-skills-codex-catalog
name: openai/skills（OpenAI 官方 Codex Skills）
url: https://github.com/openai/skills
pricing: 免费（各技能目录内 LICENSE.txt 各自声明）
platforms: Codex CLI / Codex IDE 扩展 / ChatGPT 桌面 App
trialNote: "`$skill-installer gh-address-comments`"
products: [codex, chatgpt]
models: [gpt]
topics: [agent-skills, coding, ai-agent]
excerpt: "openai/skills 是 OpenAI 官方的 Codex 技能目录，含系统技能、精选技能和实验技能，用 $skill-installer 安装。仓库现已标注弃用，官方把示例转到 openai/plugins，以插件形式分发技能。"
checkedOn: 2026-10-10
sources:
  - https://github.com/openai/skills
  - https://github.com/openai/plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://learn.chatgpt.com/docs/skills-and-plugins
  - https://learn.chatgpt.com/docs/plugins
  - https://agentskills.io/home
---

> 本文根据 OpenAI 官方 GitHub 仓库和 OpenAI 官方文档整理，资料核对于 2026-10-10。OpenAI 正在把技能的分发方式从这个仓库迁到插件，以官方文档为准。

## 是什么

openai/skills 是 OpenAI 为 Codex 建的官方技能目录（README 标题是 Skills Catalog for Codex）。Codex 用的技能格式和 Claude 一样，都是带 `SKILL.md` 的文件夹，遵循 agentskills.io 的开放标准，所以这里的技能结构对用过 Claude Skills 的人很熟悉。

**重要变化**：仓库 README 顶部现在标注「This repository is deprecated」（已弃用），说明当前的 Codex 技能和插件示例请看 **openai/plugins** 仓库；想把自己的技能加进 Codex，按官方的 Build plugins 指南做一个「只含技能的插件」。也就是说，这个仓库仍可浏览、其中的技能仍能安装，但不再是官方推荐的入口。

截至 2026-10-10，GitHub 显示 openai/skills 约 2.8 万 Star、1,900 Fork，最近一次推送在 2026-09-08；接替它的 openai/plugins 约 7,400 Star、960 Fork，最近一次推送在 2026-10-08。

## 包含哪些 Skill

仓库把技能分成三层：

- **`.system`**：随最新版 Codex 自动安装的系统技能（官方文档提到的 `skill-creator`、`plan` 等属于这一类）。
- **`.curated`**（精选，2026-10-10 时约 40 个）：
  - GitHub 协作：`gh-address-comments`（处理 PR 评审意见）、`gh-fix-ci`（修 CI）；
  - 部署：`vercel-deploy`、`netlify-deploy`、`render-deploy`、`cloudflare-deploy`；
  - 设计与协作工具：`figma` 系列（实现设计稿、生成设计系统规则等）、`notion` 系列（会议纪要、知识沉淀、规格到实现）、`linear`、`sentry`；
  - 测试与文件：`playwright`、`screenshot`、`pdf`、`jupyter-notebook`、`transcribe`、`speech`；
  - 安全：`security-best-practices`、`security-threat-model`、`security-ownership-map`；
  - 其他：`openai-docs`（查 OpenAI 官方文档）、`chatgpt-apps`、`migrate-to-codex` 等。
- **`.experimental`**：实验性技能，例如 README 举例的 `create-plan`。

openai/plugins 则按插件组织，README 重点列出 `figma`、`notion`、`build-ios-apps`、`build-macos-apps`、`build-web-apps`、`expo`、`netlify`、`remotion`、`google-slides` 等，每个插件可以同时带技能、MCP 配置和 Hooks。

## 怎么安装

**在 Codex 里用安装器**（命令来自 openai/skills 的 README）：

```text
$skill-installer gh-address-comments
```

精选技能按名称安装即可。实验技能要指明目录，或直接给 GitHub 目录地址：

```text
$skill-installer install the create-plan skill from the .experimental folder
$skill-installer install https://github.com/openai/skills/tree/main/skills/.experimental/create-plan
```

装完重启 Codex 才会识别新技能。

**手动放置**：OpenAI 官方文档写明 Codex 读取技能的位置——仓库内的 `.agents/skills`（从当前目录一直找到仓库根）、用户级的 `$HOME/.agents/skills`、管理员级的 `/etc/codex/skills`，以及 Codex 自带的系统技能。把技能文件夹放进去即可。

**现在更推荐的方式——插件**：ChatGPT 和 Codex 共用一个插件目录。在网页或 ChatGPT 桌面 App 打开 **Plugins** 标签页，搜索、查看详情后点加号安装；在 Codex CLI 里运行 `codex` 后输入 `/plugins` 打开插件浏览器。插件里的技能在装好后新开的对话或 CLI 会话里生效。

## 怎么用

- **显式调用**：在 Codex CLI 或 IDE 扩展里输入 `/skills` 查看，或输入 `$` 提及某个技能，例如 `$gh-fix-ci 看看这个 PR 的 CI 为什么挂了`；在 ChatGPT 里用 `@` 选择技能。
- **隐式调用**：请求和技能描述匹配时，Codex 会自己选用。
- **写自己的技能**：在 Codex 里输入 `$skill-creator`（ChatGPT 里是 `@skill-creator`），说明目标、步骤和输出格式，让它起草。
- **停用某个技能**：在 `~/.codex/config.toml` 里加一段 `[[skills.config]]`，写上该技能 `SKILL.md` 的路径和 `enabled = false`，然后重启 Codex。

## 适合谁 / 不适合谁

**适合：**
- 用 Codex 写代码、想装官方出品技能的开发者；
- 想参考 OpenAI 自己怎么写技能、怎么把技能打包成插件的作者；
- 团队里同时用 Claude Code 和 Codex、想比较两边技能生态的人。

**不适合：**
- 想找一个持续更新的技能大全的人——这个仓库已弃用，新内容在插件目录；
- ChatGPT 个人账号想在网页里单独上传技能的用户——可用范围取决于套餐和工作区设置，见本站教程《ChatGPT Skills 怎么用》。

## 注意事项

- **许可证**：仓库根目录没有统一的 LICENSE 文件；README 写明每个技能的许可证在各自目录的 `LICENSE.txt` 里。openai/plugins 根目录同样没有 LICENSE 文件。
- **维护状态**：openai/skills 已标注弃用（最近推送 2026-09-08），后续更新看 openai/plugins 和官方插件目录。
- **目录路径**：很多第三方教程和旧 README 仍写 `~/.codex/skills`，OpenAI 官方文档当前写的用户级目录是 `~/.agents/skills`，以官方文档为准。
- **安全与权限**：官方文档说明，插件能力在 Codex 里运行时受所在环境的沙箱和审批策略约束；插件带的 MCP 服务器连接外部服务时，适用对方的条款和隐私政策。第三方技能安装前同样要读一遍 `SKILL.md` 和脚本。
- 用 API Key 登录 Codex 时，部分需要 OAuth 的插件不可用。

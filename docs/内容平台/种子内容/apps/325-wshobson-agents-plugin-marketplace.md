---
title: "wshobson/agents 是什么、怎么安装：94 个插件、184 个 Skills 的多工具插件市场"
slug: wshobson-agents-plugin-marketplace
name: wshobson/agents（claude-code-workflows 插件市场）
url: https://github.com/wshobson/agents
pricing: 开源免费（MIT，外部插件另有许可证）
platforms: Claude Code / Codex CLI / Cursor / OpenCode / Antigravity CLI / GitHub Copilot / Pi
trialNote: "`/plugin marketplace add wshobson/agents` 然后 `/plugin install python-development@claude-code-workflows`"
products: [claude, codex]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "wshobson/agents 是 Seth Hobson 维护的插件市场：94 个插件，内含 202 个子智能体、184 个 Skills 和 105 个命令，覆盖 Python、JS/TS、代码评审、测试、基础设施、安全等，可按需单装，支持 Claude Code、Codex、Cursor 等七种工具。"
checkedOn: 2026-10-10
sources:
  - https://github.com/wshobson/agents
  - https://code.claude.com/docs/en/discover-plugins
  - https://github.com/vercel-labs/skills
---

> 本文根据 wshobson/agents 仓库 README 和 Claude Code 官方文档整理，资料核对于 2026-10-10。插件数量持续变化，以仓库的插件目录为准。

## 是什么

wshobson/agents 是 Seth Hobson 维护的一个第三方插件市场，在 Claude Code 里登记后的市场名叫 `claude-code-workflows`。仓库名叫 agents，但内容早已不只是子智能体。现在的形态是：按工作领域切分成几十个**插件**，每个插件把相关的子智能体、技能和命令放在一起，用哪个装哪个，不必把几百个组件一次塞进上下文。

仓库用一份 Markdown 源（Claude Code 插件格式）维护全部内容，再通过适配器生成各工具需要的格式，所以同一批组件能用在 Claude Code、OpenAI Codex CLI、Cursor、OpenCode、Antigravity CLI、GitHub Copilot 和 Pi 上；README 说明各工具能用到的组件和能力并不相同。

截至 2026-10-10，GitHub 显示该仓库约 4.0 万 Star、4,300 Fork，最近一次推送在 2026-10-05。

## 包含哪些 Skill

README 给出的规模：94 个插件（92 个本地插件 + 2 个外部条目），本地源里有 202 个子智能体、184 个技能、105 个命令。README 推荐先从这几个插件入手：

- **python-development**：Python、Django、FastAPI、测试和打包——内含 3 个子智能体、16 个技能和一个脚手架命令；
- **javascript-typescript**：JS / TS 开发与项目搭建；
- **developer-essentials**：代码评审、调试、Git 和测试模式；
- **security-scanning**：安全评审、依赖检查和代码扫描。

其余插件覆盖基础设施、数据、文档、运维等方向，完整清单在仓库的 docs/plugins.md。技能的命名一般直接说明用途，例如 README 示例里的 `python-testing-patterns`。仓库还带一个 `plugin-eval` 插件，可以不调用模型对技能做静态质量检查。

## 怎么安装

命令均来自 README。

**Claude Code**（在会话里输入）：

```text
/plugin marketplace add wshobson/agents
/plugin install python-development@claude-code-workflows
```

**Codex CLI**（终端里运行，需要较新的 Codex CLI）：

```bash
codex plugin marketplace add wshobson/agents
codex plugin add python-development@claude-code-workflows
```

**只要某一个技能**（不带插件里的子智能体、命令和 Hooks）：

```bash
gh skill install wshobson/agents python-testing-patterns
npx skills add wshobson/agents --skill python-testing-patterns
```

前者需要 GitHub CLI 2.90 以上，后者需要 Node.js，安装时按提示选择你的工具。

**OpenCode / Antigravity CLI / GitHub Copilot / Pi**：克隆仓库后运行对应的 `make install-opencode`、`make install-antigravity`、`make install-copilot`、`make install-pi`，需要先装 uv 和 Python 3.12 以上。Cursor 用仓库自带的插件市场登记文件，步骤见仓库 docs/harnesses.md。README 没有提供 claude.ai 网页版的安装方式。

## 怎么用

- **用命令起步**：装了 python-development 后输入 `/python-development:python-scaffold Create a FastAPI service with tests`（README 示例），它会搭好项目骨架并带上测试。
- **让它用对应的子智能体**：直接说「用 Python 的子智能体帮我重构这个模块并补测试」，Claude 会把任务委派给插件里的专家子智能体；相关技能在匹配时自动加载。
- **逐步加装**：先只装一两个和当前技术栈对应的插件，用顺了再加安全扫描、基础设施等；不用的插件在 `/plugin` 的 Installed 标签页停用。

## 适合谁 / 不适合谁

**适合：**
- 想按技术栈挑选现成子智能体和技能的开发者；
- 在多种编程工具之间切换、希望用同一套组件的人；
- 想参考「一份源、多工具适配」怎么做的插件作者。

**不适合：**
- 想要一套有明确先后顺序的开发流程的人——这里是按领域分的工具箱，不是方法论；
- 只用 claude.ai 网页版的用户；
- 希望每个技能都经过严格验证的人：数量大，质量参差在所难免。

## 注意事项

- **许可证**：仓库 MIT；外部插件有各自的许可证。
- **维护状态**：活跃（最近推送 2026-10-05）。
- **评测分数别当真**：README 自己说明，`plugin-eval` 里基于模型打分和模拟的部分是实验性的，没有和人工标注对照过，不能证明任务在你的项目里一定成功；启用这部分还会消耗你的 API 额度或 Claude Code 用量。
- **外部条目**：市场里有 2 个外部插件，其中记忆类的 Pensyve 由仓库维护者创办的公司开发，README 写明其云服务已于 2026-10-01 关闭，只能自托管。
- **安全**：插件可能带 Hooks 和 MCP 配置，子智能体也有各自的工具权限。第三方市场默认不自动更新，安装前在详情面板看清组件；只需要技能时用「只装技能」的方式更省心。
- **模型映射**：子智能体里写的是 `opus`、`sonnet`、`haiku` 这类别名，在其他工具上由适配器映射到对应模型，效果和成本会有差异。

---
title: "Graphify 是什么、怎么安装使用：把代码库变成可查询知识图谱的 /graphify Skill（Claude Code / Cursor / Codex）"
slug: graphify-knowledge-graph-skill
name: Graphify（Graphify-Labs/graphify）
url: https://github.com/Graphify-Labs/graphify
pricing: 开源免费（Apache-2.0）；官方另有付费平台与企业版
platforms: Claude Code / Cursor / Codex / Gemini CLI / GitHub Copilot / OpenCode / Trae / Kimi Code 等
trialNote: "uv tool install graphifyy"
products: [claude, cursor]
models: [any-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "Graphify 把整个项目（代码、文档、PDF、图片、音视频）解析成一张知识图谱：代码用 tree-sitter 在本地解析，不调用大模型；之后让智能体查图而不是逐个文件搜索。输入 /graphify . 即可生成交互图、报告和 graph.json。"
checkedOn: 2026-10-10
sources:
  - https://github.com/Graphify-Labs/graphify
  - https://docs.graphify.com
  - https://pypi.org/project/graphifyy/
  - https://code.claude.com/docs/en/skills
  - https://agentskills.io/home
---

> 本文根据 Graphify-Labs/graphify 仓库 README、官方文档站 docs.graphify.com 与 Claude Code 官方文档整理，资料核对于 2026-10-10。支持的平台和命令更新频繁，以仓库 README 为准。

## 是什么

Graphify 是一个把项目「画成图」的工具，由一个 Python 命令行程序和一个 `/graphify` 技能组成。智能体了解陌生代码库的常规做法是反复搜索、逐个读文件，既慢又费上下文。Graphify 的思路是先把整个项目解析成一张知识图谱——函数、类、模块、文档里的概念是节点，调用、导入、继承、引用是边——之后有问题就查图：这两个东西之间怎么连起来的、某个概念牵涉哪些文件、哪些节点是所有流程都要经过的枢纽。

README 强调三点：代码部分用 tree-sitter 语法树在本地确定性解析，不经过大模型，内容不离开本机；每条边都标注是从源码里直接读到的（`EXTRACTED`）还是推断出来的（`INFERRED`）；它不是向量索引，没有嵌入和向量库，是一张真正可以遍历的图。

截至 2026-10-10，GitHub 显示该仓库约 12.5 万 Star、1.2 万 Fork，最近一次推送在 2026-10-10。仓库提供简体中文版 README。

## 包含哪些 Skill

核心是一个技能 `graphify`（Codex 里写作 `$graphify`），配合同名命令行工具。跑一次会在 `graphify-out/` 下生成三个文件：

- `graph.html`：可在浏览器里点击、筛选、搜索的交互图；
- `GRAPH_REPORT.md`：要点报告——连接最多的「枢纽节点」、跨模块的意外关联、代码注释和设计文档里的「为什么」、建议你问的几个问题；
- `graph.json`：完整图数据，之后随时查询，不用重读文件。

README 列出的能力还有：

- **社区划分**：把图自动分成若干子系统；
- **跨文件关系**：调用、导入、继承等关系，覆盖约 40 种语言；
- **查询、路径、解释**：`query` 提问，`path` 找两个节点之间的路径，`explain` 解释一个概念；
- **代码以外的资料**：文档、PDF、图片、音视频也能并入同一张图（这部分需要模型参与）；
- **增量与自动更新**：只重新解析改动的文件，或装 Git 钩子在提交后自动重建；
- **MCP 服务器**：把图暴露为 MCP 服务，供智能体反复调用。

## 怎么安装

前置条件：Python 3.10 及以上，README 推荐用 `uv`。

```bash
uv tool install graphifyy      # install the CLI (or: pipx install graphifyy)
graphify install               # register the skill with your AI assistant
```

注意 PyPI 上的官方包名是 **`graphifyy`（两个 y）**，README 特别声明其他 `graphify*` 包与项目无关；装好后的命令仍然叫 `graphify`。

`graphify install` 默认面向 Claude Code。其他工具用对应参数，例如 `graphify install --platform codex`、`graphify install --platform gemini`、`graphify cursor install`、`graphify install --platform trae-cn`；想装到通用的 `~/.agents/skills/` 用 `graphify install --platform agents`。加 `--project` 则只装到当前仓库（如 `.claude/skills/graphify/SKILL.md`）。

README 建议在 Mac 和 Windows 上尽量不要用普通的 `pip install`，容易出现找不到模块的环境问题。

## 怎么用

在智能体里输入：

```text
/graphify .
```

为当前目录建图。在 PowerShell 里直接运行命令行时写 `graphify .`，不要带开头的斜杠。建好之后常用的有：

- `/graphify query "what connects auth to the database?"` 提问；
- `/graphify path "UserService" "DatabasePool"` 找两者之间的路径；
- `/graphify explain "RateLimiter"` 解释一个概念；
- `/graphify ./docs --update` 只重新处理有改动的文件；
- `/graphify . --wiki` 从图生成一套 Markdown 维基。

想让智能体以后默认先查图再读文件，在项目里运行一次对应平台的命令（Claude Code 是 `graphify claude install`，Codex 是 `graphify codex install`）。不想被索引的文件写进 `.graphifyignore`。

## 适合谁 / 不适合谁

**适合：**
- 接手大型或陌生代码库，需要快速摸清模块关系的开发者；
- 觉得智能体在大仓库里反复搜索太耗上下文的重度用户；
- 想把代码、设计文档、论文放在一起建立关联的团队。

**不适合：**
- 几百行的小项目——直接读文件更快；
- 不想在本机安装 Python 工具的用户；
- 需要百分之百精确调用关系的场合——推断出的边带有不确定性，README 也为此做了标注，重要结论要回到源码确认。

## 注意事项

- **许可证**：仓库 LICENSE 为 Apache-2.0。官方另有付费的 graphify 平台和企业版，与这个开源工具是两回事。
- **维护状态**：更新非常活跃，最近一次推送 2026-10-10。
- **安全提醒**：这不只是一份说明文件——它会在本机安装并运行 Python 程序，往项目里写 `graphify-out/` 和技能文件；让智能体「始终使用图」的安装步骤会写入各平台的指令文件，在 Claude Code 等平台上还会装 **hook**（严格模式下会拦截会话里第一次直接读源码的操作）；`graphify hook install` 会装 Git 钩子；另可启动 **MCP 服务器**或对团队开放的 HTTP 服务。逐项确认自己需要再开启，并通读 `SKILL.md`。
- **哪些数据会离开本机**：代码解析和音视频转写在本地完成；文档、PDF、图片的语义提取会发给你当前会话所用的模型，或者在无头模式下按已配置的 API Key 发给对应服务商。README 提醒有数据驻留要求时显式指定后端，例如用本地的 Ollama。README 称项目没有遥测，但查询记录会写入本机的 `~/.cache/graphify-queries.log`，可用 `GRAPHIFY_QUERY_LOG_DISABLE=1` 关闭。
- **兼容性**：Codex 要并行提取需在 `~/.codex/config.toml` 的 `[features]` 下设置 `multi_agent = true`；部分语言和文件类型需要安装额外的可选依赖。
- `graphify-out/` 是否提交进仓库由团队自己决定，README 的团队协作一节有建议做法。

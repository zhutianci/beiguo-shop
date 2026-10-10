---
title: "agents-cli 是什么、怎么安装使用：Google 官方的智能体开发 CLI 与 7 个 Skills（用 ADK 搭建、评测、部署 Agent）"
slug: google-agents-cli-adk-skills
name: agents-cli（google/agents-cli）
url: https://github.com/google/agents-cli
pricing: "开源免费（Apache-2.0）；部署到 Google Cloud 的资源按其计费"
platforms: "Antigravity CLI / Claude Code / Codex 等编程智能体；需 Python 3.11+、uv、Node.js"
trialNote: "npx skills add google/agents-cli（只装技能；连同 CLI 一起装见正文）"
products: [gemini, claude]
models: [gemini-llm]
topics: [agent-skills, coding, ai-agent]
excerpt: "agents-cli 是 Google 开源的命令行工具和 7 个配套 Agent Skills：让 Claude Code、Codex、Antigravity 等编程智能体学会用 ADK 搭建智能体项目、做评测、部署到 Google Cloud 并注册到 Gemini Enterprise。"
checkedOn: 2026-10-11
sources:
  - https://github.com/google/agents-cli
  - https://skills.sh/
  - https://adk.dev/
  - https://github.com/vercel-labs/skills
---

> 本文根据 google/agents-cli 仓库 README 整理，资料核对于 2026-10-11。截至当日，GitHub 显示该仓库约 6068 Star、692 Fork，最近一次推送在 2026-10-06；skills.sh 榜单上它的 7 个技能累计安装各约 48.6 万次（含整库安装的计数）。命令与技能以仓库为准。

## 是什么

agents-cli 的全称是「Agents CLI in Agent Platform」，README 的一句话介绍是：用于在 Gemini Enterprise Agent Platform 上构建智能体的 CLI 和技能。它的定位写在常见问题里——它不是 Claude Code、Codex 的替代品，而是**给编程智能体用的工具**：提供命令和技能，让你的编程智能体更擅长在 Google Cloud 上构建、评测和部署基于 ADK 的智能体。ADK 是 Google 的智能体开发框架，agents-cli 则把「从建项目到上线」这一整条线交给编程智能体来操作。

README 还回答了一个常被问到的问题：需不需要 Google Cloud？本地开发（创建、运行、评测）不需要，用 AI Studio 的 API Key 就能在本地跑 Gemini；部署和云端功能才需要。

## 包含哪些 Skill

README 列出 7 个技能：

- `google-agents-cli-workflow`：开发生命周期、代码保护规则、模型选择；
- `google-agents-cli-adk-code`：ADK 的 Python 接口——智能体、工具、编排、回调、状态；
- `google-agents-cli-scaffold`：项目脚手架，对应 `create`、`enhance`、`upgrade`；
- `google-agents-cli-eval`：评测方法——指标、数据集、用大模型当评委、自适应评分标准；
- `google-agents-cli-deploy`：部署——Agent Runtime、Cloud Run、GKE、CI/CD、密钥管理；
- `google-agents-cli-publish`：注册到 Gemini Enterprise；
- `google-agents-cli-observability`：可观测性——Cloud Trace、日志和第三方集成。

对应的主要命令有 `agents-cli create <名称>`（新建项目）、`agents-cli eval run`（在评测集上运行并打分）、`agents-cli deploy`（部署到 Google Cloud）、`agents-cli publish gemini-enterprise`、`agents-cli login`（用 Google Cloud 或 AI Studio 认证），以及给已有项目补上部署和 CI/CD 的 `agents-cli scaffold enhance`。

## 怎么安装

前置条件是 Python 3.11 以上、uv 和 Node.js。README 给了两种装法。

只装技能，其余让编程智能体自己处理：

```bash
npx skills add google/agents-cli
```

连同命令行一起装：README 的写法是用 uv 的一次性运行器（uvx）执行 PyPI 包 `google-agents-cli` 的 `setup` 子命令，等价的完整写法是：

```bash
uv tool run google-agents-cli setup
```

它会把 CLI 和技能一起装进你的编程智能体。

## 怎么用

装好后打开你常用的编程智能体，直接提需求：

- README 的示例：「用 agents-cli 做一个把啰嗦文字压缩成简短技术短句的智能体」；
- 「给这个智能体写一组评测用例，跑一遍并告诉我哪些没过」；
- 「给现有的 ADK 项目加上部署到 Cloud Run 的配置和 CI」。

不用编程智能体也可以：CLI 本身能独立使用，所有命令都可以在终端里直接运行。

## 适合谁 / 不适合谁

**适合：**
- 打算用 Google 的 ADK 和 Gemini 做智能体的开发者；
- 已经在 Google Cloud 上、想把评测和部署流程标准化的团队。

**不适合：**
- 用其他框架（如 LangGraph、CrewAI）或不打算上 Google Cloud 的项目；
- 只想找通用编程技能的人，这套技能的内容全部围绕 Google 的技术栈。

## 注意事项

- **许可**：GitHub 标注 Apache-2.0；仓库另有服务条款一节。
- **遥测**：README 说明默认每次命令调用会发出一条使用信号，写入你自己的 Google Cloud 项目的日志，只记录命令名、退出码、错误类别、耗时、版本和操作系统等元数据，不含文件内容和参数；写日志的请求头里还带有供 Google 做使用分析的版本、系统和命令名信息。README 提供了关闭它的环境变量。
- **费用**：部署会在你的 Google Cloud 账号下创建计费资源，模型调用按 Gemini 的价格计费。
- **凭据**：登录用的是你的 Google Cloud 或 AI Studio 身份；部署技能的内容涵盖密钥管理，API Key 不要写进仓库。
- 国内网络访问 Google 服务受限，使用前确认网络与账号条件。

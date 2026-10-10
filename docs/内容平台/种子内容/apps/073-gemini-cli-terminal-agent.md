---
title: "Gemini CLI 安装与使用教程：现在还能免费用吗、怎么迁移"
slug: gemini-cli-terminal-agent
name: Gemini CLI
url: https://geminicli.com/
pricing: 开源免费，模型调用需付费 API Key 或企业许可
platforms: 命令行（Windows / macOS / Linux）
products: [gemini]
models: [gemini-llm]
topics: [coding]
excerpt: "Gemini CLI 是 Google 开源的终端 AI 编程智能体。2026-06-18 起个人免费档已换成 Antigravity CLI，目前主要面向付费 API Key 和企业用户。"
checkedOn: 2026-10-07
sources:
  - https://github.com/google-gemini/gemini-cli
  - https://geminicli.com/docs/
  - https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
  - https://antigravity.google/blog/introducing-google-antigravity-cli/
---

> 本文根据 Gemini CLI 官方 GitHub 仓库、官方文档站、Google 开发者博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Gemini CLI 是 **Google** 推出的开源命令行 AI 智能体，采用 Apache 2.0 许可证，代码托管在 GitHub 的 google-gemini/gemini-cli 仓库。它把 Gemini 模型带进终端：读代码、改文件、执行 shell 命令、联网搜索，都在命令行里完成。

需要特别说明它的**现状**：2026 年 5 月 19 日，Google 宣布把面向个人用户的终端智能体统一到 Antigravity CLI。官方文档站横幅写明：免费档和 Google One（含 Google AI Pro / Ultra）用户的 Gemini CLI 已于 **2026 年 6 月 18 日**被 Antigravity CLI 取代。此后 Gemini CLI 仍面向两类用户继续服务：使用 **付费 Gemini API Key**（含 Gemini Enterprise Agent Platform）的开发者，以及通过 **Gemini Code Assist 标准版 / 企业版** 许可使用的组织。

![Gemini CLI 终端界面：用自然语言让它创建 hello.py 并显示写文件操作](seed:a073-gemini-cli-terminal.jpg)
*图片来源：[Gemini CLI 官方 GitHub 仓库 README](https://github.com/google-gemini/gemini-cli)*

## 能做什么

- **理解和修改代码库**：在项目目录里直接问「这个模块做什么」「帮我修这个报错」，它会读取文件并给出修改。
- **内置工具**：文件读写、执行 shell 命令、网页抓取、Google 搜索增强（grounding），不用自己拼脚本。
- **MCP 扩展**：通过 Model Context Protocol 接入自定义工具和服务，也支持扩展（Extensions）、Hooks、子智能体等能力。
- **项目记忆文件**：在项目里放 `GEMINI.md` 写清约定和背景，每次会话都会读取。
- **会话检查点**：可保存和恢复对话进度，长任务中断后不用从头再来。
- **接入 GitHub 工作流**：官方提供 GitHub Action，可在 Issue 和 PR 里调用。

## 怎么上手

1. 准备 Node.js 环境，执行 `npm install -g @google/gemini-cli` 安装；macOS / Linux 也可用 `brew install gemini-cli`，或用 `npx @google/gemini-cli` 免安装试跑。
2. 在终端进入项目目录，输入 `gemini` 启动。
3. 选择认证方式：个人开发者现在应使用**付费 Gemini API Key**（在 Google AI Studio 创建并开启结算）；企业用户使用组织提供的 Gemini Code Assist 许可或 Vertex AI。
4. 先让它熟悉项目：「读一下这个仓库，告诉我怎么在本地跑起来」。
5. 在项目根目录写一个 `GEMINI.md`，列出代码风格和禁止事项。

如果你是免费档或 Google AI Pro / Ultra 个人用户，官方建议改用 **Antigravity CLI**，并提供了把技能、MCP 服务器等配置迁移过去的指南。

## 免费与付费

- **工具本身**：开源免费。
- **模型调用**：2026-06-18 之后，个人免费登录档已停止服务；通过付费 API Key 调用时按 Gemini API 的用量计费，具体单价以 Google AI 官方定价页为准。
- **企业**：持有 Gemini Code Assist 标准版 / 企业版许可的组织，官方表示访问不受影响，并继续获得更新和新模型。

注意：GitHub 仓库 README 里仍保留「个人账号每天 1,000 次免费请求」的旧说明，与官方博客和文档站的最新公告不一致，应以公告为准。

## 适合谁 / 不适合谁

适合：
- 已有付费 Gemini API Key、想在终端里调用 Gemini 做编程的开发者。
- 企业里已采购 Gemini Code Assist、需要沿用现有流程的团队。
- 想研究或二次开发开源终端智能体代码的人。

不适合：
- 想零成本使用的个人用户：免费通道已关闭，建议看 Antigravity CLI。
- 不熟悉命令行的新手，图形界面工具会更友好。

## 注意事项

- **地区限制**：Gemini API 与 Google AI Studio 官方支持的国家和地区列表中不包括中国大陆和香港，相关服务受同样限制。
- **命令执行风险**：它可以执行 shell 命令和改文件，建议在 Git 仓库里使用、开启沙箱，并在确认前看清要执行的命令。
- **产品还在调整**：Google 已把个人用户的重心放到 Antigravity，Gemini CLI 后续路线以官方公告为准。
- **核对输出**：AI 生成的代码和命令都需要人工检查和测试后再上线。

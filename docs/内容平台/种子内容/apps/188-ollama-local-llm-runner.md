---
title: "Ollama 是什么、怎么用：本地运行大模型的安装与入门（含 Cloud 与 Pro）"
slug: ollama-local-llm-runner
name: Ollama
url: https://ollama.com/
pricing: 本地运行免费，云端模型有免费额度+付费
platforms: Windows / macOS / Linux / 命令行 / API / Docker
trialNote: 本地运行模型不限量免费；免费账号含少量云端模型起步额度
products: [ai-tools]
models: []
topics: [coding]
excerpt: "Ollama 是开源的本地大模型运行工具，一条命令下载并运行 Gemma、Qwen、DeepSeek 等开源模型，提供本地 API，也能一键接入 Claude Code、Codex 等编程工具。"
checkedOn: 2026-10-07
sources:
  - https://ollama.com/
  - https://github.com/ollama/ollama
  - https://ollama.com/download
  - https://ollama.com/pricing
  - https://docs.ollama.com/
---

> 本文根据 Ollama 官网、官方 GitHub 仓库、官方文档与定价页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Ollama 是一个**在自己电脑上运行开源大模型**的工具，代码在 GitHub 开源。它把下载模型、加载到显卡 / 内存、提供对话和 API 这些繁琐步骤打包成一条命令，比如 `ollama run gemma4` 就能下载并开始和 Gemma 4 对话。

它支持 macOS、Windows、Linux，也有官方 Docker 镜像。本地运行时模型和数据都在你自己的电脑上，断网也能用。近一年 Ollama 增加了**云端模型**（模型名带 `:cloud` 后缀）：电脑跑不动的大模型可以放到 Ollama 的服务器上跑，使用方式和本地一致；同时推出了桌面应用和 Pro / Max 等付费方案。

## 能做什么

- **一条命令跑模型**：`ollama run 模型名` 自动下载并进入对话；官方模型库收录了编程、视觉、嵌入、推理等各类开源模型。
- **本地 REST API**：启动后在 `localhost:11434` 提供接口，兼容 OpenAI 和 Anthropic 的客户端库，自己的程序可以直接调用本地模型。
- **接入编程工具**：用 `ollama launch claude`、`ollama launch codex` 等命令，把本地或云端模型接入 Claude Code、Codex、Copilot CLI、OpenCode 等编程智能体。
- **云端模型**：本机配置不够时调用云端大模型，免下载、速度更快。
- **Python / JavaScript 库**：官方提供 `ollama-python`、`ollama-js`，几行代码集成到应用。
- **被其他软件当后端**：很多桌面客户端、知识库工具、IDE 插件（如 JetBrains AI）都支持连接 Ollama 作为本地模型来源。

## 怎么上手

1. 打开 ollama.com/download 下载安装包；也可以用命令安装——macOS / Linux：`curl -fsSL https://ollama.com/install.sh | sh`，Windows PowerShell：`irm https://ollama.com/install.ps1 | iex`。
2. 打开终端输入 `ollama`，按提示选择运行一个模型，或连接到你已有的编程工具。
3. 第一次建议从小模型开始，例如输入 `ollama run gemma4`，等待下载完成后直接对话。
4. 想在程序里调用，用 curl 向 `http://localhost:11434/api/chat` 发请求，或安装 Python 库 `pip install ollama`。
5. 需要更大的模型时，注册 Ollama 账号后可试用云端模型。

可以这样开始：模型下载好后输入「用三句话解释什么是向量数据库，再举一个使用场景」，感受本地模型的速度和质量。

## 免费与付费

官网定价页列出（官网定价页，2026-10 查询）：

| 方案 | 价格 | 主要内容 |
|---|---|---|
| Free | 0 | 本地运行不限量；含云端模型起步额度，可按量加购 |
| Pro | 20 美元/月（或 200 美元/年） | 每月 60 美元用量额度，更大的云端模型，最多 3 个模型并发 |
| Max | 100 美元/月 | 每月 300 美元用量额度，新模型抢先用，更高并发 |
| Team | 500 美元/月（早期开放） | 不限成员，每月 1,000 美元共享额度，集中计费 |

另有企业方案，价格定制。**无论哪个方案，本地运行模型都免费、不限量**，付费只针对云端模型用量。

## 适合谁 / 不适合谁

适合：
- 想在本地离线跑开源模型、数据不出电脑的开发者和隐私敏感用户。
- 需要给自己的程序、编程工具接一个免费本地模型后端的人。
- 想低成本体验多种开源模型、做对比测试的学习者。

不适合：
- 电脑配置较低（内存小、没有独立显卡）又想跑大模型的用户，本地速度会很慢，只能选小模型或用云端。
- 不习惯命令行的用户，图形界面更友好的可以看 LM Studio 这类桌面软件。
- 追求 GPT、Claude 等闭源旗舰模型效果的场景，开源模型能力有差距。

## 注意事项

- **硬件要求**：能跑多大的模型取决于显存和内存，具体看官方 GPU 与硬件文档；模型文件动辄数 GB 到数十 GB，注意磁盘空间。
- **云端隐私**：官网定价页说明云端模型的提示词和回复不会被记录或用于训练，模型主要托管在美国，容量紧张时可能路由到欧洲和新加坡。
- **本地接口安全**：默认只监听本机；如果改成对局域网或公网开放 11434 端口，务必加访问控制，避免被他人滥用。
- **模型许可证**：各开源模型许可证不同，商用前到模型页核对。

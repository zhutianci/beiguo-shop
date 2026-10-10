---
title: "Jan AI 是什么、怎么用：开源、可离线运行的本地大模型桌面应用"
slug: jan-open-source-local-chatgpt
name: Jan
url: https://www.jan.ai/
pricing: 免费开源（Apache-2.0）
platforms: Windows / macOS / Linux
trialNote: 完全免费；连接云端模型时按对应厂商计费
products: [ai-tools]
models: []
topics: [coding, office]
excerpt: "Jan 是 Apache-2.0 许可的开源桌面应用，可在电脑上离线运行 Llama、Gemma、Qwen 等开源模型，也能连接 OpenAI、Anthropic 等云端服务，并提供兼容 OpenAI 的本地接口和 MCP 支持。"
checkedOn: 2026-10-11
sources:
  - https://www.jan.ai/
  - https://github.com/janhq/jan
---

> 本文根据 Jan 官网与官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Jan 是一款开源的桌面 AI 应用，官网把它定位成「开源的 ChatGPT 替代品」，口号是「运行任何模型，按你的方式」。项目由 Menlo Research 开发，仓库 janhq/jan 约有 4.49 万星标，采用 Apache-2.0 许可；官网称累计下载超过 600 万次。

它的核心卖点是**可以完全离线**：模型下载到本机后，断网也能对话，内容不离开电脑。

## 能做什么

- **本地模型**：从 Hugging Face 下载并运行 Llama、Gemma、Qwen、GPT-oss 等开源模型，底层基于 llama.cpp。
- **云端模型**：也可以填密钥连接 OpenAI、Anthropic、Mistral、Groq、MiniMax 等服务商，本地与云端在同一个界面切换。
- **自定义助手**：为不同用途设置不同的指令和参数。
- **本地 API 服务**：在 `localhost:1337` 提供兼容 OpenAI 的接口，其他程序可以把 Jan 当作本地模型后端。
- **MCP**：支持 Model Context Protocol，让模型调用外部工具。

官网还展示了 Jan Agent 等产品方向，以及标注为「即将推出」的跨对话记忆功能。

## 怎么上手

1. 在 jan.ai 或 GitHub Releases 下载安装包。系统要求：Windows 10 及以上、macOS 13.6 及以上，或 Linux；也可以从 Microsoft Store、Flathub 安装。
2. 打开后进入模型库（Hub），挑一个与电脑内存相称的模型下载。
3. 下载完成后新建对话，选择该模型即可开始。
4. 想给其他程序用，在设置里启动本地 API 服务。

README 给出的内存参考（macOS）：运行 3B 参数量的模型建议 8GB 内存，7B 建议 16GB，13B 建议 32GB。

## 免费与付费

Jan 本身免费、开源，没有订阅。成本只有两种：本地运行时的硬件和电费；连接云端模型时由对应厂商按量收取的 API 费用。

## 适合谁 / 不适合谁

**适合：**
- 看重隐私、希望对话内容留在本机的用户；
- 想体验开源模型、又更喜欢图形界面而不是命令行的人；
- 需要一个本地的、兼容 OpenAI 接口的模型服务来做开发测试的开发者。

**不适合：**
- 电脑配置较低（8GB 以下内存）的用户，本地模型体验会比较吃力；
- 追求顶级闭源模型效果、又不想自己申请 API Key 的人；
- 需要知识库、多用户协作等更重功能的团队，可以对比 AnythingLLM、Open WebUI。

## 注意事项

- **和 Ollama、LM Studio 的区别**：三者都能在本地跑模型。Ollama 以命令行和后台服务为主；LM Studio 是功能细致的桌面软件；Jan 则是 Apache-2.0 许可的开源图形界面应用。
- **模型许可证各不相同**：Jan 开源不代表模型可以随意商用，下载前看模型页的许可说明。
- **磁盘空间**：单个模型文件通常为数 GB，多下几个就会占满硬盘。
- **本地接口别暴露到公网**：默认只在本机使用，对外开放前要加访问控制。

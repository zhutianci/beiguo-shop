---
title: "LM Studio 是什么、怎么用：本地大模型桌面软件教程（和 Ollama 的区别）"
slug: lm-studio-local-llm-app
name: LM Studio
url: https://lmstudio.ai/
pricing: 免费（家用和工作均可）；Bionic 云端模型付费
platforms: Windows / macOS / Linux / 命令行 / API
trialNote: LM Studio 桌面应用免费，2025 年 7 月起工作场景使用也无需单独授权
products: [ai-tools]
models: []
topics: [coding]
excerpt: "LM Studio 是图形界面的本地大模型软件，可搜索下载 Hugging Face 上的开源模型、离线聊天和问文档，并提供 OpenAI 兼容的本地 API，适合不想敲命令的用户。"
checkedOn: 2026-10-07
sources:
  - https://lmstudio.ai/
  - https://lmstudio.ai/docs/app
  - https://lmstudio.ai/docs/app/system-requirements
  - https://lmstudio.ai/blog/free-for-work
  - https://lmstudio.ai/blog/introducing-lm-studio-bionic
  - https://lmstudio.ai/pricing
---

> 本文根据 LM Studio 官网、官方文档（应用介绍、系统要求）、官方博客与定价页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

LM Studio 是一款**在自己电脑上运行开源大模型的桌面软件**。和偏命令行的 Ollama 相比，它的最大特点是图形界面完整：在软件里搜索模型、点击下载、选中加载、开始聊天，全程不用敲命令。底层在各平台使用 llama.cpp，在 Apple Silicon Mac 上还支持苹果的 MLX 框架。

官网下载页目前提供三款软件：

- **LM Studio**：经典桌面应用，聊天界面 + 可编程 API（写作本文时最新版本为 0.4.25）；
- **LM Studio Bionic**：2026 年 7 月 16 日发布的**独立新应用**，定位为「为开源模型打造的 AI 智能体」，可以写代码、处理文档和表格，本地模型和美国托管的开源云端模型都能用；官方说明 Bionic 与 LM Studio 是两个应用，可以同时使用；
- **llmster**：无界面的后台服务版，适合服务器、云主机和 CI。

## 能做什么

- **搜索下载开源模型**：内置 Hugging Face 模型搜索，可下载 Qwen、DeepSeek、Gemma、Llama 等模型的不同量化版本。
- **离线聊天**：模型加载后完全在本机运行，可断网使用。
- **和文档对话**：在聊天中附加文档，进行离线 RAG 问答。
- **本地 API 服务**：一键开启 OpenAI 兼容接口（也有原生 REST API），可在本机或局域网内给其他软件调用。
- **接入 MCP**：给本地模型挂载 MCP 服务器，扩展工具能力。
- **开发者工具**：命令行工具 `lms`、Python / TypeScript SDK，以及 LM Link 远程使用自己电脑上的模型。

## 怎么上手

1. 打开 lmstudio.ai 下载对应系统的 LM Studio 安装包并安装。
2. 打开软件，进入模型搜索页，输入想要的模型（如「qwen」），根据软件提示选择适合你电脑配置的版本下载。
3. 下载完成后在聊天页顶部选择并加载模型，开始对话。
4. 想让其他软件调用，进入开发者页面启动本地服务器，把接口地址填到你的客户端或代码里。
5. 需要智能体式的写代码、做文档，再另外下载 LM Studio Bionic 试用。

可以这样开始：加载一个小参数模型后，拖入一份 PDF 说明书，问「把这份文档的安装步骤整理成 5 条要点」。

## 免费与付费

- **LM Studio 桌面应用**：免费。官方博客宣布自 2025 年 7 月 8 日起，在家和在工作中使用都免费，不再需要单独申请商业授权；有 SSO、模型与 MCP 管控等需求的企业可选企业方案。
- **LM Studio Bionic**：定价页列出（官网定价页，2026-10 查询）——Free 免费（Bionic 智能体、本地模型、离线语音转写、有限联网搜索）；Bionic+ 20 美元/月（加入美国托管的开源云端模型和更强的网页搜索）；Pro 100 美元/月（5 倍用量上限、抢先体验新功能）。团队订阅官方称即将推出。

## 适合谁 / 不适合谁

适合：
- 想在本地跑开源模型、但不熟悉命令行的用户。
- 需要离线问答内部文档、对数据隐私要求高的个人和企业员工。
- 想给其他软件提供一个本地 OpenAI 兼容接口的开发者。
- 想直观比较不同模型、不同量化版本效果的学习者。

不适合：
- 电脑配置较低的用户：官方建议 16GB 以上内存，配置不足时只能跑小模型。
- 使用 Intel 芯片 Mac 的用户：官方系统要求 macOS 需 Apple Silicon（M 系列芯片）。
- 需要在服务器上批量部署的场景，用 llmster 或 Ollama 这类命令行方案更合适。

## 注意事项

- **系统要求**：macOS 需 Apple Silicon 且系统为 14.0 及以上；Windows x64 需 CPU 支持 AVX2 指令集，也支持 ARM（骁龙 X Elite）；Linux 需 Ubuntu 20.04 及以上，以 AppImage 分发。
- **隐私**：本地模式下模型和数据都在本机；Bionic 官方承诺对所有用户零数据保留、不用用户数据训练。
- **模型下载**：模型文件较大，注意磁盘空间；每个开源模型的许可证不同，商用前核对。
- **局域网开放 API 时**：注意访问控制，避免他人随意调用你的电脑资源。

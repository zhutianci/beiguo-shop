---
title: "llama.cpp 是什么、怎么用：本地运行 GGUF 大模型的开源推理引擎，llama-server 自带网页界面"
slug: llama-cpp-local-llm-inference
name: llama.cpp
url: https://github.com/ggml-org/llama.cpp
pricing: 开源免费（MIT）
platforms: Windows / macOS / Linux / Docker / 命令行
products: [ai-tools]
models: []
topics: [coding]
excerpt: "llama.cpp 是用 C/C++ 编写的开源大模型推理引擎，使用 GGUF 模型格式和量化技术，让普通电脑也能跑大模型。自带 llama-cli 和 llama-server（兼容 OpenAI 的接口加内置网页界面）。"
checkedOn: 2026-10-11
sources:
  - https://github.com/ggml-org/llama.cpp
---

> 本文根据 llama.cpp 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

llama.cpp 是一个用 C/C++ 实现的大模型推理项目，仓库 ggml-org/llama.cpp 约有 13.07 万星标，采用 MIT 许可，构建在 ggml 张量库之上。README 对它的描述只有一句：「LLM inference in C/C++」。

它的地位可以这样理解：**Ollama、LM Studio、Jan、GPT4All 这些本地模型软件，底层很多都在用它或它的衍生实现**。直接用 llama.cpp 的好处是最新、最轻、参数最全；代价是要自己敲命令。

## 核心概念

- **GGUF**：llama.cpp 使用的模型文件格式。在 Hugging Face 上看到文件名以 `.gguf` 结尾的模型，就是给它（以及兼容它的软件）用的。
- **量化**：把模型权重从高精度压缩到 1.5 到 8 比特不等。常见的 4 比特量化能把体积和内存占用降到原来的几分之一，质量损失有限——这是「笔记本也能跑大模型」的关键。
- **硬件后端**：支持 CUDA（NVIDIA）、HIP（AMD）、Metal（Apple）、Vulkan、SYCL、OpenCL、WebGPU 等，没有显卡也能用 CPU 跑。

## 主要工具

- **llama-cli**：命令行对话工具，可以直接从 Hugging Face 拉取模型运行。
- **llama-server**：一个轻量的 HTTP 服务，提供**兼容 OpenAI 的 API**，并**自带网页聊天界面**——很多人在找的「llama.cpp 前端」，其实装好就有。

## 怎么上手

1. 安装：README 提供了安装脚本（curl 或 PowerShell）、Docker 镜像、Releases 页的预编译包，也可以从源码编译。新手建议直接下载对应系统和显卡的预编译包。
2. 启动服务并加载一个模型（从 Hugging Face 自动下载）：

```bash
llama-server -hf 组织名/模型仓库名-GGUF
```

3. 浏览器打开 `http://localhost:8080`，就能在自带的网页界面里对话。
4. 其他程序把 OpenAI 接口地址指向 `http://localhost:8080/v1` 即可调用。

模型怎么选：先看自己显存或内存有多大，选量化后文件体积小于可用显存的版本；不确定时从 4 比特量化（文件名里带 Q4）的小模型试起。

## 免费与付费

完全免费开源，没有任何付费版本。成本只有硬件、电费和下载模型的流量。

## 适合谁 / 不适合谁

**适合：**
- 想用最少的依赖在本地或服务器上跑模型的开发者；
- 需要精细控制上下文长度、GPU 层数、采样参数的进阶用户；
- 在树莓派、旧电脑、无显卡服务器等受限环境里部署模型的人。

**不适合：**
- 不想碰命令行的用户——选 LM Studio、Jan 这类图形界面软件；
- 想「一条命令自动管理模型」的人，Ollama 更省心；
- 需要高并发、多显卡服务大量用户的生产环境，vLLM 这类服务框架更合适。

## 注意事项

- **更新非常快**：命令行参数时有变化，老教程里的可执行文件名（如早期的 `main`）已经改掉，以当前 README 为准。
- **下载对版本**：预编译包分 CPU、CUDA、Vulkan 等多种，下错了要么跑不起来，要么用不上显卡。
- **模型许可证独立于软件**：llama.cpp 是 MIT，但每个模型有自己的许可，商用前逐个核对。
- **服务不要直接暴露到公网**：需要远程访问时加上 API Key 参数和反向代理。

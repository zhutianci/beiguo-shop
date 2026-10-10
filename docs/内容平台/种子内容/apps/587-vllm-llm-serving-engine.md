---
title: "vLLM 是什么、怎么用：高吞吐的开源大模型推理与部署框架入门"
slug: vllm-llm-serving-engine
name: vLLM
url: https://github.com/vllm-project/vllm
pricing: 开源免费（Apache-2.0）
platforms: Linux 服务器 / Docker / Python 库
products: [ai-tools]
models: []
topics: [coding]
excerpt: "vLLM 是起源于加州大学伯克利分校的开源大模型推理与服务框架，凭借 PagedAttention 和连续批处理实现高吞吐，自带兼容 OpenAI 的 API 服务，是自建模型服务的常用选择。"
checkedOn: 2026-10-11
sources:
  - https://github.com/vllm-project/vllm
  - https://docs.vllm.ai/
---

> 本文根据 vLLM 官方 GitHub 仓库 README 与官方文档整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

vLLM 是一个用于大模型**推理和服务**的开源库，仓库 vllm-project/vllm 约有 9.35 万星标，采用 Apache-2.0 许可。它起源于加州大学伯克利分校的 Sky Computing Lab，README 称现在由来自众多高校和公司的两千多名贡献者共同维护。

如果说 Ollama、llama.cpp 解决的是「在我自己的电脑上跑起来」，vLLM 解决的就是「**在服务器显卡上同时服务很多人**」。公司内部搭一个共享的模型服务、给应用提供稳定的模型后端，通常会用到它。

## 核心能力

- **PagedAttention**：高效管理注意力计算所需的显存，是它高吞吐的基础。
- **连续批处理（Continuous batching）**：把不同时间到达的请求动态拼在一起推理，显著提高显卡利用率。
- **前缀缓存、量化、推测解码**：进一步降低延迟和成本。
- **兼容 OpenAI 的 API 服务**：启动后现有的 OpenAI 客户端代码改个地址就能用。
- **硬件支持**：NVIDIA、AMD、Intel 的 GPU，x86、ARM、PowerPC 的 CPU，并通过硬件插件支持 Google TPU、Apple Silicon 等。

## 怎么上手

准备一台带显卡的 Linux 机器：

```bash
uv pip install vllm
vllm serve 组织名/模型名
```

第二条命令会从 Hugging Face 下载模型并在本机 8000 端口启动服务，然后就可以用 OpenAI SDK 调用：

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:8000/v1", api_key="EMPTY")
print(client.chat.completions.create(model="组织名/模型名", messages=[{"role": "user", "content": "你好"}]).choices[0].message.content)
```

生产部署一般使用官方 Docker 镜像，并按文档调整显存占用比例、最大上下文长度、并发数等参数。

## 免费与付费

框架完全免费。成本是 GPU 服务器——自购或租用云主机，以及运维人力。

## 适合谁 / 不适合谁

**适合：**
- 要在公司内部或自己产品里自建模型服务的后端和算法工程师；
- 有多用户并发需求、希望把显卡利用率压到最高的团队；
- 需要部署自己微调的开源模型的场景。

**不适合：**
- 只想在个人电脑上和模型聊天的用户，Ollama、LM Studio 简单得多；
- 没有独立显卡的机器；
- 不想承担运维工作的小团队，直接用推理云平台的 API 更省事。

## 注意事项

- **显存默认会被占满**：vLLM 启动时会预先占用大部分显存，同一张卡上要跑别的程序需要手动调低占用比例。
- **模型格式**：主要加载 Hugging Face 格式的权重，和 llama.cpp 常用的 GGUF 量化文件不是一回事。
- **对外服务要加鉴权**：启动时设置 API Key，并放在网关或反向代理之后。
- **版本与驱动匹配**：CUDA、显卡驱动和 vLLM 版本要对应，优先用官方镜像减少环境问题。
- **模型许可证各自独立**，商用前核对。

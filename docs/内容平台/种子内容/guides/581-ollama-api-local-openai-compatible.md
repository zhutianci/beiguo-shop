---
title: Ollama API 调用教程：本地接口地址、Python 调用与 OpenAI 兼容写法
slug: ollama-api-local-openai-compatible
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Ollama API 怎么调用、地址是什么、要不要 API Key？本文按官方文档讲清本地接口地址 localhost:11434、原生接口与 OpenAI 兼容接口两种写法、Python 示例、keep_alive 与上下文长度怎么设，以及连不上时的排查。
checkedOn: 2026-10-11
sources:
  - https://docs.ollama.com/api/introduction
  - https://docs.ollama.com/api/openai-compatibility
  - https://docs.ollama.com/quickstart
  - https://docs.ollama.com/faq
  - https://github.com/ollama/ollama-python
---

## 适用于谁

- 搜「ollama api 调用」「ollama api 地址」「ollama api key 怎么获取」「python 调用 ollama api」的人；
- 想把本机的 Ollama 接到自己的脚本，或接到支持 OpenAI 接口的第三方工具里的人。

本文根据 Ollama 官方文档整理，资料核对于 2026-10-11。还没装 Ollama 的话先看《Ollama怎么用》。

## 结论先说

1. **本地 API 地址是 `http://localhost:11434`**，Ollama 启动后自动提供，不需要另外开服务。
2. **本地调用不需要 API Key**。只有直接调用 Ollama 云端模型才需要在 ollama.com 创建 Key。
3. **有两套接口可选**：原生接口（`/api/chat`、`/api/generate`）和 OpenAI 兼容接口（`/v1/chat/completions` 等）。已有的 OpenAI 代码，改一下 `base_url` 就能用。
4. 用 OpenAI SDK 时 `api_key` 这个参数必须填，但本地服务会忽略它，官方示例填的是 `ollama`。

## 步骤

### 1. 先确认服务在运行

```bash
ollama ls          # 能列出模型，说明服务正常
ollama pull gemma4 # 没有模型就先下载一个
```

官方给出的三组地址：

| 接口 | 本地 Ollama 服务 | 直接访问云端 |
| --- | --- | --- |
| Ollama 原生接口 | `http://localhost:11434/api` | `https://ollama.com/api` |
| OpenAI 兼容接口 | `http://localhost:11434/v1` | `https://ollama.com/v1` |
| Anthropic 客户端 base URL | `http://localhost:11434` | `https://ollama.com` |

### 2. 用 curl 调原生接口

```bash
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4",
    "messages": [{"role": "user", "content": "用一句话介绍你自己"}],
    "stream": false
  }'
```

回答在返回 JSON 的 `message.content` 里。官方示例都带着 `"stream": false`，表示一次性返回完整结果；去掉它则是逐块流式返回。

Windows PowerShell 里引号转义比较麻烦，官方 Windows 文档给的写法是用 `Invoke-WebRequest`：

```powershell
(Invoke-WebRequest -method POST -Body '{"model":"gemma4", "prompt":"天空为什么是蓝色的？", "stream": false}' -uri http://localhost:11434/api/generate ).Content | ConvertFrom-json
```

### 3. 用官方 Python 库

```bash
pip install ollama
```

```python
from ollama import chat

response = chat(
    model="gemma4",
    messages=[{"role": "user", "content": "用三句话解释什么是量化"}],
)
print(response.message.content)
```

流式输出把 `stream=True` 传进去，然后逐块读取：

```python
for chunk in chat(model="gemma4", messages=[{"role": "user", "content": "写一首四行诗"}], stream=True):
    print(chunk.message.content, end="", flush=True)
```

官方还提供 JavaScript 库（`ollama-js`），用法类似。

### 4. 用 OpenAI SDK（兼容接口）

已有的 OpenAI 代码只改两处，`base_url` 和 `model`：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1/",
    api_key="ollama",   # 必填，但本地服务不校验
)

resp = client.chat.completions.create(
    model="gemma4",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)
```

官方兼容文档列出的端点包括 `/v1/chat/completions`、`/v1/completions`、`/v1/models`、`/v1/embeddings` 和 Responses API（`/v1/responses`）。其中 Responses API 不支持有状态的用法：`previous_response_id` 和 `conversation` 两个参数标注为不支持，多轮对话要自己把历史消息带上。

### 5. 接到第三方工具

凡是能自定义「OpenAI 兼容接口地址」的客户端，都按下面填：

- 接口地址（Base URL）：`http://localhost:11434/v1`
- API Key：随便填一个非空字符串，例如 `ollama`
- 模型名：`ollama ls` 里显示的名字

有些工具写死了 `gpt-3.5-turbo` 这类模型名、不让改。官方给的办法是给本地模型复制一个别名：

```bash
ollama cp gemma4 gpt-3.5-turbo
```

之后把 `gpt-3.5-turbo` 当模型名传进去，实际调用的是本地的 gemma4。

### 6. 两个常用的调节项

**模型在内存里留多久**：默认 5 分钟后卸载。请求里的 `keep_alive` 参数可以改：

- 时长字符串，如 `"10m"`、`"24h"`；
- 秒数，如 `3600`；
- 负数（如 `-1`）表示一直留在内存；
- `0` 表示回答完立刻卸载。

只发模型名、不带内容的请求可以预加载模型，避免第一次提问等待：

```bash
curl http://localhost:11434/api/generate -d '{"model": "gemma4", "keep_alive": -1}'
```

**上下文长度**：OpenAI 接口本身没有设置上下文长度的参数。官方的做法是写一个 Modelfile 把 `num_ctx` 固定下来，再用新名字调用：

```
FROM gemma4
PARAMETER num_ctx 32768
```

```bash
ollama create gemma4-32k -f Modelfile
```

也可以用环境变量 `OLLAMA_CONTEXT_LENGTH` 统一设置服务的默认值。

## 常见问题

**Q：Ollama 的 API Key 在哪里获取？**
本地调用不需要。只有不经过本机、直接请求 `https://ollama.com/api` 的云端模型时才需要，登录 ollama.com 后在 Settings 的 Keys 页面创建，并以 `Authorization: Bearer` 请求头携带。官方提醒 Key 要放在服务端，不要写进浏览器代码或提交到代码仓库。

**Q：连接被拒绝（connection refused）怎么办？**
先确认 Ollama 在运行（任务栏有图标，或 `ollama ls` 有输出）。Ollama 默认只监听 `127.0.0.1:11434`，从另一台电脑、Docker 容器或 WSL 里访问需要改监听地址，见《Ollama 修改模型存储位置与局域网访问》。

**Q：浏览器里的网页或插件调用报跨域错误？**
官方 FAQ 说明，默认只允许来自 `127.0.0.1` 和 `0.0.0.0` 的跨域请求，其他来源要通过环境变量 `OLLAMA_ORIGINS` 添加。

**Q：返回 503 是什么意思？**
官方 FAQ 的解释是请求太多、服务过载。排队上限由 `OLLAMA_MAX_QUEUE` 控制（默认 512），单个模型同时处理的请求数由 `OLLAMA_NUM_PARALLEL` 控制（默认 1）。

**Q：接口会变吗？**
官方说明 API 没有严格的版本号，但预期保持稳定和向后兼容，少数弃用会写在发布说明里。

## 参考资料

- Ollama 文档：API Introduction — https://docs.ollama.com/api/introduction
- OpenAI compatibility — https://docs.ollama.com/api/openai-compatibility
- Quickstart — https://docs.ollama.com/quickstart
- FAQ — https://docs.ollama.com/faq
- 官方 Python 库 — https://github.com/ollama/ollama-python

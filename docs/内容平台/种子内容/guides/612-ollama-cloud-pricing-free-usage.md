---
title: Ollama 收费吗：本地免费与 Ollama Cloud 云端模型的价格、额度和用法
slug: ollama-cloud-pricing-free-usage
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Ollama 收费吗、Ollama Cloud 怎么用？本文按官网定价页和官方文档讲清：本地运行免费，云端模型按用量额度计费；Free、Pro、Max 各含什么；云端模型的两种叫法；怎么查用量和关闭云端功能。
checkedOn: 2026-10-11
sources:
  - https://ollama.com/pricing
  - https://docs.ollama.com/cloud
  - https://docs.ollama.com/api/introduction
  - https://docs.ollama.com/faq
---

## 适用于谁

- 搜「ollama 收费吗」「ollama cloud 收费」「ollama cloud 免费额度」「ollama cloud api」「ollama 云端模型」的人；
- 一直在本地用 Ollama，看到模型名后面多了 `:cloud`、应用里多了登录入口，想弄清这是什么的人。

本文根据 Ollama 官网定价页和官方文档整理，资料核对于 2026-10-11。价格和额度是定价页当天显示的数字（美元），官方随时可能调整，以官网为准。

## 结论先说

1. **在自己电脑上运行模型是免费的**。定价页 Free 档（0 美元）的第一条就是本地运行模型。
2. **Ollama Cloud 是官方的云端推理服务**：模型跑在 Ollama 的服务器上，不用下载、不吃本机显存，按用量额度（usage credits）计费。
3. **Free 档也能用云端模型**：定价页写的是包含起步的用量额度、可以使用入门级的模型；充值之后解锁全部模型。
4. **付费订阅主要是买每月的用量额度**：Pro 每月 20 美元含 60 美元额度，Max 每月 100 美元含 300 美元额度（2026-10-11 定价页）。
5. **云端模型有两种叫法**：在 Ollama 应用和命令行里用 `模型名:cloud`；直接请求 ollama.com 的 API 时，用云端模型列表返回的名字。
6. **不想用云端功能可以彻底关掉**：设置 `OLLAMA_NO_CLOUD=1`。

## 本地和云端的区别

| | 本地模型 | 云端模型（Ollama Cloud） |
| --- | --- | --- |
| 模型在哪里运行 | 你的电脑 | Ollama 的服务器 |
| 是否需要下载模型 | 需要 | 不需要 |
| 对硬件的要求 | 显存要装得下模型 | 无 |
| 费用 | 免费（电费和硬件自理） | 按 token 消耗用量额度 |
| 是否需要登录 | 不需要 | 需要 |
| 数据 | 不离开本机 | 发送到 Ollama 云端处理 |
| 上下文长度 | 按显存自动选默认值，可调 | 官方文档说明默认设为模型的最大上下文 |

官方定价页的常见问题里还提到：云端模型使用模型提供方发布的原生权重。

## 各档方案

官网定价页（2026-10-11 核对，美元）：

| 方案 | 价格 | 包含的内容（官方描述） |
| --- | --- | --- |
| Free | $0 | 本地运行模型；包含起步用量额度；可使用入门级模型；充值后解锁全部模型；无服务费 |
| Pro | $20 / 月（年付 $200） | Free 的全部内容；每月 $60 用量额度；可使用更大的 pro 模型；可同时运行多个模型 |
| Max | $100 / 月 | Pro 的全部内容；每月 $300 用量额度；抢先使用最新模型；10 个并发请求 |
| Team | $500 / 月起（抢先体验） | 不限用户数；每月 $1,000 团队共享额度；集中计费和管理 |
| Enterprise | 定制 | 模型访问控制、成本预算等 |

**模型怎么计价**：按量付费，价格以每百万 token 标注，分输入、缓存输入、输出三项，不同模型价格不同。定价页还注明了非高峰价格：工作日 UTC 12:00 至 18:00 以外的时间以及周末全天，适用非高峰价（定价页上部分模型单独列出了非高峰价格）。具体数字直接看定价页的 Model pricing 表。

Free 档的起步额度具体是多少，定价页没有写出数字，以登录后的用量页面为准。

## 步骤

### 用法一：在 Ollama 应用或命令行里用

1. 下载并打开 Ollama，或在终端执行 `ollama`，按提示**登录**（命令行也可以用 `ollama signin`）；
2. 运行云端模型，名字以 `:cloud` 结尾：

```bash
ollama run gemma4:cloud
```

不会下载模型文件，直接开始对话。本机的 API（`http://localhost:11434`）也可以调用这个名字，Ollama 会替你转发到云端。

接编程工具也是同样的思路，例如 `ollama launch claude` 后在模型列表里选云端模型，见《Ollama 接入 Claude Code 与 Codex 教程》。

### 用法二：不装 Ollama，直接调云端 API

1. 登录 ollama.com，在 Settings 的 Keys 页面创建 API Key；
2. 设置环境变量并发请求：

```bash
export OLLAMA_API_KEY="你的 Key"

curl https://ollama.com/api/chat \
  -H "Authorization: Bearer $OLLAMA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma4:31b",
    "messages": [{"role": "user", "content": "用一句话打个招呼"}],
    "stream": false
  }'
```

回答在 `message.content` 里。注意这里的模型名是 `gemma4:31b` 而不是 `gemma4:cloud`。官方文档的说明是：请求 ollama.com 的 API 时，用云端模型列表返回的名字；在 Ollama 应用或命令行里，用 `:cloud` 结尾的名字。

云端的三组地址：

| 接口 | 地址 |
| --- | --- |
| Ollama 原生接口 | `https://ollama.com/api` |
| OpenAI 兼容接口 | `https://ollama.com/v1` |
| Anthropic 客户端的 base URL | `https://ollama.com` |

用 OpenAI SDK 的写法：

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://ollama.com/v1",
    api_key=os.environ["OLLAMA_API_KEY"],
)
```

官方提醒：API Key 放在你应用的服务端，不要写进浏览器代码，也不要提交到代码仓库。

### 查有哪些云端模型

- 网页：ollama.com/search 里筛选 cloud；
- API：

```bash
curl https://ollama.com/api/tags
```

### 查用量

登录后在 ollama.com 的 Settings → Usage 页面查看。官方文档还提到，这里会显示你最近用过的模型的**下线计划**，要在下线日期之前换用其他模型；已经下载到本地的模型不受影响。

## 数据与隐私

官方文档的说法：

- 本地运行时，Ollama 看不到你的提示词和数据；
- 使用云端模型时，Ollama 会处理提示词和回复以完成请求，**不用它们训练模型**；FAQ 里还写明不存储、不记录这些内容，只收集基本的账号信息和不含内容的用量元数据。

只想用本地模型的话，可以关闭云端功能。在 `~/.ollama/server.json` 里写入：

```json
{
  "disable_ollama_cloud": true
}
```

或者设置环境变量 `OLLAMA_NO_CLOUD=1`，然后重启 Ollama。官方说明关闭后日志里会出现 `Ollama cloud disabled: true`，同时你将无法使用云端模型和联网搜索。

## 常见问题

**Q：不登录、不付费，Ollama 还能正常用吗？**
能。本地下载和运行模型不需要账号。登录只是为了用云端模型等在线功能。

**Q：为什么有的模型我选不了？**
按定价页的说明，Free 档可以使用入门级模型，充值后解锁全部模型；更大的 pro 模型属于 Pro 及以上方案的权益。

**Q：额度用完会怎样？**
定价页对团队方案的说明是，超出包含额度的用量从余额里按量扣除，可以预存固定金额并关闭自动扣费。个人方案的具体行为以账户页面的说明为准。

**Q：云端模型支持工具调用吗？**
定价页常见问题的回答是支持：训练时支持工具的云端模型，上线前会经过工具调用和真实智能体流程的测试。

**Q：云端模型的回答和本地同名模型一样吗？**
云端用的是模型提供方发布的原生权重；本地下载的通常是量化版本，两者不完全等同，见《本地大模型怎么选》。

**Q：和直接用各家模型的官方 API 相比呢？**
Ollama Cloud 提供的是开源和开放权重的模型，好处是一个账号、一套接口可以切换多家模型，并且和本地用法一致。价格和可用模型以各自官网为准，本文不做比较。

## 参考资料

- Ollama 定价页 — https://ollama.com/pricing
- Ollama 文档：Cloud — https://docs.ollama.com/cloud
- API Introduction — https://docs.ollama.com/api/introduction
- FAQ（数据处理、关闭云端功能）— https://docs.ollama.com/faq

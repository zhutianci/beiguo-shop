---
title: OpenAI API 调用教程（Python）：安装 SDK、第一个请求与常见报错
slug: openai-api-python-quickstart
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: 用 Python 调用 OpenAI API 的入门示例：安装官方 openai 库、用环境变量配置密钥、用 Responses API 发出第一个请求、读取 token 用量、流式输出，以及 401、429、连接失败等报错怎么排查。代码按官方文档 2026-10-07 版本整理。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/quickstart
  - https://developers.openai.com/api/docs/libraries
  - https://github.com/openai/openai-python
  - https://developers.openai.com/api/reference/resources/responses/methods/create
  - https://developers.openai.com/api/docs/guides/text
  - https://developers.openai.com/api/docs/guides/streaming-responses
  - https://developers.openai.com/api/docs/guides/error-codes
  - https://developers.openai.com/api/docs/models
  - https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs
verify:
  - 示例模型名 gpt-6-astra 取自 2026-10-07 的官方 Quickstart；openai-python 仓库 README 里的示例仍写 gpt-5.5，两处不一致，上线前再看一次 Quickstart
  - Python 最低版本 3.10 来自 openai-python README，后续可能上调
---

> 本文根据 OpenAI 开发者文档（Quickstart、SDKs、Text generation、Streaming、Error codes）和 openai-python 官方仓库 README 整理，资料核对于 2026-10-07。代码里的模型名会随官方更新而变化，请以 [Models 页面](https://developers.openai.com/api/docs/models) 为准。

## 适用于谁

- 会一点 Python，想写出第一段调用 OpenAI 模型的代码的人；
- 照着网上旧教程写代码，发现写法和现在的官方 SDK 对不上、运行就报错的人；
- 想知道报错时先查哪里的人。

## 结论先说

1. **准备**：Python 3.10 及以上；一个 API Key（获取方法见 [/guides/openai-api-key](/guides/openai-api-key)），并设为环境变量 `OPENAI_API_KEY`。
2. **安装**：`pip install openai`。
3. **最小代码**：`client = OpenAI()` → `client.responses.create(model=..., input=...)` → `print(response.output_text)`。官方现在推荐新项目用 **Responses API**；老的 Chat Completions 仍然可用。
4. **报错先看状态码**：401 是密钥问题，429 要区分「请求太快」和「余额 / 限额用完」，`APIConnectionError` 是网络连不上。

## 步骤

### 1. 建一个干净的环境并安装 SDK

```bash
python -m venv .venv
# macOS / Linux 激活：source .venv/bin/activate
# Windows 激活：.venv\Scripts\activate
pip install openai
```

装完可以用 `python -c "import openai; print(openai.__version__)"` 查看版本。README 提醒：升级后看不到新功能，多半是当前环境还在用旧版本。

### 2. 配置密钥

官方 SDK 会自动读取环境变量 `OPENAI_API_KEY`，所以代码里**不需要也不应该**写密钥。

- macOS / Linux：`export OPENAI_API_KEY="你的密钥"`
- Windows PowerShell：`setx OPENAI_API_KEY "你的密钥"`，然后**重新打开**终端

如果习惯用 `.env` 文件，README 推荐配合 `python-dotenv` 加载，并把 `.env` 加进 `.gitignore`，避免密钥进到代码仓库。

### 3. 发出第一个请求

新建 `example.py`：

```python
from openai import OpenAI

client = OpenAI()  # 自动读取环境变量 OPENAI_API_KEY

response = client.responses.create(
    model="gpt-6-astra",  # 2026-10 官方 Quickstart 使用的模型，可换成其他模型
    instructions="你是一位说话简洁的中文助手。",
    input="用两句话解释什么是 API。",
)

print(response.output_text)
```

运行 `python example.py`，几秒后会打印模型回答。几个参数的意思：

- `model`：模型 ID。Models 页面把 GPT-6 Astra 列为复杂推理和编程的旗舰，GPT-6.1 Sol 兼顾能力和成本，GPT-6 Luna 适合注重成本、大批量的任务。模型会更新换代，以页面为准。
- `instructions`：高层级的行为要求（语气、角色、规则），优先级高于 `input` 里的内容。
- `input`：可以是一段字符串，也可以是带 `role` 的消息列表。
- `output_text`：SDK 提供的便捷属性，把所有文字输出拼成一个字符串。官方提醒 `output` 数组里经常不止一项（还有推理、工具调用等），不要硬写 `output[0].content[0].text`。

### 4. 看这次用了多少 token

```python
print(response.usage.input_tokens, response.usage.output_tokens, response.usage.total_tokens)
```

Responses API 的用量字段是 `input_tokens` / `output_tokens` / `total_tokens`（Chat Completions 叫 `prompt_tokens` / `completion_tokens`）。推理模型的内部推理 token 不显示成文字，但按输出 token 计费，所以回答很短、用量却不小是正常的。费用怎么算见 [/guides/openai-api-pricing-billing](/guides/openai-api-pricing-billing)。

### 5. 流式输出（边生成边显示）

做聊天界面时，加 `stream=True`，然后按事件类型取文字增量：

```python
from openai import OpenAI

client = OpenAI()

stream = client.responses.create(
    model="gpt-6-astra",
    input="写一首四行的小诗，主题是秋天。",
    stream=True,
)

for event in stream:
    if event.type == "response.output_text.delta":
        print(event.delta, end="", flush=True)
    elif event.type == "response.completed":
        print()
```

Responses 的流式返回是带类型的事件，常用的有 `response.created`、`response.output_text.delta`、`response.completed` 和 `error`。

### 6. 加上错误处理

```python
import openai
from openai import OpenAI

client = OpenAI()

try:
    response = client.responses.create(model="gpt-6-astra", input="你好")
    print(response.output_text)
except openai.AuthenticationError:
    print("401：密钥无效或已被删除，检查 OPENAI_API_KEY")
except openai.RateLimitError as e:
    print("429：", e.code, e.message)  # 先看 code 判断是限速还是余额/限额问题
except openai.APIConnectionError:
    print("连不上 API：检查网络、防火墙或证书设置")
except openai.APIStatusError as e:
    print("其他错误：", e.status_code, e.request_id)
```

SDK 默认会对连接错误、408、409、429 和 5xx 自动重试 2 次（短暂的指数退避），可以用 `OpenAI(max_retries=0)` 关掉或改次数；默认超时是 10 分钟，可以用 `timeout=` 调整。

## 常见报错速查

| 报错 | 常见原因 | 处理 |
| --- | --- | --- |
| `401 Incorrect API key provided` | 密钥复制不全、有空格、已删除，或用了别的组织 / 项目的密钥 | 重新复制或生成新密钥 |
| `403 Country, region, or territory not supported` | 所在地区不在支持列表 | 查看官方[支持国家和地区](https://developers.openai.com/api/docs/supported-countries) |
| `429` + `credit_balance_exhausted` | 预付额度用完 | 去 Billing 充值，重试没用 |
| `429 Rate limit reached` | 请求或 token 发得太快 | 降速、按 `Retry-After` 等待，详见 [/guides/openai-api-429-error](/guides/openai-api-429-error) |
| `400 BadRequestError` | 参数名、类型写错，或模型不支持该参数 | 读报错信息，对照 API Reference |
| `APIConnectionError` / `APITimeoutError` | 网络不稳、防火墙拦截、证书问题、请求太大太慢 | 检查网络环境后重试 |

排查时记下返回的 request ID（SDK 里是 `response._request_id`，出错时是 `e.request_id`），联系官方支持时会用到。

## 常见问题

**Q：还能用 `client.chat.completions.create` 吗？**
可以。README 说明 Chat Completions 会长期支持；但官方建议新项目用 Responses API。两者的区别和迁移方法见 [/guides/openai-responses-api](/guides/openai-responses-api)。

**Q：想先不写代码、在网页上试效果？**
用 OpenAI Playground，见 [/guides/openai-playground](/guides/openai-playground)。注意 Playground 的调用同样计入 API 用量和费用。

**Q：异步怎么写？**
把 `OpenAI` 换成 `AsyncOpenAI`，每次调用前加 `await`，其余参数一样。

**Q：能把密钥直接写在 `OpenAI(api_key="...")` 里吗？**
技术上可以，但官方不推荐：代码一旦分享或上传仓库，密钥就泄露了。

## 参考资料

- OpenAI 开发者文档：Developer quickstart — https://developers.openai.com/api/docs/quickstart
- OpenAI 开发者文档：SDKs and CLI — https://developers.openai.com/api/docs/libraries
- openai-python 官方仓库 README — https://github.com/openai/openai-python
- OpenAI API Reference：Create a response — https://developers.openai.com/api/reference/resources/responses/methods/create
- OpenAI 开发者文档：Text generation — https://developers.openai.com/api/docs/guides/text
- OpenAI 开发者文档：Streaming API responses — https://developers.openai.com/api/docs/guides/streaming-responses
- OpenAI 开发者文档：Error codes — https://developers.openai.com/api/docs/guides/error-codes
- OpenAI 开发者文档：Models — https://developers.openai.com/api/docs/models
- OpenAI 帮助中心：Reviewing API usage and costs — https://help.openai.com/en/articles/10478918-reviewing-api-usage-and-costs

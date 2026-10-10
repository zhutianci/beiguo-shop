---
title: Claude API Python 入门：安装 SDK、第一个请求、流式输出与多轮对话
slug: claude-api-python-quickstart
products: [claude]
models: []
accountTier: OTHER
excerpt: 用官方 anthropic Python SDK 调 Claude：安装与 API Key 配置、第一个 messages.create 请求、system 提示词、多轮对话（API 无状态）、流式输出、错误处理与重试、读取 token 用量。附可运行的命令行聊天示例。
checkedOn: 2026-10-07
sources:
  - https://platform.claude.com/docs/en/get-started
  - https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/python
  - https://platform.claude.com/docs/en/build-with-claude/working-with-messages
  - https://platform.claude.com/docs/en/build-with-claude/streaming
  - https://platform.claude.com/docs/en/about-claude/models/overview
verify:
  - 示例模型 ID claude-opus-5-5 取自 2026-10 官方快速开始；可用模型和价格以官方 Models overview 与定价页为准
---

> 本文根据 Claude API 官方文档（快速开始、Python SDK、Working with messages、Streaming）整理，核对日期 2026-10-07。示例代码基于官方示例改写；模型 ID 会更新，以官方 Models overview 为准。

## 适用于谁

- 会一点 Python，想在自己的脚本或后端里调用 Claude 的开发者；
- 搜「claude api python」「python sdk example」「tutorial」的人；
- 从 OpenAI API 迁移过来，想知道 Claude 的写法有什么不同的人。

还没有 API Key 的，先看本站《Claude API Key 怎么获取：Claude Console 创建密钥、充值与用量查看》。

## 结论先说

1. 安装：`pip install anthropic`，要求 **Python 3.10 及以上**。
2. 把 API Key 设成环境变量 `ANTHROPIC_API_KEY`，SDK 会自动读取，代码里不用写密钥。
3. 核心只有一个调用：`client.messages.create(model=..., max_tokens=..., messages=[...])`；`max_tokens` 是**必填**的。
4. **Messages API 是无状态的**：多轮对话要每次把完整历史一起发过去。
5. 回复在 `message.content`（一个内容块列表）里，用量在 `message.usage` 里；长回复用流式输出体验更好。

## 步骤

### 1. 准备环境

```bash
export ANTHROPIC_API_KEY="你的API Key"     # Windows PowerShell: $env:ANTHROPIC_API_KEY="你的API Key"

mkdir claude-quickstart && cd claude-quickstart
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install anthropic
```

官方建议本地开发时可以用 `python-dotenv` 把密钥放进 `.env` 文件，并确保 `.env` 不进版本控制。

### 2. 第一个请求

新建 `quickstart.py`：

```python
import anthropic

client = anthropic.Anthropic()  # 自动读取环境变量 ANTHROPIC_API_KEY

message = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1000,
    messages=[
        {"role": "user", "content": "用三句话解释什么是向量数据库"}
    ],
)

for block in message.content:
    if block.type == "text":
        print(block.text)

print(message.usage)        # 例如 Usage(input_tokens=25, output_tokens=180)
print(message.stop_reason)  # end_turn 表示正常结束；max_tokens 表示被长度上限截断
```

运行 `python quickstart.py`。要点：

- `content` 是一个**内容块列表**，普通回答是 `type == "text"` 的块；用到工具、思考等功能时还会出现其他类型的块，所以按类型取文本更稳妥；
- `stop_reason` 是 `max_tokens` 时说明回答被截断了，调大 `max_tokens` 或让模型写短一点。

### 3. 加上系统提示词（system）

系统提示词用顶层的 `system` 参数，不放进 `messages`：

```python
message = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system="你是一名耐心的 Python 老师，回答要配一个最小可运行的例子，用中文回答。",
    messages=[{"role": "user", "content": "列表推导式怎么用？"}],
)
```

### 4. 多轮对话：每次发送完整历史

官方说明 Messages API 是**无状态**的，服务器不记得上一轮说了什么，你要自己保存历史，每次连同新问题一起发送（`user` 和 `assistant` 交替）：

```python
messages = [
    {"role": "user", "content": "你好，Claude"},
    {"role": "assistant", "content": "你好！有什么可以帮你？"},
    {"role": "user", "content": "能给我介绍一下大语言模型吗？"},
]
reply = client.messages.create(model="claude-opus-5-5", max_tokens=1024, messages=messages)
```

一个可以直接运行的命令行聊天小程序（示例代码）：

```python
import anthropic

client = anthropic.Anthropic()
history = []

while True:
    user_input = input("你：").strip()
    if user_input in ("exit", "quit"):
        break
    history.append({"role": "user", "content": user_input})

    reply = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        system="你是一个简洁的中文助手。",
        messages=history,
    )
    text = "".join(b.text for b in reply.content if b.type == "text")
    print("Claude：", text)
    history.append({"role": "assistant", "content": text})
```

历史越长，每次请求的输入 token 越多、费用越高。长对话可以考虑只保留最近若干轮，或者用提示词缓存降低重复部分的成本（详见本站《Claude 提示词缓存（Prompt Caching）入门：缓存时间、价格倍率与命中率》）。

### 5. 流式输出

回复较长时，用流式输出边生成边显示。SDK 提供了更方便的 `messages.stream` 帮助方法：

```python
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "写一首关于秋天的七言绝句"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
    print()
    final = stream.get_final_message()   # 结束后拿到完整的 message 对象
    print(final.usage)
```

也可以用 `client.messages.create(..., stream=True)` 自己遍历原始事件，内存占用更小，但不会帮你拼出最终消息。

### 6. 异步调用

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def main():
    message = await client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "你好"}],
    )
    print(message.content)

asyncio.run(main())
```

### 7. 错误处理、重试与超时

```python
import anthropic

try:
    message = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "你好"}],
    )
except anthropic.APIConnectionError as e:
    print("连不上服务器", e.__cause__)
except anthropic.RateLimitError:
    print("触发速率限制（429），稍后重试")
except anthropic.APIStatusError as e:
    print("其他错误", e.status_code)
```

| 状态码 | 异常类型 |
| --- | --- |
| 400 | `BadRequestError` |
| 401 | `AuthenticationError`（密钥不对） |
| 403 | `PermissionDeniedError` |
| 404 | `NotFoundError`（请求的资源不存在） |
| 429 | `RateLimitError` |
| ≥500 | `InternalServerError` |

官方 SDK 的默认行为：连接错误、408、409、429 和 5xx **默认自动重试 2 次**（指数退避），可以用 `Anthropic(max_retries=0)` 修改；请求默认超时 **10 分钟**，可以用 `Anthropic(timeout=20.0)` 修改。每个响应都有 `_request_id`，反馈问题时附上它。

## 从 OpenAI 迁移要注意的几点

- 系统提示词用顶层 `system` 参数，而不是 `role: "system"` 的第一条消息（官方说明 `system` 消息不能作为 `messages` 的第一条）；
- `max_tokens` 必填；
- 回复是内容块列表，不是单个字符串；
- 官方说明 Claude 4.6 及以后的模型不支持「预填充（prefill）回复开头」，用了会返回 400 错误，需要固定输出格式时改用结构化输出或在系统提示词里说明。

## 常见问题

**Q：报 401 / AuthenticationError？**
API Key 没设置、写错或已被删除。确认环境变量 `ANTHROPIC_API_KEY` 在运行脚本的终端里生效（新开的终端要重新设置）。

**Q：报「credit balance is too low」之类的错误？**
Console 的预付费额度用完了，到 Console 的 Settings → Billing 补充。

**Q：模型名该写什么？**
用官方 Models overview 页列出的 API ID。各模型的定位和区别详见本站《Claude 模型有哪些、有什么区别：Opus、Sonnet、Haiku 怎么选（2026）》。

**Q：想让 Claude 调用我自己的函数怎么办？**
用工具调用（Tool Use），详见本站《Claude Tool Use（工具调用 / Function Calling）入门：定义工具与返回 tool_result》。想做能自己读文件、跑命令的智能体，可以看 Claude Agent SDK。

**Q：Claude API 在中国大陆能用吗？**
Claude API 只在 Anthropic 支持的国家和地区提供，中国大陆目前不在列表中（https://www.anthropic.com/supported-countries ），请遵守所在地法律和服务条款。

## 参考资料

- Get started with Claude（官方）：https://platform.claude.com/docs/en/get-started
- Python SDK（官方）：https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/python
- Working with the Messages API（官方）：https://platform.claude.com/docs/en/build-with-claude/working-with-messages
- Streaming messages（官方）：https://platform.claude.com/docs/en/build-with-claude/streaming
- Models overview（官方）：https://platform.claude.com/docs/en/about-claude/models/overview

---
title: OpenAI Responses API 是什么：和 Chat Completions 的区别与迁移要点
slug: openai-responses-api
products: [chatgpt]
models: []
accountTier: OTHER
excerpt: Responses API 是 OpenAI 现在推荐新项目使用的接口，Chat Completions 仍然支持，Assistants API 已于 2026-08-26 下线。本文用对照表讲清两者在输入输出、多轮对话、函数调用、结构化输出、流式事件上的区别，并按官方迁移指南列出改代码时最容易出错的地方。
checkedOn: 2026-10-07
sources:
  - https://developers.openai.com/api/docs/guides/migrate-to-responses
  - https://developers.openai.com/api/reference/resources/responses/methods/create
  - https://developers.openai.com/api/docs/guides/text
  - https://developers.openai.com/api/docs/guides/conversation-state
  - https://developers.openai.com/api/docs/deprecations
  - https://github.com/openai/openai-python
  - https://help.openai.com/en/articles/20001551-agents-api-beta-faq
verify:
  - 迁移指南里「推理模型在 Responses 中 SWE-bench 提升 3%」「缓存利用率提升 40%~80%」均为官方内部测试数据，正文只作转述
  - 能力对照表在抓取的 Markdown 中勾选符号缺失，只能确认「Audio：Responses 标注 Coming soon」，其余能力两边是否都支持以官方页面为准，正文没有逐项列出
  - 示例模型名 gpt-6-astra 取自 2026-10-07 官方文档，模型会更新
---

> 本文根据 OpenAI 开发者文档《Migrate to the Responses API》、API Reference、Text generation、Deprecations 和 openai-python README 整理，资料核对于 2026-10-07。

## 适用于谁

- 刚开始学 OpenAI API，看到教程里有的写 `chat.completions.create`、有的写 `responses.create`，不知道该学哪个的人；
- 手上有基于 Chat Completions 的老项目，想评估要不要迁移、怎么迁的人；
- 之前用 Assistants API、现在调用失败的人。

## 结论先说

1. **Responses API 是 OpenAI 现在的主力接口**：官方原话是 Chat Completions 仍然支持，但**所有新项目都推荐用 Responses**。openai-python README 也把 Chat Completions 称为「上一代标准（将长期支持）」。
2. **最大的区别**：输入输出从「消息数组 messages / choices」变成了「带类型的条目（Items）」；内置网页搜索、文件搜索、代码解释器、远程 MCP 等工具，一次请求里模型可以连续调用多个工具；可以由服务端保存对话状态。
3. **Assistants API 已于 2026-08-26 正式下线**，不能再用，要迁到 Responses API + Conversations API。
4. **老项目不必一次全迁**：官方建议从一个纯文本生成流程开始，逐个流程切换，对比效果、延迟、token 用量后再放量。

## Responses 和 Chat Completions 对照

| 项目 | Chat Completions | Responses |
| --- | --- | --- |
| 接口地址 | `POST /v1/chat/completions` | `POST /v1/responses` |
| 输入 | `messages` 数组 | `input`：一段字符串，或条目数组 |
| 系统级指令 | system / developer 消息 | 顶层参数 `instructions`（也可保留兼容的消息条目） |
| 输出 | `choices[0].message` | `output` 数组，里面是不同类型的条目（消息、推理、函数调用……） |
| 取文字的捷径 | 无 | SDK 的 `output_text` |
| 一次生成多个候选 | 支持 `n` | 不支持，需要多发几次请求 |
| 多轮对话 | 自己维护完整历史 | `previous_response_id`、手动回传条目，或 Conversations API |
| 默认是否存储 | 新账号默认存储 | 默认存储 |
| 结构化输出 | `response_format` | `text.format` |
| 函数定义 | 外层套 `function` 对象，默认非严格 | 字段平铺在工具对象里；不写 `strict` 时会尝试严格模式 |
| 流式返回 | 带 `delta` 的增量块 | 带类型的事件，如 `response.output_text.delta` |
| token 用量字段 | `prompt_tokens` / `completion_tokens` | `input_tokens` / `output_tokens` |

官方列出的好处还包括：推理模型在 Responses 里表现更好（内部评测 SWE-bench 提升 3%），缓存利用率更高从而更省钱（内部测试比 Chat Completions 提升 40%~80%），以及可以用加密推理条目在不存储状态的情况下延续推理。官方 Text generation 指南也说，用推理模型时尤其推荐迁到 Responses。

## 最小示例

同一个任务，两种写法：

```python
from openai import OpenAI

client = OpenAI()  # 从环境变量 OPENAI_API_KEY 读取密钥

# Chat Completions 写法
completion = client.chat.completions.create(
    model="gpt-6-astra",
    messages=[
        {"role": "developer", "content": "用简洁的中文回答。"},
        {"role": "user", "content": "什么是向量数据库？"},
    ],
)
print(completion.choices[0].message.content)

# Responses 写法
response = client.responses.create(
    model="gpt-6-astra",
    instructions="用简洁的中文回答。",
    input="什么是向量数据库？",
)
print(response.output_text)
```

纯文本、不含函数和多模态的消息数组，可以直接作为 `input` 传给 Responses，不用改格式。从零开始的 Python 入门见 [/guides/openai-api-python-quickstart](/guides/openai-api-python-quickstart)。

## 迁移要点（按官方步骤）

### 1. 改接口和读取方式

把请求从 `/v1/chat/completions` 改成 `/v1/responses`，读取结果从 `choices[0].message.content` 改为 `response.output_text`；如果用到推理、工具或多模态输出，就遍历 `response.output`，按每个条目的 `type` 分别处理。

### 2. 选一种多轮对话方式

- **`previous_response_id`**：把上一次响应的 ID 传进来，由 OpenAI 维护上下文。注意它**不会继承上一次的 `instructions`**，每次请求都要重新带上；
- **手动回传**：把上一次的 `output` 条目追加到下一次的 `input` 里，适合需要自己裁剪上下文的场景；
- **Conversations API**：需要一个持久的对话对象时使用。

```python
first = client.responses.create(model="gpt-6-astra", input="法国的首都是哪里？")
second = client.responses.create(
    model="gpt-6-astra",
    previous_response_id=first.id,
    input="那里的人口大约多少？",
)
print(second.output_text)
```

计费提醒：用 `previous_response_id` 并不能省掉之前上下文的费用，链条里之前的输入 token 仍按输入 token 计费。

### 3. 决定要不要存储

Responses 默认存储响应。不想存就设 `store: false`；这时如果还要跨轮延续推理，需要把每次返回的推理条目（带 `encrypted_content`）原样回传。零数据保留（ZDR）组织会被强制 `store: false`。

### 4. 改函数定义和返回

函数定义从「外层 `function` 包一层」改为字段直接平铺；函数调用和函数结果是两种独立的条目，靠 `call_id` 对应。Chat Completions 的函数默认非严格，Responses 不写 `strict` 会先尝试严格模式，想保持非严格就显式写 `strict: false`。

### 5. 改结构化输出和流式处理

`response_format` 改为 `text.format`；流式处理从读 `delta` 块改为按事件类型分支，常用事件有 `response.created`、`response.output_text.delta`、`response.completed` 和 `error`。

### 6. 能用内置工具就用内置工具

原来自己实现的网页搜索、文件检索、代码执行，可以考虑换成 Responses 的内置工具（工具调用会另外计费，见价格页）。

## 迁移时最常见的错误

官方迁移指南列出的坑：

- 还在读 `choices[0].message.content`；
- 把 `output` 里的每一项都当成消息，忽略了推理、工具调用等其他类型；
- 手动拼上下文时丢了推理条目、函数调用或函数结果条目；
- 回传函数结果时没带对应的 `call_id`；
- 在 Responses 请求里继续用 `response_format`；
- 直接复用 Chat Completions 的流式处理代码；
- 以为用了 `previous_response_id` 之前的上下文就不收费。

## 常见问题

**Q：Chat Completions 会被下线吗？**
截至 2026-10-07，官方文档写的是「仍然支持」，README 写的是「长期支持」，Deprecations 页面没有 Chat Completions 的下线计划。但新功能优先在 Responses 上提供。

**Q：Assistants API 的数据怎么办？**
Assistants API 已于 2026-08-26 下线，官方提供了 Assistants 到 Conversations 的迁移指南，迁到 Responses API 和 Conversations API。

**Q：Responses API 和 Agents API 是什么关系？**
Agents API（Beta）是另一种更上层的接口：由 OpenAI 托管一个 Codex 智能体的会话，可以在沙盒里跑代码、改文件，并在同一会话里继续任务，模型请求按所选模型的 API 价格计费。只需要「发一次请求拿一次回答」或自己编排工具调用，用 Responses 就够了。

**Q：Playground 里调的是哪个接口？**
Playground 可以在 Responses 和 Chat Completions 两种模式之间使用，调用同样计入 API 费用，见 [/guides/openai-playground](/guides/openai-playground)。

## 参考资料

- OpenAI 开发者文档：Migrate to the Responses API — https://developers.openai.com/api/docs/guides/migrate-to-responses
- OpenAI API Reference：Create a response — https://developers.openai.com/api/reference/resources/responses/methods/create
- OpenAI 开发者文档：Text generation — https://developers.openai.com/api/docs/guides/text
- OpenAI 开发者文档：Conversation state — https://developers.openai.com/api/docs/guides/conversation-state
- OpenAI 开发者文档：Deprecations（Assistants API）— https://developers.openai.com/api/docs/deprecations
- openai-python 官方仓库 README — https://github.com/openai/openai-python
- OpenAI 帮助中心：Agents API (beta) FAQ — https://help.openai.com/en/articles/20001551-agents-api-beta-faq

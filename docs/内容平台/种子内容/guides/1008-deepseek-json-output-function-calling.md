---
title: DeepSeek API 的 JSON 输出与 Function Calling 怎么用：参数、示例与 strict 模式
slug: deepseek-json-output-function-calling
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API 怎么让模型输出合法 JSON、怎么做 Function Calling（工具调用）？按官方 JSON Output 与 Tool Calls 文档（2026-10-24 查询）讲清参数、注意事项、完整调用流程和 strict 模式支持的 Schema，附常见坑。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/guides/json_mode
  - https://api-docs.deepseek.com/zh-cn/guides/tool_calls
  - https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
verify:
  - JSON Output 的使用要点和「可能返回空 content」的说明取自官方 JSON Output 文档（2026-10-24）；官方说正在优化这一问题，本文不预测何时解决
  - strict 模式标注为 Beta，需要把 base_url 设为 https://api.deepseek.com/beta；其支持的类型和参数限制取自官方文档，Beta 功能可能变化
  - 价格页功能表显示 deepseek-flash 与 deepseek-v4-pro 都支持 Json Output 和 Tool Calls
---

> 本文根据 DeepSeek 官方 JSON Output 与 Tool Calls 文档整理，资料核对于 2026-10-24。Beta 功能可能变化，以官方文档为准。图为本站整理的示意图。

## 适用于谁

- 想让模型输出可以直接 `json.loads` 的结果，写数据提取、分类、表单解析的开发者；
- 想让模型调用自己的函数（查天气、查订单、查数据库）的人；
- 在做 Agent，被「工具调用返回 400」卡住的人。

## 结论先说

1. **两个模型都支持 JSON Output 和 Tool Calls**（官方价格页功能表）。
2. **JSON Output** 的做法：`response_format` 设为 `{"type": "json_object"}`，**提示词里必须有「json」字样并给出期望格式的样例**，`max_tokens` 要够大。官方提醒：API 有概率返回空的 `content`，可以尝试修改提示词缓解。
3. **Tool Calls** 的关键：**模型不会真的执行函数**。它只告诉你「要调哪个函数、参数是什么」，函数由你来写、你来执行，再把结果交回去。
4. **带 tools 的思考模式**：历史的 `reasoning_content` 必须完整回传，否则 400，见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。

![JSON Output 与 Tool Calls 怎么选](seed:g1008-deepseek-json-vs-tools-compare.png)
*图：本站根据 [DeepSeek 官方 JSON Output](https://api-docs.deepseek.com/zh-cn/guides/json_mode) 与 [Tool Calls](https://api-docs.deepseek.com/zh-cn/guides/tool_calls) 文档整理的示意图*

## 一、JSON Output

### 要点（官方注意事项）

- 设置 `response_format={'type': 'json_object'}`；
- 用户传入的 system 或 user 提示词里**必须含有「json」字样**，并给出希望输出的 JSON 格式样例，来指导模型输出合法 JSON；
- 合理设置 `max_tokens`，防止 JSON 被中途截断；
- 可能返回空 `content`，可以尝试修改提示词。

### 官方示例（Python）

```python
import json
from openai import OpenAI

client = OpenAI(api_key="<你的 Key>", base_url="https://api.deepseek.com")

system_prompt = """
The user will provide some exam text. Please parse the "question" and "answer" and output them in JSON format.

EXAMPLE INPUT:
Which is the highest mountain in the world? Mount Everest.

EXAMPLE JSON OUTPUT:
{
    "question": "Which is the highest mountain in the world?",
    "answer": "Mount Everest"
}
"""
user_prompt = "Which is the longest river in the world? The Nile River."

response = client.chat.completions.create(
    model="deepseek-flash",
    messages=[{"role": "system", "content": system_prompt},
              {"role": "user", "content": user_prompt}],
    response_format={'type': 'json_object'},
)
print(json.loads(response.choices[0].message.content))
```

模型会输出 `{"question": "Which is the longest river in the world?", "answer": "The Nile River"}`。

### 实用建议

- 解析前先判断 `content` 是否为空，为空就重试（可以换个说法再发一次）；
- 解析失败时记录原始返回，便于排查；
- 字段多时在样例里把每个字段都写出来，比只写文字描述更稳。更通用的结构化输出做法见 [/guides/llm-json-structured-output-reliable](/guides/llm-json-structured-output-reliable)。

## 二、Function Calling（Tool Calls）

![Function Calling 的 4 个来回](seed:g1008-deepseek-tool-calls-steps.png)
*图：本站根据 DeepSeek 官方 Tool Calls 文档整理的示意图*

### 官方示例的流程

官方示例以「获取天气」为例：

1. 用户问「杭州现在天气怎么样」，你的请求里带上 `tools`（函数名 `get_weather`，参数 `location`）；
2. 模型返回 `tool_calls`，内容是调用 `get_weather({location: 'Hangzhou'})`；
3. 你自己执行 `get_weather`，把结果以 `role: "tool"` 的消息（带上 `tool_call_id`）追加到 messages，再请求一次；
4. 模型返回自然语言，比如「杭州现在的气温是 24°C」。

官方特别注明：**示例里 `get_weather` 的功能要由用户提供，模型本身不执行具体函数。**

非思考模式下，官方示例这样关闭思考：`extra_body={"thinking": {"type": "disabled"}}`。思考模式下同样支持工具调用，模型可以在给出最终答案前多轮思考与调用工具；此时要把含 `reasoning_content` 的整条 `message` 追加回 messages（`messages.append(response.choices[0].message)`）。

### 对话中间插入工具调用

有些 Agent 场景要把「不是模型生成的」工具调用及结果插入对话历史的中间。官方说明：Anthropic API 与 Responses API 支持，也支持在中间插入 system 消息；Chat Completion 接口**不支持**在中间插入工具调用，但支持插入 system 消息。

## 三、strict 模式（Beta）

strict 模式下，模型输出函数调用时会严格遵循你定义的 JSON Schema，确保输出符合定义。要使用它，需要：

1. 把 `base_url` 设为 `https://api.deepseek.com/beta` 来开启 Beta；
2. `tools` 列表里**所有 function 都要设置 `strict: true`**；
3. 服务端会校验你的 Schema，不符合规范或包含不支持的类型会返回错误信息。

官方列出的 strict 模式支持的类型：object、string、number、integer、boolean、array、enum、anyOf。几条限制：

- **object**：所有属性都要设为 `required`，且 `additionalProperties` 必须为 `false`；
- **string**：支持 `pattern` 和 `format`（email、hostname、ipv4、ipv6、uuid），不支持 `minLength`、`maxLength`；
- **number / integer**：支持 `const`、`default`、`minimum`、`maximum`、`exclusiveMinimum`、`exclusiveMaximum`、`multipleOf`；
- **array**：不支持 `minItems`、`maxItems`；
- 还支持 `enum`、`anyOf`，以及用 `$def` 与 `$ref` 复用和定义递归结构。

## 四、常见坑

| 现象 | 原因与办法 |
| --- | --- |
| 解析 JSON 失败，内容被截断 | `max_tokens` 太小，调大 |
| `content` 是空的 | 官方说有概率发生；换个提示词重试 |
| 工具调用后第二次请求 400 | 思考模式下没有完整回传 `reasoning_content`（带 tools 的请求，之后所有请求都要回传） |
| strict 报 Schema 错误 | 检查是否用了不支持的参数（如 minLength）、是否缺 `required` 或 `additionalProperties: false` |
| 想在 Chat Completion 里中途插入工具调用 | 不支持，改用 Anthropic 或 Responses 接口 |

其他报错的含义见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 常见问题

**Q：JSON Output 和 strict 工具调用是同一回事吗？**
不是。前者约束的是回答文本的 JSON 合法性；后者约束的是函数调用的参数符合 Schema。

**Q：Claude 的 tool use 能参考吗？**
概念相同，本站有 [/guides/claude-tool-use-basics](/guides/claude-tool-use-basics)；DeepSeek 的 Anthropic 兼容接口里 `tools`、`tool_choice` 大部分被支持（`disable_parallel_tool_use` 被忽略）。

**Q：Python 完整入门在哪？**
见 [/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)。

> 想同时用 ChatGPT、Claude 等海外模型做对比？本站提供 [AI 会员充值](/chongzhi)，ChatGPT 可看 [Plus 充值](/chongzhi/chatgpt-plus)。

## 参考资料

- DeepSeek API 文档：JSON Output — https://api-docs.deepseek.com/zh-cn/guides/json_mode
- DeepSeek API 文档：Tool Calls — https://api-docs.deepseek.com/zh-cn/guides/tool_calls
- DeepSeek API 文档：思考模式 — https://api-docs.deepseek.com/zh-cn/guides/thinking_mode
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing

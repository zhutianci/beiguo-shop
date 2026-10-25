---
title: DeepSeek 的 Responses API 与 Anthropic 兼容接口怎么用：Base URL、模型映射与不支持的参数
slug: deepseek-responses-api-anthropic-compatible
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 支持 Responses API 和 Anthropic 接口吗？支持。按官方文档（2026-10-24 查询）讲清两种格式的 Base URL、调用示例、claude 模型名映射，以及哪些参数不支持、会被静默忽略，帮你判断工具能不能接。
checkedOn: 2026-10-24
sources:
  - https://api-docs.deepseek.com/zh-cn/guides/responses_api
  - https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/updates
verify:
  - 调用示例、兼容性表格取自 DeepSeek 官方 Responses API 与 Anthropic API 文档（2026-10-24）；兼容性细节会随版本更新，以官方文档为准
  - Responses API 文档写明不支持的参数会被静默忽略、不会报错；这意味着「传了不报错」不等于「生效了」，本文只转述
  - Anthropic 接口里 claude-opus 开头的模型名映射到 deepseek-v4-pro 并按 V4 Pro 价格计费、claude-haiku 与 claude-sonnet 开头的映射到 deepseek-flash，取自官方文档；映射规则可能调整
  - 本文没有实际调用测试
---

> 本文根据 DeepSeek 官方 Responses API 与 Anthropic API 文档整理，资料核对于 2026-10-24。兼容性细节可能更新，以官方为准。图为本站整理的示意图。

## 适用于谁

- 搜「deepseek response api」「deepseek responses api」「deepseek anthropic api」的开发者；
- 手里的工具只支持 OpenAI Responses 格式或 Anthropic 格式，想知道能不能接 DeepSeek 的人；
- 迁移代码，想知道哪些参数还能用的人。

## 结论先说

1. **DeepSeek 提供三种接口格式**：OpenAI Chat Completions、Responses API、Anthropic Messages。官方价格页功能表里，两个模型对 Responses API 和 Anthropic API 都标「支持」。
2. **Base URL**：OpenAI 格式和 Responses 格式用 `https://api.deepseek.com`；Anthropic 格式用 `https://api.deepseek.com/anthropic`。
3. **Responses API 是为 Codex 适配的**：官方 2026-08-13 更新日志说，DeepSeek API 原生支持 OpenAI Responses API 格式，并针对性适配 Codex。
4. **不支持的参数会被静默忽略**，不会报错。迁移时要逐个核对，不能以为「没报错就生效」。

![DeepSeek 的三种接口格式](seed:g1014-deepseek-three-api-formats-compare.png)
*图：本站根据 [DeepSeek 官方价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing) 整理的示意图*

## 一、Responses API

### 调用示例（官方）

```python
from openai import OpenAI

client = OpenAI(api_key="<你的 DeepSeek API Key>", base_url="https://api.deepseek.com")

response = client.responses.create(
    model="deepseek-flash",
    instructions="You are a helpful assistant.",
    input="Hi, how are you?",
)
print(response.output_text)
```

流式输出设置 `stream=True`：响应以语义化的 SSE 事件序列返回，每个事件带事件类型和递增的 `sequence_number`；流以 `response.completed`、`response.incomplete` 或 `response.failed` 事件结束，**没有 `data: [DONE]` 消息**。官方列出了完整事件列表，包括输出文本增量、思维链文本增量、函数调用参数增量、服务端 web_search 调用等。

### 图片输入

`deepseek-flash` 支持通过 Responses API 传图片：`input_image` 内容块，用 `image_url`（http(s) 链接或 base64 data URL）或 `file_id`（Files API 上传的图片）二选一。`image_url` 和 `file_id` 都传或都不传会返回 400。图片只允许放在 user / developer 消息里，system 或 assistant 消息里的图片返回 400。限制数字与 Chat Completions 一致，见 [/guides/deepseek-context-length-output-limit](/guides/deepseek-context-length-output-limit)。

### 不支持或被忽略的参数（官方兼容性表）

- **不支持**：`previous_response_id`、`conversation`（接口是**无状态**的，每次请求要自己带完整历史）、`store`（响应里恒为 false）、`background`、`metadata`、`include`、`prompt`、`truncation`（输入超出上下文窗口时返回 400）、`service_tier`、`safety_identifier`、`prompt_cache_key`、`context_management`、`stream_options` 等；
- **部分支持**：`reasoning` 只支持 `effort`，`summary` 可传入但不生成摘要；`text` 的 `format` 完整支持，`verbosity` 可传入但不生效；
- **忽略**：`parallel_tool_calls`（并行工具调用始终开启）、`max_tool_calls`；
- **支持**：`model`、`input`、`instructions`、`stream`、`temperature`（范围 0–2，思考模式下不生效）、`max_output_tokens`、`top_logprobs`、`tools`、`tool_choice`、`user`。

工具方面：`function` 支持；`custom` 仅支持名为 `apply_patch` 的（用于 Codex 兼容），其他名字返回 400；`web_search` 只有 `deepseek-v4-pro` 支持，`deepseek-flash` 下被忽略；`file_search`、`code_interpreter`、`computer_use`、`mcp` 等内置工具被忽略。

思考强度在 Responses 格式里写成 `reasoning.effort`（`none` 表示关闭），详见 [/guides/deepseek-thinking-mode-reasoning-effort](/guides/deepseek-thinking-mode-reasoning-effort)。Codex 的完整接入步骤见 [/guides/deepseek-codex-setup](/guides/deepseek-codex-setup)。OpenAI 自家 Responses API 的用法可对照 [/guides/openai-responses-api](/guides/openai-responses-api)。

## 二、Anthropic 兼容接口

### 配置与调用（官方）

安装 Anthropic SDK（`pip install anthropic`），配置环境变量：

```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_API_KEY=${YOUR_API_KEY}
```

调用：

```python
import anthropic

client = anthropic.Anthropic()
message = client.messages.create(
    model="deepseek-flash",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": [{"type": "text", "text": "Hi, how are you?"}]}],
)
print(message.content)
```

接入 Claude Code 的步骤见 [/guides/deepseek-claude-code-setup](/guides/deepseek-claude-code-setup)。

### Claude 模型名映射

使用 Anthropic API 时，传入的 claude 模型名会被映射：

- `claude-opus` 开头 → `deepseek-v4-pro`（按 V4 Pro 价格计费）；
- `claude-haiku`、`claude-sonnet` 开头 → `deepseek-flash`；
- **不以 claude 开头的未知模型名返回 400**。

官方还说，这样映射后，在新版 Claude Desktop 应用的 developer 模式里，可以绕过应用对模型名的限制，只需改 base_url 和 api_key 就能接入 DeepSeek 模型（官方原话大意；具体操作请看官方文档，本文不展开，也没有测试）。

### 兼容性细节（官方）

![兼容接口里要留意的几点](seed:g1014-deepseek-compat-decide.png)
*图：本站根据 DeepSeek 官方 Responses API 与 Anthropic API 文档整理的示意图*

- **HTTP 头**：`x-api-key` 完全支持；`anthropic-version` 忽略；`anthropic-beta` 在 `/messages` 忽略，但 `source.type` 为 `file` 的图片必须携带 `files-api-2025-04-14`，Files API 端点也必须携带；
- **字段**：`model` 改用 DeepSeek 模型；`max_tokens`、`stop_sequences`、`stream`、`system` 完全支持；`temperature` 支持（0–2）；`thinking` 支持，但 `budget_tokens` 被忽略；`output_config` 只支持 `effort`；`metadata` 支持 `user_id`；`container`、`mcp_servers`、`service_tier`、`top_k` 忽略；
- **工具**：`tools` 的 name、input_schema、description 完全支持，`cache_control` 忽略；`tool_choice` 的 none 完全支持，auto、any、tool 支持但 `disable_parallel_tool_use` 被忽略；
- **内容块**：文本、图片（base64、url、file）、thinking、tool_use、tool_result 支持；`document`、`search_result`、`redacted_thinking`、`code_execution_tool_result`、`mcp_tool_use`、`mcp_tool_result`、`container_upload` 不支持；`cache_control`、`citations` 忽略。

## 三、怎么选格式

官方没有规定该选哪种，下面是按用途的思路：

| 你的情况 | 建议 |
| --- | --- |
| 自己写脚本，已用 OpenAI SDK | Chat Completions 格式，改 base_url 和模型名即可 |
| 工具只支持 Responses（如 Codex） | Responses 格式，按官方 Codex 页面配置 |
| 工具只支持 Anthropic（如 Claude Code） | Anthropic 格式，Base URL 加 `/anthropic` |
| 需要多轮对话状态保存 | 三种接口都是无状态的，历史自己维护 |

## 常见问题

**Q：Responses API 能用 `previous_response_id` 接着聊吗？**
不能。官方明确不支持，要自己把历史消息拼进每次请求的 `input`。

**Q：Anthropic 接口能用 Claude 的文档上传吗？**
`document` 类型内容块不支持。要读文档，把文字内容放进 text 块里。

**Q：报 400 怎么办？**
对照 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。Claude 自家的 API 用法见 [/guides/claude-api-key-console](/guides/claude-api-key-console)。

**Q：想用 Claude 或 ChatGPT 官方模型？**
需要对应的会员或 API，会员可参考 [/chongzhi/claude-pro](/chongzhi/claude-pro)、[/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- DeepSeek API 文档：使用 Responses API — https://api-docs.deepseek.com/zh-cn/guides/responses_api
- DeepSeek API 文档：使用 Anthropic API — https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
- DeepSeek API 文档：模型 & 价格 — https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：更新日志 — https://api-docs.deepseek.com/zh-cn/updates

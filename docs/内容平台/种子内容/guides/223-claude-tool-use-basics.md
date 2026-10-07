---
title: Claude Tool Use（工具调用 / Function Calling）入门：定义工具与返回 tool_result
slug: claude-tool-use-basics
products: [claude]
models: []
accountTier: OTHER
excerpt: Claude API 工具调用（Function Calling）入门：工具定义三要素、tool_use / tool_result 往返循环、Python 完整示例、is_error、tool runner、服务器工具，以及常见报错原因。
checkedOn: 2026-10-07
sources:
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use
verify:
  - 「强制调用工具（tool_choice any / tool）在 Opus 5.5、Sonnet 5.5、Fable 5.1 上返回 400」取自 2026-10 官方 Define tools 页
---

> 本文根据 Claude API 官方文档的 Tool use 系列页面整理，核对日期 2026-10-07。示例代码基于官方 get_weather 示例改写。

## 适用于谁

- 想让 Claude 查数据库、调用内部接口、发邮件，也就是「让模型调用我的函数」的开发者；
- 搜「claude tool use」「claude function calling example」的人；
- 遇到报错「tool_use ids were found without tool_result blocks immediately after」的人。

基础调用方式详见本站《Claude API Python 入门：安装 SDK、第一个请求、流式输出与多轮对话》。

## 结论先说

1. **模型自己从不执行任何东西**：它只会返回一个结构化的「我要调用某某工具、参数是这些」的请求（`tool_use` 块），由**你的代码**去执行，再把结果用 `tool_result` 块发回去。
2. 工具定义三要素：`name`（名称）、`description`（说明）、`input_schema`（JSON Schema 格式的参数）。官方说**描述写得详细是影响效果的最重要因素**，每个工具建议至少写 3～4 句。
3. 标准循环：只要响应的 `stop_reason` 是 `"tool_use"`，就执行工具、把结果发回、继续请求；变成 `"end_turn"` 等其他值时结束。
4. `tool_result` 必须**紧跟**在对应的 `tool_use` 之后，并且在用户消息里**排在最前面**；每个 `tool_use` 都要有一个对应的 `tool_result`。违反这两条就会出现上面那个报错。
5. 不想自己写循环，可以用 SDK 的 **tool runner**（beta）；网页搜索、代码执行等**服务器工具**由 Anthropic 执行，你不用写 `tool_result`。

## 一、三类工具

| 类型 | 谁定义 schema | 谁执行 | 例子 |
| --- | --- | --- | --- |
| 自定义工具 | 你 | 你的代码 | 查订单、调内部 API |
| Anthropic 定义 schema 的客户端工具 | Anthropic | 你的代码 | memory、bash、text_editor、computer use、browser use |
| 服务器工具 | Anthropic | Anthropic | web_search、web_fetch、code_execution、tool_search |

第二类的好处是：模型针对这些固定的工具签名专门训练过，调用更可靠。

## 二、定义一个工具

```json
{
  "name": "get_weather",
  "description": "查询指定城市当前的天气。当用户询问某地现在的天气、气温时使用。只返回当前天气，不提供预报。",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {"type": "string", "description": "城市名，例如：上海"},
      "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "温度单位"}
    },
    "required": ["location"]
  }
}
```

- `name` 只能用字母、数字、下划线和短横线，最长 128 个字符；
- 官方的写法建议：说清楚工具**做什么、什么时候用（以及什么时候不用）、每个参数的含义、有什么限制**；相关操作合并成少量工具（用一个 `action` 参数区分），而不是一个动作一个工具；跨多个服务时给工具名加前缀（如 `github_list_prs`）；工具返回只给 Claude 需要的高价值信息；
- 想保证参数一定符合 schema，可以在工具定义里加 `strict: true`（严格工具调用）。

## 三、完整的调用循环（Python）

```python
import json
import anthropic

client = anthropic.Anthropic()

tools = [{
    "name": "get_weather",
    "description": "查询指定城市当前的天气。当用户询问某地现在的天气、气温时使用。",
    "input_schema": {
        "type": "object",
        "properties": {"location": {"type": "string", "description": "城市名"}},
        "required": ["location"],
    },
}]

def get_weather(location: str) -> str:
    # 这里换成你真实的天气接口
    return json.dumps({"location": location, "temperature": "22°C", "condition": "多云"}, ensure_ascii=False)

messages = [{"role": "user", "content": "杭州现在天气怎么样？"}]

while True:
    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    # 1. 把助手这一轮的完整回复（含 tool_use 块）加入历史
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":
        break  # end_turn / max_tokens 等：结束循环

    # 2. 执行每一个 tool_use，收集 tool_result
    results = []
    for block in response.content:
        if block.type == "tool_use":
            try:
                output = get_weather(**block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
            except Exception as e:
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": f"查询失败：{e}，请换个说法或稍后再试", "is_error": True})

    # 3. 把所有结果放在同一条 user 消息里发回去
    messages.append({"role": "user", "content": results})

print("".join(b.text for b in response.content if b.type == "text"))
```

循环的关键点（官方要求）：

- `tool_use` 块里有三样东西：`id`（用来对应结果）、`name`、`input`（符合你 schema 的参数）；
- `tool_result` 里填 `tool_use_id`、`content`（字符串，或文本 / 图片 / 文档内容块列表），出错时加 `"is_error": true`；
- **Claude 一次可能并行调用多个工具**：要把多个 `tool_result` 放在**同一条** user 消息里发回，而不是一条结果一轮；
- 同一条 user 消息里如果还想附加文字，文字必须放在所有 `tool_result` **之后**。

## 四、出错了怎么告诉 Claude

工具执行失败时，把错误信息放进 `content` 并设 `is_error: true`，Claude 会据此给用户解释或换个方式重试。官方建议错误信息写得**有指导性**：不要只写「失败」，而是写清楚出了什么问题、下一步该怎么做（例如「超出频率限制，60 秒后重试」）。

参数缺失之类的无效调用，也可以用带 `is_error` 的结果告诉它缺了什么，官方说明 Claude 通常会修正后再试 2～3 次。

## 五、让 SDK 帮你跑循环：tool runner

Python SDK 提供了 tool runner（beta），用装饰器从函数签名和文档字符串自动生成 schema，并自动处理调用循环：

```python
import json
from anthropic import Anthropic, beta_tool

client = Anthropic()

@beta_tool
def get_weather(location: str, unit: str = "celsius") -> str:
    """查询指定城市当前的天气。

    Args:
        location: 城市名，例如 上海
        unit: 温度单位，celsius 或 fahrenheit
    """
    return json.dumps({"temperature": "20°C", "condition": "晴"}, ensure_ascii=False)

runner = client.beta.messages.tool_runner(
    model="claude-opus-5-5",
    max_tokens=1024,
    tools=[get_weather],
    messages=[{"role": "user", "content": "巴黎现在天气如何？"}],
)
for message in runner:
    print(message)
```

需要人工审批、自定义日志或按条件执行时，官方建议还是用第三节的手写循环。

## 六、服务器工具：不用写 tool_result

以网页搜索为例，只要在 `tools` 里声明，Anthropic 会在服务器上执行搜索并把结果融进回答：

```python
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    tools=[{"type": "web_search_20260209", "name": "web_search"}],
    messages=[{"role": "user", "content": "火星车最近有什么新进展？"}],
)
```

响应里会出现 `server_tool_use` 块记录它做了什么。服务器工具有内部循环次数上限，达到上限时 `stop_reason` 会是 `"pause_turn"`，把对话（含这次的响应）原样再发一次即可让它继续。服务器工具除了 token 费用，还可能按使用次数另外计费（如网页搜索按搜索次数），见官方定价。

## 七、控制 Claude 用不用工具

- 默认 `tool_choice` 是 `{"type": "auto"}`：Claude 自己判断。想让它更积极地用工具，可以在系统提示里写「回答前先用工具调查」；想更克制，写「自行判断是否需要调用工具」；
- `{"type": "none"}`：本次不用工具；
- `{"type": "any"}` 或 `{"type": "tool", "name": "..."}`：强制调用工具。**注意**官方说明在 Opus 5.5、Sonnet 5.5、Fable 5.1 等新模型上强制调用会返回 400 错误，开启手动扩展思考时也不支持；这些情况下改用 `auto` 加严格工具调用，或用结构化输出。

用户没给全必填参数时，官方提到 Opus 更倾向于反问，Sonnet 有时会自己推测一个值——对关键参数，最好在描述里写明「缺少时先问用户」。

## 常见问题

**Q：报错「tool_use ids were found without tool_result blocks immediately after」？**
官方给出的原因有两个：有的 `tool_use` id 没有对应的 `tool_result`（并行调用了多个工具，你只回了一个）；或者 `tool_result` 不是 user 消息里的第一个内容块（前面放了文字）。解决：给助手回复里的**每一个** `tool_use` 都返回一个 `tool_result`，并把它们都放在文字之前；两条消息之间也不能插入其他消息。

**Q：工具调用会多花钱吗？**
会。`tools` 参数里的名称、描述、schema，以及 `tool_use`、`tool_result` 块都算输入 token；使用工具时 API 还会自动加一段工具调用专用的系统提示（官方页面列有各模型的 token 数）。

**Q：Claude 选错工具或乱编参数？**
官方排查建议：把工具描述写得更具体（何时用、何时不用）；参数格式复杂的可以加 `input_examples` 示例；需要保证格式时用 `strict: true`。

**Q：工具返回的内容安全吗？**
工具结果往往来自网页、邮件、用户上传等你控制不了的来源，可能藏有「提示词注入」。官方建议把这类不可信内容放在 `tool_result` 里，而不是放进 system 提示或普通用户文本。

**Q：想做能自己读文件、跑命令的智能体？**
可以直接用 Claude Agent SDK，它内置了这些工具和循环，详见本站《Claude Agent SDK 入门：是什么、怎么装、第一个智能体（Python / TypeScript）》。要接入现成的外部工具，也可以看 MCP，详见本站《MCP 是什么：Model Context Protocol 入门，以及在 Claude 里怎么用》。

## 参考资料

- Tool use with Claude（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- How tool use works（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- Define tools（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- Handle tool calls（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
- Tool runner (SDK)（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner
- Troubleshooting tool use（官方）：https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use

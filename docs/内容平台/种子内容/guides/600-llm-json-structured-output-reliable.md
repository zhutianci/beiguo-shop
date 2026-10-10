---
title: 如何让大模型稳定输出 JSON：结构化输出、JSON 模式与提示词写法（OpenAI / Claude）
slug: llm-json-structured-output-reliable
products: [chatgpt, claude]
models: []
accountTier: OTHER
excerpt: 怎么让大模型稳定输出 JSON？本文按 OpenAI 和 Anthropic 官方文档讲清三种做法的可靠程度：只靠提示词、JSON 模式、结构化输出（Structured Outputs），两家的参数写法、Schema 限制、拒答与截断这两种仍会出错的情况，以及聊天界面里的替代办法。
checkedOn: 2026-10-11
sources:
  - https://developers.openai.com/api/docs/guides/structured-outputs
  - https://platform.claude.com/docs/en/build-with-claude/structured-outputs
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
---

## 适用于谁

- 搜「如何让大模型稳定输出 json」「llm 结构化输出」「让模型输出结构化 json」的人；
- 程序里解析模型返回的 JSON 时，隔三差五遇到多了一段解释、少了一个字段、括号没闭合的人。

本文根据 OpenAI 和 Anthropic 的官方文档整理，资料核对于 2026-10-11。Gemini 的做法见站内《Gemini 结构化输出怎么用》。

## 结论先说

1. **有三个可靠程度不同的层级**：只靠提示词要求 < JSON 模式 < 结构化输出。
2. **能用结构化输出就用它**。它用你提供的 JSON Schema 约束生成过程，保证结果符合 Schema。OpenAI 的原话是建议「只要可能，就用结构化输出而不是 JSON 模式」。
3. **JSON 模式只保证「是合法 JSON」，不保证字段对**。
4. **结构化输出也有两种情况会不符合 Schema**：模型出于安全原因拒答，以及输出被长度上限截断。这两种都要在代码里判断。
5. **Claude 的旧办法「预填充」已经不能用了**。官方文档说明，从 Claude 4.6 系列起，在最后一条 assistant 消息里预填内容会返回 400 错误，要改用结构化输出。

## 三个层级的区别

| | 只靠提示词 | JSON 模式（OpenAI） | 结构化输出 |
| --- | --- | --- | --- |
| 输出是合法 JSON | 大多数时候 | 是 | 是 |
| 符合你指定的字段和类型 | 不保证 | 不保证 | 是 |
| 需要自己校验和重试 | 需要 | 需要 | 一般不需要（拒答和截断除外） |
| 适用 | 聊天界面、不支持该功能的模型 | 较旧的模型 | 支持的模型，优先选择 |

OpenAI 列出的结构化输出的三个好处：类型可靠，不用再校验和重试格式错误的回答；拒答可以被程序识别；提示词更简单，不需要用很重的措辞去强调格式。

Anthropic 的说法类似：不用结构化输出时，即使提示词写得很仔细，仍可能遇到 JSON 语法错误、缺少必填字段、数据类型不一致；结构化输出通过约束解码来保证结果符合 Schema。

## 步骤

### OpenAI：结构化输出

用官方 SDK 时，最省事的方式是用 Pydantic（Python）或 Zod（JavaScript）定义结构，交给 `parse` 方法：

```python
from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

class Invoice(BaseModel):
    seller: str
    total: float
    items: list[str]

response = client.responses.parse(
    model="模型名",          # 换成官方模型列表里支持结构化输出的模型
    input=[
        {"role": "developer", "content": "从用户提供的文本里提取发票信息。"},
        {"role": "user", "content": "……发票文字……"},
    ],
    text_format=Invoice,
)
print(response.output_parsed)
```

官方文档里的几条规则：

- 结构化输出有两种形式：用在**函数调用**里，或者用作**回答的格式**。要把模型接到你的工具、函数、数据上，用函数调用；只是想让模型按固定结构回答用户，用回答格式；
- 支持的是 JSON Schema 的一个**子集**。支持的类型有字符串、数字、布尔、整数、对象、数组、枚举和 anyOf；字符串可以加 `pattern` 和若干预定义的 `format`（如 `date-time`、`email`、`uuid`）；
- 官方给 Schema 设计的建议：键名清楚直观；给重要的键写清楚标题和描述；用评测来确定哪种结构最适合你的场景。

**JSON 模式**是更基础的版本，把格式设为 `json_object` 即可开启。两条官方的重要提醒：

- 必须在对话里明确要求模型输出 JSON（比如写在系统消息里）。不写的话，模型可能一直输出空白字符直到用完 token 上限；
- 它只保证能解析，不保证符合任何特定结构，需要你自己用校验库检查并重试。

### Claude：结构化输出

Anthropic 文档描述的流程是三步：定义 Schema → 放进请求的 `output_config.format`（`type` 为 `json_schema`）→ 从返回的文本内容块里读取符合 Schema 的 JSON。用 SDK 时，推荐的方式是把 Pydantic 模型传给 `client.messages.parse()`：

```python
from anthropic import Anthropic
from pydantic import BaseModel

client = Anthropic()

class ContactInfo(BaseModel):
    name: str
    email: str
    plan_interest: str

response = client.messages.parse(
    model="模型名",          # 换成官方文档列出的支持模型
    max_tokens=1024,
    messages=[{"role": "user", "content": "……邮件正文……"}],
    output_format=ContactInfo,
)
print(response.parsed_output)
```

Claude 这边同样有两种形式：JSON 输出（`output_config.format`）和严格工具调用（工具定义里加 `strict: true`），可以一起用。

官方列出的 Schema 限制，写 Schema 时最容易踩的几条：

- 对象的 `additionalProperties` 必须设为 `false`；
- **不支持**数值范围约束（`minimum`、`maximum`、`multipleOf`）和字符串长度约束（`minLength`、`maxLength`）；
- 不支持递归的 Schema；数组的 `minItems` 只支持 0 和 1；
- 用了不支持的特性会直接返回 400 错误，并说明原因。

范围和长度这类约束，写进字段的描述里让模型遵守，再在代码里校验。

### 两家都要处理的例外

即使开了结构化输出，下面两种情况的返回仍可能不符合 Schema：

| 情况 | OpenAI 怎么判断 | Claude 怎么判断 |
| --- | --- | --- |
| 模型出于安全原因拒答 | 输出内容的类型为 `refusal` | `stop_reason` 为 `refusal`（HTTP 状态码仍是 200） |
| 输出被长度上限截断 | 响应状态为 `incomplete`，原因是 `max_output_tokens` | `stop_reason` 为 `max_tokens` |

处理办法：拒答时按业务逻辑提示用户；截断时调高输出上限后重试。

Claude 文档还有两个细节值得知道：一是不保证枚举值的大小写完全一致，比较时最好先统一大小写；二是不要在 Schema 里设一个让模型「写出思考过程」的字段，可能触发拒答，官方建议改成要一段简短的说明。

### 不能用结构化输出时：提示词写法

在聊天界面里，或者用的模型不支持这个功能时，只能靠提示词。尽量做到这几点：

1. **给出完整的示例**，而不是只描述。把期望的 JSON 原样贴出来，字段名、类型、嵌套关系一目了然；
2. **明确边界**：「只输出 JSON，不要任何解释，不要用代码块包裹」。Anthropic 文档给出的消除开场白的写法是：直接回答，不要以「以下是……」「根据……」这类话开头；
3. **规定缺失值怎么填**：找不到的字段填 `null`，不要编造，也不要省略键；
4. **用标签包住输出**：让模型把 JSON 放在 `<json>` 标签里，程序只取标签内的内容；
5. **代码里做兜底**：解析失败时把报错信息连同原输出发回去让模型修正，最多重试两三次。

示例：

```
从下面的招聘信息中提取字段，严格按示例的 JSON 结构输出。
只输出 JSON，不要解释，不要用代码块。找不到的字段填 null。

示例：
{"company": "某某科技", "position": "数据分析师", "city": "杭州",
 "salary_min": 15000, "salary_max": 25000, "remote": false}

招聘信息：
<posting>
［粘贴内容］
</posting>
```

## 常见问题

**Q：结构化输出会让回答质量变差吗？**
官方文档没有给出这样的结论。需要注意的是字段顺序：两家文档都说明输出会按 Schema 里定义的顺序生成字段（Claude 另注明必填字段排在可选字段之前）。所以把「依据」这类字段排在「结论」字段前面，通常更合理。

**Q：字段很多、嵌套很深可以吗？**
两家都对 Schema 的复杂度有上限，具体数字以官方文档为准。能拆成两次调用的，不要硬塞进一个巨大的 Schema。

**Q：为什么以前在 Claude 上用的「预填一个左花括号」不灵了？**
Anthropic 文档说明：从 Claude 4.6 系列模型起，不再支持在最后一条 assistant 消息里预填充，带预填充的请求会返回 400 错误。官方给的迁移方向就是结构化输出，或者先直接要求模型按结构输出，新模型在这方面已经相当可靠。

**Q：国产模型、本地模型怎么办？**
看各自的文档是否提供 JSON 模式或结构化输出参数。兼容 OpenAI 接口的服务不一定完整支持，以实际返回为准；不支持时用上面的提示词写法加代码校验。

## 参考资料

- OpenAI 文档：Structured model outputs — https://developers.openai.com/api/docs/guides/structured-outputs
- Anthropic 文档：Structured outputs — https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic 文档：Prompting best practices（Migrating away from prefilled responses）— https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

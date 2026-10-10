---
title: Gemini 结构化输出（Structured Output）怎么用：JSON Schema、Pydantic 与 Zod 示例
slug: gemini-structured-output-json-schema
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: 想让 Gemini API 稳定返回可解析的 JSON，就用结构化输出。本文给出 Pydantic 和 Zod 的官方写法、枚举与可空字段、流式、和工具组合、支持的 Schema 范围与限制，以及新旧接口的参数差别。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/structured-output
  - https://ai.google.dev/gemini-api/docs/generate-content/structured-output
  - https://ai.google.dev/gemini-api/docs/quickstart
  - https://ai.google.dev/gemini-api/docs/openai
  - https://ai.google.dev/gemini-api/docs/troubleshooting
  - https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
  - https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/
  - https://github.com/googleapis/python-genai
verify:
  - 示例里的中文业务场景（订单提取、工单分类）是本文自拟的，response_format 的结构、Pydantic / Zod 的用法取自官方文档；代码未经实际运行
  - 旧版 generateContent 的参数写法官方有两种并存：2026-10-10 的文档页写 config 里的 response_format（text.mime_type + text.schema），SDK 仓库 README 和 2025-11 官方博客写 response_mime_type + response_json_schema；两种是否都长期保留，官方未说明
  - JavaScript 示例用到 z.fromJSONSchema，取自官方 Interactions 版文档；它需要较新版本的 Zod，官方文档只写「确保已安装 zod」，没有写最低版本
  - 「结构化输出与内置工具组合」官方标注为预览功能，仅 Gemini 3 系列支持
  - 官方没有公布 Schema 的大小或嵌套层数上限，只写「过大或嵌套过深可能被拒绝」
---

> 本文根据 Gemini API 官方文档（Structured outputs 的 Interactions 版与 generateContent 版、Quickstart、OpenAI compatibility、Troubleshooting guide）、官方 SDK 仓库和 Google 官方博客整理，资料核对于 2026-10-10。

## 适用于谁

- 想让 Gemini 返回固定字段的 JSON，再存数据库或传给下游程序的开发者；
- 搜「gemini structured output」「gemini api json schema」「json mode」「pydantic」的人；
- 以前靠在提示词里写「请只输出 JSON」，但总是遇到多余文字或字段缺失的人。

基础调用方法见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》。

## 结论先说

1. **结构化输出就是在请求里附一份 JSON Schema**，模型生成的文本会是符合这份 Schema 的 JSON 字符串。
2. **新版 Interactions API 的写法**：`response_format={"type": "text", "mime_type": "application/json", "schema": 你的Schema}`。
3. **Python 用 Pydantic、JavaScript 用 Zod 最省事**：用它们定义结构、导出 Schema，再用同一个定义校验返回结果。
4. **语法正确不等于内容正确**：官方提醒输出保证是合法 JSON，但字段的值仍要在程序里校验。
5. **只支持 JSON Schema 的一个子集**，过大或嵌套过深的 Schema 可能被拒绝。

## 一、什么时候用结构化输出

官方列的三类典型用途：

- **数据提取**：从一段文字里抽出姓名、日期、金额等字段；
- **结构化分类**：把文本归入预先定义好的类别；
- **智能体流程**：为工具或下游接口生成结构化的输入。

它和函数调用（function calling）都用到 JSON Schema，但目的不同。官方的区分是：结构化输出用来**规定最终回答的格式**；函数调用用于对话过程中**让模型请你执行某个动作**，拿到结果后它再继续回答。

## 二、Python：用 Pydantic 定义结构

```python
from typing import List, Literal, Optional

from google import genai
from pydantic import BaseModel, Field


class Item(BaseModel):
    name: str = Field(description="商品名称")
    quantity: int = Field(description="购买数量")


class Order(BaseModel):
    customer: str = Field(description="下单人姓名")
    items: List[Item]
    urgency: Literal["普通", "加急"] = Field(description="是否加急")
    note: Optional[str] = Field(description="备注，原文没有提到就为空")


client = genai.Client()

text = "王芳要订 3 箱矿泉水和 2 包 A4 纸，明天上午必须送到，送货前先打个电话。"

interaction = client.interactions.create(
    model="gemini-3.8-flash",
    input=f"请从下面这段话里提取订单信息：\n{text}",
    response_format={
        "type": "text",
        "mime_type": "application/json",
        "schema": Order.model_json_schema(),   # Pydantic 导出 JSON Schema
    },
)

order = Order.model_validate_json(interaction.output_text)   # 解析并校验
print(order.customer, order.urgency, [i.name for i in order.items])
```

几个写法要点：

- `Field(description=...)` 里的说明会进入 Schema，官方建议**用 description 告诉模型每个字段要什么**；
- `Literal[...]` 会变成 Schema 里的 `enum`，适合做分类；
- `Optional[...]` 表示这个字段可以是 `null`；
- `interaction.output_text` 是 JSON 字符串，用 `model_validate_json` 一步完成解析和类型校验。

## 三、JavaScript：JSON Schema 加 Zod 校验

官方 Interactions 版文档的写法是：先写一份 JSON Schema 传给 API，再用 Zod 从同一份 Schema 生成校验器。

```javascript
// 先安装：npm install @google/genai zod
import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const ticketJsonSchema = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["账单问题", "技术故障", "功能建议", "其他"],
      description: "工单类别",
    },
    summary: { type: "string", description: "一句话概括用户的问题" },
    need_reply: { type: "boolean", description: "是否需要人工回复" },
  },
  required: ["category", "summary", "need_reply"],
};

const ticketSchema = z.fromJSONSchema(ticketJsonSchema);   // 由同一份 Schema 生成校验器

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "请给这条用户反馈分类：『上个月被重复扣了两次费，麻烦尽快处理。』",
  response_format: {
    type: "text",
    mime_type: "application/json",
    schema: ticketJsonSchema,
  },
});

const ticket = ticketSchema.parse(JSON.parse(interaction.output_text));
console.log(ticket);
```

## 四、支持哪些 Schema 写法

官方文档说明，结构化输出支持 JSON Schema 规范的一个**子集**：

| 类别 | 支持的内容 |
| --- | --- |
| `type` | `string`、`number`、`integer`、`boolean`、`object`、`array`、`null`（可空写成 `{"type": ["string", "null"]}`） |
| 说明性字段 | `title`、`description` |
| 对象 | `properties`、`required`、`additionalProperties` |
| 字符串 | `enum`、`format`（如 `date-time`、`date`、`time`） |
| 数字 | `enum`、`minimum`、`maximum` |
| 数组 | `items`、`prefixItems`、`minItems`、`maxItems` |

官方示例还演示了 `anyOf`（让输出结构随内容变化，例如「垃圾信息」和「正常内容」返回不同字段）和递归结构（例如组织架构里员工下面还有员工）。Google 官方博客在介绍这项能力时提到，递归结构靠 `$ref` 实现，输出里字段的顺序会和 Schema 里键的顺序保持一致。

## 五、流式输出

结构化输出可以和流式一起用。官方说明，流里的文本片段是**合法的 JSON 局部字符串**，把它们按顺序拼起来就是完整的 JSON：

```python
stream = client.interactions.create(
    model="gemini-3.8-flash",
    input="……",
    response_format={
        "type": "text",
        "mime_type": "application/json",
        "schema": Order.model_json_schema(),
    },
    stream=True,
)

chunks = []
for event in stream:
    if event.event_type == "step.delta" and event.delta.type == "text":
        chunks.append(event.delta.text)

order = Order.model_validate_json("".join(chunks))
```

注意单个片段不是完整 JSON，要等流结束、拼接完成后再解析。

## 六、和搜索等工具一起用

官方文档有一节「Structured outputs with tools」，标注为**预览功能，仅 Gemini 3 系列支持**：可以把结构化输出和 Google 搜索接地、URL 上下文、代码执行、文件搜索以及函数调用组合，例如让模型先联网查资料，再按你的 Schema 返回结果。写法是在同一个请求里同时传 `tools` 和 `response_format`：

```python
interaction = client.interactions.create(
    model="gemini-3.1-pro-preview",
    input="……",
    tools=[{"type": "google_search"}, {"type": "url_context"}],
    response_format={
        "type": "text",
        "mime_type": "application/json",
        "schema": MatchResult.model_json_schema(),   # MatchResult 是你自己定义的 Pydantic 类
    },
)
```

## 七、限制与官方建议

**限制（官方原话的意思）：**

- **只是子集**：不是所有 JSON Schema 特性都支持；旧版文档补充说，不支持的属性会被模型忽略。
- **复杂度**：非常大或嵌套很深的 Schema 可能被 API 拒绝。遇到报错时，官方建议缩短属性名、减少嵌套、减少约束条件。

**最佳实践：**

- 用 `description` 把每个字段说清楚；
- 用具体的类型（`integer`、`string`、`enum`），不要什么都用字符串；
- 提示词里仍然要说明任务本身；
- **校验值**：输出是语法正确的 JSON，但内容是否合理要自己检查，并为「符合 Schema 但语义不对」的情况准备处理逻辑。

官方 SDK 仓库的 README 还有一条提醒：不管用哪种方式定义了 Schema，**不要在提示词里再重复一遍**（包括给出期望 JSON 的示例），否则输出质量可能下降。

**官方排错页里和结构化输出有关的两条：**

- 输出里反复出现重复文本：可能是提示词里指定的字段顺序和 Schema 不一致。建议不要在提示词里规定字段顺序，并把所有输出字段设为必填。
- 输出里出现大量重复的换行符：通常是输入里带了 `\u`、`\t` 这类转义序列。建议把它们换成 UTF-8 字符，并在系统指令里说明允许的转义只有 `\\`、`\n` 和 `\"`。

另外，从 Gemini 3.6 Flash、3.5 Flash-Lite 起，「预填回复开头」（让请求以一段模型角色的内容结尾，比如预先写一个左花括号来逼模型输出 JSON）已不被支持，会返回 400。官方给的替代方案正是系统指令和结构化输出。

## 八、旧版接口和 OpenAI 兼容写法

**旧版 generateContent**：官方文档页现在的写法是把 `response_format` 放进 `config`，结构多一层 `text`：

```python
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents="……",
    config={
        "response_format": {
            "text": {"mime_type": "application/json", "schema": Order.model_json_schema()}
        },
    },
)
order = Order.model_validate_json(response.text)
```

你在较早的官方资料（SDK 仓库 README、2025 年 11 月的官方博客）里还会看到另一种写法：`config` 里写 `response_mime_type: "application/json"` 加 `response_json_schema`。读旧代码时知道两者是一回事即可，新代码照当前文档页写。

旧版文档列出的支持模型包括 Gemini 3.8 Flash、3.6 Flash、3.5 Flash-Lite、3.1 Flash-Lite、3.1 Pro Preview 和 2.5 系列。

**OpenAI 兼容接口**：用 OpenAI SDK 调 Gemini 时，官方示例用的是 `client.beta.chat.completions.parse(..., response_format=你的Pydantic类)`，结果在 `completion.choices[0].message.parsed`。接入方法见本站《Gemini API 接口地址（Base URL）是什么：原生端点与 OpenAI 兼容调用写法》。

## 常见问题

**Q：结构化输出和「JSON 模式」是一回事吗？**
官方文档现在统一叫 Structured outputs（结构化输出），做法就是把 `mime_type` 设为 `application/json` 并在 `schema` 里给出结构。

**Q：返回的 JSON 一定能解析吗？**
官方的表述是输出为语法合法、符合 Schema 的 JSON 字符串。但有一种情况要防：如果设了很小的最大输出 token，回答可能被截断，官方说明这个上限包含思考 token。

**Q：字段的值不对怎么办？**
按官方的最佳实践，先把 `description` 写清楚、类型收紧（能用 `enum` 就不用自由文本）、在提示词里把任务说明白；程序里保留校验和兜底逻辑。

**Q：图片、PDF 也能提取成 JSON 吗？**
可以。把文件和提示一起放进 `input`，再加 `response_format`，传文件的方法见 Python 调用教程。旧版文档还链接了官方示例库里「从 PDF 发票和表单提取结构化数据」的例子。

## 参考资料

- Structured outputs（Interactions API 版，官方）：https://ai.google.dev/gemini-api/docs/structured-output
- Structured outputs（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Gemini API quickstart（官方）：https://ai.google.dev/gemini-api/docs/quickstart
- OpenAI compatibility（官方）：https://ai.google.dev/gemini-api/docs/openai
- Troubleshooting guide（官方）：https://ai.google.dev/gemini-api/docs/troubleshooting
- What's new in Gemini 3.6 Flash and 3.5 Flash-Lite（官方）：https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6
- Improving Structured Outputs in the Gemini API（Google 官方博客）：https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/
- googleapis/python-genai（官方 SDK 仓库）：https://github.com/googleapis/python-genai

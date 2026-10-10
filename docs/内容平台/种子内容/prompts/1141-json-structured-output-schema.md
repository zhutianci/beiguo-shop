---
title: 让 AI 稳定输出 JSON 的提示词（JSON Schema 约束、字段说明与示例、缺失值规则、程序端校验与失败重试）
slug: json-structured-output-schema
model: any-llm
topics: [prompt-engineering, coding]
needsRefImage: false
useCase: 需要让大模型输出程序能直接解析的 JSON（信息抽取、分类打标、生成配置），却经常遇到多了解释文字、字段名不对、类型错误、格式残缺时用：AI 帮你设计 JSON Schema 和对应的提示词，说明何时应改用 API 的结构化输出功能，并给出程序端的校验与重试代码。
prompt: |
  你是一名构建大模型应用的工程师，负责让模型稳定地输出结构化数据。请帮我设计 JSON 输出方案。

  - 任务：[任务]（例：从客服对话中抽取问题类型、订单号、用户诉求、情绪）
  - 期望的字段（名称、类型、含义、是否必填）：
    [字段说明]
  - 调用方式：[调用方式]（例：通过 API 调用，或在聊天界面手工使用）
  - 使用的模型或平台：[模型或平台]
  - 程序端语言：[程序语言]（例：Python、TypeScript）

  请输出：
  1. JSON Schema：类型、必填字段、枚举值、取值范围、字符串格式；不允许出现未定义的字段；能用枚举的不用自由文本。
  2. 方案选择：
     - 如果平台支持结构化输出或函数调用（工具调用）并能直接传入 Schema，优先使用，这是最稳定的方式；说明在我的平台上如何使用（以平台官方文档为准）；
     - 不支持时，用提示词约束（下面第 3 点）加程序端校验与重试。
  3. 提示词：
     - 明确要求「只输出 JSON，不要任何解释、前言或代码块标记」；
     - 给出 Schema 或字段说明，以及一个完整的示例输出；
     - 缺失值规则：信息不存在时填 null，不要猜测或编造；不确定时的处理方式（例如增加置信度字段）；
     - 需要推理的任务，可以先让模型在一个说明字段中写简短理由，再给结论字段——但要权衡这会增加长度。
  4. 程序端：
     - 解析前清理常见的多余内容（代码块标记、首尾空白）；
     - 用 Schema 校验（给出所用的校验库）；
     - 校验失败时，把错误信息连同原输出发回模型要求修正，最多重试 2 次；仍失败时记录并走兜底逻辑。
  5. 测试用例：信息缺失、多个候选值、输入很长、输入与任务无关，这几种情况下的期望输出。
negativePrompt: null
source: null
verify:
  - 用 20 段客服对话测试「仅提示词约束」与「平台结构化输出」两种方式的 JSON 解析成功率
  - 核对所用平台结构化输出的参数写法（OpenAI Structured Outputs、Anthropic 工具调用 / 结构化输出文档）
---
**怎么填变量**：[字段说明] 要写清每个字段的含义和取值范围，例如「问题类型：只能是退款、物流、质量、其他之一」。[调用方式] 很关键：通过 API 调用时，大多数主流平台都提供结构化输出或工具调用功能，可以直接约束输出格式，比单纯靠提示词可靠得多。

**常见坑**：
- 只在提示词里写「请输出 JSON」，模型偶尔加一句「好的，以下是结果」，或者把 JSON 包在代码块里，程序直接解析失败。
- 没有规定缺失值怎么处理，模型为了「填满」字段会编造订单号、日期。明确要求不存在就填 null。
- 只靠提示词、没有程序端校验，偶发的格式错误会直接导致线上报错。始终要校验，并准备好重试与兜底。
- 一些平台的新模型已不再支持通过「预先填写回答开头」来强制格式，应改用结构化输出功能或明确的指令（以平台文档为准）。

**追问技巧**：追问「这个 Schema 用在批量处理 1 万条数据时，怎么统计失败率并抽样人工检查」。

### 示例输出

> 示例，仅供参考（节选）

```json
{
  "type": "object",
  "properties": {
    "issue_type": { "type": "string", "enum": ["退款", "物流", "质量", "其他"] },
    "order_id": { "type": ["string", "null"], "pattern": "^O\\d{12}$" },
    "user_request": { "type": "string", "maxLength": 100 },
    "sentiment": { "type": "string", "enum": ["正面", "中性", "负面"] }
  },
  "required": ["issue_type", "order_id", "user_request", "sentiment"],
  "additionalProperties": false
}
```

```python
import json, jsonschema

def parse_with_retry(call_model, prompt, schema, retries=2):
    text = call_model(prompt)
    for attempt in range(retries + 1):
        try:
            data = json.loads(text.strip().removeprefix("```json").removesuffix("```").strip())
            jsonschema.validate(data, schema)
            return data
        except (json.JSONDecodeError, jsonschema.ValidationError) as e:
            if attempt == retries:
                raise
            text = call_model(f"{prompt}\n\n你上一次的输出：\n{text}\n\n校验错误：{e}\n请只输出修正后的 JSON。")
```

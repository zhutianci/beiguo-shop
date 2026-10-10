---
title: Gemini API 接口地址（Base URL）是什么：原生端点与 OpenAI 兼容调用写法
slug: gemini-api-base-url-openai-compatible
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: Gemini API 域名是 generativelanguage.googleapis.com。本文列出原生与 OpenAI 兼容端点的地址和鉴权方式、v1 与 v1beta 的区别，和用 OpenAI SDK 调 Gemini 的写法。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/openai
  - https://ai.google.dev/gemini-api/docs/api-versions
  - https://ai.google.dev/gemini-api/docs/quickstart
  - https://ai.google.dev/gemini-api/docs/generate-content/quickstart
  - https://ai.google.dev/gemini-api/docs/interactions-overview
  - https://ai.google.dev/gemini-api/docs/api-key
  - https://ai.google.dev/gemini-api/docs/files
  - https://ai.google.dev/gemini-api/docs/migrate-to-cloud
  - https://ai.google.dev/gemini-api/docs/available-regions
  - https://ai.google.dev/gemini-api/docs/api-errors
verify:
  - OpenAI 兼容层官方标注为 beta；文档只演示了 Chat Completions、图片生成、视频生成、Embeddings、Batch 和模型列表，没有提到是否支持 OpenAI 的 Responses API，正文按「文档未提及」处理
  - 官方 OpenAI 兼容页的 reasoning_effort 对照表仍以 Gemini 3.1 Pro、3.1 Flash-Lite、3 Flash 和 2.5 系列为列，没有单列 gemini-3.8-flash；正文只引用了通用规则
  - 官方 Quickstart 的 REST 示例带有 Api-Revision 请求头（值为 2026-05-20），而 Interactions 迁移说明写 2026-06-08 之后该请求头已被忽略；API key 页的 REST 示例不带这个请求头。正文示例未带
  - 兼容页个别示例（extra_body 一节）把 base_url 写成 https://generativelanguage.googleapis.com/v1beta/，与页面开头的 /v1beta/openai/ 不同，正文以页面开头的写法为准
---

> 本文根据 Gemini API 官方文档（OpenAI compatibility、API versions explained、Quickstart、Interactions API、Using Gemini API keys）整理，资料核对于 2026-10-10。本文只列官方公布的接口地址。

## 适用于谁

- 在第三方客户端或自己的代码里需要填「接口地址 / Base URL」，不确定 Gemini 官方地址是什么的人；
- 已经用 OpenAI SDK 写好了程序，想换成 Gemini 模型试试的开发者；
- 搜「gemini api 接口地址」「base url」「openai 兼容」「endpoint」的人。

## 结论先说

1. **官方域名只有一个**：`generativelanguage.googleapis.com`。
2. **原生接口的基础地址**是 `https://generativelanguage.googleapis.com/v1beta`（也有稳定版 `/v1`），鉴权用请求头 `x-goog-api-key`。
3. **OpenAI 兼容接口的 Base URL** 是 `https://generativelanguage.googleapis.com/v1beta/openai/`，鉴权用 `Authorization: Bearer 你的密钥`。
4. **用 OpenAI SDK 调 Gemini 只改三处**：`api_key` 换成 Gemini API 密钥，`base_url` 换成上面的兼容地址，`model` 换成 Gemini 的模型 ID。
5. **官方的态度**：兼容层还在 beta；如果你本来没在用 OpenAI 的库，官方建议直接调 Gemini API。

## 一、官方端点一览

| 用途 | 方法与地址 |
| --- | --- |
| 新版 Interactions API（官方推荐） | `POST https://generativelanguage.googleapis.com/v1beta/interactions` |
| 查询某次交互 | `GET https://generativelanguage.googleapis.com/v1beta/interactions/{交互ID}` |
| 旧版 generateContent | `POST https://generativelanguage.googleapis.com/v1beta/models/{模型ID}:generateContent` |
| 旧版流式 | `POST https://generativelanguage.googleapis.com/v1beta/models/{模型ID}:streamGenerateContent` |
| 文件列表（Files API） | `GET https://generativelanguage.googleapis.com/v1beta/files` |
| OpenAI 兼容：对话 | `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` |
| OpenAI 兼容：模型列表 | `GET https://generativelanguage.googleapis.com/v1beta/openai/models` |
| OpenAI 兼容：向量 | `POST https://generativelanguage.googleapis.com/v1beta/openai/embeddings` |

用官方 SDK（`google-genai`、`@google/genai`）时不需要自己填地址，SDK 已经内置。只有直接发 HTTP 请求，或者在别的工具里配置时才需要这些地址。

## 二、鉴权：两种请求头别混用

**原生接口**用 `x-goog-api-key`：

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-3.8-flash",
    "input": "用一句话介绍你自己"
  }'
```

**OpenAI 兼容接口**用 `Authorization: Bearer`：

```bash
curl "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GEMINI_API_KEY" \
  -d '{
    "model": "gemini-3.8-flash",
    "messages": [{"role": "user", "content": "用一句话介绍你自己"}]
  }'
```

两种方式用的是**同一把 Gemini API 密钥**，在 AI Studio 创建，方法见本站《Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制》。

## 三、v1 和 v1beta 有什么区别

官方《API versions explained》的说明：

- **v1 是稳定版**：其中的功能在这个大版本的生命周期内都受支持，有不兼容改动时会出新的大版本。官方说明 Interactions API 及其核心功能已在 v1 正式可用。
- **v1beta 包含仍在开发中的早期功能**，可能随反馈调整，好处是能先用上新能力。
- **所有模型在两个版本里都能用**，差别在功能：函数调用、结构化输出、思考、系统指令、代码执行、Google 搜索接地、URL 上下文、文件搜索等在 v1 和 v1beta 都有；语音输出、Flex / Priority 服务档、Computer Use、MCP 服务器工具、Live API、Agents API、Webhooks、上下文缓存目前只在 v1beta。
- **官方 SDK 默认用 v1beta**，以便访问预览功能。想固定用稳定版，可以这样指定：

```python
from google import genai

client = genai.Client(http_options={"api_version": "v1"})
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ httpOptions: { apiVersion: "v1" } });
```

排错时也要想到版本：官方排错页提醒，某个功能如果还在 Beta，就只能在 `/v1beta` 下使用；在旧版本端点上用新功能会报 400。

## 四、用 OpenAI SDK 调 Gemini（官方写法）

**Python：**

```python
from openai import OpenAI

client = OpenAI(
    api_key="你的 Gemini API 密钥",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

response = client.chat.completions.create(
    model="gemini-3.8-flash",
    messages=[
        {"role": "system", "content": "你是一个简洁的中文助手。"},
        {"role": "user", "content": "解释一下什么是向量数据库"},
    ],
)
print(response.choices[0].message.content)
```

**JavaScript：**

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const response = await openai.chat.completions.create({
  model: "gemini-3.8-flash",
  messages: [{ role: "user", content: "解释一下什么是向量数据库" }],
});
console.log(response.choices[0].message.content);
```

官方把它概括为「只改三行」：密钥、`base_url`、模型名。流式输出照常加 `stream=True`，逐块读取 `chunk.choices[0].delta`。

## 五、兼容接口支持什么

官方 OpenAI compatibility 页面演示过的能力：

| 能力 | 说明 |
| --- | --- |
| Chat Completions | 普通对话、流式、函数调用、图片理解、音频理解 |
| 结构化输出 | `client.beta.chat.completions.parse(..., response_format=Pydantic类)`；JavaScript 用 `zodResponseFormat` |
| 思考控制 | 用 OpenAI 的 `reasoning_effort` 参数，映射到 Gemini 的思考等级 |
| 图片生成 | `client.images.generate`，对应 `/openai/images/generations` |
| 视频生成 | 对应 `/openai/videos` |
| Embeddings | `/openai/embeddings` |
| Batch | 用 OpenAI 格式的 JSONL 创建批处理任务；官方注明文件的上传下载暂不兼容，需用 Gemini 自己的方式 |
| 模型列表 | `client.models.list()`、`client.models.retrieve("gemini-3.8-flash")` |
| 服务档位 | `service_tier="priority"` 或 `"flex"`，不传时默认为 `standard` |

关于思考：官方说明不传 `reasoning_effort` 时使用模型自己的默认等级；Gemini 2.5 Pro 和 Gemini 3 系列**不能关闭思考**（`"none"` 只对部分 2.5 模型有效）。

**Gemini 独有的功能**通过 `extra_body` 传。官方列出的字段里，对话接口可用的有 `cached_content`（对应上下文缓存）和 `thinking_config`（对应 Gemini 的思考配置）。

## 六、限制和选择建议

- **仍是 beta**：官方原话是对 OpenAI 库的支持仍处于 beta 阶段，功能还在扩展。
- **新功能不一定同步**：官方说明今后新模型、新工具和智能体功能会先在 Interactions API 上线。服务器端保存对话状态（`previous_interaction_id`）、后台执行、托管智能体这些都是原生接口的能力。
- **官方的建议**：还没用 OpenAI 库的，直接用 Gemini API；已有大量 OpenAI 代码、想低成本试用 Gemini 的，再用兼容层。
- **密钥还是同一把**：兼容接口用的就是 Gemini API 密钥，用量记在密钥所属的项目上；官方说明速率限制和计费都按项目计算，不区分密钥。

原生 SDK 的用法见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》。

## 常见问题

**Q：第三方客户端让我填 Base URL，填哪个？**
看它用的是哪种协议。按 OpenAI 格式发请求的，填 `https://generativelanguage.googleapis.com/v1beta/openai/`；按 Gemini 原生格式的，基础地址是 `https://generativelanguage.googleapis.com/v1beta`。具体填到哪一级路径，以该工具自己的说明为准。

**Q：模型名填什么？**
填官方 Models 页的模型 ID，例如 `gemini-3.8-flash`、`gemini-3.5-flash-lite`、`gemini-3.1-pro-preview`。可以调用模型列表接口确认自己的密钥能看到哪些模型。

**Q：返回 404？**
多半是地址或模型名不对：检查路径里的版本号（`v1beta`）、兼容接口是否漏了 `/openai/`、模型 ID 是否拼错或已下线。

**Q：返回 401 或提示密钥无效？**
检查请求头有没有用对：原生接口是 `x-goog-api-key`，兼容接口是 `Authorization: Bearer`。

**Q：这个地址和 Google Cloud 上的企业版是一回事吗？**
不是。官方把面向开发者的这套叫 Gemini Developer API（本文讲的就是它），另有面向企业的 Gemini 平台 API（Gemini Enterprise Agent Platform），两者都可以通过同一个 Google GenAI SDK 访问，但初始化方式不同（企业版要指定 Google Cloud 项目和区域）。官方的建议是多数开发者用 Gemini Developer API，除非需要特定的企业级管控。

**Q：这些地址在哪些地区可用？**
Gemini API 只在官方 Available regions 页面列出的国家和地区提供，该列表目前没有列出中国大陆。请遵守所在地法律和服务条款。

## 参考资料

- OpenAI compatibility（官方）：https://ai.google.dev/gemini-api/docs/openai
- API versions explained（官方）：https://ai.google.dev/gemini-api/docs/api-versions
- Gemini API quickstart（官方）：https://ai.google.dev/gemini-api/docs/quickstart
- Gemini API quickstart（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/quickstart
- Interactions API（官方）：https://ai.google.dev/gemini-api/docs/interactions-overview
- Using Gemini API keys（官方）：https://ai.google.dev/gemini-api/docs/api-key
- Files API（官方）：https://ai.google.dev/gemini-api/docs/files
- Gemini Developer API vs. Gemini platform（官方）：https://ai.google.dev/gemini-api/docs/migrate-to-cloud
- Available regions for Google AI Studio and Gemini API（官方）：https://ai.google.dev/gemini-api/docs/available-regions
- API errors（官方）：https://ai.google.dev/gemini-api/docs/api-errors

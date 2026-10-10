---
title: Gemini API Node.js / JavaScript 调用教程：@google/genai 安装、流式输出与函数调用
slug: gemini-api-nodejs-quickstart
products: [gemini]
models: [gemini-llm]
accountTier: OTHER
excerpt: 用官方 @google/genai SDK 在 Node.js 里调 Gemini API：安装配置、第一个请求、流式输出、多轮对话、传图片和函数调用的完整循环，并说明为什么密钥不能写进浏览器前端。
checkedOn: 2026-10-10
sources:
  - https://ai.google.dev/gemini-api/docs/quickstart
  - https://ai.google.dev/gemini-api/docs/generate-content/quickstart
  - https://ai.google.dev/gemini-api/docs/text-generation
  - https://ai.google.dev/gemini-api/docs/interactions-overview
  - https://ai.google.dev/gemini-api/docs/libraries
  - https://ai.google.dev/gemini-api/docs/migrate
  - https://ai.google.dev/gemini-api/docs/api-key
  - https://ai.google.dev/gemini-api/docs/files
  - https://ai.google.dev/gemini-api/docs/models
  - https://github.com/googleapis/js-genai
verify:
  - Node.js 版本要求两处不一致：官方 generateContent 版快速开始页写 Node.js v18+，SDK 仓库 README 写 Node.js 20 及以上，并预告 SDK 3.0.0 起需要 Node.js 22 及以上；正文按 20 及以上写
  - 环境变量名：官方 API key 页写 GEMINI_API_KEY 和 GOOGLE_API_KEY 都会被自动识别（后者优先），SDK README 只举了 GOOGLE_API_KEY 的例子
  - Interactions 调用失败时抛出的错误对象结构，README 的 ApiError 示例用的是 generateContent，正文的 try/catch 只打印通用字段
  - 示例模型 ID gemini-3.8-flash 取自 2026-10-10 的 Models 页和 Text generation 页；官方 Quickstart 页示例仍写 gemini-3.5-flash（弃用页写明会自动转到 gemini-3.6-flash）
---

> 本文根据 Gemini API 官方文档（Quickstart、Text generation、Interactions API、Using Gemini API keys、Files API）和官方 SDK 仓库 googleapis/js-genai 整理，资料核对于 2026-10-10。示例代码基于官方示例改写并加了中文注释。

## 适用于谁

- 用 Node.js 或 TypeScript 写后端、脚本，想接入 Gemini 的开发者；
- 搜「gemini api nodejs」「gemini api javascript」「@google/genai」的人；
- 想在网页里直接调 Gemini，但不确定密钥该放哪里的前端开发者。

Python 版见本站《Gemini API Python 调用教程：安装 google-genai SDK、流式输出、多轮对话与传图片》，两篇的概念一致，这里侧重 JavaScript 的写法和函数调用。

## 结论先说

1. **官方 SDK 的包名是 `@google/genai`**：`npm install @google/genai`。旧版 SDK `@google/generative-ai` 官方已标注为不再积极维护，并提供了迁移指南。
2. **入口是 `GoogleGenAI` 类**：`const ai = new GoogleGenAI({})`，然后调用 `ai.interactions.create({ model, input })`，文本结果在 `interaction.output_text`。
3. **参数名用下划线**：Interactions API 的字段在 JavaScript 里也是 `previous_interaction_id`、`system_instruction`、`generation_config` 这种写法。
4. **生产环境不要把密钥放进浏览器**：官方明确提示写在客户端代码里的密钥可以被提取，要在自己的服务器上调用。
5. **函数调用是一个循环**：模型返回 `function_call` → 你执行函数 → 把结果作为 `function_result` 传回去 → 直到模型不再要求调用。

## 一、安装与配置

```bash
mkdir gemini-node && cd gemini-node
npm init -y
npm pkg set type=module          # 用 ES 模块，才能写 import 和顶层 await
npm install @google/genai

export GEMINI_API_KEY="你的API密钥"   # Windows PowerShell: $env:GEMINI_API_KEY="你的API密钥"
```

- Node.js 版本：SDK 仓库 README 要求 20 及以上，并预告 3.0.0 版起需要 22 及以上。
- 官方说明 Interactions API 需要 `@google/genai` 2.3.0 及以上。
- 密钥的申请和环境变量设置见本站《Gemini API Key 怎么获取：在 AI Studio 创建密钥、设置环境变量与安全限制》。

## 二、第一个请求

新建 `index.js`：

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});   // 自动读取环境变量里的密钥

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  system_instruction: "你是一个简洁的中文助手。",
  input: "用三句话解释什么是向量数据库",
  generation_config: { thinking_level: "low" },   // 可选 low / medium / high
});

console.log(interaction.output_text);
console.log(interaction.usage);   // 输入、输出、思考 token 数
```

运行 `node index.js`。说明：

- 需要显式传密钥时写 `new GoogleGenAI({ apiKey: "你的API密钥" })`，官方建议只在没法用环境变量时这样做；
- `output_text` 是便捷属性，完整过程在 `interaction.steps` 数组里；
- `temperature`、`top_p`、`top_k` 在 Gemini 3.6 Flash、3.5 Flash-Lite 及之后的模型上已弃用并被忽略，不用再传。

## 三、流式输出

```javascript
const stream = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "写一段 200 字左右的秋天散文",
  stream: true,
});

for await (const event of stream) {
  // 文本片段在 step.delta 事件里
  if (event.event_type === "step.delta" && event.delta.type === "text") {
    process.stdout.write(event.delta.text);
  }
}
```

## 四、多轮对话

把上一轮的 `id` 传给 `previous_interaction_id`，历史由服务器管理：

```javascript
const first = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "我家里有 2 只狗。",
});

const second = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "那我家一共有多少只爪子？",
  previous_interaction_id: first.id,
});
console.log(second.output_text);
```

- 服务器只接续对话历史，`system_instruction`、`generation_config`、`tools` 每一轮都要重新传；
- 交互记录默认保存在服务器上，官方写明免费层保留 1 天、付费层保留 55 天；
- 不想保存就传 `store: false`，自己把完整历史（含模型返回的全部步骤）放进 `input`，写法见 Python 版教程里的「无状态」一节，结构完全相同。

## 五、传图片

```javascript
const uploaded = await ai.files.upload({
  file: "photo.jpg",
  config: { mimeType: "image/jpeg" },
});

const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: [
    { type: "text", text: "这张图里有什么？用中文描述。" },
    { type: "image", uri: uploaded.uri, mime_type: uploaded.mimeType },
  ],
});
console.log(interaction.output_text);
```

小文件也可以用 `fs.readFileSync("photo.jpg").toString("base64")` 读成 base64，写成 `{ type: "image", data: 这段base64, mime_type: "image/jpeg" }`。官方的界限：整个请求超过 100 MB（PDF 为 50 MB）必须走 Files API；上传的文件保存 48 小时。

## 六、函数调用：让模型用你的函数

函数调用（function calling）的流程是：你声明函数的名字和参数，模型决定什么时候调用并给出参数，你在本地执行后把结果传回去。下面是官方快速开始里的循环写法：

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

// 1. 声明工具：名字、说明、参数（JSON Schema）
const weatherTool = {
  type: "function",
  name: "get_current_temperature",
  description: "查询指定城市当前的气温。",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string", description: "城市名，例如 北京" },
    },
    required: ["location"],
  },
};

// 2. 你自己的函数实现（这里用假数据）
const availableFunctions = {
  get_current_temperature: ({ location }) => ({
    location, temperature: "22", unit: "celsius",
  }),
};

let input = "北京现在多少度？";
let previousId = null;
let interaction;

while (true) {
  interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input,
    tools: [weatherTool],                 // 每一轮都要带上工具声明
    previous_interaction_id: previousId,
  });

  // 3. 找出模型要求调用的函数，逐个执行
  const functionResults = [];
  for (const step of interaction.steps) {
    if (step.type === "function_call") {
      const result = availableFunctions[step.name](step.arguments);
      functionResults.push({
        type: "function_result",
        name: step.name,
        call_id: step.id,                 // 和这次调用的 id 对应
        result: [{ type: "text", text: JSON.stringify(result) }],
      });
    }
  }

  if (functionResults.length === 0) break;   // 模型不再调用函数，结束

  // 4. 把执行结果作为下一轮输入传回去
  input = functionResults;
  previousId = interaction.id;
}

console.log(interaction.output_text);
```

官方说明：模型要求调用函数时，这一轮返回的 `status` 是 `requires_action`；你提交结果后，才会得到 `completed` 的最终回答。Google 搜索、代码执行这类**内置工具**不需要这个循环，在 `tools` 里写 `{ type: "google_search" }` 即可，由服务器端执行。

## 七、为什么不能在浏览器里直接用密钥

SDK 可以在浏览器里初始化，但官方在 README 和 API key 页都给了同样的警告：

- 编译进网页或手机应用的密钥**可以被用户提取出来**；
- 正确做法是在自己的后端服务里调用 Gemini API，前端只和自己的后端通信；
- 在 AI Studio 的 Build 模式里生成的应用，官方说明密钥会自动配置成服务器端的密文（Secret），不会出现在客户端代码里。

## 常见问题

**Q：报 `Cannot use import statement outside a module`？**
`package.json` 里没有 `"type": "module"`。按第一节执行 `npm pkg set type=module`，或把文件扩展名改成 `.mjs`。

**Q：要用 TypeScript 怎么办？**
包名和导入写法相同。官方对这个 SDK 的正式称呼就是「Google Gen AI SDK for TypeScript and JavaScript」，两种语言共用一个包。

**Q：旧代码里的 `ai.models.generateContent` 还能用吗？**
能。官方把 generateContent 称为 legacy 接口但仍完全支持，写法是 `await ai.models.generateContent({ model, contents })`，结果在 `response.text`；多轮对话用 `ai.chats.create({ model })`。新项目官方建议用 Interactions API。

**Q：调用报错怎么排查？**
先用 `try { ... } catch (e) { console.error(e) }` 把完整错误打印出来，看 HTTP 状态码。429 是触发速率限制，见本站《Gemini API 429 错误怎么解决：RESOURCE_EXHAUSTED 的原因与 400 / 403 / 503 排查表》。

**Q：想让输出一定是 JSON？**
用结构化输出，配合 Zod 校验，见本站《Gemini 结构化输出（Structured Output）怎么用：JSON Schema、Pydantic 与 Zod 示例》。

## 参考资料

- Gemini API quickstart（官方）：https://ai.google.dev/gemini-api/docs/quickstart
- Gemini API quickstart（generateContent 版，官方）：https://ai.google.dev/gemini-api/docs/generate-content/quickstart
- Text generation（官方）：https://ai.google.dev/gemini-api/docs/text-generation
- Interactions API（官方）：https://ai.google.dev/gemini-api/docs/interactions-overview
- Gemini API libraries（官方）：https://ai.google.dev/gemini-api/docs/libraries
- Migrate to the Google GenAI SDK（官方）：https://ai.google.dev/gemini-api/docs/migrate
- Using Gemini API keys（官方）：https://ai.google.dev/gemini-api/docs/api-key
- Files API（官方）：https://ai.google.dev/gemini-api/docs/files
- Models（官方）：https://ai.google.dev/gemini-api/docs/models
- googleapis/js-genai（官方 SDK 仓库）：https://github.com/googleapis/js-genai

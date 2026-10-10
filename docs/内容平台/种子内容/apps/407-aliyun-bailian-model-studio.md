---
title: "阿里云百炼是什么、怎么用：大模型服务平台的 API 调用、应用搭建与 Coding Plan"
slug: aliyun-bailian-model-studio
name: 阿里云百炼
url: https://www.aliyun.com/product/bailian
pricing: 按量付费，新用户有免费额度
platforms: 网页控制台 / API
trialNote: 新用户在北京地域有专属的新人免费额度，用于体验模型调用
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "阿里云百炼是阿里云的一站式大模型开发与应用平台，可调用千问全系列以及 DeepSeek、Kimi、GLM 等第三方模型，接口兼容 OpenAI，并提供智能体、工作流、知识库和 Coding Plan。"
checkedOn: 2026-10-11
sources:
  - https://help.aliyun.com/zh/model-studio/what-is-model-studio
  - https://www.aliyun.com/product/bailian
---

> 本文根据阿里云帮助中心《什么是阿里云百炼》等官方文档整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

阿里云百炼（英文名 Model Studio）是阿里云的大模型服务平台。官方文档的说法是「一站式大模型开发与应用平台，集成千问及主流第三方模型」。对开发者来说，它就是**调用千问（Qwen）系列模型 API 的官方入口**；对不写代码的人来说，它也提供可视化的应用搭建。

## 能做什么

- **模型调用**：提供兼容 OpenAI 的 API。已有的 OpenAI 代码迁移过来，通常只需要改 API Key、base_url 和模型名三处。
- **模型种类**：千问全系列，以及 DeepSeek、Kimi、GLM 等第三方模型；覆盖文本生成、视觉理解、图像与视频生成、语音和向量等能力。
- **应用构建**：用可视化方式创建智能体和工作流应用，也支持把 Python 项目以高代码方式部署成后端服务。
- **知识库（RAG）**：接入私有数据和专业领域知识。
- **插件与 MCP**：通过插件和 MCP 调用外部服务。
- **Coding Plan**：固定月费、按月提供请求额度，用于在各类 AI 编程工具里接入模型。

## 怎么上手

1. 用阿里云账号登录百炼控制台，按提示开通服务（部分功能需要完成实名认证）。
2. 在控制台创建 API Key。
3. 在模型广场选一个模型，先在线体验，再复制示例代码。
4. 用 OpenAI SDK 调用时，把 base_url 换成百炼文档给出的兼容地址，模型名换成文档里的模型标识。

```python
from openai import OpenAI
client = OpenAI(api_key="你的百炼 API Key", base_url="文档给出的兼容地址")
resp = client.chat.completions.create(model="文档中的模型名", messages=[{"role": "user", "content": "你好"}])
print(resp.choices[0].message.content)
```

## 免费与付费

- **新人免费额度**：官方文档说明，新用户在北京地域有专属免费额度。未认证用户额度用完后无法继续调用，需认证并充值；已认证用户额度用完后会**自动转为按量付费**。
- **按量付费**：按各模型的输入、输出 Token 单价计费，价格见官方模型价格页。
- **Coding Plan**：固定月费的订阅，具体档位与价格以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 需要在国内合规地调用千问等模型的开发者和企业；
- 已经在用阿里云、希望账单和权限统一管理的团队；
- 想用 Coding Plan 给 AI 编程工具接国产模型的开发者。

**不适合：**
- 只想聊天的普通用户，直接用千问 App 即可；
- 不想管 API、密钥和账单的非技术用户；
- 需要调用 GPT、Claude、Gemini 等海外闭源模型的场景，百炼不提供这些模型。

## 注意事项

- **防止意外扣费**：已认证账号在免费额度用完后会直接按量计费，官方提供「免费额度用完即停」开关，建议第一时间打开。
- **地域不通用**：文档列出的地域有华北2（北京）、美国（弗吉尼亚）、新加坡、德国（法兰克福）、日本（东京）和中国香港，各地域的 Base URL 与 API Key 互不通用。
- **密钥别写进代码仓库**：用环境变量保存 API Key，泄露后及时在控制台作废。
- **模型版本更新快**：示例里的模型名会过期，以文档的模型列表为准。

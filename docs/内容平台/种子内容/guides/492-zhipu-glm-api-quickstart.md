---
title: 智谱清言API怎么用：GLM API Key获取、免费模型与Python调用
slug: zhipu-glm-api-quickstart
products: [ai-tools]
models: []
accountTier: OTHER
excerpt: 智谱清言的 API 怎么用？本文按智谱 AI 开放文档讲清在开放平台创建 API Key、用官方 SDK 发出第一个请求、GLM-5.3 等模型怎么选、哪些模型免费、深度思考参数怎么写，以及 401、429 等报错的处理。
checkedOn: 2026-10-11
sources:
  - https://docs.bigmodel.cn/cn/guide/start/quick-start
  - https://docs.bigmodel.cn/cn/guide/start/model-overview
  - https://docs.bigmodel.cn/cn/guide/capabilities/thinking
  - https://bigmodel.cn/usercenter/proj-mgmt/apikeys
---

## 适用于谁

- 搜「智谱清言的api怎么用」「智谱清言api」「智谱 api key」的开发者和想把 GLM 模型接进自己工具的人；
- 想找一个有免费模型可以练手的国内大模型 API 的人。

本文根据智谱 AI 开放文档（docs.bigmodel.cn）整理，资料核对于 2026-10-11。

## 结论先说

1. **「智谱清言」是面向普通用户的聊天产品，API 在另一个地方**：智谱开放平台 open.bigmodel.cn（bigmodel.cn），模型系列叫 GLM。
2. **三步跑通**：注册开放平台 → 在个人中心的 API Keys 页面创建 Key → 装官方 SDK `zai-sdk` 调用。
3. **有免费模型**。官方模型概览把 GLM-4.7-Flash、GLM-4.5-Flash 等标注为免费文本模型，适合练手和轻量任务。
4. **旗舰模型是 GLM-5.3**，上下文 1M、最大输出 128K；它的深度思考是强制开启的，传「关闭」会报错。
5. 价格、免费额度和限速会调整，以官方价格页和控制台为准。

## 步骤

### 1. 注册并创建 API Key

1. 打开智谱开放平台 open.bigmodel.cn，点右上角「注册 / 登录」；
2. 登录后进入个人中心的 **API Keys** 页面（bigmodel.cn/usercenter/proj-mgmt/apikeys），创建一个新的 Key；
3. 立刻复制保存。官方文档提醒不要把 Key 泄露给他人，建议放在环境变量或配置文件里，不要写死在代码中。

```bash
export ZHIPU_API_KEY="你的 Key"        # Windows PowerShell：$env:ZHIPU_API_KEY="你的 Key"
```

### 2. 安装官方 SDK，发出第一个请求

```bash
pip install zai-sdk
```

```python
import os
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key=os.environ["ZHIPU_API_KEY"])

resp = client.chat.completions.create(
    model="glm-5.3",
    messages=[
        {"role": "system", "content": "你是一个严谨的中文助手。"},
        {"role": "user", "content": "用三句话解释什么是大模型的上下文长度。"},
    ],
)
print(resp.choices[0].message.content)
```

旧项目里用的 `zhipuai` 包仍然可以安装，官方文档把它列为旧版 Python SDK，新项目用 `zai-sdk`。

不想装 SDK 时直接发 HTTP 请求：接口地址是 `https://open.bigmodel.cn/api/paas/v4/chat/completions`，请求头带 `Authorization: Bearer <你的 Key>`，请求体里写 `model` 和 `messages`，格式与常见的对话补全接口一致。

### 3. 选模型

官方模型概览（2026-10-11 核对）里常用的文本模型：

| 模型 | 定位 | 上下文 / 最大输出 | 是否免费 |
| --- | --- | --- | --- |
| GLM-5.3 | 旗舰，编程与智能体能力强 | 1M / 128K | 否 |
| GLM-5.2 | 复杂长程任务 | 1M / 128K | 否 |
| GLM-4.7 | 通用对话、推理与智能体 | 200K / 128K | 否 |
| GLM-4.7-FlashX | 轻量高速 | 200K / 128K | 否 |
| GLM-4.7-Flash | 免费文本模型 | 200K / 128K | 是 |
| GLM-4.5-Flash | 免费文本模型 | 128K / 96K | 是 |

除了文本模型，开放平台还有视觉理解（如 GLM-5.3-Flash、免费的 GLM-4.6V-Flash）、图像生成（GLM-Image、CogView 系列）、视频生成（CogVideoX 系列）和语音模型，调用方式见各模型的文档页。

选择思路：先用免费的 Flash 模型把流程跑通；效果不够再换 GLM-4.7 或 GLM-5.3；批量、低延迟的任务看 FlashX。请求里的 `model` 字段写小写的模型名（如 `glm-5.3`、`glm-4.7-flash`），确切写法以各模型文档页为准。

### 4. 控制深度思考

GLM-4.5 及以上的模型支持深度思考，通过请求里的 `thinking` 参数控制：

```python
resp = client.chat.completions.create(
    model="glm-4.5-flash",
    messages=[{"role": "user", "content": "把下面这句话翻译成英文：今天天气不错。"}],
    thinking={"type": "disabled"},     # 开启写 "enabled"
)
```

官方文档里几条必须知道的规则：

- 默认是开启的；思考过程在 `reasoning_content` 字段里返回，最终回答在 `content`；
- **GLM-5.3、GLM-5.3-Flash、GLM-4.7 是强制思考的模型**，其中官方明确写了 GLM-5.3 和 GLM-5.3-Flash 传 `disabled` 会报错；
- GLM-5.2、GLM-5.1、GLM-5、GLM-4.6、GLM-4.5 等会自动判断要不要思考；
- 思考会增加响应时间并消耗额外 token。事实查询、简单翻译这类任务，用能关闭思考的模型更省。

GLM-5.2 及以上还支持 `reasoning_effort` 参数，默认 `max`；GLM-5.3 系列可选 `max`、`high`、`low`。

### 5. 流式输出

把 `stream` 设为 `True`，边生成边读取，配合深度思考可以实时看到思考过程：

```python
stream = client.chat.completions.create(
    model="glm-5.3",
    messages=[{"role": "user", "content": "写一段 100 字的产品介绍"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta
    if getattr(delta, "reasoning_content", None):
        print(delta.reasoning_content, end="")
    if getattr(delta, "content", None):
        print(delta.content, end="")
```

## 常见问题

**Q：智谱清言 App 的会员能用来调 API 吗？**
不能混用。智谱清言是聊天产品，API 在开放平台单独计费、单独管理 Key。

**Q：报 401？**
官方错误码说明：Key 无效或已过期。检查是否复制完整、环境变量是否生效。

**Q：报 429？**
请求频率超限。降低并发，加上带退避的重试；官方建议对 429 和 500 实现重试机制。

**Q：报 400？**
请求参数错误。最常见的是模型名写错，或者对强制思考的模型传了关闭思考的参数。

**Q：免费模型有什么限制？**
官方模型概览把它们标注为免费模型；免费模型一般会有并发和速率方面的限制，具体规则以控制台和官方价格页为准。用于生产环境前先评估稳定性。

**Q：能用 OpenAI 的 SDK 调吗？**
智谱的接口格式与 OpenAI 的对话补全接口相近，很多支持自定义接口地址的工具可以直接接入。兼容方式和接口地址的确切写法以开放文档的兼容说明为准。

**Q：用 GLM 做编程助手（接入 Claude Code 等）怎么配？**
官方有单独的 GLM Coding Plan 和专属端点，文档提醒要按对应教程配置，不要直接套用普通接口地址。

## 参考资料

- 智谱 AI 开放文档：快速开始 — https://docs.bigmodel.cn/cn/guide/start/quick-start
- 智谱 AI 开放文档：模型概览 — https://docs.bigmodel.cn/cn/guide/start/model-overview
- 智谱 AI 开放文档：深度思考 — https://docs.bigmodel.cn/cn/guide/capabilities/thinking
- 智谱开放平台：API Keys — https://bigmodel.cn/usercenter/proj-mgmt/apikeys

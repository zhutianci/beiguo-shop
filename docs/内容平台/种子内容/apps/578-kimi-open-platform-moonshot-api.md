---
title: "Kimi 开放平台（Moonshot AI）是什么、怎么用：Kimi 模型 API 的接入方式与计费说明"
slug: kimi-open-platform-moonshot-api
name: Kimi 开放平台
url: https://platform.kimi.com/
pricing: 按量付费，价格以官网为准
platforms: 网页控制台 / API
products: [kimi]
models: []
topics: [coding, ai-agent]
excerpt: "Kimi 开放平台是 Moonshot AI 面向开发者的 API 服务，提供旗舰模型 kimi-k3（最高 1M 上下文、原生视觉理解）和 kimi-k2.6 等，接口包括 Chat Completions、Responses 和兼容 Anthropic 的 Messages，按 Token 计费。"
checkedOn: 2026-10-11
sources:
  - https://platform.kimi.com/docs/introduction
---

> 本文根据 Kimi 开放平台官方文档的介绍页整理，资料核对于 2026-10-11。模型与价格变化快，以官网为准。这是面向开发者的 API 平台，本文只做简要介绍；想直接聊天请使用 Kimi 应用。

## 是什么

Kimi 开放平台是月之暗面（Moonshot AI）的开发者平台，提供基于其自研模型的 API 服务。它和 Kimi 聊天应用是两回事：**应用是给人用的，开放平台是给程序调用的**，账号体系和计费都分开。

平台的域名已经从 platform.moonshot.cn 迁移到 **platform.kimi.com**，访问旧地址会自动跳转，老教程里的链接和接口地址要注意核对。

## 提供什么

官方文档介绍页列出的内容：

- **kimi-k3**：当前的旗舰模型，支持最高 1M token 的上下文，并具备原生的视觉理解能力；
- **kimi-k2.6**：支持文本、图片、视频输入，可以在思考模式和非思考模式之间切换；
- **三种接口**：
  - Chat Completions：最常见的对话补全接口；
  - Responses；
  - Messages：兼容 Anthropic 的消息格式。

兼容 Anthropic 格式的接口意味着，原本为 Claude 写的客户端和一些编程智能体工具，改一下地址和密钥就可能接入 Kimi 的模型，具体配置方法以官方文档为准。

## 怎么上手

1. 打开 platform.kimi.com，注册并登录控制台。
2. 完成平台要求的认证，充值或领取可用额度（以控制台显示为准）。
3. 创建 API Key，妥善保存。
4. 按文档的快速开始调用：选择接口类型，填入文档给出的接口地址、模型名和你的密钥。

```python
# 伪代码示意，接口地址与模型名以官方文档为准
client = SomeSDK(api_key="你的 API Key", base_url="文档给出的接口地址")
reply = client.chat(model="kimi-k3", messages=[{"role": "user", "content": "你好"}])
```

## 免费与付费

平台按用量计费：文档说明按**请求的输入 Token 加上实际生成的 Token** 计算。各模型的单价、新用户是否有赠送额度、是否有面向编程工具的订阅套餐，介绍页没有写明，以官网的价格页和控制台为准。

## 适合谁 / 不适合谁

**适合：**
- 想在自己的产品里接入 Kimi 模型的开发者；
- 需要超长上下文处理长文档、大代码库的应用；
- 想给支持自定义接口的编程工具配置国产模型的用户。

**不适合：**
- 只想聊天、写作、读文件的普通用户，直接用 Kimi 应用；
- 不了解 API、密钥和计费概念的非技术用户；
- 需要其他厂商模型的场景，这里只提供 Moonshot 自家的模型。

## 注意事项

- **域名迁移**：以 platform.kimi.com 为准，第三方教程里的旧地址可能失效。
- **长上下文很贵**：1M 上下文不代表每次都该塞满，输入越长费用越高，善用缓存和检索。
- **密钥安全**：不要把 API Key 写进前端代码或公开仓库。
- **模型名会更新**，旧型号会按计划下线，留意官方公告。

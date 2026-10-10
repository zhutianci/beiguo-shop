---
title: "火山方舟是什么、怎么用：豆包大模型 API 平台、Coding Plan 与 Agent Plan 入门"
slug: volcengine-ark-doubao-api
name: 火山方舟
url: https://www.volcengine.com/product/ark
pricing: 按量付费 / 订阅计划，以官网为准
platforms: 网页控制台 / API
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "火山方舟是火山引擎的大模型服务平台，是调用豆包 Seed 系列、Seedream 生图、Seedance 视频等模型 API 的官方入口，支持 OpenAI SDK 接入，并提供 Coding Plan、Agent Plan 和 Managed Agents。"
checkedOn: 2026-10-11
sources:
  - https://docs.volcengine.com/docs/ark/product-overview?lang=zh
  - https://www.volcengine.com/product/ark
---

> 本文根据火山引擎文档中心《火山方舟 · 产品简介》整理（该页最近更新时间为 2026-10-09），资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

火山方舟是字节跳动旗下云服务品牌「火山引擎」的大模型服务平台，运营主体为北京火山引擎科技有限公司。简单说，**豆包 App 背后的那些模型，开发者要通过 API 调用，就是在火山方舟上开通**。平台同时上架了第三方模型，文档的模型栏目里能看到 DeepSeek 系列。

## 能做什么

官方产品简介页列出的能力：

- **文本与多模态**：深度思考、图片理解、视频理解、文档（PDF）理解、联网搜索、函数调用。
- **生成类模型**：视频生成（文档首页推荐 Doubao Seedance 2.5）、图片生成（Doubao Seedream 5.0 pro）、3D 生成。
- **Coding 与 Agent 模型**：文档介绍 Doubao Seed Evolving 是面向 Coding 和 Agent 的模型，按周迭代。
- **推理方式**：在线推理（常规 / 低延迟 / 低优先级 / TPM 保障包 / 模型单元）和批量推理。
- **进阶能力**：上下文缓存、续写模式、视觉定位、文件输入、云部署 MCP、GUI Agent 能力。
- **训练与评测**：模型精调、模型评测、数据集管理。
- **Managed Agents**：定义 Agent、配置运行环境、委派任务并管理上下文；文档提供了把旧的零代码应用迁移过来的说明。
- **订阅计划**：文档中心单列了「火山方舟 Coding Plan」和「火山方舟 Agent Plan」两个栏目。

## 怎么上手

1. 注册火山引擎账号并完成实名认证，进入火山方舟控制台。
2. 在控制台创建 API Key，开通要用的模型。
3. 按文档的快速入门调用。官方示例使用的接入地址是 `https://ark.cn-beijing.volces.com/api/v3`，提供 Python、Curl、Go、Java 示例，也可以直接用 OpenAI SDK。

```python
import os
from arkruntime import Ark

client = Ark(base_url="https://ark.cn-beijing.volces.com/api/v3", api_key=os.getenv("ARK_API_KEY"))
response = client.responses.create(model="文档模型列表中的模型 ID", input="hello")
print(response)
```

## 免费与付费

- **按量计费**：按模型的 Token 或生成量计费，单价见文档的「模型价格」页。
- **Coding Plan / Agent Plan**：面向编程工具和智能体场景的订阅计划，档位与价格以官方订阅页为准。
- **节省计划**：文档中心另有「节省计划」栏目，适合用量稳定的企业。
- 新用户是否有免费额度、额度多少，以控制台当前显示为准。

## 适合谁 / 不适合谁

**适合：**
- 想在自己产品里接入豆包文本、生图、视频模型的开发者；
- 做视频、图像生成类应用，需要 Seedance、Seedream 官方 API 的团队；
- 想给 AI 编程工具配一个国产模型订阅的开发者。

**不适合：**
- 只想聊天或偶尔生成几张图的普通用户，用豆包、即梦等 App 更直接；
- 不熟悉 API、密钥管理的非技术用户；
- 需要海外闭源模型的场景。

## 注意事项

- **模型 ID 带日期后缀**：调用时必须写完整的模型 ID，旧版本会按计划下线，留意官方的模型生命周期公告。
- **控制用量**：视频生成、批量推理费用较高，先设置好预算与告警。
- **密钥安全**：API Key 用环境变量保存，不要提交到代码仓库。
- **生成内容合规**：图片、视频生成受平台内容安全策略约束，商用前阅读服务条款。

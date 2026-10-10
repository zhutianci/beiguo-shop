---
title: "智谱开放平台（BigModel）是什么、怎么用：智谱 API 申请、GLM 模型与免费模型说明"
slug: zhipu-bigmodel-open-platform
name: 智谱开放平台 BigModel
url: https://open.bigmodel.cn/
pricing: 按量计费（部分 Flash 模型免费）
platforms: 网页控制台 / API / Python SDK / Java SDK
trialNote: 文档标注 GLM-4.7-Flash 等多款 Flash 模型为免费模型
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "智谱开放平台 BigModel 是智谱面向开发者的模型服务平台，提供 GLM 系列文本、视觉、图像、视频、语音模型的 API，支持 HTTP、Python / Java SDK，部分 Flash 模型标注免费。"
checkedOn: 2026-10-11
sources:
  - https://docs.bigmodel.cn/cn/guide/start/model-overview
  - https://docs.bigmodel.cn/cn/guide/start/quick-start
verify:
  - "各模型单价本文未写：官方文档的模型概览页不列价格，只提示去价格页查看，请站长按价格页复核是否需要补充"
  - "GLM Coding Plan 的套餐内容未核对，正文只提了名字"
---

> 本文根据智谱 AI 开放文档的「模型概览」「快速开始」两页整理，资料核对于 2026-10-11。模型上新和下线很快，以官方文档为准。

## 是什么

智谱开放平台（BigModel）是智谱面向开发者的「模型即服务」平台：你注册账号、创建 API Key，就能在自己的程序里调用 GLM 系列大模型。它和面向普通用户的聊天产品「智谱清言」是两回事——清言是拿来直接对话的 App，开放平台是给写代码、做应用的人用的接口和控制台。

## 能做什么

官方文档的模型概览页把模型分成几类（2026-10 查询）：

- **文本模型**：当前标为最新的是 GLM-5.3 和 GLM-5.3-Flash，文档写明 GLM-5.3 的上下文为 1M、最大输出 128K；此外还有 GLM-5.2、GLM-5.1、GLM-5、GLM-4.7 等多个代际并存。
- **视觉理解**：GLM-5V-Turbo、GLM-4.6V 等，另有面向手机操作场景的 AutoGLM-Phone。
- **图像与视频生成**：GLM-Image、CogView-4，以及 CogVideoX-3、Vidu Q1、Vidu 2 等视频模型。
- **语音**：GLM-ASR（语音识别）、GLM-TTS（语音合成）、GLM-TTS-Clone、GLM-Realtime 等。
- **其他**：Embedding-3 向量模型、Rerank 重排序、CodeGeeX-4 代码模型、GLM-OCR。

文档明确标注为**免费**的模型有 GLM-4.7-Flash、GLM-4.5-Flash、GLM-4-Flash-250414、GLM-4.6V-Flash、GLM-4.1V-Thinking-Flash、GLM-4V-Flash、CogView-3-Flash 和 CogVideoX-Flash，适合学习和做原型。

## 怎么上手

官方「快速开始」给的顺序是：

1. 在 open.bigmodel.cn 注册账号；
2. 在控制台的 API Key 页面创建密钥（文档特别提醒不要把密钥硬编码进代码）；
3. 到模型概览页选一个模型；
4. 选开发方式：直接发 HTTP 请求，或用 Python SDK、Java SDK；
5. 发起调用。

Python SDK 的安装命令是 `pip install zai-sdk`（旧版包名为 `zhipuai`）。文档里 cURL 示例的对话接口地址为 `https://open.bigmodel.cn/api/paas/v4/chat/completions`，示例模型名写作 `glm-5.3`。

## 免费与付费

平台按调用量计费，不同模型单价不同。模型概览页本身不列价格，只提示「前往价格页面」查看，所以具体金额请以官网价格页为准。上面列出的 Flash 系列在文档中标为免费模型。另外，文档提到面向编程工具的 **GLM Coding Plan**，使用时需要按教程配置专属端点，套餐内容以官方说明为准。

## 适合谁 / 不适合谁

**适合：**
- 想在国内网络环境下直接调用大模型接口的开发者和学生；
- 需要文本、视觉、语音、视频多种能力，又想只对接一家的团队；
- 想先用免费模型把流程跑通，再换付费模型的人。

**不适合：**
- 只想聊天、写文案的普通用户——直接用智谱清言更省事；
- 完全不写代码、也不打算用第三方客户端的人。

## 注意事项

- **模型代际很多**：同一时间有 GLM-4 到 GLM-5.3 多代模型可调，旧教程里的模型名可能已下线，写代码前先对一下模型概览页。
- **免费模型也要 API Key**：免费指不扣费，仍需注册并创建密钥。
- **密钥别进仓库**：放进环境变量或密钥管理工具，泄露后及时在控制台删除重建。
- **免费模型通常有并发或速率限制**，具体数值以官方文档为准。

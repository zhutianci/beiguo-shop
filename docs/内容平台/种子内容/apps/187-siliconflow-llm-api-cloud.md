---
title: "硅基流动 SiliconFlow 官网与 API 使用教程：模型、价格与免费模型"
slug: siliconflow-llm-api-cloud
name: 硅基流动 SiliconFlow
url: https://www.siliconflow.cn/
pricing: 按量付费，部分模型免费
platforms: 网页 / API
trialNote: 官网定价页标注部分模型免费调用，如 Hunyuan-MT-7B、Kolors 文生图等
products: [ai-tools]
models: []
topics: [coding]
excerpt: "硅基流动是北京的大模型云服务公司，SiliconCloud 平台用 OpenAI 兼容接口提供 DeepSeek、GLM、千问、Kimi 等开源模型 API，按 token 计费，部分模型免费。"
checkedOn: 2026-10-07
sources:
  - https://www.siliconflow.cn/
  - https://www.siliconflow.cn/pricing
  - https://www.siliconflow.cn/models
  - https://docs.siliconflow.cn/cn/userguide/quickstart
  - https://m.thepaper.cn/newsDetail_forward_33494133
---

> 本文根据硅基流动官网、官方定价页与模型中心、官方文档整理，公司动态参考澎湃新闻报道，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

硅基流动（SiliconFlow）是一家 AI 基础设施公司，主营大模型推理云服务。它的核心产品 **SiliconCloud** 是一个大模型 API 平台：把 DeepSeek、GLM、千问、Kimi、MiniMax 等主流开源和国产模型部署好，开发者注册后用一个 API Key 就能调用，不用自己买 GPU、搭推理服务。

平台接口与 OpenAI 格式兼容，接口地址为 `https://api.siliconflow.cn/v1`，很多国内的 AI 客户端、编程工具都内置了硅基流动作为模型来源。除了公有云 API，它也提供预留实例、推理加速和私有化部署等企业服务。

据澎湃新闻等媒体报道，硅基流动已于 2026 年 6 月 30 日向港交所递交上市申请，招股书披露截至 2026 年 4 月平台注册用户超过 1000 万、累计支持 170 多个模型。

## 能做什么

- **调用多种大模型**：对话、代码、推理模型，以及文生图、语音合成与识别、视频生成模型，都在一个平台里。
- **模型中心对比选型**：在模型中心按类型、上下文长度、价格筛选，查看每个模型的单价和能力标签（如工具调用、结构化输出）。
- **体验中心试用**：网页「体验中心（Playground）」里直接选择语言模型、文生图模型对话或生成，先试再接入。
- **OpenAI 兼容接入**：用 OpenAI 官方 Python SDK，改 base URL 和 Key 就能调用，迁移成本低。
- **免费模型**：部分翻译、OCR、文生图、语音模型标注为免费，适合学习和轻量应用。
- **企业服务**：预留实例保障稳定性，支持国产 GPU 异构部署和私有化方案。

## 怎么上手

1. 打开官网 siliconflow.cn，点右上角登录，按官方文档目前支持短信或邮箱登录。
2. 进入「模型中心」浏览模型，记下想用的模型名称和单价。
3. 在「体验中心」选择模型试几轮对话，确认效果。
4. 在控制台创建 API Key，妥善保存。
5. 在代码或第三方客户端里把接口地址设为 `https://api.siliconflow.cn/v1`，填入 Key 和模型名称发起调用。

可以这样开始：在体验中心选一个 DeepSeek 或 GLM 模型，输入「用 JavaScript 写一个防抖函数，并说明和节流的区别」，再对比另一个模型的回答。

## 免费与付费

- **计费方式**：按输入、输出 token 计费（每百万 token），部分模型对缓存命中单独定价；图像按张、语音按字符、视频按条计费。
- **价格示例**：定价页显示 DeepSeek-V4-Pro 输入 12 元 / 百万 token、输出 24 元 / 百万 token；Step-3.5-Flash 输入 0.70 元、输出 2.10 元 / 百万 token（官网定价页，2026-10 查询）。各模型价格差别很大，以定价页为准。
- **免费模型**：定价页标注免费的有 Hunyuan-MT-7B、Xing4.0-29B、PaddleOCR-VL-1.5、Kolors 等（官网定价页，2026-10 查询）。
- 新用户赠送额度、邀请奖励等活动经常变化，以官网当期说明为准。

## 适合谁 / 不适合谁

适合：
- 想用人民币按量调用 DeepSeek、GLM、千问等模型的国内开发者。
- 给 AI 客户端、编程工具、知识库应用配置模型来源的个人用户。
- 需要一个接口对比多个国产模型的产品团队。
- 需要私有化或国产算力部署的企业。

不适合：
- 需要 GPT、Claude、Gemini 等海外闭源模型的场景，平台以开源和国产模型为主。
- 完全不写代码、只想聊天的普通用户，直接用各家聊天应用更方便。

## 注意事项

- **国内站与国际站**：siliconflow.cn 是国内站，另有面向海外的国际站，账号、模型和价格可能不同。
- **成本控制**：推理模型输出很长时费用增长快，调用前看清单价，必要时限制最大输出长度。
- **保护 API Key**：不要把 Key 写进前端代码或公开仓库，泄露后及时在控制台删除重建。
- **内容合规**：生成内容需遵守国内法律法规和平台用户协议，AI 输出要自行核对。

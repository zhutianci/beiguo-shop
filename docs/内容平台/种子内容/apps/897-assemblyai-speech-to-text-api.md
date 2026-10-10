---
title: "AssemblyAI 是什么、怎么用、怎么收费：语音转文字与语音理解 API"
slug: assemblyai-speech-to-text-api
name: AssemblyAI
url: https://www.assemblyai.com/
pricing: 免费额度+按量付费
platforms: 云服务 API
trialNote: 注册送 50 美元额度，无需信用卡
products: [ai-tools]
models: []
topics: [coding, ai-agent]
excerpt: "AssemblyAI 提供语音 API：Universal 系列模型做录音与实时转写，附加说话人区分、个人信息脱敏等语音理解能力，另有一体化的 Voice Agent API 和统一调用多家大模型的 LLM Gateway，注册送 50 美元额度。"
checkedOn: 2026-10-11
sources:
  - https://www.assemblyai.com/pricing
  - https://www.assemblyai.com/
---

> 本文根据 AssemblyAI 官网定价页整理，资料核对于 2026-10-11。这是一条面向开发者的简介，模型与价格以官网为准。

## 是什么

AssemblyAI 是一家提供语音 AI 接口的公司。开发者把音频发给它的 API，拿回文字稿以及在文字稿之上的各种分析结果。它覆盖预先录好的音频和实时音频两种场景，并且把「转写之后还要做的事」——区分说话人、去掉敏感信息、调用大模型做总结——也做成了可以直接叠加的能力。

## 能做什么

定价页列出的产品与模型：

- **Universal-3.5 Pro**：处理预录制音频的主力模型。
- **Universal-2**：成本更低的预录制模型。
- **Universal-3.6 Pro Realtime**：实时流式识别模型。
- **Universal-Streaming（英语 / 多语种）**：成本更低的流式模型。
- **Speech Understanding 与 Guardrails**：叠加在转写之上的附加能力，例如说话人区分（diarization）和个人信息脱敏（PII redaction）。
- **Voice Agent API**：一条连接里整合语音转文字、大模型和文字转语音，用来搭建语音智能体。
- **LLM Gateway**：统一的接口，调用来自 5 家提供方的 25 个以上模型，按百万 token 计费。

页面注明较早的 SLAM-1 模型已被弃用，建议迁移到 Universal-3.5 Pro。

## 怎么上手

1. 在 assemblyai.com 注册，获取 50 美元额度和 API Key（不需要信用卡）。
2. 用官网的在线试用上传一段音频，先看转写质量。
3. 按官方文档提交转写任务：给出音频地址，等待完成后取回文字稿与时间戳。
4. 根据需要打开说话人区分、脱敏等附加项；需要总结或抽取信息时，把文字稿交给 LLM Gateway 里的模型处理。

## 免费与付费

定价页（美元，2026-10 查询）：

- **免费额度**：注册送 50 美元。
- **示例单价**：
  - Universal-3.5 Pro（预录制）：0.21 美元/小时
  - Universal-3.6 Pro Realtime（实时）：0.45 美元/小时起
  - Voice Agent API：4.50 美元/小时
- 附加能力和 LLM Gateway 另行计费，详见定价页。

## 适合谁 / 不适合谁

**适合：** 开发播客与会议转写、客服质检、视频字幕类产品的团队；需要在转写之上做脱敏和结构化分析的应用；想用一个接口同时拿到语音与大模型能力的开发者。

**不适合：** 不写代码的普通用户；对中文及方言准确率要求高的业务（需自行对比测试）；必须本地部署、音频不能上云的场景。

## 注意事项

- 附加项按音频时长叠加计费，全部打开后的总价会明显高于基础转写价。
- 弃用的模型会在一段时间后下线，代码里不要写死旧模型名。
- 脱敏功能可以降低风险，但不能保证清除全部个人信息，敏感业务仍需人工抽检。

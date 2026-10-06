---
slug: gpt-image-2
name: GPT-Image-2
kind: MODEL
updated: 2026-10-06
sources:
  - https://openai.com/index/introducing-chatgpt-images-2-0/
  - https://deploymentsafety.openai.com/chatgpt-images-2-0/chatgpt-images-2-0.pdf
  - https://help.openai.com/en/articles/11084440-images-in-chatgpt
  - https://developers.openai.com/api/docs/models/gpt-image-2
  - https://developers.openai.com/api/docs/guides/tools-image-generation
  - https://openai.com/index/introducing-chatgpt-images-2-5/
  - https://community.openai.com/t/introducing-gpt-images-2-5-in-the-api-and-chatgpt/1395897
verify:
  - Free 账号每天能生成几张：官方没有公布具体数字，需实测
  - 「Thinking 模式生图仅 Plus / Pro / Business 可用」是 Images 2.0 发布时的说法；Images 2.5（2026-09-08）上线后是否仍如此，官方帮助中心需再看一次
  - ChatGPT 里是否还能手动切回 Images 2.0；本站收录的提示词要在 2.5 上抽测，确认效果差异
  - 「一次最多 8 张」「画幅 3:1 到 1:3」来自 Images 2.0 发布报道（openai.com 原文本次抓取被 403 拦截），上线前对照官方原文
  - API 上 gpt-image-2 目前未标弃用（快照 gpt-image-2-2026-04-21），留意后续弃用公告
  - ChatGPT 中文界面里「图片」入口的实际名称和位置，配截图
---
## gpt-image-2 是什么

gpt-image-2 是 OpenAI 在 2026-04-21 发布的图像生成模型。在 ChatGPT 里它叫「ChatGPT Images 2.0」，也就是大家常说的「ChatGPT 生图」；开发者通过 API 调用时，模型名就是 `gpt-image-2`。

2026-09-08，OpenAI 又发布了 Images 2.5，ChatGPT 里的生图功能已陆续切换到新版本。本专题仍用 gpt-image-2 这个名字：这里收录的提示词写法在 2.5 上同样适用，个别效果有差异的会在单条里注明。

## 能做什么

- 文生图，或者上传照片后改图：换背景、换风格、局部修改
- 图里的文字比上一代清楚得多，中文和多语言排版都能用，适合海报、信息图、PPT 配图
- 一次生成多张风格一致的图，适合做系列图、分镜
- Thinking 模式会先规划构图、核对数量和文字，必要时联网查资料再画

## 怎么用

| 入口 | 说明 |
|---|---|
| ChatGPT（网页 / 桌面 / 手机 App） | 在对话里直接描述要画什么，或先上传参考图再说怎么改 |
| Codex | 官方说明 Images 2.0 同样向 Codex 用户开放 |
| OpenAI API | 模型名 `gpt-image-2`；2.5 对应 `gpt-image-2.5-flare` / `gpt-image-2.5-sunburst` |

API 支持自定义尺寸，2560×1440 以上官方标为实验性，效果不够稳定。

## 免费与付费的区别

按 Images 2.0 发布时的官方说明：所有 ChatGPT 用户都能生图；Plus、Pro、Business 用户额度更高，并且可以用 Thinking 模式生图。Free 账号每天具体能生成几张，官方没有公布。如果需要更高额度或 Thinking 模式，可以在本站 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus) 了解 ChatGPT Plus。

## 本页的提示词怎么用

每条提示词都标明了是否需要上传参考图和建议画幅，方括号 [ ] 里是要替换的内容。建议先原样跑一次看看效果，再每次只改一个变量。出图不理想时，在同一个对话里直接说哪里要改，比整段重写更省额度。

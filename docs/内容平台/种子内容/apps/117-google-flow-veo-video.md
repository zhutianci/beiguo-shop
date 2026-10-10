---
title: "Google Flow 是什么、怎么用：用 Veo 做 AI 视频的官网入口与教程"
slug: google-flow-veo-video
name: Google Flow
url: https://flow.google.com/
pricing: 每日免费积分+Google AI 订阅（Plus / Pro / Ultra）
platforms: 网页 / iOS / 安卓
trialNote: 帮助中心写明不订阅也每天有 50 个 Flow 积分可试用，高峰时段可能无法生成视频；订阅用户每月另得额外积分
products: [gemini]
models: [veo]
topics: [cinematic, image-to-video]
excerpt: "Google Flow 是谷歌推出的 AI 影视创作工具，集成 Veo 3.1 视频模型、Gemini Omni Flash 和 Nano Banana 图片模型，支持首尾帧、素材参考、延长和 Flow Agent，额度与 Google AI 订阅挂钩。"
checkedOn: 2026-10-07
sources:
  - https://support.google.com/flow/answer/16353333?hl=en
  - https://support.google.com/flow/answer/16352836?hl=en
  - https://support.google.com/flow/answer/16526234?hl=en
  - https://support.google.com/flow/answer/16353544?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/flow-updates/
  - https://apps.apple.com/us/app/google-flow/id6751294549
---

> 本文根据 Google Flow 帮助中心、Google 官方博客和 App Store 介绍整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Google Flow 是 **Google**（Google Labs）推出的 AI 影视创作工具，原入口在 labs.google，现在统一跳转到 flow.google.com。官方把它定位为「为创作者打造的 AI 电影制作工具」：在一个项目里生成画面、组织镜头、保持角色一致，拼成完整的片段和故事。

Flow 里用的是 Google 自家模型：视频侧有 **Veo 3.1**（Lite、Fast、Quality 三档）和 **Gemini Omni Flash**，图片侧有 **Nano Banana Pro / Nano Banana 2.1** 等。2026 年 5 月 19 日，Google 官方博客宣布加入 **Flow Agent**（能规划复杂任务、批量编辑、整理素材）、可用自然语言自建小工具的 Flow Tools，以及手机 App（当时先上线安卓测试版，现在 App Store 也已有官方「Google Flow」App）。

## 能做什么

- **文生视频**：一句描述生成 4、6、8 秒的视频片段，Gemini Omni Flash 还支持 10 秒。
- **首尾帧生成（Frames to Video）**：上传开头帧，或同时给首帧和尾帧，控制镜头的起止。
- **素材参考（Ingredients）**：把角色、物品、场景作为「素材」上传，在多个镜头里复用，保持形象一致。
- **延长视频**：在已有片段后面继续生成（目前 Veo 3.1 Lite 支持，Omni 即将支持）。
- **视频改视频**：Gemini Omni Flash 支持对已有视频做编辑，还能生成自定义声音。
- **图片生成与编辑**：用 Nano Banana 系列先做角色设定图和分镜，再转视频。
- **Flow Agent**：让 Agent 帮你头脑风暴、写对白、批量修改镜头、整理素材库。

## 怎么上手

1. 用电脑上的 Chrome 或 Edge 浏览器打开 flow.google.com，用 Google 账号登录（帮助中心建议用桌面端 Chromium 内核浏览器，体验最完整）；手机端可下载官方「Google Flow」App。
2. 确认账号年龄已验证为 18 岁以上，并且你身处官方支持的国家和地区。
3. 新建项目，先用 Nano Banana 生成或上传一张主角图片，加入素材。
4. 选择「Frames to Video」或「Ingredients to Video」，模型先选 Veo 3.1 Fast（积分消耗较低），写下镜头描述生成。
5. 满意后用 Quality 模型重新生成关键镜头，把多个片段拼进时间线，导出。

可以这样开始：

```
Ingredients to Video：参考素材里的红色机器人在雨夜的霓虹街头奔跑，低机位跟拍，地面积水反光，结尾它停下回头看向镜头
```

## 免费与付费

Flow 按「Flow 积分」计费，不同模型消耗不同。根据帮助中心（2026-10 查询）：

| 身份 | Flow 积分 |
| --- | --- |
| 未订阅 | 每天 50 积分（试用，高峰期约 UTC 14–17 点可能无法生成视频，但仍可生图和用 Agent） |
| Google AI Plus | 每天 50 + 每月额外 200 |
| Google AI Pro | 每天 50 + 每月额外 1,000，可用完整 Flow 功能 |
| Google AI Ultra（帮助中心称「Ultra $100」档） | 每天 50 + 每月额外 10,000，优先体验新的实验模型和高级功能 |
| Google AI Ultra（帮助中心称「Ultra $200」档） | 每天 50 + 每月额外 25,000，同上 |

符合条件的 Google Workspace 商业 / 教育版用户每天有 50 积分。订阅用户（日本除外）还可以加购 AI 积分。注意：帮助中心的「入门」页仍写着使用 Flow 需要订阅 Google AI Plus / Pro / Ultra，实际以产品内显示为准。各订阅的具体价格因地区而异，以 Google One 官网为准。

## 适合谁 / 不适合谁

**适合：**
- 已经订阅 Google AI Pro / Ultra 的用户，可以直接用 Veo 3.1 做短片。
- 需要多镜头角色一致的短片、广告分镜创作者，素材参考功能很实用。
- 想把 Gemini 生态（生图、对话、视频）串起来工作的人。

**不适合：**
- 身处官方支持地区之外的用户：帮助中心列出的支持地区不包括中国大陆。
- 未满 18 岁的用户，Flow 仅向 18 岁以上开放。
- 需要单镜头超长时长的项目，单次生成仍以 4–10 秒为主。

## 注意事项

- **地区限制**：官方帮助中心明确说明 Flow 并非在所有提供 Google AI Pro 的地区都可用，订阅前先查看支持地区列表。
- **水印**：Flow 里用 Veo、Omni、Nano Banana 生成的内容都带不可见的 SynthID 数字水印；还可以开启可见水印，部分国家会自动加可见水印。
- **失败不扣积分**：官方说明生成失败不会扣积分，频繁生成可能被限速。
- **内容政策**：禁止故意生成有害、违法或不当内容；不要用真人（尤其公众人物）的照片做冒充本人的视频。
- **发布标识**：发布到国内平台时按规定标注 AI 生成。

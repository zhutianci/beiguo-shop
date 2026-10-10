---
title: "Midjourney 官网入口与使用教程：免费吗、怎么订阅、V8 怎么用"
slug: midjourney-ai-image-generator
name: Midjourney
url: https://www.midjourney.com/
pricing: 付费订阅（Basic / Standard / Pro / Mega）
platforms: 网页 / Discord / iOS / 安卓（niji·journey App）
trialNote: 官网和 Discord 目前没有免费试用；官方说明只有 niji·journey 手机 App 提供有限试用
products: [ai-tools]
models: [midjourney]
topics: [illustration, poster, photography]
excerpt: "Midjourney 是以审美见长的 AI 图片生成工具，在官网或 Discord 输入提示词即可出图，还能把图片转成 5 秒短视频，当前默认模型为 V8.2，需付费订阅使用。"
checkedOn: 2026-10-07
sources:
  - https://www.midjourney.com/
  - https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
  - https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials
  - https://docs.midjourney.com/hc/en-us/articles/33390994570509-Logging-In-Connecting-Accounts
---

> 本文根据 Midjourney 官网与官方文档（Docs）整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Midjourney 是 Midjourney 公司推出的 AI 图片生成服务，2024 年 8 月以前只能通过 Discord 使用，现在官网 midjourney.com 和 Discord 都能用（官方文档说明）。它最出名的是画面的审美和氛围感：同样一句提示词，Midjourney 出的图往往构图、光影、色调更像一张「作品」，因此在插画、概念设计、海报和摄影风格创作者中使用很广。

模型按版本迭代。按官方文档，**V8.2 于 2026 年 7 月 24 日成为默认版本**，重点提升审美、画质和个性化（Personalization），并推出新的 Edit 模型，取代了原来的 Omni Reference、Character Reference 和 Retexture 工具；上一代 V8.1 于 2026 年 4 月发布，生成速度比早期版本快约 4–5 倍，并支持直接出 2K 的 HD 图。

## 能做什么

- **文生图**：输入英文提示词生成 4 张候选图，可用 `--v`、`--ar` 等参数指定版本、画幅比例。
- **编辑与重绘**：对已有图片做局部重绘（Vary Region）、扩图（Pan / Zoom Out）；V8.2 的 Edit 模型可以用文字指令改图、用最多 4 张参考图生成新图。
- **个性化**：通过点赞、挑选图片建立个人审美档案（Personalization Profile），之后出图更贴近你的偏好；也可以用一组图片做 Moodboard。
- **HD 出图与放大**：V8.1 起可直接生成 2K 图，也有 Upscale 放大选项。
- **图生视频**：把图库里任意一张图作为首帧，生成 5 秒短视频，可设置运动幅度、循环等参数。
- **Raw 模式**：关闭默认风格化，让结果更贴近提示词本身。

## 怎么上手

1. 打开 midjourney.com，点击 Sign Up，选择 Continue with Google 或 Continue with Discord 登录（官方目前不支持单独的用户名密码注册）。
2. 按官方「How to Subscribe」说明选择订阅方案（官网和 Discord 都需要先订阅才能出图）。
3. 在网页顶部的 Imagine 输入框写英文提示词，回车生成；在设置面板里可选默认版本和 SD / HD。
4. 对满意的图点 Vary、Upscale、Edit 继续加工，或点 Animate 生成视频。
5. 习惯 Discord 的用户也可以加入官方服务器，在 newbie / general 频道用 `/imagine` 命令出图。

可以这样开始：`a cozy bookstore at dusk, warm window light, rainy street, 35mm film photo --ar 3:2`

## 免费与付费

官方文档列出四档订阅（官方文档定价表，2026-10 查询）：

| 方案 | 月付 | 年付折合每月 | Fast GPU 时长 |
| --- | --- | --- | --- |
| Basic | 10 美元 | 8 美元 | 每月约 3.3 小时 |
| Standard | 30 美元 | 24 美元 | 每月 15 小时 |
| Pro | 60 美元 | 48 美元 | 每月 30 小时 |
| Mega | 120 美元 | 96 美元 | 每月 60 小时 |

以上来自官方文档《Comparing Midjourney Plans》，年付需一次付清全年费用（约 8 折）。Standard 及以上可在 Relax 模式下无限生成图片；Pro、Mega 还能 Relax 生成 SD 视频，并且**只有 Pro 和 Mega 有 Stealth（隐身）模式**。额外 Fast 时长每小时 4 美元。官方说明网站和 Discord 目前没有免费试用，只有 niji·journey 手机 App 有有限试用。

## 适合谁 / 不适合谁

适合：
- 插画师、概念设计师、海报和封面设计者，需要快速出风格化视觉草图。
- 做情绪板、氛围图、摄影风格参考的创意团队。
- 愿意学习英文提示词和参数、追求画面质感的爱好者。

不适合：
- 只想偶尔免费试试的人：网页和 Discord 都需先付费。
- 需要精确排版大段文字、严格还原商品细节的电商场景，可能要配合其他工具。
- 对作品公开有顾虑但只想订低档方案的人（隐身模式仅 Pro / Mega）。

## 注意事项

- **作品默认公开**：未开启 Stealth 模式时，你生成的图片和视频可能出现在公开图库中。
- **商用条款**：按官方说明，订阅过的用户基本可自由使用生成内容；年营收超过 100 万美元的公司须订阅 Pro 或 Mega。具体以官方服务条款为准。
- **社区规范**：官方社区准则要求内容「Safe For Work」，禁止血腥、成人内容，也禁止用真人形象骚扰、诽谤他人，以及未经授权的自动化和第三方工具。
- **界面与文档为英文**：官方文档、参数说明和示例都以英文为主，新手建议先读官方 Getting Started 指南。

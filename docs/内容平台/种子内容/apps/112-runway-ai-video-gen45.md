---
title: "Runway AI 是什么、怎么用：Gen-4.5 视频生成教学与费用说明"
slug: runway-ai-video-gen45
name: Runway
url: https://runway.com/
pricing: 免费+付费（Standard / Pro / Max / Enterprise）
platforms: 网页 / iOS / 安卓 / API
trialNote: 免费版一次性赠送 125 积分，可体验部分模型，含 5GB 存储；无水印导出等需付费
products: [ai-tools]
models: []
topics: [cinematic, image-to-video]
excerpt: "Runway 是 Runway AI 公司的 AI 视频创作平台，自研 Gen-4.5 视频模型、Aleph 2.0 视频编辑模型和 Act-Two 表演迁移，同时集成多家第三方模型，适合影视、广告和创意团队。"
checkedOn: 2026-10-07
sources:
  - https://runway.com/
  - https://runway.com/pricing
  - https://runway.com/research/introducing-runway-gen-4.5
  - https://runway.com/news/introducing-aleph-2-and-edit-studio
  - https://docs.dev.runwayml.com/api/
  - https://apps.apple.com/us/app/runway-ai-image-video/id1665024375
---

> 本文根据 Runway 官网、定价页、官方研究博客、帮助中心和 App Store 介绍整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Runway 是 **Runway AI, Inc.** 推出的生成式视频平台，旧域名 runwayml.com 现已跳转到 runway.com。

官网把它的创作产品 Runway Creative 描述为在一个云端工作区里生成和编辑视频、图片、音频的一站式创意平台。自研模型有 **Gen-4.5**（官方研究博客 2025 年 12 月 1 日发布的视频生成模型，官方称在运动质量、提示词遵循和画面保真度上领先）、**Aleph 2.0**（2026 年 5 月 21 日发布的旗舰视频编辑模型升级版）和 **Act-Two**（用表演视频驱动角色）。此外平台里还能直接调用 Kling 3.0、Seedance 2.5、Nano Banana Pro 等第三方模型，一个订阅覆盖多家模型。

## 能做什么

- **文生视频 / 图生视频**：用 Gen-4.5 从一句描述或一张图片生成电影感镜头。
- **视频编辑（Aleph 2.0 + Edit Studio）**：改一帧，模型把同样的修改应用到整段视频，比如换天气、换服装、加减物体，其余部分尽量保持不变。
- **表演迁移（Act-Two）**：录一段自己表演的参考视频，用它控制另一个角色的面部表情和肢体动作（API 文档说明可选开启肢体控制）。
- **Runway Agent**：用聊天方式描述想要的视频，由 Agent 规划并调用模型完成整段内容。
- **音频**：付费版可生成音乐、配音和音效，Pro 起支持自定义声音克隆。
- **4K 放大与专业导出**：付费版支持 4K 放大，Max 档支持 HDR、ProRes、图像序列等影视级格式。
- **开发者平台（Runway Dev）**：通过 API 把 Gen-4.5、Aleph 2.0、Act-Two 接入自己的产品。

## 怎么上手

1. 打开 runway.com 点 Get started，或在 App Store / Google Play 下载 Runway App，按页面提示注册账号。
2. 进入工作台后，先选「Generate Video」，模型选 Gen-4.5。
3. 上传一张参考图（可选），在提示词框用英文描述主体、动作和镜头运动，选时长后生成。
4. 不满意时只改一个变量（比如只改镜头描述）再生成，方便判断哪句提示词起作用。
5. 想改已有视频，切到 Edit Studio，用 Aleph 2.0 描述你要做的修改。

可以这样开始：

```
A slow dolly-in shot of an old lighthouse on a cliff at dusk, waves crashing below, warm light turning on, cinematic, 35mm film look
```

## 免费与付费

官网定价页（2026-10 查询）：

| 套餐 | 年付折合月价 | 每月积分 | 主要差别 |
| --- | --- | --- | --- |
| Free | 0 | 一次性 125 | 部分模型、5GB 存储 |
| Standard | 12 美元 | 625 | 全部视频与图片模型、无水印、4K 放大 |
| Pro | 28 美元 | 2,250 | 更多并发、品牌套件、1 个声音克隆、可加购积分 |
| Max | 76 美元 | 9,500 | 新模型抢先用、积分可结转 1 个月、HDR / ProRes 导出 |
| Enterprise | 联系销售 | 定制 | 团队管理与安全合规 |

（官网定价页，2026-10 查询；按月付费价格更高：Standard 15、Pro 35、Max 95 美元。）积分按模型和时长扣除，不同模型每秒消耗不同。

## 适合谁 / 不适合谁

**适合：**
- 影视、广告、MV 团队，需要电影感镜头和对已有素材做 AI 修改。
- 想在一个订阅里试遍多家主流视频模型、对比效果的创作者。
- 需要 API 把视频生成接入产品的开发团队。

**不适合：**
- 只想偶尔做几条短视频的普通用户，免费积分一次性用完即止，付费门槛偏高。
- 不熟悉英文界面和英文提示词的人，上手需要适应。
- 需要中文配音、中文字幕一条龙的场景，国内剪辑工具更顺手。

## 注意事项

- **积分消耗快**：高质量模型按秒计费，正式生成前先用短时长、低分辨率试效果。
- **真人肖像**：Act-Two 和图生视频涉及真人时，只用你本人或已获授权者的素材，不要制作冒充明星、公众人物的视频。
- **商用与版权**：生成内容的权利归属和使用限制以 Runway 服务条款为准，商用前请阅读最新条款。
- **服务地区**：Runway 是海外服务，能否注册、付款取决于官方支持的地区和支付方式，以官网说明为准。
- **AI 标识**：发布到国内平台时按规定标注 AI 生成。

---
title: 图生视频提示词怎么写：只写「运动」的官方原则与 20 个可套用句式
slug: image-to-video-prompts
products: [ai-tools, gemini]
models: [veo, midjourney]
accountTier: FREE
excerpt: 图生视频（让照片动起来）的提示词和文生视频不一样：参考图已经决定了人物和画面，提示词只需写怎么动。本文按 Google、Midjourney 官方指南总结三类运动写法、首尾帧与循环技巧，并给出 20 个中英对照句式。
checkedOn: 2026-10-07
sources:
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
  - https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  - https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
  - https://support.google.com/flow/answer/16353334?hl=en
---

## 适用于谁

- 搜「图生视频提示词」「AI 图生视频提示词」的人；
- 用即梦、可灵、Gemini、Flow、Midjourney 等工具把一张图变成视频，结果人物变脸、画面乱动的人；
- 想做商品动态图、插画动起来、风景延时、循环背景的人。

本文根据 Google Cloud 官方视频生成最佳实践与提示指南（适用于 Veo 和 Gemini Omni）、Midjourney 视频文档和 Google Flow 帮助中心整理，资料核对于 2026-10-07。各工具的入口和参数不同，但写提示词的原则相通；具体工具教程见文末。

## 结论先说

Google 官方给图生视频的三条核心建议：

1. **源图质量决定一切**：清晰、构图好的源图会得到更连贯、更高质量的视频——把它当成影片的第一帧。
2. **只写运动**：源图已经提供了主体、场景和风格，**不要在提示词里重新描述人物、背景、光线**，重复描述会让模型困惑、结果变差。
3. **用泛称指代图中人物**：写「主体」「这位女士」「他」「他们」，而不是重新描述外貌。

## 三类运动：单独或组合使用

| 类型 | 是什么 | 稳定性 | 例子 |
| --- | --- | --- | --- |
| 镜头运动 | 场景不动，镜头在动 | 最简单、最可靠 | 缓慢推近主体 |
| 主体动作 | 人物或物体在动 | 适合细微、自然的动作 | 她的头发和衣角在风中轻轻飘动 |
| 环境变化 | 背景或氛围在动 | 适合营造氛围 | 雾气缓缓漫过山谷 |

新手建议：**先只用镜头运动**，再逐步加主体动作；一条几秒钟的视频，主体动作写一到两个就够了。

![Google 官方图生视频示例使用的源图：向日葵田边的一辆旧皮卡，提示词只需描述镜头如何运动](seed:g341-i2v-source-truck.jpg)
*图片来源：[Google Cloud 文档 · Best practices for generating videos](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice)*

## 写法模板

```
[镜头运动]，[主体动作（用泛称）]，[环境变化]。[节奏/速度]。[可选：声音]
```

示例：

```
镜头缓慢推近，这位女士转头望向窗外，嘴角微微上扬；窗帘被风轻轻吹起。动作舒缓自然。
```

## 20 个可套用句式（中英对照）

**镜头运动**

1. 镜头缓慢推近主体 — slow dolly in on the subject
2. 镜头缓慢拉远，展现周围环境 — slow dolly out to reveal the surroundings
3. 镜头从左向右平移 — slow truck right
4. 镜头水平摇向右侧 — slow pan right
5. 镜头从下往上摇，展现建筑全貌 — tilt up to reveal the full building
6. 镜头环绕主体半圈 — arc shot around the subject
7. 无人机视角缓缓升高 — drone shot slowly rising
8. 固定镜头，画面不动 — static shot

**主体动作**

9. 他缓缓眨眼，然后微笑 — he blinks slowly, then smiles
10. 她转头看向镜头 — she turns her head toward the camera
11. 主体深呼吸，肩膀轻轻起伏 — the subject takes a deep breath, shoulders rising gently
12. 小狗摇着尾巴 — the dog wags its tail
13. 咖啡杯冒出缓缓上升的热气 — steam rises slowly from the coffee cup
14. 花朵慢慢绽放 — the flower slowly blooms

**环境变化**

15. 树叶在微风中轻轻摇曳 — leaves sway gently in the breeze
16. 云在天空中缓缓流动 — clouds drift slowly across the sky
17. 雪花轻轻飘落 — snowflakes fall gently
18. 水面泛起涟漪，倒影晃动 — ripples spread across the water, reflections shimmer
19. 霓虹灯闪烁 — neon signs flicker
20. 天色由黄昏渐渐转暗，街灯亮起 — dusk slowly darkens and streetlights turn on

## 首尾帧、循环与动态强度

- **首尾帧**：给出开始和结束两张图，提示词描述「两帧之间发生了什么」，适合变身、转场、产品展开。Google Flow 在 Frames 里分别拖入 start / end frame；Midjourney 网页版在 Ending Frame 放第二张图（或 `--end`）。
- **循环视频**：结束帧用同一张图，Midjourney 勾选 Loop（或 `--loop`），适合做动态壁纸、商品循环展示。
- **动态强度**：Midjourney 的 Low Motion（默认）更可能是静态场景、轻微运镜和细微动作；High Motion 动作和运镜更大，但官方提醒更容易出现不真实或抖动的动作。其他工具若有类似「运动幅度」选项，原理相同。
- **想要更听话**：Midjourney 视频可加 `--raw`，减少模型的「自由发挥」。

## 常见失败与调整

| 现象 | 可能原因 | 调整 |
| --- | --- | --- |
| 人物变脸、换了个人 | 提示词重新描述了外貌，或动作太大 | 删掉外貌描述，用「她 / 主体」指代；减小动作幅度 |
| 画面乱晃、扭曲 | 动作太多、动态强度太高 | 只保留一个镜头运动；改用低动态 |
| 视频几乎不动 | 提示词太笼统 | 写出具体动作和方向，如「从左向右」「缓慢推近」 |
| 文字和 logo 变形 | 运动经过文字区域 | 选文字少的源图；用固定镜头 |
| 情节没演完 | 一条视频塞了多个事件 | 一条只讲一个时刻，拆成多段再拼接 |

## 常见问题

**Q：图生视频用什么图最好？**
清晰、主体明确、背景不杂乱、光线自然的图。官方建议把源图当成影片的第一帧来挑。

**Q：可以用别人的照片做视频吗？**
只用你自己或已获授权的图片。各平台都要求你对上传的图片拥有权利，并禁止用真实人物的图片做侮辱、欺骗类内容。

**Q：中文提示词能用吗？**
国内工具（即梦、可灵）以中文为主；Veo / Omni、Midjourney 的官方示例为英文，镜头术语附英文更稳妥。

## 参考资料

- Google Cloud 文档：Best practices for generating videos（Image-to-video）— https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice
- Google Cloud 文档：Video generation prompt guide — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
- Midjourney 官方文档：Video — https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
- Google Flow Help：Create videos in Google Flow — https://support.google.com/flow/answer/16353334?hl=en

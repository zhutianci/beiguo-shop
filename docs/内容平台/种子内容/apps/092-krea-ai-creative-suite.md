---
title: "Krea AI 是什么、怎么用：实时生成、Krea 2 模型与多模型创作平台"
slug: krea-ai-creative-suite
name: Krea
url: https://www.krea.ai/
pricing: 免费+付费（Basic / Pro / Max / Business）
platforms: 网页 / iOS / API
trialNote: 免费版每天 100 个计算单位，无需信用卡，可用实时生成和全部图片、视频模型
products: [ai-tools]
models: []
topics: [illustration, photography, cinematic]
excerpt: "Krea 是集图片、视频、实时生成、放大和模型训练于一体的 AI 创作平台，有自研 Krea 2 图像模型，也能调用 Nano Banana、Seedance、Kling 等模型，免费版每天送额度。"
checkedOn: 2026-10-07
sources:
  - https://www.krea.ai/pricing
  - https://www.krea.ai/docs/user-guide/index
  - https://www.krea.ai/docs/user-guide/get-started/what-is-krea
  - https://www.krea.ai/docs/changelog
  - https://huggingface.co/krea
  - https://apps.apple.com/us/app/krea-ai-images-and-videos/id6742134132
---

> 本文根据 Krea 官网定价页、官方文档与更新日志、Krea 官方 Hugging Face 主页及 App Store 官方应用页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Krea 是 KREA.AI, INC. 推出的 AI 创作套件。官方文档把它描述为「生成、编辑、增强和动画化图片与视频」的一站式平台，最大特点有两个：一是**模型多**，在同一界面里可以切换 Krea 自研模型和 Google、OpenAI、Runway、Kling、Seedance、Wan 等第三方模型；二是**实时生成**，你一边打字、画草图或拖动形状，画面一边即时变化。

按官方更新日志，Krea 于 2026 年 5 月 12 日发布了第一个完全从零训练的基础图像模型 **Krea 2**，主打审美和创作控制，从颗粒感胶片摄影、棚拍、电影剧照到插画、数字绘画都能覆盖；6 月 23 日又开放了 Krea 2 Raw 和 Krea 2 Turbo 两个权重版本及技术报告，官方更新日志称采用宽松许可（permissive license），Hugging Face 上的许可证标注为 other（自定义条款）。

## 能做什么

- **图片生成**：文生图，可配合风格参考、情绪板、草图和 LoRA。
- **视频生成**：文字或图片转视频，可设首尾帧和镜头运动；官方文档说明单段多为 5–12 秒短片，可再延长片段拼成更长场景。
- **Realtime 实时画布**：边画边出图，适合快速探索构图。
- **Edit 与 Enhancer**：用文字和参考图做局部修改；放大锐化图片和视频。
- **训练**：上传自己的图片训练角色、物体或风格模型，复用到后续生成。
- **更多工具**：动作迁移、对口型、视频风格转换、3D 物体生成。
- **Nodes 与 Agent**：节点式工作流编辑器，可封装成可复用的小应用；Krea Agent 根据一段需求自动规划并调用多个模型。

## 怎么上手

1. 打开 krea.ai 点「Sign up for free」注册，或在 App Store 下载「Krea: AI Images and Videos」。
2. 先试 Realtime：在左边画几笔或放几个色块，右边输入描述，观察画面实时变化。
3. 进入 Image，模型选 Krea 2，写提示词并添加 1–2 张风格参考图。
4. 满意后用 Enhancer 放大，或把图片发到 Video 生成短片。
5. 需要固定角色或品牌风格时，用 Training 上传数据集训练专属模型。

可以这样开始：`risograph poster of people running in a city park, two-color print, grainy texture`

## 免费与付费

官网定价页显示（官网定价页，2026-10 查询）：

- **Free**：每天 100 个计算单位（compute units），无需信用卡，可用实时模型和全部图片、视频、3D 模型，LoRA 训练最多 50 张图，放大最高 2K。
- **Basic**：每月 5,000 单位；**Pro**：每月 20,000 单位；**Max**：每月 60,000 单位。
- **Business / Enterprise**：团队与组织管理、模型访问控制等。

付费方案包含商用许可、可购买额外计算单位包，部分档位可慢速无限生成；年付最多优惠约 40%。具体价格以定价页为准。

## 适合谁 / 不适合谁

适合：
- 想在一个平台对比多家图片、视频模型的设计师和视频创作者。
- 喜欢草图起稿、需要快速迭代构图的概念美术。
- 需要自定义风格模型、搭建可复用工作流的工作室。

不适合：
- 只想用一个固定模型、追求最低价格的用户，第三方模型消耗单位较多。
- 不熟悉英文界面的新手，官方文档以英文为主。
- 需要完全离线本地运行的场景（除非自行部署开放权重模型）。

## 注意事项

- **计算单位消耗不同**：不同模型、分辨率、视频时长消耗差别很大，生成前留意按钮上的消耗提示。
- **开放权重许可**：Krea 2 权重在 Hugging Face 发布，许可证为自定义条款，商用前请阅读模型页许可。
- **团队管控**：Business 和 Enterprise 可在组织层面限制成员能用哪些模型，适合有合规要求的公司。
- 生成内容须遵守平台使用政策。

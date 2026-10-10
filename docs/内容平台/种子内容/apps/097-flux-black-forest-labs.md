---
title: "FLUX 是什么：Black Forest Labs 的 AI 生图模型，官网 Playground、API 与开源权重"
slug: flux-black-forest-labs
name: FLUX（Black Forest Labs）
url: https://bfl.ai/
pricing: 按量付费 / 部分开放权重
platforms: 网页（Playground）/ API / 本地部署
products: [ai-tools]
models: []
topics: [photography, illustration, poster]
excerpt: "FLUX 是 Black Forest Labs 推出的 AI 图像模型系列，从 FLUX.1、FLUX.2 到多模态的 FLUX 3，可在官网 Playground 和 API 按张付费使用，部分版本开放权重可本地部署。"
checkedOn: 2026-10-07
sources:
  - https://bfl.ai/blog/flux-3
  - https://bfl.ai/pricing
  - https://docs.bfl.ml/quick_start/pricing
  - https://docs.bfl.ml/flux_2/flux2_overview
  - https://huggingface.co/black-forest-labs
  - https://github.com/black-forest-labs/flux
---

> 本文根据 Black Forest Labs 官网、定价页、官方 API 文档及其 Hugging Face / GitHub 官方主页整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

FLUX 是 AI 实验室 **Black Forest Labs（BFL）** 推出的视觉生成模型系列。按 BFL 官网「About」页，其创始团队参与过 Latent Diffusion、Stable Diffusion 和 FLUX.1 的研发，实验室设在德国弗莱堡和美国旧金山。FLUX.1 的官方推理代码仓库于 2024 年 8 月在 GitHub 公开，此后很多 AI 绘图平台都把 FLUX 作为可选模型。

需要先分清：FLUX 首先是一组**模型**，你可以通过三种方式使用它——BFL 官方的网页 **Playground**、官方 **API**，或下载**开放权重**在自己电脑 / 服务器上运行（也可以在 ComfyUI、LiblibAI 等第三方平台使用）。目前的主力产品线：
- **FLUX.2**：官方推荐的文生图和编辑模型，有 [pro]、[max]、[flex]、[klein] 4B / 9B、[dev] 等版本，支持最多 10 张参考图、精确配色和最高 400 万像素输出；
- **FLUX 3**：官方博客 2026 年 7 月 23 日宣布以早期访问（Early Access）形式推出的多模态基础模型，包括 FLUX 3 Image（文生图与编辑，最多 10 张参考图，支持边界框精确摆放元素）、FLUX 3 Video（带同步音频的视频，2026 年 8 月 4 日通过 API 正式开放生成功能）和 2026 年 9 月发布、面向机器人等场景的开放权重模型 FLUX 3 Action；
- **FLUX.1 Kontext** 等上一代模型仍可调用，但官方建议新项目使用 FLUX.2。

## 能做什么

- **高质量文生图**：写实摄影、产品图、插画、海报，提示词遵循度高。
- **多图参考编辑**：上传多张参考图融合人物、商品和场景，用文字指令修改细节。
- **精确布局**：FLUX 3 Image 可用边界框指定每个元素的位置，再逐框换色、移动或删除。
- **专用工具**：扩图（Outpainting）、擦除、去模糊、虚拟试衣（VTO）、视频放大等 API 工具。
- **本地部署与微调**：开放权重版本可在本地运行，并训练 LoRA。
- **MCP 接入**：官方 MCP 服务器可让 Claude、Claude Code、Codex、Cursor、VS Code 等 MCP 客户端直接调用 FLUX 生图和生成视频。

## 怎么上手

1. 打开 bfl.ai，点击「Try Flux」进入 Playground，注册 BFL 账号。
2. 在 Dashboard 里充值积分（1 积分 = 0.01 美元），Playground 与 API 价格相同。
3. 选择模型（如 FLUX.2 [pro] 或 FLUX 3 Image）、分辨率和比例，输入提示词生成。
4. 开发者在 Dashboard 创建 API Key，按官方文档用几行代码提交生成请求。
5. 想本地免费跑，去 Hugging Face 下载开放权重，配合 ComfyUI 使用。

可以这样开始：`Product photo of a ceramic coffee mug on a linen tablecloth, morning window light, shallow depth of field`

## 免费与付费

BFL 官方采用**按量付费、无订阅、无席位费**（官网定价页与官方定价文档，2026-10 查询）：1 积分 = 0.01 美元，API 与 Playground 同价；例如 FLUX 3 Image 约 1K 分辨率每张 0.048 美元、2K 每张 0.10 美元，FLUX.2 [klein] 每张 0.014 美元起；FLUX 3 视频按输出秒数计费。开放权重的许可证分几类：FLUX.2 [klein] 4B 采用 Apache-2.0，可商用；[klein] 9B、[dev] 等使用 FLUX 非商业许可，商用自托管需购买官方 Builder、Platform、Professional 等授权套餐。

## 适合谁 / 不适合谁

适合：
- 需要写实产品图、人像摄影风格图的电商和广告团队。
- 要把生图能力接入自己产品的开发者（API 计价透明）。
- 有显卡、想本地部署开源模型并微调的技术用户。

不适合：
- 想要开箱即用、带社区和模板的一站式创作 App 的普通用户。
- 只愿意用中文界面的用户，官网和文档为英文。
- 不了解许可证就打算商用开放权重模型的团队。

## 注意事项

- **许可证差异**：同属 FLUX，不同版本许可完全不同，部署前务必核对模型页 License。
- **硬件**：开放权重模型需要较大显存，参数量更小的 [klein] 版本对硬件更友好。
- **内容政策**：BFL 有使用政策（Usage Policy），使用 Playground 和 API 都须遵守。
- **第三方平台**：其他网站提供的「FLUX」服务价格、版本和条款由其自定，不代表 BFL 官方。

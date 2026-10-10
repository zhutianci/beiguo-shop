---
title: "ComfyUI 官网下载与使用教程：节点式 AI 工作流、桌面版与云端版"
slug: comfyui-node-workflow
name: ComfyUI
url: https://www.comfy.org/
pricing: 开源免费（GPL-3.0）/ Comfy Cloud 付费
platforms: Windows / macOS / Linux / 网页（Comfy Cloud）/ API
trialNote: 本地版完全免费；Comfy Cloud 可免费试跑 5 次真实 GPU 任务，无需信用卡
products: [ai-tools]
models: []
topics: [illustration, image-to-video, game-art]
excerpt: "ComfyUI 是开源的节点式 AI 图像与视频工作流工具，用连线搭建生成流程，支持 Stable Diffusion、FLUX、Wan 等开源模型，可本地免费运行，也有官方桌面版和云端版。"
checkedOn: 2026-10-07
sources:
  - https://github.com/Comfy-Org/ComfyUI
  - https://docs.comfy.org/installation/system_requirements
  - https://docs.comfy.org/get_started/first_generation
  - https://www.comfy.org/cloud/pricing
  - https://docs.comfy.org/support/payment/accepted-payment-methods
  - https://github.com/Comfy-Org/Comfy-Desktop
---

> 本文根据 ComfyUI 官方 GitHub 仓库、官方文档（docs.comfy.org）与 Comfy Cloud 定价页整理，资料核对于 2026-10-07。开源项目和价格变化快，以官网为准。

## 是什么

ComfyUI 是一个开源的 AI 生成工作流工具，2023 年 1 月由开发者 comfyanonymous 创建，现由 Comfy Org 团队维护（仓库 Comfy-Org/ComfyUI，GPL-3.0 许可，GitHub 星标 13 万以上，2026 年 10 月 5 日刚发布 v0.39.0，仍在频繁发版）。

它和 Stable Diffusion WebUI 最大的不同是**节点式界面**：加载模型、写提示词、采样、解码、保存，每一步都是画布上的一个「节点」，用连线把它们串成工作流。这样上手门槛稍高，但流程完全透明、可任意组合，新模型通常也最快获得支持。现在它已不止生图，还能跑视频（如 Wan 系列）、音频和 3D 工作流，并可通过官方的 Partner 节点调用部分闭源模型。

## 能做什么

- **搭建生成流程**：文生图、图生图、局部重绘、放大、ControlNet、LoRA 等自由组合。
- **视频与多模态**：图生视频、文生视频、音频和 3D 相关工作流。
- **工作流即文件**：生成的 PNG 里保存了完整工作流，拖进界面就能还原全部节点和参数，方便分享复现。
- **模板与社区节点**：内置官方模板；通过 ComfyUI-Manager 安装海量社区自定义节点。
- **Partner 节点**：在工作流里调用第三方闭源模型 API，按积分付费。
- **Comfy Agent**：官网显示已可在 ComfyUI 内用自然语言让智能体帮你搭工作流。

![ComfyUI 默认文生图工作流：Load Checkpoint、CLIP 文本编码、KSampler、VAE Decode、Save Image 等节点用连线串联](seed:a094-comfyui-workflow.jpg)
*图片来源：[ComfyUI 官方文档《First Generation》](https://docs.comfy.org/get_started/first_generation)*

## 怎么上手

1. **选版本**：
   - **Comfy Desktop**（官方桌面版）：支持 Windows 10 及以上（推荐 NVIDIA 或 AMD 显卡）、Apple Silicon 的 macOS、Linux（AppImage / .deb），默认跟随稳定版自动更新；
   - **Portable 便携版**：仅 Windows，支持 NVIDIA 显卡或纯 CPU，跟进最新提交；
   - **手动安装**：支持 NVIDIA、AMD、Intel、Apple Silicon 等各类硬件；
   - **Comfy Cloud**：浏览器打开 cloud.comfy.org，无需显卡。
2. 从 comfy.org 下载桌面版安装，首次启动会自动配置 Python 环境。
3. 打开官方模板里的文生图工作流，按提示下载缺失的模型文件。
4. 在 CLIP Text Encode 节点里改提示词，点右上角 Run 生成。
5. 熟悉后逐步替换节点、安装自定义节点，搭出自己的流程。

## 免费与付费

本地运行完全免费开源（GPL-3.0），成本在于显卡和电费。**Comfy Cloud** 云端版价格（官网定价页，2026-10 查询）：

| 方案 | 月付 | 年付折合每月 | 说明 |
| --- | --- | --- | --- |
| Standard | 20 美元 | 16 美元 | 单次任务最长 30 分钟 |
| Creator | 35 美元 | 28 美元 | 可导入自己的模型 |
| Pro | 100 美元 | 80 美元 | 单次任务最长 1 小时 |
| Team | 700 美元 | 630 美元 | 最多 50 名成员共享积分 |

官方说明 Cloud 运行在 96GB 显存的 RTX 6000 Pro（Blackwell）显卡上；付款支持银行卡，美元结算时也可用支付宝。

## 适合谁 / 不适合谁

适合：
- 想第一时间用上最新开源图像、视频模型的进阶用户。
- 需要可复现、可批量化生产流程的设计工作室和开发者。
- 本地显卡不够但想用完整 ComfyUI 的用户（用 Comfy Cloud）。

不适合：
- 只想输入一句话出图的新手，节点和模型概念需要学习时间。
- 没有独立显卡又不愿付费上云的用户。
- 不想处理模型下载、节点依赖冲突的人。

## 注意事项

- **自定义节点安全**：社区节点会在本地执行代码，只安装可信来源，留意官方安全提示。
- **模型许可**：ComfyUI 本身开源，但各模型有自己的许可证，商用前逐个核对。
- **GPL 义务**：修改并分发 ComfyUI 代码需遵守 GPL-3.0。
- 官方文档有中文版本，遇到问题可查 docs.comfy.org 或 GitHub Issues。

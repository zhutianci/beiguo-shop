---
title: "InvokeAI 是什么、怎么安装：带统一画布的开源 AI 绘画工具，支持 SDXL 与 FLUX"
slug: invokeai-stable-diffusion-canvas
name: InvokeAI
url: https://github.com/invoke-ai/InvokeAI
pricing: 开源免费
platforms: Windows / macOS / Linux（本地部署，浏览器界面）
products: [ai-tools]
models: []
topics: [illustration, photo-edit, game-art]
excerpt: "InvokeAI 是免费开源的本地 AI 绘画工具，提供面向创作的网页界面：统一画布可做局部重绘和扩图，另有节点工作流、模型管理和图库，支持 SD 1.5、SDXL、FLUX、SD 3.5 等模型，用官方启动器安装。"
checkedOn: 2026-10-11
sources:
  - https://github.com/invoke-ai/InvokeAI
---

> 本文根据 InvokeAI 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

InvokeAI 是一款本地运行的 AI 图像创作工具，README 称它是面向 Stable Diffusion 系列模型的「创作引擎」，仓库 invoke-ai/InvokeAI 约有 2.85 万星标，主体采用 Apache-2.0 许可（仓库另含其他几种许可的组件），可免费使用。

本地 AI 绘画界有三款常被放在一起比较的工具：Stable Diffusion WebUI 像一块功能齐全的控制面板，ComfyUI 是节点连线的工作流，而 InvokeAI 的侧重点是**画布**——它的界面更像一款修图 / 绘画软件，适合「生成一张图，然后在上面反复改」的创作方式。

## 能做什么

README 列出的功能：

- **统一画布（Unified Canvas）**：在同一块画布上做局部重绘（inpainting）、向外扩图（outpainting），配合画笔工具涂改；
- **节点工作流**：需要可复用、可定制的流程时，用节点方式搭建；
- **模型管理器**：下载、导入和切换模型；
- **图库与看板**：按项目整理生成的图片；
- **其他**：文本嵌入（embedding）支持、图像放大、基于 SAM / SAM2 的物体分割（点一下选中物体）。

**支持的模型**：SD 1.5、SD 2.0、SDXL、多个 FLUX 版本，以及 SD 3.5、Qwen Image 等；另有一些通过 API 调用的模型选项。

## 怎么上手

1. 在仓库的 Releases 页面下载官方启动器（Launcher）。
2. 运行启动器，按提示选择安装位置，它会自动准备运行环境并安装 InvokeAI。
3. 启动后浏览器会打开本地界面，先在模型管理器里安装一个入门模型。
4. 在生成页输入提示词出第一张图，然后把图发送到画布，试试涂抹局部重绘和向外扩图。

硬件方面 README 只写了需要「兼容的硬件」，没有列出具体数字。一般来说，本地跑这些模型需要显存较充足的独立显卡，FLUX 等大模型的要求更高，具体以官方文档的硬件说明为准。

## 免费与付费

InvokeAI 免费开源，本地使用没有次数限制，成本是显卡和电费。README 提到这个项目是多款商业产品的基础，但没有点名，是否有官方的付费托管版本以官网为准。

## 适合谁 / 不适合谁

**适合：**
- 习惯在画布上反复修改、合成的插画师和设计师；
- 觉得 ComfyUI 的节点太复杂、又希望比 WebUI 更有「创作软件」手感的人；
- 想在本地离线使用 SDXL、FLUX 的用户。

**不适合：**
- 没有独立显卡的电脑；
- 追求最新社区节点和最快支持新模型的进阶玩家，ComfyUI 的生态更大；
- 只想输入一句话在线出图的新手。

## 注意事项

- **模型许可各不相同**：软件免费不代表模型可以随意商用，FLUX、SD 3.5 等各有许可条款，用前核对。
- **只从官方仓库下载启动器**，模型文件优先选择 safetensors 格式并从可信来源获取。
- **磁盘空间**：每个模型数 GB 到十几 GB，留足空间。
- **仓库包含多种许可的组件**，做二次开发或再分发前阅读 LICENSE 文件。

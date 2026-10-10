---
title: "Stable Diffusion WebUI（AUTOMATIC1111）是什么：下载安装、硬件要求与使用教程"
slug: stable-diffusion-webui-automatic1111
name: Stable Diffusion WebUI（AUTOMATIC1111）
url: https://github.com/AUTOMATIC1111/stable-diffusion-webui
pricing: 开源免费（AGPL-3.0）
platforms: Windows / Linux / macOS（本地部署）
products: [ai-tools]
models: []
topics: [illustration, character, game-art]
excerpt: "Stable Diffusion WebUI（AUTOMATIC1111）是最知名的开源本地 AI 绘图界面，免费在自己电脑上运行 Stable Diffusion 模型，支持文生图、图生图、局部重绘和海量扩展，需要独立显卡。"
checkedOn: 2026-10-07
sources:
  - https://github.com/AUTOMATIC1111/stable-diffusion-webui
  - https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features
  - https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Install-and-Run-on-NVidia-GPUs
  - https://github.com/AUTOMATIC1111/stable-diffusion-webui/releases
  - https://github.com/lllyasviel/stable-diffusion-webui-forge
---

> 本文根据 AUTOMATIC1111/stable-diffusion-webui 官方 GitHub 仓库 README、Wiki 与发布记录整理，资料核对于 2026-10-07。开源项目变化快，以仓库最新说明为准。

## 是什么

Stable Diffusion WebUI 是开发者 AUTOMATIC1111 在 2022 年 8 月创建的开源项目，基于 Gradio 做了一个网页界面，让你在**自己的电脑上**运行 Stable Diffusion 系列开源图像模型。它是 AI 绘画早期最流行的本地工具之一，GitHub 星标超过 16 万（2026-10 查询），大量教程、模型站和插件都围绕它展开。

需要说明它的现状：从官方仓库看，**最新正式版是 2025 年 2 月的 v1.10.1，主分支自 2024 年中以后几乎没有新提交**，项目处于事实上的维护放缓状态，对 2025 年以后发布的新模型支持有限。社区因此出现了 Forge 等衍生项目（lllyasviel/stable-diffusion-webui-forge，同为 AGPL-3.0），基于 WebUI 1.10.1 构建，README 称其目标是优化资源管理、加快推理并试验新功能，Forge 自己也称原版 WebUI「几乎静止」。如果你刚开始接触本地部署，也可以对比一下节点式的 ComfyUI。

## 能做什么

- **文生图 / 图生图**：最基础的 txt2img、img2img 两种模式。
- **局部重绘与扩图**：Inpainting 改局部、Outpainting 向外扩展画面。
- **高清修复与放大**：Hires. fix 和 Extras 页的放大算法。
- **加载各类模型**：切换 Checkpoint 底模，叠加 LoRA、Embedding 控制画风和角色。
- **扩展生态**：Extensions 页安装 ControlNet 等插件，实现姿势、线稿、深度控制。
- **PNG Info**：读取 WebUI 生成图片里保存的提示词和参数，方便复现。
- **训练与合并**：内置 Embedding 训练、Checkpoint 合并等工具。

![Stable Diffusion WebUI 的 txt2img 页面，左侧是提示词和采样参数，右侧是生成结果](seed:a093-sd-webui-txt2img.jpg)
*图片来源：[AUTOMATIC1111/stable-diffusion-webui 官方 GitHub 仓库 README](https://github.com/AUTOMATIC1111/stable-diffusion-webui)*

## 怎么上手

1. **确认硬件**：官方推荐 NVIDIA 显卡，也提供 AMD 显卡、Intel CPU/显卡、昇腾 NPU 的安装说明；显存越大能跑的模型和分辨率越高。
2. **Windows 简便安装**：按 README，从 Releases 下载 `sd.webui.zip` 解压，先运行 `update.bat` 再运行 `run.bat`。
3. **手动安装**：安装 Python 3.10.6（README 注明更新版本的 Python 不支持其使用的 torch）和 git，克隆仓库后运行 `webui-user.bat`（Linux 用 `webui.sh`）。
4. 首次启动会自动安装依赖，完成后在浏览器打开命令行窗口里显示的本地网址。
5. 把下载好的模型文件放入 `models/Stable-diffusion` 目录，在左上角选择模型，写提示词点 Generate。

可以这样开始：`a watercolor illustration of a fox in a snowy forest, soft light`，负面提示词写 `blurry, lowres`。

## 免费与付费

软件本身完全免费开源，许可证为 **AGPL-3.0**。成本主要在硬件（显卡、电费）上；没有显卡的用户，README 也列出了 Google Colab 等在线运行方案。注意：模型文件要另外下载，每个模型有自己的许可证，可否商用要看模型作者和底模的许可条款。

## 适合谁 / 不适合谁

适合：
- 有 NVIDIA 独立显卡、想免费无限次本地出图的爱好者。
- 需要用 LoRA、ControlNet 精细控制角色和构图的插画、游戏美术人员。
- 重视隐私、不希望图片上传到云端的用户。

不适合：
- 没有独立显卡或显存很小的电脑。
- 想用 2025 年后新模型的用户，更建议看 Forge 分支或 ComfyUI。
- 不愿意折腾 Python 环境、命令行和报错排查的新手，可先用在线平台。

## 注意事项

- **项目更新放缓**：遇到新模型不兼容属于常见情况，先查 Issues 或换用活跃分支。
- **整合包来源**：网上有不少第三方整合包，并非官方发布，请从可信渠道下载并留意安全风险。
- **扩展与模型安全**：只安装可信扩展，模型优先选 safetensors 格式。
- **AGPL 义务**：若你修改代码并作为网络服务对外提供，需遵守 AGPL-3.0 公开源码的要求。
- 不得用于生成违法、侵权或侵犯他人肖像的内容。

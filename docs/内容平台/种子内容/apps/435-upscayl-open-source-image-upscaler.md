---
title: "Upscayl 官网下载与使用：免费开源的 AI 图片无损放大软件（Windows / Mac / Linux）"
slug: upscayl-open-source-image-upscaler
name: Upscayl
url: https://upscayl.org/
pricing: 免费开源（AGPL-3.0）
platforms: Windows / macOS / Linux
trialNote: 桌面版完全免费，在本机离线处理
products: [ai-tools]
models: []
topics: [photo-edit, old-photo, wallpaper]
excerpt: "Upscayl 是免费开源的 AI 图片放大软件，支持 Windows、macOS 和 Linux，基于 Real-ESRGAN 模型在本机离线把低分辨率图片放大变清晰，需要支持 Vulkan 的显卡。"
checkedOn: 2026-10-11
sources:
  - https://github.com/upscayl/upscayl
  - https://upscayl.org/
---

> 本文根据 Upscayl 官方 GitHub 仓库 README 与官网整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Upscayl 是一款免费、开源的 AI 图片放大工具，仓库 upscayl/upscayl 约有 5.04 万星标，采用 AGPL-3.0 许可。它做的事情很单纯：把小图、糊图放大成更高分辨率，同时尽量保持清晰。

它和在线放大网站最大的区别是**全部在你自己的电脑上完成**：图片不上传、没有次数限制、不用注册、也没有水印。底层使用 Real-ESRGAN 系列模型，通过一个基于 Vulkan 的后端（upscayl-ncnn，同样以 AGPLv3 开源）运行。

## 能做什么

- **单张放大**：选图、选模型、点放大。
- **批量放大**：选择整个文件夹一次处理。
- **多种模型**：内置面向照片、数字绘画、动漫等不同内容的模型，可按图片类型选择。
- **自定义模型**：支持加载社区训练的其他兼容模型。
- **输出设置**：选择放大倍数、输出格式和保存位置。

常见用途：老照片翻新前的放大、AI 生成图放大到壁纸或印刷尺寸、网上找到的小尺寸素材补救、商品图放大。

## 怎么上手

1. 安装：
   - **Windows**：从官网或 GitHub Releases 下载 EXE 安装包；
   - **macOS**：Mac App Store、Releases 页的 DMG，或 `brew install --cask upscayl`；
   - **Linux**：Flathub、AppImage、AUR 或 Snap。
2. 打开软件，第一步选择图片（或切到批量模式选择文件夹）。
3. 第二步选择模型：真实照片用通用照片模型，插画和动漫用对应的模型。
4. 第三步设置输出文件夹，点「Upscayl」开始，处理完成后可以左右拖动对比前后效果。

## 免费与付费

桌面软件完全免费开源，在本机处理不限次数。本文介绍的是免费的桌面版；官网如提供其他付费的在线服务，以官网说明为准。

## 适合谁 / 不适合谁

**适合：**
- 经常需要把图片放大、又不想把图片上传到第三方网站的人；
- 设计师、摄影爱好者、AI 绘画玩家；
- 需要批量处理一整个文件夹的用户。

**不适合：**
- 电脑没有支持 Vulkan 的显卡——README 明确写了需要 Vulkan 兼容的 GPU，很多集成显卡不受支持；
- 指望它「凭空还原」严重模糊或失焦照片细节的用户，AI 放大是推测补全，不是真实还原；
- 需要抠图、调色等综合修图功能的人，它只做放大这一件事。

## 注意事项

- **AI 放大会「脑补」**：人脸、文字、细密纹理可能被改得与原图不同，证件、证据类图片不要使用放大后的版本。
- **大图很吃显存和时间**：显卡较弱时先用小图测试，批量任务可以挂着慢慢跑。
- **只从官方渠道下载**：官网、官方 GitHub 仓库或系统应用商店。
- **AGPL 许可**：把它集成进自己的软件再分发时，需要遵守 AGPL-3.0 的开源义务。

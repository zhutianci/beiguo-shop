---
title: ComfyUI 安装教程：桌面版、便携版怎么选，装模型并生成第一张图
slug: comfyui-install-first-image
products: [ai-tools]
models: []
accountTier: FREE
excerpt: ComfyUI 怎么安装、怎么用？本文按 ComfyUI 官方中文文档讲清桌面版、Windows 便携版、手动安装三种方式的区别和系统要求，以及装好之后加载文生图工作流、下载第一个模型、点 Run 生成第一张图的完整过程。
checkedOn: 2026-10-11
sources:
  - https://docs.comfy.org/zh-CN/installation/system_requirements
  - https://docs.comfy.org/zh-CN/installation/desktop/windows
  - https://docs.comfy.org/zh-CN/installation/comfyui_portable_windows
  - https://docs.comfy.org/zh-CN/get_started/first_generation
  - https://github.com/Comfy-Org/ComfyUI
---

## 适用于谁

- 搜「comfyui 安装」「comfyui安装教程」「comfyui 桌面版」「comfyui怎么用」的人；
- 想在自己电脑上跑 Stable Diffusion 等开源绘图模型，不知道从哪个安装包开始的人。

本文根据 ComfyUI 官方中文文档整理，资料核对于 2026-10-11。官方自己也提醒 ComfyUI 更新频繁，文档未必及时，版本细节以官方 GitHub 仓库的说明为准。本文只讲官方发行的版本，不涉及第三方整合包。

## 结论先说

1. **ComfyUI 是一个用「节点 + 连线」搭工作流的本地 AI 绘图工具**，本身不含模型，装好之后还要另外下载模型文件。
2. **官方有三种装法**：桌面版（Comfy Desktop，最省事）、Windows 便携版（解压即用，始终是最新代码）、手动安装（所有系统和显卡类型都支持）。
3. **新手选桌面版**；想第一时间用上新功能、用的是 Windows，选便携版。
4. **第一张图的流程**：加载默认的文生图工作流 → 按提示下载缺失的模型 → 在 Load Checkpoint 节点选中模型 → 点 Run。
5. 不想本地安装的话，官方还有云端版 Comfy Cloud。

## 三种安装方式怎么选

| 方式 | 支持的系统 | 特点（依据官方文档） |
| --- | --- | --- |
| 桌面版 Comfy Desktop | Windows、macOS（Apple Silicon）、Linux（AppImage 和 .deb） | 安装器形式；可以在一个启动器里管理多个 ComfyUI 实例；默认跟随 ComfyUI 的**稳定版** |
| 便携版 Portable | 目前仅 Windows | 自带独立的 Python 环境，解压即用；始终使用最新提交；按显卡分 NVIDIA、AMD、Intel 三种包 |
| 手动安装 | 全部系统 | 自己装 Python 和 PyTorch；支持 NVIDIA、AMD、Intel、Apple Silicon 等所有显卡类型 |

## 系统要求

官方文档列出的要点：

- **操作系统**：Windows、Linux、macOS（支持 Apple Silicon）；
- **桌面版（Windows）**：Windows 10 或更高，x64 或 ARM64；推荐独立显卡（NVIDIA / AMD），但不是必需；每次安装建议至少 4.85 GB 磁盘空间（不含模型）；
- **显卡**：NVIDIA、AMD、Intel Arc、Apple Silicon（通过 Metal 加速）都支持；没有显卡可以加 `--cpu` 参数用 CPU 跑，官方注明速度较慢；
- **Python**（手动安装才需要关心）：官方推荐 3.13；某些自定义节点在 3.13 上有依赖问题时，3.12 是备选；
- **浏览器**：官方建议 Google Chrome 143 或更高版本，并说明更早的版本存在已知的显示和性能问题。

模型文件另外占空间，官方的说法是单个生成模型经常是数 GB 级别，磁盘要留足。

## 步骤

### 方法一：安装桌面版（推荐新手）

1. 到 ComfyUI 官网的下载页，下载对应系统的安装程序；
2. Windows 上运行下载的 `.exe`，按提示完成安装，然后从开始菜单或桌面快捷方式启动 Comfy Desktop；
3. 第一次打开会看到欢迎界面，在这里创建你的第一个安装（实例）。

桌面版会自动检查更新：有新版本时窗口顶部会出现 **Desktop Update Ready** 按钮，点击后应用重启并完成更新。

### 方法二：Windows 便携版

1. 在官方文档的便携版页面，按显卡类型下载对应的压缩包（NVIDIA 标准版、支持 10 系及更早显卡的版本、AMD 版、Intel 版）；
2. 用 7-Zip 解压，得到 `ComfyUI_windows_portable` 文件夹，里面有：
   - `ComfyUI`：程序主体；
   - `python_embeded`：独立的 Python 环境；
   - `update`：升级用的批处理脚本；
   - `run_nvidia_gpu.bat`（AMD 版是 `run_amd_gpu.bat`，Intel 版是 `run_intel_gpu.bat`）和 `run_cpu.bat`；
3. 双击与你显卡对应的 `.bat` 文件启动。

命令行窗口里出现下面这一行，说明服务已经启动：

```
To see the GUI go to: http://127.0.0.1:8188
```

正常情况下浏览器会自动打开这个地址，没有的话手动打开。**使用期间不要关闭这个命令行窗口**，关掉 ComfyUI 就停了。官方文档还提示：便携版附带 PyTorch 的 CUDA 版本，启动失败时先更新 NVIDIA 驱动。

### 加载文生图工作流

ComfyUI 打开后通常会自动加载默认的文生图工作流。官方教程还介绍了另外几种加载方式，值得知道：

- **从模板加载**：在工作流模板里选择 Text to Image；
- **拖入图片**：ComfyUI 生成的图片都带有元数据，里面包含完整的工作流。把这样的图片拖进界面，对应的工作流就会被还原出来；
- **打开 JSON 文件**：菜单 **工作流（Workflows）→ 打开（Open）**。自己的工作流可以用 **工作流 → 导出（Export）** 存成 JSON。

### 安装第一个模型

官方说明，初始安装通常不包含任何绘图模型。加载工作流后如果缺少模型，ComfyUI 会弹出缺失提示，点开可以看到缺的是哪个文件和它的下载链接。默认教程用的是 `v1-5-pruned-emaonly-fp16.safetensors`。

两种装法：

- **自动下载**：在提示里点 **Download**。桌面版会直接下载并保存到 `ComfyUI/models/checkpoints`；便携版则由浏览器下载，下载完要自己把文件放进 `ComfyUI_windows_portable/ComfyUI/models/checkpoints`；
- **手动下载**：从提示里复制下载链接，自己下载后放进上面的 `checkpoints` 文件夹。

官方文档写明，自动下载通常从 Hugging Face 拉取模型，需要你的网络能正常访问 Hugging Face；如果长时间不开始或进度不动，就改用手动方式。

放好之后，在界面里按键盘 **R** 键刷新，或者重启 ComfyUI，模型才会出现在节点的下拉列表里。

### 生成第一张图

1. 在 **Load Checkpoint** 节点里确认选中了刚才的模型（下拉框里不应显示 null）；
2. 在正向提示词节点里写你想要的画面，负向提示词节点里写不想要的内容；
3. 点 **Run** 按钮，或按 `Ctrl + Enter`；
4. 流程跑完后，图片会出现在 **保存图像（Save Image）** 节点里，右键可以保存到本地。

## 常见问题

**Q：Load Checkpoint 里没有模型可选，或者显示 null？**
官方给的排查顺序：先确认模型文件放在了正确的文件夹，再刷新（按 R）或重启 ComfyUI。模型放哪个文件夹、怎么和其他软件共用，见《ComfyUI 模型放哪里》。

**Q：ComfyUI 和 Stable Diffusion 是什么关系？**
Stable Diffusion 是绘图模型，ComfyUI 是运行这些模型的界面和工作流工具。除了 Stable Diffusion 系列，官方说明支持的模型会随版本持续增加，新支持的模型通常会出现在工作流模板里。

**Q：桌面版卸载后数据还在吗？**
在。官方文档写明，卸载只移除启动器本身；你创建的安装、共享模型库、设置和日志都要手动删除。Windows 上默认位置分别在 `%LOCALAPPDATA%\Comfy-Desktop\` 和 `%APPDATA%\Comfy Desktop` 下。

**Q：有官方 Docker 镜像吗？**
没有。官方文档明确说 ComfyUI 不提供官方 Docker 镜像，Docker Hub 上的都是社区维护的，不受官方支持，需自行评估风险。

**Q：Mac 能用吗？**
Apple Silicon 的 Mac 可以，使用 PyTorch 的 MPS 后端做 GPU 加速。官方桌面版的 macOS 版本只支持 Apple Silicon。

**Q：本地显卡不够怎么办？**
官方的云端版 Comfy Cloud 不需要安装。官方文档写的是用 Google 账号登录、每位用户每月可获得 400 积分，具体以官网为准。

## 参考资料

- ComfyUI 文档：系统要求 — https://docs.comfy.org/zh-CN/installation/system_requirements
- 适用于 Windows 的 Comfy Desktop — https://docs.comfy.org/zh-CN/installation/desktop/windows
- 适用于 Windows 的 ComfyUI 便携版 — https://docs.comfy.org/zh-CN/installation/comfyui_portable_windows
- 开始 ComfyUI 的 AI 绘图之旅 — https://docs.comfy.org/zh-CN/get_started/first_generation
- ComfyUI 官方仓库 — https://github.com/Comfy-Org/ComfyUI

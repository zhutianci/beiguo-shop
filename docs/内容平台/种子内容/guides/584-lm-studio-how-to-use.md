---
title: LM Studio怎么用：下载模型、切换中文、聊天与本地 API 服务入门
slug: lm-studio-how-to-use
products: [ai-tools]
models: []
accountTier: FREE
excerpt: LM Studio怎么用？本文按官方文档讲清系统要求、在 Discover 里下载模型时量化版本怎么选、怎么把界面切成中文、给对话附加文档，以及在 Developer 页开启 OpenAI 兼容的本地 API 服务（默认端口 1234）。
checkedOn: 2026-10-11
sources:
  - https://lmstudio.ai/docs/app
  - https://lmstudio.ai/docs/app/system-requirements
  - https://lmstudio.ai/docs/app/basics
  - https://lmstudio.ai/docs/app/basics/download-model
  - https://lmstudio.ai/docs/app/basics/rag
  - https://lmstudio.ai/docs/app/offline
  - https://lmstudio.ai/docs/cli
---

## 适用于谁

- 搜「lm studio 怎么用」「lm studio 中文」「lm studio 下载模型」「lm studio api」的人；
- 不想敲命令行，希望用图形界面在本机跑开源大模型的人。

本文根据 LM Studio 官方文档整理，资料核对于 2026-10-11。界面里的英文名称（Discover、Chat、Developer 等）沿用官方文档的写法，切成中文后对应的名称以实际界面为准。

## 结论先说

1. **LM Studio 是一个带图形界面的本地大模型桌面应用**：下载模型、聊天、开本地 API 服务都在一个窗口里完成。
2. **三步上手**：在 Discover 页下载模型 → 在 Chat 页用模型加载器加载 → 开始对话。
3. **界面可以切成中文**：设置里的 Preferences → Language。
4. **下载时看到的 Q4、Q8 是量化版本**，同一个模型的不同压缩程度。官方建议机器带得动就选 4-bit 或更高的版本。
5. **本地 API 兼容 OpenAI 格式**，官方示例地址是 `http://localhost:1234/v1`。
6. 官方说明：聊天、读文档、本地服务这些核心功能都不需要联网，对话内容不会离开你的设备。

## 系统要求

官方文档列出的要求：

| 系统 | 要求 |
| --- | --- |
| macOS | Apple Silicon 芯片（M 系列），macOS 14.0 或更新；建议 16GB 以上内存，8GB 也能用但只适合小模型和较小的上下文。**Intel 芯片的 Mac 目前不支持** |
| Windows | x64 和 ARM（骁龙 X Elite）都支持；x64 的 CPU 需要支持 AVX2 指令集；建议至少 16GB 内存、至少 4GB 独立显存 |
| Linux | 以 AppImage 形式分发，支持 x64 和 ARM64；要求 Ubuntu 20.04 或更新 |

## 步骤

### 1. 安装并切换中文

到 lmstudio.ai 下载安装。装好后如果想用中文界面：

1. 按 `Ctrl` + `,`（macOS 是 `Cmd` + `,`）打开设置；
2. 在 Preferences 下找到 Language 下拉菜单，选择中文。

官方文档列出的界面语言包含中文（简体、繁体都有，由社区贡献者翻译）。文档还注明：要进入设置页，需要处于 Power User 或更高的模式；如果你在界面上找不到设置，先把应用的模式从 User 切到 Power User（切换位置以实际界面为准）。

### 2. 下载第一个模型

1. 打开 **Discover** 页（快捷键 `Ctrl` + `2`，macOS 是 `Cmd` + `2`）；
2. 从推荐列表里挑一个，或者在搜索框输入关键词（如 `qwen`、`gemma`）。官方说明这里搜的是 Hugging Face 上的模型，也可以直接粘贴 `用户名/模型名`，甚至完整的 Hugging Face 链接；
3. 在右侧选择一个下载选项，点下载。

**下载选项怎么选**：同一个模型会列出 `Q3_K_S`、`Q4_K_M`、`Q8_0` 等多个文件。官方的解释是，它们是同一个模型在不同保真度下的拷贝，Q 代表「量化」，大致就是压缩文件体积、同时牺牲一部分质量。数字越小文件越小、质量损失越大。官方建议：机器跑得动的话，选 4-bit 或更高。更完整的判断方法见《本地大模型怎么选》。

### 3. 加载模型并聊天

1. 切到 **Chat** 页；
2. 打开模型加载器（快捷键 `Ctrl` + `L`，macOS 是 `Cmd` + `L`）；
3. 选一个已下载的模型，可以顺便调整加载参数（例如上下文长度、放多少层到显卡）；
4. 加载完成后直接提问。

官方对「加载」的解释是：把模型的权重放进电脑内存。所以加载会占用相当于模型文件大小的内存或显存，加载不了通常就是内存不够，换小一档的量化版本或更小的模型。

聊天页的几个操作：`Ctrl` + `N` 新建对话，`Ctrl` + `Shift` + `N` 新建文件夹；对话可以拖进文件夹整理；拖动对话标签到窗口左右两侧可以分屏并排看两个对话。

### 4. 让模型读文档

对话里可以附加 `.docx`、`.pdf`、`.txt` 文件。官方文档说明了两种处理方式：

- 文档够短、放得进模型的上下文：全文直接加入对话；
- 文档很长：自动改用检索增强（RAG），只挑出和你的问题相关的片段给模型参考。

所以问长文档时有一个官方给的窍门：**问题里尽量多带上下文**，把你预期原文中会出现的术语、说法写进问题里，检索到正确片段的概率更高。文档处理全部在本机完成。

### 5. 开启本地 API 服务

1. 打开 **Developer** 页，启动服务，并加载一个模型；
2. 用任何支持 OpenAI 格式的代码或工具连接。官方示例：

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

completion = client.chat.completions.create(
    model="model-identifier",   # 换成 Developer 页里显示的模型标识
    messages=[
        {"role": "system", "content": "回答使用简体中文。"},
        {"role": "user", "content": "介绍一下你自己。"},
    ],
    temperature=0.7,
)
print(completion.choices[0].message)
```

`api_key` 填任意字符串即可。除了 OpenAI 兼容接口，官方还提供自己的 REST API（文档标注为 beta）和 TypeScript SDK。

也可以用自带的命令行工具 `lms`（随 LM Studio 一起安装，需要先至少打开过一次应用）：

```bash
lms server start            # 启动服务，端口沿用上次的设置
lms server start --port 3000
lms ls                      # 列出已下载的模型
lms ps                      # 列出已加载的模型
```

想让服务常驻，可以在设置里勾选「登录时启动 LLM 服务」，之后关闭窗口会最小化到系统托盘，服务继续在后台运行。

### 6. 导入在别处下载的模型

已经有 `.gguf` 文件的话，不用重新下载：

```bash
lms import 路径/模型文件.gguf
```

官方把这个命令标注为实验性功能。也可以手动把文件放进模型目录，按「发布者 / 模型名 / 文件」的结构存放，例如 `~/.lmstudio/models/发布者/模型名/文件.gguf`。模型目录的位置可以在 My Models 页修改，系统盘空间紧张时把它改到别的盘。

## 常见问题

**Q：LM Studio 和 Ollama 有什么区别？**
两者都是在本机运行开源模型的工具。按各自官方文档的描述，LM Studio 以图形界面为主，模型搜索、聊天、文档问答和服务开关都在窗口里；Ollama 以命令行和后台服务为主，默认端口是 11434。两者都提供 OpenAI 兼容接口，同一个 GGUF 模型两边都能用。不熟悉命令行的人从 LM Studio 开始更顺手。

**Q：下载模型很慢或者搜不到？**
官方离线说明里写明，搜索和下载模型需要联网，请求会发往 huggingface.co。网络访问不到时，可以在别处获取模型文件后用上面的「导入」方式加载。

**Q：模型会从我的聊天里学习吗？**
不会。官方的说法是模型不会从对话中「学习」，它只知道当前对话里的内容和你通过系统提示词等配置提供的信息。

**Q：聊天记录存在哪里？**
在对话上点右键选择在文件管理器中显示。默认路径是 `~/.lmstudio/conversations/`（Windows 是 `%USERPROFILE%\.lmstudio\conversations`），JSON 格式，官方不建议手动修改。

**Q：完全断网能用吗？**
能。模型下载到本机后，聊天、读文档、本地服务都不需要联网。需要联网的只有搜索和下载模型、下载运行时、检查更新这几件事。

## 参考资料

- LM Studio 文档首页 — https://lmstudio.ai/docs/app
- System Requirements — https://lmstudio.ai/docs/app/system-requirements
- Get started with LM Studio — https://lmstudio.ai/docs/app/basics
- Download an LLM — https://lmstudio.ai/docs/app/basics/download-model
- Chat with Documents — https://lmstudio.ai/docs/app/basics/rag
- Offline Operation — https://lmstudio.ai/docs/app/offline
- lms CLI — https://lmstudio.ai/docs/cli

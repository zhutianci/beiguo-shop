---
title: "text-generation-webui（oobabooga，现名 textgen）是什么：本地大模型网页界面的安装与使用"
slug: text-generation-webui-textgen
name: text-generation-webui（现名 textgen）
url: https://github.com/oobabooga/textgen
pricing: 开源免费（AGPL-3.0）
platforms: Windows / macOS / Linux / Docker
products: [ai-tools]
models: []
topics: [coding, fiction]
excerpt: "text-generation-webui 是 oobabooga 开发的本地大模型界面，仓库现已更名为 textgen。支持 llama.cpp、Transformers、ExLlamaV3 等多种后端，带对话、笔记本、LoRA 训练和兼容 OpenAI 的接口。"
checkedOn: 2026-10-11
sources:
  - https://github.com/oobabooga/textgen
---

> 本文根据官方 GitHub 仓库 oobabooga/textgen 的 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

很多教程里说的「oobabooga」「text-generation-webui」「TGW」都是同一个项目。它的 GitHub 仓库现在名为 **oobabooga/textgen**（约 4.77 万星标，AGPL-3.0 许可），旧地址会跳转到新仓库。README 把它描述为一款运行本地大模型的开源桌面应用，强调「100% 私密」、没有遥测。

它在本地模型圈子里的定位类似 Stable Diffusion WebUI 之于 AI 绘画：**功能最全、可调参数最多的「瑞士军刀」**，尤其受喜欢折腾模型、写长篇故事和角色对话的用户欢迎。

## 能做什么

- **三种对话模式**：chat、instruct、chat-instruct，适配不同类型的模型和玩法。
- **Notebook 标签页**：不走对话格式的自由续写，适合写作。
- **多种后端**：llama.cpp、ik_llama.cpp、Transformers、ExLlamaV3、TensorRT-LLM，可以加载 GGUF、原始权重、EXL3 等格式。
- **多模态与附件**：图片输入（视觉模型）、文本 / PDF / docx 附件。
- **图像生成**：用 diffusers 模型出图。
- **LoRA 训练**：在界面里微调模型。
- **工具调用**：支持 MCP 服务器。
- **扩展机制**：安装社区扩展增加功能。
- **API**：兼容 OpenAI 和 Anthropic 风格的 Chat、Completions、Messages 接口。

## 怎么上手

README 提供了几种安装方式，按省事程度排序：

1. **便携版（Portable builds）**：Linux、Windows、macOS 都有，下载解压后直接运行，不需要配置 Python 环境——新手首选，主要用于 GGUF 模型。
2. **一键安装脚本**：克隆仓库后运行对应系统的启动脚本，自动创建环境并安装依赖，可使用全部后端。
3. **手动 venv / Conda / Docker**：给需要自定义环境的用户。

启动后在浏览器打开提示的本地地址，进入 Model 标签页下载或选择模型并加载，再回到 Chat 标签页开始对话。

## 免费与付费

完全免费开源，没有付费版。花费只在硬件上。

## 适合谁 / 不适合谁

**适合：**
- 想尝试各种模型格式和加载方式的本地模型玩家；
- 需要细调采样参数、提示模板的进阶用户和小说、角色扮演创作者；
- 想在本地做 LoRA 微调实验的学习者。

**不适合：**
- 只想「下载就能聊」的新手，LM Studio、Jan 更直观；
- 没有独立显卡且内存较小的电脑；
- 需要多用户账号体系和权限管理的团队场景，应看 Open WebUI。

## 注意事项

- **改名后的教程差异**：以 text-generation-webui 为名的老教程，在启动脚本名、目录结构和后端选项上可能与现在不同。
- **后端与模型格式要匹配**：GGUF 用 llama.cpp，EXL3 用 ExLlamaV3，选错会加载失败。
- **扩展会执行代码**：只装可信来源的扩展。
- **AGPL 许可**：修改后对外提供网络服务，需要按 AGPL-3.0 公开对应源码。
- **模型内容与许可自负**：下载的社区模型质量和许可参差不齐，使用前看模型页说明。

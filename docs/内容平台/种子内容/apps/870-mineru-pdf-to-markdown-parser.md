---
title: "MinerU 是什么、怎么用：把 PDF 和 Office 文档转成 Markdown / JSON 的开源解析工具"
slug: mineru-pdf-to-markdown-parser
name: MinerU
url: https://github.com/opendatalab/MinerU
pricing: 开源免费（MinerU 开源许可，基于 Apache-2.0 并附加条件）
platforms: Python / 命令行 / 本地 WebUI / 在线体验
products: [ai-tools]
models: []
topics: [coding, research-data, paper-writing]
excerpt: "MinerU 是 OpenDataLab 的开源文档解析工具，把 PDF、Word、PPT、Excel、图片等复杂文档转换成适合大模型使用的 Markdown 或 JSON，提供 Python SDK、命令行和 Gradio 界面。"
checkedOn: 2026-10-11
sources:
  - https://github.com/opendatalab/MinerU
verify:
  - "许可证为「MinerU Open Source License」（基于 Apache-2.0 并有附加条件），商用前请阅读仓库中的许可全文"
---

> 本文根据 MinerU 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。版本迭代快，安装命令以官方仓库为准。

## 是什么

MinerU 是 opendatalab 组织维护的开源文档解析工具，README 的介绍是：把 PDF、Office 文档这类复杂文档，转换成可直接供大模型使用的 Markdown / JSON，服务于智能体工作流。做知识库的人都遇到过这个问题——论文和报告里有双栏排版、表格、公式和页眉页脚，直接提取文字会一团乱。MinerU 处理的就是这一步。仓库约有 8.14 万星标。

## 能做什么

README 列出的特性：

- **多种输入格式**：PDF、图片、DOC/DOCX、PPT/PPTX、XLS/XLSX、EPUB、HTML、CSV 等。
- **输出 Markdown 或 JSON**：保留文档结构，便于切块和入库；表格与公式是它重点处理的内容。
- **四个解析档位**：从最快的 flash 到最精细的 advanced，按速度和质量的需要选择。
- **多种使用方式**：Python SDK、命令行、Gradio WebUI。
- **在线体验**：仓库链接了 mineru.net 的在线提取工具，以及 Hugging Face、ModelScope、Colab 上的演示。

## 怎么上手

README 给出的安装与使用命令：

```bash
pip install uv
uv venv .mineru --python 3.12
source .mineru/bin/activate
uv pip install -U "mineru>=4.0,<5"

mineru-kit parse document.pdf -o document.md --tier standard   # 解析一个文件
mineru-kit webui                                               # 启动图形界面
```

硬件方面，README 说明默认安装在 CPU 上运行小模型（ONNX），视觉语言模型通过 llama.cpp 以 Vulkan 模式运行；NVIDIA 显卡用户可以安装 `mineru[full]>=4.0` 获得更高的处理速度。

不想本地安装的话，先用在线体验版试几份文档看效果。

## 免费与付费

项目开源，本地使用免费。许可证是「MinerU Open Source License」，README 说明它基于 Apache 2.0 并附加了条件，商业使用前应阅读许可全文。在线服务的额度与收费以官网为准。

## 适合谁 / 不适合谁

**适合：** 搭建 RAG 知识库、需要高质量解析论文和报告的开发者；要把大量扫描件、PDF 整理成结构化文本的研究者；希望数据留在本地处理的团队。

**不适合：** 只是偶尔把一份 PDF 转成 Word 的普通用户（在线转换工具更省事）；没有命令行基础的人（可以只用在线版）；电脑配置很低又要批量处理大量文档的情况。

## 注意事项

- 复杂版面、手写内容和低清扫描件仍可能解析出错，重要数据（尤其是表格数字）要抽查。
- 高精度档位明显更慢，批量任务先用小样本确定合适的档位。
- 处理受版权保护或含个人信息的文档时，遵守相应的使用规定。

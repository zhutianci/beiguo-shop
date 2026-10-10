---
title: "Docling 是什么、怎么用：把 PDF、Word、PPT 解析成 Markdown 的开源文档处理库"
slug: docling-document-parsing-toolkit
name: Docling
url: https://github.com/docling-project/docling
pricing: 免费开源（MIT）
platforms: Python / 命令行
products: [ai-tools]
models: []
topics: [coding, research-data]
excerpt: "Docling 是 MIT 许可的开源文档处理库，由 IBM 苏黎世研究院发起、现托管于 LF AI & Data 基金会，可解析 PDF、DOCX、PPTX、XLSX、HTML、图片等并导出 Markdown、HTML 或 JSON，支持完全本地运行。"
checkedOn: 2026-10-11
sources:
  - https://github.com/docling-project/docling
---

> 本文根据 Docling 官方 GitHub 仓库 README 整理，资料核对于 2026-10-11。开源项目变化快，以官方仓库为准。

## 是什么

Docling 是一个开源的文档处理库，README 的介绍是：通过解析各种格式来简化文档处理，并把结果对接到生成式 AI 的工具链里。它由 IBM 苏黎世研究院的团队发起，现在是 LF AI & Data 基金会托管的项目。仓库约有 6.86 万星标，采用 MIT 许可。它和 MinerU 解决的是同一类问题——把人读的文档变成模型能用的结构化文本。

## 能做什么

README 列出的特性：

- **多格式解析**：PDF、DOCX、PPTX、XLSX、HTML、EPUB、图片、音频、邮件等。
- **深入理解 PDF**：识别版面布局、阅读顺序、表格和公式。
- **多种导出格式**：Markdown、HTML、WebVTT，以及无损的 JSON 等。
- **OCR**：处理扫描版 PDF 和图片。
- **生态集成**：LangChain、LlamaIndex、CrewAI、Haystack，并提供 MCP 服务器，可以让智能体直接调用。
- **本地执行**：适合处理敏感数据，以及与外网隔离的环境。

## 怎么上手

README 给出的安装与命令行用法（需要 Python 3.10 或更高版本）：

```bash
pip install docling
docling https://arxiv.org/pdf/2206.01062
```

在 Python 代码里：

```python
from docling.document_converter import DocumentConverter

source = "https://arxiv.org/pdf/2408.09869"  # 本地路径或 URL
converter = DocumentConverter()
result = converter.convert(source)
print(result.document.export_to_markdown())
```

得到 Markdown 之后，就可以切块、生成向量并写入知识库；使用 LangChain 或 LlamaIndex 的话，可以直接用它们对应的 Docling 加载器。

## 免费与付费

Docling 免费、开源（MIT 许可），没有订阅。它在你自己的机器上运行，成本只有硬件和时间；首次使用需要下载模型文件。

## 适合谁 / 不适合谁

**适合：** 搭建企业知识库、文档不能上传到第三方服务的团队；需要在数据处理流水线里批量解析文档的工程师；使用 LangChain、LlamaIndex 等框架做 RAG 的开发者。

**不适合：** 不写代码、只想转换一两份文件的用户；机器配置很低又要处理大量扫描件的情况（OCR 较慢）；需要带界面的协作式标注与校对流程的团队。

## 注意事项

- 复杂表格、跨页表格和手写内容仍可能出错，关键数字要抽样核对。
- 与 MinerU 相比各有擅长的文档类型，正式选型前用自己的样本文档对比。
- MIT 许可宽松，但解析出的文档内容本身的版权不因此改变。

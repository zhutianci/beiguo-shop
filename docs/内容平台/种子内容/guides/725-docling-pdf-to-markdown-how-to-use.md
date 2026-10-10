---
title: Docling 使用教程：把 PDF、Word、PPT 转成 Markdown 给大模型用（安装与示例）
slug: docling-pdf-to-markdown-how-to-use
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: Docling 是什么、怎么用它把 PDF 转成 Markdown？按官方 README 讲清它的来历、支持的输入输出格式、对 PDF 版面和表格公式的理解能力、pip 安装与系统要求、五行 Python 代码和一条命令行的用法、VLM 管线，以及做 RAG 前处理时的注意点。
checkedOn: 2026-10-11
sources:
  - https://github.com/docling-project/docling
verify:
  - 首次运行需要下载模型，下载来源与离线使用方式官方 README 的概述里没有展开，以官方文档为准
  - 转换速度和硬件要求官方 README 未给出具体数字，本文未写
  - VLM 管线命令里的模型名 granite_docling 取自官方 README 当天版本
---

> 本文根据 Docling 官方仓库 README 整理，资料核对于 2026-10-11。文中代码和命令取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「docling 是什么」「docling 使用」「docling 教程」的人；
- 要把一批 PDF、Word、PPT 喂给大模型或者导入知识库，直接复制粘贴出来的文字乱成一团的人；
- 资料涉及内部信息，不想上传到在线转换服务的人。

## 结论先说

1. **Docling 是一个开源的文档解析工具包**：把多种格式的文档解析成统一的结构，再导出成 Markdown、HTML、JSON 等，方便接到生成式 AI 的流程里。
2. **它的强项是 PDF**：能识别页面版面、阅读顺序、表格结构、代码、公式，并对图片分类。
3. **在本地运行**。官方特别提到适合敏感数据和隔离网络环境。
4. **安装一行**：`pip install docling`，需要 Python 3.10 及以上，macOS、Linux、Windows 都支持。
5. **用起来也很短**：Python 里五行，命令行里一条 `docling 文件或网址`。
6. **代码是 MIT 许可**；所用各模型的许可见各自的原始包。

## 一、来历

README 的说明：项目由 IBM 研究院苏黎世的 AI for knowledge 团队发起，现在是 LF AI & Data 基金会托管的项目。

## 二、能读什么、能导出什么

**输入格式**（README 所列）：PDF、DOCX、PPTX、XLSX、HTML、EPUB，Apple 的 Pages、Numbers、Keynote，音频 WAV、MP3，字幕 WebVTT，邮件 EML、MSG，图片（PNG、TIFF、JPEG 等），LaTeX，以及纯文本等。

**导出格式**：Markdown、HTML、WebVTT、DocTags、DocLang，以及无损的 JSON。

**主要能力**

| 能力 | 说明 |
| --- | --- |
| PDF 理解 | 页面版面、阅读顺序、表格结构、代码、公式、图片分类 |
| OCR | 处理扫描版 PDF 和图片 |
| 视觉语言模型 | 支持多种 VLM，如 Granite Docling |
| 音频 | 对音频文件做自动语音识别 |
| 集成 | 可与 LangChain、LlamaIndex、CrewAI、Haystack 配合 |
| MCP 服务器 | 可以通过 MCP 服务器接到智能体上 |

为什么「阅读顺序」和「表格结构」重要：PDF 里存的是每个字在页面上的位置，不是段落。双栏排版、跨页表格、页眉页脚，直接提取文字就会串行、错位。大模型拿到的是错乱的文本，回答自然不可靠。

## 三、安装

```bash
pip install docling
```

- Python 3.10 及以上（README 注明 3.9 的支持已在 2.70.0 版本移除）；
- 支持 macOS、Linux、Windows，x86_64 和 arm64 架构都可以。

建议装在单独的虚拟环境里。

## 四、Python 用法

README 的示例：

```python
from docling.document_converter import DocumentConverter

source = "https://arxiv.org/pdf/2408.09869"  # a document via a local path or URL
converter = DocumentConverter()
result = converter.convert(source)
print(result.document.export_to_markdown())  # output: "## Docling Technical Report[...]"
```

- `source` 可以是本地路径，也可以是网址；
- `converter.convert(source)` 完成解析，得到统一的文档对象 `result.document`；
- `export_to_markdown()` 导出 Markdown。

批量处理时，`DocumentConverter` 创建一次后重复使用，逐个文件调用 `convert` 即可。

## 五、命令行用法

```bash
docling https://arxiv.org/pdf/2206.01062
```

这条命令会在当前目录写出一个 Markdown 文件。把网址换成本地文件路径同样适用。

**用 VLM 管线**：

```bash
docling --pipeline vlm --vlm-model granite_docling https://arxiv.org/pdf/2206.01062
```

这条命令改用视觉语言模型（示例里是 GraniteDocling）来处理页面。它和默认管线的差别、各自适合的文档类型以及硬件要求，见官方文档。默认结果不理想时可以拿同一份文档对比着试。

## 六、放进 RAG 流程时的注意点

- **转完先抽查**。挑几份有代表性的文档（带表格的、双栏的、扫描的），把 Markdown 和原文对一遍，再批量处理；
- **扫描件依赖 OCR**。扫描质量差、手写内容、印章遮挡，识别结果要人工核对，关键数字不要直接采信；
- **表格看一眼**。合并单元格、跨页表格最容易出问题。重要的表格可以单独导出为结构化数据；
- **按标题分段**。Markdown 的好处是保留了标题层级，切分知识库时按小节切，比按固定字数切更不容易把一段完整的意思切断。分段参数的含义见[《Dify 知识库搭建教程》](/guides/dify-knowledge-base-chunking-retrieval)；
- **保留来源信息**。每个分段记下来自哪个文件、哪一节，回答时才能给出处。

向量库的选择见[《ChromaDB 是什么》](/guides/chromadb-vector-database-quickstart)。

## 七、和同类工具怎么选

| 工具 | 特点 |
| --- | --- |
| Docling | 侧重 PDF 的版面、表格、公式理解；本地运行 |
| MarkItDown | 微软的轻量工具，格式覆盖广、依赖少，见[《MarkItDown 怎么用》](/guides/markitdown-convert-files-to-markdown) |
| MinerU | 面向复杂文档的解析工具，见[《MinerU 是什么》](/guides/mineru-document-parsing-pdf-markdown) |

简单的判断：文档本身是规整的电子版（Word、PPT、文字型 PDF），先用轻量的；学术论文、财报、带复杂表格的扫描件，用版面理解能力强的。

## 常见问题

**Q：第一次运行很慢？**
这类工具首次使用时需要准备模型，之后会快很多。具体下载什么、放在哪、能否离线预置，以官方文档为准。

**Q：需要 GPU 吗？**
README 的概述里没有写硬件要求。没有 GPU 也可以先试，文档量大或用 VLM 管线时再考虑硬件。

**Q：能处理中文文档吗？**
README 没有专门说明各语言的效果。用你自己的中文样例测一遍，重点看扫描件的 OCR 结果。

**Q：资料很敏感，会不会被上传？**
官方的定位是本地执行，适合敏感数据和隔离网络环境。注意示例里的 `source` 如果写的是网址，程序会去下载那个文件；模型的获取也可能需要联网。

## 参考资料

- docling-project/docling（官方仓库与 README）：https://github.com/docling-project/docling

---
title: MinerU 是什么、怎么用：把 PDF 等文档解析成 Markdown（4.0 的安装、四档解析与命令）
slug: mineru-document-parsing-pdf-markdown
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: MinerU 是什么、怎么安装使用？按官方中文 README 讲清 4.0 版本的定位、支持的输入与输出格式、flash / basic / standard / advanced 四档解析各适合什么、pip 安装命令、mineru-kit 与 mineru 两个命令的分工和常用写法，以及从旧版升级要注意什么。
checkedOn: 2026-10-11
sources:
  - https://github.com/opendatalab/MinerU
  - https://github.com/opendatalab/MinerU/blob/master/README_zh-CN.md
verify:
  - 本文按官方中文 README 在 2026-10-11 的内容（4.0 版本线）编写；旧教程里的 mineru -p 输入 -o 输出 写法 README 当前版本没有出现，是否仍可用以官方「3.x → 4.0 迁移」指南为准
  - 四档解析的模型体积与内存数字为 README 的参考值，以官方文档为准
  - 官方 README 中包含面向 AI 智能体的安装技能、写入记忆等操作指引，本文未采纳也未转述，使用其 Skill 前请自行审阅
  - 许可证为 MinerU 开源许可证（以 Apache 2.0 为基础并附加条款），商用前请阅读全文
---

> 本文根据 MinerU 官方仓库的中文 README 整理，资料核对于 2026-10-11。文中命令取自官方 README，没有在本机运行验证。MinerU 更新很快，4.0 的命令和旧版差别较大，动手前先看一眼官方 README 的当前内容。

## 适用于谁

- 搜「mineru 是什么」「mineru 教程」「mineru github」「mineru api」的人；
- 要把论文、报告、扫描件这类版面复杂的文档转成 Markdown，喂给大模型或导入知识库的人；
- 照旧教程敲命令发现对不上的人。

## 结论先说

1. **MinerU 是一个文档解析工具**。官方现在的定位是「面向 Agent 的文档解析工具」：把本地文档转成可读的内容，并且支持按页、按块续读，保留稳定的引用位置。
2. **输入不只是 PDF**：图片、Word、PPT、Excel、EPUB、HTML 等都支持。
3. **解析分四档**：flash、basic、standard、advanced，质量依次提高，速度依次变慢，对硬件的要求也依次提高。
4. **安装**：`pip install "mineru>=4.0,<5"`，需要 Python 3.10 及以上、3.15 以下。
5. **两个命令**：`mineru-kit` 做一次性的转换；`mineru` 面向文档库，带缓存、搜索和续读。
6. **默认在本地处理**。README 写明：默认不会自动将文档上传到官网服务，远程解析需要显式配置。

## 一、支持的格式

**输入**（README 所列）：PDF、图片、DOC / DOCX、PPT / PPTX、XLS / XLSX、RTF、ODT / ODS / ODP、EPUB、OFD、HTML / MHTML、CSV / TSV。纯文本不进入解析流程。

**输出**：解析结果是一个统一的文档模型，可以渲染成九种目标：Markdown、HTML、LaTeX、DOCX、EPUB、PDF、Structured Content、Content List V1、Content List V2。README 注明各个命令行和 API 的导出范围不完全相同。

## 二、四档解析怎么选

| 档位 | 质量与速度 | 适合 | 资源参考（README） |
| --- | --- | --- | --- |
| flash | 质量最低，速度最快 | 发现、预览、建索引；不作为默认的阅读质量 | |
| basic | 基础质量 | 私有的本地阅读，或资源较低的环境 | ONNX 模型约 0.8 GB，最低 2 GB 内存，CPU 可用 |
| standard | 标准的高质量 | 日常阅读和复杂文档 | ONNX 加 llama.cpp 约 2 GB，8 GB 内存，CPU 可用，推荐 Vulkan |
| advanced | 普通文档与标准档相当，困难文档更好，速度最慢 | 能接受长时间等待的场景 | 以官方文档为准 |

实际的做法：先用 flash 或 basic 把一批文档过一遍，知道里面有什么；真正要细读、要入库的，再用 standard；standard 仍然处理不好的少数困难文档，才上 advanced。

README 还提到，默认的 ONNX CPU 推理就可以运行；有 NVIDIA 显卡的可以安装 `mineru[full]>=4.0`。

## 三、安装

```bash
pip install "mineru>=4.0,<5"
```

用 uv 的写法：

```bash
uv pip install -U "mineru>=4.0,<5"
```

Python 版本要求是 `>=3.10,<3.15`。建议装在单独的虚拟环境里。

解析需要模型文件，按档位下载：

```bash
mineru-kit models download --tier <tier>
```

把 `<tier>` 换成 `basic`、`standard` 等档位名。

## 四、两个命令的分工

| 命令 | 定位 |
| --- | --- |
| `mineru-kit` | 无状态的转换工具：给一个文件，转出结果。`parse` 默认处理全部页面；另外提供 `webui` |
| `mineru` | 面向文档库和智能体阅读：支持缓存、搜索，以及按页或按块续读 |

**一次性转换**（README 示例）：

```bash
mineru-kit parse document.pdf -o document.md --tier standard
```

**图形界面**：

```bash
mineru-kit webui
```

README 说明这是一个 Gradio 的网页界面。

**文档库式的用法**（README 示例，`--json` 表示以 JSON 输出，方便程序和智能体读取）：

```bash
mineru parse document.pdf --json
mineru read "doc:ab12cd3/tier:standard/page:11" --limit 12000 --json
mineru search "liquidated damages" --min-tier basic --json
```

- `parse`：解析并进入缓存；
- `read`：按一个稳定的引用位置（哪份文档、哪一档、哪一页）读取内容，`--limit` 限制返回的长度；
- `search`：在已解析的文档里搜索。

这套设计是为智能体准备的：长文档不必一次全部塞进上下文，智能体可以先搜索、再按页读取需要的部分，并且引用位置前后一致。

## 五、其他使用方式

README 提到的还有：Python SDK、V1 API、批处理、多服务的 Router、Docker。README 注明非 NVIDIA 设备的 Docker 方案仍待更新。

在线体验的入口有官网 mineru.net，以及 ModelScope、HuggingFace、Colab 上的演示。使用在线服务就意味着文档会上传，内部资料请用本地方式。

## 六、从旧版升级

4.0 的命令结构和 2.x、3.x 不同。README 提供了「3.x → 4.0 迁移」指南和完整的更新历史链接，升级已有的脚本前先读迁移指南。

网上大量教程是按旧版写的，命令对不上时，以 README 当前内容为准，不要照着旧命令反复试。

## 七、放进 RAG 流程时的注意点

- **先抽查再批量**：挑带表格、公式、双栏、扫描的样例各几份，把结果和原文对一遍；
- **档位和成本一起考虑**：几千份文档全用最高档，时间会很长。按文档类型分流；
- **公式和表格重点核对**：这是版面解析最容易出错的两类内容，关键数据不要直接采信；
- **保留引用位置**：MinerU 提供稳定的页与块引用，入库时把它存进元数据，回答时就能指回原文位置；
- **分段与入库**：见[《Dify 知识库搭建教程》](/guides/dify-knowledge-base-chunking-retrieval)和[《ChromaDB 是什么》](/guides/chromadb-vector-database-quickstart)。

## 常见问题

**Q：没有显卡能用吗？**
README 说明默认的 ONNX CPU 推理可用，basic 和 standard 两档都标注了 CPU 可用。速度取决于文档数量和档位。

**Q：许可证是什么，能商用吗？**
README 写的是「MinerU 开源许可证」，以 Apache 2.0 为基础并附加了条款。商用前请阅读许可证全文，以官方文本为准。

**Q：和 Docling、MarkItDown 怎么选？**
规整的电子文档先用轻量的 MarkItDown，见[《MarkItDown 怎么用》](/guides/markitdown-convert-files-to-markdown)；版面复杂的 PDF 在 MinerU 和 Docling 之间用自己的样例对比，见[《Docling 使用教程》](/guides/docling-pdf-to-markdown-how-to-use)。没有哪一个在所有文档上都最好。

**Q：模型下载很慢或失败？**
README 的当前版本用 `mineru-kit models download` 下载模型，模型来源的设置以官方文档为准。

## 参考资料

- opendatalab/MinerU（官方仓库）：https://github.com/opendatalab/MinerU
- 中文 README：https://github.com/opendatalab/MinerU/blob/master/README_zh-CN.md

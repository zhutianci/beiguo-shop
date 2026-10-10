---
title: MarkItDown 怎么用：把 PDF、Word、Excel、PPT 转成 Markdown（安装、命令行与 Python）
slug: markitdown-convert-files-to-markdown
products: [ai-tools]
models: []
topics: [ai-agent]
accountTier: FREE
excerpt: 微软的 MarkItDown 是什么、怎么安装使用？按官方 README 讲清它支持的文件格式、为什么转成 Markdown、pip 安装与可选依赖、三种命令行写法、Python 调用、让大模型给图片写描述、插件与 OCR、MCP 服务器，以及处理不可信文件时的安全提示。
checkedOn: 2026-10-11
sources:
  - https://github.com/microsoft/markitdown
verify:
  - 示例里给图片写描述用的模型名 gpt-4o 取自官方 README，实际使用时换成你账号可用的模型
  - Python 示例读取结果用的是 result.markdown，取自官方 README 当前版本；旧教程里的 text_content 写法是否仍可用以官方说明为准
  - 对扫描版 PDF 的识别效果官方 README 没有给出说明，以实际测试为准
---

> 本文根据微软 MarkItDown 官方仓库 README 整理，资料核对于 2026-10-11。文中代码和命令取自官方 README，没有在本机运行验证。

## 适用于谁

- 搜「markitdown 使用」「markitdown 怎么用」「markitdown 安装」的人；
- 经常要把 Word、Excel、PPT、PDF 的内容贴给大模型，想要一条命令转成干净文本的人；
- 在写处理文档的脚本或智能体，需要一个轻量的「任意文件转文本」组件的人。

## 结论先说

1. **MarkItDown 是微软开源的一个轻量 Python 工具**，把各种文件转成 Markdown，用于大模型和文本分析流程。
2. **格式覆盖很广**：PDF、PowerPoint、Word、Excel、图片、音频、HTML、CSV / JSON / XML、ZIP、YouTube 链接、EPub。
3. **安装**：`pip install 'markitdown[all]'`，需要 Python 3.10 到 3.14。
4. **最常用的一条命令**：`markitdown 文件 -o 输出.md`。
5. **它以当前进程的权限读文件**。在服务端处理用户上传的、来源不可信的文件时，要按官方的安全提示限制输入。

## 一、为什么是 Markdown

README 的解释：Markdown 非常接近纯文本，同时又保留了文档的结构（标题、列表、表格、链接）；主流的大模型对它理解得很好；而且它的写法很省 token。

也就是说，目标不是做出一份排版精美的文档给人看，而是给模型一份结构清楚、没有多余格式噪声的输入。

## 二、支持的格式

| 类型 | 说明 |
| --- | --- |
| PDF | |
| PowerPoint、Word、Excel | |
| 图片 | EXIF 元数据和 OCR |
| 音频 | EXIF 元数据和语音转写 |
| HTML | |
| 文本类格式 | CSV、JSON、XML |
| ZIP | 逐个处理压缩包里的文件 |
| YouTube 链接 | |
| EPub | |

## 三、安装

```bash
pip install 'markitdown[all]'
```

`[all]` 会装上所有格式需要的依赖。只需要其中几种时，可以按需选择，例如：

```bash
pip install 'markitdown[pdf, docx, pptx]'
```

README 列出的可选项有 `[pptx]`、`[docx]`、`[xlsx]`、`[xls]`、`[pdf]`、`[outlook]`、`[az-doc-intel]`、`[audio-transcription]`、`[youtube-transcription]` 等。

Windows 的命令提示符不把单引号当作引号，改用双引号：`pip install "markitdown[all]"`。

## 四、命令行

三种写法：

```bash
markitdown path-to-file.pdf > document.md
markitdown path-to-file.pdf -o document.md
cat path-to-file.pdf | markitdown
```

- 第一种把结果重定向到文件；
- 第二种用 `-o` 指定输出文件；
- 第三种从标准输入读取，适合接在管道里。

## 五、Python 调用

```python
from markitdown import MarkItDown

md = MarkItDown(enable_plugins=False) # Set to True to enable plugins
result = md.convert("test.xlsx")
print(result.markdown)
```

`convert` 接收文件路径，返回的结果对象里 `markdown` 属性就是转换后的文本。

批量转换一个文件夹，就是遍历文件、逐个调用 `convert`、把 `result.markdown` 写到同名的 `.md` 文件里。

## 六、让大模型给图片写描述

图片本身没有文字时，可以接一个多模态模型来生成描述。README 说明这项功能目前用于 PPTX 和图片文件：

```python
from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI(max_retries=5)
md = MarkItDown(llm_client=client, llm_model="gpt-4o", llm_prompt="optional custom prompt")
result = md.convert("example.jpg")
print(result.markdown)
```

这会调用模型接口，产生费用，并且图片内容会发送给模型服务商。处理内部资料前先确认是否允许。

## 七、插件与 OCR

插件默认是关闭的：

```bash
markitdown --list-plugins
markitdown --use-plugins path-to-file.pdf
```

README 提到的 `markitdown-ocr` 插件，给 PDF、DOCX、PPTX、XLSX 的转换加上基于大模型视觉能力的 OCR，用 `pip install markitdown-ocr` 安装。官方说明：没有提供 `llm_client` 时，OCR 会被跳过，仍然使用标准的转换器。

所以扫描版 PDF（每页是一张图片）用默认方式转出来可能是空的或者很少，这时需要 OCR 插件，或者换用带版面识别的工具，见[《Docling 使用教程》](/guides/docling-pdf-to-markdown-how-to-use)。

另外还可以接 Azure 的 Document Intelligence 服务来转换：

```bash
markitdown path-to-file.pdf -o document.md -d -e "<document_intelligence_endpoint>"
```

## 八、Docker 与 MCP

**Docker**（在克隆下来的仓库目录里构建）：

```sh
docker build -t markitdown:latest .
docker run --rm -i markitdown:latest < ~/your-file.pdf > output.md
```

**MCP 服务器**：官方提供了 `markitdown-mcp` 这个包，即 MarkItDown 的 MCP 服务器，接入支持 MCP 的客户端后，智能体可以自己调用它来转换文件。配置方法见该包的说明；MCP 的基本用法见[《Claude Desktop MCP 配置教程》](/guides/claude-desktop-mcp-config-json)。

## 九、安全提示

README 的原话是：MarkItDown 以**当前进程的权限**执行读写。并给了两条建议：

- 对不可信的输入要先做清理和校验；
- 只处理本地文件时用 `convert_local()`；需要对输入有最大程度的控制时用 `convert_stream()`。

背景是：它支持的输入里既有本地文件也有网址（如 YouTube 链接）。如果你的服务把用户提交的字符串原样传给转换函数，对方就可能让你的服务器去读取本机文件或访问不该访问的地址。做成在线服务时，这一点必须处理。

## 常见问题

**Q：转出来的 PDF 表格是乱的？**
MarkItDown 定位是轻量转换。表格复杂、双栏排版、扫描件这类情况，用版面理解能力更强的工具，见[《Docling 使用教程》](/guides/docling-pdf-to-markdown-how-to-use)和[《MinerU 是什么》](/guides/mineru-document-parsing-pdf-markdown)。

**Q：ChatGPT、Claude 不是能直接读 PDF 吗，还要它干什么？**
聊天产品里直接上传确实方便。需要它的场景是：批量处理、写进自己的程序、导入知识库之前的预处理，或者想先看看模型实际「读到」的文本是什么样。上传文件的限制见[《Claude 文件上传限制》](/guides/claude-file-upload-limits)。

**Q：命令找不到？**
确认是在装了它的那个 Python 环境里运行；用虚拟环境的话先激活。也可以用 `python -m pip show markitdown` 确认是否安装成功。

**Q：能保留图片吗？**
它的输出是文本。图片内容可以通过第六节的方式变成一段文字描述；输出里是否保留图片引用，以官方说明和实际结果为准。

## 参考资料

- microsoft/markitdown（官方仓库与 README）：https://github.com/microsoft/markitdown

---
title: Claude 上传文件限制：支持格式、大小与 PDF 分析
slug: claude-file-upload-limits
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 能上传哪些文件、单个文件多大、一次能传几个？PDF 超过 100 页为什么看不到图表、超过 1000 页为什么传不上去，项目文件和聊天附件限制有什么不同。
checkedOn: 2026-10-07
sources:
  - https://support.claude.com/en/articles/8241126-upload-files-to-claude
  - https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
  - https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
  - https://support.claude.com/en/articles/9517075-what-are-projects
verify:
  - 单个文件大小两处官方说法不一致：《Upload files to Claude》写聊天上传每个文件 500MB；《Create and edit files with Claude》写代码执行与文件创建功能的上传和下载「每个文件最大 30MB」，并说超过 30MB 的 PDF 可在计算环境里处理，请站长确认当前实际上限
  - 上下文窗口表格摘自帮助中心（付费套餐），Free 的上下文窗口官方该文未列出
  - 「Add files or photos」等菜单的中文译名以实际界面为准
---

> 本文根据 Claude 帮助中心官方文章整理，核对日期 2026-10-07，所有数字均来自官方页面。限制可能随产品更新调整，以官方说明为准。

## 适用于谁

- 搜「claude 上传文件限制」，想知道 Claude 能吃多大、多少个文件的人；
- 用 Claude 读 PDF 论文、合同、财报（「claude pdf 分析」），发现图表没被识别或文件传不上去的人；
- 往项目知识库里放资料时碰到限制的人。

## 结论先说

1. **支持的文档**：PDF、DOCX、CSV、TXT、HTML、ODT、RTF、EPUB、JSON、XLSX（XLSX 需要先开启「代码执行与文件创建」）。**图片**：JPEG、PNG、GIF、WebP。
2. **聊天上传**：每个文件最大 500MB，每个对话最多 20 个文件，图片最大 8000×8000 像素，PDF 最多 1000 页。
3. **PDF 分析**：100 页以内会同时看文字和图表、图片；101–1000 页只读文字；超过 1000 页上传会报「Uploaded file is too large」。
4. **项目文件**：每个文件最大 30MB，数量不限但总内容要装进上下文窗口，除多模态 PDF 外只提取文字。
5. **除 PDF 以外的文档只提取文字**，里面嵌的图片 Claude 看不到。

## 限制速查表

### 聊天里直接上传

| 项目 | 官方限制 |
| --- | --- |
| 单个文件大小 | 500MB |
| 文件数量 | 每个对话最多 20 个 |
| 图片尺寸 | 最大 8000×8000 像素 |
| PDF 页数 | 最多 1000 页 |

### 项目知识库

| 项目 | 官方限制 |
| --- | --- |
| 单个文件大小 | 30MB |
| 文件数量 | 不限，但总内容必须在 Claude 的上下文窗口内 |
| 内容处理 | 只提取文字（多模态 PDF 除外） |

官方还注明：根据提取出来的文字长度，可能还有额外的 token 限制。付费套餐的项目在知识库接近上下文上限时会自动启用 RAG，容量最多扩大约 10 倍，详见本站《Claude Projects 怎么用：项目知识库、项目指令与新版项目（beta）》。

### 代码执行与文件创建

如果你让 Claude 用代码执行环境处理文件（数据分析、生成 Excel / PPT / Word / PDF），帮助中心《Create and edit files with Claude》写的是**上传和下载每个文件最大 30MB**；超过 30MB 的 PDF，Claude 可以在计算环境里处理，而不把它整个装进上下文窗口。这一数字和上面的 500MB 不同，以实际界面提示为准。

## PDF 分析规则

| PDF 页数 | Claude 能看到什么 |
| --- | --- |
| 1–100 页 | 文字 + 图片、图表、图形等视觉元素 |
| 101–1000 页 | 只看文字，不分析视觉元素 |
| 超过 1000 页 | 无法上传，提示「Uploaded file is too large」 |

所以如果你要 Claude 解读财报里的柱状图、论文里的实验曲线，**尽量把 PDF 控制在 100 页以内**：只截取需要的章节另存为新 PDF 再上传。

**提到页码时用 PDF 阅读器里显示的页码**，而不是文档上印的页码。例如一本书封面和目录占了 8 页，正文印着「第 1 页」的那页，在阅读器里是第 9 页，问 Claude 时要说「第 9 页」。

## 步骤

### 1. 上传文件

1. 点输入框左下角的「+」；
2. 选择「Add files or photos」；
3. 从电脑选择文件，点「Open」；
4. 也可以直接把文件拖进对话窗口，或者把图片从剪贴板粘贴进来。

文件可以传到单个对话里，也可以传到项目的文件区，在项目内的所有对话里长期使用。

### 2. 上传 Excel 前先开开关

XLSX 需要开启代码执行与文件创建：Free、Pro、Max 在 Settings → Capabilities 打开「Code execution and file creation」（官方说明这三个套餐默认已开启）；手机版在设置 → Capabilities 里切换；Team / Enterprise 由组织所有者在 Organization settings → Capabilities 控制。

### 3. 让 Claude 分析 PDF

示例提问：

```text
这是一份 80 页的年度报告。请：
1. 用 5 条要点总结管理层对明年的展望；
2. 找出第 23 页（按 PDF 阅读器页码）那张营收柱状图，读出各季度数字；
3. 把所有提到「风险」的段落列出来，附页码。
```

如果开了代码执行，还可以要求「把 PDF 里的表格全部提取到 Excel，并画一张汇总图」，Claude 会生成可下载的文件。

## 提高识别效果的建议

- **图片**：尽量用 1000×1000 像素以上的图，避免小图和低分辨率图；
- **大文档**：拆成小段分别上传，避免触及上限；
- **Word / EPUB 等非 PDF 文档**：Claude 只读文字，里面的图片和图表要单独截图上传；
- **长对话**：上传很多大文件会快速占满上下文。付费套餐在开启代码执行时会自动压缩较早的对话内容，但这也会消耗更多用量。

付费套餐聊天时的上下文窗口（帮助中心列出的部分模型）：Opus 5.5、Sonnet 5.5、Fable 5.1、Opus 5、Sonnet 5 为 1M tokens；Fable 5、Opus 4.8、Opus 4.7、Opus 4.6、Sonnet 4.6 为 500K tokens；其他模型为 200K tokens（官方换算约 500 页以上文字）。

## 常见问题

**Q：提示「Uploaded file is too large」怎么办？**
官方说明超过 1000 页的 PDF 会出现这个提示。把 PDF 拆分成多个文件，或只保留需要的章节。文件体积太大也应同样拆分。

**Q：Claude 说看不到我 PDF 里的图表？**
检查页数：超过 100 页的 PDF 只读文字。把含图表的部分单独另存为 100 页以内的 PDF 再传。如果是 Word、PPT 转出来的文档，非 PDF 格式本身也只读文字。

**Q：能上传 PPT 吗？**
帮助中心的支持列表里没有 PPTX。可以先另存为 PDF 再上传。

**Q：Free 能上传文件吗？限制一样吗？**
能。帮助中心的上传说明没有区分套餐，限制按上表；但 Free 的用量额度更少，大文件会更快用完额度，详见本站《Claude 使用限制与额度：用量怎么看、什么时候重置（Free / Pro / Max / Claude Code）》。

**Q：Claude 能生成文件给我下载吗？**
能。开启代码执行与文件创建后，Claude 可以生成 Excel、PowerPoint、Word 和 PDF 文件。做成可分享的文档、幻灯片详见本站《Claude Artifacts 是什么、怎么用：创建、分享与导出（2026 新版）》。

## 参考资料

- Upload files to Claude（帮助中心）：https://support.claude.com/en/articles/8241126-upload-files-to-claude
- Create and edit files with Claude（帮助中心）：https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
- How large is the context window on paid Claude plans?（帮助中心）：https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
- What are projects?（帮助中心）：https://support.claude.com/en/articles/9517075-what-are-projects

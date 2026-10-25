---
title: Grok 能干嘛、适合做什么：按官方说明看搜索、推理、文件、图片视频、编程和连接器
slug: grok-capabilities-what-can-it-do
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 能干嘛、适合做什么？按官方说明：聊天写作、实时搜索网页和 X、多代理推理、上传文件分析、Imagine 生成图片视频、编程和连接 Gmail 等外部工具。附各功能的官方限制和使用注意（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://x.ai/grok
  - https://docs.x.ai/grok/overview
  - https://docs.x.ai/grok/faq
  - https://docs.x.ai/grok/connectors
  - https://docs.x.ai/developers/grok-4-7
  - https://x.ai/legal/faq
verify:
  - 本文只摆官方产品页、文档和 FAQ 写明的能力，不评价「谁更强」，也没有做对比测试；官方宣传语（如「更聪明」「最强」）没有引用
  - 官方 FAQ 说文件单个最大约 150 MB、网页一次最多约 100 个文件、安卓 20 个，限额可能因平台或订阅有差异，以界面提示为准
  - 官方产品页写 Imagine 最高 2K 图片、15 秒视频，文生视频 720p；API 文档里的 1080p 规格见 1029 号文章，App 是否开放以界面为准
  - 官方 x.ai/grok 功能清单还写了 30+ 语言、记忆、自定义指令、Canvas、分享链接等，但记忆和自定义指令没有公开操作步骤，已在隐私文章中说明
  - 官方没有给出各功能的评测分数，本文不引用 benchmark
---

> 本文根据 Grok 官方产品页、docs.x.ai 文档和 FAQ 整理，资料核对于 2026-10-25。功能会持续调整，**以官方页面和你界面里实际有的为准**。本文只摆官方写明的能力和限制，不做横向评测。图为本站整理的示意图。

## 适用于谁

- 搜「grok能力如何」「grok能干嘛」的人；
- 刚接触 Grok，想知道它适合拿来做哪些事的人；
- 在 Grok 和别的 AI 助手之间犹豫，想先看看官方列出了哪些功能的人。

## 结论先说

1. **日常对话与写作**：官方的定位是「适合日常工作的助手」，写作、研究、快速总结。
2. **实时搜索**：官方说 Grok 会实时搜索网页和 X，并给出带来源的引用，所以问时事类问题比单靠训练数据更合适。
3. **深度推理与多代理**：难题可以用推理模式，官方还写了 Multi-agent 模式，多个代理并行、各自的推理可审阅，最后合并成一份带引用的回答。
4. **文件分析**：能上传 PDF、表格、图片、音视频等，做总结、提取、对比、分析。
5. **图片与视频**：Imagine，官方页面写最高 2K 图片、15 秒视频。
6. **编程**：官方把 grok-4.7 称作「代码和其他一切任务的旗舰模型」，也有专门的 Grok Build 命令行和 Cursor 里可用，见 [/guides/grok-codex-cursor-setup](/guides/grok-codex-cursor-setup)。
7. **连接外部工具**：Connectors 对所有 Grok 用户开放，可以连邮箱、网盘、日历。
8. **官方也说它会出错**：Grok 有时会给出不准确的信息，重要事实请自己核对。

![想做的事对应 Grok 的哪个功能](seed:g1033-grok-features-by-task.png)
*图：本站根据 [x.ai/grok](https://x.ai/grok) 与 [docs.x.ai](https://docs.x.ai/grok/overview) 整理的示意图*

## 一、官方列出的能力，逐项说

### 聊天、推理与语音

官方产品页的描述：回答里带有可跟随的推理步骤；在同一个对话里生成图片、视频和代码；可以语音对话。官方还说支持 30 多种语言。Grok 怎么用、和 X 账号怎么关联，见 [/guides/grok-how-to-use-x-account-weekly-usage](/guides/grok-how-to-use-x-account-weekly-usage)。

### 搜索

官方说 Grok 会搜索网页和 X 的实时内容，回答附来源，可以追问深挖。深度搜索与多代理的用法见 [/guides/grok-deepsearch-search-multi-agent](/guides/grok-deepsearch-search-multi-agent)。

### 上传文件

docs.x.ai FAQ 的说明：

- **支持的类型**：文档和数据（PDF、DOCX、TXT、CSV、XLSX、PPTX、HTML、XML、JSON、Markdown、LaTeX、ODT、RTF、代码文件）、图片（JPEG、PNG、WebP、HEIC、BMP，GIF 与 SVG 因平台而异）、音频（MP3、WAV、M4A、OGG、FLAC、AAC）、视频（MP4、MOV）；
- **大小**：大多数文件单个最大 150 MB；网页一次最多约 100 个文件，安卓 20 个；
- **能做什么**：综合多个文件、改写摘要、提取数据和表格、分析图表和代码、转写音视频；
- **限制**：非 PDF 文件里嵌入的图片可能不会被视觉处理；部分音视频的转写质量不稳定；超过 100 页的大 PDF 主要看文字和关键图，建议指明页码或拆分。

### 图片与视频

Imagine 在同一个对话里文生图、文生视频，并可以用后续指令修改。官方 FAQ 说明生成内容都带 Grok 水印，没有去除设置。用法见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)，新版本规格见 [/guides/grok-imagine-video-15-image-20](/guides/grok-imagine-video-15-image-20)。

### 编程

官方开发者文档介绍 grok-4.7：500k 上下文、支持函数调用、网页搜索、X 搜索和代码执行等工具，推理强度可调。它是官方编程命令行 Grok Build 的默认模型，也在 Cursor 的所有计划里可用。API 价格见 [/guides/grok-api-pricing-api-key](/guides/grok-api-pricing-api-key)。

### 连接器

官方内置的连接器有 Gmail 与 Google 日历、Google Drive、OneDrive、Outlook 邮件与日历、Microsoft Teams、SharePoint、Salesforce，另有预置的第三方目录。添加方式：打开 grok.com/connectors，点 New Connector，选服务，走 OAuth 登录授权；Grok 只请求需要的权限。团队版需要管理员先在控制台开通连接器。

## 二、使用前先记住的几点

![用 Grok 前先记住这几点](seed:g1033-grok-use-with-care.png)
*图：本站根据 [x.ai 隐私与使用 FAQ](https://x.ai/legal/faq) 与 [docs.x.ai FAQ](https://docs.x.ai/grok/faq) 整理的示意图*

- 官方 FAQ 明说 Grok 有时会给出不准确或不恰当的信息，用到法律、医疗、财务等重要内容时要自己核实；
- 训练开关、Private Chat、删除对话在 [/guides/grok-memory-custom-instructions-privacy-training](/guides/grok-memory-custom-instructions-privacy-training)；
- 付费功能有每周用量池，重度任务消耗更快，见 [/guides/grok-usage-limit-weekly-pool-why](/guides/grok-usage-limit-weekly-pool-why)；
- 免费版能用到什么程度见 [/guides/grok-free-usage-how-much](/guides/grok-free-usage-how-much)，需要更多用量可看 [/chongzhi/grok-super](/chongzhi/grok-super)。

## 三、和 ChatGPT 怎么选

本文不比较强弱。如果你已经在用 ChatGPT，想知道两者各自的订阅与功能差别，见 [/guides/chatgpt-vs-grok-which-to-choose](/guides/chatgpt-vs-grok-which-to-choose)；需要 ChatGPT 会员可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 常见问题

**Q：Grok 的最新模型是哪个？**
见 [/guides/grok-47-what-is-release](/guides/grok-47-what-is-release)。

**Q：Grok 能不能看图片和视频？**
官方 FAQ 说上传图片、音频、视频都可以，分析图片和图表、转写音视频；音视频质量不稳定，见上文限制。

**Q：Grok 有没有记忆功能？**
官方产品页的功能清单有「跨对话记忆」，但公开文档没有步骤，详见隐私文章。

## 参考资料

- Grok 官方：Grok — https://x.ai/grok
- docs.x.ai：Welcome to Grok — https://docs.x.ai/grok/overview
- docs.x.ai：Grok FAQ — https://docs.x.ai/grok/faq
- docs.x.ai：Connectors — https://docs.x.ai/grok/connectors
- docs.x.ai：Grok 4.7 — https://docs.x.ai/developers/grok-4-7
- Grok 官方：隐私与使用 FAQ — https://x.ai/legal/faq

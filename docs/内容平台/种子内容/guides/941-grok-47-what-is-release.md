---
title: Grok 4.7 是什么、什么时候发布的：官方发布日期、能力、价格和在哪能用
slug: grok-47-what-is-release
products: [grok]
models: []
accountTier: OTHER
excerpt: Grok 4.7 是什么，什么时候发布？官方公告页显示 2026-09-21 发布，定位是编码与知识工作的旗舰模型。按官方公告和模型文档整理：和 Grok 4.6 的区别、API 价格、上下文、可用位置，以及官方自测成绩该怎么看。
checkedOn: 2026-10-19
sources:
  - https://x.ai/news/grok-4-7
  - https://x.ai/news
  - https://docs.x.ai/developers/models
  - https://docs.x.ai/developers/models/grok-4.7
  - https://x.ai/news/grok-4-6
verify:
  - 发布日期 2026-09-21 来自官方新闻页 x.ai/news/grok-4-7 的日期；官方公司名当前为 SpaceXAI / SpaceXSI，文档里两种写法并存
  - 对比表里的成绩全部是官方公告自己公布的测试结果（4.7 为 xHigh 档、4.6 为 High 档），不是第三方独立评测，也未经本站复现
  - 公告只列出了 Cursor、Grok Build、Grok API、第三方编码工具、模型路由和云平台，没有单独写 grok.com / App 里的模型选择；你的账号里能不能选到，以模型选择器为准
  - API 价格取自 docs.x.ai 模型页（2026-10-19）：输入每百万 token 2 美元、缓存输入 0.5 美元、输出 6 美元；超过 20 万上下文的请求按另一档价格；价格可能调整
---

> 本文根据 Grok 官方新闻页（x.ai/news）和 docs.x.ai 模型文档整理，资料核对于 2026-10-19，价格为「2026-10 查询」。成绩均为官方自测，**不是独立评测**。图为本站整理的示意图。

## 适用于谁

- 搜「grok 4.7」「grok 4.7 什么时候发布」的人；
- 想知道 Grok 4.7 比 4.6 强在哪、值不值得用的人；
- 开发者，想知道模型名、价格和上下文长度的人；
- 想知道自己能不能用到 4.7 的人。

## 结论先说

1. **发布时间**：官方新闻页显示，**Grok 4.7 于 2026-09-21 发布**（公告标题「Introducing Grok 4.7」）。此前是 2026-08-12 的 Grok 4.6 和 2026-07-16 的 Grok 4.5。
2. **官方定位**：官方说它是「编码和知识工作上最强的模型」，更擅长做长时间的困难任务，检查自己的工作更仔细，并配有官方迄今最好的安全防护。
3. **价格**：官方称「与 Grok 4.6 同价同速」；API 起步价为每百万 token 输入 2 美元、输出 6 美元，另有速度快一倍、价格高一倍的快速版本。
4. **规格**：模型名 `grok-4.7`，上下文 50 万 token，支持文本和图像输入，支持函数调用、结构化输出，推理强度可调（low、medium、high、xhigh，默认 high）；官方文档注明知识截止日期为 2026 年 5 月。
5. **在哪能用**：官方公告列出的是 Cursor、Grok Build（免费试用）、Grok API、第三方编码工具、模型路由和云平台；你在 grok.com 或 App 里能否选到，以账号里的模型选择器为准。
6. **成绩要怎么看**：公告里的对比是官方自测，仅供参考。

![Grok 4.x 官方发布时间线：4.5、4.6、4.7](seed:g941-grok-model-timeline.png)
*图：本站根据 [x.ai/news](https://x.ai/news) 与各篇公告页整理的示意图*

## 一、Grok 4.7 比 4.6 改了什么

官方公告「Model Improvements」一节说：

- **更大的基础模型**：Grok 4.7 用了比 4.6 更大的新基础模型；
- **更长的强化学习**：训练时用了更长的强化学习，任务难度更高，偏重要花很多小时才能完成的问题；
- **更会检查自己**：更擅长验证自己的工作、管理更长的上下文；
- **理解 Grok Bot**：训练时让它原生理解 Grok Bot 的运行框架，所以在对话任务和一般知识工作上更好；
- **做文档和演示文稿更强**：在 GDPval 和 AA Briefcase 这类让 AI 做律师、护士、金融分析师等专业人员任务的测试里，比 4.6 有提升，官方说与其他前沿模型表现相当；
- **全新的安全防护**：官方称在拒答与抗越狱方面是他们测过最强的模型，同时对正当的网络安全工作保持较低的拒答率。

## 二、官方给出的对比成绩

官方公告给了 Grok 4.7 与 4.6 的几项自测成绩：

![Grok 4.7 与 Grok 4.6：价格与几项官方自测成绩](seed:g941-grok-47-vs-46.png)
*图：本站根据 [x.ai/news/grok-4-7](https://x.ai/news/grok-4-7) 整理的示意图*

要注意：

- 这是**官方自己公布的测试结果**，4.7 取的是 xHigh 档，4.6 取的是 High 档，不是同一档位的严格对比；
- 公告里还把 Grok 4.7 与别家的模型放在同一张表里比较，各项各有高低；本文不转述别家的成绩；
- 基准测试的分数不等于你的实际任务表现，选模型最好用自己的任务试一试。

## 三、开发者看这里：模型名、价格、规格

官方模型文档（docs.x.ai）对 `grok-4.7` 的描述：

- **定位**：旗舰模型，用于代码和其他所有任务，支持代理式工具调用、「极少幻觉」、可配置推理；
- **上下文窗口**：50 万 token；
- **价格**：输入每百万 token 2.00 美元，缓存输入 0.50 美元，输出 6.00 美元；超过 20 万上下文窗口的请求按另一档价格收费；
- **推理强度**：low、medium、high、xhigh，默认 high；
- **批处理（Batch API）**：该模型不支持；
- **官方的选择建议**：代码、聊天都用 Grok 4.7；图片用 Grok Imagine Image 2.0，视频用 Grok Imagine Video 1.5，语音用 Grok Voice API。

调用 API 要先在官方控制台创建 API Key。Grok Build 是官方的命令行编码代理，公告里说可以免费试用，入口在 x.ai/build。

## 四、我能用上 Grok 4.7 吗

官方公告说，Grok 4.7「今天就能在 Cursor 和 Grok Build 里用」，也通过 Grok API、第三方编码工具、模型路由和云平台提供。公告没有单独写 grok.com 和手机 App 里的模型选择。所以：

1. **在 grok.com 或 App 里**：看模型选择器里有没有 4.7；没有的话，以官方说明为准，不要相信第三方网站「已上线」的说法；
2. **订阅**：官方现在的订阅档位和价格，见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)；需要开通 Grok 订阅，也可以看本站的 [/chongzhi/grok-super](/chongzhi/grok-super)；
3. **Grok 怎么用、每周额度怎么看**：见 [/guides/grok-how-to-use-x-account-weekly-usage](/guides/grok-how-to-use-x-account-weekly-usage)；
4. **生图和视频**：见 [/guides/grok-imagine-image-video](/guides/grok-imagine-image-video)。

## 常见问题

**Q：Grok 4.7 和 ChatGPT、Claude 的模型比，谁强？**
官方公告里有自己和别家的对比，但那是官方自测，本站不转述别家成绩。选哪个更合适，看 [/guides/chatgpt-vs-grok-which-to-choose](/guides/chatgpt-vs-grok-which-to-choose) 和 [/guides/chatgpt-vs-claude](/guides/chatgpt-vs-claude)。

**Q：Grok 4.7 会不会联网？**
官方模型文档说：不开启搜索工具时，没有实时事件；要获得实时数据，要在 API 请求里启用服务端搜索工具（Web Search / X Search）；模型本身只有训练数据截止（2026 年 5 月）之前的知识。

**Q：Grok 4.7 在 Cursor 里能用吗？**
官方公告说「今天就在 Cursor 里可用」。官方还把 Grok 和 Cursor 合并进了同一个订阅，见 [/guides/grok-how-to-subscribe-download](/guides/grok-how-to-subscribe-download)。

## 参考资料

- Grok 官方：Introducing Grok 4.7 — https://x.ai/news/grok-4-7
- Grok 官方：News — https://x.ai/news
- docs.x.ai：Models — https://docs.x.ai/developers/models
- docs.x.ai：Grok 4.7 — https://docs.x.ai/developers/models/grok-4.7
- Grok 官方：Introducing Grok 4.6 — https://x.ai/news/grok-4-6

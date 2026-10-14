---
title: ChatGPT 能生成视频吗、能上传视频吗？Sora 停用后的现状和替代做法
slug: chatgpt-video-generate-upload
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 现在能生成视频吗？能上传视频文件吗？按 OpenAI 帮助中心核对：Sora 网页和 App 已于 2026 年 4 月 26 日停用，上传说明里也没有视频格式。本文讲清现状，以及想让它读视频内容时，用音频、截图、字幕绕开的做法。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
  - https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
verify:
  - 官方帮助中心没有一篇写「ChatGPT 对话里不能生成视频」的文章，本文的「不能」是依据：Sora 已停用、上传与功能说明里没有视频生成入口；以你账号界面实际看到的为准
  - 官方上传说明只列了文档、表格、演示文稿、图片、音频，没有列视频；只在音频一栏写明「被识别为视频的 WebM 和 MP4 不支持」
  - 「把声音导出成音频再上传、截关键帧、传字幕」是本站用官方支持格式想出的变通做法，不是官方给的视频流程
---

> 本文根据 OpenAI 帮助中心《What to know about the Sora discontinuation》《Uploading files and audio to ChatGPT》和 ChatGPT 发布说明整理，资料核对于 2026-10-14。这两篇官方文章没有界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 搜「ChatGPT 可以生成视频吗」「ChatGPT 怎么生成视频」，想做短视频、动画的人；
- 搜「ChatGPT 能上传视频吗」「ChatGPT 不能传影片」，想让它总结网课、会议录像、视频教程的人；
- 以前用过 Sora，不知道现在去哪了、里面的内容还拿不拿得出来的人。

## 结论先说

1. **生成视频**：OpenAI 的视频产品 Sora，**网页和 App 已于 2026 年 4 月 26 日停用，Sora API 于 2026 年 9 月 24 日停用**。我在官方帮助中心核对的页面里，没有找到在 ChatGPT 对话里生成视频的功能说明，所以不要再按「ChatGPT 里点一下就出视频」去找入口。
2. **上传视频**：官方的上传说明列出的类型是**文档、表格、演示文稿、图片、音频**，没有视频。音频一栏特别写明：被识别为视频的 WebM 和 MP4 文件，不属于音频上传支持的范围。
3. **想让它「看懂」一段视频**，现实的做法是拆开喂：**声音存成纯音频上传**（付费套餐）、**画面截几张关键帧当图片传**、**有字幕就传字幕文本**。这是用官方支持的格式绕开，不是官方的视频功能。
4. **Sora 里做过的内容别丢**：官方说可以在 sora.chatgpt.com/sunset 点 **Export** 导出，处理好后会发邮件通知。
5. 需要视频生成，可以看其他厂商的工具，本站有 [Gemini](/guides/gemini-video-generation)、[即梦 / 豆包](/guides/doubao-video-generation)、[Grok Imagine](/guides/grok-imagine-image-video) 的教程。

## 一、生成视频：Sora 停用后的现状

官方帮助中心《What to know about the Sora discontinuation》写得很明确：

- Sora 的网页和 App 体验已于 **2026 年 4 月 26 日**停用；
- Sora API 将于 **2026 年 9 月 24 日**停用（按今天的日期，这个日子已经过了）；
- 停用后，在满足官方导出窗口之后，与你使用 Sora 相关的数据会被永久删除；
- 买过的 ChatGPT / Sora 点数（credits）仍然可以用在 Codex 上；
- 退款问题，官方指向《How do I request a refund for my ChatGPT subscription?》。

![想用视频时可以怎么办：Sora 停用、导出、音频、截图、字幕五种情况](seed:g816-video-options.png)
*图：本站根据 [OpenAI 帮助中心：What to know about the Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) 与 [Uploading files and audio to ChatGPT](https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt) 整理的示意图*

### 怎么导出 Sora 里的内容

1. 打开 sora.chatgpt.com/sunset；
2. 点 **Export**；
3. 等邮件通知，数据处理好后按邮件说明下载。

官方的提醒是：尽快导出；如果官方还提供最后的导出窗口，会提前发邮件通知；窗口过后数据会被永久删除。

## 二、上传视频：官方支持什么、不支持什么

官方《Uploading files and audio to ChatGPT》列出的可上传类型如下（图里是中文整理）：

![ChatGPT 能上传的文件类型：文档、表格、演示文稿、音频，视频文件官方没有列出](seed:g816-upload-formats.png)
*图：本站根据 [OpenAI 帮助中心：Uploading files and audio to ChatGPT](https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt) 整理的示意图*

几个容易踩的点：

- **音频上传仅限付费套餐**（包括 Enterprise），Free 目前不能传音频；文档、表格、演示文稿、文本和图片 Free 也可以传，但有各自的限制，Free 用户每天最多 3 次文件上传。
- 音频格式列表里写的是 WAV、MP3/MPEG、OGG/OGA、**纯音频**的 WebM、PCM、FLAC、AAC、M4A、**纯音频**的 MP4。文件必须包含有效、可解码的音频流。
- 官方单独说明：**WebM 和 MP4 文件如果被识别为视频，音频上传不支持**。这就是很多人「传了 .mp4 却被拒绝」的原因。
- 音频文件最大 512 MB；很长的录音可能被拆成小段处理，官方说明处理是尽力而为，过长的录音可能超时。
- 转写可能有错，说话人区分也可能不准，重要内容要对照原录音。

## 三、想让它「看」视频：用官方支持的格式拆开喂

下面是变通做法，**不是官方流程**：

### 1. 只想要讲话内容

把视频里的声音导出为纯音频文件（比如 MP3 或 M4A），再上传。上传之后可以让它转写、总结、提取要点。步骤与指令见 [/guides/chatgpt-audio-transcription](/guides/chatgpt-audio-transcription)。可以这样问：

```
这是一段 [45 分钟的网课] 的录音。请先给出带小标题的文字稿摘要，再列出 [5] 个最重要的结论，
最后列出我需要课后去查证的 [3] 个说法。时间点我不需要。
```

### 2. 画面里有关键信息（PPT、演示、操作界面）

截取几张关键帧，当图片上传。官方说明图片单张最大 20 MB。图片识别的使用方法见 [/guides/chatgpt-image-recognition](/guides/chatgpt-image-recognition)。

```
这是 [一段软件操作视频] 里的 4 张截图，按时间顺序。请根据截图写出操作步骤清单，
每一步写「点哪里 → 看到什么」；看不清的地方标出来，不要猜。
```

### 3. 视频自带字幕或有逐字稿

把字幕整理成 TXT 或 DOCX 上传。官方列出的文档与文本格式是 DOCX、PDF、TXT。

### 4. 会议录音

不是视频、只是想记会议，可以用录音模式 Record，见 [/guides/chatgpt-record-mode](/guides/chatgpt-record-mode)。

## 常见问题

**Q：ChatGPT 的语音通话能当「视频」用吗？**
语音模式里有摄像头和共享屏幕的能力，是实时画面输入，不等于上传视频文件。具体入口与限制见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)。

**Q：传 .mp4 一直失败，是网络问题吗？**
先看文件是不是视频：官方写明被识别为视频的 WebM 和 MP4 不在音频上传的支持范围里。把声音导出成纯音频再传；如果仍失败，按官方清单检查账号和套餐、文件大小、上传频率，并看 status.openai.com 有没有故障。

**Q：Free 能传音频吗？**
官方写明 Free 目前不支持音频上传。需要的话可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：我买过 Sora 的点数怎么办？**
官方说明，购买过的 ChatGPT / Sora 点数仍可用于 Codex；退款请按官方退款文章办理。

**Q：以后 ChatGPT 会不会再加视频生成？**
官方没有公开说明。本文只按 2026-10-14 核对到的页面写，之后的变化以 OpenAI 发布说明为准：https://help.openai.com/en/articles/6825453-chatgpt-release-notes 。

## 参考资料

- OpenAI 帮助中心：What to know about the Sora discontinuation — https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- OpenAI 帮助中心：Uploading files and audio to ChatGPT — https://help.openai.com/en/articles/8555545-uploading-files-and-audio-to-chatgpt
- OpenAI 帮助中心：ChatGPT release notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes

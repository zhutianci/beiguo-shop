---
title: NotebookLM 视频概览怎么生成：三种格式、视频风格、下载与水印说明
slug: notebooklm-video-overview-styles-download-watermark
products: [gemini]
models: [gemini-llm, veo]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）的视频概览能把资料做成带旁白的讲解视频。本文按官方帮助讲清电影效果、全面解析、短视频三种格式的区别，八种视觉风格、语言支持、下载分享方法，以及官方对水印的说明。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16454555?hl=en
  - https://support.google.com/notebooklm/answer/16213268?hl=en
  - https://support.google.com/notebooklm/answer/16337734?hl=en
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/video-overviews-nano-banana/
  - https://blog.google/innovation-and-ai/products/notebooklm/generate-your-own-cinematic-video-overviews-in-notebooklm/
  - https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
  - https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
verify:
  - 电影效果（Cinematic）视频概览对哪些账号开放：帮助中心只写「仅限 18 岁以上、仅英语」；2026 年 3 月 Workspace Updates 写个人用户为 Google AI Pro 和 Ultra，之后是否扩大到免费账号官方未说明
  - 可见水印的开关：官方写「符合条件的 Google One AI Pro 和 Ultra 订阅用户」可在头像下拉菜单里控制「Visible watermarking」，免费和 AI Plus 的方案表标注为不可移除；开关的具体位置和默认状态以实际界面为准
  - 视频时长上限、下载的文件格式和分辨率，官方帮助未写明
  - 每天可生成的视频数：个人账号现按算力限额计算，官方未列个数
  - 配图是 2025 年 10 月的界面，当时短格式叫「Brief」，现在帮助中心写的是「Short」，并新增了电影效果格式
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心、Google 官方博客和 Google Workspace Updates 整理，核对日期 2026-10-10。视频概览的画面和旁白都由 AI 生成，官方提醒可能存在不准确之处。

## 适用于谁

- 想把一堆资料变成一段讲解视频，用来预习、汇报或发给同学同事的人；
- 搜「notebooklm 视频 风格」「notebooklm 视频 下载」，想知道有哪些风格、怎么保存的人；
- 搜「notebooklm 视频 水印」，想知道官方到底怎么说的人。

## 结论先说

1. **入口在 Studio 面板的「视频概览（Video Overview）」**，需要笔记本的编辑权限；生成在后台进行，官方说有时要 30 分钟以上。
2. **三种格式**：电影效果（Cinematic，仅 18 岁以上、仅英语）、全面解析（Explainer）、短视频（Short，约 60 秒）。
3. **视觉风格**有经典、白板、水彩、复古印刷、传统、纸艺、可爱、动漫，也可以自动选择或自己描述；风格选择只对 18 岁以上用户开放，且不适用于电影效果和短视频。
4. **全面解析和短视频都支持中文**（官方语言列表里有简体和繁体）。
5. **水印**：官方说明生成的图片和视频会带可见水印，同时嵌入肉眼不可见的 SynthID 水印；可见水印能否关闭取决于订阅档位和所在地区，见第五节。

## 一、生成步骤

1. 打开已有笔记本，或新建并添加来源；
2. 在 Studio 面板点「视频概览」。直接生成会用默认设置；想调整就点铅笔图标；
3. 设好格式、语言、视觉风格和提示后点「生成（Generate）」；
4. 视频在后台生成，你可以继续做别的，或者稍后再回来；
5. 完成后在 Studio 面板点视频标题打开播放器。

建议在「设置 → 通知」里打开 Web 通知，生成完会有桌面提醒。

## 二、三种格式怎么选

| 格式 | 官方描述 | 限制 |
| --- | --- | --- |
| 电影效果（Cinematic） | 通过画面和叙事，沉浸式地讲清来源里的复杂概念 | 仅 18 岁以上；**仅支持英语** |
| 全面解析（Explainer） | 结构清晰、内容完整的讲解，把来源里的要点串起来 | 支持 80 多种语言 |
| 短视频（Short） | 约 60 秒，快速抓住核心概念 | 有单独的支持语言列表，含简体和繁体中文 |

关于电影效果，Google 官方博客（2026-03-04）的介绍是：它不再是「带旁白的幻灯片」，而是结合 Gemini、Nano Banana Pro 和 Veo 3 生成流畅动画和细节丰富的画面，由 Gemini 充当「创意总监」决定叙事和风格。

关于短视频，官方博客（2026-09-15）说它把叙述和教学动画结合起来，适合把公式、图示和科学概念讲得更好懂，并且可以分享给同学。

## 三、视觉风格与提示

![2025 年 10 月官方博客配图：「Customize Video Overview」面板，依次是格式、语言、视觉风格（自动选择、经典、白板、水彩、复古印刷等）和聚焦提示（早期界面，当时短格式名为 Brief）](seed:g433-video-overview-customize.jpg)
*图片来源：[Google 官方博客《Video Overviews on NotebookLM get a major upgrade with Nano Banana》](https://blog.google/innovation-and-ai/models-and-research/google-labs/video-overviews-nano-banana/)*

**视觉风格**（帮助中心）：

- 预设：经典（Classic）、白板（Whiteboard）、水彩（Watercolor）、复古印刷（Retro Print）、传统（Heritage）、纸艺（Paper-craft）、可爱（Kawaii）、动漫（Anime）；
- 自动选择：让它根据内容挑；
- 自定义（Custom）：输入一段文字描述你想要的画面风格。

风格选择仅限 18 岁以上用户，并且不适用于电影效果和短视频。

**引导提示（Steering prompt）**：可以点选它建议的主题，也可以自己写。官方博客给的例子是「只聚焦商业计划里的成本分析部分」「把这些食谱做成一步步跟做的视频，突出准备时间和烹饪步骤」。写法和音频概览一样：说清范围、对象和重点。

之后想回看当时的提示，在 Studio 面板该视频旁的三点菜单里选「查看自定义提示」；视频查看器标题旁也有「显示提示（Show prompt）」。

## 四、播放、下载与分享

- 播放器里可以改播放速度（点「1x」切换）、拖动进度条、快进快退、全屏；
- **下载**：在播放器里点下载图标，得到视频文件；手机 App 里是打开视频后点右上角「更多 → 下载」；
- **分享链接**：播放器里点「分享」，确认笔记本已分享给对方或设为「知道链接的任何人」且可访问完整笔记本，再复制视频概览的链接；
- **分享整个笔记本**：对方在 Studio 面板里能看到视频。

官方限制：公开分享只对个人账号开放；只有所有者和编辑者能把视频设为公开；**视频删除后，分享链接失效**；来源含 Play 图书电子书时可能无法下载。

## 五、水印：官方怎么说

帮助中心「方案」页的说明，原意如下：

- **不可见水印**：在 Gemini Notebook 里用 Veo、Omni 或 Nano Banana 生成的所有内容，都带有不可见的 SynthID 数字水印，用来标识 AI 生成内容；
- **可见水印**：为了进一步帮助识别 AI 生成内容，生成的图片和视频上会加可见水印；
- **方案表里的「Watermark Removal」一行**：标准版（无订阅）和 AI Plus 为「否」，AI Pro 和 AI Ultra 为「是」，并带星号说明；
- **控制方式**：符合条件的 AI Pro 和 Ultra 订阅用户，可以用头像下拉菜单里的「Visible watermarking（可见水印）」开关控制；
- **地区例外**：居住在印度、韩国或越南的用户，会自动加上可见水印。

需要说明的是，官方提到的开关只针对可见水印；不可见的 SynthID 水印按官方说法是这类生成内容都会带的，作用正是让 AI 生成内容可以被识别。对外发布 AI 生成的视频时，建议按所在平台的要求标注「AI 生成」。水印的原理可以参考本站《Gemini 生成的图片有水印吗：可见水印、SynthID 与发布时的合规要求》。

## 常见问题

**Q：生成很慢正常吗？**
正常。帮助中心写明视频概览可能需要较长时间，有时超过 30 分钟，可以先离开，稍后回到笔记本查看。

**Q：为什么我看不到风格选项或电影效果？**
官方写明这两项都只对 18 岁以上用户开放；另外，选了电影效果或短视频格式时本来就不能选风格。先确认 Google 账号已完成年龄验证。

**Q：能生成中文视频吗？**
全面解析和短视频可以，在语言选项里选中文。电影效果目前只支持英语。

**Q：每天能生成几个视频？**
个人账号现在按算力计算用量，每 5 小时刷新，直到用完每周上限，官方不再给个人账号列每天的个数；生成前 Studio 面板底部会显示这次预计消耗的用量。用量不够时网页版可以选「稍后生成」。详见本站《NotebookLM 免费版限制有哪些》。

**Q：视频内容能改吗？**
官方帮助没有提供逐段编辑视频的功能；不满意可以调整提示、来源勾选或风格后重新生成。

## 参考资料

- Generate Video Overviews in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16454555?hl=en
- Learn about Gemini Notebook's plans（帮助中心，水印说明）：https://support.google.com/notebooklm/answer/16213268?hl=en
- Use Gemini Notebook with a work or school Google account（帮助中心）：https://support.google.com/notebooklm/answer/16337734?hl=en
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- Google 官方博客：Video Overviews on NotebookLM get a major upgrade with Nano Banana（2025-10-13，截图来源）：https://blog.google/innovation-and-ai/models-and-research/google-labs/video-overviews-nano-banana/
- Google 官方博客：Generate your own Cinematic Video Overviews in NotebookLM（2026-03-04）：https://blog.google/innovation-and-ai/products/notebooklm/generate-your-own-cinematic-video-overviews-in-notebooklm/
- Google 官方博客：Sharpen your study routine with new Gemini Notebook tools（2026-09-15）：https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
- Google Workspace Updates：New ways to customize and interact with your content in NotebookLM（2026-03-20）：https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html

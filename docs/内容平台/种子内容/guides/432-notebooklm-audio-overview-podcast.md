---
title: NotebookLM 音频概览怎么用：生成播客、选中文、自定义提示与下载
slug: notebooklm-audio-overview-podcast
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）的音频概览能把资料变成 AI 主持人对谈的播客。本文按官方帮助讲清四种格式、中文等语言设置、长度与提示词怎么写、互动模式、下载和分享，以及手机上的离线收听。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16212820?hl=en
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/16261963?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://support.google.com/notebooklm/answer/16337734?hl=en
  - https://support.google.com/notebooklm/answer/16215270?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/notebook-lm-audio-video-overviews-more-languages-longer-content/
verify:
  - 长度选项：帮助中心写「Shorter、Default、Longer（English Only）」，本文理解为「较长」仅限英语；2025 年 8 月的官方配图里法语只显示 Shorter 和 Default，中文下实际能选哪几档需在界面确认
  - 每天能生成几个音频概览：个人账号自 2026 年 9 月起改为按算力计的用量限额，官方不再给个人账号列每日个数；Workspace 账号的表格仍写每日个数
  - 下载得到的音频文件格式、单个音频的时长上限，官方帮助均未写明
  - 官方帮助没有提到导出音频概览的文字稿或字幕
  - 配图是 2025 年 8 月的界面，当时自定义面板没有「格式」选项，现在的面板以实际为准
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心和 Google 官方博客整理，核对日期 2026-10-10。音频概览里的声音和内容都由 AI 生成，官方提醒可能有不准确或声音异常的情况。

## 适用于谁

- 想把论文、报告、课程资料变成「播客」，通勤路上听的人；
- 搜「notebooklm 播客 中文」「notebooklm 音频提示词」，想让它用中文讲、只讲某一部分的人；
- 想下载、分享音频，或者想知道能不能中途插话提问的人。

## 结论先说

1. **入口在 Studio 面板**：打开笔记本，在右侧 Studio 点「音频概览（Audio Overview）」即可生成，一般要几分钟，后台进行。
2. **四种格式**：深入探究（Deep Dive，默认，两位主持人对谈）、摘要（The Brief，一位讲述者两分钟内讲完要点）、评论（The Critique）、辩论（The Debate）。
3. **支持中文**：官方列出的 80 多种输出语言里有简体中文和繁体中文，在生成面板里选语言即可。
4. **能定向**：在提示框里写清「只讲哪一部分、讲给谁听」，比默认生成更贴合需要。
5. **能下载、能分享**；网页版下载得到音频文件，手机 App 里的下载是「离线收听」，不会导出成文件。

## 一、生成步骤

1. 打开已有笔记本，或新建一个并添加来源；
2. 确认你对笔记本有**编辑权限**（生成和删除音频概览都需要）；
3. 在 Studio 面板点「音频概览」。想先调整就点铅笔图标进入自定义面板；
4. 等待生成。官方说可能需要几分钟，期间可以同时生成别的成品，或者切到其他页面；
5. 生成后在 Studio 面板里点击播放。

官方对音频概览的定位是：对来源里关键主题的深度总结，力求**客观反映来源内容**，而不是 AI 主持人自己的观点。

## 二、自定义：格式、语言、长度、提示

![2025 年 8 月官方博客配图：「Customize Audio Overview」面板，可选语言、长度，并在文本框里写「AI 主持人应该聚焦什么」（早期界面）](seed:g432-audio-overview-customize.jpg)
*图片来源：[Google 官方博客《NotebookLM's Video Overviews are now available in 80 languages》](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebook-lm-audio-video-overviews-more-languages-longer-content/)*

| 选项 | 说明（帮助中心） |
| --- | --- |
| 格式 | **深入探究**：两位主持人把来源里的主题串起来聊；**摘要**：单人讲述，两分钟以内；**评论**：两位主持人对文章、设计文档等给出建设性评价；**辩论**：两位主持人就主题正式交锋 |
| 语言 | 从支持的语言里选；默认跟随 Google 账号的首选语言 |
| 长度 | 较短（Shorter）、默认（Default）、较长（Longer，标注仅限英语） |
| 提示 | 用一段话告诉它聚焦哪些主题、面向什么水平的听众 |

**提示怎么写**。官方界面给出的三个方向是：聚焦某个来源、聚焦某个主题、面向特定听众。照这个思路可以写成：

```
只讲《2025 年度报告》这份来源，重点讲营收结构和三项风险。
听众是没有财务背景的新同事，用生活化的例子解释术语，
最后用一分钟总结三条要点。
```

写提示时说清三件事就够了：**讲什么**（范围）、**给谁听**（深度）、**怎么收尾**（结构）。还可以配合来源面板，只勾选要讲的那几份资料。

生成之后，在 Studio 面板该音频旁的三点菜单里选「查看自定义提示（View custom prompt）」，可以回看当时用的提示。

## 三、播放、下载与分享

- **调速**：播放器的「更多」菜单里选「更改播放速度」；
- **边听边用**：音频可以在后台播放，同时继续在笔记本里查引用、提问；
- **以前生成的音频**：在 Studio 面板找到它，点「加载（Load）」。

分享有三种办法：

1. **分享链接**：在播放器里点「分享」，确认笔记本已经分享给对方，或已设为「知道链接的任何人」并且查看者可以访问完整笔记本，然后复制音频概览的链接；
2. **分享整个笔记本**：对方在 Studio 面板里就能看到这段音频；
3. **下载后发文件**：点下载图标保存音频，再发给别人。

需要留意的官方限制：

- 公开分享只对个人账号开放，Workspace 企业版和教育版账号目前不能公开分享；
- 只有笔记本的所有者和编辑者能把音频设为公开；
- **音频被删除后，之前的分享链接随即失效**；
- 笔记本里有 Play 图书电子书作为来源时，受出版方限制，生成的成品可能无法下载。

## 四、互动模式：中途插话提问

互动模式（Interactive mode）让你用语音加入对话，请主持人展开讲或换种方式解释。

1. 新生成一个音频概览；
2. 选择「互动模式」；
3. 收听过程中点「加入（Join）」；
4. 主持人点到你时开口提问；他们会依据来源回答，然后回到原来的内容继续。

官方说明的限制：

- **目前只支持英语**；
- 只对新生成的音频概览可用；
- 你的声音和转写内容不会被保存或分享；
- 别人通过分享链接听到的是原始音频，不能互动；
- 点「加入」或说话后可能有短暂延迟，也可能出现串音、多出一个声音等小故障。

## 五、手机上听

官方的手机 App（Android / iOS）可以生成和播放音频概览：

- 在 Studio 面板点铅笔图标，可以选语言、调长度、勾选来源、写提示；
- 播放时可以暂停、快进快退、调速；**切到别的 App 或锁屏后仍可后台播放**；
- 点「下载」可离线收听，下载的音频出现在 App 首页的「已下载（Downloaded）」里；也可以在 Studio 标签里向左滑动某个音频来下载或删除；
- 官方写明：App 里的下载只用于**离线收听，不能导出为设备上的文件**。要拿到文件，用网页版下载。

App 的安装要求和功能差异见本站《NotebookLM 手机版怎么用》。

## 常见问题

**Q：生成的是英文，怎么改成中文？**
在自定义面板的语言选项里选中文再生成；也可以在网页版「设置 → 输出语言」里把默认输出语言改成中文。之前已经生成的音频不会自动变，需要重新生成。

**Q：能把音频概览转成文字稿吗？**
官方帮助没有提到导出文字稿或字幕的功能。帮助中心倒是写了另一件相关的事：本地音频文件作为来源导入时，会被转写成文字。至于把下载的音频再导入能否得到完整文字稿，官方没有专门说明。

**Q：每天能生成几个？**
个人账号从 2026 年 9 月起改成按算力计算的用量限额，每 5 小时刷新，直到用完每周上限，官方不再给个人账号列「每天几个」。生成前，Studio 面板底部会显示这次预计消耗多少用量。详见本站《NotebookLM 免费版限制有哪些》。

**Q：为什么点了生成没反应或提示用量不足？**
达到用量限额时，网页版可以选「稍后生成（Generate later）」，系统会在之后自动生成并通知你。

**Q：只有查看权限能生成吗？**
不能。官方写明生成和删除音频概览需要编辑权限。

## 参考资料

- Generate Audio Overview in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16212820?hl=en
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Change output language in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16261963?hl=en
- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- Use Gemini Notebook with a work or school Google account（帮助中心）：https://support.google.com/notebooklm/answer/16337734?hl=en
- Add or discover new sources for your notebook（帮助中心，音频导入转写）：https://support.google.com/notebooklm/answer/16215270?hl=en
- Google 官方博客：NotebookLM's Video Overviews are now available in 80 languages（2025-08-25，截图来源）：https://blog.google/innovation-and-ai/models-and-research/google-labs/notebook-lm-audio-video-overviews-more-languages-longer-content/

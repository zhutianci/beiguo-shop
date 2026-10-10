---
title: NotebookLM 来源上限是多少：支持的文件类型、添加方法与来源失败的原因
slug: notebooklm-sources-limit-types-import-failed
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）一个笔记本能放多少来源、单个文件多大？本文按官方帮助列出各档来源上限、支持的文件类型、网页和 YouTube 导入规则、Deep Research 找资料步骤和来源添加失败的官方原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16215270?hl=en
  - https://support.google.com/notebooklm/answer/16213268?hl=en
  - https://support.google.com/notebooklm/answer/16269187?hl=en
  - https://support.google.com/notebooklm/answer/16262519?hl=en
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/16337734?hl=en
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/
  - https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/
verify:
  - Google AI Ultra 的来源上限：个人方案表写 500（20 TB 方案）和 600（30 TB 方案），Workspace 表的对应档写 400 和 600，两张表数字不同，以账号实际显示为准
  - 音频导入支持的语言列表里有「Traditional Chinese」和「Traditional Cantonese」，没有单列简体中文 / 普通话，普通话录音能否正常转写需用实际文件确认
  - Deep Research 的次数：个人账号现在按算力限额计算，官方没有给个人账号列具体次数；Workspace 表列了按档位的次数
  - 「来源空白」「YouTube 来源空白」等搜索里常见的现象，官方帮助没有对应说明
  - 配图分别来自 2025 年 11 月和 2026 年 6 月的官方博客，界面细节可能已更新
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心和 Google 官方博客整理，核对日期 2026-10-10。上限数字官方标注「可能调整」，以帮助中心和你账号里的实际显示为准。

## 适用于谁

- 搜「notebooklm 来源上限」「notebooklm 来源限制」，想知道一个笔记本能塞多少资料的人；
- 上传 PDF、贴 YouTube 链接时提示失败，想知道原因的人；
- 手头资料不够，想让它自己上网找资料（Deep Research）的人。

## 结论先说

1. **免费账号每个笔记本最多 50 个来源**；Google AI Plus 为 100 个，AI Pro 为 300 个，AI Ultra 为 500 或 600 个（视方案而定）。
2. **单个来源上限：50 万词，或上传文件 200 MB**，没有页数限制。
3. **官方列出的导入失败原因只有三条**：超过 50 万词、超过 200 MB、PDF 带复制保护。YouTube 和音频另有各自的规则。
4. **可以让它帮你找来源**：来源面板的搜索框支持「Fast Research（快速搜索）」和「Deep Research（深度研究）」，找到后勾选导入。
5. **手机 App 支持的来源类型更少**：只有 PDF、网站、YouTube、音频和粘贴的文字。

## 一、来源是什么

官方的定义：来源（source）是你导入或上传的文档的**一份副本**，或者是会自动同步的版本（Google 云端硬盘文件）。它回答问题、生成各种成品时，只使用你放进笔记本的来源。

## 二、数量与大小上限

| 项目 | 上限（帮助中心） |
| --- | --- |
| 单个来源 | 最多 50 万词；上传的文件最大 200 MB；没有页数限制 |
| 每个笔记本的来源数：无订阅 | 50 |
| Google AI Plus | 100 |
| Google AI Pro | 300 |
| Google AI Ultra（20 TB 方案 / 30 TB 方案） | 500 / 600 |

补充三点官方说明：

- **分享不会改变上限**：把笔记本分享给别人，协作者各自的来源上限不变；
- **失效的来源也占名额**：云端硬盘里的原文件被删除或你失去访问权限后，这个来源会变成不可用，但仍然计入来源数，需要手动移除；
- 笔记本数量也有上限，见本站《NotebookLM 免费版限制有哪些》。

## 三、支持哪些类型

| 类型 | 官方说明 |
| --- | --- |
| 本地文件 | PDF、Word（docx）、纯文本（txt）、Markdown（md）、CSV、PowerPoint（pptx）、ePub |
| 图片 | avif、bmp、gif、heic、heif、ico、jp2、jpe、jpeg、jpg、png、tif、tiff、webp；官方提示部分图片效果可能不理想 |
| Google 文件 | Google 文档；Google 幻灯片（最多 100 张）；Google 表格（目前限 10 万 token） |
| 网页链接 | 只抓取网页的文字；图片、内嵌视频、嵌套页面不导入；**不支持付费墙页面**；链接指向 PDF 时按 PDF 处理 |
| YouTube 链接 | 只支持**公开且有字幕**（上传者提供或自动生成）的视频，导入的是字幕文本 |
| 音频文件 | MP3、WAV 等；导入时转写成文字作为来源 |
| 粘贴的文字 / 笔记 | 直接粘贴成为来源，可以起标题 |
| Play 图书 | 你在 Google Play 图书购买的、符合条件的电子书，目前只支持文字 |
| Gemini 对话 | 在 Gemini 应用里和笔记本的对话，可以作为上下文出现在来源里 |

贴多个网页链接时，用空格或换行分隔。

## 四、添加来源的步骤（网页版）

1. 打开一个你拥有的笔记本，或新建一个；
2. 左侧点「添加来源（Add sources）」；
3. 上传文件、粘贴链接或文字；也可以在搜索框输入一个研究问题，从网络或云端硬盘里找；
4. 勾选要加入的来源。

**云端硬盘文件的特点**：

- 会自动同步，官方说每隔几分钟同步一次；也可以打开来源后点「Click to sync with Google Drive」手动同步；
- 你至少要有查看权限才能导入；
- 它不会修改或删除你云端硬盘里的原文件；
- Google 文件里的脚注和评论不会导入；文档和表格里的多个标签页会合并成一个来源。

**来源多了怎么整理**：来源达到 5 个以上时，它可以自动加标签并分类，你也可以手动新建、重命名、删除标签或移动来源。

## 五、让它帮你找来源：Fast Research 与 Deep Research

![2025 年 11 月官方博客配图（宣传示意图）：来源面板的搜索框里选择「Web」并切换到「Deep Research」，完成后提示发现了多少个来源并可导入](seed:g431-deep-research-web-search.jpg)
*图片来源：[Google 官方博客《NotebookLM adds Deep Research and support for more source types》](https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/)*

**Fast Research（快速搜索）**

1. 在来源面板的搜索框输入关键词或问题，例如「蝴蝶的身体结构」「关于第四季度规划的文档」；
2. 选择「Web（网络）」或「Drive（云端硬盘）」；
3. 结果以列表给出，每条有标题、与问题的关联说明和原网页链接，点「View」展开；
4. 勾选需要的，导入笔记本。

**Deep Research（深度研究）**

官方介绍它会自动浏览多达数百个网站，整理思路，几分钟内写出一份多页报告。

1. 在来源面板搜索框输入研究问题；
2. 打开「Web」和「Deep Research」；
3. 开始搜索。结果可能要几分钟，期间可以继续用笔记本；
4. 完成后可以全部导入，或点「View」查看：里面有研究报告，以及全部相关来源（被引用的和未被引用的）；
5. 勾选要导入的内容。点「Cancel」或最小化会退出，**没导入的结果会被丢弃**。

官方的两条限制：Deep Research 目前只对 18 岁以上用户开放；来源上限照常生效，超出上限时结果可能只导入一部分。

![2026 年 6 月官方博客配图：在对话里完成研究后，回答下方出现「Report & Outside Sources」卡片，点「Import」把研究报告和外部来源一并导入](seed:g431-import-sources-in-chat.jpg)
*图片来源：[Google 官方博客《Do better research with NotebookLM》](https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/)*

帮助中心的「对话」一文也提到，可以直接在对话里完成研究，再选择把研究报告和来源导入笔记本。

## 六、来源添加失败：官方给的原因

**通用原因（官方 FAQ）**

- 超过单个来源 50 万词的限制；
- 文件超过 200 MB；
- 原始 PDF 带有复制保护。

**YouTube 链接失败的常见原因**

- 链接无效；
- 视频被判定为可能不安全；
- 视频没有字幕文件；
- 视频语言暂不支持。

另外：没有语音内容的视频不支持；**上传不满 72 小时的视频可能暂时无法导入**；视频长度本身没有限制，除非字幕超过 50 万词；视频被删除或转为私享后，对应来源会在 30 天内从笔记本里自动删除。

**音频文件**

- 没有语音的音频不支持；
- 官方提示音质太差可能导入失败；
- 支持的格式包括 3g2、3gp、aac、aif、aifc、aiff、amr、au、avi、cda、m4a、mid、mp3、mp4、mpeg、ogg、opus、ra、ram、snd、wav、wma；
- 音频转写有一份支持语言列表，见帮助中心原文。

**网页链接**：付费墙页面不支持；只能拿到文字，图片和视频拿不到。

## 七、笔记也是来源

新版里，你写的笔记和保存下来的回答会出现在**来源面板**，和上传的资料一样可以被勾选、被引用、参与生成成品：

- 在来源面板点「创建笔记（Create note）」手写或粘贴；
- 对话里满意的回答点「保存到笔记（Save to note）」；
- 以前在 Studio 面板里创建的旧笔记，打开后点「转换（Convert）」，或在任意笔记的「更多」菜单里选「Convert all notes to source」批量转成来源；
- 鼠标悬停在笔记上，「更多 → 导出到 Google 文档（Export to Docs）」可以导出；导出后的文档不再和笔记同步。

## 常见问题

**Q：为什么回答里没有引用？**
官方解释：来源内容太短时，它会直接参考整篇文档，不再标出具体引文。

**Q：我只想让它看其中几份资料？**
在来源面板里取消勾选不需要的来源即可，未勾选的来源不会用于回答和生成。

**Q：能上传别人的付费资料或书吗？**
官方提示不要上传你没有权利使用的文档，并要求遵守版权法。电子书可以用 Play 图书入口添加你已购买且符合条件的书。

**Q：手机 App 能加哪些来源？**
帮助中心写明 App 目前只支持 PDF、网站、YouTube、音频和粘贴的文字，其他类型要在电脑上添加。

## 参考资料

- Add or discover new sources for your notebook（帮助中心）：https://support.google.com/notebooklm/answer/16215270?hl=en
- Learn about Gemini Notebook's plans（帮助中心）：https://support.google.com/notebooklm/answer/16213268?hl=en
- Frequently asked questions（帮助中心）：https://support.google.com/notebooklm/answer/16269187?hl=en
- Create & add notes in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16262519?hl=en
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Use Gemini Notebook with a work or school Google account（帮助中心）：https://support.google.com/notebooklm/answer/16337734?hl=en
- Google 官方博客：NotebookLM adds Deep Research and support for more source types（2025-11-13）：https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-deep-research-file-types/
- Google 官方博客：Do better research with NotebookLM（2026-06-08）：https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/

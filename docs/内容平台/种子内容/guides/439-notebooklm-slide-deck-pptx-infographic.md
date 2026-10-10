---
title: NotebookLM PPT 可编辑吗：演示文稿的生成、修改、下载 PPTX 与信息图
slug: notebooklm-slide-deck-pptx-infographic
products: [gemini]
models: [gemini-llm, nano-banana]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）生成的 PPT 能改吗、怎么下载？本文按官方帮助讲清演示文稿的两种格式、用「修改（Revise）」逐页改稿、删页和调整顺序、下载 PDF 或 PPTX，以及信息图的风格和下载。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16757456?hl=en
  - https://support.google.com/notebooklm/answer/16758265?hl=en
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/16179559?hl=en
  - https://support.google.com/notebooklm/answer/16213268?hl=en
  - https://support.google.com/notebooklm/answer/16337734?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
  - https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/
verify:
  - 下载的 PPTX 在 PowerPoint 里文字是否为可逐字修改的文本框，官方帮助没有说明；官方描述的修改方式是在 Gemini Notebook 里用文字指令让它重新生成
  - 演示文稿页面上是否带可见水印：官方只笼统写「生成的图片和视频会加可见水印」，没有单独说明演示文稿；可见水印开关仅面向符合条件的 AI Pro / Ultra 用户
  - 免费账号能生成、修改多少份演示文稿：帮助中心只写「可修改的演示文稿总数有配额限制」，个人账号现按算力限额计算，没有具体份数
  - 演示文稿「长度」短 / 默认 / 长各对应多少页，官方未写明；Workspace 表在最高档标注「带长度控制」，长度选项是否对所有档位开放以界面为准
  - 对话里直接生成 .pptx 文件属于「实验性」新能力，官方博客写的是先向 AI Ultra 和部分 Workspace 账号开放
  - 配图为 2026 年 3 月官方动图截帧，其中信息图一张原图分辨率较低
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心、Google 官方博客和 Google Workspace Updates 整理，核对日期 2026-10-10。演示文稿和信息图由 AI 生成，官方提醒可能存在画面或事实错误，对外使用前请逐页核对。

## 适用于谁

- 搜「notebooklm ppt 可编辑」「notebooklm ppt 修改」「notebooklm ppt 下载」「notebooklm 导出 pptx」的人；
- 想把一堆资料快速变成汇报稿、课件，再按自己的意思调整的人；
- 想做一张信息图（台湾常叫「资讯图表」）概括资料要点的人。

本站另有一篇《Nano Banana 怎么做 PPT：Google 幻灯片、NotebookLM 与 Gemini 三种官方方法》比较几种做 PPT 的途径；本文只讲 Gemini Notebook 里的演示文稿和信息图怎么操作。

## 结论先说

1. **能改，但方式是「下指令重新生成」**：打开演示文稿点「修改（Revise）」，在每一页下面写修改意见，它会生成一份新的演示文稿。
2. **能删页、能调顺序**：在修改模式里可以删除幻灯片、拖动缩略图排序。
3. **能下载 PDF 和 PPTX**：三点菜单里有「Download PDF Document (.pdf)」和「Download PowerPoint (.pptx)」两个选项。
4. **两种格式**：详细演示文稿（适合发给别人自己读）和演示用幻灯片（适合自己上台讲）。
5. **演示文稿和信息图目前都只对 18 岁以上用户开放**，生成需要笔记本的编辑权限。

## 一、生成演示文稿

1. 打开已有笔记本，或新建并添加来源；
2. 在 Studio 面板点「演示文稿（Slide Deck）」直接生成；想先设置就点铅笔图标；
3. 生成在后台进行，官方说可能需要好几分钟，期间可以继续用笔记本。

自定义面板的选项：

| 选项 | 说明（帮助中心） |
| --- | --- |
| 格式 | **详细演示文稿（Detailed Deck）**：文字完整、细节齐全，适合邮件发送或单独阅读；**演示用幻灯片（Presenter Slides）**：简洁、以视觉为主，只放讲述要点，用来配合你现场讲 |
| 输出语言 | 从支持的语言里选 |
| 长度 | 短、默认、长 |
| 提示 | 描述你想要的演示文稿：可以给大纲，或指定受众、风格和重点 |

官方给的提示例子是：「为初学者制作一份演示文稿，风格大胆活泼，注重分步说明。」照这个思路可以写得更具体：

```
面向没有技术背景的管理层，做一份 8 页左右的汇报。
结构：背景 → 三个发现 → 风险 → 建议。
风格简洁商务，每页一个结论句作标题，数据用图表呈现。
```

## 二、查看和放映

- 在 Studio 面板点演示文稿的标题打开查看器，可以展开或收起、滚动翻页、缩放；
- 点「开始播放幻灯片（Start slideshow）」进入全屏放映，用鼠标点击或方向键翻页，按 Esc 退出；
- 三点菜单里可以重命名、下载、分享或删除；
- 「查看自定义提示（View custom prompt）」可以回看生成时用的提示。

## 三、修改：Revise 怎么用

![2026 年 3 月官方动图截帧：演示文稿的修改模式，在「Change Slide 9」输入框里写修改意见，底部显示「Pending changes (4)」，右下角是「Generate new deck」按钮（早期界面）](seed:g439-slide-deck-revise.jpg)
*图片来源：[Google Workspace Updates《New ways to customize and interact with your content in NotebookLM》](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html)*

1. 在 Studio 面板打开演示文稿；
2. 点顶部的「修改（Revise）」；
3. 在要改的幻灯片下面输入修改意见。可以改文字、换布局、更新配图；
4. 可以连续改多页，所有指令会汇总在「待处理的更改（Pending Changes）」里；
5. 改完后点「生成修改后的演示文稿（Generate revised deck）」。

修改意见可以像这样写：「把标题改成『如何让小狗停止咬人』」「把这页改成左右两栏」「把箭头加粗」。

官方说明的几个要点：

- **每次生成修改版，都会创建一份全新的演示文稿**，作为新的一份出现在 Studio 面板里；
- **修改时不会参考来源**：它只按你的指令改，不会回头去来源里核对事实，所以涉及数据的改动要自己把准确内容写进指令；
- 修改已有幻灯片比从头生成一份新的更快；
- **建议攒在一起改**：单份演示文稿里可以改的页数没有限制，但「可修改的演示文稿总数」有配额限制。

**删除幻灯片**：进入修改模式 → 鼠标悬停在某一页 →「更多 → 删除幻灯片（Delete slide）」。待删除的页会变灰并显示垃圾桶图标；反悔可以选「更多 → 恢复幻灯片（Restore slide）」。最后同样点「生成修改后的演示文稿」生效。

**调整顺序**：在修改模式的预览区，拖动幻灯片缩略图到新位置。

**手机上**：App 里也可以对已有演示文稿点「修改」逐页写意见，但官方注明手机上修改时暂不支持增删幻灯片；下载和全屏放映在网页版。

## 四、下载与分享

**下载**：点三点菜单，选「Download PDF Document (.pdf)」或「Download PowerPoint (.pptx)」。按 Workspace Updates（2026-03-20），导出 PPTX 是当时新增的能力，面向所有用户。

关于「可编辑」：官方帮助描述的编辑方式是上一节的 Revise，也就是在 Gemini Notebook 里改；至于下载的 PPTX 用 PowerPoint 打开后，页面上的文字能不能逐字修改，官方帮助没有说明，需要你自己打开文件确认。

**分享**有三种：

1. 在查看器里点「分享」，确认笔记本已分享给对方或设为「知道链接的任何人」，且查看者能访问完整笔记本，然后复制演示文稿的链接；
2. 分享整个笔记本，对方在 Studio 面板里能看到；
3. 下载后发文件。

限制：公开分享只对个人账号开放；演示文稿删除后分享链接失效；来源含 Play 图书电子书时可能无法下载。

## 五、信息图（Infographic）

信息图把来源里的要点做成**一张图**，适合概括重点、展示数据或概念之间的关系。

![2026 年 3 月官方动图截帧：「Customize Infographic」面板，可选语言、方向（横向 / 纵向 / 方形）、视觉风格、详细程度，并填写描述（早期界面，原图分辨率较低）](seed:g439-infographic-customize.jpg)
*图片来源：[Google Workspace Updates《New ways to customize and interact with your content in NotebookLM》](https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html)*

在 Studio 面板点「信息图」直接生成，或点铅笔图标自定义：

| 选项 | 可选值 |
| --- | --- |
| 输出语言 | 从支持的语言里选 |
| 详细程度 | 简洁（Concise）、标准（Standard）、详细（Detailed，标注 beta） |
| 方向 | 方形（Square）、纵向（Portrait）、横向（Landscape） |
| 视觉风格 | 仅 18 岁以上可选。Workspace Updates 列出的十种预设：Sketch Note、Kawaii、Professional、Scientific、Anime、Clay、Editorial、Instructional、Bento Grid、Bricks；不选则由它自动挑 |
| 提示 | 描述风格、配色或重点，官方例子：「用蓝色主题，突出 3 个关键数据」 |

生成一般需要几分钟。之后可以在三点菜单里重命名、**下载为 PNG 文件**、分享或删除；在放大的查看器里可以缩放。分享方式和限制与演示文稿相同。

和演示文稿不同，帮助中心没有给信息图提供「修改」功能；不满意就调整提示、风格或勾选的来源后重新生成。

## 六、在对话里直接要文件

帮助中心「对话」一文介绍的新能力里，对话可以直接生成可下载的文件，其中包括 **Microsoft PowerPoint（pptx）**，以及 PDF、Word、Excel、图表图片等，还可以把生成的成品按版本继续修改。官方把这些称为「实验性、早期阶段」的功能，并提醒需要人工复核。开放范围见文首待核对事项。

## 常见问题

**Q：生成的 PPT 是中文的吗？**
在自定义面板的「输出语言」里选中文即可。官方提醒演示文稿可能存在画面或事实错误，中文内容同样建议逐页检查文字。

**Q：改一页为什么整份都重新生成？**
这是官方设计：每次修改都会产出一份全新的演示文稿。所以建议把所有修改意见写完再一次生成。

**Q：免费版能做几份？**
个人账号现在按算力计算用量，官方没有给出份数；生成前 Studio 面板底部会显示预计消耗，用量不足时网页版可以选「稍后生成」。详见本站《NotebookLM 免费版限制有哪些》。

**Q：下载的文件有水印吗？**
官方的说明是：用 Nano Banana 等模型生成的内容都带不可见的 SynthID 水印；生成的图片和视频上还会加可见水印，符合条件的 AI Pro 和 Ultra 订阅用户可以在头像下拉菜单里用「Visible watermarking」开关控制（居住在印度、韩国、越南的用户会自动加上）。官方没有单独说明演示文稿页面的水印情况。

**Q：为什么我没有「演示文稿」或「信息图」按钮？**
官方写明这两项目前只对 18 岁以上用户开放，先确认 Google 账号已完成年龄验证。

## 参考资料

- Generate a Slide Deck in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16757456?hl=en
- Generate an Infographic in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16758265?hl=en
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Use chat in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16179559?hl=en
- Learn about Gemini Notebook's plans（帮助中心，水印说明）：https://support.google.com/notebooklm/answer/16213268?hl=en
- Use Gemini Notebook with a work or school Google account（帮助中心）：https://support.google.com/notebooklm/answer/16337734?hl=en
- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- Google Workspace Updates：New ways to customize and interact with your content in NotebookLM（2026-03-20，截图来源）：https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
- Google 官方博客：Do better research with NotebookLM（2026-06-08）：https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/

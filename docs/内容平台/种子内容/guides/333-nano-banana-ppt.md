---
title: Nano Banana 怎么做 PPT：Google 幻灯片、NotebookLM 与 Gemini 三种官方方法
slug: nano-banana-ppt
products: [gemini]
models: [nano-banana]
accountTier: PRO
excerpt: 用 Nano Banana 做 PPT 有哪些官方途径？本文按 Google 官方资料讲清：在 Google 幻灯片里用 Gemini 生成可编辑演示文稿、用「Beautify this slide」生成图片式页面、用 NotebookLM 从资料生成幻灯片，以及两种结果的区别。
checkedOn: 2026-10-07
sources:
  - https://support.google.com/docs/answer/17111393?hl=en
  - https://support.google.com/docs/answer/16961475?hl=en
  - https://workspaceupdates.googleblog.com/2026/04/enerate-beautiful-and-editable-slides-with-ease-in-Google-Slides.html
  - https://workspaceupdates.googleblog.com/2025/11/workspace-nano-banana-pro.html
  - https://support.google.com/gemini/answer/16275805?hl=en
---

## 适用于谁

- 搜「Nano Banana PPT」「Nano Banana PPT 制作」「Nano Banana PPT 可编辑」「Nano Banana PPT 提示词」的人；
- 想让 AI 帮忙做汇报、课件、提案，又希望页面好看、文字清楚的人；
- 分不清「AI 生成的整页图片」和「可以改字的幻灯片」有什么区别的人。

本文根据 Google 官方帮助中心和 Google Workspace 更新博客整理，资料核对于 2026-10-07。功能需要符合条件的 Google AI 或 Workspace 套餐，部分功能目前仅支持电脑端和英文，以官方页面为准。

## 结论先说

1. **先分清两种结果**：
   - **可编辑幻灯片**：文字、图片都是独立元素，能直接改字、换图。Google 幻灯片里的 Gemini「生成演示文稿 / 生成幻灯片」属于这一类（2026 年 4 月起官方称可生成完全可编辑、匹配品牌风格的页面）。
   - **图片式页面**：整页是一张 Nano Banana 生成的图，视觉效果强、文字由模型渲染，但**不能像普通文本那样逐字修改**。「Beautify this slide（美化这张幻灯片）」、NotebookLM 生成的幻灯片、直接让 Gemini 画一张信息图，都偏向这一类。
2. **要交付、要反复改** → 用可编辑方式；**要一张有冲击力的封面、信息图页** → 用 Nano Banana 生成图片式页面。
3. 生成后都要**人工核对文字和数据**：AI 生成的事实、数字、拼写都可能出错。

## 方法一：在 Google 幻灯片里生成可编辑演示文稿

适合：从零开始做一整份 PPT。

1. 打开 Google 幻灯片，在开始界面点 **Presentation**；或在一个空白演示文稿中，点右上角 **Ask Gemini**；
2. 在侧边栏描述你要的演示文稿，例如：「为普通观众做一份 5 页的量子计算入门演示，现代风格」；
3. （可选）**Add sources → Add from Drive**，选资料文件作为内容来源；
4. （可选）**Match presentation style → Add from Drive**，选一份现有 PPT 来匹配风格；
5. 回答 Gemini 的追问（可跳过），点 **Next**；
6. Gemini 给出**演示文稿计划**：概述、参考来源、每页提纲。你可以改标题、增删页面，点 **Update plan** 重新生成提纲；
7. 满意后点 **Approve**，保持页面打开，等待几分钟生成。

生成后，可以手动改任意元素，或继续让 Gemini 逐页修改、加页、加图或改图。

![Google 幻灯片里的 Gemini：在空白页底部点「Create a slide」生成新页面，右侧是 Gemini 工具栏（官方动图截帧，英文界面）](seed:g333-slides-gemini-generate.jpg)
*图片来源：[Google Workspace Updates · Generate beautiful and editable slides with ease in Google Slides](https://workspaceupdates.googleblog.com/2026/04/enerate-beautiful-and-editable-slides-with-ease-in-Google-Slides.html)（已遮去示意图中的用户头像）*

## 方法二：逐页生成或改造

适合：已有一份 PPT，只想补一页或把某页改好看。

1. 打开演示文稿，点右上角 **Ask Gemini**；
2. 描述要生成的这一页，或者对当前页提修改，例如「精简这页的文字并加一张图」「改成两栏布局」；
3. 预览出来后，点 **Replace** 替换当前页，或点旁边的箭头选 **Insert** 作为新页插入。

官方提示：一次只能生成一页；可以用 @ 引用云端硬盘里的文件作为内容来源，例如「根据 @项目纪要 做一页总结」。

### 「Beautify this slide」：图片式美化

Nano Banana Pro 上线时，Google 幻灯片新增了「Beautify this slide」：根据现有页面的内容，生成一张设计感更强、文字更清晰、并参考整份 PPT 风格的视觉页面，选择「insert as new slide」即可插入。2026 年 4 月的更新说明，图片式美化现在只能从 **Slide（幻灯片）菜单**进入。注意：它插入的是图片，后续改字需要重新生成。

## 方法三：用 NotebookLM 从资料生成幻灯片

Google Workspace 更新博客介绍，NotebookLM 接入 Nano Banana Pro 后，可以把你上传的资料（来源）可视化成信息图，也能**直接生成完整的幻灯片**，并以 PDF 分享。适合把研究资料、会议记录快速变成一份可读的讲解稿；PDF 形式意味着它同样不是逐字可编辑的。

## 方法四：直接让 Gemini 画信息图页

在 Gemini 里用 Nano Banana 生成单页信息图、流程图或封面，再插入到任何 PPT 软件里。官方建议文字多、信息图类的图片可以用 **Nano Banana Pro 重做**获得更多细节。

提示词可以这样写：

```
为一份季度汇报做一张 16:9 的信息图页面，主题是"[主题]"。
左侧是标题"[标题文字]"，右侧用 3 个图标卡片展示：[要点1]、[要点2]、[要点3]。
风格：扁平商务风，配色[品牌色]，白色背景，留出足够边距，文字清晰易读。
```

更多模板见《Nano Banana 提示词怎么写》。

## 常见问题

**Q：生成的 PPT 能导出成 .pptx 吗？**
Google 幻灯片生成的演示文稿是普通的 Google 幻灯片文件，可以用幻灯片自带的下载功能导出为 PowerPoint 等格式。图片式页面导出后依然是图片。

**Q：支持中文吗？**
官方帮助中心写明「生成演示文稿」「生成幻灯片」目前仅支持电脑端和英文；Workspace 博客提到新版会支持英文和更多语言。中文需求可先在 Gemini 里生成内容和配图，再放进幻灯片。

**Q：需要什么套餐？**
官方说明需要符合条件的 Google Workspace 或 Google AI 套餐；2026 年 4 月更新的可编辑幻灯片生成，个人用户为 Google AI Pro 和 Ultra。个人账号也可以通过 Google Workspace Experiments 测试计划试用部分功能。

**Q：网上的「Nano Banana PPT skill」「GitHub 项目」是什么？**
那些是第三方基于 API 做的工具，不是 Google 官方功能。使用前留意数据安全和 API 费用。

## 参考资料

- Google Docs Editors Help：Generate presentations with Gemini in Google Slides — https://support.google.com/docs/answer/17111393?hl=en
- Google Docs Editors Help：Generate a slide with Gemini in Google Slides — https://support.google.com/docs/answer/16961475?hl=en
- Google Workspace Updates：Generate beautiful and editable slides with ease in Google Slides（2026-04-01）— https://workspaceupdates.googleblog.com/2026/04/enerate-beautiful-and-editable-slides-with-ease-in-Google-Slides.html
- Google Workspace Updates：Introducing Nano Banana Pro in Slides, Vids, Gemini app, and NotebookLM（2025-11-20）— https://workspaceupdates.googleblog.com/2025/11/workspace-nano-banana-pro.html
- Gemini Apps Help：Gemini Apps limits & upgrades（Slide generation 功能）— https://support.google.com/gemini/answer/16275805?hl=en

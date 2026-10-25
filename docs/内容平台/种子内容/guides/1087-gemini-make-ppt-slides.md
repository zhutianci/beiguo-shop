---
title: Gemini 能做 PPT 吗：在 Google 幻灯片里生成、用 Gemini 应用整理资料、已有 PowerPoint 怎么办
slug: gemini-make-ppt-slides
products: [gemini]
models: []
accountTier: OTHER
excerpt: Gemini 能做 PPT 吗？官方有两条路：在 Google 幻灯片里点 Ask Gemini，可生成幻灯片、图片、摘要并参考 Drive 文件；或在 Gemini 应用里把零散资料整理成演示文稿。官方没有写直接导出 .pptx 的步骤（2026-10 查询）。
checkedOn: 2026-10-25
sources:
  - https://workspace.google.com/products/slides/
  - https://workspace.google.com/resources/presentation-ai/
  - https://gemini.google/release-notes/
  - https://gemini.google/subscriptions/
verify:
  - 官方页面写的是「Gemini in Slides 可以：生成新幻灯片、生成图片、总结演示文稿、参考云端硬盘文件生成新幻灯片」，入口是 Ask Gemini 图标；具体按钮位置和界面会随版本变化，本文不写页面截图里没有的细节
  - Gemini in Slides 在哪些套餐里可用，官方 Slides 页只写了「试用 Gemini for Google Workspace」，且 Slides 页上标注「部分功能仅在部分 Workspace 商业版和企业版提供」；Google AI 套餐页写 Pro 和 Ultra 带「Gemini in Gmail、Docs、Vids 等」，没有逐项列出 Slides，请以你账号里是否出现 Ask Gemini 图标为准
  - 官方 2026-10-13 更新记录提到 Gemini 4 Argon 可用于「用零散资料做演示文稿」，面向 Pro 和 Ultra；官方没有给出在 Gemini 应用里生成 .pptx 或 Slides 文件的逐步说明，所以本文不写「一键导出 PPT」
  - 官方 Slides 页说明可以导入 Microsoft PowerPoint 或 Canva 演示文稿，也可以直接编辑 PowerPoint 文件而不用复制；导出 .pptx 的步骤本文没有取得官方页面依据，不写
  - 文中的提示词示例为自拟，不是官方模板
---

> 本文根据 Google Workspace 官方幻灯片产品页、Gemini in Slides 介绍页、Gemini 应用更新记录和订阅页整理，资料核对于 2026-10-25。功能可用范围随账号类型和套餐变化，**以你账号里实际看到的为准**。图为本站整理的示意图。

## 适用于谁

- 搜「gemini能做ppt吗」「gemini做ppt」的人；
- 想让 AI 帮忙搭演示文稿框架、配图的人；
- 手上有 PowerPoint 文件，想知道能不能用 Gemini 处理的人。

## 结论先说

1. **能，但官方没有「一键生成 .pptx」这个说法**。官方的做法有两条：一是在 **Google 幻灯片** 里直接用 Gemini；二是在 **Gemini 应用**里让它整理资料、写大纲。
2. **在幻灯片里**：官方说通过 **Ask Gemini 图标**进入，可以创建图片、生成新幻灯片、总结演示文稿，并参考你云端硬盘里的文件生成新的幻灯片。
3. **在 Gemini 应用里**：官方 2026-10-13 更新记录提到 Gemini 4 Argon 可以「从零散资料做演示文稿」，面向 Google AI Pro 和 Ultra 订阅用户。
4. **已有 PowerPoint**：官方说幻灯片可以导入 PowerPoint 并转换成 Slides 格式，也可以直接编辑 PowerPoint 文件，原文件保持不变。
5. **账号类型要留意**：官方 Slides 页注明部分功能只在特定 Google Workspace 商业版和企业版提供。需要谷歌账号相关服务可以看 [/chongzhi/google-zhanghao](/chongzhi/google-zhanghao)。

![用 Gemini 做 PPT 的几条路怎么选](seed:g1087-gemini-ppt-which-way.png)
*图：本站根据 [Google 幻灯片官方页](https://workspace.google.com/products/slides/) 与 [Gemini 更新记录](https://gemini.google/release-notes/) 整理的示意图*

## 一、在 Google 幻灯片里用 Gemini

![在 Google 幻灯片里用 Gemini 的 4 步](seed:g1087-gemini-slides-steps.png)
*图：本站根据 [Google Workspace：Generative AI for presentations](https://workspace.google.com/resources/presentation-ai/) 整理的示意图*

官方的说明很简短：

1. 打开 Google 幻灯片里的演示文稿；
2. 点 **Ask Gemini** 图标；
3. 在建议提示里选一个，或自己写提示词；
4. 生成新幻灯片、生成图片、总结演示文稿，再逐页调整。

官方介绍的能力：

- **生成幻灯片**：用一句简单的提示词，加上你 Drive 里的内容，生成一页新幻灯片；
- **生成图片**：「Help me visualize」类的提示，可以生成原本不存在的图片；
- **总结**：快速总结演示文稿的内容；
- **按角色给的提示词参考**：官方介绍页还按岗位（比如分析师和公关、市场负责人、技术负责人）列了提示词方向，例如为分析师或媒体沟通会做准备、构思内容、向非技术听众讲技术话题。

### 一个提示词写法示例（自拟）

> 我要给部门做 10 分钟的季度汇报，听众是非技术同事。请先给出 6 页的提纲，每页写标题和 3 条要点，最后一页是行动计划。内容基于我 Drive 里的「Q3 汇报草稿」。

先让 Gemini 出提纲，你确认后再让它逐页生成，比一次性要整份演示稿更容易修改。

## 二、在 Gemini 应用里整理资料

官方 2026-10-13 更新记录写到，Gemini 4 Argon 面向 Pro 和 Ultra 订阅用户，可用于分析复杂财务报告、从零散资料做演示文稿、搭交互式 3D 模型等。Argon 的详细说明见 [/guides/gemini-4-argon-what-is-release-date](/guides/gemini-4-argon-what-is-release-date)。

在这条路里，通常的做法是：

1. 把资料（文档、表格、笔记）上传到对话里；
2. 让 Gemini 按听众和时长写出提纲与逐页文案；
3. 把内容放进 Google 幻灯片或 PowerPoint 里排版。

官方帮助中心没有给出「Gemini 应用直接导出 .pptx」的步骤，所以别指望一句话得到可直接演讲的文件；排版和配图仍要在幻灯片软件里完成。Gemini 的基本用法见 [/guides/gemini-how-to-use-getting-started](/guides/gemini-how-to-use-getting-started)；Canvas 生成文档和网页的用法见 [/guides/gemini-canvas-docs-apps-web-pages](/guides/gemini-canvas-docs-apps-web-pages)。

## 三、已有 PowerPoint 怎么办

官方 Slides 页的说明：

- 可以导入 Microsoft PowerPoint 或 Canva 演示文稿，使用 Slides 的评论、待办事项和细粒度分享功能；
- 官方 FAQ：可以把 PowerPoint 转换成 Google 幻灯片格式，也可以直接编辑 PowerPoint 文件，不必先复制，原文件保持不变。

也就是说，可以先把 PowerPoint 导入 Slides，再用 Ask Gemini 总结、补充幻灯片或配图。

## 常见问题

**Q：Gemini 做出来的 PPT 能直接下载吗？**
官方页面没有写这一步，请在 Google 幻灯片的文件菜单里查看下载格式；本文不引用官方没写的说明。

**Q：免费账号能用 Gemini in Slides 吗？**
官方页面没有按免费或付费账号逐项说明。Slides 页只写了试用 Gemini for Google Workspace，并注明部分功能仅限部分 Workspace 商业版和企业版；Google AI 套餐对比见 [/guides/gemini-plans-free-plus-pro-ultra](/guides/gemini-plans-free-plus-pro-ultra)。

**Q：AI 生成的图片需要注意什么？**
Gemini 生成的图片带有 SynthID 水印，见 [/guides/gemini-image-watermark-synthid](/guides/gemini-image-watermark-synthid)。

**Q：除了 Gemini，还有别的 AI 做 PPT 方式吗？**
ChatGPT、Claude 也能写提纲和文案，选择见 [/guides/chatgpt-vs-gemini-which-to-choose](/guides/chatgpt-vs-gemini-which-to-choose)；需要 ChatGPT 会员可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- Google Workspace：Google 幻灯片 — https://workspace.google.com/products/slides/
- Google Workspace：Generative AI for presentations — https://workspace.google.com/resources/presentation-ai/
- Gemini 官方：应用更新记录 — https://gemini.google/release-notes/
- Gemini 官方：订阅 — https://gemini.google/subscriptions/

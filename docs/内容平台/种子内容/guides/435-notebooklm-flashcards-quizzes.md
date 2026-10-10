---
title: NotebookLM 学习卡是什么：抽认卡（闪卡）与测验的生成、复习和下载
slug: notebooklm-flashcards-quizzes
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: NotebookLM（现名 Gemini Notebook）的学习卡是什么、怎么用？本文按官方帮助讲清抽认卡和测验的生成步骤、难度与数量设置、「答对了 / 没答对」进度记录、只练错题、下载 CSV，以及手机上怎么刷卡。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/notebooklm/answer/16958963?hl=en
  - https://support.google.com/notebooklm/answer/16958963?hl=zh-Hans
  - https://support.google.com/notebooklm/answer/16296687?hl=en
  - https://support.google.com/notebooklm/answer/16206563?hl=en
  - https://support.google.com/notebooklm/answer/17670842?hl=en
  - https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
  - https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-app-quizzes-flashcards/
  - https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html
verify:
  - 「学习卡」「闪卡」是搜索里常见的叫法，官方简体中文帮助写的是「抽认卡」，繁体界面的译名可能不同，以界面为准
  - 新题型（简答、多选、填空）、在对话里问自己的测验表现、手动添加或编辑题目：2026 年 9 月官方博客写的是「即将 / 很快」推出，帮助中心在核对日还没有对应步骤
  - 测验能否下载：帮助中心只写了抽认卡可下载为 CSV，没有提到测验的下载
  - 「数量（较少 / 标准 / 较多）」在帮助中心写在「生成后的学习」一节，实际是在生成前还是生成后选择，以界面为准
  - 每天可生成几组：个人账号按算力限额计算，官方未列个数
---

> 本文根据 Google 官方 Gemini Notebook（原 NotebookLM）帮助中心、Google 官方博客和 Google Workspace Updates 整理，核对日期 2026-10-10。卡片和题目由 AI 根据你的来源生成，可能有错，重要考试请对照原始资料。

## 适用于谁

- 搜「notebooklm 学习卡是什么」「notebooklm 闪卡」，想用它背知识点的学生和备考的人；
- 想用自己的讲义、课本章节自动出题自测的人；
- 想把卡片导出来，或者在手机上碎片时间刷卡的人。

## 结论先说

1. **学习卡就是官方说的「抽认卡（Flashcards）」**：正面是问题或术语，翻面是答案；「测验（Quiz）」则是逐题作答、最后给出结果的自测题。两者都在 Studio 面板里生成，依据的是你放进笔记本的来源。
2. **可以定制**：难度分简单、中等、困难，数量分较少、标准、较多，还能写提示指定范围和风格。
3. **会记进度**：抽认卡可以标「答对了」或「没答对」，中途离开再回来能接着练；结束后可以「只练答错的卡片」。
4. **抽认卡能下载为 CSV 文件**。
5. **手机 App 也能用**，适合零碎时间复习。

## 一、怎么生成

1. 打开已有笔记本，或新建并上传来源（讲义、课本章节、笔记照片等）；
2. 确认你有笔记本的**编辑权限**（生成和删除都需要）；
3. 在 Studio 面板点「抽认卡（Flashcards）」或「测验（Quiz）」直接生成；想先设置，点旁边的铅笔图标；
4. 生成在后台进行，可以继续在笔记本里做别的。

自定义面板里的选项：

| 选项 | 可选值 |
| --- | --- |
| 难度 | 简单（easy）、中等（medium）、困难（hard） |
| 数量 | 较少（fewer）、标准（standard）、较多（more） |
| 提示 | 用文字描述你要的卡片或题目：可以给一个大纲，或指定对象、风格和重点 |

提示可以这样写：

```
只根据第 3 章「细胞呼吸」出题，重点考概念之间的区别和反应发生的位置。
面向高一学生，题干用简体中文，术语第一次出现时附英文。
```

想只针对一部分资料出题，先在来源面板里只勾选那几份来源再生成。

## 二、用抽认卡复习

- **翻卡**：看问题，想好答案，再翻面核对；
- **标记**：每张卡可以标「答对了！（Got it!，对勾）」或「没答对！（Missed it!，叉号）」；
- **解释**：点「解释（Explain）」按钮，查看这张卡或答案的讲解；
- **进度会保存**：官方说明它会记住你的进度，离开后回来可以从上次的位置继续；
- **结束后**：会看到本轮结果，可以选择复习或重来。再练一轮时有三个选项——「相同卡片」「所有卡片」「仅答错的卡片」，最后一项用来集中攻克薄弱点。

抽认卡查看器上的控制按钮：

| 按钮 | 作用 |
| --- | --- |
| 上一张 / 下一张 | 切换卡片 |
| 全屏 | 放大查看器 |
| 随机显示（Shuffle） | 打乱顺序 |
| 删除卡片 | 把这张卡从卡组里移除 |
| 重新开始 | 从头再来 |
| 下载 | 把抽认卡下载为 **CSV 文件** |

CSV 是通用的表格文本格式，可以用 Excel、Google 表格打开。注意：来源里有 Play 图书电子书时，受出版方限制，可能无法下载。

## 三、用测验自测

![2026 年 9 月官方博客视频封面：测验查看器里的一道多选题，可勾选多个选项，右上角是收起和关闭按钮](seed:g435-quiz-multiple-select.jpg)
*图片来源：[Google 官方博客《Sharpen your study routine with new Gemini Notebook tools》](https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/)（视频封面帧）*

测验查看器的控制按钮（帮助中心）：

- **全屏**：放大测验查看器；
- **提示（Hint）**：卡住时给一点思考方向；
- **上一个 / 下一个**：在题目之间切换；
- 答完后同样可以点「解释」查看讲解，结束时会看到结果，可以复习或重做。

Google 官方博客（2026-09-15）还预告了几项更新：测验会增加**简答、多选、填空**等题型；做完测验和抽认卡后，可以在对话里问它自己的表现，让它帮你判断下一步该重点复习什么；也可以自己添加或修改题目。这些在博客里的说法是「即将推出」，你的账号里不一定已经出现。

## 四、在手机 App 上刷卡

官方 App（Android / iOS）支持抽认卡和测验：

- 在 Studio 面板生成或打开；点铅笔图标可以选语言、数量、难度，勾选来源，写提示；
- **点一下卡片翻面**看答案；可以打乱顺序、删除卡片；
- 同样可以标「答对了 / 没答对」，刷完后查看结果，重刷整组或只刷答错的。

按 Workspace Updates（2026-03-20）的说明，进度保存、标记答对 / 没答对、打乱、结果页重练错题、删除某张卡或某道题，这些改进在网页和手机上都可用，并面向所有用户。

## 五、和其他学习功能怎么搭配

- **先看全貌，再背细节**：先用思维导图或「学习指南」报告理清结构，再生成抽认卡；
- **对话里的学习风格**：在对话的「配置对话（Configure Chat）」里选「学习指南（Learning Guide）」风格，官方说它适合教学内容，帮助你更高效地掌握新概念；
- **互动式报告**：新的「学习概览（Learning Overview）」可以把摘要和测验、抽认卡、信息图编排在一起，见本站《NotebookLM 思维导图和报告怎么用》；
- **查看当时的提示**：Studio 面板里该成品的三点菜单选「查看自定义提示」，查看器标题旁也有「显示提示（Show prompt）」。

## 常见问题

**Q：卡片是英文的，怎么换成中文？**
在自定义面板或提示里指定语言后重新生成；也可以在网页版「设置 → 输出语言」里把默认输出语言改成中文。

**Q：卡片内容有错怎么办？**
先点「解释」并对照来源核实；确认有误的卡可以删除。也可以缩小来源范围、把提示写具体后重新生成。

**Q：能导入到其他背卡软件吗？**
官方只说明抽认卡可以下载为 CSV 文件；能否导入某个第三方软件取决于那个软件是否支持 CSV，官方帮助没有涉及。

**Q：只有查看权限能用吗？**
生成和删除需要编辑权限。按官方对分享的说明，查看者可以查看所有者或编辑者已经生成的内容，但不能自己生成新的。

**Q：一天能生成几组？**
个人账号现在按算力计算用量，每 5 小时刷新，直到用完每周上限，官方不再列每天的组数；详见本站《NotebookLM 免费版限制有哪些》。

## 参考资料

- Generate Flashcards or Quizzes in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16958963?hl=en
- 在 Gemini Notebook 中生成抽认卡或测验（帮助中心简体中文版，用于核对官方译名）：https://support.google.com/notebooklm/answer/16958963?hl=zh-Hans
- Get started with the Gemini Notebook mobile app（帮助中心）：https://support.google.com/notebooklm/answer/16296687?hl=en
- Create a notebook in Gemini Notebook（帮助中心）：https://support.google.com/notebooklm/answer/16206563?hl=en
- Manage your Gemini Notebook usage limits（帮助中心）：https://support.google.com/notebooklm/answer/17670842?hl=en
- Google 官方博客：Sharpen your study routine with new Gemini Notebook tools（2026-09-15）：https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
- Google 官方博客：Create flashcards and quizzes in the NotebookLM app（2025-11-06）：https://blog.google/innovation-and-ai/models-and-research/google-labs/notebooklm-app-quizzes-flashcards/
- Google Workspace Updates：New ways to customize and interact with your content in NotebookLM（2026-03-20）：https://workspaceupdates.googleblog.com/2026/03/new-ways-to-customize-and-interact-with-your-content-in-NotebookLM.html

---
title: Gemini 引导式学习是什么、怎么用：配合测验、学习卡、模拟考试和学习指南复习
slug: gemini-guided-learning-quiz-flashcards
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini 的引导式学习（Guided Learning）像一位家教：不直接给答案，而是一步步带你弄懂。本文按官方帮助中心讲它的入口和用法，以及怎么用一句话生成互动测验、学习卡、模拟考试和学习指南，测验里的提示与追问、分享方法，以及哪些学习功能有地区和年龄限制。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16448384
  - https://support.google.com/gemini/answer/16275879
  - https://support.google.com/gemini/answer/16047321
  - https://support.google.com/gemini/answer/16972047
  - https://support.google.com/gemini/answer/16047373
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/18560919
verify:
  - 引导式学习入口：帮助中心写「添加文件 → 更多工具（More tools）→ Guided Learning」，界面调整较频繁，以实际为准
  - 模拟考试目前官方列出的支持项目只有 SAT、JEE Main、NEET UG
  - 帮助中心没有说明引导式学习的具体教学策略，只描述为「把 Gemini 当家教使用」
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。官方注明这些学习功能在手机 App 上是逐步推出的，App 里找不到时可以先用网页版 gemini.google.com。

## 适用于谁

- 搜「gemini 引导式学习」「gemini 引导式学习是什么」「gemini 测验功能」「gemini 互动式测验」「gemini 制作测验」的人；
- 学生、备考者，想让 Gemini 带着学而不是直接给答案的人；
- 老师和家长，想快速把一份资料变成练习题的人。

## 结论先说

1. **引导式学习（Guided Learning）是 Gemini 的家教模式**，入口在输入框「添加文件 → 更多工具 → Guided Learning」，选中后再提问。
2. **四种学习材料一句话生成**：测验（Quiz）、学习卡（Flashcards）、模拟考试（Practice test）、学习指南（Study guide），成品在右侧 Canvas 面板里打开，可以直接作答。
3. **可以用自己的资料出题**：上传课件、笔记、PDF，或贴一个 YouTube 视频链接。
4. **免费可用**：帮助中心的功能表里「测验与学习卡」对所有档位都标了可用；只需要登录。
5. **有限制的部分**：模拟考试只支持少数几种考试；OpenStax 教材资源仅限美国、英语、成年个人账号。

## 一、引导式学习怎么开

1. 打开 gemini.google.com 并登录；
2. 在输入框点「添加文件（Add Files）」；
3. 在底部点「更多工具（More tools）」→「引导式学习（Guided Learning）」；
4. 输入你想学的主题或问题；
5. （可选）再点「添加文件 → 上传文件」，带上教材、题目照片或笔记；
6. 提交。

提问的写法建议（本站建议，非官方原文）：把**目标、现有水平、卡在哪里**说清楚，效果比只丢一个题目好。例如：

```
我是高二学生，正在学导数。我会求多项式的导数，但不理解链式法则为什么成立。
请一步一步引导我，每次只问我一个问题，等我回答后再继续。
```

注意：技能（Skills）目前不能和引导式学习一起使用。

## 二、用图片和视频辅助理解

- **图片**：Gemini 可能在回答里配图来解释概念；也可以直接要求「画一张示意图 / 给我一张图解」；
- **视频**：Gemini 可能附上相关的 YouTube 视频；你也可以要求它提供视频，或贴一个 YouTube 链接，让它根据视频内容讲解或生成学习材料。**前提是活动记录开启**——帮助中心写明，只有开启时回答里才会包含 YouTube 视频。

官方示例问题：「什么是光合作用？」「细胞由哪些部分组成？」「消化系统是什么？」

## 三、生成测验、学习卡、模拟考试和学习指南

在普通对话里直接说要什么。官方建议的句式是**先说要生成什么，再说材料或主题**：

| 类型 | 句式 | 说明 |
| --- | --- | --- |
| 测验 | 「出一套关于……的测验」 | 互动答题，带提示和解析 |
| 学习卡 | 「做一套关于……的学习卡」 | 正反面翻卡，可洗牌、可朗读 |
| 学习指南 | 「写一份关于……的学习指南」 | 想要文档形式，先选「添加文件 → Canvas」 |
| 模拟考试 | 「生成一套完整的 [考试名称] 模拟题」 | 目前支持 SAT、JEE Main、NEET UG |

**用自己的资料**：点「添加文件」上传讲义、笔记或课本章节作为出题范围。上传限制见本站《Gemini 使用技巧：Gems 改为 Skills、Deep Research 与上传文件怎么用》。

**从 Canvas 文档生成**：已经在 Canvas 里有一份文档或 Deep Research 报告时，点面板右上角「创建（Create）→ 测验（Quiz）」。

生成的材料会在右侧 Canvas 面板打开。

## 四、测验怎么做

开始作答后可以：

- **要提示**：点「提示（Hint）」；
- **追问**：在左侧输入框里就当前题目或知识点继续提问；
- **前后翻题**：「下一题（Next）」「上一题（Back）」；
- **加练**：全部做完后点「更多题目（More questions）」；
- **看总结**：做完后稍等片刻，Gemini 会给出你的强项和需要重点复习的地方。

**模拟考试**另外有：可以选做整套或某几个部分；可能带倒计时；交卷后有总结页，显示答对、答错、跳过的题目和各部分得分。

## 五、学习卡怎么用

打开学习卡后：

- 「提示（Hint）」：给一点线索；
- 「随机模式（Shuffle mode）」：打乱整套卡片的顺序；
- 「朗读（Text to speech）」：把问题和答案读出来；
- 「下一张（Next）」：翻到答案或下一张；
- 全部看完后点「重新开始（Restart flashcards）」再来一轮。

## 六、分享和归档

**分享**（工作 / 学校账号不能分享这些学习材料）：

1. 打开含有该材料的对话，点开测验 / 学习卡 / 学习指南，让它显示在 Canvas 面板里；
2. 点顶部「分享（Share）」；
3. 复制 g.co/gemini/share 链接，或发到列出的社交平台。

这同样是公开链接，规则见本站《Gemini 分享对话怎么操作》。

**放进学习笔记本**：如果你建了学习笔记本，可以在侧边栏的最近对话里，把鼠标移到那条对话上，点「更多 → 添加到笔记本」，把测验和学习卡归到对应的科目下。学习笔记本还会根据诊断测验自动安排个性化课程，见本站《Gemini 笔记本怎么用》。

**做成音频**：上传文档或幻灯片后，让 Gemini「生成音频概览」，得到一段播客式的讲解，通常需要 3～5 分钟，可以下载。暂不对 18 岁以下用户开放。

## 七、有额外限制的功能

| 功能 | 限制 |
| --- | --- |
| OpenStax 教材资源（在提问里输入 `@OpenStax`） | 目前仅美国、仅英语；不对 18 岁以下用户和工作 / 学校账号开放 |
| 在 Chrome 中的 Gemini 里出测验 | 目前仅印度和美国、仅英语 |
| 模拟考试 | 支持的考试：SAT、JEE Main、NEET UG |
| 从 Canvas 文档生成测验等 | 暂不对 18 岁以下用户开放 |
| 回答里附 YouTube 视频 | 需要开启活动记录 |

## 常见问题

**Q：引导式学习和直接提问有什么区别？**
帮助中心把它描述为「把 Gemini 当家教」，配合图示和教育资源来学习。直接提问得到的是答案；引导式学习更适合你想真正弄懂、而不只是要结果的时候。

**Q：能用中文吗？**
帮助中心只对 OpenStax 和 Chrome 里的测验标注了「仅英语」，引导式学习、测验、学习卡没有标注语言限制。用中文提问、上传中文资料即可。

**Q：生成的题目和答案可靠吗？**
Gemini 可能出错。重要考试的复习，建议让它基于你上传的教材出题，并对照教材核对答案和解析。

**Q：和 ChatGPT 的学习模式、Gemini Notebook 的学习卡有什么不同？**
定位相近，入口和形态不同，可对照本站《ChatGPT 学习模式怎么用：开启方法、找不到怎么办，配合闪卡和测验复习》和《NotebookLM 学习卡是什么：抽认卡（闪卡）与测验的生成、复习和下载》。

## 参考资料

- Use learning tools in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/16448384
- Create quizzes, flashcards, practice tests & more in Gemini Apps：https://support.google.com/gemini/answer/16275879
- Create docs, apps & more with Canvas：https://support.google.com/gemini/answer/16047321
- Organize your projects with notebooks in Gemini Apps（学习笔记本）：https://support.google.com/gemini/answer/16972047
- Generate Audio Overviews in Gemini Apps：https://support.google.com/gemini/answer/16047373
- Gemini Apps limits & upgrades for Google AI subscribers（功能对比表）：https://support.google.com/gemini/answer/16275805
- About the transition from Gems to skills（技能暂不支持的功能）：https://support.google.com/gemini/answer/18560919

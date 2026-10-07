---
title: "英语阅读材料提示词：按 CEFR 等级生成报纸排版的英文文章（gpt-image-2）"
slug: english-reading-newspaper-layout
model: gpt-image-2
topics: [poster]
aspectRatio: "3:4"
needsRefImage: false
useCase: "输入主题、英语等级和字数，生成一页黑白报纸 / 文学杂志排版的英文文章，自带标题、引言、三栏正文和配图，适合做英语精读材料和打印讲义。"
prompt: |
  主题：[文化评论]／英语等级：[B2]／字数：[400]
  生成一页高端黑白编辑风格的英文文章版面，像高级文学杂志、文化期刊或报纸专题页。
  文章语言必须是英语，并严格符合第一行指定的 CEFR 等级（A1～C2）；围绕指定主题写作，字数控制在目标字数 ±10% 以内。各等级难度：
  - A1：最基础的高频词和简单短句；
  - A2：常见生活词汇、简单连接词和基本复合句；
  - B1：更丰富的日常与抽象词汇，包含原因、例子和观点；
  - B2：成熟的论述表达，词汇丰富，句式复杂、逻辑分层；
  - C1：高级、准确、自然的英语，有文学性；
  - C2：接近母语的文化评论或文学社论水准，修辞细腻、概念抽象。
  版面要求：顶部是干净的报头（如"THE LITERARY REVIEW"），超大的高对比衬线体主标题，一行副标题和作者署名，三栏编辑网格正文；左侧一段醒目的粗斜体引言；中间一张大幅黑白纪实照片，配图注。
  整体克制、理性、有学术感，使用米白新闻纸质感，带轻微油墨晕染和颗粒。只允许黑、深灰和奶油白三种颜色。底部放一个信息框，里面是一句大号斜体的号召语。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/knowledgefxg/status/2096249812194869289
  author: "知识分享官"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文说明整理为中文提示词；主题、等级、字数改为变量；精简各等级的难度说明"
images:
  - 3013-english-reading-newspaper-layout-1.jpg
  - 3013-english-reading-newspaper-layout-2.jpg
imageCredit:
  by: "知识分享官"
  url: https://youmind.com/gpt-image-2-prompts?id=33584
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[文化评论] 换成你想读的话题，如"如何用 AI 学英语""慢阅读的意义"；[B2] 按学生水平选 A1～C2；[400] 是目标字数，版面一页放 300～500 词最合适，太多会让字号变小、错字增多。

示例图是两张版面：一张"More Than Survival"讲寻找人生意义，左侧粗斜体引言、中间黑白剪影照片、三栏正文；另一张"A Smarter Way to Learn English"讲用 AI 学英语，配一张女生对着笔记本电脑学习的照片，底部都有一行斜体口号。

**常见问题**：
- 正文有拼写错误或语法问题：图片里的长文本难免出错，适合当"有设计感的阅读材料"；要严格准确，建议先用文本模型写好文章，再把全文贴进提示词让它排版。
- 难度不对：在提示词里补一句"只用 CEFR B2 词汇表内的单词"。
- 字太小：减少字数或改成 2 栏。

**适合**：英语精读材料、打印讲义、英语学习账号配图、读书会分享。

### 原版提示词

```text
Subject: {argument name="subject" default="Cultural Commentary"} / English Level: {argument name="English level" default="B2"} / Word Count: {argument name="word count" default="400"}

Generate a high-end black-and-white editorial-style English article layout that resembles a premium literary magazine, cultural journal, or newspaper feature page.

The article language must be English, and writing must strictly follow the CEFR English level specified in the first line. The English level can be A1, A2, B1, B2, C1, or C2; "Subject" is the article topic; "Word Count" is the target number of English words.

English difficulty requirements:
- A1: Very basic, high-frequency vocabulary and simple short sentences.
- A2: Common life vocabulary, simple connectives, and basic compound sentences.
- B1: Richer daily and abstract vocabulary, including reasons, examples, and opinions.
- B2: Mature argumentative expression, rich vocabulary, and complex sentence structures with logical layers.
- C1: Advanced, accurate, and natural English with literary quality.
- C2: Near-native cultural commentary or literary editorial level with nuanced rhetoric and abstract concepts.

The article must center on the specified subject and stay within ±10% of the word count. The layout should include a clean masthead at the top (e.g., "THE LITERARY REVIEW"), a large elegant high-contrast serif font for the main headline, an author byline, and a three-column editorial grid. Include a prominent bold italic pull-quote on the left and a large black-and-white documentary photograph in the center with a caption. The overall aesthetic should be restrained, rational, and scholarly, using off-white newsprint textures with slight ink bleed and grain. Only black, dark gray, and cream-white colors are allowed. The bottom should feature an information box with a large italic call to action.
```

> 改编自 [知识分享官](https://x.com/knowledgefxg/status/2096249812194869289) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

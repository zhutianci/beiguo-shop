---
title: "英语单词卡片提示词：词典页风格的单词学习卡（音标 + 例句 + 搭配）（gpt-image-2）"
slug: english-vocabulary-flashcard
model: gpt-image-2
topics: [infographic]
aspectRatio: "4:5"
needsRefImage: false
useCase: "输入一个英语单词，生成一张排版像学习词典的竖版单词卡：大号词头、音标、词性、中文释义、英文定义、双语例句、常用搭配、语法和相关词，配一幅扁平插画，适合背单词打卡和课堂教学。"
prompt: |
  生成一张精美的 4:5 竖版英语单词学习卡，面向 A2–B1 水平的学习者。
  卡片类型：综合单词卡。风格：[活泼的杂志风扁平插画]。
  配色"阳光教室"：主色钴蓝 #2563EB，辅色珊瑚红 #FF6B5C、柠檬黄 #FFD84D、天蓝 #7DD3FC，深色文字 #17324D，暖奶油色背景 #FFF9E8。
  准确显示以下文字：
  [library]
  /ˈlaɪ.brər.i/
  noun
  图书馆
  A place where people can read or borrow books and other materials.
  例句：We borrowed two books from the library. ／ 我们从图书馆借了两本书。
  COMMON COLLOCATIONS：go to the library · borrow from the library · public library · library card
  GRAMMAR：a countable noun · plural: libraries
  RELATED WORDS：librarian · shelf · catalogue
  插画：一幅温暖、现代的图书馆扁平矢量剖面图，一位学习者从图书管理员手里借两本书，自然地画出书架和借书卡。人物友好但偏杂志插画风，不要太幼稚。
  版式像正式出版的学习词典页：醒目的词头、紧凑的音标行、清楚的释义、高亮的例句框，以及分组整齐的三个学习模块卡片（搭配 / 语法 / 相关词），留白充足。
  使用纯平涂色和干净线稿；不要渐变、阴影、3D、光泽、照片感、杂乱元素、Logo 或水印。正文文字保持深色、清晰可读。准确还原给出的英文、音标和简体中文，不要添加额外文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2083426163700158580
  author: "Mr.pinecone"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中英混排说明整理为中文提示词；单词、主题风格、配色改为变量；修正原文中重复的例句，补充\"换单词时要同步改写的字段\""
images:
  - 3008-english-vocabulary-flashcard-1.jpg
imageCredit:
  by: "Mr.pinecone"
  url: https://youmind.com/gpt-image-2-prompts?id=30478
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：换单词时，[library] 下面的音标、词性、中文、英文定义、例句、搭配、语法和相关词**都要一起改成新单词的内容**，插画描述也要换成能表现这个词的场景（如 "umbrella：一个人在雨中撑伞"）。建议先让 ChatGPT 生成这些字段，再粘进来。风格可以换成"手绘水彩""极简线条"。

示例图是暖奶油底的卡片：左上钴蓝色大字"library"、浅蓝框音标、红色 noun 和中文"图书馆"，右侧是学生在借书台借书的扁平插画，中间一条蓝框双语例句，底部黄、蓝、红三个模块卡片，文字全部正确。

**常见问题**：
- 音标符号出错：音标是最容易错的部分，出图后务必核对，错了就单独重画音标行。
- 文字太多挤压插画：把搭配减到 3 条，相关词减到 2 个。
- 做成一套：固定配色和版式，只替换单词与插画场景，风格会比较统一。

**适合**：背单词打卡、英语老师课件与教具、小红书学习笔记、儿童英语闪卡。

### 原版提示词

```text
Create an exquisite 4:5 vertical English vocabulary study card for A2–B1 level learners.

Card Type: Comprehensive Vocabulary Card
Theme: {argument name="card theme" default="vibrant editorial illustration"}
Palette: Sunshine Classroom
Colors: {argument name="color scheme" default="Primary Cobalt Blue #2563EB, Secondary Coral Red #FF6B5C, Secondary Lemon Yellow #FFD84D, Secondary Sky Blue #7DD3FC, Dark Text #17324D, Warm Cream Background #FFF9E8"}.

Accurately display the following text:

{argument name="word" default="library"}
/ˈlaɪ.brər.i/
noun

图书馆

Places where people can read or borrow books and other materials.

We borrowed two books from the library.
We borrowed two books from the library.

COMMON COLLOCATIONS
Go to the library (go to the library)
Borrow from the library (borrow from the library)
Public library (public library)
Library card (library card)

GRAMMAR
Countable noun (a countable noun)
Plural form: libraries (plural: libraries)

RELATED WORDS
Librarian (librarian) · Shelf (shelf) · Catalogue (catalogue)

Create a warm, modern library flat vector cross-section illustration. Show a learner borrowing two books from a librarian, naturally including bookshelves and a library card. Keep character figures friendly but editorial rather than childish.

Arrange information like a professionally published learner's dictionary page: prominent headword, compact pronunciation line, clear definitions, highlighted example sentences, and neatly grouped learning modules. Use generous white space.

Use pure flat colors and clean line art. No gradients, shadows, 3D, gloss effects, photorealism, visual clutter, logos, or watermarks. Keep all body text dark and legible. Accurately replicate provided English, IPA, and Simplified Chinese without adding extra text.
```

> 改编自 [Mr.pinecone](https://x.com/Mrpinecone888/status/2083426163700158580) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

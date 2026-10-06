---
title: AI漫画提示词：一页漫画讲清一个概念（古风漫画科普信息图）
slug: manga-explainer-page
model: gpt-image-2
topics: [comic, infographic]
aspectRatio: "9:16"
needsRefImage: false
useCase: 想把一个抽象概念（提示词、复利、费曼学习法……）讲得好看又好记时，生成一张竖版漫画科普页：上半部分是有故事感的漫画场景，中间是"拆解公式"图解，底部是一句金句结论，适合公众号长图、课程封面和知识分享。
prompt: |
  一张竖版、细节丰富的漫画风科普信息图，羊皮纸质感背景，分为上、中、下三段：
  上段（漫画场景）：一幅大的[古风水墨漫画]插画——[银白长发、狐耳的仙女站在夕阳山巅]；画面下方一位[长发老画师]盘腿而坐、手持毛笔若有所思，旁边[年轻弟子]正跪坐着把仙女画到纸上。场景四周用小块文字讲解"[提示词]"这个概念的由来；左侧放 4 个小方格头像，展示"同一句话被不同人理解成不同样子"；右侧用大号竖排标题写"[提示词入门]"。
  中段（拆解图解）：一条横向流程图，标题"[把特征说清楚，画面才拼得出来]"；6 个小方格依次是[长银发、蓝眼睛、白衣]、[夕阳山间、回眸姿势、柔和逆光]，用加号连接，最后一个等号指向完整成图（就是上段的仙女）。
  下段（结论）：红黑墨迹风格的大标题"[百语堆砌，失其一画]"；四周散落撕碎的纸条，手写着堆砌词的反面例子，如[8K、超高画质、复杂构图、电影光效]；最底部一个方框写一句总结："[词语是工具，太多反而遮住了那一笔]"。
  全部文字使用[简体中文]，字迹清晰；整体像一页精心设计的漫画教科书。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/N7S6P1/status/2103857155845783883
  author: レティシア・ノエル（@N7S6P1）
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；画风、人物、讲解的概念、标题、流程图 6 个要素、结论金句和文字语言改为变量；原文描述的日文文字改为中文；删去个别重复描述
images:
  - 508-manga-explainer-page-1.jpg
imageCredit:
  by: レティシア・ノエル（@N7S6P1）
  url: https://youmind.com/gpt-image-2-prompts?id=35529
  license: CC BY 4.0
verify:
  - 中文竖排标题和小字的错字率；文字多时是否乱码
  - 换一个概念（如"复利""费曼学习法"）时，三段结构是否保持
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么改成你的主题**：这条的骨架是"漫画场景引入 → 加号等号拆解 → 一句金句收尾"。把 [提示词] 换成要讲的概念，上段的故事换成能比喻它的场景（讲"复利"可以画"老农种树，一棵变成一片林"），中段 6 个方格换成构成要素，下段写反面做法和结论。画风也能改成[日系少年漫画]或[美式漫画]。

**常见问题**：
- 字太多变成乱码：上段讲解文字改为 2 小段，左侧 4 个头像可删掉。
- 中段方格数量不对：数量写死"6 个"，并把 6 个要素逐个列出。
- 结论和画面无关：结论用一句 10–15 字的短句最稳。

**适合**：知识博主长图、课程封面、团队内训材料。示例图为原作者生成的日文版本，仅供参考。

### 英文原版

```text
A vertical, highly detailed manga-style infographic page with a parchment-like background. The layout is divided into three main sections: a top illustration area, a middle diagrammatic breakdown, and a bottom text-heavy conclusion.

Top Section:
- A large, ethereal illustration of a woman with long white hair and fox ears (a kitsune) standing on a mountain peak at sunset. She wears flowing white robes.
- Below her, an elderly man with long black hair tied back, wearing dark blue traditional Chinese robes, sits cross-legged holding a calligraphy brush, looking up thoughtfully.
- To his right, a younger man in grey robes kneels, sketching the kitsune onto paper.
- Surrounding this scene are blocks of Japanese text explaining the concept of 'Prompt' (プロンプト). 
- On the left side, there are four small square character portraits labeled with descriptions like 'Beautiful Woman', 'Dancer', etc., showing variations of female characters.
- Large vertical Japanese text on the right reads 'Introduction to Prompts'.

Middle Section:
- A horizontal flow diagram titled 'Verbalizing features to compose a picture'.
- It shows a sequence of six small square images connected by plus signs (+), leading to an equals sign (=) and a final result image.
- The sequence includes: 1. Long silver hair, 2. Blue eyes, 3. White clothes, 4. Mountain sunset, 5. Looking back pose, 6. Soft backlighting.
- The final result is the complete image of the kitsune from the top section.

Bottom Section:
- A large, bold Japanese headline in red and black ink style: "Listing hundreds of words loses one stroke" (百語を並べて一画を失う).
- Surrounding the headline are torn pieces of paper with handwritten notes listing negative effects of over-prompting, such as '8K resolution', 'ultra-high quality', 'complex composition', 'unnatural lighting', 'film-like lighting', 'large scale', 'highest quality'.
- At the very bottom, a concluding sentence in a box states that words are tools, but too many obscure the essence of the single stroke.
```

> 改编自 [レティシア・ノエル](https://x.com/N7S6P1/status/2103857155845783883) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

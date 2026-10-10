---
title: "海报提示词：巨型汉字排成阶梯的字体海报，字缝里坐着沉思者（gpt-image-2）"
slug: chinese-slab-type-staircase-thinker-poster
model: gpt-image-2
topics: [logo, poster]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给读书会、讲座、展览或观点类文章做一张有分量的横版主视觉：五个巨大的方块汉字像混凝土台阶一样由低到高排开，字的缝隙里嵌一个人物剪影，深色做旧纸张质感。"
prompt: |
  一张 16:9 横版的哲学主题字体海报，粗黑大字报式的中文排版：巨大的汉字本身排成逐级升高的阶梯，并把一个人物剪影嵌进字里。
  - 底与色：深藏青近黑的旧纸背景，带细微划痕、颗粒、褪色的折痕和印刷磨损；所有主体文字用米白色油墨，边缘略微斑驳，像丝网印刷；
  - 主标题：恰好 5 个巨型方块汉字[我思故我在]，几乎占满画面；字形是定制的几何粗黑体，极重、棱角分明、像建筑构件，笔画间有矩形的镂空；从左到右一级一级升高——第一个字矮而宽，第二个略高，中间继续升高，最后一个字顶到画面右上方，整体像一段混凝土台阶；
  - 剪影：在第三和第四个字之间的空隙里放恰好 1 个[托腮沉思的坐姿人物]剪影，位置在画面中间偏右下；剪影与背景同色，像从白色大字里挖出来的；
  - 左上角：两行很小的中文引言，示例为"思考不是逃离世界的方式，而是我们得以存在的理由。"，可换成你自己核对过的句子；
  - 底部一排小字：左下是拉丁文副题[COGITO ERGO SUM]，旁边是加宽字距的主标题小字，再往右依次是"PHILOSOPHY EXHIBITION"和两句英文短语，右下是罗马数字[MMXXIV]和一个极简的圆形符号；小字统一用窄体无衬线、宽字距、细笔画，基线对齐；
  - 风格：极简的粗野主义平面设计，东方大字报的冲击力，大面积深色留白，只用米白和藏青两种颜色；
  - 不要照片、渐变、多余插图和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2074862006767923402
  author: "@xiaoxiaodong01"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主标题、剪影人物、拉丁文副题、罗马数字年份设为变量；左上角引言改为示例文字并注明可替换（原文与示例图里署名笛卡尔的那句话查不到出处，不保留署名）；删去底部的\"版权所有\"小字和人名小字；精简重复的风格描述"
images:
  - 3589-chinese-slab-type-staircase-thinker-poster-1.jpg
imageCredit:
  by: "@xiaoxiaodong01"
  url: https://youmind.com/gpt-image-2-prompts?id=28033
  license: CC BY 4.0
verify:
  - "示例图左上角的小字引言署名\"笛卡尔\"，并非可查证的原话；示例图底部有一行\"ALL RIGHTS RESERVED\"装饰小字（海报自身的排版元素，不是第三方水印），请站长确认是否介意"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[我思故我在] 换成你的标题，笔画少、结构方正的字效果最好；不是五个字时，把"恰好 5 个"改成实际字数，并相应调整"第一个字、第二个字"那段阶梯描述；[托腮沉思的坐姿人物] 换成与主题呼应的剪影，如"低头看书的人""仰望的孩子"；[COGITO ERGO SUM] 换成英文或拉丁文副题；[MMXXIV] 是罗马数字年份。左上角引言请换成有出处的句子，不要给名人安上没说过的话。

示例图是深藏青底的横幅：米白色的"我思故我在"五个大字由左向右越来越高，"故"和"我"之间坐着一个托腮的深色人物剪影；左上角两行小字引言，底部一排是拉丁文标题、加宽字距的中文和几组英文小字，右下角有罗马数字和圆形符号。小字清楚、没有乱码，但引言的署名并不可靠。

**常见问题**：
- 大字笔画缺失或写成别的字：换笔画更少的字，或加"每个字必须是正确、可辨认的规范汉字"。
- 阶梯感不明显：加"五个字的顶边依次抬高，底边对齐在同一条线上"。
- 小字出现乱码：把底部小字减到两组，或全部改成英文。

**适合**：讲座与读书会海报、展览主视觉、观点类文章头图。

### 英文原版

```text
Goal: Create a widescreen philosophical typography poster in a bold Chinese big-character-poster style, where the typography itself forms an ascending staircase-like composition and integrates a human silhouette.

Canvas: 16:9 horizontal poster, dark navy-black textured paper background with subtle scratches, grain, faded fold lines, and vintage print wear. Use an off-white ink color for all main type, slightly distressed and roughened like screen-printed paper.

Main typography: Fill most of the canvas with exactly 5 enormous blocky Chinese characters reading {argument name="main phrase" default="我思故我在"}. The characters should be custom geometric slab forms, extremely heavy, angular, architectural, and arranged from left to right with a gradual rising step rhythm: the first character lower and wide, the second taller, the middle characters higher, and the final character towering at the far right. Make the characters look like massive concrete structures or stairs, with rectilinear cutouts and negative spaces. The layout should feel intelligent and intentional, not standard font rendering.

Figure integration: Place exactly 1 dark silhouette of a seated thinker inside the negative space between the third and fourth large characters, roughly lower center-right. The person sits hunched forward with one elbow on a knee and hand near the chin, evoking Rodin’s thinker pose. The silhouette should be the same dark color as the background, appearing carved out of the white typography.

Small text elements: Add exactly 9 small typographic text groups around the poster: 1 small Chinese quote in the upper left reading {argument name="quote text" default="思想不是被肯定明的方式，而是使我们得以存在的理由。——笛卡尔"}; 1 bottom-left English title reading “COGITO ERGO SUM”; 1 small bottom Chinese translation group reading “我 思 故 我 在” and “RENE DESCARTES”; 1 bottom label reading “PHILOSOPHY EXHIBITION”; 1 bottom label reading “EXISTENCE IS NOT GIVEN. IT IS REALIZED.”; 1 bottom label reading “THINK. QUESTION. THEREFORE. BE.”; 1 bottom-right roman code reading {argument name="roman code" default="MMXXIV"}; 1 bottom-right copyright line reading “© ALL RIGHTS RESERVED”; and 1 minimalist phi-like circular symbol at the far bottom right. Keep all small text in condensed uppercase sans serif with wide tracking, thin strokes, and careful baseline alignment.

Visual style: Minimalist brutalist graphic design, East Asian poster aesthetics, Bauhaus-inspired grid discipline, high contrast, cinematic negative space, off-white ink on deep blue-black, subtle paper texture, aged edges, no gradients except natural texture. The poster should feel like an art exhibition announcement about René Descartes and the phrase “I think, therefore I am.”

Constraints: Use exactly the 5 large Chinese characters and exactly 1 seated silhouette. Do not add extra figures, icons, illustrations, or decorative objects beyond the 9 small text groups. Preserve the stark poster composition, monumental typography, and ascending stair-step structure.
```

> 改编自 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01/status/2074862006767923402) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

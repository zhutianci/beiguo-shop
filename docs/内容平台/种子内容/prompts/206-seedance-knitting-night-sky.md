---
title: seedance 提示词：奶奶织的围巾变成星空（奇幻治愈短片）
slug: seedance-knitting-night-sky
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成一条 15 秒的温暖奇幻短片：老人在窗边织围巾，毛线里藏着星河，最后围巾飞出窗外化作夜空。适合节日祝福、品牌情感短片、绘本风开场。
prompt: |
  《织一片夜空》
  0–5 秒：夜里，一位银发老奶奶独自坐在敞开的窗边的木摇椅上，用两根木织针织毛线。一条长长的[深蓝色围巾]从她膝头垂落，铺到木地板上。暖黄色台灯光，柔和的阴影。中景。
  5–10 秒：镜头靠近她的双手和围巾，深色毛线里显现出细小发光的星星和缓缓旋转的星系，像是织进针脚里的。一颗星星挂在针尖上闪了一下，她的脸上露出安静的微笑。近景。
  10–15 秒：她收完最后一针，轻轻把围巾抛出窗外，围巾在屋顶上方向上展开，变成真正的夜空，星星一颗颗落到自己的位置。从屋外向上仰拍的远景：下方是温暖的窗光，上方是深蓝的星空。
  声音：毛线针轻轻碰撞的声音、摇椅的吱呀声、窗外的虫鸣，结尾加入一段轻柔的[八音盒]旋律。
negativePrompt: 多余的手指、多余的手、手部变形、手指粘连、超过两根织针、织针融化、毛线扭曲、出现第二位女性、重复的人物、小孩、现代家具、电视、手机、刺眼白光、霓虹色、卡通风格、动漫风格、塑料皮肤、脸部扭曲、画面闪烁、故障伪影、文字、水印、Logo、剧烈晃动、慢动作、围巾变成硬块、脸部发光、星光过量、满屏镜头光晕、烟花、白天的天空
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/DeCat2025/status/2106559472432795987
  author: "@DeCat2025"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；围巾颜色、结尾音乐改为变量；新增声音描述；原文的负面提示词译为中文放入 negativePrompt
images:
  - 206-seedance-knitting-night-sky-1.jpg
imageCredit:
  by: "@DeCat2025"
  url: https://x.com/DeCat2025/status/2106559472432795987
  license: CC BY 4.0
verify:
  - 实测 10–15 秒"围巾变成夜空"的转化是否连贯，记录成功率
  - 使用的平台是否有单独的负面提示词输入框；没有的话，负面词以"不要……"的句式附在提示词末尾效果如何
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：三段各 5 秒，景别从中景到近景再到远景，情绪层层推进。这个"中景—近景—远景"的递进很适合讲一个小奇迹，换主题时保留这个结构。

**怎么填变量**：节日版可以把围巾换成"[红色围巾]"，结尾变成"满天烟花"（记得同时删掉负面词里的"烟花"）；品牌版把最后一镜改成"围巾化作夜空，星星排成[品牌名首字母]"。

**常见失败与调整**：
- 织针变成三四根、手指粘连：负面提示词这一长串就是针对这个问题的，别删。平台没有负面框时，挑最关键的 5 个写成"不要多余手指、不要多余织针……"。
- 星星太多、画面像特效堆砌：保留"星光过量""满屏镜头光晕"两个负面词。
- 围巾飞出窗后直接消失：在 10–15 秒那段加一句"围巾展开的过程连续可见，至少持续 3 秒"。

> 改编自 [@DeCat2025](https://x.com/DeCat2025/status/2106559472432795987) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Knitting the sky

0–5s: One elderly woman with silver hair sits alone in a wooden rocking chair beside an open window at night, knitting with two wooden needles. A long dark blue scarf spills from her lap across the wooden floor. Warm amber lamp light, soft shadows. 
Medium shot.
5–10s: The viewer moves closer to her hands and the scarf, and the dark yarn reveals tiny glowing stars and slowly swirling galaxies woven into the stitches. One star catches on the tip of her needle and sparkles. Her face softens into a quiet smile. 
Close-up.
10–15s: She ties off the final stitch and gently tosses the scarf out the open window, where it unrolls upward over the rooftops and becomes the real night sky, stars settling into place. Wide shot from outside the house looking up, warm window glow below, deep blue sky above.  
Negative Prompt: extra fingers, extra hands, deformed hands, fused fingers, more than two knitting needles, melting needles, warped yarn, second woman, duplicate person, child, modern furniture, television, phone, harsh white lighting, neon colors, cartoon style, anime style, plastic skin, distorted face, flickering, glitch artifacts, text, watermark, logo, fast camera shake, slow motion, scarf turning solid, glowing face, sparkle overload, lens flare spam, fireworks, daytime sky
```

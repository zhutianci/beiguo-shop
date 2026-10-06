---
title: 儿童画风提示词（nano banana 玩法）：把线稿 / 绘本插画变成 5 岁小孩的蜡笔涂色
slug: picture-book-child-crayon
model: nano-banana
topics: [illustration, photo-edit]
needsRefImage: true
useCase: 想做"小朋友涂色版"的绘本页、亲子活动海报、童趣风社媒配图时，上传一张线稿或插画，生成仿佛 5 岁孩子用蜡笔涂过色的效果：颜色大胆、涂出边线、笔触乱而可爱。
prompt: |
  把上传的这张[绘本线稿]改成像一个 5 岁小朋友用蜡笔涂过色的样子：
  - 原来的线条和构图全部保留，在线稿上直接涂色；
  - 用[红、黄、蓝、绿]等鲜艳的蜡笔颜色，每个物体基本只涂一种颜色，颜色搭配天真、不讲究写实；
  - 笔触是来回涂抹的蜡笔纹理，有明显的笔痕和纸张颗粒，经常涂出边线、有些地方没涂满留白；
  - 天空、墙面等大面积区域用潦草的横向涂抹；
  - 整体像真的从图画本上扫描下来的儿童作品，不要变成专业插画或数码上色。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/hAru_mAki_ch/status/1966877088365113722
  author: "@hAru_mAki_ch"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只有一句"让上传的绘本看起来像五岁小孩画的"；本站按示例效果改写为"在线稿上做儿童蜡笔涂色"，补充保留线稿、配色、笔触、留白等要求，新增素材类型和颜色变量
images:
  - 520-picture-book-child-crayon-1.jpg
  - 520-picture-book-child-crayon-2.jpg
imageCredit:
  by: "@hAru_mAki_ch"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case84
  license: Apache-2.0
verify:
  - 用一张已经上色的插画（非线稿）实测，看是否还能得到蜡笔涂色效果，还是会整体重画
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传线稿效果最好（可以先用 517 号提示词把照片转成线稿），然后发送提示词。示例图第 1 张是结果，第 2 张是原始线稿：三台蒸汽火车被涂成了绿、蓝、红黄，天空是潦草的橙紫色横涂，还有不少地方涂出了线。

**变量怎么改**：
- [绘本线稿] 可以换成"涂色卡""建筑速写""产品线稿"。
- 颜色想更乱一点就写"颜色随便选，有的地方涂了两三层"；想更整洁写"颜色基本在线内"。
- 想要"完全由小孩重画"的效果（歪歪扭扭的线条），把第一条改成"不保留原线条，用儿童简笔画的方式重新画一遍"。

**常见问题**：
- 涂得太专业：强调"不要渐变、不要阴影、不要高光"。
- 线稿被改：加"只上色，不修改任何线条"。

**适合**：亲子账号内容、童书宣传、儿童节 / 六一活动海报、"大人画 vs 小孩涂"的趣味对比图。

### 英文原版

```
Make the uploaded picture book look as if it was drawn by a five-year-old child.
```

> 改编自 [@hAru_mAki_ch](https://x.com/hAru_mAki_ch/status/1966877088365113722) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

---
title: "海报提示词：超大单词\"参与画面\"的潮流广告海报，人物走在巨型字母的投影里（gpt-image-2）"
slug: oversized-word-editorial-campaign-poster
model: gpt-image-2
topics: [poster, fashion, ecommerce]
aspectRatio: "9:16"
needsRefImage: false
useCase: "给眼镜、饮料、运动装备等新品做一张有冲击力的主视觉：一个超大的短单词不是当背景，而是像实物一样立在场景里，在地面拉出长长的投影，模特或产品与字母发生遮挡、穿插，四周是极小的产品参数。"
prompt: |
  设计一张大胆的时尚广告海报，让超大字体主动塑造画面概念，而不是简单地垫在背景里。竖版 9:16。
  - 品牌：[SOLAR]（虚构品牌）
  - 产品 / 活动：[S1 太阳镜 · 夏季系列]
  - 主单词：[HEAT]
  - 主体：[戴太阳镜的年轻女性]，穿背心短裤，迎着阳光大步走来
  画面要求：
  - 背景是高饱和的纯色（如明黄色）；主单词用极粗的无衬线大写字母，占满画面上半部分，颜色是接近纸白的浅色；
  - 同一个单词以黑色长投影的形式斜铺在地面上，主体正踩着投影走过；主体的身体遮住部分字母，形成"人在字里穿行"的前后层次；
  - 强烈的正午硬光，主体的影子与字母投影方向一致；
  - 版式细节：左上角是小号的品牌名、产品名和季节；主体旁有一条细引线指向产品，写一句 2～4 个词的卖点；右下角竖排三四个带小图标的参数词；底部一条黑色信息栏，写品牌、品类、口号和年份；
  - 风格：杂志大片质感，构图干净，字体硬朗现代；不出现任何真实品牌和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MrLarus/status/2091768903831572924
  author: "@MrLarus"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是只有四个填空项的英文模板，译为中文并保留品牌、产品 / 活动、主单词、主体四个变量；按示例图补充了纯色背景、字母投影、人物与字母的遮挡关系、角落小字信息和底部信息条等版式细节，使其可以直接复现"
images:
  - 3437-oversized-word-editorial-campaign-poster-1.jpg
imageCredit:
  by: "@MrLarus"
  url: https://youmind.com/gpt-image-2-prompts?id=32463
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：品牌写一个虚构的名字或你自己的品牌；主单词选 3～5 个字母的短词（HEAT、POP、RUN、COLD），字母越少越有力；主体可以是人物，也可以是产品本身，例如"一罐冒着水珠的汽水悬在字母 O 的圆洞里"；背景色跟着产品调性换，如饮料用青蓝、运动鞋用橙红。

示例图：明黄色背景上，米白色的巨大字母"HEAT"顶天立地，同样的字母以黑色投影斜铺在地面；一位戴墨镜、穿黑背心蓝短裤的女性抬手扶着镜框大步走在投影上；左上角是"SOLAR S1 / EYEWEAR"小字，右侧有引线标注和几行参数，底部是一条黑色信息栏。

**常见问题**：
- 文字只是平铺在背景上：强调"字母像立体的墙或地面上的影子，主体与它有遮挡关系"。
- 主单词被遮得认不出：写"至少保证首尾两个字母完整可读"。
- 小字乱码：把角落小字减少到两处，或写"小字用短横线占位"。

**适合**：新品发布主视觉、快闪活动海报、电商首页大图、社交媒体竖版广告。

### 英文原版

```text
Create a bold editorial campaign poster where oversized typography actively shapes the visual concept instead of simply sitting in the background.

Brand: {argument name="brand name" default="[BRAND NAME]"}
Product / Campaign: {argument name="campaign" default="[PRODUCT OR CAMPAIGN]"}
Main Word: {argument name="word" default="[SHORT WORD]"}
Subject / Product: [PERSON / PRODUCT]
```

> 改编自 [@MrLarus](https://x.com/MrLarus/status/2091768903831572924) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

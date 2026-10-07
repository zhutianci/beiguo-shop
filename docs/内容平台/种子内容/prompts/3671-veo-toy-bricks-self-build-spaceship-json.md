---
title: veo 3 JSON 提示词：夜里积木盒自己打开，拼成发光宇宙飞船（月光儿童房 · 无声魔法）
slug: veo-toy-bricks-self-build-spaceship-json
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 玩具、积木、模型、拼装类产品的"魔法自组装"广告：月光照进的儿童房里，地上的积木盒自己轻轻震动、打开，积木悄无声息地飞起、在半空按顺序拼成一艘发光的宇宙飞船，然后落在地板上投下柔和的光影。
prompt: |
  {
    "description": "电影感镜头：夜晚的儿童卧室，被从窗户洒进来的月光温柔照亮。一个密封的[积木盒]放在地板上。它开始轻微地震动，然后自己打开。积木悄无声息地飞出来，在半空中按完美的顺序拼装，组成一艘发光的[宇宙飞船]模型。拼好的飞船短暂悬浮，然后落到地板上，完全拼好。它发出的光在墙上投下柔和的影子，唤起一种魔法和惊奇的感觉。没有文字，没有对白。",
    "style": "电影感",
    "camera": "固定广角",
    "lighting": "清冷的月光，加上积木模型内部发出的暖光",
    "room": "夜晚的儿童卧室，有柔软的床品、地毯，阴影里隐约能看到玩具",
    "elements": [
      "密封的积木盒（无品牌标识）",
      "散落的积木",
      "发出柔光的宇宙飞船积木模型",
      "从窗户洒进来的月光",
      "儿童房家具（床、床头柜、书架）",
      "玩具和小摆设"
    ],
    "motion": "盒子颤抖，平稳地自己打开，积木悬浮起来，在半空中快速而优雅地咔嗒拼合",
    "ending": "完整的发光积木飞船停在地板上，在房间里投下柔和的影子",
    "text": "无"
  }
negativePrompt: 品牌标识，乱码文字，积木变形融化，恐怖氛围，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/lego_magic_spaceship_assembly.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；去掉了原文中的积木品牌名和\"品牌可见\"要求，改为通用\"积木盒\"变量；删去关键词字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"盒子自己打开""积木半空拼装""飞船落地发光"三帧。
verify:
  - Veo 实测 3 次：积木拼装是否有"一块块咔嗒拼合"的感觉，而不是融化变形
---
**时长与镜头**：8 秒固定广角：盒子震动 → 打开 → 积木飞起拼装 → 悬浮 → 落地发光。整个过程"无声"，只有积木咔嗒的细节声和环境声，这种安静反而让魔法感更强；月光的冷色和飞船的暖光对比，是画面最好看的地方。

**怎么填变量**：[积木盒] 换成"拼图盒""模型套件""纸艺套装"；[宇宙飞船] 换成"城堡""恐龙""赛车"。做自家玩具广告时，最好上传产品成品图作参考（Veo 3.1 支持最多 3 张参考图，以官方说明为准），避免模型拼出一个和实物完全不同的造型。

**常见失败与调整**：
- 积木像液体一样融合成型：motion 写"一块一块地咔嗒拼合，能看到积木的颗粒凸点"。
- 气氛变得像恐怖片：保留"温馨""惊奇"，光线写"温暖的光"。
- 盒子上出现乱码品牌：elements 里保留"无品牌标识"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。英文原版以真实品牌为主体，本站已改为通用写法，原文请见来源链接。

---
title: veo 3 JSON 提示词：品牌标志碎成粒子重组成产品（暗场粒子动画 · 品牌揭晓片头）
slug: veo-logo-particles-assemble-product-json
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 品牌揭晓 / 新品发布的片头动画：暗色背景里一个发光的简单图形悬浮、脉动、碎成成千上万的粒子，粒子旋转着重新组装成产品，落地后轻轻一弹，一声脚步声后黑场。适合运动鞋、数码产品、新品发布会开场。
prompt: |
  {
    "description": "电影感镜头：暗色、有纹理的背景，被冷色定向光照亮。一个发光的[简洁弧形标志]悬浮在半空，微微发光。它开始随能量脉动，然后碎裂成成千上万个微小的粒子。粒子快速旋转、积聚动能，开始在半空中组成一只[跑鞋]——一块一块地、精准而流畅地组装起来。完全成形后，鞋子轻轻落到台面上，微微弯折一下，仿佛被注入了生命。一声轻柔的脚步声回响，随后画面渐黑。",
    "style": "电影感",
    "camera": "固定广角",
    "lighting": "低调、冷色调，在暗背景上形成锐利的定向反差",
    "room": "抽象的、有纹理的影棚背景，看不出墙面和环境",
    "elements": [
      "悬浮发光的简洁标志",
      "碎裂的发光粒子，不断旋转",
      "一只时尚现代的跑鞋",
      "哑光质感的台面",
      "空气中细微的浮尘粒子"
    ],
    "motion": "标志脉动后炸成粒子，粒子旋转并重组成鞋子；鞋子落下并轻微弯折",
    "ending": "鞋子轻轻落地，带着一点弹性弯折，响起一声脚步声，然后渐黑",
    "text": "无"
  }
negativePrompt: 真实品牌标志，乱码文字，鞋子变形，粒子拖影过重，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/nike_swoosh_particle_assembly.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；去掉了原文中的运动品牌名与其标志，改为通用的\"简洁弧形标志\"和产品变量；删去关键词字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"标志悬浮""粒子旋转""鞋子成形落地"三帧。
verify:
  - Veo 实测 3 次：粒子重组后产品是否完整、是否出现类似真实品牌的标志
  - 如需使用自家 logo，评估先生成首帧图再走图生视频的效果
---
**时长与镜头**：8 秒固定广角：标志悬浮 → 脉动碎裂 → 粒子旋转重组 → 产品落地弯折 → 脚步声黑场。这是品牌片头里最经典的"标志 → 产品"转化动画，结尾的"一声脚步声"把视觉落到听觉上，记忆点很强。

**怎么用自家标志**：Veo 文生视频画不出你的真实 logo（会走样），建议两种做法：①提示词里只写"一个简洁的弧形 / 圆形图形"，粒子特效生成后，在剪辑软件里把真实 logo 叠在开头 1 秒；②先做一张"黑底 + 发光 logo"的图当首帧，用图生视频让它碎裂。

**怎么填变量**：[跑鞋] 换成"无线耳机""手表""香水瓶"，结尾声音随之改成"耳机盒合上的咔哒声""秒针的滴答声""一声喷雾声"；[简洁弧形标志] 按你的品牌图形描述（不要写品牌名）。

**常见失败与调整**：
- 粒子重组出来的产品缺块：写"组装完成后停留 1 秒，产品完整清晰"。
- 背景太黑看不清：保留"冷色定向光"，加"产品轮廓有一圈细细的边缘光"。
- 生成了别家品牌的图形：负面提示词写"真实品牌标志"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。英文原版以真实品牌为主体，本站已改为通用写法，原文请见来源链接。

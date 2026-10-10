---
title: AI海报提示词：城市文旅宣传海报，雨夜山城 + 轻轨穿楼 + 现代中文排版（重庆示例，可换城市）
slug: chinese-city-promo-poster-night
model: gpt-image-2
topics: [poster, photography]
needsRefImage: false
aspectRatio: "3:4"
useCase: 做城市文旅宣传、旅行账号封面、城市主题活动 KV 时，输入一个城市和它的标志性场景，生成一张有设计年鉴质感的竖版城市品牌海报：夜景摄影感主图 + 克制留白的中英文排版。
prompt: |
  做一张[3:4]城市宣传海报，主题是"[山城雨夜·重庆]"。
  - 定位：整体像高端城市文旅 campaign 海报，不要廉价旅行社风格；
  - 画面中心：[层叠山城建筑、轻轨穿楼]、湿润街道、霓虹倒影、江边雾气和夜色中的坡道；
  - 排版：现代中文排版，加入少量准确的标题与副标题："[山城雨夜]"/"[CHONGQING]"/"8D 城市 / [江雾 / 火锅 / 轻轨 / 夜景]"；
  - 信息密度适中，留白克制；
  - 配色：以[深蓝、暖橙、湿润霓虹红]为主；
  - 质感：像一本设计年鉴里的城市品牌海报。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-typography-and-posters.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 原文为中文，本站拆成要点；主题、主体场景、标题、英文名、关键词、配色、画幅设为变量；补充了常见问题与改法
images:
  - 3240-chinese-city-promo-poster-night-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/typography-posters/city-tourism-promo-poster.png
  license: MIT
verify:
  - 原始出处：原帖：https://www.xiaohongshu.com/explore/69e5cb85000000001a027aa8，核对原帖仍可访问、作者未另行声明保留权利
  - 原文要求 3:4，示例图实际接近 2:3，确认出图比例
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：主题 [山城雨夜·重庆] 换成"[江南烟雨·杭州]""[长安夜宴·西安]""[海风骑楼·厦门]"；画面中心那一项写该城市最有辨识度的两三个场景，例如西安写"城墙灯火、大雁塔、夜市长街"；标题、英文名、关键词三行跟着改；配色按城市气质换，杭州可用"青绿、烟灰、暖白"。示例图是原作者的出图：左上是竖排大字"山城 雨夜"，下方橙色"CHONGQING"和一行"8D 城市 / 江雾 / 火锅 / 轻轨 / 夜景"小字；右侧层层叠叠的吊脚楼亮着灯，一列轻轨从楼间穿过，左边江面上是亮红色大桥和游船，前景湿漉漉的坡道上有撑伞行人，底部有"2024"和城市小标。

**常见问题与调整**：
- 像普通旅游照片：强调"海报版式，大标题占画面四分之一，主图与文字有明确分区"。
- 文字太多出错：只保留主标题和英文名两行，关键词那行删掉。
- 地标不像该城市：在场景描述里写具体特征，或上传一张城市实拍作参考。
- 想做系列：追问"保持同样版式和字体，换成同一城市的清晨版本"。

**适合**：城市文旅宣传、旅行账号封面、城市主题活动主视觉；画面是 AI 生成的意象，不等同于真实街景。

### 原版提示词（仓库收录的原文）

```
做一张 3:4 城市宣传海报，主题是“山城雨夜·重庆”。整体像高端城市文旅 campaign poster，不要廉价旅行社风格。画面中心是层叠山城建筑、轻轨穿楼、湿润街道、霓虹倒影、江边雾气和夜色中的坡道。用现代中文排版，加入少量准确标题与副标题："山城雨夜" / "CHONGQING" / "8D 城市 / 江雾 / 火锅 / 轻轨 / 夜景"。信息密度适中，留白克制，色彩以深蓝、暖橙、湿润霓虹红为主，像一本设计年鉴里的城市品牌海报。
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

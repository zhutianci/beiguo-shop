---
title: 信息图提示词：水彩手绘地图，各省 / 州用圆珠笔手写标注（nano banana 一句话出图）
slug: watercolor-labeled-map
model: nano-banana
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做地理课件、旅行手账、文章配图时，一句话生成一张水彩晕染的分区地图，每个行政区用手写字标出名称，比标准地图更有温度。
prompt: |
  生成一张[德国]地图，水彩风格：每个[联邦州]用不同的柔和水彩色块晕染，边缘有自然的水渍过渡；
  所有[联邦州]的名称都用[蓝色圆珠笔]手写标注在对应区域内；
  背景是带纹理的白色水彩纸，地图居中，四周留白。
  画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/FlorianGallwitz/status/1991796624646091091
  author: "@FlorianGallwitz"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；地区、行政区单位、笔的类型、画幅设为变量；参照示例图补充了水彩晕染、纸张背景和留白描述
images:
  - 3280-watercolor-labeled-map-1.jpg
imageCredit:
  by: "@FlorianGallwitz"
  url: https://cms-assets.youmind.com/media/1763886061720_fzgqaq_G6RIeSZXgAA7cOf.jpg
  license: CC BY 4.0
verify:
  - 换成"浙江省各地级市"等小范围地图出一次，核对轮廓与地名；AI 地图轮廓不精确，不要用于需要完整、准确国界 / 省界的场合（涉及国家版图的地图须使用标准地图）
  - 示例图是德文地名版，页面需注明
  - CC BY 4.0 需在页面保留原作者署名和许可证链接
---
**怎么填变量**：[德国] 换成你需要的国家或地区，[联邦州] 跟着换成"省份""州""区县"；[蓝色圆珠笔] 可换"黑色钢笔""铅笔"。行政区越少越准，例如"浙江省各地级市""日本八大地方"比整个国家的全部省份更稳；注意 AI 画的轮廓只是示意，涉及国家版图请用标准地图，不要用 AI 图代替。示例图是白色水彩纸上的一张德国地图，十六个州各用蓝、绿、黄、橙的水彩色块晕开，州名用深蓝色手写体标在各自区域里（如 Bayern、Hessen、Berlin），地图居中、两侧大片留白。

**常见问题与调整**：
- 地名写错或位置错：在提示词里列出全部名称，并加"每个名称只出现一次，放在对应区域中央"。
- 轮廓变形：模型画复杂边界不稳定，可上传一张白底轮廓图，写"按上传轮廓上色和标注"。
- 颜色太花：写"只用蓝绿两种色系的深浅变化"。
- 想做旅行手账版：追加"在去过的城市画小红点，旁边手写日期"。

**适合**：地理课件、旅行手账和攻略配图、装饰插画；不适合作为正式出版或需要精确边界的地图。

### 英文原版

```
Generate a map of Germany in watercolor style, on which all federal states are labeled in ballpoint pen.
```

> 改编自 [@FlorianGallwitz](https://x.com/FlorianGallwitz/status/1991796624646091091) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

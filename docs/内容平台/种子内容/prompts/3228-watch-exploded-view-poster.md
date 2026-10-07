---
title: 电商详情页提示词：机械腕表爆炸图海报，蓝图网格 + 10 个部件编号 + 规格表
slug: watch-exploded-view-poster
model: gpt-image-2
topics: [infographic, ecommerce]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做产品详情页的"内部结构"模块、工业设计作品集或产品发布会配图时，生成一张深色蓝图风的爆炸分解图：部件垂直分层排开，配编号引线、参数和规格表，显得专业精密。
prompt: |
  创作一张高端的技术爆炸图插画，主体是一款虚构的[机械腕表]，名叫"[Meridian 8]"，居中放在深石板灰背景上，点缀细密的蓝图网格。
  - 部件：按垂直方向等距分离——蓝宝石表镜、表盘、指针、分钟圈、机芯夹板、擒纵机构、摆轮、发条盒、表壳、表冠和皮表带分段；
  - 材质：真实的拉丝钢、黄铜、红宝石轴承点缀，深[海军蓝]表盘细节；
  - 文字标注："Meridian 8"、"Exploded Assembly"、"[42 mm Case]"、"25 Jewels"、"Power Reserve 72 h"；
  - 编号引线 01～10，配短标签如 Balance Wheel、Mainspring Barrel、Sapphire Crystal；
  - 左侧可加正面 / 侧面尺寸线稿和一张规格表；
  - 高度细致、技术上可信、渲染锐利，像一张工业设计图版：层级清楚、标注准确、材质写实。
  画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-technical-illustration.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；产品类型、产品名、表盘色、尺寸参数、画幅设为变量；按示例图补充了尺寸线稿和规格表
images:
  - 3228-watch-exploded-view-poster-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/technical-illustration/mechanical-watch-exploded-view.png
  license: MIT
verify:
  - 示例图部件说明里出现了真实的游丝 / 摆轮材料商标词，展示时确认无商标顾虑
  - 换成"无线耳机""机械键盘"出一次，看部件分层是否仍合理
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[机械腕表] 可以换成"真无线耳机""机械键盘""电动牙刷""咖啡机"，部件清单要跟着改成真实存在的零件；[Meridian 8] 换成你的产品名；[海军蓝] 换成产品主色；[42 mm Case] 换成关键参数，如"[续航 30 小时]"。示例图是仓库作者的出图：深蓝灰底上一只腕表从上到下拆成表镜、指针、蓝色表盘、分钟圈、镂空机芯夹板、擒纵轮、摆轮、发条盒、钢表壳和两段深蓝皮表带，右侧 01～10 编号逐一说明，左侧是"Meridian 8"标题、三项参数、正侧面尺寸线稿，左下角是规格表。

**常见问题与调整**：
- 部件顺序乱：按从上到下的顺序逐个列出部件，并加"严格按这个顺序垂直排列"。
- 编号和部件对不上：减少到 6～8 个部件，每个编号紧贴对应零件。
- 用于真实产品：部件结构必须和实物一致，建议上传产品照片作参考，并加"以参考图外观为准"。
- 想要白底版：改成"纯白背景，浅灰网格，黑色细线标注"，更适合电商详情页。

**适合**：产品详情页结构模块、工业设计作品集、发布会配图；用于商品宣传时，请确保最终实物与图片描述一致。

### 英文原版

```
Create a premium technical exploded-view illustration of a fictional mechanical wristwatch called the Meridian 8, centered on a dark slate background with fine blueprint grid accents. Show the watch components separated vertically with precise spacing: sapphire crystal, dial, hands, chapter ring, movement plates, escapement, balance wheel, mainspring barrel, case, crown, and leather strap sections. Use realistic brushed steel, brass, ruby jewel accents, and deep navy dial details. Add crisp callouts and labels with the in-image text "Meridian 8", "Exploded Assembly", "42 mm Case", "25 Jewels", and "Power Reserve 72 h". Include numbered callouts "01" through "10" with short labels like "Balance Wheel", "Mainspring Barrel", and "Sapphire Crystal". The result should be highly detailed, technically believable, sharply rendered, and suitable for an industrial design plate with clean hierarchy, exact labeling, and refined material realism.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

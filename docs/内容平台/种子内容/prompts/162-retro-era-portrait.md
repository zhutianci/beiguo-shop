---
title: nano banana 穿越年代照提示词：把自己变成 70 年代 / 90 年代复古风人像
slug: retro-era-portrait
model: nano-banana
topics: [portrait, photo-edit]
needsRefImage: true
useCase: 想看看自己生活在上世纪 70、80、90 年代会是什么样，上传一张清晰人像，换上那个年代的发型、服装、背景和胶片质感，脸保持不变。
prompt: |
  把照片中的人物改成[1970 年代]的经典[男性]造型：
  - 发型：[及肩长卷发]；
  - 面部修饰：[浓密的八字胡]；
  - 服装：那个年代流行的款式和面料；
  - 背景：换成那个年代标志性的[加州夏日街景]；
  - 画面质感：模拟那个年代的胶片相机，带有轻微颗粒、偏暖的褪色色调。
  不要改变人物的脸，五官和脸型必须与原图一致。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/AmirMushich/status/1960810850224091439
  author: "@AmirMushich"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 译成中文并整理成分项清单；新增服装、胶片质感两项；把原文的"长胡子"改为更具体的描述
images:
  - 162-retro-era-portrait-1.jpg
  - 162-retro-era-portrait-2.png
imageCredit:
  by: "@AmirMushich"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case5
  license: Apache-2.0
verify:
  - 用女性照片 + 1990 年代香港街头背景实测一次
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传正脸清晰的人像。示例第 1 张是 70 年代造型结果，第 2 张是原图。变量可以自由组合，例如：
- [1990 年代] + [女性] + [大波浪卷发] + [港风街头霓虹招牌]；
- [1980 年代] + [男性] + [三七分油头] + [老式录像厅门口]；
- 面部修饰不需要就删掉那一行。

**常见问题**：
- 脸不像了：把"不要改变人物的脸"挪到第一行，并少改几项（发型和背景二选一先改）。
- 年代感不够：在背景里写具体物件（老式汽车、街边报刊亭、霓虹灯牌）比只写年代更有效。
- 想做系列：追问"用同一个人，再生成 1980 年代和 2000 年代两张"，拼成"穿越四十年"组图。

**适合**：社媒趣味内容、生日礼物、怀旧主题活动海报。

### 英文原版

```
Change the characer's style to [1970]'s classical [male] style
Add [long curly] hair, 
[long mustache], 
change the background to the iconic [californian summer landscape]
Don't change the character's face
```

> 改编自 [@AmirMushich](https://x.com/AmirMushich/status/1960810850224091439) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

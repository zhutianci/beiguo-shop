---
title: 建筑效果图提示词：哥特大教堂中殿彩窗光写实渲染（竖版，可当手机壁纸）
slug: gothic-cathedral-nave-render
model: gpt-image-2
topics: [interior, photography, wallpaper]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做建筑史课件、欧洲旅行内容封面或竖版手机壁纸时，生成一张沿中殿纵深看去的哥特教堂写实效果图：肋拱、彩窗、黑白格地面，前景说明牌上的文字也能清晰出现。
prompt: |
  以写实建筑渲染风格，生成一座宏伟的[哥特式大教堂]内部，视线沿中殿正中向前延伸。
  - 建筑：高耸的肋拱穹顶、尖拱、繁复的窗花格，彩色玻璃窗投下有色光；
  - 细节：真实的风化石灰岩质感、雕花唱诗席座椅、图案化石材地面、远处的祭坛；
  - 配色：冷石灰色、深[酒红]、宝石蓝、烛光金，带一点朦胧的环境光；
  - 光线：柔和的日光光束与温暖烛光混合，空气中有细微的体积光尘埃；
  - 前景一侧放一块低调的说明牌，上面清晰写着"[Nave Height 28.5 m]"和"[Hall of Light]"；
  - 构图强调垂直感、对称和神圣氛围，同时建筑上可信；哥特细节准确、透视强烈、材质真实、小字锐利，做成博物馆级的建筑渲染，而不是奇幻场景。
  画幅[9:16]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-architecture-and-interior.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；建筑类型、点缀色、说明牌文字、画幅设为变量；说明牌里的真实地名改为通用名称；补充了常见问题与改法
images:
  - 3202-gothic-cathedral-nave-render-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/architecture-interior/gothic-cathedral-interior-render.png
  license: MIT
verify:
  - 示例图说明牌上的英文原文含真实地名，展示时确认无误导（提示词已改为通用名称）
  - 换成横版 16:9 出一次，看纵深和对称是否保持
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[哥特式大教堂] 可以换成"罗马式修道院""拜占庭穹顶教堂""巴洛克宫殿长廊"，风格关键词会跟着变；[酒红] 是挂旗和彩窗的主色，换成"墨绿""深紫"氛围会更冷峻。说明牌文字可以写成中文，如"[中殿高 28.5 米]""[光之殿]"，字数少更准。示例图是竖幅：两侧挂着深红和深蓝的旗帜，唱诗席上点着蜡烛，尽头是圆形玫瑰窗和高窗，地面是黑白格石材，左下角立着一块黑色说明牌。

**常见问题与调整**：
- 画面太亮像游戏场景：加"整体偏暗，只有彩窗和烛光是亮点，保留深阴影"。
- 光束太夸张：改成"光束轻微可见，不要舞台追光感"。
- 想要人物点缀：加"远处有两三个很小的游客背影作为尺度参照"。
- 当壁纸怕字挡画面：删掉说明牌那一条，或改成"不出现任何文字"。

**适合**：建筑史 / 美术史课件插图、旅行内容封面、竖版手机壁纸；不适合冒充某座真实教堂的实拍照片。

### 英文原版

```
Render a majestic Gothic cathedral interior in photorealistic architectural style, viewed down the central nave with towering ribbed vaults, pointed arches, intricate tracery, and colored light from stained glass windows. Use a palette of cool stone gray, deep burgundy, sapphire blue, candle gold, and dusty ambient light. Include realistic worn limestone textures, carved choir stalls, a patterned stone floor, and a distant altar. Add a discreet informational plaque near the foreground with the in-image text "Nave Height 28.5 m" and "Westminster Hall of Light". The composition should emphasize verticality, symmetry, and sacred atmosphere while remaining architecturally believable. Lighting should mix soft daylight shafts and warm candlelight, with subtle volumetric dust. Prioritize accurate Gothic detailing, strong perspective, material realism, and crisp small text, producing a museum-grade architectural render rather than a fantasy scene.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

---
title: veo 3 JSON 提示词：寿司爆炸定格广告（子弹时间 + 鼓点音效）
slug: veo-sushi-kinetic-json
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成"食材在空中被切开、米饭炸开成型、盒子猛地合上"的高速动感食品广告，自带鼓点和刀风音效；这条示范了 shot / subject / scene / cinematography / audio 分层的完整 JSON 模板，适合餐饮外卖、便当、轻食品牌。
prompt: |
  {
    "shot": {
      "composition": "[寿司]在空中定格飞行，食材在慢动作中被切开，然后猛地落进[餐盒]摆好",
      "lens": "35mm，快速移焦",
      "frame_rate": "切片和下落时用超高速摄影慢动作，跟拍时正常速度",
      "camera_movement": "快速甩镜，撞击瞬间急推，围绕[三文鱼]切片做子弹时间环绕"
    },
    "subject": {
      "description": "爆开的[寿司拼盘]——三文鱼、卷寿司、甜虾、牛油果，米饭炸开",
      "props": "滴落的酱油、飞起的姜片、水汽薄雾、动感的筷子"
    },
    "scene": {
      "location": "带发光网格的黑色虚空，寿司元素漂浮其中",
      "time_of_day": "风格化，不分时间",
      "environment": "薄雾、气流漩涡、动感切配台"
    },
    "visual_details": {
      "action": "生鱼片在空中被切开，米饭炸开后聚拢成形，盒子在最后的冲击中猛地合上，一双筷子交叉落在盒上像一个封印",
      "special_effects": "米饭冲击波、酱油飞溅的轨迹、落下时的蒸汽爆发"
    },
    "cinematography": {
      "lighting": "戏剧化侧光，鱼肉表面的光泽随节奏脉动",
      "color_palette": "熔岩橙、海绿、高光黑、霓虹描边",
      "tone": "高端、有冲击力、极致新鲜"
    },
    "audio": {
      "music": "带电影感低音重击的[陷阱]节拍",
      "ambient": "刀划过空气的声音，寿司落下的回声",
      "sound_effects": "米粒噼啪声、酱油滋滋声、刀锋呼啸声",
      "mix_level": "有力度的混音，音效与画面卡点同步"
    },
    "dialogue": {
      "line": "",
      "subtitles": false
    }
  }
negativePrompt: null
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/sushi_explosion_kinetic_box.md
  author: liu-kaining
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: JSON 的值译为中文、键名保留英文；删去空字段；帧率数字改为"超高速慢动作"的描述；食物、容器、音乐类型改为变量
imageBrief: 仓库没有示例图。生成 1 条，截取"切片定格""米饭炸开""盒子合上"三帧作展示图。
verify:
  - 在 Veo 3 实测 3 次，记录食材是否保持可辨认、盒子合上时是否穿模
  - 鼓点和"合盖"重击是否卡在同一时刻
  - 确认原仓库文件仍可访问
---
**这是一份完整的分层模板**：shot（镜头）→ subject（主体）→ scene（场景）→ visual_details（动作和特效）→ cinematography（光与色）→ audio（声音）→ dialogue（对白）。做任何"产品飞散再合体"的广告，只需要换 subject 和 action，其余字段可以原样保留。

**怎么填变量**：[寿司拼盘] 换成"[汉堡的面包、肉饼、生菜、芝士]""[沙拉的各种蔬菜]"；[餐盒] 换成你的包装；[陷阱] 节拍可换"电子鼓""太鼓"。

**时长与镜头**：8 秒里只放得下一次"散开—合体"，不要再加第二个高潮。

**常见失败与调整**：
- 食材糊成一团：subject 里只保留 3–4 种食材。
- 盒子合上时食物穿模：把 action 改成"食材依次落入盒中，最后盒盖盖上"，速度放慢。
- 生成了对白或字幕：dialogue 留空并保持 "subtitles": false。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "sushi flying mid-air in freeze-frame, ingredients slicing through slow-mo then slamming into a box layout",
    "lens": "35mm with fast rack focus",
    "frame_rate": "1500fps during slicing and drops, 60fps tracking",
    "camera_movement": "whip pans, snap zoom on impact, bullet-time swirl around salmon cut"
  },
  "subject": {
    "description": "exploding sushi assortment — salmon, maki, ebi, avocado, rice burst",
    "wardrobe": "",
    "props": "dripping soy, flying ginger, vapor mist, kinetic chopsticks"
  },
  "scene": {
    "location": "black void with glowing grid, floating sushi elements",
    "time_of_day": "stylized timeless",
    "environment": "mist, air swirls, kinetic chop platform"
  },
  "visual_details": {
    "action": "sashimi slices in air, rice explodes into shape, box slams shut in final impact burst, chopsticks cross like a seal",
    "special_effects": "rice shockwave, soy splash trails, steam blast on drop",
    "hair_clothing_motion": ""
  },
  "cinematography": {
    "lighting": "dramatic side light, gloss shimmer pulses on fish",
    "color_palette": "lava orange, sea green, high-gloss black, neon edges",
    "tone": "premium, aggressive, ultra-fresh"
  },
  "audio": {
    "music": "trap beat with cinematic bass hits and percussive rhythm",
    "ambient": "air slice, sushi drop echo",
    "sound_effects": "rice crackle, soy sizzle, blade whoosh",
    "mix_level": "punchy mix, FX-synced with hard stereo hits"
  },
  "dialogue": {
    "character": "",
    "line": "",
    "subtitles": false
  }
}
```

---
title: veo 3 JSON 提示词：第一视角巨型城市水滑梯（GoPro 视角穿越摩天楼 · 日落到夜晚）
slug: veo-pov-skyscraper-waterslide-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 刺激的第一人称 POV 体验视频：像胸前挂着运动相机，光脚滑进一条穿行在摩天楼之间的透明巨型水滑梯，螺旋、俯冲、最后冲进水池溅起巨大水花。适合文旅 / 乐园宣传、运动相机风格内容、沉浸式短视频。
prompt: |
  {
    "shot": {
      "composition": "完全的第一视角，画面下方是溅水的双脚、湿透的小腿，双臂伸向前方穿过弯曲的水滑道",
      "lens": "运动相机式的胸前 / 头部混合视角",
      "camera_movement": "人体的颠簸和倾斜，手臂快速稳住，在螺旋弯道里旋转，猛地俯冲进溅水区"
    },
    "subject": {
      "description": "一个光脚的人在摩天楼之间的巨型水滑梯里飞速滑行，全身湿透，双腿飞起",
      "props": "光脚、膝盖、水痕，湿漉漉的滑道内壁上倒映着城市天际线"
    },
    "scene": {
      "location": "建在[未来城市]楼顶和路口上空的透明巨型滑梯",
      "time_of_day": "日落逐渐进入夜晚",
      "environment": "大量水花飞溅，喷雾，水膜上的光晕，滑道里的回声"
    },
    "visual_details": {
      "action": "双脚踢起水花，镜头随着回环旋转，手臂划过飞速掠过的滑道壁，最后冲进水池，炸开一大片水花",
      "special_effects": "镜头上的水花模糊，滑道折射，转弯时彗星般的水流拖尾，日落的强光闪现"
    },
    "cinematography": {
      "lighting": "阳光从滑道的开口一闪一闪地照进来，较暗的路段有霓虹底光",
      "color_palette": "水蓝、肤色、城市钢铁的铬色、橙色夕阳",
      "tone": "史诗、好玩、真实刺激"
    },
    "audio": {
      "music": "电影预告片节奏，叠加水的打击乐",
      "ambient": "水的轰鸣，回旋的回声，城市环境声时隐时现",
      "sound_effects": "脚踩水声，滑道拍击声，旋转水声，最后一声深深的入水爆响"
    }
  }
negativePrompt: 多余的腿，脚趾畸形，滑道断裂，画面文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/mega_waterslide_city_adventure.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；删去帧率、空的服装与台词字段；城市场景改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"滑道里俯视双脚""螺旋穿过楼宇""冲进水池"三帧。
verify:
  - Veo 实测 3 次：第一视角下双腿和双臂的数量是否正确
  - 高速运动时画面是否撕裂
---
**时长与镜头**：8 秒一个连续 POV：滑行 → 螺旋 → 俯冲 → 入水。第一视角的关键是画面里要有"身体的一部分"（脚、膝盖、手臂），观众才会代入；原作把"身体在画面下方"写进 composition，就是这个道理。

**怎么填变量**：[未来城市] 换成"热带雨林树冠""雪山峡谷""海底隧道"，就是不同主题的乐园宣传片。做文旅宣传时可以把滑梯换成"玻璃栈道""高空索道""过山车"，保留 POV 写法。

**常见失败与调整**：
- 腿变成三条：composition 写"只看得到两只脚和两只手"。
- 镜头一直转晕了：删掉"在螺旋弯道里旋转"，改为"沿弯道平滑滑行"。
- 入水后画面一片白：写"入水后镜头浮出水面，看到夜色中的城市灯光"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "full POV with splashing feet, soaked legs, arms reaching forward through curving water tunnel",
    "lens": "GoPro-style chest-head hybrid",
    "frame_rate": "120fps continuous with 240fps drop segments",
    "camera_movement": "human bob and tilt, quick arm stabilizations, spins through spiral turns, hard drops into splash zones"
  },
  "subject": {
    "description": "barefoot human sliding through colossal waterslide between skyscrapers, body soaked, legs flying",
    "wardrobe": "",
    "props": "bare feet, knees, water trails, reflections of skyline on wet tunnel walls"
  },
  "scene": {
    "location": "transparent mega-slide built into futuristic cityscape above rooftops and intersections",
    "time_of_day": "sunset into nightfall",
    "environment": "heavy splash spray, mist jets, light glares on water film, tunnel echoes"
  },
  "visual_details": {
    "action": "feet kick up water, camera spins with loop, arms swipe at rushing walls, plunge into basin with final spray explosion",
    "special_effects": "lens splash blur, tunnel refraction, water comet trails on turns, sunset flashouts",
    "hair_clothing_motion": ""
  },
  "cinematography": {
    "lighting": "flashing natural light through tube openings, neon underglow in darker segments",
    "color_palette": "aqua blue, skin tone, chrome city steel, orange sun",
    "tone": "epic, fun, visceral realism"
  },
  "audio": {
    "music": "cinematic trailer tempo with layered water percussion",
    "ambient": "water roar, echo swirl, city ambience fading in and out",
    "sound_effects": "feet splash, tunnel slap, water spin, deep dive blast",
    "mix_level": "high-energy aquatic surround with dynamic wet audio detail"
  },
  "dialogue": {
    "character": "",
    "line": "",
    "subtitles": false
  }
}
```

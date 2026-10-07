---
title: veo 3 JSON 提示词：骑士在火山口对峙巨龙（缓慢推进 · 熔岩逆光 · 史诗台词）
slug: veo-knight-vs-dragon-volcano-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 史诗奇幻的对峙镜头：火山口边缘，身披焦黑铠甲的骑士拔剑而立，巨龙展翅咆哮，熔岩逆光勾出剪影，骑士说出一句台词。适合奇幻短片预告、游戏 CG 风格宣传、配乐 MV。
prompt: |
  {
    "shot": {
      "composition": "广角镜头，骑士和巨龙都完整入画，被火山口的圆形边缘框住",
      "lens": "35mm",
      "frame_rate": "24fps",
      "camera_movement": "向对峙的双方缓慢推进"
    },
    "subject": {
      "description": "一位孤身骑士，身披烧焦的钢铁铠甲，面罩放下，持剑稳稳站立",
      "wardrobe": "饱经风霜的板甲，胸甲和护腿上刻着发光的符文",
      "props": "一把巨大的双手剑，剑身有熔岩般的内核，在热浪中微微冒着蒸汽"
    },
    "scene": {
      "location": "锯齿状的[火山口]边缘，四周流淌着熔岩河",
      "time_of_day": "暮色",
      "environment": "浓密的烟柱，岩石裂缝里透出发光的岩浆，空中飘着火山灰"
    },
    "visual_details": {
      "action": "巨龙低吼，双翼展开，鼻孔里冒出烟雾；骑士稳住架势",
      "special_effects": "火星飘飞，熔岩反光造成轻微的镜头光晕，龙眼发出强烈的光",
      "hair_clothing_motion": "骑士的披风在上升的热气流中猛烈翻飞"
    },
    "cinematography": {
      "lighting": "熔岩和暮色形成逆光，勾勒出戏剧化的剪影",
      "color_palette": "熔岩橙、深红、钢灰和黑曜石黑",
      "tone": "紧张、神话感、远古对决"
    },
    "audio": {
      "music": "史诗管弦乐渐强，部落鼓和低沉铜管",
      "ambient": "大地隆隆作响，熔岩噼啪，远处的喷发声",
      "sound_effects": "龙的低吼，铠甲碰撞声，火焰的嘶嘶声"
    },
    "dialogue": {
      "character": "骑士",
      "line": "[我是烈焰的终结，孽畜，你的时候到了。]",
      "subtitles": false
    }
  }
negativePrompt: 龙的翅膀数量错误，骑士肢体畸形，卡通，字幕，乱码文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/knight_dragon_volcanic_confrontation.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；台词译为中文并设为变量；原文要求显示字幕，本站改为不显示（避免乱码）；地点改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"火山口全景对峙""披风翻飞""龙展翅"三帧。
verify:
  - Veo 实测 3 次：巨龙的翅膀与肢体结构是否稳定
  - 中文台词在面罩放下的情况下是否自然（无口型问题）
---
**时长与镜头**：8 秒一个缓慢推进的镜头，没有打斗，只有"对峙"。这是奇幻题材里成功率最高的写法：真正的打斗容易崩，而"风雨欲来"的对峙镜头靠光线、烟雾、披风、低吼和一句台词就能撑起史诗感。骑士面罩放下还有一个好处：台词不需要对口型。

**怎么填变量**：[火山口] 换成"冰封的悬崖""暴雨中的古城墙""沙漠神殿"，配色和环境声随之调整（冰：冰蓝、风雪声；沙漠：金黄、风沙声）。台词保持一句、10–15 字。

**常见失败与调整**：
- 龙有四只翅膀或六条腿：在 description 里写清"一对翅膀、四条腿"。
- 推进太快变成冲过去：camera_movement 写"极其缓慢、几乎察觉不到的推进"。
- 画面过暗：保留"熔岩逆光"，并加"龙眼和剑身的光照亮骑士轮廓"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "wide shot capturing both the knight and dragon in full, framed by the circular edge of the volcanic crater",
    "lens": "35mm",
    "frame_rate": "24fps",
    "camera_movement": "slow dolly-in toward the confrontation"
  },
  "subject": {
    "description": "a lone knight clad in scorched steel armor, visor down, standing firm with sword drawn",
    "wardrobe": "weathered plate armor with glowing runes etched across the chest and greaves",
    "props": "a massive two-handed sword with a molten core, steaming slightly in the heat"
  },
  "scene": {
    "location": "atop a jagged volcanic crater rim surrounded by flowing rivers of lava",
    "time_of_day": "twilight",
    "environment": "dense smoke plumes, glowing magma cracks in the rock, ash drifting in the air"
  },
  "visual_details": {
    "action": "the dragon snarls, wings spread wide, smoke curling from its nostrils as the knight plants his stance",
    "special_effects": "fiery embers drifting, mild lens flare from lava reflections, dragon eyes glowing with intensity",
    "hair_clothing_motion": "the knight's cape whips violently in the thermal updrafts"
  },
  "cinematography": {
    "lighting": "backlit by lava and ambient twilight, casting dramatic silhouettes",
    "color_palette": "molten orange, deep crimson, steel grey, and obsidian black",
    "tone": "tense, mythical, with a sense of ancient confrontation"
  },
  "audio": {
    "music": "epic orchestral swell with tribal drums and deep brass",
    "ambient": "rumbling earth, crackling lava, distant eruptions",
    "sound_effects": "dragon growl, clinking armor, fire sizzles",
    "mix_level": "cinematic mix with dynamic range emphasizing tension"
  },
  "dialogue": {
    "character": "Knight",
    "line": "I am the flame's end, beast. Your time has come.",
    "subtitles": true
  }
}
```

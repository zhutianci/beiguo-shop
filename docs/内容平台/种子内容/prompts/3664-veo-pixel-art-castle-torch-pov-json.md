---
title: veo 3 JSON 提示词：像素风第一视角走向黑暗城堡（举火把 · 复古 RPG 游戏画面）
slug: veo-pixel-art-castle-torch-pov-json
model: veo
topics: [motion-graphics, cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 复古 RPG 游戏风格的像素动画：第一人称举着火把，沿山谷小路走向雾气缭绕的黑暗城堡，远处是像素小村庄。适合独立游戏宣传、复古风视频背景、播客 / 直播的等待画面。
prompt: |
  {
    "shot": {
      "composition": "第一人称视角，画面左侧边缘可以看到左手举着一支闪烁的火把",
      "lens": "模拟像素画镜头，带复古游戏画面质感",
      "frame_rate": "12 帧，匹配经典像素动画",
      "camera_movement": "沿着蜿蜒的山谷小路缓慢向前推进"
    },
    "subject": {
      "description": "看不见玩家角色，只有举火把的手；正走向一座黑暗的城堡",
      "props": "左手的火把发出像素化的闪烁火光"
    },
    "scene": {
      "location": "郁郁葱葱的绿色山谷，一条蜿蜒的土路",
      "time_of_day": "黄昏",
      "environment": "起伏的山丘上点缀着像素小村庄的房子，一座阴森的[黑暗城堡]耸立在山顶，城堡脚下雾气缭绕"
    },
    "visual_details": {
      "action": "火光随着走动轻轻摇晃；雾气在城堡脚下盘旋",
      "special_effects": "像素风雾气，火把周围的光晕，视差滚动的山丘"
    },
    "cinematography": {
      "lighting": "火把作为主光，配合暮色的环境光",
      "color_palette": "柔和的绿、浅棕、深灰，与温暖的橙色火光形成对比",
      "tone": "神秘、冒险、略带不祥"
    },
    "audio": {
      "music": "循环的复古管弦冒险配乐",
      "ambient": "轻柔的风声，远处的狼嚎，村庄的动物叫声",
      "sound_effects": "火把噼啪声，踩在土路上的脚步声"
    }
  }
negativePrompt: 写实风格，3D 渲染，平滑高清画面，乱码文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/pixel_art_castle_adventure.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；删去不适用的服装与台词字段；城堡改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取开场、中段村庄、接近城堡三帧。
verify:
  - Veo 实测 3 次：像素风格是否稳定，视差滚动效果是否出现
---
**时长与镜头**：8 秒一个缓慢推进的第一视角镜头。像素风视频的要点是三个关键词：像素画质感、低帧率顿挫、视差滚动（前景、中景、远景以不同速度移动），三者都写进去，模型才会做出"游戏画面"的感觉，否则容易变成普通的插画动画。

**怎么用**：做独立游戏宣传时，把城堡换成你游戏的主要地点；做直播等待画面或播客背景，可以把 camera_movement 改成"几乎不动，只有火光和雾气在动"，适合循环播放。

**怎么填变量**：[黑暗城堡] 换成"山顶的魔法塔""海边的灯塔""废弃的太空站"（换成科幻主题时，火把也改成手电筒）。

**常见失败与调整**：
- 变成高清写实：在 lens 和 negativePrompt 里都强调像素。
- 火把的手出现两只：写"只有一只左手出现在画面左下角"。
- 城堡越走越远：写"城堡随着前进逐渐变大"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "first-person perspective with the left hand holding a flickering torch visible at the edge of frame",
    "lens": "pixel-art simulated lens with a retro game overlay aesthetic",
    "frame_rate": "12fps to match classic pixel animation",
    "camera_movement": "slow forward tracking along a winding valley path"
  },
  "subject": {
    "description": "player character unseen except for torch hand; journeying toward a dark castle",
    "wardrobe": "not visible, implied medieval attire from torch-bearing hand",
    "props": "lit torch in left hand emitting pixelated flickers of light"
  },
  "scene": {
    "location": "lush green valley with a winding dirt path",
    "time_of_day": "dusk",
    "environment": "tiny pixel village houses dotting the rolling hills, mist swirling around a looming dark castle on a mountain"
  },
  "visual_details": {
    "action": "torchlight sways subtly with movement; mist curls at castle base",
    "special_effects": "pixel-art style fog, glow around torch, parallax scrolling hills",
    "hair_clothing_motion": "not applicable due to first-person perspective"
  },
  "cinematography": {
    "lighting": "torchlight as key light with ambient twilight illumination",
    "color_palette": "muted greens, soft browns, dark greys with warm orange torchlight contrast",
    "tone": "mysterious, adventurous, slightly ominous"
  },
  "audio": {
    "music": "looping retro-style orchestral adventure score",
    "ambient": "soft wind, distant howling, village animal sounds",
    "sound_effects": "torch crackling, footsteps on dirt path",
    "mix_level": "game-level mix with music dominant, ambient low, SFX balanced"
  },
  "dialogue": {
    "character": "",
    "line": "",
    "subtitles": false
  }
}
```

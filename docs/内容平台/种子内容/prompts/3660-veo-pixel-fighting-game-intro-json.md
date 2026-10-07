---
title: veo 3 JSON 提示词：像素风格格斗游戏开场动画（16-bit 关卡切换 + 解说员"FIGHT"）
slug: veo-pixel-fighting-game-intro-json
model: veo
topics: [motion-graphics, cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 复古街机像素风的格斗游戏片头：原创的快餐主题角色摆出格斗姿势，三个关卡像素硬切，连招火花和薯条爆炸，最后解说员一声"开打"。适合游戏宣传、餐饮品牌趣味广告、复古风视频片头。
prompt: |
  {
    "shot": {
      "composition": "广角像素风开场动画，角色两两对峙",
      "lens": "模拟 16-bit 横版卷轴游戏画面",
      "frame_rate": "12 帧，还原复古像素动画的顿挫感",
      "camera_movement": "横向平移，关卡之间用像素化硬切"
    },
    "subject": {
      "description": "原创的[快餐吉祥物]角色，摆出夸张的格斗姿势，头顶有发光的连招能量条",
      "wardrobe": "虚构的服装：炭烤铠甲、汽水披风、油炸锅手套",
      "props": "巨大的番茄酱瓶、像素汉堡盾牌、连招道具"
    },
    "scene": {
      "location": "三个关卡依次切换：[得来速道场]、油腻街头对决、炸锅竞技场",
      "time_of_day": "每关不同——道场是黄昏，街头是霓虹夜晚，炸锅竞技场是灼热高温",
      "environment": "像素小人观众欢呼，滋滋冒油的特效，霓虹招牌"
    },
    "visual_details": {
      "action": "角色释放必杀技，收集油滴金币，放出食物主题的终结技",
      "special_effects": "连招火花，爆开的薯条，像素化的油花飞溅",
      "hair_clothing_motion": "像素头发弹动，衣服随 16-bit 打击帧摆动"
    },
    "cinematography": {
      "lighting": "像素化高光和闪烁的界面特效",
      "color_palette": "鲜艳的红、黄、紫和霓虹绿",
      "tone": "幽默、高能、街机式混乱"
    },
    "audio": {
      "music": "芯片音乐摇滚，合成器铜管和 8-bit 低音",
      "ambient": "街机人群的嘈杂声，炸锅滋滋声",
      "sound_effects": "拳击的啪啪声，番茄酱爆射声，连招时的叮叮声"
    },
    "dialogue": {
      "character": "解说员旁白",
      "line": "[谁会成为连招之王？准备……开打！]",
      "subtitles": false
    }
  }
negativePrompt: 真实品牌吉祥物，写实风格，3D 渲染，乱码文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/fast_food_fighter_pixel_battle.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；强调角色为原创（避免模仿真实品牌吉祥物）；解说台词译为中文并设为变量；删去混音比例字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取三个关卡各一帧。
verify:
  - Veo 实测 3 次：像素风格是否稳定、是否出现类似真实快餐品牌吉祥物的形象
  - 画面里的界面文字（能量条、关卡名）是否乱码
---
**时长与镜头**：8 秒内切三个关卡，每关 2–3 秒，最后一句解说"开打"收尾。frame_rate 写"12 帧"是为了让模型模仿老游戏的顿挫感，真实输出帧率由平台决定，这里只是风格提示。

**怎么用**：这条最适合做"游戏化"的品牌趣味片——把快餐角色换成你的产品拟人角色（例如"咖啡豆战士 vs 奶茶法师"），关卡换成你的门店场景。注意 subject 里写明"原创角色"，不要让模型去模仿真实品牌的吉祥物，既有侵权风险，也可能被平台拦截。

**怎么填变量**：[快餐吉祥物] 换成"蔬菜战士""文具怪兽""家电机器人"；[得来速道场] 换成你想要的关卡名。解说台词保持短，8 秒里只够一句。

**常见失败与调整**：
- 画风变成 3D：在 lens 和 negativePrompt 里都强调像素和"非 3D"。
- 界面文字乱码：可以接受像素风的"伪文字"，或写"能量条只有色块，没有文字"。
- 三个关卡糊在一起：改成两个关卡，或分三条生成后剪辑。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "wide-angle pixel-art intro sequence with character face-offs",
    "lens": "virtual 16-bit side-scroll style",
    "frame_rate": "12fps for authentic retro feel",
    "camera_movement": "side panning with pixelated smash cuts between stages"
  },
  "subject": {
    "description": "parody fast food mascots in exaggerated fighting poses with glowing combo meters",
    "wardrobe": "fictional uniforms like flame-grilled armor, soda cape, deep-fryer gloves",
    "props": "oversized ketchup bottles, pixel burger shields, combo power-ups"
  },
  "scene": {
    "location": "sequence: Drive-Thru Dojo, Grease Street Showdown, and Fryer Pit Arena",
    "time_of_day": "varies per level — dusk at the dojo, neon-lit night in the street, blazing heat in the fryer pit",
    "environment": "animated pixel customers cheering, sizzling effects, neon signage"
  },
  "visual_details": {
    "action": "fighters launch special moves, collect greasy tokens, unleash food-themed finishers",
    "special_effects": "combo sparks, exploding fries, pixelated grease splashes",
    "hair_clothing_motion": "pixel hair bounces and clothing flaps with 16-bit impact frames"
  },
  "cinematography": {
    "lighting": "pixelated highlights and flashing UI effects",
    "color_palette": "vibrant reds, yellows, purples and neon greens",
    "tone": "humorous, high-energy, arcade chaos"
  },
  "audio": {
    "music": "chiptune rock with synth brass and 8-bit bass drops",
    "ambient": "arcade crowd murmurs, sizzling fryer loops",
    "sound_effects": "punch thwacks, ketchup blast, bell dings on combos",
    "mix_level": "sound FX and music equally loud in retro mix"
  },
  "dialogue": {
    "character": "announcer voiceover",
    "line": "Who will be crowned the King of Combo? Get ready... FIGHT!",
    "subtitles": false
  }
}
```

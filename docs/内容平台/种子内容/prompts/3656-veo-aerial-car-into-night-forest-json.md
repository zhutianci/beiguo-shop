---
title: veo 3 JSON 提示词：航拍汽车驶入夜晚森林（跟拍后摇臂升向月亮 · 悬疑片开场）
slug: veo-aerial-car-into-night-forest-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 悬疑片 / 公路片的经典开场镜头：航拍一辆老式肌肉车从公路右转进土路、扬起尘土、被巨大的森林吞没，镜头再升起对准树梢上的月亮。适合短片片头、悬疑号开场、"一个镜头交代孤立感"的练习。
prompt: |
  {
    "shot_name": "航拍镜头 - 汽车驶入森林土路",
    "camera": {
      "type": "广角远景",
      "movement": "航拍，汽车从公路右转驶上土路，镜头跟随汽车，随后摇臂升起，对准森林树梢上方天空中的月亮",
      "lens": "电影级变形镜头",
      "focus": "汽车和森林都清晰，随后汽车渐渐远去",
      "lighting_direction": "傍晚天空形成逆光"
    },
    "setting": {
      "environment": "一条公路，和一条通向茂密、杂草丛生的[针叶林]的狭窄土路",
      "time_of_day": "夜晚",
      "atmosphere": "从孤立逐渐转为神秘、不祥"
    },
    "subject": {
      "main_subject": "一辆[七十年代末的肌肉车]",
      "details": "扬起大量尘土，逐渐变成一个渺小、远去的光点，尾灯越来越远"
    },
    "visual_style": {
      "genre": "动作 / 科幻剧情片",
      "film_stock": "35mm 胶片质感，钨丝灯片的偏冷色",
      "color_grade": "粗粝、自然，阴影逐渐加深成紫色，电影感"
    },
    "composition": {
      "elements": "汽车被巨大、压迫的树木吞没；道路消失在荒野中"
    },
    "audio": {
      "sound": "轮胎碾过泥土的嘎吱声，树叶沙沙声，越来越深的寂静"
    }
  }
negativePrompt: 汽车变形，道路断裂，画面文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/aerial_car_forest_night.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；删去胶片型号、镜头品牌和分级字段；森林与车型改为变量；implied_elements 字段改名为 audio"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"右转驶上土路""尾灯远去""升向月亮"三帧。
verify:
  - Veo 实测 3 次：中文值 JSON 与英文原版各生成一次，对比运镜执行情况
  - 夜景暗部是否过黑看不清汽车
---
**时长与镜头**：一个连续的航拍长镜头：跟拍汽车 → 汽车远去 → 摇臂升起对准月亮。Veo 单条一般 8 秒（Veo 3.1 可选 4 / 6 / 8 秒，以官方说明为准），8 秒正好够"跟—远—升"三步，不要再往里加动作。

**JSON 怎么读**：camera 管怎么拍（类型、运动、焦点、光的方向），setting 管在哪儿、什么氛围，subject 管拍谁，visual_style 管画面质感，audio 管声音。改其中一项不会影响其他项，这是 JSON 提示词最方便的地方——比如只把 time_of_day 改成"黄昏"，就是另一条片子。

**怎么填变量**：[针叶林] 换成"沙漠峡谷""芦苇荡""雪原"；[七十年代末的肌肉车] 换成"一辆皮卡""一辆旧公交车""一个骑自行车的人"。atmosphere 一栏决定情绪：写"从孤立转为温暖、回家"就变成温情片开场。

**常见失败与调整**：
- 夜里太黑看不见车：time_of_day 改成"刚入夜的蓝调时刻"，并保留"尾灯"。
- 摇臂升起没执行：把 movement 拆成两句，单独写"最后镜头向上升起，画面中央是月亮"。
- 画面出现 JSON 文字或括号：改用英文原版，或把 JSON 改写成一段普通中文描述。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot_name": "Aerial Shot (AS) - Car on Dirt Road into Forest",
  "camera": {
    "type": "Wide Shot",
    "movement": "Aerial shot, car turns right off highway onto dirt road, following the car then craning up at the moon in the sky above the forest trees",
    "lens": "Panavision lenses",
    "focus": "Car and forest in focus, then car fading",
    "lighting_direction": "Backlit by evening sky"
  },
  "setting": {
    "environment": "Highway and a Narrow dirt road leading into dense, overgrown Pacific Northwest forest",
    "time_of_day": "Night",
    "atmosphere": "Shifting from isolated to mysterious and ominous"
  },
  "subject": {
    "main_subject": "Late 1970s muscle car",
    "details": "Kicking up significant dust, becoming a tiny, fading speck, tail lights receding"
  },
  "visual_style": {
    "genre": "Action/Sci-Fi Drama",
    "film_stock": "Kodak 35mm film (Eastman 100T 5247)",
    "color_grade": "Gritty, natural with deepening purple shadows, cinematic",
    "rating_tone": "PG-13",
    "overall_feel": "Cinematic masterpiece"
  },
  "composition": {
    "elements": "Car swallowed by immense, looming trees; road disappearing into wilderness"
  },
  "implied_elements": {
    "sound": "Crunch of tires on dirt, rustling leaves, growing silence"
  }
}
```

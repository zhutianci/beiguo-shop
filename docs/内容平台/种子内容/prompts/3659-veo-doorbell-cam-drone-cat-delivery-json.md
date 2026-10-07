---
title: veo 3 JSON 提示词：门铃摄像头拍到无人机吊着猫送外卖（鱼眼监控视角 · 冷幽默）
slug: veo-doorbell-cam-drone-cat-delivery-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 模仿"智能门铃监控画面"的冷幽默短视频：一架无人机缓缓降落，下面吊着一只臭脸虎斑猫，猫叼着外卖纸袋，停在门口直勾勾盯着镜头。适合搞笑号、萌宠号、外卖或智能家居品牌的趣味广告。
prompt: |
  {
    "title": "POV：门铃摄像头",
    "camera": {
      "type": "鱼眼镜头",
      "movement": "固定不动",
      "framing": "固定构图"
    },
    "duration_seconds": 8,
    "time_of_day": "白天",
    "lighting": "柔和的阴天光",
    "setting": {
      "location": "郊区住宅的前门门廊",
      "details": "安静的居民区"
    },
    "subject": {
      "animal": "一只臭着脸的[虎斑猫]",
      "breed": "美国短毛猫",
      "attire": "无人机吊带"
    },
    "action": [
      { "time": "0-2s", "description": "无人机从上方慢慢降下来" },
      { "time": "2-5s", "description": "猫吊在无人机下方，嘴里叼着一个[外卖纸袋]" },
      { "time": "5-8s", "description": "无人机在门的高度悬停，猫直勾勾地盯着镜头" }
    ],
    "visual_style": [
      "超写实",
      "冷幽默写实"
    ],
    "audio": {
      "type": "只有自然环境声",
      "elements": ["风声", "轻柔的无人机嗡嗡声", "远处的鸟叫"]
    },
    "mood": [
      "荒诞",
      "面无表情的幽默"
    ],
    "effects": {
      "music": "没有音乐",
      "text": "没有文字",
      "transitions": "没有转场"
    },
    "composition": "鱼眼圆形画面占满全屏，像智能门铃的监控画面"
  }
negativePrompt: 猫受伤，猫挣扎，背景音乐，文字，时间戳乱码，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/doorbell_camera_drone_cat.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；原文的快餐品牌纸袋改为通用\"外卖纸袋\"变量；猫的花色改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"无人机降下""猫叼纸袋悬停""盯着镜头"三帧。
verify:
  - Veo 实测 3 次：鱼眼监控画面感是否成立
  - 画面里是否出现乱码时间戳或 UI 文字
---
**时长与镜头**：8 秒、固定机位、无剪辑，用 action 数组把三个时间段写清楚。"监控 / 门铃 / 行车记录仪视角"是 AI 搞笑视频的高频格式：机位不动、鱼眼畸变、画质普通，反而让荒诞的内容显得"像真的发生了"。

**怎么填变量**：[虎斑猫] 换成"柯基""鹦鹉""一只鸭子"；[外卖纸袋] 换成"一束花""一个快递盒""一份报纸"。做品牌趣味广告时，把纸袋换成自家包装，但品牌字样建议后期贴，模型画的 logo 基本会乱码。

**动物福利提醒**：发布时注意不要表现动物受伤、痛苦或被虐待，负面提示词里已写"猫受伤、猫挣扎"，画面保持"臭脸但淡定"的喜剧感。

**常见失败与调整**：
- 画面变成普通摄像机：composition 里强调"圆形鱼眼画面，边缘畸变明显"。
- 门铃画面出现乱码时间戳：effects 里保留"没有文字"。
- 猫一直在晃：写"无人机悬停平稳，猫只眨眼和甩尾巴"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "title": "POV: doorbell camera",
  "camera": {
    "type": "fisheye lens",
    "movement": "stationary",
    "framing": "fixed framing"
  },
  "duration_seconds": 8,
  "time_of_day": "daytime",
  "lighting": "soft overcast lighting",
  "setting": {
    "location": "suburban front porch",
    "details": "quiet residential neighborhood"
  },
  "subject": {
    "animal": "grumpy tabby cat",
    "breed": "American Shorthair",
    "attire": "drone harness"
  },
  "action": [
    {
      "time": "0-2s",
      "description": "drone approaches from above, slow descent"
    },
    {
      "time": "2-5s",
      "description": "cat dangling below, holding McDonald's paper bag"
    },
    {
      "time": "5-8s",
      "description": "drone pauses at door height, cat stares directly into lens"
    }
  ],
  "visual_style": [
    "hyper-realistic",
    "comedic realism"
  ],
  "audio": {
    "type": "natural ambient sound only",
    "elements": [
      "wind",
      "soft drone buzz",
      "faint birds"
    ]
  },
  "mood": [
    "absurd",
    "deadpan humor"
  ],
  "effects": {
    "music": "no music",
    "text": "no text",
    "transitions": "no transitions"
  },
  "composition": "full frame inside circular fisheye overlay, like a smart doorbell feed"
}
```

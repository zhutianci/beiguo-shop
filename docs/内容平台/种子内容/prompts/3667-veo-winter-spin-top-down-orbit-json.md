---
title: veo 3 JSON 提示词：雪中旋转的女孩俯拍环绕镜头（相机与人同步旋转 · 1:1 唯美慢动作）
slug: veo-winter-spin-top-down-orbit-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "1:1"
needsRefImage: false
useCase: 唯美的冬日人像动态镜头：女孩戴着冬花花冠、张开双臂在雪中旋转，相机从正上方与她同步环绕、加速再减速，雪花和发丝飞散。适合冬季写真视频、服装品牌氛围片、音乐 MV 片段、社交头像动图。
prompt: |
  {
    "composition": {
      "shot_type": "动态的高角度环绕「俯拍」镜头",
      "format": "1:1 方形画幅（亲密、聚焦、像肖像一样）",
      "camera_motion": "镜头从女生正上方开始，与她的旋转完全同步地平滑环绕。2–5 秒，她的旋转和镜头的环绕一起轻轻加速，形成更强烈的螺旋视觉，镜头略微推近到她脸部的中景。6–8 秒，旋转和环绕优雅地减速，给镜头一种温柔的收束感。",
      "frame_rate": "轻微的空灵慢动作，强调动作的优雅而不显得凝滞",
      "film_grain": "非常细腻、几乎察觉不到的颗粒，增加柔和的质感"
    },
    "main_subject": {
      "description": "一位二十四岁的女生，带着纯粹、安宁的喜悦。她仰着头，望向上方的镜头。脸颊和鼻梁上有雀斑，几缕[栗色]头发向外飞散，捕捉着光线，眼睛闪着惊奇的光。",
      "wardrobe": "一顶由冬季花朵和霜叶编成的花冠，一条厚实的奶油色粗针织羊毛围巾，一件[墨绿色]厚羊毛大衣，表面落着细碎洁白的雪花。",
      "behaviour": "她张开双臂、与地面平行，连续流畅地旋转，速度在整个镜头中略有变化。动作平稳可控，她看起来完全平静、内心温暖，尽管天气寒冷。"
    },
    "environment": {
      "location": "[雪后的森林空地]，地面是厚厚的新雪",
      "atmosphere": "雪花缓缓飘落，在空中随旋转形成螺旋"
    },
    "audio": {
      "ambient": "轻柔的风声，雪落的细微声响，远处一两声鸟鸣",
      "music": "没有背景音乐"
    }
  }
negativePrompt: 人物换脸，四肢畸形，头发穿模，画面撕裂，文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/winter_forest_spinning_joy.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；删去摄影机与镜头型号；原文较长的环境与声音部分精简改写；发色、大衣颜色和地点改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取俯拍起幅、加速螺旋、推近脸部三帧。
verify:
  - Veo 实测 3 次：相机与人物同步旋转是否被执行（复杂运镜，预期成功率不高）
  - 旋转中人物脸部的一致性
---
**时长与镜头**：8 秒、一个俯拍环绕镜头，用时间段写出"同步旋转 → 一起加速并推近 → 一起减速收束"的节奏。相机和人物同步旋转是很难的运镜，原作把它写得极其细致（从哪开始、何时加速、何时推近、何时减速），这正是复杂运镜的写法：越难的动作越要拆成时间段。

**怎么填变量**：[栗色] 头发、[墨绿色] 大衣按造型写；[雪后的森林空地] 换成"樱花树下""秋天的银杏落叶地""海边沙滩"，花冠随季节换成"樱花""银杏叶""贝壳"。1:1 方形画幅适合做头像动图和小红书封面视频。

**常见失败与调整**：
- 相机没有同步旋转，只是固定俯拍：把 camera_motion 简化成"镜头在正上方，与她同方向缓慢环绕"。
- 旋转时手臂变长或多出来：写"双臂始终张开、与身体比例正常"。
- 脸部转着转着变了：缩短时长，或改成"镜头只环绕半圈"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版（原文较长，此处节选）

```json
{
  "composition": {
    "shot_type": "Dynamic high-angle orbiting 'top-down' shot",
    "format": "1:1 Square Format (for an intimate, focused, portrait-like feel)",
    "camera": "ARRI Alexa 65 (for its large sensor and beautiful color rendition)",
    "lens": "50mm ARRI Signature Prime lens (for a clean, natural, and flattering perspective)",
    "camera_motion": "The camera begins directly above the woman, orbiting smoothly in perfect sync with her spin. From 00:02 to 00:05, her spin and the camera's orbit gently accelerate, creating a more intense spiraling visual. The camera pushes in slightly to a tighter medium shot on her face. From 00:06 to 00:08, the spin and orbit gracefully decelerate, giving the shot a sense of gentle conclusion.",
    "frame_rate": "Captured at 48 fps and rendered at 23.98 fps to create a subtle, ethereal slow-motion effect that enhances the grace of the movement without making it static.",
    "film_grain": "Very fine, almost imperceptible grain to add a soft, organic texture."
  },
  "main_subject": {
    "description": "A 24-year-old woman with an expression of pure, serene joy. Her head is tilted back, gazing upward toward the camera. Freckles are visible across her cheeks and nose. Loose strands of her auburn/chestnut hair fly outwards, catching the light. Her visible eye—a clear emerald or hazel—gleams with wonder.",
    "wardrobe": "A beautiful flower crown of winter blossoms and frosted leaves. A thick, cream-colored knit wool scarf. A deep green or charcoal-colored heavy wool coat, its surface dusted with delicate, pristine snowflakes.",
    "behaviour": "She spins continuously and fluidly, with her arms extended outward parallel to the ground. Her motion is smooth and controlled, varying slightly in speed throughout the shot. She appears completely at peace and filled with warmth, despite the cold setting."
  },
  "secondary_subject": {
    "description": "A small, joyful penguin (e.g., an Adélie penguin). It appears utterly delighted.",
    "behaviour": "It trots in a happy, tight circle on the snow, perfectly matching the woman's spinning pace. Its tiny feet shuffle with playful energy, and its flippers are held slightly out from its sides as if mimicking her extended arms. It frequently looks up at her with adoration."
  },
  "background_element": {
    "description": "A classic, static three-ball snowman, positioned just beyond the dancer's spinning radius.
……
```

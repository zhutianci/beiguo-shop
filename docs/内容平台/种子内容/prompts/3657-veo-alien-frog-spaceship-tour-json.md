---
title: veo 3 JSON 提示词：外星青蛙带你参观飞船（角色口播 + 道具变出披萨 · 搞笑短视频）
slug: veo-alien-frog-spaceship-tour-json
model: veo
topics: [cinematic, short-drama]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 让一个原创虚拟角色对着镜头口播、和道具互动：兴奋的外星青蛙走到发光的机器前，"想一下披萨"机器里就变出一块悬浮披萨。适合虚拟 IP 短视频、搞笑口播、产品功能的拟人化讲解。
prompt: |
  {
    "scene_summary": "一只兴奋的外星青蛙生物，带观众边走边参观一艘飞船的驾驶舱。",
    "character": {
      "type": "外星青蛙生物",
      "personality": [
        "表情丰富",
        "兴奋",
        "精力充沛"
      ],
      "features": {
        "eyes": "表情丰富的两栖动物大眼睛",
        "mouth": "表情丰富的嘴巴",
        "face": "生动的嘴唇和面部表情",
        "movement": "流畅、夸张的手势"
      },
      "voice": "年轻、语速快、网络流行语口吻"
    },
    "environment": {
      "location": "飞船内部",
      "key_object": {
        "name": "[黏糊糊永动料理机]",
        "description": "一台大机器，散发温暖的光，玻璃圆筒里装满橙色黏液"
      }
    },
    "action_sequence": [
      {
        "camera": "镜头跟着他走",
        "dialogue": "[饿了想吃披萨？我们有这台黏糊糊永动料理机。]",
        "gesture": "走到画面左侧，摸了摸那台大机器。"
      },
      {
        "dialogue": "[你只要心里想着披萨，然后——啵！]",
        "result": "机器里凭空形成一块悬浮的披萨。"
      },
      {
        "gesture": "他低头看看披萨，然后兴奋地直视镜头。",
        "dialogue": "[晚饭靠意念，兄弟！]"
      }
    ],
    "visuals": {
      "lighting": ["漫射的影棚光", "机器反射的暖色光", "柔和阴影"],
      "style": "柔和的电影调色"
    },
    "negative_prompt": ["背景音乐", "高反差", "浓重阴影", "曝光不足"]
  }
negativePrompt: null
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/alien_frog_spaceship_tour.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；三句台词意译为中文口语并设为变量；机器名称改为变量；删去渲染技术字段；原文\"Z 世代口音\"改为\"年轻、网络流行语口吻\""
imageBrief: 仓库没有示例图。站长生成 1 条，截取"边走边介绍""机器里变出披萨""直视镜头"三帧。
verify:
  - Veo 实测 3 次：中文台词的口型和语气是否自然（可与英文台词版对比）
  - 角色在三段动作中造型是否一致
---
**时长与镜头**：8 秒内三句台词 + 一个道具特效：介绍机器 → 变出披萨 → 对镜头总结。台词是 Veo 3 系列的强项，但每句要短（中文 10–15 字以内），三句已经是 8 秒的上限，再多就会说不完被截断。

**action_sequence 的写法值得学**：把镜头、台词、动作、结果按顺序放进一个数组，每一项是一个"节拍"。这比把所有内容写成一段话更容易控制"先说什么、再做什么"。做产品拟人化讲解时，把青蛙换成你的品牌吉祥物，机器换成你的产品，三句台词就是三个卖点。

**怎么填变量**：[黏糊糊永动料理机] 和三句台词都可以换。角色换成"一只机器人管家""一只会说话的盆栽"，环境换成"厨房""实验室"。

**常见失败与调整**：
- 台词说不完：删到两句，或每句砍到 8 个字左右。
- 自动配了背景音乐：保留 negative_prompt 里的"背景音乐"。
- 披萨出现得太突然或没出现：result 里写"橙色黏液旋转、慢慢凝固成一块披萨"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "scene_summary": "An excited alien frog creature gives a walking tour of a spaceship's drive room.",
  "character": {
    "type": "alien frog creature",
    "personality": [
      "expressive",
      "excited",
      "high energy"
    ],
    "features": {
      "eyes": "expressive amphibian eyes",
      "mouth": "expressive mouth",
      "face": "expressive lips and face",
      "movement": "expressive fluid gestures"
    },
    "accent": "gen z"
  },
  "environment": {
    "location": "space ship",
    "key_object": {
      "name": "glop perpetugooper",
      "description": "large machine emitting warm glowing light with glass cylinder filled with orange slime"
    }
  },
  "action_sequence": [
    {
      "camera": "tracks him as he walks",
      "dialogue": "And if you're hungry and you want some za we got the glop perpetu-gooper",
      "gesture": "Walks to screen left and touches a large machine."
    },
    {
      "dialogue": "You just think za and bloop!",
      "result": "A floating pizza forms inside the machine."
    },
    {
      "gesture": "He glances down at the pizza, then looks directly at the camera with excitement.",
      "dialogue": "Manifest your dinner bro!"
    }
  ],
  "visuals": {
    "lighting": [
      "diffuse studio lighting",
      "warm bounce light from machine",
      "soft shadows"
    ],
    "style": "soft cinematic color grading",
    "technique": "tonemapped HDR"
  },
  "render_settings": {
    "negative_prompt": {
      "exclude": [
        "music",
        "high contrast",
        "dark shadows",
        "underexposed"
      ]
    }
  }
}
```

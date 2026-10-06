---
title: veo 3 JSON 提示词：蜜蜂第一视角穿越厨房（微距高速飞行）
slug: veo-bee-pov-kitchen-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 用 JSON 结构化提示词生成"蜜蜂视角在阳光厨房里高速穿梭、最后落在窗台花上"的微距 FPV 镜头；也是学习 Veo JSON 提示词写法的入门样例，换个主角就能做"小动物视角穿越"系列。
prompt: |
  {
    "description": "[蜜蜂]第一视角在阳光照进来的[厨房]里高速飞行：在厨具之间闪避，从盘子下面俯冲穿过，钻过蒸汽。表现蜜蜂飞行的疯狂速度和精准走位，穿插惊险的擦身而过和厨房物品的漂亮微距镜头。画面中没有文字。",
    "style": "电影感，微距摄影",
    "camera": "第一人称视角，快速移动，戏剧化的浅景深",
    "lighting": "自然阳光从窗户照进来，照亮蒸汽和空中的颗粒",
    "environment": "正在准备饭菜、忙碌的家庭厨房",
    "elements": [
      "闪亮的厨房用具",
      "锅里升起的蒸汽",
      "飘在空中的面粉颗粒",
      "色彩鲜艳的新鲜蔬果",
      "咕嘟冒泡的锅",
      "轻轻摇晃的香草",
      "滴落的蜂蜜",
      "正在切菜的刀"
    ],
    "motion": "快速、精准的飞行路线，带有戏剧性的急转和俯冲",
    "ending": "[蜜蜂]安全降落在窗台小花园里的一朵花上",
    "audio": "蜜蜂翅膀的嗡嗡声随速度起伏，掠过时锅碗的轻响和切菜声一闪而过，降落时一切安静下来，只剩窗外的鸟鸣",
    "text": "无"
  }
negativePrompt: null
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/bee_flight_kitchen_adventure.md
  author: liu-kaining
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: JSON 的值译为中文、键名保留英文；主角和场景改为变量；新增 audio 字段；删去仅作标签用途的 keywords 字段
imageBrief: 仓库没有示例图。生成 1 条，截取"穿过蒸汽""从刀边擦过""落在花上"三帧作展示图。
verify:
  - 在 Veo 3 实测：中文值 JSON 与英文原版 JSON 各 3 次，对比画面和音效效果
  - Veo 是否把 JSON 里的字段名或括号当成画面文字生成出来
  - 确认原仓库文件仍可访问
---
**JSON 提示词是什么**：把画面拆成 description（发生什么）、camera（怎么拍）、lighting（光）、environment（环境）、elements（画面里要有的东西）、motion（怎么动）、ending（怎么结束）、audio（声音）几个字段。好处是不会漏项，改一项不影响其他项。Veo 并不要求必须用 JSON，普通段落也可以，JSON 只是更方便管理。

**时长与镜头**：Veo 单条一般 8 秒，elements 写了 8 样东西，实际不会每样都出现。想让某几样一定出现，就把它写进 description 里。

**怎么填变量**：主角换成"[一只蜂鸟]""[一架迷你无人机]"，场景换成"[图书馆]""[花市]"，再把 elements 换成那个场景里的东西，就是一条新的"小视角穿越"视频。

**常见失败与调整**：
- 飞得太快看不清：把 motion 改成"快慢交替，在微距物品前短暂减速"。
- 画面出现文字或大括号：保留 "text": "无"；仍出现时改用英文原版。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "description": "High-speed POV flight of a bee zooming through a sunlit kitchen. Dodging between utensils, diving under plates, weaving through steam. Capturing the frenetic energy and precise navigation of bee flight, with dramatic near-misses and beautiful macro shots of kitchen elements. No text.",
  "style": "cinematic, macro photography",
  "camera": "first-person POV, rapid movement, dramatic depth of field",
  "lighting": "natural sunlight streaming through windows, catching steam and particles",
  "environment": "busy home kitchen during meal prep",
  "elements": [
    "gleaming kitchen utensils",
    "rising steam from pots",
    "floating flour particles",
    "colorful fresh produce",
    "bubbling pots",
    "swaying herbs",
    "dripping honey",
    "knife chopping vegetables"
  ],
  "motion": "rapid, precise flight paths with dramatic turns and dives",
  "ending": "bee lands safely on a flower in a windowsill herb garden",
  "text": "none",
  "keywords": [
    "bee POV",
    "kitchen flight",
    "macro shots",
    "high speed",
    "dramatic movement",
    "cinematic",
    "no text"
  ]
}
```

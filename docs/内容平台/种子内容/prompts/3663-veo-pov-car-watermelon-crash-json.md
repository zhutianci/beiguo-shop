---
title: veo 3 JSON 提示词：驾驶第一视角撞上西瓜堆（挡风玻璃果汁爆溅慢动作 · 禁止项写法）
slug: veo-pov-car-watermelon-crash-json
model: veo
topics: [cinematic]
modelLabel: Veo 3
aspectRatio: "16:9"
needsRefImage: false
useCase: 驾驶座第一视角，一辆红色复古肌肉车冲向路边的西瓜堆，撞上的瞬间挡风玻璃被红色果肉和汁水糊满，慢动作滑落。适合解压、爽感短视频，也是学习"visual_rules 禁止项"写法的范例。
prompt: |
  {
    "shot": {
      "composition": "驾驶座第一人称视角，看向前挡风玻璃外。",
      "camera_motion": "比较平稳，带着汽车行驶的自然振动；撞击瞬间猛地向前一震。"
    },
    "subject": {
      "description": "一辆复古肌肉车的车内视角，画面下方能看到仪表盘、一双握着方向盘的手，以及长长的[樱桃红色]引擎盖。"
    },
    "scene": {
      "location": "一条[乡间公路]，全程只透过挡风玻璃看外面。",
      "time_of_day": "正午强烈的日光，阳光在仪表盘和挡风玻璃上形成强烈眩光。"
    },
    "visual_details": {
      "action": "汽车快速冲向路边一大堆金字塔形状的[西瓜]。撞上的一瞬间，视野被红色果肉、瓜子和汁水的爆溅瞬间糊住；撞击用慢动作呈现，西瓜碎块打在玻璃上再慢慢滑落。",
      "effects": "挡风玻璃上超写实的流体模拟，撞击前玻璃上能看到车内的细微倒影；撞击瞬间镜头和整个画面剧烈晃动。"
    },
    "cinematography": {
      "style": "沉浸式第一人称视角，强烈的真实感，运动相机 / 伪纪录片的感觉，照片级写实。"
    },
    "audio": {
      "sound_design": "车内沉闷的大马力引擎轰鸣，突然被一声响亮、湿漉漉的「咚」和「咔嚓」打断，紧接着是果肉和汁水拍在挡风玻璃上的声音。"
    },
    "visual_rules": {
      "prohibited_elements": ["司机的脸", "任何车外视角", "后视镜画面", "字幕", "说明文字", "界面元素"]
    }
  }
negativePrompt: 司机的脸，车外视角，人员受伤，字幕，界面元素，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/muscle_car_watermelon_crash.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "JSON 的值译为中文、键名保留英文；车身颜色、地点和被撞物改为变量；删去\"无循环\"字段"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"驶近西瓜堆""撞击瞬间""果汁滑落"三帧。
verify:
  - Veo 实测 3 次：visual_rules 里的禁止项是否被遵守（是否出现车外视角）
  - 注意平台对"撞车"内容的审核，必要时说明为无人受伤的趣味场景
---
**时长与镜头**：8 秒一个车内固定 POV：平稳行驶 → 冲近 → 撞击慢动作 → 果汁滑落。整条视频都"只透过挡风玻璃"，这个限制让画面非常集中，撞击的冲击力也更强。

**visual_rules 写法值得学**：prohibited_elements 列出"司机的脸、车外视角、后视镜画面、字幕"等不允许出现的东西，相当于 JSON 里的负面提示。Veo 官方建议负面提示写成"名词"而不是"不要 xxx"，这里正好是名词列表。你写其他 POV 视频时也可以加这一段，防止模型擅自切到第三人称。

**怎么填变量**：[西瓜] 换成"一堵纸箱墙""一大堆彩色气球""一片泡沫雪堆"；[乡间公路] 换成"沙漠公路""废弃停车场"。爽感视频的关键是"撞上的东西要无害且飞溅效果好"。

**常见失败与调整**：
- 撞击后切到了车外：保留 prohibited_elements，并在 shot 里重复"全程车内视角"。
- 果汁效果像贴图：写"果肉有厚度，顺着玻璃缓慢往下滑，留下红色痕迹"。
- 晃得太厉害看不清：写"撞击晃动只持续半秒"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```json
{
  "shot": {
    "composition": "First-person point-of-view (POV) from the driver's seat, looking out the front windshield.",
    "camera_motion": "Relatively steady with naturalistic vibrations from the car's movement, followed by a sudden, violent jolt forward upon impact.",
    "loop": "no"
  },
  "subject": {
    "description": "View from inside a classic muscle car. The car's dashboard, a pair of hands gripping the steering wheel, and the long, cherry red hood of the car are visible in the lower portion of the frame."
  },
  "scene": {
    "location": "An a mexican road in the country side, viewed entirely through the car's windshield.",
    "time_of_day": "Bright daylight, high noon. The sun creates a strong glare on the dashboard and parts of the windshield."
  },
  "visual_details": {
    "action": "The car drives quickly  towards a large pyramid stack of watermelons. Upon collision, the view is instantaneously and violently obscured as the windshield is splattered with an explosion of red pulp, seeds, and juice. The impact is captured in slow-motion, showing the watermelon fragments hitting and sliding down the glass.",
    "effects": "Hyper-realistic fluid simulation on the windshield glass. Subtle reflections of the car's interior are visible on the glass before impact. The camera and entire view shake violently at the moment of the crash."
  },
  "cinematography": {
    "style": "Immersive first-person POV, intense realism, action-camera or 'found-footage' feel. The quality is photorealistic, 4K resolution."
  },
  "audio": {
    "sound_design": "The muffled, interior rumble of a powerful engine. This is abruptly interrupted by a loud, shocking, wet THUMP and CRUNCH as the watermelons hit the front of the car, immediately followed by the sound of pulp and liquid slapping against the windshield glass."
  },
  "visual_rules": {
    "prohibited_elements": [
      "driver's face",
      "any view from outside the car",
      "rear-view mirror view",
      "subtitles",
      "captions",
      "UI elements"
    ]
  }
}
```

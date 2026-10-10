---
title: veo 3 提示词：高山谷地全天延时模板（黎明前—日出—黄昏—初星 · 锁死机位 · 风光片）
slug: veo-mountain-valley-dawn-to-night-timelapse
model: veo
topics: [cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 风光延时的完整骨架：同一机位从黎明前一直拍到入夜，云在奔流、影子横扫、颜色从冷蓝转暖金再褪成深蓝，前景一棵孤松始终不动。换掉地点即可，适合风光号、户外品牌、纪录片空镜和冥想背景视频。
prompt: |
  风光延时摄影，自然光一整天的循环，宏大的静默；写实，不要 HDR 过锐，不要过饱和的明信片感。16:9，约 8 秒。
  地点：[一处高山谷地]，前景：[一棵被风吹弯的孤松]。
  机位全程锁死，广角，只有一次察觉不到的缓慢推进。
  时间线：
  黎明前——山谷笼在冷蓝色的光里，孤松是一个剪影，[云在山间缓缓流动]刚刚开始；
  日出到正午——太阳冲出山脊，一缕眩光落入镜头，影子缩短、横扫过大地，云流加速；
  下午到黄昏——光线转暖，影子朝另一侧拉长，云流成金色，一只鸟横过画面一次；
  黄昏到夜晚——颜色褪成深蓝，第一批星星浮现，云流慢下来、安定下来。
  结尾：没有戏剧化的霞光大结局，没有音乐高潮，只是山谷在初星下归于安静，孤松仍在原地。
  声音：风声随时间变化，入夜后只剩极轻的虫鸣。
negativePrompt: 镜头晃动，前景移动，建筑出现，HDR 过锐，过饱和，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/nature-timelapse.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板（约 12 秒），本站合并为一条可直接复制的中文提示词并压缩为适合 Veo 单条的 8 秒；{{变量}} 改为 [方括号变量]；补充声音描述"
imageBrief: 站长生成 1 条，截取黎明前、正午、黄昏、初星四帧。
verify:
  - Veo 3.1 实测 3 次：8 秒内能否完整走完四个时段
---
**时长与镜头**：机位锁死，所有变化都来自时间：黎明前 → 日出正午 → 黄昏 → 入夜。原模板设计约 12 秒，Veo 单条最长 8 秒（以官方说明为准），四个时段会比较赶；如果效果太急，可以只选"黄昏 → 初星"两个时段，或者分两条生成再接起来。与本站"城市天际线日转夜延时"相比，这条是自然风光、跨越一整天，节奏更慢、更静。

**怎么填变量**：[一处高山谷地] 换成"海岸悬崖""沙漠平顶山""梯田"；前景 [一棵被风吹弯的孤松] 换成"一汪静湖""一条蜿蜒的路""一座小木屋"——前景要选不会动的东西，它是观众感知时间流逝的参照物；运动元素换成"潮水上涨""雾涌过山脊"。

**常见失败与调整**：
- 前景的树跟着摇晃或位置变化：写"前景完全静止，只有天空和光影在变"。
- 颜色太艳像明信片：保留"写实""不要过饱和"。
- 只出现了一个时段：减少时段数量，或明确写"用 8 秒走完四个时段"。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/nature-timelapse.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。

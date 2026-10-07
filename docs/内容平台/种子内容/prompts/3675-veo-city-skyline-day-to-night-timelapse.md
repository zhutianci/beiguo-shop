---
title: veo 3 提示词：城市天际线日转夜延时摄影（固定机位 · 夕阳—亮灯—车流光轨）
slug: veo-city-skyline-day-to-night-timelapse
model: veo
topics: [cinematic, motion-graphics]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: false
useCase: 经典的城市延时空镜：固定机位，太阳落下拉出长长的影子，城市灯光一盏盏亮起，街道上车灯拖成光轨。适合宣传片转场、城市文旅视频、企业介绍片的开场空镜和视频背景。
prompt: |
  一段[繁华城市]天际线从白天过渡到夜晚的延时摄影，16:9，约 8 秒。
  机位固定不动。
  画面里，太阳缓缓落下，投下长长的影子；天空从金黄过渡到橙紫，再到深蓝；城市的灯光开始一盏盏闪亮起来，下方街道上，车灯拖出一道道流动的光轨。
  画面：广角，深景深，从近处楼顶到远处天际线都清晰；云在天空中快速流动。
  声音：低沉的城市环境声，随着入夜渐渐变得安静。
negativePrompt: 镜头晃动，建筑变形，楼体融化，乱码招牌，文字，水印
source:
  repo: Google Cloud 文档：Veo 视频生成提示词指南
  url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文并扩写：补充了天空颜色变化、景深、云和声音；城市设为变量"
imageBrief: 站长生成 1 条，截取白天、黄昏、夜晚三帧。
verify:
  - Veo 3.1 实测 3 次：延时过程中建筑是否保持不变形
---
**时长与镜头**：8 秒、机位固定，所有变化都来自时间：日落 → 黄昏 → 亮灯 → 车流光轨。Google 的提示词指南把这类效果归在"时间元素"里，示例写法就是"A time-lapse of……The camera is static."——先说是延时、再明确机位不动，最后用"Watch as……"列出依次发生的变化。

**怎么用**：延时空镜是视频剪辑里最常用的"呼吸镜头"：放在开头建立地点，放在段落之间做转场，放在结尾做收束。生成后可以在剪辑软件里调速，做成 4 秒或 15 秒都行。

**怎么填变量**：[繁华城市] 换成"海边小镇""雪山脚下的村庄""沙漠里的营地"；时间变化也可以反过来写成"夜晚到黎明"，或者换成"一天里的潮水涨落""云海翻涌"。

**常见失败与调整**：
- 楼越变越奇怪：写"建筑完全静止，只有光线、天空和车流在变化"。
- 变成普通的黄昏视频、没有延时感：加"云快速流动，影子明显移动"。
- 招牌出现乱码：写"远景中看不清招牌文字，只有光点"。

> 改编自 Google Cloud 官方文档《[Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A time-lapse of a bustling city skyline as day transitions to night. The camera is static. Watch as the sun sets, casting long shadows, and the city lights begin to twinkle on, with streaks of car headlights moving along the streets below
```

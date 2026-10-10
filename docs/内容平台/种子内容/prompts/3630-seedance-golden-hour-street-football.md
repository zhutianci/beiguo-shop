---
title: seedance 提示词：黄昏街头踢球的童年回忆短片（航拍—放球—盘带—进球庆祝慢动作）
slug: seedance-golden-hour-street-football
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 怀旧、成长、热血主题的短片：黄昏尘土飞扬的社区，孩子们踢一场街头足球，从航拍到低机位盘带再到进球慢动作庆祝，适合运动品牌情怀片、体育赛事预热、"童年回忆"类视频。
prompt: |
  一段电影感的超写实真人短片，场景是黄金时刻里温暖、尘土飞扬的[老社区空地]，约 12 秒，16:9。
  0–2 秒：航拍俯瞰热闹的居民区，屋顶和小巷被夕阳染成金色。
  2–4 秒：特写，一个孩子把一只旧足球放在尘土地上。
  4–9 秒：孩子们开始一场激烈的街头足球赛——低机位的动感镜头捕捉快速的盘带和脚下动作，足球在空中飞过，扬起的尘土被逆光照亮。
  9–12 秒：电影感的慢动作，进球后孩子们欢呼庆祝，互相拥抱、跳起来。
  风格：温暖的金色阳光，真实的尘土颗粒，自然的动作，手持摄影感，浅景深，细节丰富的环境，真实的情绪，流畅的电影转场，写实真人质感，怀旧的成长片氛围。
  画面中不要出现文字、字幕、标志和水印。
negativePrompt: 腿部畸形，多余的球，球员融合，脸部变形，文字，字幕，标志，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/AynahhX/status/2106206660582850732
  author: "@AynahhX"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并补充时间码；场景改为变量"
images:
  - 3630-seedance-golden-hour-street-football-1.jpg
imageCredit:
  by: "@AynahhX"
  url: https://x.com/AynahhX/status/2106206660582850732
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录多人踢球时腿脚和足球的数量是否正确
  - 确认原帖仍可访问
---
**时长与镜头**：约 12 秒五个镜头：航拍 → 放球特写 → 低机位盘带 → 空中飞球 → 慢动作庆祝。原文用"→"串起镜头，是很省事的写法：模型会自动在箭头处切镜头。想做 15 秒，就在最后加"夕阳下孩子们并排坐在路边喘气"的余韵镜头。

**怎么填变量**：[老社区空地] 可以换成"海边沙滩""雨后的水泥球场""乡村晒谷场"，足球换成"篮球""羽毛球"同样成立。做运动品牌情怀片时，可以在最后加一个"长大后的同一个人在正式球场上射门"的跳切，形成"童年—现在"的对照。

**常见失败与调整**：
- 多人奔跑时腿脚错乱、出现两个球：把人数写死"五个孩子，一个球"，并多用特写和低机位，少用全景。
- 孩子的脸部畸形：多拍脚下和背影，庆祝段用远景慢动作。
- 画面太干净不像怀旧：加"轻微的胶片颗粒、暖黄色调、偶尔的镜头光晕"。

> 改编自 [@AynahhX](https://x.com/AynahhX/status/2106206660582850732) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a cinematic, ultra-realistic live-action sequence set in a warm, dusty neighborhood at golden hour. Start with an aerial view of a lively residential area → close-up of a child placing a worn football on the dusty ground → kids begin playing an intense street football match → dynamic low-angle shots of quick dribbles, footwork and the ball flying through the air → end with a cinematic slow-motion shot of the kids celebrating after scoring. Warm golden sunlight, realistic dust particles, natural movement, handheld camera feel, shallow depth of field, detailed environments, authentic emotions, smooth cinematic transitions, photorealistic live-action, nostalgic coming-of-age atmosphere. No text, subtitles, logos or watermark.
```

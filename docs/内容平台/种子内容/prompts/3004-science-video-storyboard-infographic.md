---
title: "AI分镜提示词：科普短视频分镜信息图（5 个镜头 + 旁白 + 运镜标注）（gpt-image-2）"
slug: science-video-storyboard-infographic
model: gpt-image-2
topics: [infographic, comic]
aspectRatio: "2:3"
needsRefImage: false
useCase: "把一条 15 秒科普短视频的脚本画成一张竖版分镜信息图：每个镜头一行，左边写画面、动作、旁白、音效、运镜和转场，右边是写实 3D 科学可视化画面，示例讲的是\"闪电是怎么形成的\"。"
prompt: |
  生成一张 2:3 竖版的科普视频分镜信息图，横向排列 5 个镜头，写实电影感的 3D 科学可视化风格，像专业教育视频的分镜表。深色界面风格，每个镜头一行：左侧是文字栏，右侧是宽幅画面。
  顶部标题：HOW [LIGHTNING] HAPPENS，右上角标注时长 [15 SECONDS]。
  每个镜头的文字栏包括：序号、时间段、镜头名、VISUAL（画面）、ACTION（动作）、VO（旁白）、SFX（音效）、CAMERA（运镜）、TRANSITION（转场），每项配一个小图标。
  镜头 1｜0:00–0:03 STORM CLOUDS：巨大的暗色雷暴云在大地上空形成，云内带电粒子快速增多；旁白"Lightning begins inside powerful storm clouds."；风声和远处雷声；缓慢航拍推进；转场：闪光。
  镜头 2｜0:03–0:06 ELECTRIC CHARGE：云内特写，正负电荷分离，蓝色和橙色粒子移向两侧，画面标注 POSITIVE CHARGE、NEGATIVE CHARGE；旁白"Ice and water particles separate electric charges inside the cloud."；电流噼啪声；微距跟拍；转场：能量光。
  镜头 3｜0:06–0:09 CHARGE BUILDS：云层下方电能增强，带电粒子向地面移动；旁白"As the charge becomes stronger, electricity searches for a path."；电流嗡鸣渐强；从云向地面俯仰；转场：快闪。
  镜头 4｜0:09–0:12 LIGHTNING STRIKE：明亮闪电连接云和地面，标注 LIGHTNING；旁白"A powerful electrical discharge creates a lightning bolt."；巨大雷声；快速拉远；转场：白闪。
  镜头 5｜0:12–0:15 THUNDERSTORM：雷雨中的广阔原野，闪电与降雨；旁白"The sudden heating of air also creates the sound of thunder."；低沉滚雷；航拍拉远；转场：柔和淡出。
  底部一条横栏：NARRATOR (VO): Clear, calm, educational male voice.
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Strength04_X/status/2091436714384613713
  author: "𝐌"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文结构说明；主题与时长改为变量；保留 5 个分镜的完整文字，并说明画面中的文字用英文保持原样"
images:
  - 3004-science-video-storyboard-infographic-1.jpg
imageCredit:
  by: "𝐌"
  url: https://youmind.com/gpt-image-2-prompts?id=32430
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[LIGHTNING] 换成你的科普对象，如"RAINBOWS""TSUNAMIS"（标题动词不合适时整句改写，如"WHY LEAVES CHANGE COLOR"），然后把 5 个镜头的内容按同样字段改写；[15 SECONDS] 改成实际时长。也可以整张写成中文（"画面 / 动作 / 旁白 / 音效 / 运镜 / 转场"），但每格文字要更短，否则小字容易出错。

示例图完全按脚本生成：深蓝界面上 5 行镜头，左栏是带小图标的英文字段，右侧依次是雷暴云、蓝橙电荷分离、电能下行、闪电劈地、雷雨原野，第 2 和第 4 格有标签框，底部是旁白说明。

**常见问题**：
- 文字栏内容错乱：每个字段控制在一行，旁白不超过 12 个英文单词。
- 5 个画面风格不统一：加"所有画面同一时间、同一地点、同一色调"。
- 用来交给视频模型：这张图本身就是很好的分镜参考，可以把每格画面单独裁出来做图生视频首帧。

**适合**：科普短视频策划、教学视频脚本评审、给剪辑 / 视频模型的分镜参考。

### 英文原版

```text
Create a vertical 2:3 educational storyboard infographic, 5 horizontal scenes, cinematic realistic 3D science visualization, exactly like a professional educational video storyboard.

TOPIC: HOW LIGHTNING HAPPENS
Duration: 15 seconds

1 | 0:00–0:03 — STORM CLOUDS
Visual: Huge dark storm clouds forming above a landscape.
Action: Clouds grow rapidly with electric particles inside.
VO: “Lightning begins inside powerful storm clouds.”
SFX: Wind and distant thunder.
Camera: Slow aerial push in.
Transition: Light Flash.

2 | 0:03–0:06 — ELECTRIC CHARGE
Visual: Close-up inside cloud showing positive and negative charges separating.
Action: Blue and orange particles move to opposite sides.
Labels: POSITIVE CHARGE, NEGATIVE CHARGE.
VO: “Ice and water particles separate electric charges inside the cloud.”
SFX: Electric crackle.
Camera: Macro tracking.
Transition: Energy Glow.

3 | 0:06–0:09 — CHARGE BUILDS
Visual: Dark cloud above the ground, bright electrical energy increasing.
Action: Electric particles move downward toward Earth.
VO: “As the charge becomes stronger, electricity searches for a path.”
SFX: Rising electrical hum.
Camera: Tilt from cloud toward ground.
Transition: Quick Flash.

4 | 0:09–0:12 — LIGHTNING STRIKE
Visual: Bright lightning bolt connects cloud to ground.
Action: Lightning travels rapidly downward.
Label: LIGHTNING.
VO: “A powerful electrical discharge creates a lightning bolt.”
SFX: Loud thunder crack.
Camera: Fast Pull Back.
Transition: White Flash.

5 | 0:12–0:15 — THUNDERSTORM
Visual: Wide storm landscape with lightning and rain.
Action: Lightning flashes while rain falls below.
VO: “The sudden heating of air also creates the sound of thunder.”
SFX: Deep thunder rolling.
Camera: Wide aerial pull back.
Transition: Smooth Fade.

Bottom: NARRATOR (VO): Clear, calm, educational male voice.
```

> 改编自 [𝐌](https://x.com/Strength04_X/status/2091436714384613713) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

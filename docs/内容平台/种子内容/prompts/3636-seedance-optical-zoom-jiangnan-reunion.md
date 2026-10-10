---
title: seedance 提示词：光学变焦运镜教学（江南雨后古巷 · 两人重逢 · 固定机位只靠变焦讲故事）
slug: seedance-optical-zoom-jiangnan-reunion
model: seedance
topics: [cinematic, short-drama, image-to-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 学习"机位不动、只用光学变焦推拉"来改变人物距离感的电影运镜：江南雨后古巷，两位女主隔巷相望、长焦压缩空间、移焦、一句"好久不见"。适合古风短剧、情绪片段，也是运镜提示词的范例。
prompt: |
  【全局设定】古风写实电影镜头，东方古典生活叙事，雨后的[江南古镇]：青石台阶、青砖黛瓦、木廊、雕花木门、竹帘、湿漉漉的石巷。阴天柔和的漫射光，低反差，冷灰绿与暖木色交融，轻微 35mm 胶片颗粒，真实的皮肤、木、石、布料质感，电影浅景深，16:9，约 13 秒。
  女主 A：@图片1；女主 B：@图片2。全程严格保持人物身份、空间位置、左右关系、行进方向、天气、光线和色调连续。
  【核心运镜】整段只用"渐进式光学变焦"：机位尽量固定，不靠移动机位，而是用缓慢连续的光学推拉改变人物在画面中的比例和空间关系；保留真实的镜头压缩感和景深变化，禁止数码裁切。
  0–4 秒：中景起幅，35mm，固定机位，平视。女主 A 沿青石台阶缓缓走到巷口，停下、转身、抬头，看见远处廊檐下的女主 B。镜头只做缓慢的光学推进，逐渐收紧到女主 A 的中景。镇上行人从前景左右横穿，形成自然的近距离虚化遮挡，女主 A 始终清晰。
  4–9 秒：机位完全不动。女主 B 从右前景缓缓走近木廊柱，与柱子形成前景框；女主 A 在左侧巷子深处。缓慢连续地变焦到长焦端，真实的空间压缩让古巷纵深变浅，两人实际距离不变、视觉距离明显拉近；焦点从女主 A 平滑地移到女主 B。
  9–13 秒：保持固定机位和长焦。女主 B 站在廊柱旁，慢慢转头看向女主 A；只做一次极慢的光学推进，从双人关系构图收紧到女主 B 的中近景，画面左侧保留女主 A 虚化的轮廓。女主 B 停顿片刻，轻声说："[好久不见。]"露出一丝浅笑。竹帘被雨后的微风吹动，屋檐水滴落下。
  禁止：横移、环绕、突然摇镜、无人机运动、强烈手持晃动、数码变焦、焦段跳变、曝光闪烁、现代建筑与物品、字幕、水印。
negativePrompt: 现代建筑，现代物品，横移，环绕运镜，数码裁切，焦段跳变，曝光闪烁，人物换脸，左右互换，塑料皮肤，字幕，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/GrayNoteLab/status/2105199106578870298
  author: "@GrayNoteLab"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原帖为中文、仓库收录的是英文译本；本站据英文版重写为中文并略作压缩，保留三段运镜设计与禁止项；场景与台词改为变量"
imageBrief: 来源缩略图含写实人像，未采用。站长用两张虚构人物定妆图生成后，截取"巷口抬头""长焦压缩双人""B 中近景"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录模型是否真的保持机位不动、只做变焦
  - 两张参考图请使用虚构人物或已获授权的照片
  - 确认原帖仍可访问
---
**时长与镜头**：约 13 秒三段，全程同一个机位：广—中景推进 → 长焦压缩 + 移焦 → 极慢推进到中近景。这是一条"运镜教学"型提示词：大多数 AI 视频动不动就环绕、横移，而这里刻意只用光学变焦，让"两人距离越来越近"的情绪完全由镜头焦段来表达。

**要点**：①反复强调"机位不动、只做光学变焦"，并在禁止项里点名横移、环绕、无人机；②用"前景行人遮挡""廊柱前景框"制造层次；③长焦压缩空间是真实镜头特性，写出"纵深变浅、两人视觉距离拉近"，模型更容易理解你要的效果。

**怎么填变量**：[江南古镇] 可以换成"民国老街""日式小站月台""雪后的胡同"；台词 [好久不见。] 换成任意一句短台词。两个人物也可以是一男一女、或者一人一宠物。

**常见失败与调整**：
- 模型还是做了推轨或环绕：把"禁止横移、环绕"挪到提示词最前面，并缩短总时长。
- 两人左右位置互换：写"女主 A 始终在画面左侧，女主 B 始终在右侧"。
- 出现现代电线杆、空调外机：负面提示词点名这些物体。

> 改编自 [@GrayNoteLab](https://x.com/GrayNoteLab/status/2105199106578870298) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原文较长，此处节选）（原帖为中文，以下为仓库收录的英文译本）

```
[Global Settings]
Ancient-style realistic cinematic shot, Eastern classical life narrative, Jiangnan ancient town after rain: bluestone steps, blue bricks and black tiles, wooden corridors, carved wooden doors, bamboo curtains, wet stone alleys. Soft diffused light under cloudy skies, low contrast, fusion of cold gray-green and warm wood tones, slight 35mm film grain, realistic skin, wood, stone, and fabric textures, cinematic shallow depth of field, 8K, 16:9.

Female Lead A: Image 1
Female Lead B: Image 2

Strictly maintain character identity, spatial position, left-right relationship, direction of movement, weather, lighting, and color tone continuity throughout the video.

[Core Cinematography Technique]
The entire video uses "progressive optical zoom" as the sole core camera movement. The camera remains as fixed as possible, relying not on physical movement but on slow, continuous optical push-ins and pull-outs to change the characters' screen proportion and spatial relationships. Maintain real lens compression, depth of field changes, and optical characteristics; prohibit digital cropping. Foreground occlusion, shallow depth of field, and focus shifts assist the narrative, forming "discovery from afar -> eye contact across the alley -> spatial compression -> emotional confirmation."

[0-4s]
Medium shot start, 35mm, fixed camera, eye level. Female Lead A slowly descends along the bluestone steps to the alley entrance, stops, turns, and looks up, seeing Female Lead B under the distant corridor eaves. The shot begins with a wider environmental relationship composition, only slowly optically pushing in, gradually tightening to a medium shot of Female Lead A, with no camera movement.

Town pedestrians pass horizontally through the foreground from left and right, creating natural blurred occlusions at close range, while Female Lead A remains clear; exposure, color temperature, and light/shadow remain stable during occlusion. The zoom continues smoothly and restrainedly, finally forming an eye contact between Female Lead A and Female Lead B across the alley.

[4-9s]
Continuing from the previous segment, the camera position remains completely unchanged. Female Lead B slowly enters from the right foreground, approaching the wooden corridor pillar, forming a natural foreground frame with the pillar; Female Lead A is deep in the left-middle alley.

Slow continuous optical zoom, Female Lead A initially remains clear, then the shot gradually tightens, Female Lead B's foreground proportion increases, and Female Lead A recedes into the background with soft blur.
……
```

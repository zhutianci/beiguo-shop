---
title: seedance 提示词：一镜到底穿越中华五千年（同一张脸跑过每个朝代 · 遮挡转场写法）
slug: seedance-one-take-chinese-history-time-travel
model: seedance
topics: [cinematic, image-to-video]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: true
useCase: 上传一张自己的照片锁定人脸，生成"同一个人一路奔跑、穿过远古到现代每个时代"的一镜到底穿越短片。适合历史文旅宣传、个人创意短片，也是学习"用物体遮挡做隐形转场"的高级范例。
prompt: |
  生成一段一镜到底的"中华文明穿越"短片，16:9 横屏，写实真人电影质感，时长取平台上限（Seedance 2.0 最长 15 秒，想做 30 秒请分两条接力）。
  人物：@图片1 是唯一的人脸参考，只用来锁定身份——脸型、五官比例、眉眼、鼻梁、嘴唇、下颌、肤色和年龄感全程不变；不要继承照片里的服装、背景和姿势。每个时代只改变发型、胡须、服装、鞋帽、手里的工具。
  运镜：真正的一镜到底，禁止硬切、黑场、闪白、淡入淡出、人物瞬移。人物始终主动向前移动——奔跑、快走、穿过人群、跳下台阶、推门、过桥；镜头跟着他在侧前跟拍、正面倒退跟拍、侧向平移、背后追拍、低机位脚步之间自然切换。
  转场方法：每次换时代都用真实物体贴近镜头遮挡 0.2–0.8 秒完成——旋转的陶轮、飞过的车轮、被风吹过的大旗、展开的卷轴、推开的木门、喷出的蒸汽、驶过的公交车；遮挡期间人物服装、手中物件、地面和周围世界同步演变，遮挡结束后步伐、方向和速度完全连续。
  时代顺序：[远古河谷与篝火] → [新石器农耕村落] → [青铜时代城邑] → [秦汉驿道] → [盛唐市集] → [宋代河桥街市] → [明清街巷] → [近代铁路与蒸汽机车] → [当代城市玻璃幕墙]。
  每个时代都要有真实的建筑、器物、人群和生活气息，不要影视城布景感；人物始终是普通百姓，不是帝王将相。
negativePrompt: 换脸，五官漂移，硬切，黑场，闪白，淡入淡出，人物瞬移，影视城布景，仙侠服装，字幕，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/QtImVCr6WK56152/status/2105958705833627727
  author: "@QtImVCr6WK56152"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原帖为中文、仓库收录的是英文译本（约 8000 字符，按 30 秒设计）；本站据英文版重写为中文精简版，保留人脸锁定、一镜到底规则和\"遮挡转场\"方法，把逐秒描述压缩为时代顺序列表并改为变量，补充了分两条接力的说明"
images:
  - 3632-seedance-one-take-chinese-history-time-travel-1.jpg
imageCredit:
  by: "@QtImVCr6WK56152"
  url: https://x.com/QtImVCr6WK56152/status/2105958705833627727
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测：15 秒内能稳定穿越几个时代（预计 4–5 个，需删减列表）
  - 上传真人照片时平台的人脸审核规则以官方为准；不要上传他人照片
  - 确认原帖仍可访问
---
**时长与镜头**：原作按 30 秒设计、每 2–3 秒一个时代。Seedance 2.0 官方说明单条最长 15 秒，九个时代塞不进去，实际用时建议只选 4–5 个，例如"远古 → 秦汉 → 盛唐 → 近代 → 当代"；想要完整版就分两条：第二条用第一条的最后一帧作首帧继续跑。

**最值得学的是"遮挡转场"**：让一个真实物体（车轮、旗子、门、蒸汽）贴着镜头扫过 0.2–0.8 秒，在被挡住的那一瞬间完成换装换景。观众会觉得是一镜到底，模型也有了"合理换画面"的机会，比直接要求"背景变成唐朝"稳得多。这个方法同样适合做"一镜到底换装""一镜到底四季变化"。

**怎么用**：@图片1 用你自己的正脸清晰照片，并在提示词里强调"只锁身份、不继承服装背景"。时代列表里的 [变量] 可以改成任何时间线，比如"一座城市的 1950 → 1980 → 2000 → 现在"，或者"一个人的童年 → 少年 → 中年"。

**常见失败与调整**：
- 每个时代换了一张脸：减少时代数量，并把"脸部严格以 @图片1 为准"放在提示词最前面。
- 出现硬切：把转场物体写得更具体（"一扇厚重的木门从镜头前滑过，完全遮住画面半秒"）。
- 古代场景像影视城：加"真实的泥土、灰尘、磨损的器物、忙碌的普通人"。

> 改编自 [@QtImVCr6WK56152](https://x.com/QtImVCr6WK56152/status/2105958705833627727) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版（原文较长，此处节选）（原帖为中文，以下为仓库收录的英文译本）

```
Generate a [30-second, 16:9 horizontal, 4K, live-action, high-budget cinematic quality] "Chinese Civilization Time Travel" short film, deeply referencing the actual camera structure and time progression logic of my uploaded reference video: This is not an edit of multiple historical scenes, but a single camera following [the same Chinese male] continuously forward from second 0 to 30, traveling from ancient times through thousands of years of Chinese civilization, and finally continuing past contemporary times into the future like the reference video; Use my uploaded male photo as the [sole and absolute face reference] for the entire film, the photo is only responsible for locking the person's identity, strictly maintaining his face shape, feature proportions, eyebrows/eyes, eye distance, nose bridge/tip, lips, jawbone, facial bone structure, skin tone base, youthful age sense, and recognizability. Absolutely do not reference the blue suit, tie, restaurant, chandelier, roses, jewelry, sitting posture, or background in the photo. Throughout 0-30s, viewers must clearly recognize this is the man from the reference image; prohibit changing actors per era, prohibit feature drift, prohibit becoming different ancient handsome guys or AI template faces. Era changes can only alter his hairstyle, hair length, binding method, beard, clothing materials, footwear, headwear, belts, tools, accessories, status, and habits. The entire film must visually be a true "one-take shot," prohibiting hard cuts, black screens, flash whites, fades, dissolves, sudden scene changes, character teleportation, or background refreshes. The character must never stand still letting the world change around him; he must actively move forward, running, walking fast, crossing, jumping down stairs, dodging sideways, grabbing vehicles, passing through crowds, pushing doors, climbing bridges, passing buildings, going past transport. The camera moves with him, naturally changing framing between side-front tracking, frontal backward tracking, lateral panning, rear chasing, low-angle footsteps, wide shots, and close-ups like the reference video. All era transitions should prioritize hidden cuts using real physical motion, e.g., rocks, pottery wheels, cart wheels, chariots, pillars, flags, fabrics, scrolls, doors, bridge columns, carriages, steam, trains, buses, crowds, glass curtains, transparent barriers passing extremely close to the camera and briefly obscuring for 0.2-0.8 seconds. During obstruction, character styling, held items, ground, and surrounding world must evolve simultaneously.
……
```

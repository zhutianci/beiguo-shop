---
title: seedance 提示词：水獭驾驶机甲大战大理石章鱼（日系机甲动画 · 一句话扩写成分镜）
slug: seedance-otter-mech-pilot-anime-battle
model: seedance
topics: [cinematic, motion-graphics]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 日系机甲动画片段：一只水獭走进巨型机甲、大量齿轮和机械零件的快切特写、严肃地竖起大拇指、驾驶机甲飞向一只大理石做成的章鱼。原作只有一句话，本站扩写成可控的分镜版，适合动画短片和"一句话 → 分镜"的写法对照。
prompt: |
  一段日系机甲动画，16:9，约 12 秒，手绘赛璐璐质感，高帧率动作。
  0–3 秒：一只[水獭]穿着小小的驾驶服，走进一台巨型机甲的驾驶舱入口，舱门在身后合上。
  3–6 秒：大量快切特写——齿轮咬合转动、液压杆伸缩、仪表盘依次亮起、机械臂关节锁定，每个镜头不到半秒，配合金属撞击声。
  6–8 秒：驾驶舱内，水獭神情严肃，对着镜头竖起一个大拇指。
  8–12 秒：机甲点火起飞，冲向远处一只由白色[大理石]雕成的巨型章鱼，章鱼的触手带着石材纹理挥舞过来，机甲在触手之间穿梭，冲向它。
  画面：鲜明的线条，饱和的色彩，动感的速度线；声音：机械运转声、引擎轰鸣、紧张的管弦乐。
negativePrompt: 写实风格，3D 渲染，角色变形，多余的水獭，画面撕裂，文字，水印
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/emollick/status/2021412306291392535
  author: "@emollick"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: "原文只有一句英文描述，本站在不改变情节的前提下扩写为带时间码的四段分镜，补充了画风、声音和负面提示词；主角和章鱼材质改为变量"
imageBrief: 仓库没有可单独提取的封面。站长生成后截取"走进机甲""竖大拇指""冲向大理石章鱼"三帧。
verify:
  - Seedance 2.0 实测：原版一句话与扩写版各生成 3 次，对比可控性
  - 确认原帖仍可访问
---
**时长与镜头**：约 12 秒四段：登舱 → 机械快切 → 竖大拇指 → 出击。原作只有一句话（见下方英文原版），模型能生成很精彩的结果，但每次都不一样；本站扩写成分镜版，是为了让你能控制节奏和每个镜头的内容。两种写法都可以试：一句话版适合找灵感，分镜版适合做成品。

**"一句话扩写成分镜"的方法**：把原句拆成动作节点（走进机甲 / 零件特写 / 竖拇指 / 驾驶出击），给每个节点分配时长，再补上画风（赛璐璐、速度线）和声音。原句里的关键词"大量快切的机械零件"变成了 3 秒的快切蒙太奇，这是机甲动画的经典桥段。

**怎么填变量**：[水獭] 换成"柴犬""企鹅""小熊猫"；[大理石] 章鱼换成"熔岩巨蟹""水晶巨龙"——用一种"不寻常的材质"做反派，画面会更有记忆点。

**常见失败与调整**：
- 变成 3D 动画：强调"手绘赛璐璐"，负面提示词写"3D 渲染"。
- 机械快切段变成一个长镜头：写"每个镜头不到半秒，快速剪辑"。
- 水獭在驾驶舱里变大或变成人：写"小小的水獭坐在巨大的驾驶座上"。

> 改编自 [@emollick](https://x.com/emollick/status/2021412306291392535) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
An anime where an otter goes into a large mech, with lots of quick shots of mechanical parts and gears turning. The otter gives a grim thumbs up, and then pilots the mech, flying into battle against an octopus made of marble.
```

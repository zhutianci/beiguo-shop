---
title: seedance 提示词：太空站崩塌逃生（贴地追拍—滑铲—坠落抓缆绳 · 硬科幻动作一镜）
slug: seedance-space-mechanic-station-collapse-chase
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 硬科幻动作片段：穿全封闭宇航服的太空机械师在崩塌的轨道货运码头上狂奔，巨型飞船从身后横撞进空间站，滑铲躲过集装箱、坠落抓住缆绳。适合科幻短片、游戏宣传、动作镜头练习；全程不露脸，规避人脸一致性问题。
prompt: |
  一名穿着全封闭宇航服的[太空机械师]，头盔清晰可见、面罩紧闭，在正在崩塌的轨道货运码头上狂奔，身后一艘巨型飞船侧着撞穿空间站，16:9，约 12 秒。
  头盔和宇航服全程穿着、保持不变。
  贴地镜头在他的靴子旁高速追拍，爆炸撕开甲板。他冲过镜头，镜头猛地甩过去，正好一个巨大的货运集装箱砸在他面前；他滑铲钻到集装箱下面，集装箱擦着他滑过，火花四溅。
  地板突然被撕开。镜头跟着他一起坠落，他穿过空间站，砸穿下层的维修平台，抓住一根垂下的缆绳。
  最后一个镜头：镜头摆到他的下方，露出上方半座轨道空间站正在解体，数百块燃烧的碎片朝下方的行星坠落。
  超写实硬科幻，残暴的速度感，大规模破坏，清晰的物理，巨大尺度，IMAX 质感。
  头盔始终可见，面罩始终闭合，绝不摘下头盔，不露出头部和脸。
negativePrompt: 摘下头盔，露出人脸，宇航服变化，肢体畸形，画面撕裂，卡通，文字，水印
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/DeCat2025/status/2103615529986699498
  author: "@DeCat2025"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；主角职业改为变量；删去原文\"不要知名人物脸\"一句（全程不露脸已覆盖）"
images:
  - 3643-seedance-space-mechanic-station-collapse-chase-1.jpg
imageCredit:
  by: "@DeCat2025"
  url: https://x.com/DeCat2025/status/2103615529986699498
  license: CC BY 4.0
verify:
  - Seedance 2.0 实测 3 次，记录"滑铲躲集装箱"这一动作的物理是否可信
  - 确认原帖仍可访问
---
**时长与镜头**：一组连续动作：贴地追拍 → 甩镜 + 滑铲 → 跟随坠落 → 仰拍崩塌全景。建议 10–15 秒。原作很聪明的一点是"全程不露脸"：头盔面罩永远闭合，模型就不用费力保持人脸一致，动作戏的成功率明显更高——做任何高强度动作镜头都可以借鉴这个思路（头盔、面具、背影、剪影）。

**怎么填变量**：[太空机械师] 换成"深海潜水员（潜水头盔）""赛车手（头盔）""消防员（面罩）"，场景随之换成"坍塌的海底基地""失控的赛道""火场"。

**常见失败与调整**：
- 跑着跑着头盔没了：保留结尾两句强约束，并在负面提示词写"摘下头盔，露出人脸"。
- 坠落段镜头乱转看不清：把坠落改成"他从断裂处跳下，镜头在上方俯拍他抓住缆绳"。
- 爆炸太多遮住主角：写"爆炸在他身后，他始终在画面中心清晰可见"。

> 改编自 [@DeCat2025](https://x.com/DeCat2025/status/2103615529986699498) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
A space mechanic in a sealed full spacesuit with a clearly visible protective space helmet and closed visor sprints across a collapsing orbital cargo dock as a gigantic spacecraft crashes sideways through the station behind him. 

The helmet and spacesuit remain on and unchanged for the entire video.  Ground-level camera races beside his boots as explosions rip open the deck. He passes the camera and it whips around just as a massive cargo container smashes down in front of him. He drops beneath it while it skids over him, showering sparks.  

The floor suddenly tears away. The camera drops with him as he falls through the station, crashes through a lower maintenance platform, and grabs a hanging cable.  

Final shot: the camera swings beneath him, revealing half the orbital station breaking apart above while hundreds of burning fragments fall toward the planet.  Ultra-realistic hard sci-fi, brutal speed, massive destruction, clear physics, enormous scale, IMAX quality. Helmet always visible, visor always closed, never remove the helmet, no exposed head or face. No famous or recognizable faces.
```

---
title: veo 3 提示词：现代记者穿越草船借箭现场自拍报道（第一人称自拍杆 · 历史穿越整活）
slug: veo-selfie-reporter-borrowing-arrows-boat
model: veo
topics: [cinematic, short-drama]
modelLabel: Veo 3
aspectRatio: "9:16"
needsRefImage: false
useCase: 「现代人穿越历史名场面」的整活短视频：一位现代女记者举着自拍杆，站在草船借箭的小木船上，箭雨从天而降扎进草人，她又兴奋又害怕地现场报道。适合历史科普、文旅宣传、穿越题材短剧。
prompt: |
  一段超写实的第一人称视角视频，用自拍杆拍摄，竖屏 9:16，约 8 秒。
  持镜人是一位穿着现代服装的女记者，正在亲历一场历史事件：她站在三国时期一艘符合史实的小木船上，这是"[草船借箭]"的场景。
  船上能看到一位身穿道袍、头戴纶巾、手持羽扇的谋士，神情淡定；几个草人身上已经扎满了箭。
  黑暗的天空中，看不见的弓箭手从画外射来密集的箭雨，箭呼啸着飞过，"笃笃笃"地扎进船身和草人，冲击感真实。
  记者的脸上混合着强烈的兴奋和真切的害怕，现代的打扮与古代场景形成强烈反差。她对着镜头喊："[我正在草船借箭现场给大家报道！太刺激了！]"
  风格：电影感、沉浸式，船上的灯笼在黎明前的昏暗中投下戏剧化的光，江面薄雾弥漫。
negativePrompt: 箭射中人，血腥，现代建筑，人物畸形，字幕，文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/three_kingdoms_journalist_adventure.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "英文原文译为中文；台词由英文改为中文并设为变量；补充\"箭不射中人\"\"江面薄雾\"等细节；历史场景名改为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"自拍开场""箭雨扎进草人""记者喊话"三帧。
verify:
  - Veo 实测 3 次：箭雨场面是否会误伤人物（需完全避免）
  - 历史服饰是否像影视剧中的戏服，必要时加"真实粗布质感"
---
**时长与镜头**：8 秒一个自拍杆视角镜头：记者入画 → 箭雨扎进草人 → 对镜头喊话。"自拍杆 / vlog 视角 + 历史名场面"是近年很火的整活格式：现代人的惊慌表情和古代场景的反差，就是笑点和记忆点。

**怎么填变量**：[草船借箭] 可以换成任何家喻户晓的历史场面，例如"赤壁大火的江边""长城修建工地""郑和下西洋的宝船甲板"，相应改人物和道具。台词 [我正在……] 保持一句、带上场景名，观众一听就懂。

**常见失败与调整**：
- 箭射到人身上：负面提示词保留"箭射中人，血腥"，并写"所有箭都扎在草人和船身上"。
- 谋士形象像某部电视剧的演员：只描述服饰和神态，不点名任何演员或剧集。
- 记者的脸在自拍里变形：缩短台词，减少大幅度的表情变化。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```
A hyper-realistic, first-person perspective video, shot on a selfie stick. The camera holder is a modern female journalist with contemporary clothing, experiencing a historical event. She is on a small, historically accurate wooden boat during the Three Kingdoms period in ancient China. This is the "straw boat borrowing arrows" scene, and the iconic figure of Zhuge Liang, dressed in his traditional Taoist robes and hat, is visible on the boat. Several straw figures are also present, already bristling with arrows. The dark sky is filled with a dense volley of arrows being shot from unseen archers off-screen. The arrows whistle through the air before thudding into the boat's hull and the straw men with realistic impact. The journalist's face shows a mix of intense excitement and genuine fear, contrasting her modern appearance with the ancient setting. She shouts in English: "I am sending a report to you at the scene of borrowing arrows from the grass boat! It's so exciting！" (This is so exciting, I'm so scared!). The style is cinematic and immersive, with dramatic lighting from lanterns on the boat against the pre-dawn gloom.
```

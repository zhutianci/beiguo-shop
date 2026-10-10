---
title: veo 3 提示词：古希腊士兵自拍，身后推着特洛伊木马（一句台词冷笑话 · 历史整活）
slug: veo-trojan-horse-selfie-joke
model: veo
topics: [cinematic, short-drama]
modelLabel: Veo 3
aspectRatio: "9:16"
needsRefImage: false
useCase: 最简单的历史整活短视频模板：穿古希腊铠甲的士兵对着镜头自拍，身后巨大的木马正被推向城门，他一本正经地说一句"送个正常礼物"。适合历史科普号、冷幽默账号，也是"一句话 + 一句台词"极简提示词的范例。
prompt: |
  真实手机自拍视频画面，竖屏 9:16，约 8 秒。一位身穿[古希腊铠甲]的男人举着手机自拍，表情一本正经，眼神略带心虚。
  他身后，一匹极其巨大的木马正被一群士兵推着，缓缓驶向宏伟的石头城门，车轮在土路上嘎吱作响。
  他对着镜头小声说："[就是来送个完全正常的礼物，一点也不可疑。]"说完朝身后的木马瞟了一眼。
  画面：午后阳光，轻微手持晃动，前置摄像头的广角畸变，真实感强。
  声音：木轮嘎吱声，士兵的吆喝声，远处城墙上的号角声。
negativePrompt: 现代建筑，人物畸形，木马变形，字幕，文字，水印
source:
  repo: liu-kaining/Awesome-Veo3-Prompts
  url: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/prompts/trojan_horse_selfie_adventure.md
  author: "liu-kaining"
  license: MIT
  licenseUrl: https://github.com/liu-kaining/Awesome-Veo3-Prompts/blob/main/LICENSE
  changes: "原文为一段英文短提示词，本站译为中文并补充了表情、光线、声音细节；台词译为中文并设为变量"
imageBrief: 仓库没有示例图。站长生成 1 条，截取"自拍说台词"和"回头瞟木马"两帧。
verify:
  - Veo 实测 3 次：木马与城门的尺度感、中文台词口型
---
**时长与镜头**：8 秒、一个前置自拍镜头，一句台词 + 一个"瞟一眼"的小动作。原作只有两句话，却是很完整的冷笑话：观众都知道木马里藏着人，主角却说"一点也不可疑"——反差来自观众的常识。本站只补了表情、声音和画面质感。

**怎么复用**：这个公式可以套到任何"观众都知道结局"的历史或童话场景："在泰坦尼克号甲板上自拍说'这船绝对不会沉'（注意避免轻慢灾难，可换成虚构的船）""在龟兔赛跑的终点前自拍的兔子说'我先睡一会儿'"。

**怎么填变量**：[古希腊铠甲] 和台词都可以换。台词越短越好，冷笑话的关键是语气平淡、说完停顿。

**常见失败与调整**：
- 木马太小像玩具：写"木马比城墙还高，士兵在它脚下显得很小"。
- 台词被念得很搞笑夸张：写"语气平淡、一本正经地说"。
- 背景里出现现代楼房：负面提示词写"现代建筑"。

> 改编自 [liu-kaining/Awesome-Veo3-Prompts](https://github.com/liu-kaining/Awesome-Veo3-Prompts)（Copyright (c) 2025 liu-kaining，MIT License）。

### 英文原版

```
Real footage selfie video view of a man dressed in ancient Greek armor. Behind him, a extremely giant wooden Trojan horse being wheeled toward massive stone city gates. He says:
"Just dropping off a totally normal gift. Definitely not suspicious."
```

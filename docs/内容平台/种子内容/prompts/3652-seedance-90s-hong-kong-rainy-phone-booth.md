---
title: seedance 提示词：90 年代港风文艺片（雨中红色电话亭 · 抽帧拖影 · 黄绿色调 10 秒三镜头）
slug: seedance-90s-hong-kong-rainy-phone-booth
model: seedance
topics: [cinematic, short-drama]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 复刻 90 年代香港文艺电影的氛围：雨中的红色电话亭，隔着玻璃看见握着听筒沉默的人，嘴唇欲言又止的特写，最后挂断电话走进雨中人群、抽帧拖影。适合情绪短片、文艺号、MV 片段和港风写真视频。
prompt: |
  【影片风格】90 年代香港文艺片质感，复古胶片感，高感光颗粒，暧昧的黄绿色调，抽帧（降格）效果，忧郁的氛围。
  【核心台词（用于情绪控制）】"[如果记忆是一个罐头，我希望它永远不会过期。]"
  【时长】10 秒，16:9。
  【00:00–00:04】镜头一：隔着玻璃窥视。场景：雨水覆盖的红色公用电话亭。人物：一位穿卡其色风衣的[男人]紧紧握着听筒，不说话，只是听着。表演：透过玻璃的折射，看到他眼神空洞却深情；雨水顺着玻璃流下，把他的脸扭曲得像一幅油画。叙事感：画面仿佛凝固，只有雨声。
  【00:04–00:07】镜头二：大特写与微表情。场景：聚焦人物的嘴唇和半张脸。动作：他对着听筒轻声低语，嘴唇微微颤抖，好像想说什么又咽了回去。光线：街头霓虹的虚化光斑在他脸上流过，忽明忽暗。情绪：表现"想触碰却收回"的极致克制与孤独。
  【00:07–00:10】镜头三：招牌式慢门拖影。场景：人物挂断电话，转身走进雨中的人群。视觉效果：用抽帧效果（定格动画般的顿挫感），人物的背影变得模糊、拖出残影（运动模糊），仿佛灵魂留在原地，只有身体走开了。环境：背景里流动的城市车灯拉成长长的光轨。
  【技术参数】模拟手持摄影，浅景深，偏色，情绪浓烈。
negativePrompt: 高清锐利数码感，鲜艳色彩，人物换脸，字幕，文字，水印
source:
  repo: ZeroLu/awesome-seedance
  url: https://x.com/johnAGI168/status/2020415877993156966
  author: "@johnAGI168"
  license: MIT
  licenseUrl: https://github.com/ZeroLu/awesome-seedance/blob/main/LICENSE
  changes: "英文原文译为中文；删去原文标题中的导演姓名，风格以具体视觉特征描述；人物和台词改为变量"
imageBrief: 仓库没有可单独提取的封面。站长生成后截取"玻璃后的握听筒人物""嘴唇特写""雨中拖影背影"三帧。
verify:
  - Seedance 2.0 实测 3 次，记录"抽帧拖影"效果是否被执行
  - 确认原帖仍可访问
---
**时长与镜头**：10 秒三个镜头：隔玻璃中近景 → 嘴唇大特写 → 背影拖影。每个镜头都按"场景 / 人物 / 表演 / 光线 / 叙事感"拆开写，这是写情绪片最细致的方式。

**为什么有效**：港风文艺片的辨识度来自几个具体技法，提示词里都点到了：高感光颗粒、黄绿偏色、抽帧降格（画面一顿一顿的）、慢门拖影、隔着玻璃拍人、霓虹虚化光斑。与其写"某某导演风格"，不如把这些技法逐条写出来，模型更好执行，也可以移植到任何场景。

**怎么填变量**：[男人] 可以换成"一位短发女人"；核心台词 [如果记忆是一个罐头……] 不一定会被念出来，它的作用是给模型"情绪方向"，可以换成任何一句你想要的独白。场景也能换成"深夜便利店""双层巴士上层""旧式唱片店"。

**常见失败与调整**：
- 画面太清晰太"新"：加"像 VHS 录像带翻拍，轻微的色彩溢出"。
- 抽帧效果没出现：写"每秒只有 8 帧的顿挫感"。
- 人物在电话亭里说了很多话：写"整段几乎没有台词，只有一句低语"。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2020415877993156966) 发布、[ZeroLu/awesome-seedance](https://github.com/ZeroLu/awesome-seedance) 收录的提示词（Copyright (c) 2026 ZeroLu，MIT License）。

### 英文原版

```
[Film Style]: 90s Hong Kong Art Cinema style, retro film feel, high ISO grain, ambiguous yellow-green tint, frame stepping effect, melancholic atmosphere.

[Core Dialogue (for emotion control)]: "If memories were canned food, I hope they never expire."

[Video Duration]: 10 seconds
[Script]:

[00:00-00:04] Shot 1: Through the Glass Peeping.
Scene: A rain-covered red public telephone booth.
Character: A man (or woman) in a khaki trench coat holding the receiver tightly, not speaking, just listening.
Emotional Performance: Through the glass refraction, see his/her eyes hollow yet deeply emotional. Rain flows down the glass, distorting his face like an oil painting.
Subtitle/Narrative sense: The picture seems frozen, only the sound of rain.

[00:04-00:07] Shot 2: Extreme Close-up & Micro-expression.
Scene: Focus on the character's lips and half face.
Action: He/She whispers softly into the receiver. Lips tremble slightly, seeming to want to say something but swallow it back.
Lighting: Street neon bokeh flows across his face, bright and dim alternately.
Dialogue Emotion Mapping: Shows the ultimate restraint and loneliness of "wanting to touch but drawing back".

[00:07-00:10] Shot 3: Signature Slow-shutter Drag Shadow.
Scene: Character hangs up phone, turns around and walks into the rainy crowd.
Visual Effect: Using frame stepping effect (stop-motion feel), the character's back becomes blurred with trailing shadows (motion blur), as if the soul stayed in place while only the body walks away.
Environment: Background is flowing city car lights forming elongated light trails.

[Technical Parameters]: Simulated handheld camera, shallow depth of field, color shift, emotionally intense.
```

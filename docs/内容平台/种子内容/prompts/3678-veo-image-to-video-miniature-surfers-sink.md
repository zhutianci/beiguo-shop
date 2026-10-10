---
title: veo 3.1 图生视频提示词：洗手池里的微缩冲浪者（先出图再让它动起来 · 超现实微距）
slug: veo-image-to-video-miniature-surfers-sink
model: veo
topics: [image-to-video, cinematic]
modelLabel: Veo 3.1
aspectRatio: "16:9"
needsRefImage: true
useCase: 演示"图像模型出首帧 → Veo 图生视频"的两步工作流：先生成一张"复古铜水龙头不停流水，石头洗手池里有微缩冲浪者在冲浪"的超现实微距照片，再让它动起来。适合创意短视频、微缩世界题材、品牌趣味广告。
prompt: |
  （以我上传的图片作为首帧）
  一段超现实的电影感微距视频。微小的冲浪者在一个[石头洗手池]里，乘着永不停歇的翻滚浪花冲浪。一个正在流水的[复古铜水龙头]制造出源源不断的浪。
  镜头缓缓横移，扫过这个充满奇趣、洒满阳光的场景，微缩的小人们熟练地在碧绿的水面上切出弧线。
  画面：浅景深的微距质感，明亮的自然光，水花细节清晰。
  声音：水龙头哗哗的流水声，浪花拍打池壁的声音，微小的、遥远的欢呼声。
negativePrompt: 小人变形，水池变形，水流断开，画面文字，水印
source:
  repo: Gemini API 文档：Veo 3.1 视频生成
  url: https://ai.google.dev/gemini-api/docs/veo
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文；补充了画面质感与声音描述，以及首帧说明；水池与水龙头设为变量"
imageBrief: 站长先按正文里的首帧提示词出图，再生成视频；展示首帧图与视频中段、结尾各一帧。
verify:
  - Veo 3.1 图生视频实测 3 次：首帧中的小人在运动中是否保持形态
  - 首帧图分辨率与比例要求以官方说明为准
---
**时长与镜头**：一个缓慢横移的镜头。Veo 的图生视频会把上传的图片当作第一帧，所以构图、光线、主体在出图那一步就已经决定了，视频提示词只需要写"怎么动"和"什么声音"。

**两步怎么做**：①先用图像模型（官方示例用的是 Nano Banana，本站的 gpt-image-2 / nano banana 提示词也可以）生成首帧，官方给的首帧提示词是：

> 一张超写实的微距照片：微小的冲浪者在一个质朴的石头洗手池里乘浪冲浪，一个复古铜水龙头正在流水，制造出永不停歇的浪花。超现实、奇趣，明亮的自然光。

②把这张图上传到 Veo 图生视频，粘贴上面的视频提示词。官方文档的建议是：选一张最接近你设想的"第一个画面"的图片。

**怎么填变量**：[石头洗手池] 换成"咖啡杯""浴缸""鱼缸"；冲浪者可以换成"微缩的帆船""一群小鸭子"。

**常见失败与调整**：
- 小人在运动中糊掉：首帧里小人不要太小，最好占画面的 1/10 以上。
- 浪花变成静止的水：写"浪花持续翻滚，水龙头一直在流"。
- 视频和首帧差别很大：减少提示词里与首帧不一致的描述，只写运动。

> 改编自 Gemini API 官方文档《[Generate videos with Veo 3.1](https://ai.google.dev/gemini-api/docs/veo)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
Input image prompt: A hyperrealistic macro photo of tiny, miniature surfers riding ocean waves inside a rustic stone bathroom sink. A vintage brass faucet is running, creating the perpetual surf. Surreal, whimsical, bright natural lighting.

Video prompt: A surreal, cinematic macro video. Tiny surfers ride perpetual, rolling waves inside a stone bathroom sink. A running vintage brass faucet generates the endless surf. The camera slowly pans across the whimsical, sunlit scene as the miniature figures expertly carve the turquoise water.
```

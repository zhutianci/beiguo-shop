---
title: veo 3 提示词：跳切换装视频（同一位置、同一机位 · 一秒一套衣服的卡点变装）
slug: veo-jump-cut-outfit-change
model: veo
topics: [cinematic, motion-graphics, fashion]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 用"跳切（jump cut）"做卡点换装：人物坐在同一个位置，背景和机位完全不变，衣服一跳一换。适合穿搭博主、服装店上新、"一周穿搭"类内容，也是学习剪辑手法类提示词的官方范例。
prompt: |
  一个人坐在同一个位置，但穿着不同的衣服，每次换装之间用干脆利落的跳切，竖屏 9:16，约 8 秒。
  背景保持静止，人物在新衣服里瞬间重新出现，形成快节奏、有韵律的跳切效果。
  灯光和构图保持一致，以强调突然的变化。
  衣服依次是：[白色衬衫配牛仔裤]、[黑色皮夹克]、[米色针织开衫]、[红色连衣裙]。
  每套衣服停留约 2 秒，人物在每套里换一个小姿势（托腮、抱臂、整理衣领、微笑看镜头）。
  场景：[一面米白色墙前的木椅]，柔和的窗光。
  声音：每次跳切时一声轻快的"咔"，配合节拍。
negativePrompt: 人物换脸，背景变化，机位移动，淡入淡出转场，手指畸形，文字，水印
source:
  repo: Google Cloud 文档：Veo 视频生成提示词指南
  url: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide
  author: "Google"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "官方英文示例译为中文并扩写：补充了四套服装、每套的姿势、场景和卡点声音；服装和场景设为变量"
imageBrief: 站长生成 1 条，截取四套服装各一帧。
verify:
  - Veo 3.1 实测 3 次：四次换装中人物脸部是否一致、背景是否真的不变
  - 8 秒里能稳定换几套（预计 3–4 套）
---
**时长与镜头**：8 秒、固定机位，四套衣服各 2 秒。Google 指南在"电影术语"一节里说明，可以直接在提示词里使用剪辑手法的名称，如 match cut（匹配剪辑）、jump cut（跳切）、montage（蒙太奇），这条就是跳切的官方示例。核心约束是"背景、灯光、构图都不变"，只有衣服在变，跳切的冲击力才出来。

**怎么用**：穿搭类账号的"一周穿搭""同一条裤子的四种搭配"、服装店的新品合集都可以套用。想要人物保持一致，可以改用 Veo 3.1 的参考图模式上传人物照片（官方说明最多 3 张参考图，参考图模式只能 8 秒）。

**怎么填变量**：四套 [服装] 写清颜色和款式；[一面米白色墙前的木椅] 换成你的店铺一角或卧室。想做"四季变装"，就把衣服换成"短袖 → 风衣 → 羽绒服 → 碎花裙"，背景窗外也可以写"窗外景色随季节变化"（但会增加难度）。

**常见失败与调整**：
- 换衣服时人也换了：减少到 3 套，或用参考图模式锁定人物。
- 跳切变成了淡入淡出：负面提示词写"淡入淡出转场"，并强调"瞬间切换"。
- 背景跟着变：写"背景墙和椅子在每一帧都完全一样"。

> 改编自 Google Cloud 官方文档《[Video generation prompt guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide)》中的示例提示词，许可证 CC BY 4.0。

### 英文原版

```
A person sitting in the same position but wearing different outfits, with sharp jump cuts between each outfit change. The background should stay static and the person should reappear instantly in the new outfit, creating a fast-paced, rhythmic jump cut effect. The lighting and framing should remain consistent to emphasize the sudden changes
```

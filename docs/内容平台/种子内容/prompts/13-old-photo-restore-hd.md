---
title: AI老照片修复提示词：gpt-image-2 老照片高清化
slug: old-photo-restore-hd
model: gpt-image-2
topics: [old-photo]
needsRefImage: true
useCase: 把模糊、有划痕的老照片重绘成清晰的数码照片质感，适合家庭相册整理、纪念册。
prompt: |
  把我上传的这张老照片转成一张高分辨率的数码照片，看起来像是[最近]用一台全画幅数码相机拍的。
  只提升画质和清晰度：修复划痕、折痕、污点和噪点，补全模糊的细节。
  人物的五官、表情、发型、衣着、姿势，以及背景里的物体和构图都保持原样，不要增加或删除任何内容，不要美颜。
  色彩：[保持原照片的色调]。
  光线和调色自然，不要过度锐化。
  （处理多张时，第一张满意后在同一对话里上传其余照片，并说："把这几张也按同样的方式处理。"）
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/CuriousRefuge/status/2065139340486045905
  author: "@CuriousRefuge"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；原文指定了具体相机型号和"电影感调色"，本站改为通用描述，并新增"修复划痕""不要增删内容""不要美颜"等约束；时间和色彩处理改为变量
imageBrief: 用站长自家（已获家人同意）的一张有划痕或褪色的老照片作输入，生成 2 张：保持原色调一版，[保持原照片的色调] 改为"自然上色，肤色真实"一版；附原图对比。不要用网上找的他人老照片。
verify:
  - 在 gpt-image-2 上实测 3 次，记录人脸是否被"重画成另一个人"
  - 小尺寸、严重模糊的照片效果是否明显变差
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[最近] 一般不用改；[保持原照片的色调] 想上色就改成"自然上色，肤色真实"，还可以补充已知的颜色，例如"外套是藏蓝色"。

**要先知道**：AI 修复本质上是"重绘"，模糊处的细节是模型推测补上的，不是还原真相。人脸越小、越模糊，越容易被画成"另一个人"。

**常见失败与调整**：
- 脸不像了：先翻拍或扫描得更清楚；或者只要求"修复划痕和污点，不提高清晰度"。
- 颜色怪异：明确写出已知颜色，或保留黑白。
- 背景多出东西：保留"不要增加或删除任何内容"这一句。

**适合 / 不适合**：适合家庭留念；不适合史料研究、证据、寻亲比对等需要真实性的用途。原件和原始扫描件要另外保存好。

> 改编自 [@CuriousRefuge](https://x.com/CuriousRefuge/status/2065139340486045905) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

---
title: seedance 提示词：机械手表广告视频（制表师组装机芯特写）
slug: seedance-watchmaker-commercial
model: seedance
topics: [product-video, cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 给手表、首饰、精密器械做"匠心工艺"感的广告片：从齿轮微距到上手展示，适合品牌宣传片、详情页头图视频。
prompt: |
  生成一条约[12]秒的写实电影感手表广告片，16:9 横屏。
  场景：昏暗而高级的[制表工坊]，一位专注的制表师坐在工作台前，一盏台灯打出集中的暖光。
  镜头一（0–3 秒）：微距特写，细小的齿轮、螺丝和摆轮缓慢转动，金属反光真实。
  镜头二（3–6 秒）：制表师双手的特写，他用镊子把一个细小零件精准地放进[金色机械表]的机芯，动作稳定、克制。
  镜头三（6–9 秒）：镜头缓慢拉开，完成的手表被软布擦拭，然后戴到他的手腕上。
  镜头四（9–12 秒）：极近微距收尾，透过[镂空表背]能看到机芯齿轮持续运转。
  风格：暗调优雅的布光，真实的金属反射，浅景深，平稳缓慢的运镜，奢侈品广告质感，照片级写实。
  声音：极轻的齿轮滴答声和工具碰触声，低沉的弦乐铺底。
  画面中不要出现文字、Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/AynahhX/status/2104757960425795714
  author: "@AynahhX"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文并拆成 4 个带时间码的镜头；工坊、表款、表背改为变量；补充时长、画幅和声音描述
images:
  - 201-seedance-watchmaker-commercial-1.jpg
imageCredit:
  by: "@AynahhX"
  url: https://x.com/AynahhX/status/2104757960425795714
  license: CC BY 4.0
verify:
  - 在即梦 / 火山方舟等提供 Seedance 2.0 的入口实测 3 次，记录可选时长和比例（以官方说明为准）
  - 镜头二镊子夹零件时，手指是否畸形、零件是否凭空出现或消失
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：4 个镜头约 12 秒。平台只能选 5 秒或 10 秒时，删掉镜头三；想要更稳，可以把镜头一、镜头四各自单独生成，再在剪辑软件里拼接。

**怎么填变量**：[金色机械表] 写清材质和颜色，如"银色钢壳蓝盘手表"；[制表工坊] 可换成"珠宝工作室""皮具工坊"，整条提示词就能改做首饰、皮包的工艺广告。有实物照片时，上传为参考图并加一句"手表外观以参考图为准"。

**常见失败与调整**：
- 手和镊子穿模：把镜头二改成"零件被缓缓放进机芯，只露出镊子尖"，减少手指出镜。
- 表盘刻度、指针数量混乱：写明"三根指针、12 个刻度"，或者最后几秒用真实产品照片替换。
- 冒出假 Logo 或乱码文字：保留最后一句"不要文字和 Logo"，品牌标识后期叠加。

> 改编自 [@AynahhX](https://x.com/AynahhX/status/2104757960425795714) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a cinematic, ultra-realistic luxury watchmaking commercial. Show a skilled watchmaker in a dark premium workshop carefully assembling an intricate mechanical gold watch. Start with close-ups of tiny gears, screws and moving mechanisms, then show his hands precisely placing the delicate components with professional tools. Slowly reveal the complete watch being polished and placed on his wrist. End with an extreme macro shot of the finished watch and its moving mechanical gears. Dark elegant lighting, realistic metal reflections, shallow depth of field, smooth camera movement, detailed craftsmanship, premium luxury advertisement aesthetic, photorealistic 3D animation. No text, logos or watermark.
```

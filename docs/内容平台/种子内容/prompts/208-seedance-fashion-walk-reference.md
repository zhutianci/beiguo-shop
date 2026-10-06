---
title: seedance 提示词：上传穿搭照生成走秀视频（人物和衣服保持不变）
slug: seedance-fashion-walk-reference
model: seedance
topics: [image-to-video]
modelLabel: Seedance 2.0
aspectRatio: "2:3"
needsRefImage: true
useCase: 用一张全身穿搭照生成 8–10 秒的时装走秀短视频：迎面走来、侧身回眸、整理外套、擦肩回头，适合服装店上新、穿搭博主、模特卡展示。
prompt: |
  用我上传的参考图作为人物和服装的唯一依据，生成一条流畅、写实的时装走秀视频。全程保持她的五官、发型、服装、身材比例、颜色和整体形象不变。全身构图，电影感时尚摄影，自然真实的动作，柔和日光。
  场景 1｜向前走：她自信地站定，然后迈着自然优雅的步子慢慢走向镜头，双手随意插在[棒球夹克]口袋里，头发随步伐轻轻摆动。
  场景 2｜侧身：走动中她身体微微侧转，短暂看向镜头，露出一个淡淡的自信微笑，头发随动作自然摆动。
  场景 3｜夹克动作：她停下片刻，重心落在一条腿上，肩膀微微后展，一只手留在口袋里，另一只手随意整理一下外套。
  场景 4｜擦肩回头：她继续向前走过镜头，然后轻轻回头越过肩膀看一眼，带着浅笑继续往前走，[裙摆]和头发随动作自然飘动。
  平稳的跟拍运镜，细腻的电影感镜头移动，真实的走路物理、自然的表情、真实的面料和头发运动；没有突兀动作，身体不变形，脸不变，没有多余的手指或肢体，服装和外形前后一致；高端时装广告质感，竖版 2:3，时长[8–10]秒。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/HaniaAi12/status/2105845066514436402
  author: "@HaniaAi12"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；外套、下装、时长改为变量
images:
  - 208-seedance-fashion-walk-reference-1.jpg
imageCredit:
  by: "@HaniaAi12"
  url: https://x.com/HaniaAi12/status/2105845066514436402
  license: CC BY 4.0
verify:
  - 示例图是原帖的"分镜参考板"（作者用作输入的图），不是视频截图；站长可补一张自己实测的成片截图
  - 平台是否支持 2:3 比例；不支持时用 9:16 实测
  - 是否拦截真人人脸参考图；如拦截，改用 AI 生成的虚拟模特图
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：4 个场景连在一起约 8–10 秒，是一个连续镜头里的 4 个动作，不需要切镜头。时长只有 5 秒时，只保留场景 1 和场景 4。

**参考图怎么拍**：全身、正面、光线均匀、背景干净，衣服的关键细节（印花、扣子、包）要清楚。参考图只露半身，模型就会自己"脑补"下半身和鞋子。请只用本人或已获授权的照片。

**怎么填变量**：把 [棒球夹克] 换成参考图里实际的外套名称，比如"米色风衣""牛仔外套"；没有口袋就把场景 1 改成"双手自然摆动"。

**常见失败与调整**：
- 走着走着脸变了：减少转头动作，删掉场景 2；把"保持五官不变"放在提示词最前面。
- 走路像滑行、腿部扭曲：加一句"每一步脚跟先着地，步幅自然"，并降低速度"慢慢走"。
- 印花图案糊掉：图案越复杂越难保持，可以在描述里写清"胸前是[一只白色小熊印花]"。

> 改编自 [@HaniaAi12](https://x.com/HaniaAi12/status/2105845066514436402) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
Create a smooth, realistic fashion walk video using the reference image as the exact character and outfit reference. Preserve her facial features, hairstyle, clothing, body proportions, colors, and overall identity throughout the entire video. Full-body framing, cinematic fashion photography, natural realistic movement, soft daylight.
Scene 1 – Walk Forward: She begins standing confidently, then slowly walks toward the camera with natural elegant steps. Her hands remain casually inside the varsity jacket pockets, hair gently moving with each step.
Scene 2 – Side Pose: While walking, she slightly turns her body toward the side, looks briefly toward the camera, and gives a soft confident smile. Her hair naturally follows the movement.
Scene 3 – Jacket Pose: She stops for a moment, shifts her weight onto one leg, slightly pulls her shoulders back, keeps one hand in the jacket pocket, and casually adjusts the jacket with the other hand.
Scene 4 – Final Walk & Turn: She resumes walking past the camera, then gently turns her head over her shoulder with a subtle smile before continuing forward. Her skirt and hair move naturally with the motion.
Smooth camera tracking, subtle cinematic camera movement, realistic walking physics, natural facial expressions, realistic fabric and hair motion, no sudden movements, no body distortion, no face changes, no extra fingers or limbs, consistent outfit and appearance, premium fashion campaign aesthetic, vertical 2:3, 8–10 seconds.
```

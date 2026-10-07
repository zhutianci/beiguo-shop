---
title: veo 3 提示词：浴室镜子自拍种草视频（素颜试用精华 · UGC 真实感 6 秒）
slug: veo-ugc-mirror-selfie-skincare
model: veo
topics: [product-video]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 做"像真人随手拍"的 UGC 种草素材：浴室起雾的镜子前举着手机自拍，敲敲瓶子、点两滴、左右转脸，配一句小声的感叹，适合护肤、洗护、面膜类产品的信息流广告和种草笔记。
prompt: |
  手持手机对着微微起雾的浴室镜子自拍，竖屏 9:16，约 6 秒。一位三十出头的女性，穿着宽松 T 恤，素颜、皮肤带着水润光泽。
  0–2 秒：她凑近镜子，把[精华液瓶]朝镜头轻轻敲了敲，话说到一半笑了出来。
  2–4 秒：镜头微微推近，她把两滴精华点在颧骨上，用指尖小圈打开，窗外的光照出肌肤上的光泽。
  4–6 秒：她慢慢左右转脸，对着镜子里的自己挑了挑一边眉毛，像是真的有点意外。
  光线：温暖的晨间窗光，皮肤质感真实、能看到毛孔，镜面上挂着几道水痕。
  脸型和肤质在每一拍都保持一致，不变形、不漂移。
  声音：隔着门的流水声，她小声说："[嗯……还不错。]"
negativePrompt: 磨皮塑料脸，脸部变形，手指畸形，手机变形，乱码文字，字幕，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#bathroom-mirror-skincare-truth
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；产品与台词改为变量；台词改为中性的主观感受，不涉及功效"
images:
  - 3606-veo-ugc-mirror-selfie-skincare-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/bathroom-mirror-skincare-truth.png
  license: CC BY 4.0
verify:
  - 在 Veo 3.1 实测 3 次，记录中文台词的口型与发音是否自然（必要时改用英文台词）
  - 镜中倒影与手机的对应关系是否穿帮
  - 示例图是仓库提供的 AI 关键帧图（虚构人物，已转 JPG 压缩）
---
**时长与镜头**：6 秒三拍：敲瓶子 → 点涂 → 转脸反应。Veo 3.1 单条可选 4 / 6 / 8 秒（1080p 及以上只能 8 秒，以官方说明为准），选 8 秒时在结尾加一拍"她把瓶子放回台面，瓶身正面朝镜头"，正好做产品收尾。UGC 素材的真实感来自"缺陷"：起雾、水痕、毛孔、手持晃动，别加"电影感""完美肌肤"这类词。

**怎么填变量**：[精华液瓶] 换成"洗发水""面膜盒""防晒喷雾"，动作随之改成"挤一泵在手心""揭开面膜"。台词 [嗯……还不错。] 保持短、口语、像自言自语；广告法角度也不要写"美白""祛痘"这类功效词。

**常见失败与调整**：
- 镜子里外动作对不上：去掉镜子，改成"前置摄像头自拍"，穿帮少很多。
- 脸被磨得像假人：保留"能看到毛孔"，负面提示词写"磨皮塑料脸"。
- 台词被念成播音腔：在台词前加"小声、带笑意地说"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Handheld phone selfie shot into a slightly steamed bathroom mirror, woman early-30s in an oversized tee, dewy bare skin, no makeup. 0-2s: she leans toward the glass and taps the [brand] serum bottle against the camera, half-laughing mid-sentence. 2-4s: micro-zoom in as she presses two drops onto her cheekbone, fingertips spreading in small circles, window light catching the sheen. 4-6s: she turns her face slowly side to side, raising one eyebrow at her own reflection, caught genuinely off guard. Warm morning window light, soft skin texture with visible pores, faint water droplets streaking the mirror. Face shape and skin finish stay consistent across beats, no deformation, drift, or artifacts. Implied sound: muffled running tap, a quiet 'okay... wow.'
```

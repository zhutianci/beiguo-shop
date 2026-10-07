---
title: veo 3 提示词：街头墨镜试戴自拍视频（打开眼镜盒—戴上—转身—压低镜框 · UGC）
slug: veo-sunglasses-street-try-on-selfie
model: veo
topics: [product-video, fashion]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 眼镜、墨镜、帽子、耳饰类配饰的 UGC 试戴视频：阳光街头手持自拍，开盒、戴上、对着橱窗看、转身展示侧面、压低镜框挑眉，适合种草笔记和信息流投放。
prompt: |
  户外手持自拍，竖屏 9:16，约 8 秒。一位时髦的女生站在阳光充足、人来人往的人行道上，手里拿着一个小小的[品牌]眼镜盒，轻松的试戴测评氛围。
  0–2 秒：她对着镜头"啪"地打开眼镜盒，把[玳瑁色墨镜]拿出来，嘴里说着："[来，看看。]"
  2–4 秒：她一个流畅的动作戴上墨镜，抬起下巴，侧头看了看旁边橱窗里的倒影。
  4–6 秒：快速转身 180 度，展示镜框的侧面轮廓，头发被风吹起，然后转回来对着镜头自信地一笑。
  6–8 秒：她把墨镜往下压一点点，从镜框上方看向镜头，双眉一挑。
  光线：明亮的正午阳光，阴影清晰，身后是真实的街景虚化，一道镜头光晕划过镜框。
  声音：街头的人声，她小声满意地说："[嗯，可以。]"
  镜框形状和镜片颜色全程一致，不变形、不漂移。
negativePrompt: 镜框变形，镜片颜色变化，手指畸形，脸部漂移，路人畸形，乱码文字，字幕，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#try-on-eyewear-street-spin
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；品牌、墨镜款式和两句台词改为变量"
images:
  - 3615-veo-sunglasses-street-try-on-selfie-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/try-on-eyewear-street-spin.png
  license: CC BY 4.0
verify:
  - Veo 3.1 实测 3 次：180 度转身时脸部与镜框是否稳定
  - 中文台词的口型与发音是否自然
  - 示例图是仓库提供的 AI 关键帧图（虚构人物，已转 JPG 压缩）
---
**时长与镜头**：8 秒四拍：开盒 → 戴上照橱窗 → 转身 → 压镜框挑眉，正好用满 Veo 单条 8 秒。UGC 试戴的节奏是"每 2 秒一个小动作 + 一个表情"，动作要日常、表情要松弛，别写"模特走秀"。

**怎么填变量**：[玳瑁色墨镜] 换成"银色细框眼镜""渔夫帽""珍珠耳环"，相应把"戴上墨镜"改成"戴上帽子压一压帽檐""把头发别到耳后露出耳环"。两句台词保持 3–6 个字最稳，口型更容易对上。

**常见失败与调整**：
- 转身 180 度时脸换了个人：转身改成"侧过脸展示镜框侧面"，角度小一点。
- 橱窗倒影穿帮：删掉照橱窗的动作。
- 路人走着走着变形：写"背景行人虚化"或把场景改成人少的小巷。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Outdoor handheld selfie, stylish woman on a busy sunlit sidewalk holding a small [brand] eyewear case, casual try-on review energy. 0-2s: she snaps the case open to camera and lifts the sunglasses out, mouthing 'okay, let's see.' 2-4s: she slides them on in one smooth motion, lifts her chin, and checks her reflection in the shop window beside her. 4-6s: a quick 180 spin showing the frames in profile, hair lifting in the breeze, then back to a confident smirk at the lens. 6-8s: she lowers the glasses an inch and peeks over the top, both eyebrows raised. Bright midday sun with crisp shadows, real street bokeh behind her, a streak of lens flare across the frames. Frames hold consistent shape and tint, no deformation, drift, or artifacts. Implied sound: street chatter, a small approving 'oh yeah.'
```

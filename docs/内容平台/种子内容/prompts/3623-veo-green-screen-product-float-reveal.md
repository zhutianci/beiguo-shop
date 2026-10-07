---
title: veo 3 提示词：绿幕主播产品悬浮展示（手心变出耳机 · 空中旋转 + 卖点标注）
slug: veo-green-screen-product-float-reveal
model: veo
topics: [product-video, motion-graphics]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 模仿短视频里"主播在绿幕前一摊手、产品凭空出现并在空中旋转展示"的格式，适合头戴耳机、小家电、数码配件做卖点讲解；绿幕背景方便后期抠像换成任何场景。
prompt: |
  锁定机位的中景，一位女主播站在画面中央，身后是纯色绿幕，明亮均匀的主光，竖屏 9:16，约 6 秒。
  0–2 秒：她朝身旁摊开的空手掌示意，眉毛上扬，像正在讲解到一半。
  2–3 秒：一副哑光黑色的[头戴式耳机]随着一声轻响和一道细细的蓝色轮廓光，凭空出现在她手掌上方，悬浮着慢慢稳定下来。
  3–5 秒：她轻轻一抖手腕，耳机在空中缓慢旋转 180 度——裸露的发声单元、缝线头梁、柔软耳罩依次被棚灯照亮；几枚空白的白色圆角标注卡片从铰链和发声单元旁滑入，然后淡出。
  5–6 秒：耳机稳稳落进她合拢的手心，她自信地点点头。
  声音：出现时干脆的"嗖"一声，接住时一声轻轻的"咔"。悬浮时下方有淡淡的接触阴影。
  耳机的几何形状、铰链角度和哑光质感始终一致：不扭曲、不重影、不抖动、不漂移。
negativePrompt: 耳机变形，重影，抖动，手指畸形，脸部漂移，卡片上的乱码文字，绿幕溢色，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#green-screen-spec-reveal
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；产品改为变量；标注卡片改为空白卡片、文字后期加"
imageBrief: 仓库关键帧图里主播拿的是瓶子而非耳机，与本条不符，未采用。站长生成 1 条，截取"空手示意""耳机悬浮旋转""接住"三帧。
verify:
  - Veo 3.1 实测 3 次：耳机凭空出现和落回手心两个瞬间是否自然
  - 标注卡片上是否仍出现乱码
---
**时长与镜头**：6 秒四拍：摊手 → 变出 → 空中旋转 + 标注 → 接住点头。机位全程锁定，所有变化都发生在产品上，这样主播和背景稳定、后期好抠像。Veo 3.1 可选 4 / 6 / 8 秒（以官方说明为准），选 8 秒时把旋转改成 360 度。

**怎么用**：绿幕是这条的精髓——生成后在剪辑软件里用"色度抠图"把绿色换成直播间、品牌背景或产品场景图。标注卡片只要求"空白的白色圆角卡片"，卖点文字（续航、降噪等）后期填进去，既不会乱码，也能随时改。

**怎么填变量**：[头戴式耳机] 换成"无线吸尘器""智能音箱""运动相机"；体积大的产品把"手掌上方"改成"身旁半空中"。

**常见失败与调整**：
- 产品出现时像贴图：保留"细细的蓝色轮廓光"和"接触阴影"，增加真实感。
- 旋转后耳机左右反了或变形：旋转角度降到 90 度。
- 绿幕边缘溢色到人物身上：写"人物与绿幕保持一米距离，侧逆光"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Locked-off medium shot, creator centered against a flat chroma background, bright even key light. 0-2s: she gestures to her open empty palm beside her, eyebrows up, mid-sentence presenter energy. 2-3s: matte-black [brand] over-ear headphones materialize above the palm with a soft pop and a thin blue rim-light flare, hovering and settling. 3-5s: she flicks her wrist and the headphones rotate a slow 180° in mid-air — exposed driver, stitched headband, and cushioned earcups each catching the studio key as they pass; crisp white feature-callout chips slide in beside the hinge and driver, then fade. 5-6s: the headphones drop neatly into her cupped hand and she gives a confident nod. Snappy whoosh on the spawn, soft click on the catch, subtle contact shadow grounding the float. The headphones keep identical geometry, hinge angle, and matte finish throughout — no warping, ghosting, jitter, drift, or artifacts.
```

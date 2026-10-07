---
title: 可灵提示词：护肤品前后对比微距视频（暗沉干燥 → 水润光泽 · 竖屏 8 秒）
slug: kling-skin-glow-before-after-macro
model: kling
topics: [product-video, image-to-video]
aspectRatio: "9:16"
needsRefImage: true
useCase: 用一个脸颊皮肤的微距画面做"涂抹前 → 涂抹后"的视觉对比，适合面霜、精华、身体乳的使用感展示；只展示光泽和质感变化，不做功效承诺。
prompt: |
  极近的美妆微距镜头，竖屏 9:16，约 8 秒，以我上传的皮肤特写图为首帧。
  画面：清冷晨光下的一侧脸颊，皮肤略显疲惫干燥，表面有细小的起皮，毛孔真实，整体偏灰。
  0–2 秒：固定机位微距，浅景深，如实呈现肤质细节，不做任何磨皮。
  2–4 秒：一根指尖蘸着一颗珍珠大小的[乳白色面霜]，沿脸颊抹开，膏体反着光，铺成一层薄薄的膜。
  4–7 秒：在美容灯的主光下，肌肤呈现出柔润饱满的光泽感，泛起健康的暖金色光泽，皮肤上出现一点高光。
  7–8 秒：镜头轻轻后拉，露出平静、均匀、有光泽的脸颊局部。
  同一张脸的轮廓、雀斑、骨相全程一致：不过度磨皮、不融化、不出现五官漂移。
  声音：指尖轻点皮肤的声音，一声轻柔的呼气。
negativePrompt: 塑料感磨皮，五官漂移，皮肤融化，雀斑消失，手指畸形，多余的手指，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#dull-skin-to-glow
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文\"细纹舒展\"等效果表述删去，只保留光泽与质感的画面描述；补充首帧与负面提示词；产品质地改为变量"
images:
  - 3609-kling-skin-glow-before-after-macro-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/dull-skin-to-glow.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次，检查前后两段是否仍是同一块皮肤（雀斑位置是否一致）
  - 发布前提醒：前后对比画面为 AI 生成，用于商业广告时需遵守广告法，不得暗示真实功效
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒，几乎是一个固定机位的长镜头：静止展示 → 涂抹 → 光泽出现 → 轻微后拉。可灵选 5 秒时去掉最后的后拉；选 10 秒可以在开头多给 1 秒静止，让"前"的状态更清楚。首帧建议用侧脸颊的特写图（可以先用图像模型生成一张虚构人物的皮肤特写），不要用可识别的真人正脸。

**怎么填变量**：[乳白色面霜] 换成"透明啫喱""金色精华油""身体乳"，场景也可以从脸颊换成"手背""小腿"，做身体护理类产品。

**合规提醒**：这类前后对比画面是生成的，不是真实使用效果，商业投放时不要配"7 天美白""淡化细纹"之类的功效文案，只说质地、肤感和使用场景。

**常见失败与调整**：
- "后"的皮肤像塑料：保留"能看到毛孔""不过度磨皮"，把"均匀"改成"有光泽"。
- 雀斑和纹理整体换了一张脸：缩短变化过程，或改用首尾帧模式，首尾两张图都用同一张图修出来。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Extreme beauty macro, 9:16. A cheek in cold morning light — skin tired and dry, fine flaking at the surface, pores honest, a gray-green cast. [0-2s] static macro, shallow focus, every dull texture detail rendered truthfully, no smoothing. [2-4s] a fingertip presses a single pearl of [brand] serum and glides it across the cheek; the droplet catches light and spreads into a thin film. [4-7s] the skin shifts to a soft hydrated bounce, fine lines easing, a healthy warm-gold sheen blooming under a beauty-dish key with a catchlight in the down. [7-8s] a slight pull-back reveals a calm, even, luminous complexion. Same face geometry, same freckles, same bone structure across the whole shot — no plastic over-smoothing, melting, or facial drift. Implied sound: a gentle tap of fingertip on skin, a soft exhale.
```

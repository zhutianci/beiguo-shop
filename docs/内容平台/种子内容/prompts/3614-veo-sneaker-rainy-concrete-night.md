---
title: veo 3 提示词：雨夜球鞋广告大片（湿水泥地踩水 · 霓虹倒影 · 环绕定格）
slug: veo-sneaker-rainy-concrete-night
model: veo
topics: [product-video, cinematic]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 街头感、夜景、潮流品牌调性的运动鞋广告：低机位踩水溅起水花、横移跟拍、转身环绕、水滴从鞋带尖落下定格，适合新品发布和品牌宣传竖屏。
prompt: |
  一支高端运动鞋广告，主角是[品牌]的[旗舰款跑鞋]，场景是黄昏时分被雨打湿的水泥地，竖屏 9:16，约 8 秒。
  0–2 秒：低机位微距，鞋底踩下，水被挤开溅起一圈细细的水花皇冠，脚下的倒影里，霓虹招牌被拖成一片光晕。
  2–4 秒：快速的横向轨道跟拍，跟着行进中的鞋子，背景强烈的运动模糊，而鞋面、网布和缝线依然锐利。
  4–6 秒：穿鞋的人站定、转身；镜头一甩进入紧凑的环绕，扫过鞋跟，一道品红色轮廓光包住鞋身。
  6–8 秒：缓慢推进到英雄定格，雾气落定，一颗水滴从鞋带尖端滴下。
  光线：阴郁的青色与品红色布光；质感：湿橡胶和科技网布。
  声音：远处城市的嗡鸣，一声清脆的脚步声。
  鞋子的形状、配色、拼接结构和标志位置在每一帧都保持一致。
negativePrompt: 鞋子变形，配色变化，重复的鞋，腿部畸形，乱码标志，过曝，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#sneaker-wet-concrete
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；品牌和鞋款改为变量；负面提示词写成名词短语"
imageBrief: 仓库示例图带知名品牌标志，未采用。站长生成 1 条，截取踩水溅起、环绕品红轮廓光、水滴定格三帧。
verify:
  - Veo 3.1 实测 3 次，记录横移跟拍时鞋面是否保持锐利
  - 需要固定产品外观时用参考图模式（官方说明最多 3 张、仅 8 秒），记录一致性
---
**时长与镜头**：8 秒四拍，正好是 Veo 单条的最长时长（以官方说明为准）：微距踩水 → 横移跟拍 → 甩镜环绕 → 推进定格。四种运镜挤在 8 秒里节奏很快，适合配鼓点音乐；觉得乱的话，删掉第三拍的甩镜环绕，改成"缓慢推近鞋跟"。

**怎么填变量**：[品牌] 和 [旗舰款跑鞋] 换成自己的；没有品牌的话删掉"品牌"二字。雨夜霓虹是"街头潮流"调性，想要户外机能风可以把场景换成"清晨雾气中的山间碎石路"，光线换成"冷白色逆光"。

**常见失败与调整**：
- 跟拍时腿和脚比例怪：画面只拍到脚踝以下，写"镜头只拍鞋子和小腿下半截"。
- 霓虹倒影里出现乱码招牌：写"霓虹只是虚化的色块"。
- 鞋子款式每拍都不一样：改用参考图模式，或者先出一张产品图走图生视频。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
High-end sneaker commercial for the [brand] flagship silhouette on rain-slicked concrete at dusk. 0-2s: low-angle macro of the outsole pressing down, water displacing in a fine crown of droplets, neon shop signs smearing in the reflection underfoot. 2-4s: a fast lateral tracking dolly follows the shoe mid-stride, heavy motion blur on the background while the upper, mesh, and stitching stay tack-sharp. 4-6s: the wearer plants and pivots; the camera whips into a tight orbit catching the heel logo, a streak of magenta rim light wrapping the silhouette. 6-8s: slow push into a hero freeze, mist settling, a single drop falling from the lace tip. The shoe keeps consistent shape, colorway, panel layout, and logo placement across every frame — no deformation, drift, doubling, or artifacts. Moody cyan-magenta lighting, wet rubber and technical-mesh texture, distant city hum and one crisp footstep.
```

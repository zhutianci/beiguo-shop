---
title: veo 3 提示词：奢侈品级精华液广告（黑色大理石 · 液滴慢动作 + 180 度环绕）
slug: veo-black-serum-marble-luxury
model: veo
topics: [product-video, cinematic]
modelLabel: Veo 3.1
aspectRatio: "9:16"
needsRefImage: false
useCase: 做高端、冷峻、杂志感的美妆广告片：黑色大理石台面、液滴慢动作、轨道推进和半圈环绕，适合精华、香水、男士护肤等需要"贵"的质感的产品。
prompt: |
  一支[抗老精华]的杂志风美妆广告，竖屏 9:16，约 6 秒，场景是一块哑光黑色大理石。
  0–2 秒：玻璃滴管尖端的极近微距，一颗[琥珀色]液滴慢慢鼓起、颤动，然后以真实的慢动作落下，在光亮的液面上漾开涟漪，棚灯在水珠里折射。
  2–3 秒：切到磨砂玻璃瓶在电动滑轨上平滑滑入画面，一道硬质主光低角度扫过刻纹瓶盖，瓶底柔和地融进阴影。
  3–5 秒：镜头平滑地绕瓶子环绕 180 度，[品牌标签]清晰可辨，一条细长的高光沿着玻璃边缘向下滑。
  5–6 秒：锁定机位的主视觉画面，最后一圈涟漪在大理石上慢慢平息。
  光线：冷静的实验室感布光，深邃饱和的黑色，液态玻璃质感。
  声音：只有一滴液体落在冰冷石面上的轻响。
  瓶子形状、磨砂质感、瓶盖刻纹和标签文字在每一帧都一致。
negativePrompt: 瓶子变形，标签乱码，重复的瓶子，液滴凭空出现，塑料质感，过曝，文字，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#black-serum-cold-marble
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；产品名、液体颜色、品牌标签改为变量；负面提示词按 Veo 官方建议写成名词短语"
images:
  - 3608-veo-black-serum-marble-luxury-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/black-serum-cold-marble.png
  license: CC BY 4.0
verify:
  - Veo 3.1 实测 3 次，记录 180 度环绕时标签是否保持一致
  - 原文是"视频提示词通用写法"，在 Veo 上没有参考图时产品外观是随机的，需要固定外观可用参考图模式（官方说明最多 3 张）
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：6 秒四拍，有一个硬切（液滴微距 → 瓶子滑入），所以要么选 Veo 的 6 秒或 8 秒档，要么把两段分开生成再剪。选 8 秒时把环绕段拉长到 3 秒，环绕越慢越不容易崩。黑底产品片在竖屏里最"贵"，也适合做 1:1 电商主图。

**怎么用**：Veo 文生视频不认识你的产品外观，要保持包装一致，有两个办法：用 Veo 3.1 的参考图模式上传产品图（官方说明最多 3 张，参考图模式只能 8 秒），或先用图像模型做一张同场景的产品图当首帧走图生视频。

**怎么填变量**：[抗老精华] 换成"香水""男士面霜"；香水可以把液滴段改成"喷头按下，一团细雾在逆光里散开"。

**常见失败与调整**：
- 液滴落在台面上变成一摊水：写"液滴落入一小片镜面般的液池"。
- 环绕后标签变形：把 180 度改成 90 度，或最后一秒用真实产品图做定格。
- 画面过亮失去"冷峻感"：保留"深邃的黑色"，加"低调布光"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Editorial beauty commercial for a [brand] retinol serum staged on a slab of honed black marble. 0-2s: extreme macro on the glass dropper tip, a single amber droplet swelling, trembling, then releasing in true slow motion to ripple across a glossy pool, studio light refracting through the bead. 2-3s: snap to the frosted-glass bottle gliding in on a motorized dolly, hard key light raking low across the engraved cap, soft falloff dissolving the base into shadow. 3-5s: a smooth 180-degree orbit around the bottle, the label resolving crisp and legible, a thin column of specular light tracing down the glass edge. 5-6s: lock-off hero, the droplet's last ring settling on the marble. The bottle holds consistent shape, frosted finish, cap engraving, and label text across every frame — no deformation, drift, warping, doubling, or artifacts. Cool clinical lighting, deep saturated blacks, liquid-glass texture, faint hush of a single droplet meeting cold stone.
```

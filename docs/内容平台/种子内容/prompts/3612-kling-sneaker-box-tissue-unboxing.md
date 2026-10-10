---
title: 可灵提示词：球鞋开箱视频（掀盒盖—拨开包装纸—按压鞋底回弹 · 16:9）
slug: kling-sneaker-box-tissue-unboxing
model: kling
topics: [product-video, ecommerce]
aspectRatio: "16:9"
needsRefImage: true
useCase: 球鞋、皮鞋、包袋这类有鞋盒 / 包装纸的产品开箱：掀开盒盖、拨开两层包装纸、拿出来转一圈、按一下鞋底，适合测评视频开头、限量款上新预告。
prompt: |
  以我上传的产品图为准，生成一条约 8 秒的 16:9 开箱视频。
  场景：平视、四分之三角度拍一只哑光黑色鞋盒，里面是一双[限量款运动鞋]，鞋盒放在暖色橡木桌上，一道斜射的窗光横穿画面。
  0–2 秒：双手掀起盒盖，纸板摩擦声清脆，光束里的灰尘飘动闪烁。
  2–4 秒：指尖慢慢拨开两层米白色包装纸，纸张沙沙作响，一层层展开，露出鞋头和鞋带。
  4–6 秒：鞋子被捧出来转一圈，侧光扫过[麂皮]表面的绒毛和亮面后跟，鞋带轻轻晃动。
  6–8 秒：拇指按压缓震中底，中底明显回弹复原。
  画面：电影感的黄金时刻光，浅景深，纸板和包装纸的触感 ASMR。
  鞋子的轮廓、配色、缝线和鞋眼数量全程一致：不扭曲、不多鞋眼、鞋带不融化。
negativePrompt: 鞋子变形，多余的鞋眼，鞋带融化，手指畸形，多余的手，盒子穿模，乱码，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#sneaker-tissue-reveal
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；鞋款、材质改为变量"
images:
  - 3612-kling-sneaker-box-tissue-unboxing-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/sneaker-tissue-reveal.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：拨开包装纸、捧出鞋子两步手部是否穿模
  - 示例图是仓库提供的关键帧图（仅鞋盒，已转 JPG 压缩）
---
**时长与镜头**：8 秒四拍：开盖 → 拨纸 → 捧出转动 → 按压回弹。动作多、手部多，是开箱视频里难度较高的一条。可灵 5 秒档建议拆成两条：第一条"开盖 + 拨纸露出鞋头"，第二条用鞋子特写图做首帧，拍"转动 + 按压"，剪辑时拼起来反而更稳。

**怎么填变量**：[限量款运动鞋] 和 [麂皮] 按实物填；皮鞋可把最后一拍换成"手指划过皮面，光泽随之移动"；包袋换成"拉开防尘袋，露出包身五金"。

**常见失败与调整**：
- 包装纸和鞋子粘在一起变形：把拨纸改成一层，动作更简单。
- 捧出时出现第二只鞋：写明"盒子里只有一只鞋"（展示用单只更好控）。
- 中底不回弹或整只鞋变软：把按压改成"手指轻按，中底微微下陷再弹回"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Eye-level three-quarter on a matte black shoebox for [brand] [product] limited sneakers, set on warm oak with a slanted window beam crossing the frame. 0-2s: hands lift the lid free with crisp cardboard friction, dust motes drifting and glinting in the light shaft. 2-4s: fingertips peel back two layers of cream tissue paper with a slow papery crinkle, each fold unfurling to expose the toe cap and laces. 4-6s: the sneaker is cradled out and rotated once so raking studio light travels across the suede nap and the glossy heel counter, laces swinging gently. 6-8s: a thumb presses the cushioned midsole and it visibly springs back into shape. Cinematic golden-hour glow, shallow depth of field, tactile cardboard-and-paper ASMR. The sneaker keeps a consistent silhouette, colorway, stitching, and eyelet count throughout; no warping, extra eyelets, melted laces, or artifacts.
```

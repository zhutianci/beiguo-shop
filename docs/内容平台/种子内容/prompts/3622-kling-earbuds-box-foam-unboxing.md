---
title: 可灵提示词：数码产品开箱视频（耳机盒抽出—海绵托取出—翻盖指示灯亮 · 科技感 ASMR）
slug: kling-earbuds-box-foam-unboxing
model: kling
topics: [product-video, ecommerce]
aspectRatio: "9:16"
needsRefImage: true
useCase: 无线耳机、手机、充电宝、智能手表等数码产品的极简科技风开箱：抽出外套、从海绵托里取出、翻盖磁吸咔哒、指示灯闪一下，适合新品首发预告和电商主图视频。
prompt: |
  以我上传的产品图为准，生成一条约 8 秒的竖屏 9:16 科技感开箱视频。
  场景：居中的微距镜头，一只纤薄的[炭灰色]包装盒放在拉丝铝台面上，冷静、干净的光线。
  0–2 秒：外层套盒被缓缓推开，发出低低的摩擦声，露出黑色的镂空海绵托。
  2–4 秒：指尖把[无线耳机充电盒]从贴合的海绵槽里"啵"地一下按出来，下面的柔和阴影随之移动。
  4–6 秒：充电盒的盖子绕着铰链翻开，磁吸"咔哒"一声精准到位，状态指示灯亮起闪一下，里面的两只耳机闪过一道高光。
  6–8 秒：盖子合上，镜头从合缝处移焦到压印的标志上。
  画面：极简的高调产品光，清脆的科技 ASMR，节奏缓慢而有分寸。
  充电盒和耳机的几何形状、哑光质感、铰链缝和指示灯位置始终一致：不变形、耳机不变多、不出现多余接口。
negativePrompt: 充电盒变形，耳机数量错误，多余的接口，指示灯位置变化，手指畸形，乱码标志，水印
source:
  repo: LichAmnesia/awesome-ad-video-prompts
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts#gadget-foam-cradle
  author: "awesome-ad-video-prompts contributors"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"以上传的产品图为准\"和负面提示词；包装颜色与产品改为变量"
images:
  - 3622-kling-earbuds-box-foam-unboxing-1.jpg
imageCredit:
  by: "LichAmnesia/awesome-ad-video-prompts"
  url: https://github.com/LichAmnesia/awesome-ad-video-prompts/blob/main/images/gadget-foam-cradle.png
  license: CC BY 4.0
verify:
  - 可灵实测 3 次：翻盖后耳机数量是否保持两只
  - 示例图是仓库提供的关键帧图（已转 JPG 压缩）
---
**时长与镜头**：8 秒四拍：推开套盒 → 取出 → 翻盖亮灯 → 合盖移焦。科技产品开箱的调性是"慢、干净、有分寸"：冷色光、拉丝金属台面、每个动作只做一次，不要加花哨转场。可灵 5 秒档保留"取出 + 翻盖"两拍最出效果。本站另有一条"耳机爆炸图悬浮"，那条展示内部结构，这条是开箱。

**怎么填变量**：[无线耳机充电盒] 换成"智能手表""充电宝"，第三拍相应改成"手表屏幕亮起显示表盘""充电宝电量灯依次亮起"。屏幕内容容易乱码，写"屏幕亮起纯色光"更稳。

**常见失败与调整**：
- 翻盖后耳机变成三只或位置乱：写"两只耳机安静地躺在各自的槽里"。
- 海绵托和盒子融在一起：首帧用"盒子已打开、产品在海绵托里"的图，删掉第一拍。
- 标志移焦后变乱码：删掉最后的移焦，改为"镜头缓慢推近合上的充电盒"。

> 改编自 [LichAmnesia/awesome-ad-video-prompts](https://github.com/LichAmnesia/awesome-ad-video-prompts)（awesome-ad-video-prompts contributors），许可证 CC BY 4.0。

### 英文原版

```
Centered macro on a slim charcoal box for [brand] [product] wireless earbuds, lit cool and clinical on brushed aluminum. 0-2s: the outer sleeve slides off with a low friction whisper, revealing a black die-cut foam tray. 2-4s: a fingertip pops the charging case free of its snug foam cradle with a satisfying suction release, soft shadows shifting under it. 4-6s: the case lid flips open on its hinge with a precise magnetic click, the status LED pulsing once while the nested earbuds catch a single specular glint. 6-8s: the case snaps shut and the camera racks focus from the seam to the embossed logo. Minimal high-key product lighting, crisp clinical tech ASMR, slow deliberate beats. The case and buds hold consistent geometry, matte finish, hinge seams, and LED placement; no morphing, doubled buds, phantom ports, or artifacts.
```

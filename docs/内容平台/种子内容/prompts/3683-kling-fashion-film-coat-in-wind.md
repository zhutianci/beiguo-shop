---
title: 可灵提示词：时尚大片 Look Book 模板（长外套在风中扫动 · 硬光水泥棚 · 布料即内容）
slug: kling-fashion-film-coat-in-wind
model: kling
topics: [cinematic, fashion]
aspectRatio: "9:16"
needsRefImage: true
useCase: 没有剧情、只拍"运动中的服装"的时尚片骨架：先用微距拍布料纹理，再拉到全身看布料兜住风和光，最后定格一个编辑式姿态。适合服装品牌上新、设计师作品集、模特卡视频。
prompt: |
  以我上传的穿搭照片为准，生成一条约 10 秒的竖屏 9:16 时尚大片。
  核心：时尚片，编辑式运动，受控硬光加质感，自信的静与动，高端时尚写实，没有目录册的僵硬感。
  人物：[一位穿着廓形长外套的模特]，服装、发型和外形严格以参考图为准。
  布料运动：[外套在缓风中扫动]。
  场景：[只有一扇硬光窗户的空旷水泥摄影棚]，光线是[高窗一道硬主光，阴影深重]，调色[低饱和、肤色偏暖]。
  0–3 秒｜质感：微距拍服装——织纹、一道缝线、垂坠感，光斜斜掠过布料；对着质感缓慢推近，浅景深。
  3–7 秒｜运动：拉到全身，模特在空间里移动，布料兜住空气和硬光；镜头缓慢横移，或跟着一个转身，让布料引导视线。
  7–10 秒｜定格：模特落定成一个自信、静止的编辑式姿态，布料慢慢归于静止；镜头停住，带极轻微的呼吸浮动。
  不要对镜头笑，不要 logo 卡，不要转圈。
negativePrompt: 服装变化，布料穿模，人物换脸，手指畸形，僵硬摆拍，目录册平光，过饱和，文字，水印
source:
  repo: jnMetaCode/ai-shortfilm-prompts
  url: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/fashion-film.zh.md
  author: "jnMetaCode"
  license: MIT
  licenseUrl: https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/LICENSE
  changes: "原文为 5 段式结构的中英混合模板，本站合并为一条可直接复制的中文提示词，并补充\"以上传的穿搭照片为准\"用于图生视频；{{变量}} 改为 [方括号变量]"
imageBrief: 站长用虚构模特或已授权的穿搭照生成 1 条，截取"布料微距""全身运动""编辑式定格"三帧。
verify:
  - 可灵实测 3 次：布料运动时服装细节是否与参考图一致
---
**时长与镜头**：10 秒三拍：质感微距 → 全身运动 → 编辑式定格。时尚片的"内容"就是布料怎么动、光怎么落在面料上，所以不需要剧情，只需要让面料有足够的运动空间（风、转身、走动）。可灵 5 秒档建议只保留"全身运动 + 定格"。

**怎么填变量**：[一位穿着廓形长外套的模特] 换成"街头潮装""高定礼服""剪裁西装"；布料运动对应改成"裙摆涟漪""围巾拖曳"；场景换成"沙丘""大理石厅""霓虹小巷"；光线换成"高调全白""明暗对照""彩色色片"。面料越轻（雪纺、丝绸、长外套），运动越好看。

**常见失败与调整**：
- 布料运动时穿模或衣服款式变了：降低风力，写"轻柔的风"，并强调"服装以参考图为准"。
- 模特对镜头摆出商业笑容：保留"不要对镜头笑"。
- 画面像淘宝详情页：保留"编辑式""硬光""深重阴影"这些词，避免平光。

> 改编自 [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts/blob/main/templates/fashion-film.zh.md) 的实战范例（Copyright (c) 2026 jnMetaCode，MIT License）。

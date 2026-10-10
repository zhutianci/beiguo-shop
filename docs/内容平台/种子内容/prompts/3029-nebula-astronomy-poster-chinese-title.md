---
title: "天文科普海报提示词：马头星云写实星空图 + 中文标题说明（gpt-image-2）"
slug: nebula-astronomy-poster-chinese-title
model: gpt-image-2
topics: [poster, wallpaper]
aspectRatio: "4:3"
needsRefImage: false
useCase: "生成一张天文摄影质感的星云科普海报，左上角配典雅的标题、英文名和几行说明，适合天文课件、科普账号和电脑壁纸。"
prompt: |
  生成一张电影感天文摄影风格的科普海报，主题是马头星云（[Barnard 33]），4:3 横版。
  背景是深红色的发射星云，布满密集的细小白色星点，一条发光的深红氢气云带横贯画面中部。
  画面中偏右是一大片黑褐色的暗星云剪影，形状像马的头和脖子向上扬起，有卷曲的口鼻和鬃毛般的细丝，被背后的红光勾出轮廓。
  左下角有淡淡的蓝色雾气；两颗特别醒目的蓝白色亮星：一颗在左边缘、一颗较小的在右中部，其余小星自然散布。
  左上角叠加恰好 3 组白色衬线字：大号中文标题"[马头星云]"、较小的英文副标题"Barnard 33"、四行中文说明"[猎户座中的一片暗星云]，背后发红光的散光星云被前方冰冷的气体和尘埃遮住，看起来像一个马头的剪影。"
  使用博物馆 / 天文馆式的典雅字体，高对比，星云细节写实；不要边框、Logo 和多余标签。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/sysCat64/status/2094990933758759356
  author: "シス猫 (sysCat) @無色で無職なネコ (no-color, no-job)"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文画面文字为日文，本站改为中文标题与说明；星云名称、标题、说明改为变量"
images:
  - 3029-nebula-astronomy-poster-chinese-title-1.jpg
imageCredit:
  by: "シス猫 (sysCat) @無色で無職なネコ (no-color, no-job)"
  url: https://youmind.com/gpt-image-2-prompts?id=33360
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：换成别的天体时，把星云名称、标题、说明和画面描述一起改，例如"猎户座大星云 M42：中心四颗亮星和展开的粉蓝色气体""仙女座星系 M31：倾斜的旋涡盘"。说明文字建议控制在 50 字以内、分成 3～4 行。

示例图是一片深红星云中央偏右的黑色"马头"剪影，边缘被红光勾亮，满天细小星点，左上角是白色日文大标题"馬頭星雲"、英文"Barnard 33"和四行日文说明（原提示词的默认文字为日文，本站已改为中文）。

**常见问题**：
- 马头形状不明显：加"清晰可辨的马头侧影，口鼻朝左"。
- 星空太假、像贴图：强调"天文摄影质感，自然的星点分布，不要卡通星星"。
- 科学性：说明文字请对照天文资料，示例图是艺术化呈现，不能当真实观测图片使用。

**适合**：天文 / 地理课件、科普账号封面、电脑壁纸、天文馆风格海报。

### 英文原版

```text
Create a cinematic astrophotography-style educational space poster of the Horsehead Nebula, {argument name="nebula name" default="Barnard 33"}, in a wide horizontal 4:3 canvas. The background is a deep red emission nebula filled with dense tiny white stars, with a glowing crimson hydrogen cloud band running horizontally through the middle. Center-right, place one large dark black-brown dust cloud silhouette shaped like a horse’s head and neck, rising upward with a curled snout and mane-like wisps, rim-lit by red light from behind. Add subtle blue haze in the lower-left corner and two especially prominent blue-white stars: one bright star near the left edge and one smaller bright star in the right-middle area, plus many smaller stars scattered naturally. In the upper-left corner, overlay exactly 3 text elements in white serif type: a large Japanese headline {argument name="headline text" default="馬頭星雲"}, a smaller English subtitle {argument name="subtitle text" default="Barnard 33"}, and a four-line Japanese description {argument name="description text" default="オリオン座にある暗黒星雲。\n背景の赤く光る散光星雲を、\n手前の冷たいガスと塵が遮って\n「馬の頭」のシルエットに見える。"}. Use elegant museum-planetarium typography, high contrast, realistic nebula detail, no borders, no logos, no extra labels.
```

> 改编自 [シス猫 (sysCat) @無色で無職なネコ (no-color, no-job)](https://x.com/sysCat64/status/2094990933758759356) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

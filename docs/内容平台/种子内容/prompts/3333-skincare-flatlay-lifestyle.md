---
title: 电商详情页提示词：静奢风护肤品晨间场景图（石材台面 + 磨砂窗光 + 玉石滚轮）
slug: skincare-flatlay-lifestyle
model: gpt-image-2
topics: [ecommerce, photography]
needsRefImage: false
aspectRatio: "3:4"
useCase: 给护肤品、香氛、个护小物做详情页氛围图或小红书种草图时用，得到自然侧光、干净留白、没有杂乱 logo 的"静奢 + 日式极简"浴室台面场景。
prompt: |
  拍一张竖版美妆生活方式照片，主题是高端[护肤晨间流程]。
  - 场景：[洞石]浴室台面，旁边是一扇柔和的磨砂玻璃窗；
  - 台面上的物品：一只极简玻璃精华瓶、一支陶瓷质感洁面乳软管、一罐面霜、一条叠好的亚麻毛巾、一个玉石滚轮、一小碟珍珠发夹，以及一朵带露水的[白山茶花]；
  - 光线：清晨自然侧光，柔和的反光，玻璃厚度真实，阴影柔软，留出干净的负空间；
  - 气质：静奢风，日式极简与现代水疗杂志风结合，[奶油色、暖石色、半透明浅绿]配色；
  - 不要可识别的品牌 logo，不要编造可读的标签，最多只有一个很小的通用标记"[AM ROUTINE]"；
  - 不出现人脸，不杂乱，不要过度的 CGI 光泽；
  - 竖版画幅[3:4]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-beauty-and-lifestyle.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；主题、台面材质、点缀花、配色、标记文字、画幅设为变量
images:
  - 3333-skincare-flatlay-lifestyle-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/beauty-lifestyle/skincare-morning-routine-tray.png
  license: MIT
verify:
  - 示例图实际比例接近 2:3，原文写的是 3:4，出图时确认画幅
  - 上传自家产品图再生成一次，看产品外观能否保持一致
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[护肤晨间流程] 可以换成"睡前修护流程""男士剃须护理"；[洞石] 换成"白色大理石""浅色水磨石""原木"台面；[白山茶花] 换成"一枝尤加利叶""一小束洋甘菊"；[AM ROUTINE] 是唯一允许出现的小字，可以换成你的系列名，或直接删掉。示例图里是窗边的浅色石材台面：左边一只圆陶瓶插着白山茶，中间一只滴管精华瓶、一支奶白色软管和一罐面霜，前面叠着亚麻毛巾和一只浅绿玉石滚轮，右下小碟里放着珍珠发夹，右侧露出半个石盆。

**常见问题与调整**：
- 想放自家产品：先上传产品照片，加"台面上的精华瓶严格使用上传图中的产品外观"。
- 瓶身出现乱码字：再强调"所有瓶罐表面空白，没有任何文字"。
- 光线太平：加"窗光从左侧低角度射入，在台面上留下长长的柔影"。
- 想要横版首屏 banner：画幅改 16:9，物品集中在右半边，左边留白放文案。

**适合**：护肤 / 个护详情页氛围图、小红书种草图、品牌社媒日常图；用于商品宣传时，实物要与图片一致。

### 英文原版

```
Create a 3:4 vertical beauty lifestyle photograph for a premium skincare morning routine. Scene: a travertine bathroom counter beside a soft frosted window, with a minimal glass serum bottle, ceramic cleanser tube, cream jar, folded linen towel, jade roller, small dish of pearl hair clips, and a single dewy white camellia flower. Lighting: natural morning side light, gentle reflections, realistic glass thickness, soft shadows, clean negative space. Aesthetic: quiet luxury, Japanese minimalism meets modern spa editorial, cream / warm stone / translucent pale green palette. No visible brand logos, no readable fake labels except a tiny generic mark "AM ROUTINE", no human face, no clutter, no overdone CGI shine.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

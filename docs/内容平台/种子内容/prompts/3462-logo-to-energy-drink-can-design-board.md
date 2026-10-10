---
title: "ai品牌设计提示词：把 Logo 做成能量饮料罐的产品设计提案板（gpt-image-2）"
slug: logo-to-energy-drink-can-design-board
model: gpt-image-2
topics: [logo, ecommerce]
aspectRatio: "3:4"
needsRefImage: true
useCase: "想看看自己的品牌\"如果出一款能量饮料会长什么样\"时用：上传 Logo，得到一张竖版产品设计提案板——写实的主罐大图、正侧背斜四个角度、细节特写、多罐装外箱，以及色板、口味概念、材质等设计标注，适合做品牌延展提案和周边概念图。"
prompt: |
  把[品牌名]变成一款未来感的高端能量饮料（概念设计）。请以我上传的 Logo 为准，把它现有的标志、配色、字体、图形、比例和视觉个性当作核心创意基因。
  不要只是把 Logo 贴到一个普通易拉罐上，而是把整套识别重新演绎成一款有辨识度的能量饮料：定制的罐体轮廓、有逻辑的标签系统、专属的"能量"图形、口味识别（口味名"[冰川薄荷]"）、高级的字体排版、金属色点缀、压纹浮雕、真实的铝罐质感和冷凝水珠。
  做成一张精致的 3:4 竖版产品设计提案板：
  - 主视觉：一个 3/4 视角的写实主罐，占据画面主导位置；
  - 多角度：正面、侧面、背面、斜角四个小视图；
  - 细节特写：浮雕 Logo、定制拉环与罐口、能量图形；
  - 配套的[12 罐装]外箱；
  - 精炼的设计标注：Logo 的融合方式、色板、口味概念、材质、能量图形系统、标签结构；
  - 版面文字用[英文]，简短、排版克制。
  风格：高端商业产品摄影，受控的反光，戏剧化但真实的布光，柔和阴影，干净的未来感影棚环境。每一个设计决定都要针对[品牌名]本身，而不是套用通用模板。
  不要出现其他真实品牌的标志，不要出现网址、电话等联系方式。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/lovimg_com/status/2088167722605756541
  author: "@lovimg_com"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；品牌名改为变量，新增口味名、外箱规格、版面文字语言三个变量；原文让模型凭品牌名联想其标志，改为\"以上传的 Logo 为准\"；补充\"不要出现其他真实品牌标志和联系方式\""
images:
  - 3462-logo-to-energy-drink-can-design-board-1.jpg
imageCredit:
  by: "@lovimg_com"
  url: https://youmind.com/gpt-image-2-prompts?id=31420
  license: CC BY 4.0
verify:
  - "示例图中的品牌名\"ADHURA\"看起来是虚构的，请站长检索确认不是真实注册的饮料品牌"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传你自己的 Logo，两处 [品牌名] 填同一个名字；[冰川薄荷] 是口味名，会影响罐身的点缀色和右下角的配料画面，可换成"青柠气泡""热带芒果""黑莓"；[12 罐装] 可改成"6 罐装""4 罐礼盒"；版面文字建议保持英文，小字用中文容易出错。请只用自己的品牌，不要填别人的品牌名。

示例图是一张深蓝黑色调的竖版提案板：左侧一个挂满水珠的深色铝罐大图，罐身竖排银白色品牌字、中间一道红色闪电；右上是正、侧、背、斜四个角度的小罐，中间三张特写（浮雕字、定制拉环、蓝色斜纹图形），往下是蓝色口味名配薄荷叶、冰块和青柠片；左下一个 12 罐装外箱，底部是设计理念图标、五格色板和铝材质球。

**常见问题**：
- Logo 被改得面目全非：强调"Logo 的字形和图形必须与上传图完全一致，只允许改变材质和工艺"。
- 小字全是乱码：减少标注，改成"只保留 4 个区块标题和色板"。

**适合**：品牌延展与联名提案、包装设计方向探索、作品集概念项目；只是概念图，背标上的成分与容量文字不能当真实标签使用。

### 英文原版

```text
{argument name="brand name" default="[BRAND NAME]"} → Premium Energy Drink Concept

Transform {argument name="brand name" default="[BRAND NAME]"} into a futuristic, premium energy drink brand using its existing logo, colors, typography, shapes, proportions, and visual personality as the core creative DNA.

Do not simply place the logo on a generic can. Reimagine the identity into a distinctive energy drink with a custom can silhouette, intelligent label system, signature energy graphics, flavor identity, premium typography, metallic accents, embossing, realistic aluminum texture, and condensation.

Create a sophisticated 3:4 vertical product-design board featuring one dominant photorealistic hero can in 3/4 view, plus front, side, back, angled, and detail views. Include a matching multipack/box and refined design callouts for logo integration, color palette, flavor concept, materials, energy graphic system, and label structure.

Use high-end commercial product photography, controlled reflections, dramatic but realistic lighting, soft shadows, and a clean futuristic studio environment. Make every design decision specific to {argument name="brand name" default="[BRAND NAME]"}
```

> 改编自 [@lovimg_com](https://x.com/lovimg_com/status/2088167722605756541) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "文创设计提示词：名画灵感浴室小物（维纳斯贝壳皂托：画作 + 草图 + 实拍）（gpt-image-2）"
slug: painting-inspired-bathroom-product-concept
model: gpt-image-2
topics: [interior, ecommerce]
aspectRatio: "16:9"
needsRefImage: false
useCase: "以一幅名画为灵感设计一件浴室 / 家居小物，生成\"画作局部 + 铅笔草图 + 洗手台实拍\"三联横版图，适合博物馆文创、礼品设计提案和设计作品集。"
prompt: |
  生成一张 16:9 横版的浴室产品设计展示图。
  左边是[《维纳斯的诞生》]中人物头部和金色长发的局部画作参考；中间是一张与之配套的贝壳皂托铅笔草图；右边是产品放在洗手台上的使用场景。
  皂托是宽而浅的扇贝形白瓷碟，带放射状纹理，后沿站着一个小小的维纳斯人像，金色长发，穿着完全遮住身体的白色古典长袍。
  碟里放着一块用过的[浅桃色]肥皂，边缘圆润，表面和碟内有几颗水珠和一层薄薄的皂膜。
  表现珍珠白釉面、细微的材质不均匀和真实的接触阴影，旁边是一条亚麻毛巾和一截水龙头。
  草图和实物要一致；不要文字、Logo 和网址。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/cellinlab/status/2097894087420793124
  author: "Cell 细胞"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文描述的英文写法改写为中文；艺术作品、肥皂颜色改为变量"
images:
  - 3069-painting-inspired-bathroom-product-concept-1.jpg
imageCredit:
  by: "Cell 细胞"
  url: https://youmind.com/gpt-image-2-prompts?id=34154
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[《维纳斯的诞生》] 可以换成其他名画，同时把产品改成对应的物件，例如"《戴珍珠耳环的少女》→ 珍珠造型牙刷架""《千里江山图》→ 青绿山形香插"。[浅桃色] 是肥皂颜色，可换成"薄荷绿""奶白"。注意人物服装写"完全遮住身体"，避免生成裸露形象。

示例图左边是一幅金色长发女子的古典画局部，中间速写本上是贝壳皂托和小人像的铅笔草图，右边洗手台上一只白瓷扇贝皂托，后沿站着穿白袍的小雕像，碟里一块浅桃色肥皂带着水珠，旁边是花瓶和亚麻巾。

**常见问题**：
- 小人像比例怪：写"人像高度约为碟子宽度的一半"。
- 草图与实物不一致：重复"草图与实物造型一致"。
- 用于商业：同样建议参考公有领域作品，并在产品说明里注明灵感来源。

**适合**：博物馆文创、礼品设计提案、设计作品集、家居小物概念图。

### 原版提示词

```text
Generate a 16:9 horizontal bathroom design presentation image. On the left, place a partial painting reference of the character's head and golden long hair from {argument name="artwork" default="'The Birth of Venus'"}. In the middle, show a pencil sketch of a matching seashell soap holder. On the right, show the product in use on a washstand. A wide and shallow scallop-shaped white porcelain soap dish with radial texture, featuring a small Venus figure standing on the back edge with long golden hair and wearing a white classical robe that fully covers the body. In the dish is a used {argument name="main color" default="pale peach"} bar of soap with rounded edges and a few water droplets and thin soap film on the surface and inside the dish. Render a pearl-white glazed finish, subtle material inconsistencies, and realistic contact shadows, alongside a linen towel and part of a faucet. The sketch and object should be consistent, with no text, logos, or URLs.
```

> 改编自 [Cell 细胞](https://x.com/cellinlab/status/2097894087420793124) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

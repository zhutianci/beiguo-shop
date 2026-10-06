---
title: 护肤品静物摄影提示词：极简粉色棚拍产品图（精华 / 面油）
slug: skincare-still-life
model: gpt-image-2
topics: [ecommerce, photography]
aspectRatio: "4:5"
needsRefImage: false
useCase: 给精华、面油、香水等小瓶护肤品生成北欧极简风的棚拍静物图，适合详情页、小红书种草图和品牌官网。
prompt: |
  极简影棚产品摄影：一只透明玻璃[滴管精华瓶]，黑色橡胶滴头，瓶里是[淡粉色精华]，悬浮着[干燥的粉色小花]，放在一块纹理清晰、带自然裂纹的原木方块上。
  左侧立着一只高高的哑光白色包装盒，印着"[品牌名]"，干净的黑色字体，底部有小小的标识。
  右侧是一只透明圆柱玻璃花瓶，装着水，插着几枝细细的[粉色满天星干花]，向上舒展。
  整组物品放在光滑哑光的[浅粉色]台面上，背景是同色无缝影棚背景。
  左侧强烈的定向柔光，把花枝的影子长长地投在背景上；玻璃有柔和高光，精华瓶有细微反光，木块质感柔和。
  平视桌面机位，所有物品都清晰对焦。
  配色：腮红粉、柔玫瑰、暖浅木色、干净白色、透明玻璃。高级北欧极简护肤品质感，超写实，影棚级。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2067413876564795743
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；产品、内容物、包装文字、花材和主色改为变量；包装上的外文改为品牌名变量
images:
  - 115-skincare-still-life-1.jpg
  - 115-skincare-still-life-2.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2067413876564795743
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 包装盒上的品牌名是否拼写正确
  - 把主色换成浅蓝 / 米白是否依然协调
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[滴管精华瓶] 可换成"磨砂玻璃面霜罐""喷雾香水瓶"；[浅粉色] 换主色时，花材颜色也跟着改（浅蓝配白色小花、米白配干芦苇），整张图才统一。[品牌名] 建议用英文或拼音，短一点更容易印对。

**常见问题**：
- 影子不明显、画面平：强调"左侧强烈定向光，长投影"。
- 产品不是自家的样子：先上传产品实拍，并加"产品外观严格按上传图片"。
- 文字印错：生成后放大检查，错了就只追问"把盒子上的文字改成××，其他不变"。

**适合**：小体积、透明或半透明包装的产品；大件商品建议换别的场景模板。

### 英文原版

```text
Minimalist studio product photography, a small transparent glass facial oil dropper bottle with a black rubber pipette cap, containing pale pink serum with suspended dried pink floral elements, centered on a natural raw wooden block with visible grain and split texture. Tall matte white skincare box on the left labeled "HUILE ÉCLAT VISAGE" with clean black typography and subtle logo near the bottom. Clear cylindrical glass vase on the right filled with water and thin stems of dried pink gypsophila extending upward. Composition rests on a smooth matte pastel pink surface against a matching seamless pink studio background. Strong directional soft light from the left casts long natural-style shadows of the flowers onto the background, with gentle highlights on the glass, subtle reflections on the serum bottle, and soft texture on the wooden block. Straight-on tabletop camera angle, all objects in sharp focus. Color palette: blush pink, soft rose, warm light wood, clean white, transparent glass. Premium Scandinavian minimalist skincare aesthetic, ultra-realistic, studio-grade.

full prompt:
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2067413876564795743) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。

---
title: "ai修图提示词：把随手拍的花草照片变成影棚里的等轴测植物小景，石座 + 花架（gpt-image-2）"
slug: garden-flower-photo-to-studio-botanical-diorama
model: gpt-image-2
topics: [photo-edit, figurine, photography]
aspectRatio: "3:4"
needsRefImage: true
useCase: "手机里随手拍的花草照片背景很乱，想把它变成一张干净的\"杂志感植物小景\"：保留同一株植物的花、叶、花苞和支架，重新摆进一个方形石座，放在暖白色的影棚背景前，用等轴测的四分之三视角拍下来。"
prompt: |
  以我上传的照片为植物参考，把这张杂乱的花园特写改成一张精致的杂志风影棚小景。保留同一株[铁线莲]的特征——[玫红色]的花、绿叶、花苞、花谢后的毛球状种子头，以及[质朴的木头花架]，但把它们干净地重新布置成一件微缩花园摆件。
  - 构图：植物直立在一个[奶油色方形石质花台]上，花台里是土壤和少量小绿植，花架立在植物后面；采用等轴测的四分之三俯视角，让花台、花架、花和藤蔓都看得清楚。
  - 花的安排：恰好 [3] 朵盛开的大花作为视觉重点，周围自然地穿插几个没开的花苞和种子头，藤蔓沿花架向上攀。
  - 背景：把原来杂乱的花园背景换成无缝的暖调米白色影棚背景。
  - 光线：柔和自然的杂志式布光，阴影轻柔；花瓣和叶片的纹理真实。
  - 风格：照片级写实，干净、高级的植物类杂志静物，细节丰富但不杂乱。
  - 限制：不要添加文字、标签、人物、昆虫、花瓶或多余的装饰道具；植物要能一眼认出就是参考照片里的那一株，只是看起来像是精心摆放并由专业摄影师拍摄的。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/mtkapi/status/2098453895123001749
  author: "@mtkapi"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；植物种类、花色、花的数量、支架、底座改为变量；原文以铁线莲为例，保留为默认值"
images:
  - 3542-garden-flower-photo-to-studio-botanical-diorama-1.jpg
imageCredit:
  by: "@mtkapi"
  url: https://youmind.com/gpt-image-2-prompts?id=34470
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张花草的近景照片（花和叶都清楚即可，背景乱没关系）。[铁线莲] 和 [玫红色] 换成照片里的植物和花色；支架按实际情况写"竹竿支架""铁艺花架"，没有支架就删掉相关语句；[3] 是主花的数量，一般 1～5 朵；底座可换"陶土方盆""水泥圆台""原木托盘"。

示例图是米白色背景上的一件植物小景：一个方形的浅色石座里种着一株铁线莲，三朵大大的玫红色花开在中下部，上方有几个深色花苞，旁边还有几团毛茸茸的种子头；后面立着一个交叉的旧木花架，藤蔓和叶子顺着它往上爬，整体是斜上方俯视的角度，阴影很柔和。

**常见问题**：
- 花变成了别的品种：在植物名后加上花瓣数量、花心颜色等一两个特征。
- 底座和植物比例失调：写"花台宽度约为植株高度的二分之一"。
- 背景仍残留原图的杂物：强调"完全替换背景，不保留原照片里的任何环境"。

**适合**：园艺博主的封面图、花店和苗圃的商品展示、植物图鉴和手账素材。

### 英文原版

```text
Using the provided reference image as the botanical source, transform the old close-up garden photo into a polished editorial product-style scene. Preserve the same clematis vine identity, magenta flowers, green leaves, buds, seed heads, and rustic wooden trellis character, but cleanly recompose them into a staged miniature garden arrangement.

Goal: Create an elegant studio botanical diorama from the reference photo.
Composition: Place the plant upright on a square cream stone planter base filled with soil and small greenery, with the wooden trellis standing behind it. Use an isometric three-quarter view so the base, trellis, flowers, and vines are all clearly visible.
Floral structure: Keep exactly 3 large open magenta clematis flowers as the main focal blooms, plus visible unopened buds and seed heads arranged naturally around them.
Background: Replace the busy real garden background with a seamless warm off-white studio backdrop.
Lighting: Use soft natural editorial lighting with gentle shadows, realistic texture on petals and leaves, and a refined magazine still-life look.
Style: Photorealistic, clean, high-end botanical editorial, detailed but uncluttered.
Constraints: Do not add text, labels, people, insects, vases, or extra decorative props. Keep the plant recognizable from REFERENCE_0 while making the scene look intentionally staged and professionally photographed.
```

> 改编自 [@mtkapi](https://x.com/mtkapi/status/2098453895123001749) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

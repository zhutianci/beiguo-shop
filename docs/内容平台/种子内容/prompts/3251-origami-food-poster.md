---
title: AI海报提示词：把千层美食做成折纸纸雕，分层爆炸图+折线结构说明（gpt-image-2）
slug: origami-food-poster
model: gpt-image-2
topics: [food, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做美食科普、餐饮品牌创意海报或设计作品时，输入一道有层次的菜，生成精致的折纸纸艺版本，旁边带分层拆解和折线示意，像一张高级的"纸做美食说明书"。
prompt: |
  输入菜品：[千层面]（最好是有明显分层的菜）。
  把这道菜重塑成一件大师级的折纸 / 纸艺建筑雕塑：
  - 结构：由模型自己推断折叠几何——山折与谷折的比例、承重折痕、互相咬合的插片、负空间的运用；
  - 材质：推断纸张纹理方向、克重、表面涂层、边缘压光，胶水痕迹尽量不可见；
  - 配色：每种"食材"用一种颜色的纸来表现，按食材本色映射，层与层之间有清晰的对比和渐变；
  - 构图：画面中央是一个完整的纸雕菜品，上方几层呈"爆炸图"悬浮分开，露出内部折叠结构和插片；旁边配极简的标注：食材对应的纸层列表、分层轴测线稿、关键折痕说明；
  - 风格：精细剪纸艺术 + 高端折纸摄影 + 扁平着色的三维质感，边缘锐利如矢量，柔和的定向微距光；
  - 输出：柔和的米白或[浅粉彩]背景，优雅的极简排版，色块干净、带细微纸纹，留白充足。
  不要：真实食物质感、撕得毛糙的纸边、明显的电脑 3D 渲染痕迹、杂乱的手工桌面、幼稚的简单折法、全息或发光特效、水印。
  画幅[16:9]。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2064020126937039318
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文；把原文伪代码式的"INFER(...)"权重结构改写成自然语言要点，删掉权重数字；菜品、背景色、画幅设为变量；补充标注内容的说明和常见问题
images:
  - 3251-origami-food-poster-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case358/output.jpg
  license: CC0 1.0
verify:
  - 示例图是 2×2 四道菜的合集（原帖分别输入了四道菜），单次生成通常只出一道，页面需说明
  - 示例图标注是英文小字，换成中文出一次看是否清楚
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[千层面] 换成任何"有层次"的菜效果最好，例如"千层蛋糕""汉堡""寿司卷""冰粉"；[浅粉彩] 可换"淡薄荷""浅杏色"来配合菜的颜色。想要四宫格合集，就分四次生成后拼图，或者直接写"2×2 四格，分别是[菜 1][菜 2][菜 3][菜 4]"。示例图是 2×2 合集：左上千层面像一摞彩色纸层，右上果仁蜜饼用绿色纸表现果仁层，左下泡芙塔用折纸小球堆成锥形，右下青木瓜沙拉的丝用纸条表现、红辣椒和番茄飞在上方，每格旁边都有小字配料列表和轴测线稿。

**常见问题与调整**：
- 出来像真实食物：重复强调"所有部分都是纸做的，看得到折痕和纸边"。
- 标注太多太碎：写"只保留左侧配料列表和右侧一张分层线稿"。
- 折法太简单像儿童手工：加"折痕密集、层数多、几何精确"。
- 做竖版海报：画幅改 3:4，标注放到底部。

**适合**：美食科普海报、餐饮品牌创意物料、设计作品集；不适合需要展示真实菜品外观的点单图。

### 英文原版

```
INPUT: [layered dish]

SYSTEM: Render the input as a master-folded origami and paper-craft architectural sculpture. Do not hardcode paper types unless inevitable. Infer the fold-geometry logic, structural load-bearing creases, layer-separation mechanics, color-blocking strategy, and the tactile grain direction of the materials.

SEMANTIC SOLVE: ORIGAMI_FOOD_AUTOPSY =
  (INFER(fold_geometry FROM mountain_valley_ratio + structural_crease_load + interlocking_tabs + negative_space_utilization) ::5) +
  (INFER(material_logic FROM paper_grain_direction + GSM_weight + surface_coating + edge_burnishing + adhesive_visibility) ::4) +
  (INFER(color_blocking FROM ingredient_color_mapping + contrast_hierarchy + gradient_paper_layering + visual_weight_distribution) ::4) +
  (INFER(hidden_craft FROM fold_sequence_complexity + tolerance_margins + tool_marks + humidity_warping_prevention) ::3) -
  (messy torn paper + realistic food textures + digital 3D paper shaders + cluttered craft desk + childish simple folds) ::-4

COMPOSITION: One central food item completely reconstructed as an intricate, multi-layered paper-craft sculpture. The "ingredients" are represented by distinct, beautifully colored paper layers, cut and folded with razor-sharp precision. Show the "exploded" floating layers hovering above the base, revealing the internal fold structure and interlocking tabs.

STYLE DNA: Intricate paper cutting art ::0.35 high-end origami photography ::0.25 flat-shaded C4D stylization ::0.20 crisp vector-like edges ::0.15 soft directional macro lighting ::0.05

OUTPUT: Soft off-white or pastel background, elegant minimalist typography, razor-sharp crisp edges, flawless flat-shaded colors with subtle paper grain textures, premium negative space.

NEGATIVE: no holograms, no bioluminescent glows, no VR/AR elements, no realistic food photography, no messy torn paper edges, no visible digital 3D artifacts, no cluttered backgrounds, no watermark.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2064020126937039318) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

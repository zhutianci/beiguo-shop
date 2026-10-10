---
title: "ai手办提示词：火柴棍拼成的世界地标模型四宫格，烧焦火柴头 + 台灯硬光（gpt-image-2）"
slug: matchstick-landmark-models-2x2-hobby-photo
model: gpt-image-2
topics: [figurine, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "把几座著名建筑变成\"手工爱好者用火柴棍搭的模型\"：2×2 四宫格，每格一座地标，能看到火柴头、胶水痕迹和旁边散落的火柴盒，像业余手工摄影。适合做城市主题海报、手工社团招新图和创意壁纸。"
prompt: |
  生成一张 16:9 的 2×2 四宫格图，每一格是一座用火柴棍搭成的著名地标模型，四格分别是：[泰姬陵]、[罗马斗兽场]、[埃菲尔铁塔]、[悉尼歌剧院]。四格用同一种风格：
  - 材料：全部由火柴棍和火柴盒搭成——烧过的火柴头（焦黑或红褐色）、浅色的木杆、火柴盒侧面的擦火条。
  - 转换规则：所有建筑细节都换成整根或截半的火柴棍排列成的格栅，红褐色的火柴头排成一圈圈装饰线；墙面是原色松木的纹理，偶尔有一点硫磺色的痕迹。
  - 手工痕迹：接缝处有白乳胶的残留和小胶珠，个别接口略微没对齐，是爱好者的手工水平，不是机器制品。
  - 环境：模型放在[粗糙的深褐色桌面]上，周围散落着几只推开的火柴盒，盒里露出整排火柴。
  - 光线：一盏明亮的台灯从一侧打来，方向性很强，阴影硬而清楚，像手工爱好者自己拍的照片。
  - 镜头：微距、浅景深，每格的模型都完整入镜；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Gdgtify/status/2057115630663528574
  author: "@Gdgtify"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文是带标签的结构化模板，这里译为中文并整理为分条；地标清单改为变量并按示例图填入默认值，新增台面变量；保留材质、胶痕和单光源的要求"
images:
  - 3551-matchstick-landmark-models-2x2-hobby-photo-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://youmind.com/gpt-image-2-prompts?id=21673
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：四个地标换成任何轮廓鲜明的建筑——"天坛""比萨斜塔""金门大桥""帆船酒店"，结构越有镂空感，火柴棍的效果越好；也可以四格都用同一座城市的建筑做系列。[粗糙的深褐色桌面] 可换成"铺着报纸的工作台""绿色切割垫"。只要一座就把"2×2 四宫格"改成"单张"。

示例图分成四格：左上是带四座尖塔和大圆顶的陵墓式建筑，右上是一圈圈拱廊的椭圆形斗兽场，左下是镂空的铁塔，右下是一组帆形屋顶的歌剧院；它们都是浅色木杆搭的，线脚处是一排排红褐色的火柴头，旁边散着几只装着火柴的小盒子，光从侧面打来，影子很重。

**常见问题**：
- 看起来像激光切割的木模型：强调"每一根都是带火柴头的火柴棍，粗细一致，能看到圆头"。
- 太完美没有手工感：加"胶水痕迹明显、个别火柴歪斜"。
- 四格光线不统一：写"四格使用同一方向的单光源"。

**适合**：城市与建筑主题的创意海报、手工社团和亲子活动宣传图、趣味壁纸。

### 英文原版

```text
2x2 grid, 16:9, do this for {argument name="count" default="4 famous landmarks"} in this style: = { <matchstick_model_render> MATERIAL: Burnt matchsticks and matchboxes (charred heads, pale wood, striker strip). FINISH: PVA glue residue, tiny glue globs, slightly misaligned joints. LIGHTING: Bright table lamp with harsh directional shadows (hobbyist photography). </matchstick_model_render> <transformation> - Convert all architectural detail to a lattice of whole and halved matchsticks, with burnt red‑brown match heads forming decorative accents. - Convert surfaces to raw pine wood grain, occasional sulphur bloom, and matte sticker labels from matchboxes. - Convert light to strong, single-source tungsten casting long, defined shadows and catching glossy glue spots. - Background as a sheet of sandpaper with sulphur bloom, and matte sticker labels from matchboxes. - Background as a sheet of sandpaper with shallow depth-of-field, bokeh catching dust particles. </transformation> rules: no text}
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2057115630663528574) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

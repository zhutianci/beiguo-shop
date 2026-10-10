---
title: "ai手办提示词：怪兽草图变翠绿软胶玩具，正面+两侧三联转面图（gpt-image-2）"
slug: sketch-to-sofubi-monster-turnaround
model: gpt-image-2
topics: [character, figurine, ecommerce]
aspectRatio: "3:1"
needsRefImage: true
useCase: "手里只有一张怪兽草图，想先看看做成软胶玩具是什么样：上传草图，得到一张像实物样品照的三联转面图，可当建模和雕刻参考。"
prompt: |
  以上传的[怪兽草图]为设计底稿，把这张粗略的手绘稿做成一件打磨完成的收藏级软胶玩具样品图。
  造型：保留草图里怪兽的核心轮廓和特征，把角、多只眼睛、小翅膀、多条手臂、分节的肚皮、粗短的腿、尾巴、爪子、疙瘩和鳞片这些细节，都转成完成度高的立体雕塑；比例圆润，像玩具。
  材质：[半透明翠绿色亮面软胶]，雕刻细节柔和；爪子、牙齿和肚皮带[珍珠白]的高光过渡；眼睛是黑白分明的亮面眼珠。
  版面：一张干净的产品转面图，恰好 3 个竖向画格，中间用白色间隔分开：
  1. 正面；
  2. 左侧面；
  3. 右侧面或右后四分之三侧。
  三格里玩具保持同样的直立站姿、同样的大小，脚底在同一水平线上。
  拍摄：影棚产品摄影，柔和均匀的光线，淡淡的落地阴影，[浅灰色]纯色背景，细节清晰，整体是日式软胶怪兽玩具的俏皮气质。
  不要出现文字、标志、手、工具和草图线条。成品要像实体原型的照片，可以直接拿去做 3D 建模或雕刻参考。画幅[3:1]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/today_senrihin/status/2070312489389347318
  author: "@today_senrihin"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分段；材质颜色、点缀色、背景色、画幅设为变量；原文的\"REFERENCE_0\"改为\"上传的怪兽草图\"；身体部件清单保留为正文并说明可按自己的草图替换。"
images:
  - 3563-sketch-to-sofubi-monster-turnaround-1.jpg
imageCredit:
  by: "@today_senrihin"
  url: https://youmind.com/gpt-image-2-prompts?id=26918
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先上传一张怪兽草图，铅笔稿、马克笔稿都可以，轮廓和关键特征画清楚就行；[怪兽草图] 这几个字可以改成"机器人草图""小恐龙线稿"来对应你的图。[半透明翠绿色亮面软胶] 是材质和颜色，可换"奶白色夜光软胶""透明橙色果冻胶""哑光粉色搪胶"；[珍珠白] 是爪子、牙齿和肚皮的点缀色；[浅灰色] 是背景；只要两个视角时把 [3:1] 改成 2:1 并删掉第三格。"造型"一段列的身体部件是照示例里的怪兽写的，换成你草图里实际有的特征。

示例图是三张并排的浅灰底产品照：一只通体翠绿、半透明带珠光的软胶小怪兽，头顶一对弯角，脸上一排黑亮的小眼睛，背后有小翅膀，身体两侧各两条短手，肚皮分节泛白，粗腿加一条上翘的尾巴；三格依次是正面、朝左的侧面和朝右的侧面。

**常见问题**：
- 造型跟草图差太多：加"不要新增或删除任何肢体，角和眼睛的数量按草图来"。
- 看起来像 CG 而不像实物：加"表面有细微的合模线和软胶特有的油亮反光"。
- 三格大小不一：把"同样的大小、脚底在同一水平线"在结尾再写一遍。

**适合**：潮玩和软胶玩具打样前的预览、给 3D 建模师的转面参考、众筹页的概念图；它只是效果图，开模尺寸仍要另出工程图。

### 英文原版

```text
Using REFERENCE_0 as the creature design base, turn the rough sketch into a polished collectible toy/garage-kit render. Preserve the monster’s core silhouette and features from the sketch, but convert it into a glossy translucent green vinyl figure with soft sculpted details, rounded toy-like proportions, pearly off-white claws/teeth/belly highlights, and black-and-white glossy eyes.

Create a clean product turnaround sheet with exactly 3 vertical panels separated by white gutters: 1) front view, 2) left side profile, 3) right side / rear three-quarter profile. Keep the figure standing upright in the same general pose, with the horns, many eyes, small wings, multiple arms, segmented belly, chunky legs, tail, claws, bumps, scales, and kaiju-toy texture translated into a finished 3D sculpt.

Style: {argument name="toy material" default="translucent emerald green glossy vinyl"}, studio product photography, soft even lighting, subtle shadows, neutral light gray background, high detail, playful Japanese sofubi monster aesthetic. Do not include text, logos, hands, tools, or sketch lines. The final image should look like rendered photos of a physical prototype ready for 3D modeling or sculpting reference.
```

> 改编自 [@today_senrihin](https://x.com/today_senrihin/status/2070312489389347318) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "ai吉祥物设计提示词：蜡笔粗描边的呆萌考拉，幼儿绘本风的极简动物角色（gpt-image-2）"
slug: crayon-koala-naive-mascot-character
model: gpt-image-2
topics: [sticker, character, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "需要一个\"小朋友画出来的\"那种呆萌动物形象时用：正面站立、粗黑蜡笔描边、带颗粒感的平涂，白底无装饰，可以直接当贴纸、头像、绘本主角或品牌吉祥物的草稿。"
prompt: |
  画一张简单、居中的幼儿绘本风插画：一只可爱的[考拉]全身像，纯白背景，画幅 3:4。
  - 画法：手绘蜡笔或粗马克笔风格，[黑色]描边粗而略微抖动、不太整齐，身体用带颗粒纹理的柔和平涂，颜色是[暖调的中灰色]；
  - 姿势：正面朝前、直立站着，圆圆的大脑袋、圆滚滚的身体，短短的手臂垂在两侧，短腿；
  - 耳朵：恰好 2 只大圆耳朵，一边一只，耳朵内侧是黑色的色块；
  - 五官：恰好 2 只又圆又大的白眼睛，里面是很小的黑色瞳孔；两眼之间 1 个竖着的椭圆形大黑鼻子；鼻子下面 1 个小小的上扬嘴巴；
  - 气质：友好、天真、像幼儿画的；
  - 画面干净：不要文字、阴影、道具、场景和其他角色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/shunchi_uu/status/2092466898210521348
  author: "@shunchi_uu"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；动物、身体颜色、描边颜色设为变量；保留\"恰好 2 只耳朵、2 只眼睛、1 个鼻子、1 个嘴\"的数量约束；耳朵内侧颜色改为可选说明"
images:
  - 3430-crayon-koala-naive-mascot-character-1.jpg
  - 3430-crayon-koala-naive-mascot-character-2.jpg
imageCredit:
  by: "@shunchi_uu"
  url: https://youmind.com/gpt-image-2-prompts?id=32657
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[考拉] 换成"北极熊""水獭""小恐龙"时，把耳朵和鼻子那两条也按动物特征改一下（比如兔子写"2 只竖着的长耳朵"）；身体颜色和描边颜色各写一种即可。想让耳朵是粉色，把"黑色的色块"改成"粉色的色块"。

示例图第一张：白底上一只灰色的考拉直直地站着，黑色蜡笔描边歪歪扭扭，灰色身体上能看到蜡笔的颗粒，两只白色圆眼睛瞪得很大，中间一个大黑鼻子，嘴角微微上扬；第二张是同一提示词把耳朵内侧换成粉色的版本，其他几乎不变，说明这个写法很稳定。

**常见问题**：
- 线条太光滑、像矢量图：加"线条粗细不均，有蜡笔断续的痕迹"。
- 多出腮红、睫毛等细节：保留数量约束，并加"除此之外没有任何五官细节"。
- 想做一套表情：固定这段描述，每次只改嘴巴和眼睛，如"嘴巴张成 O 形""眼睛闭成两条弧线"。

**适合**：贴纸与头像、绘本主角、幼儿园物料、品牌吉祥物初稿。

### 英文原版

```text
Create a simple centered children's-book illustration of a cute full-body {argument name="animal" default="koala"} character on a plain white background. Use a hand-drawn crayon or thick marker style with rough, slightly wobbly black outlines and soft textured gray fill. The character faces forward, standing upright with a large rounded head, rounded body, short arms hanging at the sides, and short legs. Include exactly 2 large round ears, one on each side of the head, each with a black inner ear patch and no pink inner-ear color. The face has exactly 2 wide white circular eyes with tiny black pupils, 1 large vertical oval black nose centered between them, and 1 small curved smiling mouth below the nose. The body is {argument name="body color" default="warm medium gray"}, the outline is {argument name="outline color" default="black"}, and the overall mood is friendly, naive, and toddler-like. Keep the composition uncluttered, with no text, no shadows, no props, no scenery, and no extra characters.
```

> 改编自 [@shunchi_uu](https://x.com/shunchi_uu/status/2092466898210521348) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

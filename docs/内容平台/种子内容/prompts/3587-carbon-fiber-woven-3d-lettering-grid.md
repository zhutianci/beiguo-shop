---
title: "logo提示词：碳纤维编织立体字效，四种配色 2×2 对比图（gpt-image-2）"
slug: carbon-fiber-woven-3d-lettering-grid
model: gpt-image-2
topics: [logo, poster]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给运动、汽车、数码这类强调性能感的品牌做标题字或 Logo 提案时用：同一个单词用碳纤维编织纹做成厚实的立体字，一张图里排出四种配色方案，方便挑选和比稿。"
prompt: |
  一张 1:1 的字体效果展示图，等分成 2×2 四个格子，格子之间不留白边。每一格里都是同一个单词[BOLD]，居中，做成厚实的立体字。
  - 字形：[粗壮的窄体无衬线大写字母]，笔画粗细一致，字距紧凑；
  - 材质：每个字母的表面都由[碳纤维]编织而成，能看清一股一股的斜纹交织，纹理方向统一朝右上方，随光线有明暗起伏，看得出细密的颗粒触感；
  - 立体感：字母有清晰的倒角和厚度，像贴在墙面上的金属字牌，一侧打来的柔和侧光在另一侧留下短而实的投影；
  - 四格配色：
    1. 左上：白色碳纤维字，深海军蓝的哑光背景；
    2. 右上：金色碳纤维字，黑色背景，右侧有一抹暖色光晕；
    3. 左下：红色碳纤维字，灰色清水混凝土墙面；
    4. 右下：黑色碳纤维字，带轻微纸纹的白色背景；
  - 整体：干净、克制、纯粹的性能感，产品级渲染清晰度；
  - 画面里除了这个单词不出现其他文字、Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/SRKDAN/status/2043871921889001824
  author: "@SRKDAN"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有一句话（\"每个字母都由碳纤维编织而成，有触感、有方向性、纯粹的性能美学\"），译为中文后按示例图补充了 2×2 四宫格版式、四组字色与背景搭配、粗窄无衬线字形、斜纹编织方向、倒角与侧光投影；单词、材质、字体气质设为变量"
images:
  - 3587-carbon-fiber-woven-3d-lettering-grid-1.jpg
imageCredit:
  by: "@SRKDAN"
  url: https://youmind.com/gpt-image-2-prompts?id=13621
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[BOLD] 换成你的单词或品牌缩写，英文建议 3~6 个字母，字母越少纹理越清楚；想用中文就写两个字以内，并把字形那一项改成"超粗黑体"；[碳纤维] 可以换别的编织或肌理材质，如"藤编""牛仔布""拉丝铝"；[粗壮的窄体无衬线大写字母] 换字体气质，如"圆润的粗圆体""带衬线的宽体字"。四格配色可以按品牌色逐条改，只想要一种就删掉其余三条并去掉"2×2"。

示例图是正方形四宫格：左上深蓝底白字，右上黑底金字，左下灰色水泥墙配红字，右下白底黑字，四格都是同一个单词 BOLD；每个字母表面布满斜向的编织纹，边缘有倒角，右下方带着短投影，像墙上的立体字牌。

**常见问题**：
- 纹理只是一张贴图、没有编织感：加"纤维束一上一下交错，交叉处有细小高光"。
- 四格里的字形不一致：加"四格使用完全相同的字形和字号，只改变颜色与背景"。
- 字母拼错：减少字母数，并在末尾把单词逐个字母再拼写一遍。

**适合**：品牌标题字提案、活动主视觉字效、产品发布页大标题。成品只是效果图，正式商用的字标还需设计师重新绘制矢量稿。

### 英文原版

```text
{argument name="subject" default="Typography"} where every letterform is woven from {argument name="material" default="carbon fiber"}. Tactile, directional, {argument name="aesthetic" default="pure performance aesthetic"}.
```

> 改编自 [@SRKDAN](https://x.com/SRKDAN/status/2043871921889001824) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

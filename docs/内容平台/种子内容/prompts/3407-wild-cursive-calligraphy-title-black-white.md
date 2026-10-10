---
title: "ai书法字体提示词：黑底白字狂草标题字，飞白 + 大小错落的电影片名风（即梦）"
slug: wild-cursive-calligraphy-title-black-white
model: jimeng
topics: [poster, logo]
modelLabel: Seedream 4.5
aspectRatio: "1:1"
needsRefImage: false
useCase: "需要一组有冲击力的手写书法标题字时用：电影 / 纪录片片名、视频封面大字、海报主标题、文创印花。输入一句话，得到黑底白字、笔势连绵、带飞白的狂放行草排版。"
prompt: |
  黑色背景，白色书法字，写的是："[海风吹不断，江月照还空]"。
  - 字体：狂放不羁的行草书法，笔画连绵、洒脱灵动，长笔画大胆拉长，充满动势和视觉张力；
  - 笔触：流畅飘逸，个别笔画巧妙延伸和变形，带明显的飞白（枯笔）效果；
  - 排版：字号大小有变化，重点字放大、虚词缩小，错落排布，分成[三行]占满画面；
  - 背景干净纯黑，不加印章、边框和其他装饰；
  - 整体像电影片名的题字，视觉冲击力强，每个字都要写对、能认出来。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://jimeng.jianying.com/ai-tool/work-detail/7576944495934049562?workDetailType=Image&itemType=9
  author: "即梦用户 一棵永远成长的苹果树"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为即梦作品的提示词（仓库收录的是英文转写），改写为通顺中文；文字内容设为变量并恢复为示例图中的中文诗句；补充了字数建议、分行方式和\"不出现印章与多余装饰\"的约束"
images:
  - 3407-wild-cursive-calligraphy-title-black-white-1.jpg
imageCredit:
  by: "即梦用户 一棵永远成长的苹果树"
  url: https://cms-assets.youmind.com/media/1765360375259_s6jr2i_1765339501783-kxt0et-021765339489400c799e7b290acded99bf6695874956a9f90b493_0-600x600.jpg
  license: CC BY 4.0
verify:
  - "书法字容易出现错字或缺笔，上线前换 2～3 句不同字数的文案各试一次"
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：引号里换成你要写的字，5～12 个字效果最好——字太少显得空，太多容易写错；[三行] 可按字数改成"两行""竖排两列"。想突出某几个字，可以补一句"'江月'两个字最大"。需要白底黑字（方便抠图印刷）就把第一句改成"白色宣纸背景，黑色墨迹"。

示例图：纯黑背景上三行白色毛笔字——"海风吹""不断 江月""照还空"，其中"不断"两个字明显缩小，其余字笔画粗重、收笔处拖出枯笔飞白，"月"字的长撇向左下甩出，整体满幅、很有力量。

**常见问题**：
- 出现错字、多笔少笔：书法类最常见的问题，减少字数、避开生僻字，多生成几次挑选；也可以加"笔画准确，字形可辨认，不要过度连笔"。
- 太潦草认不出：把"狂草"改成"行书"，保留飞白即可。
- 需要透明底：出图后用抠图工具去掉黑底，或直接要求"纯白背景黑字"再做正片叠底。

**适合**：视频封面大字、片名题字、海报主标题、T 恤 / 帆布袋印花草稿。正式商用的品牌字体建议请设计师在此基础上重新描绘。

### 原版提示词

```text
Black background with white text, calligraphy connected strokes chic, elegant and dynamic font design "{argument name="text content" default="Sea breeze blows endlessly, river moon shines in vain"}", wild and uninhibited cursive font, long strokes, visual tension full of dynamism, strokes smooth and elegant, strokes cleverly extended and deformed, flying white effect, font size variation, misplaced layout. Strokes smooth and free, clean background, masterpiece, movie theme font, strong visual impact.
```

> 改编自 [即梦用户 一棵永远成长的苹果树](https://jimeng.jianying.com/ai-tool/work-detail/7576944495934049562?workDetailType=Image&itemType=9) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

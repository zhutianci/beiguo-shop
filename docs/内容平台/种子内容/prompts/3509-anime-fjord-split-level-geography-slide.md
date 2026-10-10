---
title: "ppt提示词：动漫电影风地理课件配图，峡湾水上水下剖面 + 底部字幕条（gpt-image-2）"
slug: anime-fjord-split-level-geography-slide
model: gpt-image-2
topics: [ppt, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: "给地理、地球科学课件做一张好看的全幅配图：水面把画面分成上下两半，上面是冰川峡湾的山和冰，下面是水下的谷壁和冰碛石，底部一条半透明字幕条放讲解文字。"
prompt: |
  画一幅电影感的动漫风格科普风景插画，做成 16:9 的宽屏幻灯片配图，主题是[冰川峡湾]。
  - 构图：水上水下各占一半的剖面视角，水面在画面中间形成一条清晰的水平线。
  - 水面以上：峡湾两侧是高耸陡峭的山，远处是积雪的山峰，湛蓝的天空里散着白云，水面漂着几块小浮冰，峡湾尽头能看到一条冰川。右侧突出一面巨大的弧形崖壁，上面是清楚的层状沉积岩，岩层弯成大大的弧线；左侧是颜色更深、更粗犷的山体，带着斑驳的绿色植被和积雪。
  - 水面以下：清透的青蓝色海水里，能看到被淹没的谷壁、磨圆的石块、岩石斜坡和冰川刨蚀出的地形，层状岩石一直延伸到水下；有柔和的水下光束和随深度变浓的雾感。
  - 字幕条：画面底部约四分之一处叠加一条半透明的深色横条，上面是居中的白色字幕，三到四行，内容是（示例，可整句替换）："这里不只是风景，也是读懂地球的课堂。海底的冰碛、被冰川打磨的岩壁、地层弯曲的痕迹都留在这里。"
  - 画风：细腻的手绘背景美术，色彩明亮通透，像动画电影的场景画；字幕用简体中文、清晰易读；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ikuo_suzuki/status/2058424656265437200
  author: "@ikuo_suzuki"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；地貌主题改为变量；字幕给出中文示例句并注明可整句替换（原图字幕为日文）；保留水面居中分割、右侧弯曲岩层等构图要求"
images:
  - 3509-anime-fjord-split-level-geography-slide-1.jpg
imageCredit:
  by: "@ikuo_suzuki"
  url: https://youmind.com/gpt-image-2-prompts?id=22392
  license: CC BY 4.0
verify:
  - "字幕里的地学表述（冰碛、冰川打磨的岩面、地层弯曲）属于常识性描述，换主题时请自行核对讲解文字"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[冰川峡湾] 可换成其他适合"上下剖面"的主题，如"珊瑚礁与潟湖""红树林的根系""火山岛的水下山体"，上下两段的景物描述相应改写；字幕不是方括号变量，直接把引号里的示例句整句换成你的讲解词，控制在 60 个字以内，三四行最清楚。不需要字幕就删掉"字幕条"一条，得到纯配图。

示例图上半部分是蓝天白云下的雪山和峡湾，远处一条冰川伸进水里，右边一面巨大的山壁露出一圈圈弯曲的岩层；水面以下是青绿色的海水，能看到斜坡上的碎石和水下的岩壁；底部的深色半透明条上是四行白色字幕（原图为日文）。

**常见问题**：
- 水面线歪斜或不居中：强调"水平线笔直、位于画面正中"。
- 字幕出现错字：把字幕缩短到两行，或留空后在 PPT 里自己加。
- 水下太暗：加"水下有从水面射入的光束，能见度高"。

**适合**：地理和地球科学课件、科普视频的片头画面、研学活动海报的底图。

### 英文原版

```text
Create a cinematic anime-style educational landscape illustration of a glacial fjord, designed as a widescreen 16:9 slide. Show a dramatic split-level cross-section where the upper half is above the waterline and the lower half is underwater, with the water surface forming a crisp horizontal line across the middle. Above water: towering steep mountains on both sides of the fjord, snow-capped peaks in the distance, a bright blue sky with scattered white clouds, small floating icebergs, and a glacier visible at the far end of the inlet. On the right side, emphasize a massive curved cliff face with clear layered sedimentary rock strata bending in broad arcs; on the left, darker rugged mountains with patches of green vegetation and snow. Below water: transparent turquoise-blue fjord water revealing submerged valley walls, rounded stones, rocky slopes, glacially carved terrain, and continued layered rock formations, with soft underwater light rays and depth haze. Add a subtle dark translucent gradient panel across the bottom third for readability. Place exactly one centered Japanese educational text block in large white sans-serif characters with a slight shadow, broken into four lines, using this text: {argument name="caption text" default="この地域は、美しいだけではなく、地球のしくみを学ぶ場所でもあります。海底のモレーンや、氷河に磨かれた岩肌、地殻の動きの痕跡などが残されています。フィヨルドは、過去の氷河活動と今も続く地形変化を見せてくれる、野外の地球科学博物館なのです。"} Visual style: high-quality Japanese anime background art, painterly but detailed, naturalistic lighting, crisp geology, serene atmosphere, vibrant blues and greens, no people, no boats, no logos, no watermark.
```

> 改编自 [@ikuo_suzuki](https://x.com/ikuo_suzuki/status/2058424656265437200) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: 壁纸提示词：黏土定格动画风奇幻森林（变色龙 + 发光蘑菇 + 大眼睛花朵和小虫）
slug: claymation-forest-scene
model: nano-banana
topics: [illustration, wallpaper]
needsRefImage: false
aspectRatio: "16:9"
useCase: 想要一张色彩鲜艳、手作黏土质感的童趣场景图做电脑壁纸、儿童内容封面或绘本插图时用，换个动物和场景就能延展成一套。
prompt: |
  一个鲜艳、奇趣的黏土定格动画场景：一只色彩斑斓的[变色龙]趴在长满苔藓的树枝上，身处一片茂密的[奇幻森林]。
  - 变色龙身上有绿、蓝、橙、黄交织的精细鳞片花纹，目光专注地望向左侧；
  - 周围是同样用黏土捏成的奇幻动植物：[发光蘑菇、花心是眼球的怪花]，带着大眼睛的可爱小虫，还有形状奇特的圆鼓鼓果实；
  - 背景是柔和虚化的树木和枝叶，营造出纵深感和魔法氛围；
  - 能看到黏土的指纹压痕和手工质感，浅景深；
  - 整体像一个被赋予生命的魔法微缩世界；
  - 横版画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/heathergreen/status/2096750301134881054
  author: "@heathergreen"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；保留原文的动物、场景、植物三个变量并改为中文；补充黏土指纹质感、浅景深和画幅
images:
  - 3353-claymation-forest-scene-1.jpg
imageCredit:
  by: "@heathergreen"
  url: https://cms-assets.youmind.com/media/1788849669864_ao80hc_HRNJwHoXYAI7TvZ.jpg
  license: CC BY 4.0
verify:
  - 换成"小狐狸 / 雪地森林"出一次，看黏土质感是否保持
  - 检查"眼球花"等元素是否会让低龄用户感到不适，儿童内容可改成笑脸花
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
**怎么填变量**：[变色龙] 换成任何动物，比如"小狐狸""树懒""小青蛙"；[奇幻森林] 换场景，如"海底珊瑚礁""雪地松林""糖果花园"；[发光蘑菇、花心是眼球的怪花] 换成配套的环境元素，海底版可以写"发光水母、会笑的海葵"。示例图是一张横版黏土场景：一只绿色带橙蓝花纹的变色龙趴在长苔藓的树枝上，左边有一只大眼睛的小飞虫和带眼睛的彩色花朵，下方是一圈彩色小蘑菇和一只蜗牛，右边有几个长着圆眼睛的紫色果子。

**常见问题与调整**：
- 看起来像 3D 渲染不像黏土：加"表面有指纹和压痕，边缘略不规则，像手工捏制的定格动画道具"。
- 画面太满太乱：减少元素，加"主角占画面三分之一，周围只放 4～5 个小角色"。
- 做手机壁纸：画幅改 9:16，主角放在下半部分，上方是虚化的树冠。
- 想要系列图：固定"同样的黏土质感和光线"，每张换一种动物和场景。

**适合**：电脑 / 平板壁纸、儿童绘本或早教内容配图、定格动画风格参考；不适合需要写实感的场合。

### 英文原版

```
A vibrant, whimsical claymation scene depicts a colorful {argument name="animal" default="chameleon"} perched on a moss-covered branch in a lush, {argument name="setting" default="fantastical forest"}. The chameleon, with its intricate patterns of green, blue, orange, and yellow scales, gazes intently to the left. Surrounding it are an array of fantastical flora and fauna, also rendered in clay. These include {argument name="plant life" default="glowing mushrooms, peculiar flowers with eyeball centers"}, whimsical insects with googly eyes, and strange, bulbous fruits. The background is a soft blur of more trees and foliage, creating a sense of depth and enchantment. The overall impression is one of a magical, miniature world brought to life.
```

> 改编自 [@heathergreen](https://x.com/heathergreen/status/2096750301134881054) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

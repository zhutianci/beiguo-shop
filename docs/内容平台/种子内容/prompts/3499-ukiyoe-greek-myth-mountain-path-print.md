---
title: "壁纸提示词：浮世绘木版画风的神话故事场景，樱花、云海、石径与题签（gpt-image-2）"
slug: ukiyoe-greek-myth-mountain-path-print
model: gpt-image-2
topics: [wallpaper, illustration, poster]
aspectRatio: "3:2"
needsRefImage: false
useCase: "把一个神话或民间故事的经典一幕，画成做旧的浮世绘木版画：靛蓝群山、鲑粉色天空、樱花枝框景，再配两块竖排题签。适合做横版壁纸、书籍插图或文化类推文头图。"
prompt: |
  画一幅横向 3:2 的浮世绘风格神话风景插画，做旧的木版画质感：能看到纸张纤维、哑光的油墨肌理和细黑线勾边；配色是靛蓝色的群山、灰蓝色的雾谷、褪色的鲑粉色天空和柔和的奶白色高光。
  - 中央前景：[一位希腊神话里的年轻诗人]，深色卷发，头戴月桂冠，神情忧虑地回头张望，身披红色垂褶斗篷，里面是浅色长衣，手里提着一把小竖琴。
  - 左侧：从阴暗的山崖和雾气里浮现[一位半透明的白衣女子幽影]，长长的黑发，一只手伸向他，身形有一部分融进雾里。
  - 场景里恰好有：2 只飞鹤（在上方天空）、1 轮淡色的大太阳（右上方）、1 座红色鸟居（在远处山顶）、1 条蜿蜒的浅色石径（从右下前景穿过云雾中的群山，一直通向鸟居）。
  - 框景：画面左上角和左下角是深色的樱花枝，开满粉色的花，许多花瓣沿对角线飘过整个画面。
  - 题签：恰好 2 块窄长的竖排纸质题签——左上角一块写"[自冥入晓]"，右侧中部一块写"[音之道]"，字下盖一枚小红印。
  - 气质：东方木版画的平面构图与西方神话题材相融合，有电影感但保持版画的平涂，忧伤、如梦；不要现代物品，不要写实照片感，不要多余的人物和鸟，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/dhruvalgolakiya/status/2097574706228703374
  author: "@dhruvalgolakiya"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；主角、对角人物、两块题签文字改为变量（原文的日文题签换成中文示例）；保留\"两只鹤、一轮太阳、一座鸟居、一条石径\"的数量约束"
images:
  - 3499-ukiyoe-greek-myth-mountain-path-print-1.jpg
imageCredit:
  by: "@dhruvalgolakiya"
  url: https://youmind.com/gpt-image-2-prompts?id=33991
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个人物一栏换成你要讲的故事，例如"回头望向故乡的远行书生"和"站在渡口挥手的母亲"；题签各写 2～4 个汉字最稳，一块点题、一块点景；想换季节，把"樱花枝"改成"红枫枝""带雪的松枝"，天空颜色相应调整。

示例图里，一位卷发、戴月桂冠的青年披着红色斗篷站在画面中央回头看，手里夹着一把小竖琴；左边山崖的雾气里有一位半透明的白衣长发女子向他伸手；右侧一条白色石径在云海里盘旋而上，通向山顶的红色鸟居和一轮淡粉色的太阳，天上两只丹顶鹤；四周是樱花枝和飘落的花瓣，左上和右侧各有一块竖排题签（原图为日文）。

**常见问题**：
- 画成了细腻的现代插画：强调"木版画的平涂色块、有限的套色、纸张做旧"。
- 题签文字错乱：每块只写 2～3 个字，或留空后期自己加字。
- 幽影太实：加"身体下半部分完全融入雾气，透明度很高"。

**适合**：横版壁纸、神话与古典文学题材的配图、读书笔记封面。

### 英文原版

```text
Create a wide horizontal ukiyo-e inspired mythic landscape illustration in aged woodblock print style, with visible paper grain, muted ink texture, fine black linework, and a dusky palette of indigo mountains, misty gray-blue valleys, faded salmon pink sky, and soft cream highlights. In the center foreground place one young Greek poet or traveler, {argument name="character name" default="Orpheus"}, with curly dark hair, a laurel wreath, a worried backward glance, a red draped cloak over a pale tunic, and a small lyre held at his side. On the left, emerging from shadowy cliffs and mist, show one translucent ghostly woman in flowing white robes with long dark hair, reaching toward him with one hand, ethereal and partially faded into the fog. The scene contains exactly two flying cranes in the upper sky, one large pale sun near the upper right, one red torii gate on a distant mountaintop, and one winding pale stone path climbing from the lower right foreground through misty mountains toward the gate. Frame the upper left and lower left with dark cherry tree branches covered in pink blossoms, with many loose pink petals drifting diagonally across the whole composition. Add exactly two narrow vertical Japanese paper title plaques: one at the upper left reading {argument name="left plaque text" default="冥より暁へ"}, and one at the right middle reading {argument name="right plaque text" default="音の道"} with a small red seal below the characters. Blend Japanese ukiyo-e composition with a subtle ancient Greek mythological subject, cinematic but flat-print, melancholic and dreamlike, no modern objects, no photorealism, no extra people, no extra birds, no watermark.
```

> 改编自 [@dhruvalgolakiya](https://x.com/dhruvalgolakiya/status/2097574706228703374) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

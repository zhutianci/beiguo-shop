---
title: "室内场景提示词：复古星空列车车厢，黄铜木饰 + 星星座椅 + 窗外银河（gpt-image-2）"
slug: retro-starry-train-carriage-interior-anime
model: gpt-image-2
topics: [interior, illustration, wallpaper]
aspectRatio: "3:2"
needsRefImage: false
useCase: "生成一节\"开往银河\"的复古列车车厢内景：一点透视的中央过道、亮晶晶的木地板、黄铜行李架，窗外是流动的星云。适合做动画和游戏的场景设定、主题咖啡店或展陈的概念图、横版壁纸。"
prompt: |
  画一幅细节丰富的动漫风格电影感插画：一节复古幻想风的银河列车车厢内部，站在中央过道上，用严格的一点透视望向车厢尽头的门。画幅 3:2。
  - 氛围：车厢里空无一人，被发光的吸顶灯和壁灯照得很温暖；抛光上漆的木地板映着灯光，弧形的木质天花板，黄铜扶手、黄铜包边的座椅框架和华丽的老式五金。
  - 座椅：过道两侧共恰好 8 张可见的高靠背长椅，面对面排列；座椅和窗帘都是[深海军蓝、缀满金色小星星的绒布]，让车厢像一座流动的天文台。左前方有一张小木桌的一角。
  - 行李架：两侧上方是黄铜网格行李架，放着几只老式皮箱和蓝色行李箱。
  - 窗外：每扇大窗外都是[紫蓝色的银河与星云]，没有地面和建筑。
  - 尽头：一扇带拱形小窗的木门，门上方挂一块黄铜站名牌，写着"[星落站]"；门两侧各有一只圆形挂钟和小装饰画；右侧墙上一块小牌子写着"[银河线]"。
  - 画风：通透的光影，暖金色与深蓝色的对比，细腻的反光；画面里除两块牌子外不出现文字，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/tunemage/status/2052374961231372347
  author: "@tunemage"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；座椅面料、窗外景色、站名牌文字改为变量；保留\"恰好 8 张可见座椅\"\"空无一人\"等约束"
images:
  - 3553-retro-starry-train-carriage-interior-anime-1.jpg
imageCredit:
  by: "@tunemage"
  url: https://youmind.com/gpt-image-2-prompts?id=18918
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：座椅面料一栏写"颜色 + 图案 + 材质"，如"酒红色、带金色藤蔓纹的丝绒"；窗外景色可以换成"飘着雪的夜空""夕阳下的海面""流动的极光"，车厢的气质会跟着变；两块牌子各写 2～4 个字。想要有人物，把"空无一人"改成"靠窗坐着一位看书的旅人，只见侧影"。

示例图是一节木质车厢的内景：过道正对着尽头的木门，门上方是一块小小的站名牌；两边是成排的深蓝色座椅，椅面上撒满金色星点，扶手和椅框是黄铜色；上方的行李架上放着蓝色和棕色的箱子，天花板上两盏暖黄的吸顶灯；每扇窗外都是紫色的银河，窗帘也是星星图案。

**常见问题**：
- 透视歪斜：强调"一点透视、消失点在尽头的门中央、左右对称"。
- 窗外出现城市或地面：写"窗外只有星空与星云"。
- 灯光太暗：加"木地板上有明亮的灯光倒影，整体暖色调"。

**适合**：动画与游戏的场景设定、主题餐厅和展览的概念图、横版壁纸。

### 英文原版

```text
Create a highly detailed anime-style cinematic illustration of the interior of a retro fantasy galaxy train carriage, viewed from the center aisle in perfect one-point perspective looking toward the rear door. The scene is empty of passengers and warmly lit by glowing ceiling lamps and wall sconces, with polished varnished wood floors, curved wooden ceiling panels, brass rails, brass seat frames, and ornate vintage fittings. Use {argument name="seat fabric pattern" default="deep navy blue upholstery filled with tiny golden stars and nebula speckles"} for the seats and curtains, making the carriage feel like a celestial observatory. Show exactly 8 visible high-backed passenger bench seats arranged in two rows along the aisle, each with glossy brass armrests and rounded brass finials, plus 1 small wooden table attached at the front-left seat. Show exactly 8 large side windows, 4 on the left and 4 on the right, revealing a vivid outer-space panorama with a bright purple-blue Milky Way, dense stars, and glowing cosmic dust. Add exactly 2 long overhead luggage racks, one on each side, made of brass piping, holding exactly 9 vintage suitcases and trunks in blue, cream, and tan. At the far end, place a wooden door with a small arched window showing stars beyond it, flanked by exactly 2 round wall clocks and small framed astronomical diagrams. Include a glowing station sign above the rear door reading {argument name="rear station sign text" default="星降る駅"} and a side plaque on the right wall reading {argument name="side line sign text" default="天の川線"} with small English text beneath it reading {argument name="line subtitle" default="MILKY WAY LINE"}. The mood should be nostalgic, magical, and luxurious, like a steam-era sleeper train traveling through the galaxy; use warm amber lighting, rich reflections on wood and brass, crisp linework, elaborate background detail, no people, no modern technology, wide-angle composition, 16:9 aspect ratio.
```

> 改编自 [@tunemage](https://x.com/tunemage/status/2052374961231372347) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

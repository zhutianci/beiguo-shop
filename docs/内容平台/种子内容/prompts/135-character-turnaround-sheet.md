---
title: 角色设定图提示词：游戏 / 动画角色三视图 + 装备拆解（gpt-image-2）
slug: character-turnaround-sheet
model: gpt-image-2
topics: [character, illustration]
aspectRatio: "16:9"
needsRefImage: false
useCase: 为原创角色生成"正面 / 侧面 / 背面 / 动作"四视图加装备拆解的专业设定图，适合游戏、动画、小说角色设计。
prompt: |
  绘制一张专业的游戏 / 动画角色设定图。原创成年角色：[高空遗迹探险家]，[暖棕色皮肤]，[凌乱的银灰色短发]，[透明青绿色护目镜]，[旧橙色工装夹克]，[深灰色工装裤]，[米白色厚重靴子]，背着[青绿色圆柱形呼吸背包]。
  角色锁定：所有视图必须保持完全一致的脸部结构、发型、身材比例、服装剪裁、背包结构、颜色和穿戴位置；不要重新设计角色。
  从左到右严格排列：全身正面 → 90 度侧面 → 全身背面 → 3/4 动作姿态；右侧单独展示[护目镜]和[呼吸背包]的装备拆解。所有角色保持同一比例，双脚在同一水平线上，彼此不遮挡。
  米白色角色设计纸背景，精准的墨线 + 克制的概念设计厚涂；能清楚看到布料接缝、扣件、金属磨损和装备的连接方式；均匀柔光，不要戏剧化景深。
  不要文字、不要 Logo、不要水印，不要额外添加角色或重复的装备。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/plex233/status/2106206679868334425
  author: Dry Seven
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 英文原文译为中文；角色身份、外貌、服装和两件装备改为变量
images:
  - 135-character-turnaround-sheet-1.jpg
imageCredit:
  by: Dry Seven
  url: https://youmind.com/gpt-image-2-prompts?id=35856
  license: CC BY 4.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 四个视图是否为同一角色、双脚是否在同一水平线
  - 装备拆解与角色身上的装备是否一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：按"身份 → 肤色 → 发型 → 标志性配饰 → 上衣 → 下装 → 鞋 → 背负物"顺序填，每项写颜色 + 款式，信息越完整，四个视图越一致。装备拆解挑 1–2 件最有特色的。

**常见问题**：
- 视图之间衣服颜色变了：把关键颜色在"角色锁定"里再重复一遍。
- 侧面 / 背面画成了另一个姿势：保留"从左到右严格排列"，并说明"前三个视图都是自然站立"。
- 想要日系 / 美漫风：把"概念设计厚涂"换成"日系赛璐璐上色"或"美式漫画线稿"。

**提醒**：只用于原创角色；不要用来复刻已有动漫 / 游戏角色。

### 英文原版

```text
Create a professional game/animation character sheet. Original adult female high-altitude ruin explorer: warm brown skin tone, short messy silver-gray hair, transparent cyan-green goggles, old orange technical jacket, dark gray cargo pants, off-white heavy boots, cyan-green cylindrical breathing backpack.

Character Lock: All views must maintain completely identical facial structure, hairstyle, body proportions, clothing cuts, backpack structure, colors, and wear positions; do not redesign the character.

Strictly arranged from left to right: Full body front -> 90-degree side -> Full body back -> 3/4 action view; The right side independently displays equipment breakdown of goggles and breathing backpack. All characters maintain the same scale, feet on the same horizontal line, no occlusion between each other.

Off-white character design paper background, precise ink lines + restrained concept design thick painting, able to clearly see fabric seams, buckles, metal wear, and equipment connection methods; uniform soft light, no dramatic depth of field. No text, no logos, no watermarks, do not add extra characters or duplicate equipment.
```

> 改编自 [Dry Seven](https://x.com/plex233/status/2106206679868334425) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

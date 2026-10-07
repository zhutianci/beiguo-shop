---
title: nano banana 游戏活动图提示词：Q 版 RPG 宣传主视觉，小勇士和小龙打开发光宝箱（16:9 横版 KV）
slug: chibi-rpg-key-visual
model: nano-banana
topics: [game-art, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做手游 / 休闲游戏的活动公告图、版本更新横幅、社群宣传头图时，生成色彩明亮的 Q 版奇幻插画：角色开宝箱、金光和魔法粒子四溢，可选加入游戏标题字。
prompt: |
  一张日式手游 / 休闲游戏活动公告风格的横版插画，色彩丰富、欢快的奇幻世界。
  - 主体：可爱的 Q 版角色（[戴角盔的小勇士和一只紫色小龙]）笑着打开一个宝箱，金色光芒和魔法粒子从宝箱里耀眼地涌出，金币和宝石散落；
  - 背景：蓝天白云，漂浮的空岛、森林、瀑布和远处的[城堡]，郁郁葱葱；
  - 文字（可选）：画面中央或上方设计一个奇幻风装饰标题字"[游戏标题]"，并以易读的排版加上一句介绍"[一句话简介]"和副标题"[类型标签]"；
  - 色彩与光影：明亮高饱和的奇幻配色，带魔法光泽，阴影柔和；
  - 输出要求：直接输出铺满画布的平面设计本身，不要做成挂在墙上、放在桌上或带相框的海报样机，画面边缘不要透视变形和投影。
  画幅 16:9。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/AIGuideNote/status/2097985361729220828
  author: "@AIGuideNote"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并整合成主体 / 背景 / 文字 / 光影 / 输出五点；角色、城堡、游戏标题、简介、类型标签设为变量；合并原文中英文重复的两段"禁止海报样机"约束
images:
  - 3287-chibi-rpg-key-visual-1.jpg
imageCredit:
  by: "@AIGuideNote"
  url: https://cms-assets.youmind.com/media/1789108573807_t9dgx5_HR2KkS3XgA0D5eA.jpg
  license: CC BY 4.0
verify:
  - 示例图里没有出现任何标题文字，与提示词的文字要求不一致；实测加中文标题后的效果
  - 确认生成的角色没有撞脸现有知名游戏角色
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[戴角盔的小勇士和一只紫色小龙] 换成你游戏里的主角或吉祥物，比如"拿法杖的猫耳小法师和一只白色小狐狸""穿宇航服的小熊"；[城堡] 可换成"天空神殿""蘑菇村庄"。[游戏标题]、[一句话简介]、[类型标签] 是活动文案，例如"寻宝大冒险 / 登岛就送十连抽 / 冒险RPG"，不需要文字时把这一行整行删掉。示例图里是一个戴维京角盔、披蓝色斗篷的小男孩和一只紫色小龙并排开宝箱，金光和星星喷向天空，左右是带木桥的浮空岛和瀑布，右上方远处有一座紫色城堡，画面没有加标题字。

**常见问题与调整**：
- 生成成了贴在墙上的海报照片：把"直接输出平面设计本身，铺满画布"放到第一句。
- 标题字是乱码：标题控制在 4～6 个字，并写"标题文字准确、无错字"；或者先出无字版，后期用设计软件加字。
- 角色太小：加"两个角色占画面高度的一半以上，位于中央偏下"。
- 要做竖版开屏图：画幅改 9:16，背景改为"空岛从上到下层层堆叠"。

**适合**：游戏活动公告、版本更新横幅、社群宣传图、桌游 / 独立游戏众筹页头图。

### 英文原版

```
[Game Campaign]
- Game Title: {argument name="game title" default="Treasure Hunt!"}
- Game Overview/Features: {argument name="description" default="Find treasures on a great adventure island!"}
- Genre/Subtext: {argument name="subtext" default="RPG Adventure Action!"}

[Quality, Production, Composition]
- Style: Illustration for event announcements for Japanese mobile RPGs or casual games. A colorful and joyful fantasy world.
- Subject: Adorable chibi characters (deformed heroes or mascots) opening a treasure chest with smiles. Golden light and magical particles are overflowing dazzlingly from the chest.
- Background: Blue sky, white clouds, and islands or forests in a lush fantasy world.
- Typography (for GPT-image / Nano Banana Pro): A fantasy-style decorative logotype of {argument name="game title" default="Treasure Hunt!"} is designed in the center or top of the screen, with {argument name="description" default="Find treasures on a great adventure island!"} and {argument name="subtext" default="RPG Adventure Action!"} added in an easy-to-read layout.
- Color/Lighting: Bright, high-saturation fantasy colors, magical gloss, and soft shadow depiction.

[Strict Layout and Output Constraints (Required)]
- Output the finished design itself, filling the entire screen. Backgrounds and scene descriptions (walls, spaces, shadows, etc.) within the design may follow the instructions in the main text.
- Prohibitions: Photos of the finished poster in a frame, photos pinned to a wall, mockup photos placed on a desk or paper, perspective distortion of paper edges, or drop shadows.
- Output the finished flat 2D design itself, filling the entire canvas. Scene elements inside the design (walls, rooms, shadows) described above are allowed. Absolutely NO photo-of-a-poster mockups: no picture frames, no poster-on-wall or poster-on-desk shots, no perspective warp or drop shadow around the artwork's edges.

- Aspect Ratio: --ar 16:9
```

> 改编自 [@AIGuideNote](https://x.com/AIGuideNote/status/2097985361729220828) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

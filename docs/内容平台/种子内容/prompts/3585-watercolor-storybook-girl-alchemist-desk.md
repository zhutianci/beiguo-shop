---
title: "水彩插画提示词：星月下的少女炼金术师，淡紫金色绘本风（gpt-image-2）"
slug: watercolor-storybook-girl-alchemist-desk
model: gpt-image-2
topics: [illustration, character]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给原创角色画一张有故事感的立绘式插画：留白背景上，角色坐在摆满器具的木桌前做事，钢笔细线加透明水彩，淡紫配金色，适合做小说封面、角色卡或手账插图。"
prompt: |
  一张充满童话感的绘本风水彩插画，竖幅 3:4：年轻的女炼金术师[露娜]坐在木桌前做实验，背景是留白的纸面，上方点缀夜空元素。
  - 人物：[黑色长发、发梢渐变成紫色]，发丝飘逸，戴细圆框眼镜，低头专注；穿黑、白、紫三色的奇幻风炼金术师服，金色包边，领口系紫色缎带和宝石胸针，披着层叠的短斗篷，腰间有皮带和小包，衣服上有星星装饰；
  - 动作：[左手举紫色试管，右手扶金色浑天仪]；
  - 桌面：一只带星纹的金色浑天仪、一本摊开的植物图鉴、压在下面的一本蓝色合上的书、一只装紫色药水的烧瓶、一个木质试管架和里面 5 支颜色各不相同的试管、一条带金色星星和流苏的淡紫色三角桌旗；
  - 左侧木架：几只高矮不一的带塞玻璃瓶、圆底烧瓶和小药瓶，里面是粉色、紫色的液体；
  - 左下前景：一只奶油色陶罐插着薰衣草、紫色三色堇、浅桃色小花和垂下来的藤蔓；
  - 上方背景：恰好 1 弯新月、8 颗金色小星星、1 小团淡紫色的云；
  - 画法：纤细的钢笔勾线，透明水彩晕染，大面积留白，粉彩紫与金色点缀，手绘童书的奇幻质感，有淡淡的纸纹；主色强调[薰衣草紫]、暖金、奶油白和柔和的木棕；
  - 限制：人物和书桌居中，没有硬阴影，不要写实照片感，不要多余文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ohno_nori_on_x/status/2056654171760476211
  author: "@ohno_nori_on_x"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；角色名、发色、手上动作、主题色设为变量；原文要求\"用灰色方块遮住脸\"，按示例图改为戴圆框眼镜、低头专注的表情；把桌面 14 件、架上 7 件器具的逐件清单合并精简，保留月亮、星星等数量约束"
images:
  - 3585-watercolor-storybook-girl-alchemist-desk-1.jpg
imageCredit:
  by: "@ohno_nori_on_x"
  url: https://youmind.com/gpt-image-2-prompts?id=21599
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[露娜] 是角色名，只用来帮模型定住人设，不会写进画面；[黑色长发、发梢渐变成紫色] 换发型发色，如"银白短发""栗色麻花辫"；[左手举紫色试管，右手扶金色浑天仪] 是手上动作，换职业时一起改，比如药草师写"左手捏一枝薄荷，右手握研杵"，桌面器具也换成对应的工具；[薰衣草紫] 是主题色，换成"薄荷绿""玫瑰粉"时把服装和药水颜色一并改掉。

示例图是白底竖幅：戴圆框眼镜的黑紫渐变长发少女穿黑白紫的斗篷制服，左手举着试管，右手扶着一只金色浑天仪；木桌上有试管架、摊开的书和淡紫色星星桌旗，左边木架摆着玻璃瓶，左下角一罐薰衣草和小花，头顶一弯淡黄色新月和几颗小星星，整体很淡很透。

**常见问题**：
- 颜色太浓像厚涂：加"颜料很稀，能透出纸白，边缘有水痕"。
- 器具堆得太乱：把桌面一项删到 3~4 件，架子一项整条去掉。
- 手和试管画崩：把动作改简单，如"双手捧着一只烧瓶"。

**适合**：原创角色立绘、小说和同人志封面、手账与明信片插图。

### 英文原版

```text
Create a whimsical storybook-style watercolor illustration of a young female alchemist named {argument name="character name" default="Luna"} working at a wooden desk under a night sky motif. The character has long flowing {argument name="hair color" default="black hair with purple ombré ends"}, wears an ornate black, white, and violet fantasy alchemist outfit with gold trim, a purple ribbon brooch at the collar, layered cape, belts, pouches, and star decorations; her face is intentionally obscured by a soft vertical gray blur rectangle with no visible facial features. She holds one purple liquid test tube in her left hand and steadies a golden armillary sphere with her right hand. The desk contains exactly 14 visible alchemy and study objects: 1 golden armillary sphere with star patterns, 1 open botanical book, 1 closed blue book underneath, 1 purple potion flask on the desk, 1 wooden test tube rack, 5 test tubes in the rack containing clear, purple, blue, yellow, and pale liquid, 1 small glass vessel near the rack, 1 lavender triangular cloth runner with gold stars and tassels, 1 small star charm, and 1 wooden tabletop. On the left shelf area show exactly 7 glass laboratory containers: 3 tall stoppered bottles, 1 round flask with pink liquid, 1 small bottle with purple liquid, 1 lidded jar, and 1 narrow vial. In the lower left foreground show exactly 1 cream ceramic pitcher filled with wildflowers, including lavender sprigs, purple pansies, peach flowers, white blossoms, green leaves, and trailing vines. In the background show exactly 1 crescent moon, 8 small golden stars, and 1 soft cluster of pale lavender clouds. Use delicate ink outlines, airy white background, transparent watercolor washes, pastel purple and gold accents, hand-drawn children’s book fantasy texture, light paper grain, and a cozy magical laboratory mood. The overall palette should emphasize {argument name="accent color" default="lavender purple"}, warm gold, cream, and muted brown wood. Vertical composition, centered character and desk, no hard shadows, no photorealism, no extra text, no watermark.
```

> 改编自 [@ohno_nori_on_x](https://x.com/ohno_nori_on_x/status/2056654171760476211) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

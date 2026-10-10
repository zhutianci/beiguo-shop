---
title: "ai分镜提示词：美食短视频铅笔草稿分镜，12 格画完抹茶提拉米苏的制作（gpt-image-2）"
slug: dessert-cooking-rough-pencil-storyboard
model: gpt-image-2
topics: [comic, food]
aspectRatio: "21:9"
needsRefImage: false
useCase: "拍或生成一条甜品 / 料理制作短视频之前，先出一张 3×4 共 12 格的铅笔草稿分镜：每格一个制作动作，从冲抹茶、拌奶油、铺饼干到成品特写，不带任何文字，适合当拍摄清单或逐格交给视频模型。"
prompt: |
  为一支[9 秒]的日系 2D 动画风甜品制作短视频画一张很粗略的铅笔分镜草稿，要做的甜品是[抹茶提拉米苏]。
  画布：21:9 的横向宽幅分镜表，白底，细黑线边框，恰好 12 格，排成 3 行 4 列。用松散的手绘石墨铅笔线，能看到起稿的辅助线，明暗极少，只在抹茶的部分带一点[灰绿色]，不要精细上色。
  12 格从左到右、从上到下依次是：
  1. 水壶把热水倒进台面上一小碗抹茶粉里，旁边放着茶筅，背景有一个小罐子；
  2. 手持茶筅在碗里打抹茶的特写，画出打圈的动态线；
  3. 两把勺子把马斯卡彭奶酪和奶油舀进大搅拌碗；
  4. 刮刀在大碗里翻拌奶油糊，画出顺滑的弧形动态线；
  5. 备料全景：玻璃杯居中，左边一盘手指饼干，右边一小碗抹茶液，背景是厨房用具；
  6. 手把一块长方形手指饼干浸入浅碗里的抹茶液；
  7. 手把浸过抹茶的手指饼干铺进透明圆柱玻璃杯的底部；
  8. 勺子把一团奶油糊舀到杯中的饼干层上；
  9. 手在奶油层上再铺一层浸过的手指饼干；
  10. 刮刀抹平杯口厚厚的一层奶油，透过杯壁能看到饼干和奶油的分层；
  11. 细网筛把抹茶粉均匀筛在甜品表面；
  12. 成品特写：透明圆杯里分层清楚的抹茶提拉米苏，表面一层抹茶粉，垫着餐巾，旁边有几片小叶子和一把茶筅。
  风格：日本 2D 动画制作用的分镜稿，铅笔动态分镜的粗糙感，单色线稿，手和工具要画出动势和运动弧线，规整的长方形画格，略带俯视的桌面视角，轻松的备餐氛围。
  文字：不要说明文字、对白、镜头编号和水印。
  限制：保持有意为之的潦草草稿感，严格 12 格、21:9，重点放在制作动作和食材分层上，不要写实照片风。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ozuozuai99/status/2071841809756758453
  author: "@ozuozuai99"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；视频时长、甜品名、点缀色改为变量；12 个镜头逐条保留；合并了重复的\"保持草稿感\"描述。"
images:
  - 3484-dessert-cooking-rough-pencil-storyboard-1.jpg
imageCredit:
  by: "@ozuozuai99"
  url: https://youmind.com/gpt-image-2-prompts?id=27294
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[抹茶提拉米苏] 换成你要拍的东西，并把 12 个镜头改成对应的步骤，例如"手冲咖啡""蛋包饭""草莓大福"；每一步只写一个动作、一件工具，画面才干净。[9 秒] 是成片时长，只影响节奏感；[灰绿色] 是全图唯一的点缀色，做草莓甜品就换成"淡粉色"。步骤少于 12 个时改成"8 格、2 行 4 列"。

示例图：白底上三行四列的黑框分镜格，全是铅笔线稿，没有任何文字——第一行是倒水、茶筅打抹茶、舀奶酪、刮刀翻拌；第二行是备料全景、饼干浸抹茶液、铺进玻璃杯、舀奶油；第三行是再铺一层饼干、抹平奶油、筛抹茶粉，最后一格是垫着餐巾、旁边放着茶筅和叶子的三层成品。抹茶部分是偏灰的深色调子，线条比"极粗略"要工整一些。

**常见问题**：
- 画得太精致、像成品插画：加"速写感、线条不闭合、保留辅助线、不要排线阴影"。
- 步骤顺序乱了：给每步加编号，并强调"严格按编号从左到右、从上到下"。
- 想要镜头编号和时长：把"不要文字"改成"每格左上角一个小号数字"，时长建议后期自己标。

**适合**：美食短视频的拍摄分镜、料理教程的步骤草图、动画分镜课练习。和带说明栏的正式分镜表相比，这一条更适合前期快速对齐"拍哪些动作"。

### 英文原版

```text
Goal: Create an ultra-rough pencil storyboard for a {argument name="video duration" default="9-second"} Japanese 2D anime-style dessert cooking short video about making {argument name="dessert name" default="matcha tiramisu"}.

Canvas: Wide cinematic 21:9 horizontal storyboard sheet, white background, thin black panel borders, arranged as exactly 12 panels in a 3-row by 4-column grid. Use loose hand-drawn graphite pencil lines, sketchy construction strokes, minimal shading, a few muted pale green matcha accents, and no polished coloring.

Layout and panel count: Show exactly 12 discrete storyboard panels, left to right, top to bottom:
1. A kettle pours hot water into a small bowl of matcha powder on a kitchen counter; a whisk lies nearby and a small jar sits in the background.
2. Close-up of a hand whisking matcha in a bowl, circular motion lines visible.
3. Two spoons add creamy mascarpone or cream into a large mixing bowl.
4. A spatula folds the cream mixture in a large bowl, smooth sweeping motion lines.
5. Mise-en-scène wide shot: glass dessert cup centered, tray of sponge fingers on the left, small bowl of matcha on the right, kitchen tools in the background.
6. Hand dips one rectangular sponge finger into the matcha liquid inside a shallow bowl.
7. Hand places matcha-soaked sponge fingers into the bottom of a clear cylindrical glass cup.
8. A spoon drops a mound of cream onto the sponge layer inside the glass.
9. Hand adds another soaked sponge finger layer on top of the cream in the glass.
10. Spatula smooths a thick top layer of cream in the glass, showing layered sponge and cream through the transparent side.
11. A mesh sieve dusts matcha powder evenly over the top of the dessert.
12. Final beauty shot: completed matcha tiramisu in a clear round glass with three visible layers, green matcha dusted top, placed on a napkin with small leaves and a bamboo whisk nearby.

Visual style: Japanese 2D anime production storyboard, rough pencil animatic look, monochrome line art with subtle green-gray matcha shading, dynamic hands and utensils, expressive motion arcs, clean rectangular framing, light tabletop perspective, soft food-prep atmosphere.

Text content: No captions, no dialogue, no panel numbers, no watermarks.

Constraints: Keep the drawing intentionally rough and storyboard-like, preserve the exact 12-panel grid, maintain the 21:9 aspect ratio, focus on cooking actions and ingredient layering, and avoid photorealism.
```

> 改编自 [@ozuozuai99](https://x.com/ozuozuai99/status/2071841809756758453) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

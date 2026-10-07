---
title: "产品设计提示词：从名画到实物的三联设计展示图（蒙德里安收纳柜示例）（gpt-image-2）"
slug: art-inspired-product-design-board
model: gpt-image-2
topics: [interior, ecommerce]
aspectRatio: "16:9"
needsRefImage: false
useCase: "把一幅艺术作品的视觉语言转化成一件日用品，生成\"参考画作 → 铅笔草图 → 实物使用效果\"三联横版展示图，适合文创设计提案、工业设计作品集和家居产品概念图。"
prompt: |
  生成一张 16:9 横版的桌面产品设计展示图。
  左边放一幅画作参考：[蒙德里安《红黄蓝构成》]；中间是一个桌面收纳柜的正面网格图和透视铅笔草图；右边是收纳柜在桌面上实际使用的最终效果。
  收纳柜由象牙白漆木制成，粗黑色分隔条组成不对称的长方形网格：大红色抽屉、小蓝色抽屉、小黄色抽屉和白色格子共同组成正面。
  红色抽屉被拉开，里面放着[耳机和卷好的线]；黄色抽屉微微拉出，露出一块橡皮。抽屉必须有真实的侧壁、厚度和内部空间，并与各自的开口对齐。
  表现细腻的木纹、接触阴影和桌面磨损，自然侧光。
  草图必须与收纳柜的布局一致；不要文字、Logo 和网址。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/cellinlab/status/2097875217100296362
  author: "Cell 细胞"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文描述的英文写法改写为中文；艺术参考、收纳物品改为变量，并补充换成其他作品与产品时的写法"
images:
  - 3068-art-inspired-product-design-board-1.jpg
imageCredit:
  by: "Cell 细胞"
  url: https://youmind.com/gpt-image-2-prompts?id=34156
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[蒙德里安《红黄蓝构成》] 换成其他画作或艺术风格，再把中间、右边的产品描述改成从这幅画演变出来的物件，例如"梵高《星月夜》→ 旋涡纹陶瓷台灯""葛饰北斋《神奈川冲浪里》→ 浪花造型笔筒"。[耳机和卷好的线] 是抽屉里的道具，按产品用途改。

示例图从左到右：桌上立着一幅红黄蓝格子画、摊开的速写本上是收纳柜的正视网格和透视草图、右边是实物收纳柜——红色大抽屉拉开装着白色耳机和线，黄色小抽屉露出橡皮，木纹和阴影都很真实。

**常见问题**：
- 三部分对不上：强调"草图与实物布局完全一致"。
- 抽屉像贴图没有深度：保留"真实侧壁、厚度和内部空间"。
- 名画版权：示例用的是早已进入公有领域的作品；参考仍在版权期内的艺术作品做商用产品要注意授权。

**适合**：文创产品提案、工业设计作品集、家居产品概念图、设计课作业展示。

### 原版提示词

```text
Generate a 16:9 horizontal desktop design presentation. On the left, place a painting reference of {argument name="art reference" default="Mondrian's 'Composition with Red, Blue and Yellow'"}. In the middle, show the front grid and perspective pencil sketch of a desktop storage cabinet, and on the right, show the final effect in use. The cabinet is made of ivory-white painted wood, with thick black divider strips forming an asymmetrical rectangular grid. Large red drawers, small blue drawers, small yellow drawers, and white compartments form the front. The red drawer is pulled open, containing {argument name="storage items" default="headphones and coiled cables"}; the yellow drawer is slightly pulled out, revealing an eraser. Drawers must have realistic side walls, thickness, and internal space, aligning with their respective openings. Show fine wood grain, contact shadows, and desktop wear, with natural side lighting. The sketch must match the cabinet layout, with no text, logos, or URLs.
```

> 改编自 [Cell 细胞](https://x.com/cellinlab/status/2097875217100296362) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

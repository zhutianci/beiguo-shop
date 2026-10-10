---
title: 角色设定提示词：动漫角色十宫格设定板，图书管理员咖啡师小提琴手等 10 种人设一张出齐
slug: anime-character-archetype-grid
model: gpt-image-2
topics: [character, illustration]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做原创企划的角色阵容表、乙女 / 恋爱游戏人设提案、角色收集卡片海报时，生成一张 2×5 的十宫格角色卡：画风统一，每格一个职业人设，底部带名牌，像收藏版角色阵容海报。
prompt: |
  创作一张横版图片，内含整齐的 2×5 十宫格动漫角色卡。每格是一位不同的成年年轻女性（22～26 岁），设计成可爱温柔的女主角人设：
  [图书管理员]、[咖啡店店员]、害羞的小提琴手、活力网球选手、优雅的学生会长、犯困的插画师、花店店员、温柔的见习魔女、城市流行歌手、冬日通勤族。
  - 所有格子画风统一：现代精致动漫风，线条干净，柔和赛璐珞上色，眼睛有光，[粉彩]点缀色；
  - 格子之间有整齐的白色间隔，每格底部有一个小而清晰的名牌，写着角色名、身份和年龄；
  - 每个角色的发型、服装、道具和表情都明显不同，背景与身份相符（书架、咖啡吧台、网球场、霓虹街道等）；
  - 整体像一张收藏级的动漫角色阵容表 / 十宫格海报，[可爱、健康]；不要裸露、内衣或暴露姿势，角色均为成年人。
  横版 3:2。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-anime-and-manga.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；前两个人设、点缀色、整体氛围设为变量；按示例图补充了名牌内容和与身份相符的背景
images:
  - 3320-anime-character-archetype-grid-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/anime-manga/anime-ten-panel-character-grid.png
  license: MIT
verify:
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
  - 示例图名牌是英文 + 日式人名，换成中文名牌测一次，看十个名牌是否都清晰
  - 网球选手的帽子上有类似运动品牌的标志，展示前确认是否需要处理
---
**怎么填变量**：十个人设可以整串替换，[图书管理员]、[咖啡店店员] 示意替换位置，比如做古风企划写"琴师、医女、女侠、绣娘……"，做职场企划写"程序员、设计师、产品经理、HR……"。[粉彩] 点缀色可换"复古暖棕""冷调蓝灰"；[可爱、健康] 可改成"帅气、干练"之类的整体气质。想要男性或混合阵容，直接改人物描述，保留"画风统一、每人造型不同"这两句。示例图是仓库作者的出图：上下两排共十格，上排依次是戴眼镜抱书的图书管理员、端咖啡的围裙店员、抱小提琴的女孩、戴遮阳帽拿网球的选手、拿文件夹的学生会长，下排是趴在桌边的插画师、抱花束的花店店员、戴尖帽的见习魔女、霓虹灯下拿麦克风的歌手和围格子围巾的通勤族，每格底部一张白色名牌。

**常见问题与调整**：
- 十个人脸长得一样：给每格写一个外形关键词，如"短发 + 雀斑""双马尾 + 虎牙"。
- 名牌文字乱码：名牌只写身份两三个字，删掉名字和年龄。
- 格子不整齐：强调"严格的 2 行 5 列网格，所有格子大小相同"。
- 想要六宫格更精细：改成"2×3 六宫格"，人设删到六个。

**适合**：原创企划角色阵容表、恋爱游戏人设提案、角色卡片海报；不适合模仿特定作品角色。

### 英文原版

```
Create a single landscape image containing a clean 2×5 ten-panel anime character grid. Each panel shows a different adult young woman, age 22 to 26, designed as a cute gentle heroine archetype: bookish librarian, cheerful cafe barista, shy violinist, sporty tennis player, elegant student-council president, sleepy illustrator, flower-shop assistant, soft-spoken witch apprentice, city-pop singer, and cozy winter commuter. Keep all panels consistent in art direction: modern polished anime, crisp line art, soft cel shading, luminous eyes, pastel accent colors, tidy white gutters, small readable name tag at the bottom of each panel, and a balanced character-design-sheet feel. Every character should have a distinct hairstyle, outfit, prop, and expression. The overall board should feel like a collectible anime cast sheet / ten-grid poster, cute and wholesome, no nudity, no lingerie, no explicit pose, adult characters only.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

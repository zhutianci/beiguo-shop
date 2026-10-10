---
title: "游戏概念图提示词：低多边形奇幻 RPG 第一人称画面（火球 + 长剑 + 哥布林）（gpt-image-2）"
slug: low-poly-fps-fantasy-game-scene
model: gpt-image-2
topics: [game-art]
aspectRatio: "16:9"
needsRefImage: false
useCase: "生成一张像真实可玩游戏截图的低多边形奇幻冒险画面：第一人称双手（一手火球一手长剑）、冲来的哥布林、废墟城墙、瀑布和任务木牌，适合游戏原型提案、关卡氛围图和独立游戏宣传图。"
prompt: |
  生成一张第一人称的低多边形奇幻冒险游戏截图，明亮的风格化 3D 美术，像一款可玩的 RPG。
  镜头在人眼高度，站在小溪边的土路上；前景露出玩家的双手：左手施放发光的[橙色火球]，带火花和暖光；右手握着一把[简洁的多面钢剑]，深色剑柄。
  恰好 3 个敌人：左下前景 1 个举着尖刺棍冲来的大个绿色哥布林、路中间 1 个拿圆盾的小个哥布林战士、背景废墟城门里站着 1 个壮硕的兽人首领。
  场景是[山间森林谷地中的废弃石堡]：左边长满苔藓的残破城墙、木栅栏、松树、灰色巨石、远处棱角分明的群山、蓝天和块状的白色低多边形云。
  恰好 2 面挂在废墟墙上的红色骷髅旗、3 支点燃的火把、1 座跨过小溪的木桥、河岸边 1 个宝箱、悬崖上 1 座插小红旗的木制瞭望塔、右边 1 条蓝色瀑布、右前景 1 座高高的浅色水晶方尖碑、溪边石台上 1 颗发光的紫色暗黑水晶。
  右侧一块木制任务牌，准确写着"DESTROY THE [DARK CRYSTAL]"，下面一个小骷髅图标。
  鲜艳的游戏级光照，清晰的阴影，轮廓易读，饱和的绿色和蓝色，温暖的火光，多边形几何体；不要写实照片感、界面 UI 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Federic83017719/status/2090092988085031295
  author: "Fede(URU) 🇺🇾"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；场景、任务目标、武器、法术、敌人阵营改为变量；保留场景物件的数量约束"
images:
  - 3098-low-poly-fps-fantasy-game-scene-1.jpg
imageCredit:
  by: "Fede(URU) 🇺🇾"
  url: https://youmind.com/gpt-image-2-prompts?id=32064
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：火球、钢剑、场景和任务牌文字都可以换，例如"[冰霜箭]＋[木弓]＋[雪山中的冰封神殿]＋任务牌 DESTROY THE [FROZEN GATE]"；敌人阵营在第三段里改（"骷髅兵和亡灵法师"）。任务牌文字建议用短英文，中文会更容易出错。

示例图是第一人称画面：左手托着橙色火球、右手握着钢剑，左下一只绿色哥布林举棒冲来，远处废墟城门里有兽人首领，左侧挂着红色骷髅旗的石墙，右边瀑布、水晶方尖碑和写着"DESTROY THE DARK CRYSTAL IN THE RUINS"的木牌，蓝天白云都是低多边形风格。

**常见问题**：
- 画成写实风：强调"低多边形、平面着色、棱角分明"。
- 双手变形：把手部写成"戴皮手套的双手，只露出手腕以上"。
- 物件太多太挤：可以删掉一半场景物件，画面更干净。

**适合**：游戏原型提案、关卡氛围图、独立游戏宣传图、游戏设计课作业。

### 英文原版

```text
Create a first-person low-poly fantasy adventure game screenshot in a bright stylized 3D art style, as if from a playable RPG built from a single image. The camera is at human eye level on a dirt path beside a small stream, with two player hands visible in the foreground: the left hand is casting a glowing orange fireball with sparks and warm light, and the right hand holds a simple faceted steel sword with a dark hilt. Show exactly 3 enemies: 1 large green goblin charging in the lower left foreground with a spiked club, 1 smaller goblin warrior on the path near the center holding a round shield, and 1 bulky ogre or orc boss standing inside the ruined gate in the background. The setting is {argument name="environment" default="a mountain forest valley with ruined stone fortifications"}: mossy broken castle walls on the left, wooden palisades, pine trees, gray boulders, distant angular mountains, a blue sky, and chunky white low-poly clouds. Include exactly 2 red skull banners hanging on the ruin walls, exactly 3 lit torches, 1 wooden footbridge crossing the stream, 1 treasure chest near the riverbank, 1 wooden watchtower with a small red flag on a cliff, 1 blue waterfall on the right, 1 tall pale crystal obelisk in the right foreground, and 1 glowing purple dark crystal on a stone pedestal near the stream. Add a wooden quest sign on the right that reads exactly: "DESTROY THE\nDARK CRYSTAL\nIN THE RUINS" with a small skull icon beneath. Use vibrant game-ready lighting, crisp shadows, readable silhouettes, saturated greens and blues, warm fire highlights, polygonal geometry, no photorealism, no UI overlays, no watermark. The main quest objective is {argument name="quest objective" default="destroy the dark crystal in the ruins"}, the player weapon is {argument name="player weapon" default="a steel sword"}, the magic effect is {argument name="magic spell" default="an orange fireball"}, and the enemy faction is {argument name="enemy faction" default="goblins and orcs"}.
```

> 改编自 [Fede(URU) 🇺🇾](https://x.com/Federic83017719/status/2090092988085031295) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

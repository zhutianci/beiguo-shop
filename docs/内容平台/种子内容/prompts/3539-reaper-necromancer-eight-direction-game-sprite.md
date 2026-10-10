---
title: "ai游戏素材生成提示词：一句话生成 8 个朝向的 2D 角色素材，镰刀死灵法师示例（gpt-image-2）"
slug: reaper-necromancer-eight-direction-game-sprite
model: gpt-image-2
topics: [game-art, character]
aspectRatio: "3:2"
needsRefImage: false
useCase: "做 2D 游戏时需要同一个角色的多方向立绘：一句话让模型在一张图里画出正面、背面、左右和四个斜向共 8 个朝向，背景干净便于抠图，可以直接作为后续做动画帧的基准。"
prompt: |
  我在做一款 2D 游戏，需要一张能直接拿去做动画的角色素材。角色是[手持镰刀的死灵法师]，请把它的[全部 8 个朝向]画在同一张图上。
  - 排布：2 行 4 列共 8 个全身立绘，间距均匀、互不重叠；依次为正面、右前斜、右侧、右后斜、背面、左后斜、左侧、左前斜。
  - 一致性：8 个都是同一个角色——相同的身高比例、服装、配色和武器；武器始终握在同一只手里；脚底在同一条水平线上，大小一致，方便对齐。
  - 造型：戴兜帽的黑袍，脸藏在阴影里，只露出一点发光的眼睛；破碎的长袍下摆，肩甲、腰带上挂着小骷髅装饰，深紫色的内衬；镰刀的刀柄很长，刀身根部嵌着一颗紫色宝石。
  - 画风：[精细的手绘奇幻风，暗色调]，线条干净，光源统一从上方来。
  - 底色用纯白或透明，不画地面投影，不加文字和边框，这样后面抠图最省事。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/enviouky/status/2095988936371818833
  author: "@enviouky"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文只有一句话，按示例图补充了 2 行 4 列的排布、8 个朝向的顺序、统一比例和抠图要求；角色、朝向数量保留为变量，新增画风变量"
images:
  - 3539-reaper-necromancer-eight-direction-game-sprite-1.jpg
imageCredit:
  by: "@enviouky"
  url: https://youmind.com/gpt-image-2-prompts?id=33494
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[手持镰刀的死灵法师] 换成你的角色，后面"造型"一条也改成对应的外形描述（越具体，8 个朝向越一致）；[全部 8 个朝向] 可以改成"4 个朝向（正、背、左、右）"，同时把排布改成 1 行 4 列；画风可换"16 位像素风""扁平卡通风""Q 版三头身"。

示例图是白底上的两排、每排四个黑袍死灵法师：兜帽下是发光的紫色眼睛，长袍下摆破成一条条，腰间和肩上挂着小骷髅，手里握着一把带紫色宝石的长柄镰刀；八个形象分别朝向不同的方向，身高和配色基本一致。

**常见问题**：
- 有几个朝向重复或缺少背面：把 8 个朝向逐个编号写出来，并要求"每个朝向只出现一次"。
- 武器一会儿在左手一会儿在右手：强调"所有朝向都用右手持武器"。
- 细节在不同朝向上对不上：这是常见现象，可把它当基准稿，再逐个朝向单独重绘修正。

**适合**：独立游戏原型、RPG 和塔防的角色素材起稿、给美术外包的参考；正式用于逐帧动画前还需要人工统一细节。

### 英文原版

```text
generate a {argument name="character" default="2d necromancer with a scythe"} as an animation ready game asset on a transparent background from {argument name="angles" default="all 8 angles"}
```

> 改编自 [@enviouky](https://x.com/enviouky/status/2095988936371818833) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

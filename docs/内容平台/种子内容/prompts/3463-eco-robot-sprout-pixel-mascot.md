---
title: "ai像素画生成提示词：头顶嫩芽的环保小机器人像素吉祥物（gpt-image-2）"
slug: eco-robot-sprout-pixel-mascot
model: gpt-image-2
topics: [logo, game-art]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给环保、园艺、植物类的小程序、社群或独立游戏做一个像素风吉祥物：奶油色圆头小机器人，黑色面罩里一双带爱心高光的绿眼睛，头顶两片嫩芽、胸口嫩芽徽记，抬手打招呼，白底孤立，可直接当头像、贴纸或游戏角色素材。"
prompt: |
  在[纯白背景]上画一个居中的全身像素画吉祥物机器人。
  - 角色：可爱的 Q 版[环保小机器人]，圆润的头盔式脑袋和身体是[柔和的象牙奶油色]，面罩屏幕是深黑色，全身用[叶绿色]的植物主题元素点缀；
  - 风格：复古 16 位 / 32 位像素风，方形像素清晰可见，干脆的黑色描边，柔和的明暗高光；
  - 头部：恰好 2 只大大的亮绿色眼睛，带白色爱心形高光；一张小小的白色微笑嘴；恰好 2 个圆形的绿色侧耳舱；头顶天线上长着恰好 2 片绿色嫩芽叶子；额头有一块绿色小面板，上面是白色嫩芽图标加 2 个白点；
  - 身体：紧凑圆润，胸口一块方形绿色面板，印着白色嫩芽徽记；恰好 2 条手臂，关节是绿色——一只手臂抬起来友好地挥手，手是绿色分节的小手；另一只自然下垂，奶油色前臂更粗、手是绿色；恰好 2 条短腿，一双奶油色配绿色的靴子；
  - 配色：象牙奶油、叶绿、面罩的深黑，加一点黄绿色高光；
  - 要求：讨喜、左右对称、正面朝向、主体孤立；不要文字、水印和多余道具；高清像素画，带一点细网格般的像素肌理。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/JustinPerea/status/2062591227963343260
  author: "@JustinPerea"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；背景、主体色、点缀色改为变量，另把角色主题设为变量；保留原文的数量约束（2 只眼睛、2 片叶子、2 个耳舱等）"
images:
  - 3463-eco-robot-sprout-pixel-mascot-1.jpg
imageCredit:
  by: "@JustinPerea"
  url: https://youmind.com/gpt-image-2-prompts?id=24167
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[环保小机器人] 是角色主题，可以换成"海洋清洁小机器人""快递小机器人""咖啡师小机器人"，同时把头顶的嫩芽、胸口的徽记换成对应的元素（水滴、包裹、咖啡杯）；[柔和的象牙奶油色] 和 [叶绿色] 是主色和点缀色，海洋主题可改成"珍珠白 + 湖蓝"；[纯白背景] 需要抠图时保持不变，想直接当头像可以写"浅绿色纯色背景"。

示例图是白底正中的像素小机器人：奶油色的大圆头，黑色面罩里两只绿色大眼睛各有一颗白色爱心高光，下面一道小小的白色微笑；头顶两片绿叶，额头和胸口的绿色面板上都有白色嫩芽图标；两侧是绿色圆耳舱，画面左侧的手臂抬起打招呼，另一只垂在身侧，脚上是奶油色配绿色的短靴。

**常见问题**：
- 像素边缘发虚：加"硬边像素、不要抗锯齿和模糊"，需要低分辨率素材时再自行缩小到 64×64。
- 想要动作序列：追加"同一角色的站立、挥手、行走、跳跃 4 帧，横向排成一行"。

**适合**：环保 / 植物类项目的吉祥物、社群头像、贴纸、独立游戏角色草案；正式做游戏素材还需要按引擎要求重新对齐像素网格。

### 英文原版

```text
Create a centered full-body pixel art mascot robot on a clean {argument name="background" default="plain white background"}. The character is a cute chibi eco robot with a cream-colored rounded helmet-like head and body, dark black face screen, and green plant-themed accents in a retro 16-bit/32-bit pixel style with visible square pixels, crisp black outline, and soft shaded highlights. The robot has exactly 2 large glossy green eyes with white heart-shaped highlights, a tiny white smiling mouth, exactly 2 round green side ear pods, exactly 2 green sprout leaves growing from the top antenna, and a small green forehead panel decorated with a white sprout icon plus 2 white dots. The body is compact and rounded with a square green chest panel showing a white sprout emblem, exactly 2 arms with green joints, the left arm raised in a friendly wave with a small green segmented hand, the right arm hanging down with a chunkier cream forearm and green hand, exactly 2 short legs, and exactly 2 cream-and-green boots. Use a warm palette of {argument name="main body color" default="soft ivory cream"}, {argument name="accent color" default="leaf green"}, deep black for the face visor, and subtle yellow-green highlights. Make the mascot adorable, symmetrical, front-facing, isolated, no text, no watermark, no extra props, high-resolution pixel art with a slight grid-like pixel texture.
```

> 改编自 [@JustinPerea](https://x.com/JustinPerea/status/2062591227963343260) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

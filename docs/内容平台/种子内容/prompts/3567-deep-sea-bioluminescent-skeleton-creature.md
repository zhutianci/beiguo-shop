---
title: "ai角色三视图提示词：深海发光骨骼生物，油膜虹彩表皮正背侧三视图（Nano Banana）"
slug: deep-sea-bioluminescent-skeleton-creature
model: nano-banana
topics: [character, game-art]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: "做游戏怪物、科幻生物设定时，用一张横图得到同一只深海生物的正面、背面、侧面：表皮是流动的油膜虹彩，体内的骨架发出冷光。"
prompt: |
  一张深海生物的角色三视图设定稿：同一只[深海生物]的正面、背面、侧面，三格横向并排，每格左上角用小号英文标注 FRONT VIEW、BACK VIEW、SIDE VIEW。
  生物外形：人形的上半身接一条粗长的尾巴，身体两侧和下方垂着多条触手，头部像深海鱼，长着一口细密的尖牙；三格里的体型、触手数量和比例保持一致，只是转了角度。
  表皮：像一层缓缓流动的油膜，带[彩虹色的油光]，蓝、紫、绿、金随角度变幻，湿滑而黏稠。
  内部：透过半透明的油膜表皮，能看到一副会搏动的生物发光骨架——头骨、脊柱、肋骨和臂骨发出[柔和的蓝色]光，是画面里最亮的部分。
  环境与光线：昏暗的水下影棚光，墨绿到近黑的深水背景，上方有几缕微弱的水面透光；每格用细线边框分开。
  风格：游戏美术的生物概念设计，半写实数字绘画，质感细腻。
  不要血腥内容，不要多余文字和水印。画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/NeuralPaints/status/2005966861230563804
  author: "@NeuralPaints"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文只有三句，译为中文后按示例图补充了生物外形（鱼形头、尖牙、触手、长尾）、三格并排与视图标注、深水背景和一致性要求；生物类型、表皮质感、骨架发光颜色、画幅设为变量；补充\"不要血腥内容、不要水印\"。"
images:
  - 3567-deep-sea-bioluminescent-skeleton-creature-1.jpg
imageCredit:
  by: "@NeuralPaints"
  url: https://youmind.com/nano-banana-pro-prompts?id=4069
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[深海生物] 可以写得更具体，如"鮟鱇鱼形态的深海生物""水母与海蛇混合的生物"；[彩虹色的油光] 是表皮质感，可换"珍珠母贝光泽""黑曜石般的镜面"；[柔和的蓝色] 是体内骨架的发光颜色，换成"幽绿色""琥珀色"气质会完全不同。"生物外形"一段是照示例图补写的，想要别的体型就整段替换。视图标注想用中文，把三个英文词改成"正面、背面、侧面"。

示例图是三格并排的深色设定稿：左边正面、中间背面、右边侧面，同一只长着鱼形头和尖牙、拖着多条触手与长尾的生物，表皮泛着蓝紫绿的油膜虹彩，胸腔、脊柱和臂骨透出明亮的蓝光；每格左上角有小号的英文视图标注，背景是墨绿色的深水。

**常见问题**：
- 三个视图像三只不同的生物：加"三格中触手数量、尾巴长度、头部形状完全一致"。
- 骨架不发光或被表皮盖住：加"表皮半透明，骨架亮度明显高于表皮"。
- 画面过暗看不清轮廓：加"生物边缘有一圈冷色轮廓光"。

**适合**：游戏怪物原画、科幻和克苏鲁题材的生物设定、建模前的三视图参考；牙齿和骨骼比较醒目，儿童向内容慎用。

### 英文原版

```text
Character sheet showing Front, Back, and Side views of a deep-sea creature. The surface is a swirling, iridescent oil-slick with rainbow fuel-tints. Underneath the oily surface, a pulsing bioluminescent skeletal structure glows {argument name="skeleton color" default="soft blue"}. Wet, viscous texture, dark underwater studio lighting.
```

> 改编自 [@NeuralPaints](https://x.com/NeuralPaints/status/2005966861230563804) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

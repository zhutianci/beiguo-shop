---
title: 壁纸提示词：纸雕层叠风森林夜市插画，蘑菇伞下的动物小摊（gpt-image-2）
slug: paper-cut-night-market-illustration
model: gpt-image-2
topics: [illustration, wallpaper]
needsRefImage: false
aspectRatio: "3:2"
useCase: 做童书风插画、电脑壁纸、节日活动主视觉时，生成一张"剪纸层叠 + 暖灯 + 小动物摆摊"的横版夜市画面，远看氛围温暖，近看每个摊位都有小故事。
prompt: |
  生成一张横版编辑插画，风格是层叠剪纸 / 纸雕：一个藏在巨大蘑菇和蕨类叶子下面的[森林小夜市]。
  - 摊位与角色：挂着暖色灯笼的小摊在卖[橡果蛋糕]，有[甲虫出租车]、一只[狐狸书法家]、一只[獾在卖茶]，还有举着树叶当伞的小动物孩子；
  - 萤火虫排成柔和的点状小路，串起各个摊位；
  - 风格：上世纪中期童书插画 + 当代层叠纸艺立体场景，看得见纸张裁切边缘，层与层之间有柔和投影；
  - 配色：[苔藓绿、南瓜橙、奶油白、墨蓝]，整体偏低饱和；
  - 层次感：第一眼是一片温暖发光的夜市剪影，第二眼看到各个摊主的小故事，第三眼看到手工纸张纹理、小招牌和动物的俏皮动作；
  - 不要照片写实，不要 3D 塑料感，不要糊成一团看不清的脸。
  画幅[3:2]横版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-illustration.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；场景、摊位商品、角色、配色、画幅设为变量；补充了常见问题与改法
images:
  - 3241-paper-cut-night-market-illustration-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/illustration/papercut-forest-market.png
  license: MIT
verify:
  - 换成中文招牌（如"茶""糕"）出一次，看小字是否仍然清楚
  - 示例图里招牌是英文（Acorn Cakes、Badger Tea 等），页面需注明示例为英文版
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[森林小夜市] 可以换成"芦苇荡里的水上集市""雪地松林里的冬日市集"；摊位和角色随场景换，比如 [狐狸书法家] 换成"刺猬面包师""猫头鹰邮差"；[苔藓绿、南瓜橙、奶油白、墨蓝] 换成"樱粉、嫩绿、米白"就变成春日版。示例图是仓库作者的出图：左边巨大红蘑菇下是卖蛋糕的松鼠摊，中间一辆甲虫车，右边狐狸在摊位里写字、獾在卖茶，萤火虫光点铺成小路，招牌都是英文。

**常见问题与调整**：
- 纸雕感不明显、像普通插画：加"每一层边缘有白色裁切毛边，层与层之间明显错开、有投影"。
- 角色太多太挤：把角色数量写死，如"只保留 4 个摊位、6 个小动物"。
- 想要中文招牌：在提示词里直接写"招牌文字为'茶''糕''车'，毛笔字体"，字越少越准。
- 做手机壁纸：画幅改成 9:16，追问"夜市沿纵向小路展开，上方留出空白放时钟"。

**适合**：童书 / 绘本概念图、桌面壁纸、节日或市集活动主视觉；不适合需要写实效果的场景。

### 英文原版

```
Create a landscape editorial illustration in layered paper-cut style: a tiny forest night market hidden beneath giant mushrooms and fern leaves. Include warm lantern stalls selling acorn cakes, beetle taxis, a fox calligrapher, a badger tea vendor, children holding leaf umbrellas, and fireflies forming soft dotted paths. Style anchor: mid-century children’s book illustration meets contemporary layered paper diorama, visible cut-paper edges, soft shadows between layers, muted moss green, pumpkin orange, cream, and ink-blue palette. First glance: a cozy glowing market silhouette. Second glance: many small vendor stories. Third glance: handmade paper texture, tiny signage, and playful animal gestures. No photorealism, no 3D plastic look, no cluttered unreadable faces.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

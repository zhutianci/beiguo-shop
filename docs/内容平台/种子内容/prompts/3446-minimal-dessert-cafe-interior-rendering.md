---
title: "室内设计提示词：暖调极简甜品店效果图，白瓷砖吧台 + 木吊顶 + 发光招牌的商业空间（gpt-image-2）"
slug: minimal-dessert-cafe-interior-rendering
model: gpt-image-2
topics: [interior, photography]
aspectRatio: "3:2"
needsRefImage: false
useCase: "开店前想先看看\"装出来大概什么样\"：生成一张写实的甜品店 / 咖啡店室内效果图，从客座区看向吧台，狭长高挑的空间，米色墙面、灰色水泥地、原木吊顶和间接灯带，可以把店名换成自己的。"
prompt: |
  生成一张写实的建筑室内效果图：一家名为"[Some ice]"的现代甜品店。画幅 3:2。
  - 视角：广角，从客座区望向服务吧台，空间狭长、层高较高；
  - 风格与材质：[暖调极简的日式 / 北欧风]——米色艺术涂料墙面、灰色水泥地面、后墙是有肌理的灰色瓷砖，浅色原木的吊顶和层架，柔和的间接灯带；
  - 吧台区：画面右中是 1 个大的白色小方砖吧台，台面上 1 台一体机电脑；吧台上方 1 个悬挂的原木顶棚，嵌着射灯；吧台上方 1 块发光品牌招牌，深色字写店名，带一点黄色点缀；吧台后方 4 块发光的菜单灯箱；右侧墙面 2 层空的原木层板；最右侧 1 根灰色水泥立柱；
  - 客座区：共 5 张圆形小桌，搭配木椅和少量浅黄色、深灰色的单椅；吧台前有 1 张高脚凳和一段纤细的金属扶手；
  - 左墙：3 张甜品海报，上方 2 盏小壁灯；
  - 氛围：安静、干净、像刚装修好；柔和的暖色日光与人工照明混合，真实的阴影，材质精致，专业的商业空间表现图；不出现人物和真实品牌。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Sutao_farming/status/2063218028813443208
  author: "@Sutao_farming"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；店名、风格、主材与配色设为变量；把原文逐件列举的\"恰好 11 把椅子\"等过细数量合并为主要陈设的数量约束，保留吧台、招牌、菜单灯箱、海报和桌子的数量"
images:
  - 3446-minimal-dessert-cafe-interior-rendering-1.jpg
imageCredit:
  by: "@Sutao_farming"
  url: https://youmind.com/gpt-image-2-prompts?id=24493
  license: CC BY 4.0
verify:
  - "示例图店名为英文；换成中文店名时核对发光字是否清晰无错字"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：店名换成你的店名，英文或 2～4 个汉字的发光字最清晰；风格可换成"原木侘寂风""奶油法式风""工业风"，后面的材质也相应调整，例如工业风写"裸露的水泥墙、黑色钢架、做旧木材"。想看别的业态，把"甜品店"换成"咖啡店""面包房""茶饮店"，吧台后的菜单灯箱保留即可。

示例图：一间狭长的小店，左边是米色墙面和三张甜品海报，前景是几张圆桌和木椅；右侧是白色小方砖砌的吧台，上方悬着原木顶棚和射灯，吧台后是一排发光灯箱，上方的招牌写着"Some ice"；最右边一根粗糙的水泥柱，地面是灰色水泥，整体是暖黄色的间接照明。

**常见问题**：
- 空间比例失真、像玩具屋：加"真实尺度，层高约 4 米，人视角度"。
- 招牌文字出错：店名越短越好，出图后核对。
- 想改布局：直接写"吧台在左侧""增加一排靠窗的高脚吧台位"。

**适合**：开店前的风格参考、与设计师沟通的意向图、商业计划书配图、探店账号的概念封面。效果图不含真实尺寸与施工信息，落地以设计师图纸为准。

### 英文原版

```text
Create a photorealistic architectural interior rendering of a modern dessert cafe named {argument name="cafe name" default="Some ice"}. Show a wide-angle view from the customer seating area toward the service counter in a long, narrow, high-ceiling space. Use a warm minimalist Japanese/Scandinavian style with beige plaster walls, gray concrete floor, textured gray tile at the back wall, light wood ceilings and shelving, and soft indirect cove lighting. The main composition should include exactly 1 large white tiled service counter on the right-center, exactly 1 desktop computer on the counter, exactly 1 suspended wood canopy above the counter with recessed spotlights, exactly 1 gray vertical concrete column on the far right, exactly 1 backlit brand sign above the counter reading {argument name="cafe name" default="Some ice"} in dark letters with a small yellow accent, exactly 4 illuminated menu boards behind the counter, exactly 2 empty wood shelves on the right wall, exactly 3 wall posters on the left wall advertising desserts, exactly 5 round cafe tables visible, and exactly 11 visible chairs/stools: 4 wooden chairs around the two front-left tables, 4 wooden chairs in the middle corridor seating area, 1 tall stool at the counter, 1 pale yellow chair at the front-right table, and 1 dark charcoal chair at the right table. Add exactly 2 small wall-mounted spotlights above the left posters and exactly 2 slim vertical railing posts with a horizontal handrail in front of the counter. The cafe should feel quiet, clean, and newly designed, with soft warm daylight and artificial lighting, realistic shadows, polished materials, and a professional commercial interior visualization look. Avoid people, clutter, food closeups, watermarks, and extra signage.
```

> 改编自 [@Sutao_farming](https://x.com/Sutao_farming/status/2063218028813443208) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

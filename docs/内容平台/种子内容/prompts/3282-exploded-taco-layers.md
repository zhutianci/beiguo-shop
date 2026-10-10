---
title: 电商详情页提示词：塔可分层悬浮爆炸图，每层食材带细线标注（可换汉堡 / 三明治）
slug: exploded-taco-layers
model: nano-banana
topics: [food, ecommerce]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做餐饮菜单配料说明、外卖主图、新品上市海报时，把一份食物拆成从上到下垂直悬浮的各层食材，右侧用细引线写上每层名字，一眼看清"里面有什么"。
prompt: |
  一张超写实的垂直爆炸式信息图，主体是一份[牛肉塔可]，所有食材从上到下分层悬浮：
  香菜 → 青柠酸奶酱 → 墨西哥辣椒片 → 番茄洋葱丁 → 生菜丝 → 切达芝士 → 烤牛肉碎 → 玉米脆壳（换食物时整串替换）
  - 每一层都严格居中、间距均匀、上下对齐，最底层是完整的[玉米脆壳]；
  - 质感要真实：牛肉有烤焦纹理，芝士融化下垂，蔬菜新鲜带水光，酱料顺滑；
  - 背景是干净的[米白色]无缝影棚背景，柔和的商业布光，每层食材下方有轻微真实投影；
  - 右侧加简洁的[中文]文字标签，用细引线指向对应层，标签从上到下与各层食材名一一对应；
  - 微距美食摄影质感，高级快餐信息图风格，构图干净专业。
  画幅 1:1。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Strength04_X/status/2091192289385451787
  author: "@Strength04_X"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文含"成品摆盘照 + 分层爆炸图 + 视频旋转动作"三段，本站只保留与示例图对应的分层爆炸图部分并译成中文；食物、层次顺序、标签文字、背景色设为变量；删去 8K 等参数
images:
  - 3282-exploded-taco-layers-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://cms-assets.youmind.com/media/1787466537773_lhlib8_HQVoTC-a0AAbNyI.jpg
  license: CC BY 4.0
verify:
  - 原文写的是陶土橙背景，示例图实际是米白背景，本站改写按示例图写米白，可再试一次橙色背景对比
  - 示例图标签是英文版，换成中文标签实测一次，看引线是否仍对准各层
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[牛肉塔可] 换成任何"能拆层"的食物，例如"双层牛肉汉堡""鸡蛋火腿三明治""手抓饼"，同时把层次顺序和标签改成对应食材，例如汉堡写"芝麻面包 → 生菜 → 番茄 → 芝士 → 牛肉饼 → 底层面包"。[米白色] 可换成品牌色，如"暖橙色""墨绿色"。示例图是英文标签版：最上面一撮香菜，往下依次是淡绿色酱、辣椒圈、番茄洋葱丁、生菜丝、融化芝士、牛肉碎，最底是一只空的玉米脆壳，右侧 8 条细线对齐写着食材名。

**常见问题与调整**：
- 层次挤在一起或歪斜：加"每层之间空隙相同，所有层的中心在同一条竖线上"。
- 标签指错层：把标签数量和层数写成一样，并说明"标签从上到下与食材一一对应"。
- 想要成品对比：追问"在左侧再放一份组装好的完整成品，右侧保持爆炸图"。
- 底色太单调：改成"品牌色渐变背景，底部有柔和地面反光"。

**适合**：餐饮外卖主图、菜单配料说明、新品海报；用于商品宣传时，实物配料要与图片一致。

### 英文原版

```
A high-quality professional product photograph of three premium loaded beef tacos arranged neatly on a dark ceramic plate, centered against a warm terracotta-orange seamless studio background. Each taco features a crisp golden corn shell filled with juicy seasoned grilled beef, melted cheddar cheese, fresh shredded lettuce, diced tomatoes, purple onions, jalapeño slices, and creamy lime sauce. The beef has realistic grilled texture and subtle char marks, while the vegetables appear fresh and vibrant with natural moisture. Soft cinematic studio lighting creates rich highlights and subtle shadows beneath the plate. Ultra-sharp focus, DSLR macro food photography, premium Mexican fast-food advertisement style, hyper realistic, clean commercial composition, 8K. Aspect Ratio: 1:1 Create a hyper-realistic exploded vertical infographic composition of a premium loaded beef taco. Top → Bottom structure: Fresh Cilantro Garnish → Lime Crema → Jalapeño Slices → Diced Tomato & Onion → Shredded Lettuce → Melted Cheddar Cheese → Seasoned Grilled Beef → Crispy Corn Shell Every element must be perfectly centered, evenly spaced, and aligned vertically. Show realistic grilled beef texture, melted cheese, crisp vegetables, fresh herbs, creamy sauce, and a detailed crunchy corn shell. Use a warm terracotta-orange seamless studio background, soft commercial lighting, subtle realistic shadows beneath every floating element, ultra-sharp DSLR macro food photography, premium fast-food infographic aesthetic, clean professional composition, hyper realistic, 8K. Add clean minimalist infographic text labels with thin pointer lines using these exact labels: "Cilantro" "Lime Crema" "Jalapeños" "Tomato & Onion" "Lettuce" "Cheddar Cheese" "Grilled Beef" "Corn Shell" Aspect Ratio: 1:1 The tacos start to slowly spin while the ingredients separate gently and precisely, maintaining alignment and scale. The motion is smooth, appetizing, and controlled with no extra effects.
```

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2091192289385451787) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

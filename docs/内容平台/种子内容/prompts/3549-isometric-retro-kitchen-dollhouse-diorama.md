---
title: "室内设计提示词：等轴测复古小厨房 3D 微缩模型，奶油色冰箱 + 木橱柜的娃娃屋（gpt-image-2）"
slug: isometric-retro-kitchen-dollhouse-diorama
model: gpt-image-2
topics: [interior, figurine, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一个像手工娃娃屋一样的等轴测厨房小景：只有两面墙和一块地板的\"房间切角\"，复古圆角冰箱、木橱柜、铺格子桌布的小餐桌一应俱全。适合做家居账号的封面、软装灵感图、游戏和绘本里的房间设定。"
prompt: |
  请做一个等轴测视角的 3D 微缩小屋，主题是一间温馨的[美式复古厨房]的一角；它要像手工拼出来的娃娃屋，细节很多，带 Blender 渲染那种柔和的全局光。
  - 结构：敞开的立方体房间切角——两面贴着[奶油色小碎花壁纸]的墙在角落相接，下面是一块抬高的方形瓷砖地台；墙顶和腰线位置是[暖棕色木饰条]。
  - 镜头与背景：正交相机，四分之三俯视角；背景是暖米色的无缝影棚底。
  - 风格：怀旧、可爱、略带玩具感——圆角、抛光的木头、真实的材质和干净的微缩比例。
  - 家具与设备（恰好 12 件主要物件）：左侧一台奶油色的复古圆角冰箱，门上有小小的字样"[NORD]"和几枚彩色冰箱贴；旁边是薄荷绿的燃气灶和一只带盖汤锅；沿右墙是一排带台面的木地柜，中间嵌着不锈钢水槽和龙头；墙上两个开放式木吊柜，摆着调料罐和盘子；一扇带格子的木窗，挂着条纹窗帘；两盏粉色灯罩的黄铜壁灯；一幅小装饰画；中间一张铺着格子桌布的小方桌，配三把木椅，桌上有茶壶、茶杯和一只小花瓶；台面上还有面包篮、砧板和插着厨具的筒。
  - 整体光线明亮柔和、影子很淡；屋里没有人；除了冰箱上那几个字母，别处都不要文字，也不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/berryxia/status/2096158415894835518
  author: "@berryxia"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；房间类型、风格、墙面与木色、冰箱品牌字样改为变量；原文逐件列举的 12 件家具合并为按区域描述，保留\"恰好 12 件主要家具与设备\"的约束"
images:
  - 3549-isometric-retro-kitchen-dollhouse-diorama-1.jpg
imageCredit:
  by: "@berryxia"
  url: https://youmind.com/gpt-image-2-prompts?id=33652
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[美式复古厨房] 可换成"日式小卧室""北欧风书房""法式面包店的操作间"，下面的家具清单按房间类型改写，数量保持在 10～12 件，太多会挤；壁纸和木色决定整体色调，例如"浅蓝色条纹壁纸 + 白色木饰条"会更清爽；[NORD] 是冰箱上的虚构品牌字样，可以改成你的店名缩写或删掉。

示例图是暖米色背景上的一个房间切角：两面碎花壁纸的墙、白色方砖地面；左边立着一台奶油色的圆角冰箱，旁边是薄荷绿的炉灶；右墙是一排木橱柜和水槽，上方有两个木吊柜和一扇挂着条纹窗帘的窗；中间一张铺绿格桌布的小餐桌，三把木椅，桌上有茶壶和花瓶。

**常见问题**：
- 透视变成普通的室内照：强调"正交投影、等轴测、能看到房间的外轮廓和地台厚度"。
- 家具比例不协调：写"所有物件为同一微缩比例，约为 1:12 娃娃屋尺寸"。
- 画面太空或太满：按"左侧高柜 / 沿墙矮柜 / 中央桌椅"三块来增减物件。

**适合**：家居与手作账号封面、软装配色灵感、游戏场景和绘本的房间设定。

### 英文原版

```text
Create a highly detailed isometric 3D miniature diorama of a cozy American-style kitchen corner, like a handcrafted dollhouse scene rendered in Blender with soft global illumination. The room is an open cube set with two cream wallpapered walls meeting in a corner, a raised square tiled floor base, and warm medium-brown wood trim along the top and chair-rail height. Use a warm beige studio background and orthographic camera at a 3/4 overhead angle. The kitchen style is nostalgic, cute, and slightly toy-like with rounded edges, polished wood, realistic materials, and clean miniature proportions. Include exactly 12 main furniture and fixture elements: 1 cream retro refrigerator on the left with the word {argument name="refrigerator label" default="NORD"}, small colorful round magnets and brass handles; 1 mint-green gas stove with black burners and a lidded pot; 1 long wooden lower cabinet run on the right with drawers, paneled cupboard doors, brass knobs, and a sink; 1 double window above the sink with beige tied curtains on a silver rod; 2 wall-mounted wooden box shelves, one above the stove and one to the right of the window, containing books and white jars; 1 square dining table in the center covered with a white-and-green checkered tablecloth; 3 wooden chairs around the table; 1 small framed picture on the left wall; and 1 pair of brass wall lamps with round shades and pastel pink globe accents. Add exactly 10 visible tabletop or counter accessories: 1 tray with bread loaves, 1 wooden cutting board, 1 small green bottle, 1 utensil cup with wooden spoons, 1 soap pump bottle, 1 blue teapot or kettle on the dining table, 1 glass dessert cloche with red-topped sweets, 1 small cup and saucer, 1 tiny plate with food, and 1 small rectangular sponge near the sink. Materials should include glossy cream enamel, mint painted metal, varnished wood grain, semi-transparent glass, soft fabric curtains, ceramic tiles, and brushed metal. Lighting should be warm and soft, with gentle shadows and ambient occlusion, emphasizing the miniature scale and fine details. Color palette: {argument name="wood tone" default="warm medium brown"}, cream, mint green, beige, pale pink, muted green, brass, and soft gray tile. No people, no watermark, no modern appliances beyond the retro fridge and stove, no clutter outside the cube room.
```

> 改编自 [@berryxia](https://x.com/berryxia/status/2096158415894835518) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

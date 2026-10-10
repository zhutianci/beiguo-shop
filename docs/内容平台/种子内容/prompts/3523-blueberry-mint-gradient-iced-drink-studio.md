---
title: "ai美食图提示词：蓝莓薄荷渐变冰饮棚拍，水珠玻璃杯 + 深色背景的饮品海报（Nano Banana）"
slug: blueberry-mint-gradient-iced-drink-studio
model: nano-banana
topics: [food, ecommerce, photography]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "给奶茶店、咖啡店的特调冰饮做一张菜单主图或新品海报：高高的刻面玻璃杯里是由深到浅的渐变饮料，大冰块、水果和薄荷清晰可见，杯壁挂满水珠，深色背景衬得颜色很亮。"
prompt: |
  请拍一张饮品店新品海报级别的商业照片，超写实，竖版 2:3。
  - 杯子：一只高高的透明刻面玻璃杯，装满[蓝莓薄荷气泡饮]，位于画面中央。
  - 液体：鲜亮的渐变色——[杯底是深蓝色，向上逐渐变浅直到透明]，里面有细小的气泡。
  - 冰块：大块的晶莹冰块填满整杯，棱角清楚。
  - 点缀：杯里和杯口有[新鲜薄荷叶]，饮料里浮着整颗的[蓝莓]，杯脚周围也散放着几颗蓝莓和几片薄荷叶；一根浅色的木质吸管斜插在杯中。
  - 效果：杯口升起一缕淡淡的冷雾；杯壁挂满冷凝的水珠；杯子周围的台面上有零星的水滴和轻微的飞溅。
  - 台面与背景：深色的湿润反光台面，映出杯子的倒影；背景是[深蓝近黑]的渐变，略带雾感。
  - 光线：侧逆光把液体和冰块打透，杯壁边缘有清晰的轮廓光；高反差，颜色饱满。
  - 机位比杯口略低、接近平视，景深要浅，对焦在杯身上；画面里不出现文字、标志或水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/john_my07/status/2021800373007372290
  author: "@john_my07"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；饮品口味、液体渐变色、水果与香草、背景色改为变量；合并了重复的质感与镜头条目"
images:
  - 3523-blueberry-mint-gradient-iced-drink-studio-1.jpg
imageCredit:
  by: "@john_my07"
  url: https://youmind.com/nano-banana-pro-prompts?id=9932
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先定口味，再定渐变色和点缀：例如"西柚迷迭香冷萃"配"杯底橙红、向上变成琥珀色"、"迷迭香枝"和"西柚片"；"抹茶椰奶"配"下绿上白的分层"、"椰子片"。背景色选饮料颜色的同色系深色，颜色最显亮；想要清爽的日系感，把背景换成"浅灰白色"，并把"高反差"改成"柔和明亮"。

示例图是一只带竖向刻面的玻璃杯，杯底是浓郁的深蓝，往上渐渐变浅；杯里是大块透明的冰和几颗蓝莓，杯口堆着薄荷叶和蓝莓，插着一根木吸管，上方飘着一点冷雾；杯壁全是水珠，黑色的湿台面上散着蓝莓、薄荷叶和水滴，背景是深蓝色。

**常见问题**：
- 渐变变成均匀的一种颜色：把"渐变"写成"明显的上下两段颜色，中间自然过渡"。
- 冰块浑浊：强调"透明无气泡的手凿冰"。
- 水珠太假：写"水珠大小不一，有的正在往下滑"。

**适合**：饮品店菜单和新品海报、外卖平台主图；实物与图片差异较大时，注意标注"图片仅供参考"。

### 英文原版

```text
{
  "meta": {
    "title": "Blueberry Mint Iced Drink – Premium Studio Shot",
    "version": "1.0",
    "type": "text-to-image",
    "style": "Ultra-realistic beverage photography"
  },
  "scene": {
    "subject": "Tall clear highball glass filled with blue blueberry mint soda",
    "glass": "Transparent faceted glass with condensation droplets",
    "liquid": "Vibrant gradient blue drink (deep blue at bottom fading to clear at top)",
    "ice": "Large crystal-clear ice cubes filling the glass",
    "garnish": [
      "Fresh mint leaves inside and on top",
      "Whole blueberries inside the drink",
      "Blueberries resting around the base",
      "Light wooden straw angled inside the glass"
    ],
    "effects": [
      "Soft misty vapor rising from the top",
      "Tiny bubbles in liquid",
      "Water droplets on glass surface",
      "Slight splash texture at bottom surface"
    ]
  },
  "environment": {
    "background": "Dark navy to black gradient backdrop",
    "surface": "Glossy black reflective surface with scattered blueberries and mint leaves",
    "atmosphere": "Moody, cinematic, high contrast"
  },
  "lighting": {
    "type": "Professional studio lighting",
    "setup": [
      "Soft diffused key light from left",
      "Cool rim light from right to enhance glass edges",
      "Subtle backlight for vapor visibility"
    ],
    "highlights": "Sharp reflections on ice and glass",
    "shadows": "Deep, dramatic shadows"
  },
  "camera": {
    "angle": "Eye-level close-up",
    "lens": "85mm macro lens",
    "aperture": "f/2.8",
    "depth_of_field": "Shallow depth of field, blurred background berries",
    "resolution": "8K ultra-detailed",
    "focus": "Sharp focus on glass center and mint leaves"
  },
  "quality_tags": [
    "hyper-realistic",
    "photorealistic",
    "commercial beverage photography",
    "crisp details",
    "cinematic",
    "high dynamic range",
    "editorial drink advertisement style"
  ]
}
```

> 改编自 [@john_my07](https://x.com/john_my07/status/2021800373007372290) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

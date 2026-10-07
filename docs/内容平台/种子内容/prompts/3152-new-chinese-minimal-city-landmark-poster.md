---
title: "城市海报提示词：新中式极简城市地标海报（几何化地标 + 祥云水纹，广州示例）（gpt-image-2）"
slug: new-chinese-minimal-city-landmark-poster
model: gpt-image-2
topics: [poster]
aspectRatio: "9:16"
needsRefImage: false
useCase: "生成一张新中式极简风的城市海报：中央是几何抽象化的城市地标，江河水系化成流动的祥云水纹 S 形环绕画面，大面积留白和宣纸质感，中国红、蔚蓝和金色，适合城市宣传、品牌城市限定海报和文创。"
prompt: |
  新中式极简风格的高端城市海报，[9:16] 竖版，以[广州]为核心主题。
  画面中央是一座抽象几何化的[广州塔]，简洁但一眼可辨。整体是自下而上延伸的 S 形流动构图：[珠江]水系被设计成流动的水波纹，融合传统祥云纹样，环绕整个画面，形成视觉动线。
  其他地标用"留白 + 线描 + 局部色块"的方式点缀。
  风格：极简 + 高级 + 东方意境。
  配色：以[中国红、蔚蓝和金色]为主，少量暖金高光点缀。
  背景：大面积纯白留白或淡淡的宣纸质感。
  整体风格：国潮高端插画 / 品牌海报品质，8K，细节超清。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/liyue_ai/status/2045744531686166878
  author: "李岳"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；画幅、城市、配色改为变量，并补充其他城市的地标示例"
images:
  - 3152-new-chinese-minimal-city-landmark-poster-1.jpg
imageCredit:
  by: "李岳"
  url: https://youmind.com/gpt-image-2-prompts?id=13486
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：城市、主地标和河流三处一起换，例如"[杭州]／[雷峰塔]／[钱塘江]""[重庆]／[解放碑]／[嘉陵江]""[西安]／[大雁塔]／[护城河]"；配色可以换成城市气质对应的颜色（杭州用"青绿、黛蓝、浅金"）。也可以加一句"左上角竖排写'XX·千年商都'"。

示例图是白底竖版海报：中央一座红色几何化的广州塔，后面一轮红日，下方蓝绿与金色的祥云水纹 S 形蜿蜒而上，两侧用线描和色块点缀着骑楼、大桥和远山，左上角竖排红色"广州"和几行小字。

**常见问题**：
- 地标太写实：强调"几何抽象化、线条简洁"。
- 留白不够：写"画面至少一半是白色"。
- 小字乱码：竖排小字控制在 2 行，或者后期再排。

**适合**：城市宣传海报、品牌城市限定款、文创周边、公众号头图。

### 原版提示词

```text
New Chinese minimalist style high-end city poster, {argument name="aspect ratio" default="9:16"} vertical composition, with {argument name="city" default="Guangzhou"} as the core theme. The center of the screen is an abstract geometric version of the Canton Tower, simple but recognizable. The overall S-shaped flow composition extends from the bottom upwards. The Pearl River water system is designed as flowing water ripples integrated with traditional auspicious cloud patterns, surrounding the entire screen to form a visual movement line. Landmarks are dotted using 'white space + line drawing + local color blocks'. Style: Minimalist + Advanced + Oriental mood. Color scheme: {argument name="color scheme" default="Chinese red, azure blue, and gold"} as the main colors, supplemented by a small amount of warm gold highlights. Background: Large area of pure white space or light rice paper texture. Overall style: National tide high-end illustration / Brand poster quality / 8K / Ultra-clear details.
```

> 改编自 [李岳](https://x.com/liyue_ai/status/2045744531686166878) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

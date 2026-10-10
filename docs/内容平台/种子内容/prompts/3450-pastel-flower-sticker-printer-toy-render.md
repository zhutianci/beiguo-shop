---
title: "ai产品图提示词：马卡龙色花朵贴纸打印机玩具 3D 概念渲染图（gpt-image-2）"
slug: pastel-flower-sticker-printer-toy-render
model: gpt-image-2
topics: [ecommerce, game-art]
aspectRatio: "2:3"
needsRefImage: false
useCase: "做玩具、文创小家电的外观提案或游戏道具概念图时用：一台胶囊形的花朵主题贴纸打印机玩具，奶油白机身配青柠绿底座，正面吐出一条印着三朵小花的贴纸带，淡紫色纯色背景。"
prompt: |
  生成一张精致的 3D 概念设计产品渲染图：一台可爱的[贴纸印章打印机玩具]，外形是圆润的竖向胶囊，居中放在柔和的[淡紫色]纯色背景上。
  - 机身：上半部分是奶油白，下半部分的底座是明亮的[青柠绿]；光亮的注塑塑料质感，圆润倒角，柔和的影棚光，底部有淡淡的接触阴影；
  - 顶部：一个大大的圆形[粉色]按钮，上面浮雕一朵简单的五瓣花和凸起的圆形花心；
  - 中部：一个黄色波浪边旋钮，白色圆形表盘上是[紫色郁金香]图标配两片绿叶，旋钮正上方有一个橙色小三角指针；旋钮四周恰好 4 个小花图标——左上粉色、右上蓝色、左下发光的黄色、右下紫色，旁边有装饰性的小圆点指示灯，靠近底部两角各有一对绿叶形按钮；
  - 出纸口：正面底部是一道横向出纸槽，带绿色齿纹滚轴边，吐出一条圆角的奶油色纸带；纸带上竖着排列恰好 3 枚印好的花朵贴纸：上粉、中紫、下蓝，都是黄色花心，带绿叶和花茎；
  - 整体感觉：充满童趣的玩具设计稿，马卡龙色系，正对镜头的平视机位，塑料表面光滑、细节丰富，也能当游戏道具概念图用；
  - 画面里不出现任何字、商标、水印、人手和额外的小配件。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/oasiverse_stu/status/2072762484855808197
  author: "@oasiverse_stu"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；产品类型、背景色、底座色、按钮色、旋钮图标改为变量；删去原文末尾重复列举的可定制项"
images:
  - 3450-pastel-flower-sticker-printer-toy-render-1.jpg
imageCredit:
  by: "@oasiverse_stu"
  url: https://youmind.com/gpt-image-2-prompts?id=27504
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[贴纸印章打印机玩具] 是产品类型，可以换成"迷你拍立得玩具""儿童收音机""扭蛋机"；三个颜色变量决定整体配色，例如"薄荷绿背景 + 天蓝底座 + 鹅黄按钮"；[紫色郁金香] 是旋钮中央的图标，换主题时把花朵相关的描述整体替换，比如换成"星星 / 月亮 / 云朵"的星空主题，或"草莓 / 樱桃 / 橙子"的水果主题，纸带上的三枚贴纸也跟着改。

示例图是一张竖版渲染：淡紫色背景正中立着一台胶囊形小机器，顶部是浮雕五瓣花的粉色大按钮，中间黄色波浪旋钮里有一朵紫色郁金香，四角是粉、蓝、黄、紫四朵小花，绿色底座的出纸口吐出一条纸带，上面从上到下印着粉、紫、蓝三朵带叶子的小花。画面没有任何文字。

**常见问题**：
- 机身上冒出乱码小字：保留"不要文字、Logo"，并补一句"按钮和面板上只有图标"。
- 想要多角度：追加"同一产品的正面、侧面、45 度三视图，并排放置"。

**适合**：玩具与文创产品外观提案、游戏道具概念图、手账周边灵感；只是概念图，不能直接当作可量产的结构设计。

### 英文原版

```text
Create a polished 3D concept-art product render of a cute toy sticker-stamp printer shaped like a rounded vertical capsule, centered on a soft pastel lavender background. The toy has a cream upper body and bright lime-green lower base, with glossy molded plastic, rounded bevels, soft studio lighting, and subtle contact shadow. At the top is one large circular pink push button embossed with a simple five-petal flower and a raised circular center. In the middle is one yellow scalloped rotary dial with a white circular face showing a purple tulip icon with two green leaves, and a small orange triangular pointer above it. Around the dial are exactly four small flower icons: pink flower at upper left, blue flower at upper right, glowing yellow flower at lower left, and purple flower at lower right, plus small decorative dot indicators and two pairs of green leaf buttons near the bottom corners. At the front bottom is a horizontal sticker slot with a green ridged roller edge, feeding out one cream paper strip with rounded corners. The strip shows exactly three printed flower stickers stacked vertically: pink flower with yellow center at top, purple flower with yellow center in the middle, and blue flower with yellow center at bottom, each with green leaves and stem. Use a playful toy-study aesthetic for {argument name="product type" default="sticker-stamp toy"}, pastel palette with {argument name="background color" default="lavender"}, cream plastic body, {argument name="base color" default="lime green"}, {argument name="top button color" default="pink"}, and {argument name="dial icon" default="purple tulip"}. No text, no logo, no watermark, no hands, no extra accessories, front-facing view, high-detail smooth plastic render suitable for game concept art.
```

> 改编自 [@oasiverse_stu](https://x.com/oasiverse_stu/status/2072762484855808197) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

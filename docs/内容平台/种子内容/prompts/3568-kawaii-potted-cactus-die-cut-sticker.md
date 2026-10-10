---
title: "ai贴纸设计提示词：软萌盆栽仙人掌单枚贴纸，粗描边 + 白色切边的 Q 版吉祥物（gpt-image-2）"
slug: kawaii-potted-cactus-die-cut-sticker
model: gpt-image-2
topics: [sticker, illustration, logo]
aspectRatio: "4:5"
needsRefImage: false
useCase: "生成一枚可以单独使用的 Q 版贴纸：一个带笑脸的小盆栽，粗粗的深色描边外面再包一圈白色切边，颜色鲜亮、带高光。适合做手账贴纸、店铺小吉祥物、聊天表情的单张素材。"
prompt: |
  画一枚可爱的 Q 版贴纸风插画：一个带笑脸的盆栽[仙人掌]小吉祥物，居中构图，画幅 4:5。
  - 主体：亮[嫩绿色]的仙人掌，表面有光泽，带竖向的棱；中间是一个圆滚滚的大身体，左右两侧各有恰好 1 只向上弯起的小手臂。
  - 表情：恰好 2 只带白色高光的黑色椭圆大眼睛，2 团粉色的圆腮红，张开的大笑嘴，嘴里是红色，露出粉色的小舌头。
  - 细节：身体和手臂上散布许多奶油色的星芒状小刺，刺的根部是橙色，要画得可爱而不尖锐；头顶左上方开着恰好 1 朵大花——[珊瑚红]的花瓣、黄色的圆花蕊、深绿色描边。
  - 花盆：恰好 1 只[赤陶色的花盆]，暖橙色，有较深的阴影和亮亮的高光，盆沿厚而圆，盆口能看到棕色的小石子和泥土。
  - 贴纸感：所有主要形状都用粗的深绿近黑色描边，整个角色外面再包一圈厚而柔和的白色贴纸切边。
  - 画风：精致的矢量感数字插画，柔和的渐变、亮闪闪的高光、高饱和度、圆润的造型。
  - 背景：[纯白色背景]，方便抠图；不要文字和水印，是一枚可直接用于网页或贴纸的独立素材。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/koguGameDev/status/2090632136424591837
  author: "@koguGameDev"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；植物、主体颜色、花的颜色、花盆、背景改为变量；原文默认\"透明棋盘格预览\"背景，这里改为默认纯白背景，并在说明里解释示例图的棋盘格"
images:
  - 3568-kawaii-potted-cactus-die-cut-sticker-1.jpg
imageCredit:
  by: "@koguGameDev"
  url: https://youmind.com/gpt-image-2-prompts?id=32141
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[仙人掌] 换成"多肉""小番茄苗""蘑菇"都行，后面的"棱、小刺"等描述也要相应改掉；[嫩绿色] 和 [珊瑚红] 是主体和花的颜色；花盆可换"蓝白条纹的陶瓷盆""小木桶"；背景想直接得到可抠的图，就保持纯白或写"纯绿色背景"，不要写"透明背景"。

示例图是一棵圆滚滚的绿色仙人掌，举着两只小手臂，黑亮的大眼睛、粉腮红和张开的笑嘴，身上是一颗颗奶油色的小星刺，头顶一朵红色的花，栽在橙色的陶盆里；外面有一圈白色切边。原作者要求的是"透明棋盘格预览"，所以示例图的背景是画出来的灰白棋盘格，并不是真正的透明。

**常见问题**：
- 背景出现假的棋盘格：模型不会输出真正的透明通道时就会这样，改用纯色背景后再抠图。
- 白色切边太细或缺失：强调"白色切边宽度约为描边的三倍，四周连续不断"。
- 手臂或眼睛数量不对：保留"恰好 2 只""恰好 1 朵"这类写法。

**适合**：手账与包装贴纸、花店和咖啡店的小吉祥物、表情包的单张素材。

### 英文原版

```text
Create a cute kawaii sticker-style illustration of a smiling potted cactus mascot on a transparent background, shown over a faint gray checkerboard transparency preview. The cactus is bright {argument name="cactus color" default="lime green"}, glossy, and vertically ribbed, with a large rounded central body and exactly 2 raised curved arms, one on each side. Give it a happy face with exactly 2 big black oval eyes with white highlights, 2 pink circular blush cheeks, and a wide open smiling mouth with a red interior and pink tongue. Add many small cream-colored starburst cactus spines with orange bases across the body and arms, keeping them cute rather than sharp. Place exactly 1 large flower on the upper left of the cactus head: {argument name="flower color" default="coral red"} petals, yellow round stamens, and a dark green outline. Put the cactus in exactly 1 terracotta flower pot, warm orange with darker shading, glossy highlights, a thick rounded rim, and visible brown pebbles/soil along the top. Use a bold dark green/black outline around all major shapes plus a thick soft white sticker border around the entire character. Style should be polished vector-like digital art with soft gradients, shiny highlights, high saturation, rounded forms, centered composition, no text, no watermark, isolated asset suitable for web or sticker use. {argument name="background" default="transparent checkerboard preview"}
```

> 改编自 [@koguGameDev](https://x.com/koguGameDev/status/2090632136424591837) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

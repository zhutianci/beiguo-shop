---
title: "ai头像生成提示词：马卡龙色低多边形 3D 角色，三角面拼出的可爱人物（Nano Banana）"
slug: pastel-low-poly-character-avatar-art
model: nano-banana
topics: [illustration, wallpaper, character]
modelLabel: Nano Banana Pro
aspectRatio: "5:4"
needsRefImage: false
useCase: "生成一张由三角面拼成的低多边形风格角色图：马卡龙配色、干净的切面和柔和的光，人物居中，背景是同风格的几何云朵和水晶。适合做头像、频道封面或桌面壁纸。"
prompt: |
  生成一张几何低多边形 3D 艺术风格的角色插画，整个画面都由三角形和多边形切面拼成。
  - 角色：[戴大耳机的齐耳短发女孩]，[双手竖起大拇指]，半身像，位于画面正中，面向镜头，大眼睛、开心的笑容；头发、脸、衣服和手都由清晰的三角切面构成，切面之间有细细的浅色棱线。
  - 配色：[薄荷绿、淡紫和奶油粉]的柔和马卡龙色调，明度接近、对比温和。
  - 背景：[漂浮着水晶、小星星和圆球的梦幻星球表面]，同样用低多边形画法；远处是几何切面的云朵和山丘，点缀几颗发着微光的小星星。
  - 画法：线条干净，像矢量图一样利落；切面内是平滑的过渡，光线柔和，没有强烈阴影；现代极简的壁纸审美，高分辨率。
  - 构图：人物居中，四周留出背景；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/sociai_socy/status/2046428833310777383
  author: "@sociai_socy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；原文只有几个风格关键词，按示例图补充了角色造型、姿势、背景元素、配色和构图；角色描述保留为变量，新增动作、配色和背景三个变量"
images:
  - 3498-pastel-low-poly-character-avatar-art-1.jpg
imageCredit:
  by: "@sociai_socy"
  url: https://youmind.com/nano-banana-pro-prompts?id=14295
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：角色和动作分开写，例如"戴飞行员护目镜的小狐狸"配"单手敬礼"、"卷发男孩"配"抱着吉他"，动作越简单，切面越干净；配色写三种相近明度的浅色；背景一栏可以换成"几何切面的森林""低多边形的城市天际线"。想要更强的头像感，把"半身像"改成"头像特写"。

示例图里是一位薄荷绿短发的女孩，戴着粉绿相间的大耳机，穿浅绿色连体服，双手在胸前竖起大拇指，蓝色的大眼睛和张开的笑容；整个人和背景都由三角面拼成，背景是淡紫色的天空、奶油色和粉色的几何云团、几簇水晶和零星的小星星。

**常见问题**：
- 脸部切面太碎显得奇怪：加"脸部用较大的平滑切面，五官保持清晰可爱"。
- 变成普通的光滑 3D 卡通：强调"能清楚看到每一块三角面和棱线"。
- 颜色太鲜艳：写"低饱和、粉彩色调"。

**适合**：社交头像、直播间和频道封面、桌面壁纸；也可以把角色换成吉祥物做品牌插画。

### 英文原版

```text
geometric low-poly 3D art style made of triangles,
clean vector-like lines,
soft pastel color palette,
modern minimalist wallpaper aesthetic,
high resolution,
soft lighting,
smooth shading,
{argument name="character description" default="cute and charming character"},
centered composition
```

> 改编自 [@sociai_socy](https://x.com/sociai_socy/status/2046428833310777383) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

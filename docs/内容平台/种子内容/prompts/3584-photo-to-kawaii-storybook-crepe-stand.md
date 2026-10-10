---
title: "ai绘本生成提示词：孩子照片变萌系绘本插画，可丽饼小摊背景（gpt-image-2）"
slug: photo-to-kawaii-storybook-crepe-stand
model: gpt-image-2
topics: [illustration, photo-edit]
aspectRatio: "3:4"
needsRefImage: true
useCase: "把一张孩子吃东西、逛街的日常照片改画成色彩鲜亮的童书插画：圆脸红腮的小人站在卡通小摊前，周围飘着花朵、爱心和涂鸦，适合做成长相册内页、生日贺卡或装饰画。"
prompt: |
  请照着我上传的这张照片，重新画一幅童趣十足的萌系儿童绘本插画，竖幅 3:4。
  - 主角：照片里的[小女孩]，发型和衣服颜色跟照片一致；五官画得圆圆软软，大眼睛里有亮亮的高光，两颊红扑扑，歪着一点头，得意地举起手里的[巧克力冰淇淋可丽饼]；
  - 背景替换：把照片里真实的店铺换成一个卡通[可丽饼小摊]——彩色菱形格瓷砖的柜台、粉彩色的收银机、一块手写菜单黑板，黑板上写[可丽饼 香甜 好吃 开心]；
  - 装饰：画面四周飘着花朵、爱心、星星、弯弯的涂鸦线和小亮点；
  - 配色：明快的黄、粉、青绿、橙、紫和白；
  - 画法：扁平插画结合现代童书风格，轮廓干净，阴影平滑，带一点手绘颜料的肌理，有贴纸般的可爱感；
  - 光线与氛围：柔和明亮，温暖、健康、让人看了开心，绘本海报级的完成度；
  - 不要写实照片感，不要水印，不出现任何真实店铺招牌或品牌标识。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Taaruk_/status/2067892989893185717
  author: "@Taaruk_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；人物、手里的食物、小摊类型、菜单板文字设为变量；菜单板的英文示例文案改为中文；删去泛泛的风格堆词"
images:
  - 3584-photo-to-kawaii-storybook-crepe-stand-1.jpg
imageCredit:
  by: "@Taaruk_"
  url: https://youmind.com/gpt-image-2-prompts?id=26217
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张主角清楚、手里拿着东西的照片。[小女孩] 换成照片里的人物，如"小男孩""一对姐弟"；[巧克力冰淇淋可丽饼] 换成手里实际拿的东西，如"棉花糖""草莓蛋糕"；[可丽饼小摊] 跟着换成"棉花糖小车""蛋糕店柜台"；[可丽饼 香甜 好吃 开心] 是菜单板上的字，建议 4 个短词以内，每个词不超过 3 个字。

示例图是一张扁平童书风插画：棕色卷发、圆脸红腮的小女孩穿着黄色小花裙，举着一个装着巧克力冰淇淋的可丽饼；身后是彩色菱形格的柜台、紫色收银机和一块小黑板，周围散落着粉色和青绿色的花朵、爱心和涂鸦。示例图黑板上写的是英文菜单词。

**常见问题**：
- 画出来不像自家孩子：这种画风本来就是高度概括的，想更像就加"保留发型、发色、衣服图案和手持物"。
- 黑板中文写错：把文字减到两个词，或改成"黑板上只画爱心和星星"。
- 背景还留着真实店铺：加"背景完全重画为卡通场景，不保留照片里的任何实景"。

**适合**：成长相册、生日贺卡、儿童房装饰画。建议只用自己孩子的照片，公开发布时留意不要带出姓名、学校等信息。

### 英文原版

```text
Transform the uploaded photo into a cute whimsical children's storybook illustration, adorable kawaii {argument name="character" default="little girl"} holding a {argument name="snack" default="chocolate ice cream crepe"}, big sparkling eyes, rosy cheeks, soft rounded facial features, {argument name="background" default="colorful candy-shop background"}.

Replace the real café with a charming cartoon crepe stand featuring colorful diamond-pattern tiles, pastel cash register, handwritten menu board reading “CREPES • SWEET • YUMMY • HAPPY”, flowers, hearts, stars, doodles, sparkles, playful decorative elements floating around the scene.

Bright cheerful color palette with yellow, pink, teal, orange, purple, and white tones. Flat illustration style mixed with modern children's book art, clean outlines, smooth shading, hand-painted textures, cute floral decorations, cozy happy atmosphere, sticker-like aesthetic.

The girl wears a bright yellow dress with tiny floral patterns, holding the crepe proudly, head slightly tilted, joyful expression, surrounded by whimsical doodles and positive vibes. Soft lighting, high detail, charming composition, storybook poster quality, Pinterest aesthetic, wholesome and heartwarming mood.

Style inspired by modern kawaii illustration, children's picture books, stationery art, cute café branding, colorful vector-art look, ultra clean, professional illustration, masterpiece, highly detailed, vibrant colors, 4K.
```

> 改编自 [@Taaruk_](https://x.com/Taaruk_/status/2067892989893185717) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

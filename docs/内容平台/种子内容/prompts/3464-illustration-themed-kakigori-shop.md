---
title: "ai美食图提示词：把插画角色变成主题刨冰店，甜品+菜单牌+店铺（gpt-image-2）"
slug: illustration-themed-kakigori-shop
model: gpt-image-2
topics: [food, illustration]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张原创角色插画，生成一张\"角色主题甜品店\"的广告图：按角色的配色和世界观设计一份写实刨冰，旁边立着带口味名和配料的说明牌，角色坐在甜品旁。适合角色应援图和主题咖啡馆企划。"
prompt: |
  根据我上传的插画，设计一份写实的高级日式[刨冰]甜品，并把整家店的世界观一起做出来。
  - 甜品的造型、口味、碗的形状、糖浆颜色、配料和装饰，都要从上传插画的氛围、配色、光线、服饰、符号和角色设定里自然延伸出来，不要做成一碗普通的[刨冰]，也不要套用通用的咖啡馆模板；
  - 店铺的室内陈设、家具和装饰同样跟随插画的世界观：和风奇幻或巫女题材可以用漆碗、樱花糖浆、竹编、祭典挂饰、纸灯笼和木质室内；未来科幻题材可以用全息冰晶、霓虹分层糖浆、发光方块、透明碗和金属质感室内；可爱的粉彩插画可以用蓬松的冰、闪亮奶油、糖果丝带和童话感店面；
  - 给这份甜品起一个原创的口味名，并在甜品旁立一块精致的说明牌：上面有店铺徽记、口味名、一小段介绍和 5～7 行配料清单，文字用[简体中文]，清晰可读，字体与插画的世界观相配；店名是虚构的，不要出现真实品牌；
  - 如果上传的插画里有角色，让同一个角色[坐在甜品旁托腮微笑]，保持原来的脸、发型、服装风格、配色、比例和气质不变；
  - 画面：甜品在前景占主体，超精细的写实美食摄影质感，电影感布光，高级日式咖啡馆广告的氛围，竖版[3:4]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ashiwata100/status/2055864360044761378
  author: "@ashiwata100"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；甜品种类、角色姿势、说明牌语言、画幅改为变量；说明牌由日文改为默认简体中文；按示例图补充了\"说明牌含店铺徽记、介绍和 5～7 行配料\"\"店名虚构、不出现真实品牌\"的约束；三类题材示例保留为正文说明。"
images:
  - 3464-illustration-themed-kakigori-shop-1.jpg
imageCredit:
  by: "@ashiwata100"
  url: https://youmind.com/gpt-image-2-prompts?id=21080
  license: CC BY 4.0
verify:
  - "示例图中的金发角色是原作者上传的插画角色，请确认不是已有作品的角色"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张自己的原创角色插画（最好能看清服装和配色）。[刨冰] 可以换成"芭菲""可丽饼""奶油苏打"等别的甜品；[坐在甜品旁托腮微笑] 换成"用勺子舀起一口""双手捧着碗"；说明牌语言默认 [简体中文]，想要日式咖啡馆广告的味道可以改成"日文"。

示例图是原作者用一张金发蓝眼、身穿金肩章蓝白礼服的角色插画生成的：角色托腮坐在后方，前景是一只深蓝描金大碗，里面是淋着蓝莓酱和炼乳的刨冰，顶上有奶油、金色雪花糖饰、蓝莓和白玉丸子；左侧立着金边说明牌，用日文写着口味名、一段介绍和七行配料。

**常见问题**：
- 角色被画成写实真人：加一句"角色保持原插画的二次元画风，只有甜品和餐具是写实质感"。
- 说明牌文字糊成一片：把配料清单减到 4 行，介绍压缩成一句。
- 甜品和角色没关系：在提示词里点明角色的两三个标志元素，如"蓝色披风、金色雪花、蓝宝石胸针"。

**适合**：角色应援图、同人主题咖啡馆企划、甜品店联名菜单的概念图。上传的插画请用自己有权使用的作品，不要拿他人或已有作品的角色做商用物料。

### 英文原版

```text
Create a realistic premium Japanese {argument name="dessert" default="kakigori"} dessert directly based on the uploaded illustration. The shaved ice, flavor design, bowl shape, syrup colors, toppings, ornaments, explanation plate, logo, café interior, shop exterior, furniture, decorations, and overall presentation must all be naturally generated from the uploaded artwork’s atmosphere, colors, lighting, fashion, symbols, worldbuilding, emotional tone, and character design. Do not create a generic {argument name="dessert" default="kakigori"} or café. Adapt the dessert and the entire shop design to the uploaded illustration. {argument name="primary theme" default="Japanese fantasy or shrine maiden themes"} may inspire lacquer bowls, sakura syrup, bamboo textures, festival ornaments, paper lanterns, wooden interiors, wagashi, and traditional summer aesthetics. {argument name="alternative theme" default="Futuristic or sci-fi illustrations"} may inspire holographic ice crystals, neon syrup layers, glowing cubes, transparent bowls, metallic interiors, holographic menus, and cyberpunk café styling. Cute pastel illustrations may inspire fluffy ice, sparkling cream, candy ribbons, soft lighting, fairy-tale interiors, and dreamy dessert shop aesthetics. Include an original flavor name and a stylish explanation plate with highly readable Japanese typography matching the illustration’s world. If the uploaded illustration contains a character, place the same character naturally beside or interacting with the {argument name="dessert" default="kakigori"} while preserving the original face, hairstyle, outfit style, colors, proportions, personality, and facial features. Ultra detailed realistic dessert photography, cinematic lighting, premium Japanese café advertisement aesthetic.
```

> 改编自 [@ashiwata100](https://x.com/ashiwata100/status/2055864360044761378) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

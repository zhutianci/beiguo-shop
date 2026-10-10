---
title: "ai绘本生成提示词：复古童话绘本封面，烫金花体书名 + 小火龙和朋友们的魔法图书馆（gpt-image-2）"
slug: vintage-storybook-cover-baby-dragon-library
model: gpt-image-2
topics: [poster, illustration, comic]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给自己写的童话、班级故事集或亲子绘本做一张像样的封面：上半部分是烫金质感的花体书名和副标题，下半部分是暖光里的故事场景，四周是做旧的装饰边框，像一本老绘本。"
prompt: |
  为一本奇幻童话《[名字龙]》画一张插画丰富的复古绘本封面，竖版 3:4，像一本做旧的精装故事书。
  - 画布：深青近黑的底色，带磨损的羊皮纸肌理；四周是铜橙色的装饰边框和角花，散落着星星、月亮和细小的魔法光点。
  - 书名：上半部分是很大的华丽花体书名"[名字龙]"，暖金色，带刻线纹理、轻微的投影和卷曲的装饰笔画，有手工印刷的复古感；书名上方正中一个小火焰图标，两侧是对称的藤蔓花饰；书名下面一枚带火焰的小盾徽，再下面是奶金色的副标题"[每一声吼叫都记得家]"。
  - 主场景：下半部分是一间温暖的魔法图书馆，拱形的壁龛里透出夕阳的光；背景是书架、提灯、卷轴、挂画和植物，暖琥珀色的光；地上铺着地毯，散落着几张写着名字的小纸卡和金色的光点。
  - 角色（恰好 4 个）：正中坐着[一只橙红色的小火龙]，圆圆的绿眼睛、小灰角、小翅膀和卷起的尾巴，双手捧着一张纸，上面写着"[我是谁？]"；左边是[一个扎丸子头、系红围巾的小女孩]，托着腮微笑着看它；右边是[一只戴圆眼镜、穿长袍的猫头鹰]，正在读一本厚书；右下角是[一只系绿围巾的小狐狸]，好奇地望着小龙。
  - 画面文字：书名、副标题和小龙手里的纸要清晰可读，用简体中文；左侧书架上可以挂一面红色的小横幅，地上的纸卡上可以有两三个字的名字。
  - 画风：手绘感的童书插画，复古奇幻封面；暖橙与金色的光，深青色的暗部，纸张颗粒，略带不完美的墨线，华丽的装饰边框，温馨动人；不要照片感，不要多余的角色和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/YUFANCHEN423652/status/2074874196027662603
  author: "@YUFANCHEN423652"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为\"画布 / 书名 / 场景 / 角色 / 画面文字 / 画风\"；书名、副标题、主角、三个配角、纸条文字改为变量，英文文案换成中文示例；原文要求的 6 张名字卡和横幅文字精简为可选项；原条目第 2 张示例图带平台水印，未采用"
images:
  - 3576-vintage-storybook-cover-baby-dragon-library-1.jpg
imageCredit:
  by: "@YUFANCHEN423652"
  url: https://youmind.com/gpt-image-2-prompts?id=28031
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[名字龙] 在提示词里出现两次，换成你的书名时两处都改，中文 2～6 个字最适合做花体大字；副标题一句话，12 个字以内；主角和三个配角各用一句话写清"是什么 + 一两个外形特征"；主角手里那张纸上的字可以换成故事的核心问题。场景也能换，例如"海底的沉船船舱""树洞里的面包房"。

示例图是一张深色底的封面：上半部分是金色的花体英文书名和一行副标题，中间一枚火焰盾徽；下半部分的拱窗里透出橙色的晚霞，正中一只橙红色的小龙捧着写有"Who am I?"的纸，左边是托腮的小女孩，右边是戴眼镜读书的猫头鹰，右下是一只小狐狸；地上散着几张写了名字的纸卡，左侧挂着一面红色横幅，四周是铜色的花边。

**常见问题**：
- 中文花体书名写错或变成普通黑体：书名尽量短，并写"手绘花体美术字，带衬线和卷曲装饰"；仍不理想就先出无字版，书名后期再排。
- 角色太多挤在一起：把配角减到两个。
- 画面偏暗：加"拱窗的暖光照亮所有角色的脸"。

**适合**：自制绘本和故事集的封面、儿童阅读活动海报、亲子共读打卡图。

### 英文原版

```text
Goal: Create a richly illustrated vintage storybook poster cover for a fantasy children's tale titled {argument name="title text" default="The Name Dragon"}, with a warm, magical library scene and ornate hand-lettered typography.

Canvas: Vertical portrait poster, 3:4 aspect ratio, like an aged illustrated book cover. Use a dark teal-black background with distressed parchment texture, copper-orange decorative border, corner flourishes, stars, moons, and tiny magical sparkles.

Top typography: The upper half is dominated by large ornate serif lettering reading {argument name="title text" default="The Name Dragon"}. The letters are warm antique gold with engraved line texture, subtle shadowing, curled swashes, and a hand-printed vintage look. Above and around the title are small stars, a crescent moon, a small flame icon at the top center, and symmetrical vine-like flourishes. Beneath the title is a small shield crest with a flame emblem, then the subtitle {argument name="subtitle text" default="Every roar remembers home"} in cream-gold serif type.

Main scene: The lower half shows a cozy magical library inside an arched alcove glowing with sunset light. Bookshelves, lanterns, scrolls, framed art, plants, and warm amber light fill the background. The floor is covered with scattered parchment name cards and golden sparkles.

Characters: Include exactly 4 main characters. 1) A small orange baby dragon seated at center, cute and expressive, with round green eyes, little gray horns, red-orange scales, tiny wings, a curled tail, and clawed feet; it holds a parchment reading {argument name="dragon parchment text" default="Who am I?"}. 2) A young girl sitting on the left, brown hair tied in a messy bun with a red ribbon, wearing a teal embroidered cloak and red scarf, smiling gently with her chin in her hand. 3) A wise owl on the right wearing round spectacles and a dark robe, reading a brown book labeled {argument name="book title" default="The Book of Names"}. 4) A small orange fox at the lower right wearing a green scarf, looking toward the dragon with curiosity.

Visible text and countable items: Include exactly 6 loose name cards on the floor labeled: “Scorch”, “Spark”, “Ember”, “Puff”, “Home”, and “Blazy”. Add one hanging red banner on the left bookshelf with the text {argument name="banner text" default="NAMES LIVE IN MEMORIES AND HEARTS"}. Keep the title, subtitle, dragon parchment, owl book label, banner, and six name cards readable.

Visual style: Whimsical hand-painted children's book illustration, vintage fantasy cover, warm orange and gold lighting, deep teal shadows, textured paper grain, slightly imperfect ink lines, ornate decorative framing, cozy emotional atmosphere. Avoid photorealism, modern UI elements, or extra characters.
```

> 改编自 [@YUFANCHEN423652](https://x.com/YUFANCHEN423652/status/2074874196027662603) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

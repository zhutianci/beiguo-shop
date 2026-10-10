---
title: "ai角色三视图提示词：发光耳朵毛绒小兽，三视图+表情+色卡（gpt-image-2）"
slug: glowing-plush-creature-reference-sheet
model: gpt-image-2
topics: [figurine, character]
aspectRatio: "4:5"
needsRefImage: false
useCase: "想让一只原创毛绒萌宠在后续出图、做视频时长相不跑偏，先用这条生成一张写实 3D 设定表：三个转面、三种表情、五格色卡排在同一张灰底图上，之后当参考图反复用。"
prompt: |
  画一张 4:5 竖版的写实 3D 角色设定表，主角是一只毛绒小兽，名字叫[发光奶油小森熊]。这张表之后要当参考图，让它在别的画面和视频里长相不走样。
  - 棚拍环境：中灰色哑光背景，漫射柔光，每只脚下一小片浅浅的落地影，绒毛达到照片级的真实感；
  - 角色：小熊和小猫混合的圆胖小兽，头大而圆、身体短圆、手臂很小、腿短粗；全身是[暖奶油色]的浓密绒毛，深橄榄棕色的亮眼睛带高光，深棕色的小鼻子和嘴，脸颊有淡淡的[粉色腮红]，头顶一根细细的卷毛；小圆耳朵内侧和短尾巴尖发出[荧光绿]的微光，发光处略带半透明感；整体像一只柔软的玩偶，纤维质感真实；
  - 上排：恰好 3 个全身转面视图，等距排开，上方用白色小号大写英文标注"01 FRONT"（正面）、"02 3/4 LEFT"（左前四分之三侧，能看到身后的尾巴）、"03 BACK"（背面，露出发光的尾巴尖）；
  - 左下：标题"EXPRESSION SHEET"，下面恰好 3 个竖长带框的表情格，格下依次标注"01 NEUTRAL"（平静）、"02 BATTLE FURY"（[皱眉龇牙的战斗怒气]）、"03 SHOCK"（耳朵竖起、瞪眼张嘴的惊吓）；
  - 右下：标题"COLOR PALETTE"，竖排恰好 5 个矩形色块并配文字：毛色、发光色、腮红色、深棕色（鼻子与轮廓）、白色高光；
  - 标签字体：细小干净的无衬线字，排得齐、不抢戏；
  - 一致性：三个转面和三格表情必须是同一只小兽，头身比、绒毛质感、哪里发光都不能变；画面里别出现第二个角色，也别加道具、Logo、水印或花哨的背景装饰。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/yarakashiyama_/status/2057566675218633056
  author: "@yarakashiyama_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；角色名、毛色、发光色、腮红色、第二格表情设为变量；原文第二格表情写的是\"用米色方块遮住脸\"，按示例图改为皱眉龇牙的怒气表情；删去重复的一致性描述"
images:
  - 3577-glowing-plush-creature-reference-sheet-1.jpg
imageCredit:
  by: "@yarakashiyama_"
  url: https://youmind.com/gpt-image-2-prompts?id=21996
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[发光奶油小森熊] 换成你的角色名加一句话特征，如"雪白长耳小狐""灰蓝圆滚小企鹅"；[暖奶油色] [荧光绿] [粉色腮红] 分别是毛色、发光色和腮红色，建议发光色只用一种；[皱眉龇牙的战斗怒气] 是第二格表情，可换成"眯眼大笑""委屈含泪"。换了物种记得把"小熊和小猫混合"那句一起改掉。

示例图是一张灰底设定表：上排三只奶油色绒毛小兽分别是正面、左前侧和背面，耳朵内侧和尾巴尖泛着绿光；左下三格表情依次是平静、龇牙发怒、张嘴惊吓（惊吓那格耳朵变长竖起）；右下是五格色卡，标签全是白色英文小字。

**常见问题**：
- 三个视图长得不像同一只：在末尾加"三个视图是同一个 3D 模型旋转得到的，头身比完全相同"。
- 表情格里耳朵形状变了：加"表情变化只改眼睛和嘴，耳朵和体型不变"。
- 英文标签拼错：把标签减到只留编号，或改成中文短标签，每个不超过 4 个字。
- 毛发像塑料：加"羊毛毡般的细密短绒，逆光处能看到毛尖"。

**适合**：原创萌宠 IP、毛绒玩具打样前的设定稿、给图生视频准备的角色参考图。不适合直接当成工厂用的生产图纸。

### 英文原版

```text
Goal: Create a realistic 3D character reference sheet for a cute plush-like creature named {argument name="character name" default="bioluminescent cream forest cub"}, designed for consistent video generation.

Canvas: Vertical 4:5 character sheet on a matte medium-gray studio background, soft diffused lighting, subtle floor shadows, high-resolution photorealistic fur rendering.

Subject details: The character is a small chubby teddy-bear/cat hybrid with a round oversized head, short rounded body, tiny arms, stubby legs, cream-colored dense fuzzy fur, glossy dark olive-brown eyes with bright catchlights, a tiny dark brown nose and mouth, faint pink cheeks, one thin curled hair sprout on top of the head, small rounded ears that glow bioluminescent green inside, and a short tail with a glowing green tip. The overall mood is adorable, soft, and toy-like, with realistic fiber texture and gentle translucency in the glowing green areas. Use {argument name="fur color" default="warm cream"}, {argument name="glow color" default="bioluminescent green"}, and {argument name="cheek color" default="soft pink blush"}.

Layout: Arrange the sheet in two main rows. Top row contains exactly 3 full-body turnaround views, evenly spaced and labeled in small white uppercase text: 1) “01 FRONT” showing the creature facing forward, 2) “02 3/4 LEFT” showing a three-quarter left view with the tail visible behind, 3) “03 BACK” showing the back view with rounded head, back fur, small arms, legs, and glowing tail tip. Bottom left contains an expression sheet with exactly 3 vertical framed panels labeled “EXPRESSION SHEET” above and captions below: 1) “01 NEUTRAL” with calm forward-facing eyes and closed small mouth, 2) “02 BATTLE FURY” with the face area covered by a centered opaque beige square block, 3) “03 SHOCK” with raised ears, wide eyes, and open surprised mouth. Bottom right contains a color palette column labeled “COLOR PALETTE” with exactly 5 rectangular swatches and labels: 1) “CREAM FUR” beige fur texture, 2) “BIOLUMINESCENT GREEN” glowing green gradient, 3) “PINK CHEEK” rosy pink texture, 4) “DARK BROWN OUTLINE / NOSE” dark brown swatch, 5) “WHITE HIGHLIGHT” white swatch.

Text style: Small clean sans-serif uppercase white labels, minimal technical character-sheet typography, aligned precisely and unobtrusively.

Constraints: Keep exactly 3 turnaround views, exactly 3 expression panels, and exactly 5 color swatches. Do not add extra characters, props, logos, watermarks, or decorative background elements. Maintain consistent proportions, fur texture, glowing ears and tail, and facial design across all views.
```

> 改编自 [@yarakashiyama_](https://x.com/yarakashiyama_/status/2057566675218633056) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

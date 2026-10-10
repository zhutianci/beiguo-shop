---
title: "ai角色设定图提示词：写实 3D 外星军阀，四视图+技能动作+五种表情（gpt-image-2）"
slug: obese-alien-warlord-3d-design-sheet
model: gpt-image-2
topics: [character, game-art]
aspectRatio: "4:3"
needsRefImage: false
useCase: "给 AI 视频或游戏里的怪物、反派做一致性参考时用：一张图里有四个角度的全身像、面部特写、战斗姿态和五个表情，写实 3D 质感。"
prompt: |
  为同一个[外星男性角色]制作一张电影级的角色设计表，所有画面里必须是同一个角色、同一套装备。
  角色：体型巨大而肥胖的人形外星人，身高约[两米一]，肚子又大又圆，胸膛厚实、肩宽臂粗、双腿粗壮，分量感很重。皮肤是[浅青绿色]，带细微斑驳和略粗糙的外星肌理；头大而沉，下颌宽厚、脸颊饱满，眼睛很小、目光压人，鼻子扁平，脸上有深深的褶皱，半垂着眼皮、一脸得意。没有头发和胡须。
  装备：科幻军阀盔甲混搭浮夸的奢华首饰——深石墨色与枪灰色的肩甲，加固的胸部背带（要让大肚子的轮廓露出来），金属腰甲，超大号厚底靴，金戒指，粗金链，悬浮的装饰腰带部件，盔甲上嵌着几枚发出[紫色光芒]的能量装置。
  版面分三排：
  - 第一排 4 个全身转面：正面、左侧面、右前四分之三侧、背面；站姿放松，肚子前挺、下巴微抬。
  - 第二排 3 格：面部大特写；全身自然站姿；战斗姿态（重心压低、手臂横扫，双手周围是紫白色能量、同心扭曲光环和悬浮粒子）。
  - 第三排 5 个头部表情：傲慢的笑、不耐烦的冷脸、张口暴怒、搓手盘算、目瞪口呆的搞笑反应。
  光线：干净的中性影棚光，加一道偏冷的轮廓光，深灰色背景；面部、盔甲、皮肤肌理和饰品都要看得清。
  风格：写实的电影级科幻角色设计，解剖结构可信、材质真实、服装构造看得懂；性格带喜感，但比例不卡通。
  禁止：变瘦或变成健美身材、换脸、肤色变化、长角、多出手臂、触手、头发胡须、盔甲改款、加头盔、首饰丢失、角色重复、肢体错乱、卡通画风、水印、文字。画幅[4:3]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/bmx_ai13/status/2086580029191082048
  author: "@bmx_ai13"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；角色类型、身高（英尺换算为米）、肤色、能量颜色、画幅设为变量；按示例图把原文罗列的视图整理成三排版式；删去原文里针对视频分镜的\"与同框女性的体型对比\"一句；连续性说明并入禁止项。"
images:
  - 3561-obese-alien-warlord-3d-design-sheet-1.jpg
imageCredit:
  by: "@bmx_ai13"
  url: https://youmind.com/gpt-image-2-prompts?id=31002
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[外星男性角色] 是角色类型，换成"沼泽巨魔首领""石肤矿工头目"都行，但要同时改写下面的体型和五官描述；[两米一] 是身高；[浅青绿色] 是肤色；[紫色光芒] 是能量装置和技能特效的颜色，换成"橙红色火光""冰蓝色电弧"后，整套装备的点缀色会一起变。结尾的禁止项是用来锁住一致性的，换角色时把肤色、盔甲、首饰几条对应着改。

示例图是深灰背景的三排版式：第一排是同一个青灰色皮肤的胖大外星人的四个站姿，穿深色金属盔甲、挂金链，腰间和肩背嵌着紫色发光圆盘；第二排是面部大特写、全身像和一格双手放出紫色能量环的蹲伏战斗姿态；第三排是五个头像表情，从得意、阴沉、张口怒吼、搓手盘算到瞪眼发愣。

**常见问题**：
- 角色被画瘦或变成肌肉型：把"肚子又大又圆、一眼看出很重"提到第一句。
- 表情排里脸变了：加"五个表情的头部大小、眼睛形状和褶皱位置一致"。
- 图上冒出标注文字：保留"禁止文字"，并删掉提示词里所有带引号的词。

**适合**：给 AI 视频做角色一致性参考、短片和游戏的反派设定；想要二次元画风的不适合用这条。

### 英文原版

```text
Create a premium cinematic character design sheet for one single {argument name="character" default="alien male character"}.

Show the same character consistently in:
front view, left side view, right three quarter view, rear view, face close-up, full-body neutral stance, combat stance, angry expression, smug expression, confused comedic expression.
The character is a gigantic obese humanoid alien male, approximately seven feet tall, with an enormous rounded belly, thick chest, powerful arms, broad shoulders, thick legs, and very heavy physical weight.

His skin is {argument name="skin color" default="pale turquoise"} with subtle mottling and slightly rough alien texture. His head is large and heavy with a thick jaw, broad cheeks, very small intimidating eyes, a flattened alien nose, deep facial folds, and a smug heavy-lidded expression. No human facial hair.

His armor combines intimidating sci-fi warlord design with extravagant gangster luxury: dark graphite and gunmetal armored shoulder pieces, reinforced chest harness that leaves the large belly shape clearly readable, metallic waist plating, oversized lunar boots, gold rings, heavy chains, floating ornamental belt elements, and a few {argument name="energy color" default="glowing violet"} time-control devices embedded into his armor.

His silhouette must remain unmistakably huge and top-heavy.

Posture: relaxed confidence, belly forward, shoulders slightly back, chin raised. In combat he lowers his center of gravity and uses enormous sweeping arm movements.

Expression range:

arrogant grin

dismissive boredom
irritated disbelief
full rage
shocked comedic reaction
calculating menace
Power visual language:
subtle violet-white temporal energy around his hands, concentric distortion rings, suspended particles, warped light, small clock-like energy geometry without literal clock graphics.

Lighting:
clean neutral studio-style character lighting with a subtle cool lunar rim light. High detail on face, armor, skin texture, accessories, and silhouette.
Visual style:
photoreal cinematic sci-fi character design suitable for premium live-action AI video. Realistic anatomy, believable materials, readable costume construction, no cartoon proportions despite the comedic personality.

Continuity Notes
Preserve exactly:

same pale turquoise skin tone
same apparent age

same facial proportions

same tiny eye shape

same enormous belly and heavy body type
same armor design
same gold rings and chains
same floating belt ornaments
same lunar boots
same violet temporal-energy design
His size must remain dramatically larger than the woman in every shared frame.
Negative Prompt
No body slimming, no muscular bodybuilder transformation, no different face, no skin-color change, no random horns, no extra arms, no tentacles, no hairstyle, no beard, no armor redesign, no random helmet, no missing jewelry, no wardrobe drift, no duplicated character, no broken anatomy, no cartoon style, no watermark, no text.
```

> 改编自 [@bmx_ai13](https://x.com/bmx_ai13/status/2086580029191082048) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

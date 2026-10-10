---
title: "ai手办提示词：把自己的角色做成 Q 版圣诞老人 PVC 手办，量产级涂装的白底产品图（Nano Banana）"
slug: character-to-chibi-santa-pvc-figure
model: nano-banana
topics: [figurine, character, ecommerce]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: true
useCase: "上传一张原创角色图，生成该角色的 Q 版圣诞主题手办产品图：2.5～3 头身、红色圣诞服、迷你圣诞帽，半哑光的 PVC 质感，站在透明底座上，适合做节日贺图、周边打样参考。"
prompt: |
  忠实参考上传的角色图，把这个角色重新制作成一个高品质的 Q 版[圣诞老人]主题手办，输出产品照，画幅 16:9。
  - 角色还原（最重要）：严格保持原图的脸部特征、眼睛形状、发色、发型和整体气质；Q 版体型，2.5～3 头身（大头、短手短脚、比例协调）；虽然做了变形，也要一眼认得出是谁；
  - 手办质感（同样重要）：PVC 成品手办的质感，表面光滑均匀，半哑光到缎面光泽、不要过亮；棱角不过分锐利，略带圆润；涂装细致、色块均匀，是量产手办的水准；衣服是"雕刻出来的衣服"，不是真实布料——不要出现毛线或织物纤维的纹理，也不要强调黏土或树脂感；
  - 服装：以红色为主的圣诞服，白色毛边用造型表现；头戴迷你圣诞帽（固定造型）；靴子和手套与身体一体成型；金色纽扣、皮带扣等少量点缀；
  - 姿势与底座：稳定的站姿或轻微的动作，[一只手拿着礼物盒]或挥手；站在透明的圆形底座上，重心稳、不易倒；
  - 拍摄：产品摄影式布光，背景是[白色]（也可用浅灰或淡淡的冬季色），主体居中，阴影柔和，整体干净。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/yudotanaka/status/2003669711738048838
  author: "@yudotanaka"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文作者的英文提示词，改写为分条的中文并去掉表情符号小标题；节日主题、手持道具、背景色设为变量；保留\"脸型、眼型、发色发型必须与原图一致\"\"衣服是雕刻造型而非真实布料\"等关键规则"
images:
  - 3440-character-to-chibi-santa-pvc-figure-1.jpg
  - 3440-character-to-chibi-santa-pvc-figure-2.jpg
imageCredit:
  by: "@yudotanaka"
  url: https://youmind.com/nano-banana-pro-prompts?id=3376
  license: CC BY 4.0
verify:
  - "需要上传角色参考图；只用自己的原创角色或已获授权的形象"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张角色的清晰正面图；[圣诞老人] 可以换成其他节日主题，如"万圣节小巫师""新年舞狮"，同时把"服装"那一条改成对应的衣服；[一只手拿着礼物盒] 换成"抱着一棵小圣诞树""举着拐杖糖"；背景三选一。

示例图第一张：浅灰白背景上，一个蓝色长发、紫色眼睛的 Q 版手办，戴圣诞帽、穿红色白边的圣诞裙，一手抱着绿色礼物盒、一手挥手，站在透明圆底座上，表面是柔和的哑光。第二张是另一位角色的同款：黑色短发、发尾带红色，同样的圣诞服和底座，可以看出不同角色套用同一提示词的效果。

**常见问题**：
- 角色不像了：把"角色还原"那一条提前，并上传五官更清晰的参考图。
- 质感像黏土或毛毡：保留"不要纤维纹理、不要强调黏土感"两句。
- 光泽太强像塑料玩具：改成"哑光涂装，只有眼睛有高光"。

**适合**：节日贺图、原创角色周边概念、手办打样前的效果参考、社群头像活动。

### 日文原版

```text
Faithfully reference the attached character image and reconstruct that character as a high-quality chibi character Santa Claus figure.
👤 Character Reproduction Rules (Most Important)
Strictly maintain the facial features, eye shape, hair color, hairstyle, and overall atmosphere of the original image.
The character must have a chibi physique of 2.5 to 3 heads tall (large head, short limbs, balanced proportions).
Although deformed, the figure must be recognizable at a glance.
🧸 Figure Texture and Modeling (Most Important)
PVC figure / finished toy-style texture.
Surface is smooth and uniform.
No excessive gloss, semi-matte to satin finish.
Edges are not too sharp, slightly rounded modeling.
Painting is careful with minimal unevenness, mass-production figure quality.
Cloth representation is sculpted clothing, not "real fabric."
* Do not include wool or fabric fiber texture.
* Be careful not to over-emphasize clay or resin texture.
🎄 Santa Costume (For Figures)
Santa costume (sculpted clothing) primarily in red.
White fur parts are expressed with molds.
Mini Santa hat (fixed modeling).
Boots and gloves appear integrated.
Decorations are minimal accents that enhance the figure's appearance, such as gold buttons and belt buckles.
🧍 Pose and Stand
Stable standing pose or light action pose.
Holding a present in one hand or waving.
Standing on a transparent or simple base.
Modeling balance is designed for mass production and stability (non-tipping).
🎨 Photography and Background
Product photography-style lighting.
Background is one of the following:
- White background
- Light gray
- Pale winter color
Product photo composition with the subject centered.
Shadows are soft, prioritizing cleanliness.
```

> 改编自 [@yudotanaka](https://x.com/yudotanaka/status/2003669711738048838) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

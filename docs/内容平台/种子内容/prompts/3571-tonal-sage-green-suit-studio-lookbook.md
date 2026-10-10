---
title: "ai穿搭提示词：同色系穿搭影棚大片，鼠尾草绿马甲阔腿裤 + 披肩大衣（Nano Banana）"
slug: tonal-sage-green-suit-studio-lookbook
model: nano-banana
topics: [fashion, photography]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "想看\"一身同色系\"穿出来是什么效果：生成一张干净的影棚时装照，上下装、外套和背景都在同一个色系里，靠面料质感和层次拉开差别。适合做穿搭配色参考、服装品牌的季节主视觉和 Lookbook 内页。"
prompt: |
  生成一张专业的时装影棚照片，画幅 2:3 竖版：[一位留着齐下巴短发的年轻东亚女性]，展示一套现代的[鼠尾草绿]同色系穿搭。
  - 服装：[合身的系扣西装马甲]、[高腰阔腿长裤]，肩上披一件[粗纺羊毛长大衣]，三件都是同一个色系，只在深浅和面料上有细微差别；剪裁利落，面料的纹理清楚——马甲和裤子平整挺括，大衣表面有粗粗的羊毛颗粒。
  - 配饰：层叠的金色细项链，其中一条挂着小钥匙吊坠；手腕上是纤细的金手链；脚上一双奶油色的厚底编织凉鞋。
  - 姿势：[放松地坐在一只原木方凳上]，双手自然交叠在膝间，身体略微前倾，面带平和的微笑，直视镜头。
  - 背景：[极简的浅薄荷绿背景]，与服装同色系但更浅，墙地一体、没有杂物。
  - 光线：柔和均匀的影棚光，没有生硬的阴影，突出干净的剪裁和面料质感。
  - 气质：干净、精致、有当代感；全身入镜；不出现品牌标志、文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Minahil42298354/status/2063276259350618487
  author: "@Minahil42298354"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；人物、主色、背景保留为变量，新增三件单品与姿势变量；原文要求一次生成多角度合集，这里按示例图改为单张，并在说明里给出换姿势的写法"
images:
  - 3571-tonal-sage-green-suit-studio-lookbook-1.jpg
imageCredit:
  by: "@Minahil42298354"
  url: https://youmind.com/nano-banana-pro-prompts?id=24378
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[鼠尾草绿] 换成任何你想试的颜色，如"燕麦色""雾霾蓝""焦糖棕"，背景相应换成同色系里更浅的一档；三件单品各是一个变量，可以换成"吊带背心 / 直筒长裙 / 针织开衫"或"衬衫 / 西装短裤 / 长风衣"；姿势可以换成"站立，一只手插在裤袋里""边走边整理大衣领口"（换姿势时把后面"双手交叠在膝间"一句一并删改），换几次就是一组多角度的 Lookbook。人物描述只需发型和大致年龄。

示例图里，一位齐耳短发的女生坐在一只原木方凳上，穿鼠尾草绿的马甲和阔腿裤，肩上披着同色的粗纺大衣，脖子上是几条金色细项链，脚上是米白色的厚底凉鞋；背景是比衣服更浅的薄荷绿，光线很柔和。右下角有生成工具自带的四角星标记。

**常见问题**：
- 三件衣服糊成一片分不清：强调"三件面料不同：平纹西装料、粗纺羊毛、罗纹针织"，或让其中一件深一个色号。
- 背景和衣服颜色一样导致人物不突出：写"背景比服装浅两档、略偏灰"。
- 手部变形：把姿势改成"双手插兜"或"手放在身后"。

**适合**：穿搭配色参考、服装品牌的季节主视觉、Lookbook 内页；需要展示真实款式时请以实拍为准。

### 英文原版

```text
A professional fashion studio photoshoot of a {argument name="subject" default="young East Asian woman"} with a sleek, chin-length bob haircut, showcasing a modern monochromatic {argument name="color theme" default="sage green"} outfit. She is wearing a tailored sage green button-up vest paired with matching high-waisted, wide-leg trousers, and has a textured, oversized sage green wool trench coat draped elegantly over her shoulders. Her accessories include layered gold chain necklaces with a key pendant, delicate gold bracelets, and chunky cream-colored strappy fisherman sandals. The scene is shot against a {argument name="backdrop" default="minimalist, muted soft mint-green backdrop"}, capturing a clean, sophisticated, and contemporary aesthetic. The prompt should generate a collection of full-body and three-quarter shots from multiple angles: standing confidently with one hand in her pocket, sitting relaxed on a simple wooden block crate against a textured wall, and a dynamic mid-shot capturing her smiling while adjusting the lapels of her draped coat. The lighting is soft and even, highlighting the clean tailoring, textures of the fabrics, and an elegant, calm expression.
```

> 改编自 [@Minahil42298354](https://x.com/Minahil42298354/status/2063276259350618487) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

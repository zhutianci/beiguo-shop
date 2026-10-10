---
title: "ai表情包制作提示词：小橘猫捧脸惊呼 OMG 的漫画字反应贴纸（gpt-image-2）"
slug: kitten-omg-reaction-sticker
model: gpt-image-2
topics: [sticker, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "做一张\"震惊 / 太好了吧\"类的单张反应贴纸：星星眼的 Q 版小橘猫双爪捧脸，旁边一个大大的漫画泡泡字，整体带厚白边，适合聊天表情、周边印刷和社媒配图。"
prompt: |
  画一张可爱的卡哇伊贴纸插画，透明背景，主角是一只兴奋到表情夸张的 Q 版[橘色虎斑小猫]。
  - 角色：居中、正面朝向，[橘色条纹毛，嘴周和肚皮是奶油色]，粉色内耳；一双超大的琥珀色眼睛里闪着星星高光，脸颊红扑扑，嘴巴张成又惊又喜的样子，两只前爪捧在脸颊上；
  - 贴纸边：角色和所有图形外面整体包一圈厚厚的白色贴纸描边，最外沿再加一道细细的深色边；
  - 文字：左上角恰好 1 个大大的漫画字"[OMG!]"，圆润粗体的黄橙色泡泡字，黑色描边加白色外描边；
  - 点缀：小猫右上方恰好 2 个分开的黄色感叹号；恰好 2 个黄色小闪光，左右各一个；右脸颊旁恰好 3 条白色短动作线；
  - 画风：鲜艳的动漫贴纸风，干净的矢量感线条，暖橙色渐变，高对比，表情俏皮；
  - 不要多余物件、背景花纹和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/EXphinx/status/2090612889824657762
  author: "@EXphinx"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；动物种类、毛色、漫画字改为变量；保留原文的数量约束（1 个漫画字、2 个感叹号、2 个闪光、3 条动作线）"
images:
  - 3448-kitten-omg-reaction-sticker-1.jpg
imageCredit:
  by: "@EXphinx"
  url: https://youmind.com/gpt-image-2-prompts?id=32169
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[橘色虎斑小猫] 和后面的毛色描述一起换，比如"柴犬 + 黄白毛""小白兔 + 纯白毛、粉耳朵""小熊猫 + 红棕毛"；[OMG!] 是左上角的漫画字，可以换成"哇！""真的假的""绝了"，中文建议不超过 4 个字，英文不超过 5 个字母。眼睛里的星星、捧脸动作是这张图"震惊感"的来源，换动物时保留这两句。

示例图是一只橘白相间的小猫，琥珀色大眼睛里各有一颗四角星，张大嘴、双爪捧着红扑扑的脸；左上角是黄色泡泡字"OMG!"，右上方几道黄色感叹号，左右各有黄色小闪光，整只猫外面包着一圈厚白边，背景是很浅的灰色。

**常见问题**：
- 背景不是真透明：模型通常给浅灰或白底，出图后自己抠一次图即可；白边够厚，抠起来很干净。
- 中文漫画字变形：注明"简体中文、圆润粗体"，字数再减一个。
- 感叹号、闪光数量对不上：不影响效果，可以直接删掉数量要求。
- 想要一组表情：保留角色描述，把表情和文字换成"哭哭 / 生气 / 比心"分别出图。

**适合**：聊天反应表情、直播间贴图、T 恤和手机壳图案；不适合需要严肃语气的商务场合。

### 英文原版

```text
Create a cute kawaii sticker illustration on a transparent background featuring an excited chibi {argument name="animal" default="orange tabby kitten"} reacting dramatically. The kitten is centered, facing forward, with orange striped fur, cream muzzle and belly, pink inner ears, huge glossy amber eyes filled with star highlights, rosy blush cheeks, an open happy shocked mouth, and both front paws raised against its cheeks. Add a thick white sticker outline with a thin dark shadow/edge around the entire character and graphics. Include exactly 1 large comic word at the upper left reading {argument name="comic text" default="OMG!"} in bold rounded yellow-orange bubble letters with black outline and white outer stroke. Add exactly 2 separate yellow exclamation marks to the upper right of the kitten, exactly 2 small yellow sparkle icons, one on the left and one on the right, and exactly 3 short white motion lines near the right cheek. Use a vibrant anime sticker style, clean vector-like line art, warm orange gradients, high contrast, playful expression, no extra objects, no background pattern, no watermark.
```

> 改编自 [@EXphinx](https://x.com/EXphinx/status/2090612889824657762) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

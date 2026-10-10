---
title: "ai角色设定图提示词：暗黑奇幻守护兽图鉴，骨骼四视图+习性+誓词（gpt-image-2）"
slug: dark-fantasy-guardian-beast-lore-sheet
model: gpt-image-2
topics: [character, infographic, illustration]
aspectRatio: "2:3"
needsRefImage: false
useCase: "给原创世界观里的怪物、守护兽做一张\"图鉴式\"设定图时用：一张竖版图里排好主视觉、毛色变体、细节特写、骨骼四视图、习性姿态和一段誓词。"
prompt: |
  画一张暗黑奇幻风的生物角色设定图鉴，主角是[地狱犬]，身份是"[森林守护者]"，身边带着一个小伙伴：[穿粉色卫衣的小灰猫]。
  画布：竖版信息图，做旧羊皮纸与炭黑底色相间的版面，哥特风衬线标题字，用细线分隔各个面板。
  主体：一头由活的阴影和炭黑色长毛构成的巨兽，头部是古老的兽类头骨，眼睛发出白光，四肢细长、爪子锋利；外形吓人，姿态却是弓身俯下、把小伙伴护在两只前爪之间。四周飘着金色火星，围成一圈光环，背景是幽暗的森林和石砌废墟。
  版面从上到下：
  1. 顶部左侧：大标题写生物名，副标题写身份；下面一个资料栏，逐行写"类型、栖息地、皮肤、毛发、习性、首要使命"；旁边一句手写体的誓言。
  2. 顶部右侧：一栏"毛色变体"并排 3 个小图（炭黑、灰烬灰、骨白），下面竖排 5 个细节面板：皮肤、眼睛、头骨、牙齿、爪，每个配一两行说明。
  3. 中部：一条"骨骼研究"，画出骨架的正面、左侧、背面、右侧 4 个视图，再加一个头骨与脊柱的局部素描。
  4. 中下部：一条"动作与习性"，4 个小姿态（静卧守望、挡在前面、圈身遮蔽、温顺低头）；旁边"常见藏身处"2 格（森林深处、废弃建筑）和一小格"气味"说明。
  5. 底部：居中一段分行短诗"守护者的誓言"，左右各配一幅巨兽圈着小伙伴入睡的小图，最下方一行页脚标语。
  画面文字全部用[简体中文]，字迹清晰、不要乱码。
  风格：高完成度的奇幻概念设定稿，暗黑学院气质，毛发、骨骼和石材质感细致，戏剧化的暗调光线，只用金色火星做点缀。不要血腥场面，不要水印和签名。画幅[2:3]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/flutterwhat/status/2102866284778336744
  author: "@flutterwhat"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按版面从上到下重排成分条描述；生物名、身份、小伙伴、文字语言、画幅设为变量；原文逐字给出的英文资料栏和诗句改为\"按栏目填写\"的说明；补充了\"不要血腥、不要水印签名\"的约束。"
images:
  - 3559-dark-fantasy-guardian-beast-lore-sheet-1.jpg
imageCredit:
  by: "@flutterwhat"
  url: https://youmind.com/gpt-image-2-prompts?id=35336
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[地狱犬] 换成你要设定的生物，如"雪原巨鹿""沼泽石像鬼""机械守卫"；[森林守护者] 是它的身份副标题；[穿粉色卫衣的小灰猫] 是被守护的小伙伴，可以写成自家宠物的样子，也可以整句删掉只画生物本身；[简体中文] 决定图上文字的语言。资料栏、细节说明和誓词的具体内容可以在提示词后面逐条补上，不写就由模型自己编。

示例图是英文版：左上角哥特体"HELL HOUND"，中间一头炭黑色长毛巨兽弓身护着一只穿粉色卫衣的小灰猫，周围一圈金色火星；右侧是毛色变体和皮肤、眼睛、头骨、牙齿、爪五个细节格，中部是四个角度的骨架研究，往下是四种习性姿态、藏身处和气味，底部是一首分行的守护誓词。

**常见问题**：
- 小字糊成一片：把细节面板从 5 个减到 3 个，每格说明限定在 10 个字以内。
- 骨架和本体对不上：加一句"骨骼视图的头骨形状、脊柱弧度和四肢比例与主图一致"。
- 画面太吓人：把"头骨""爪子锋利"改成"面具般的白色面部""厚实的脚掌"，并写明"整体气质温和"。

**适合**：原创世界观的怪物图鉴、跑团和小说的生物设定、宠物主题的趣味设定图；文字密度高，不适合当小尺寸封面。

### 英文原版

```text
Goal: Create a dark fantasy character design sheet for a 'Hell Hound' guardian creature, featuring a small cat companion named Stinky.
Canvas: Vertical infographic layout with a parchment-style background and gothic typography.
Layout: Top section features the main illustration; middle sections contain detail panels and skeletal studies; bottom section displays behavioral poses and a poetic oath.
Subject details: The Hell Hound is a massive, terrifying beast made of living shadow and charcoal-black fur. It has a skeletal, ancient skull head with glowing white eyes, long spindly limbs, and sharp claws. Despite its monstrous appearance, it is crouching protectively around a tiny, cute grey cat wearing a pink hoodie (Stinky). The atmosphere is moody, magical, and protective.
Text content: Include specific labels and lore text:
- Title: "HELL HOUND" in large gothic font.
- Subtitle: "FOREST GUARDIAN & PROTECTOR".
- Stats block: Type: Noble Protector, Habitat: Kolby's World, Skin: Charcoal Black - Guardian's Oath, Coat: Shimmering Void, Behavior: Protective • Loyal • Gentle, Primary Mission: Protect the innocent — especially Stinky.
- Quote: "You will never harm what I swear to protect."
- Detail Panels: "COLOR VARIANTS" (Charcoal Black, Ash Gray, Corpse Gray), "SKIN DETAIL", "EYE DETAIL", "HEAD DETAIL", "TEETH", "CLAW / HAND".
- Skeletal Study: Front, Left, Back, Right views of the hound's skeleton.
- Movement & Behavior: Resting/Watching, Protecting, Sheltering, Gentle.
- Common Hiding Places: Forests, Abandoned Places.
- Odor: Smells like rain, moss, and ancient oaths.
- Bottom Section: "THE GUARDIAN'S OATH" poem starting with "I do not hunt her..." ending with "I am her forever." Footer text: "STINKY IS PROTECTED. ALWAYS. NO HARM SHALL TOUCH HER. EVER."
Visual style: High-fantasy concept art, dark academia aesthetic, detailed textures, dramatic lighting with golden sparks surrounding the hound.
```

> 改编自 [@flutterwhat](https://x.com/flutterwhat/status/2102866284778336744) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

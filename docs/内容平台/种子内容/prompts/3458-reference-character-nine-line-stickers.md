---
title: "ai表情包制作提示词：上传角色图，一次生成 9 张手绘风聊天贴纸（Nano Banana）"
slug: reference-character-nine-line-stickers
model: nano-banana
topics: [sticker, character]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: true
useCase: "手上已经有一张原创角色立绘或头像，想直接变成一套聊天贴纸时用：上传角色图，指定 9 句台词，模型沿用原图的线条和上色，一次出齐 3×3 共 9 张带彩色粗体字的表情。"
prompt: |
  参考图：我上传的这张角色图。
  以参考图为基础，一次生成 9 张手绘风的聊天贴纸，排成 3×3，做成风格统一的一整套。
  要求：
  - 必须保留角色的特征：发型、发色、瞳色、服装和标志性配饰；
  - 沿用参考图的线条粗细、上色方式和整体氛围；
  - 背景为纯白色；
  - 文字用粗体大字，带白色或黑色描边，放在角色上方或旁边，不遮住脸；
  - 文字颜色要和这句话的情绪相配；
  - 表情和姿势自然，每张的动作都不一样；
  - 9 张在同一张图里一次出齐。
  9 张的台词依次是：
  1. [早上好！]
  2. [谢谢]
  3. [对不起…]
  4. [好困]
  5. [OK！]
  6. [NO！]
  7. [没事吧？]
  8. [回头见！]
  9. [不知道]
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/schnapoon/status/1996529160567808091
  author: "@schnapoon"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文原帖译为中文；9 句台词改为变量并换成中文；补充了\"3×3 排版\"\"文字放在角色上方或旁边\"\"每张动作不同\"几条约束；原文的\"参考图【图1】\"改为\"我上传的角色图\""
images:
  - 3458-reference-character-nine-line-stickers-1.jpg
  - 3458-reference-character-nine-line-stickers-2.jpg
imageCredit:
  by: "@schnapoon"
  url: https://cdn.gooo.ai/cms/1765106430069_h45xpt_G7ThiGlbUAAyG99.jpg
  license: CC BY 4.0
verify:
  - "示例角色（橙发、黑斗篷、鲨鱼牙的 Q 版少女）应为原作者自创形象，无法完全核实，请站长过目"
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先上传一张角色图——半身或全身都行，要求五官、发型、服装清楚，背景越干净越好（建议用自己的原创角色或宠物拟人形象）。9 个变量就是 9 张贴纸上的字，直接换成你常用的话，比如"收到""在忙""哈哈哈""晚安""饿了""冲！"；每句建议不超过 5 个字。

示例图第一张是成品：白底 3×3 的 9 张贴纸，一个橙色头发、披黑色斗篷、系红色细蝴蝶结的 Q 版少女，分别在挥手、合掌、流泪、揉眼打哈欠、竖拇指、双臂交叉、关切伸手、挥手道别、歪头疑惑，上方是黄、粉、蓝、紫、绿、红、橙等颜色的粗体日文和英文大字（原作者用的是日文）。第二张是上传的参考图：同一个角色的白底半身立绘，线条偏细、淡彩上色。

**常见问题**：
- 角色配饰丢失（发夹、蝴蝶结）：在要求里把这几个配饰点名写出来。
- 9 张里有两张动作雷同：在对应台词后面加括号写明动作，如"好困（揉眼睛打哈欠）"。
- 中文字写错：把台词缩短，或先出无字版、后期自己加字。

**适合**：原创角色、虚拟形象、宠物拟人的聊天表情包；不要上传他人作品里的角色或未经同意的真人照片。

### 日文原版

```text
Reference image [Image 1]

Prompt
Based on [Image 1],
generate 9 LINE stickers in a hand-drawn style all at once.
Finish them as a cohesive set of 9.

✅Conditions
・Must maintain character features
・Reflect the line thickness, coloring, and atmosphere of the reference style
・Background must be completely white
・Text must be bold (white border or black border)
・Text color should match the mood of the phrase.
・Natural expressions and poses
・Generate 9 items in one go

✅9 types to create
Phrase: {argument name="phrase 1" default="Good morning!"}
Phrase: {argument name="phrase 2" default="Thank you"}
Phrase: {argument name="phrase 3" default="Sorry..."}
Phrase: {argument name="phrase 4" default="Sleepy"}
Phrase: {argument name="phrase 5" default="OK!"}
Phrase: {argument name="phrase 6" default="NO!"}
Phrase: {argument name="phrase 7" default="Are you okay?"}
Phrase: {argument name="phrase 8" default="See you later!"}
Phrase: {argument name="phrase 9" default="I don't know"}
```

> 改编自 [@schnapoon](https://x.com/schnapoon/status/1996529160567808091) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

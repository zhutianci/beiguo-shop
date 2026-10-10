---
title: "ai表情包制作提示词：像素风小奶狗 16 格表情包，带彩色泡泡字（gpt-image-2）"
slug: pixel-puppy-line-sticker-grid-16
model: gpt-image-2
topics: [sticker, game-art]
aspectRatio: "1:1"
needsRefImage: false
useCase: "一次生成 16 格像素画风的小狗聊天表情：前 9 格带彩色泡泡字（还没好、谢谢、辛苦啦……），后 7 格是不带字的纯表情（生气、大哭、大笑、奔跑），适合做复古像素风的表情包和游戏社群贴图。"
prompt: |
  生成一张聊天表情包预览图：正方形画布，4 列 4 行共 16 个等大的格子，白色背景，格子之间是细细的浅灰色分隔线。
  角色：每一格都是同一只[浅棕色垂耳小奶狗]，像泰迪或马尔泰迪幼犬——圆圆的黑眼睛、小黑鼻子、奶油色的嘴周和胸口白毛、蓬松的金棕色毛、垂耳。
  画风：可爱的像素画，像素颗粒清晰，角色外有厚白色贴纸描边；文字是圆润的粗体波普字，彩色填充（粉、蓝、橙、绿、紫）、带白色高光和深色粗描边；配小小的情绪符号。
  前 9 格带文字（文字在角色上方），后 7 格不带文字：
  1. "[还没好？]"——正面坐着，好奇地等，文字两侧有粉色强调线；
  2. "嗯……"——坐着，一只爪子放到嘴边思考，蓝色字；
  3. "到——"——坐着举起一只前爪应答，橙色字和强调线；
  4. "散步中"——戴着[绿色项圈]向右走，旁边有音符和绿色动作线；
  5. "[想吃狗粮]"——守着一碗满满的狗粮，粉色小爱心；
  6. "[谢谢]"——闭眼、双爪合十，粉色爱心和闪光；
  7. "辛苦啦"——累得趴平在地上，蓝色字；
  8. "请多关照"——闭眼低头鞠躬，粉色强调线；
  9. "原来如此"——嘴微张，旁边亮起一只灯泡；
  10. 皱着眉生气地坐着，头边一个红色怒气符号和一小团蒸汽；
  11. 坐着大哭，蓝色大泪珠，脚下一摊泪水；
  12. 眯眼大笑，两侧是橙色的笑声符号；
  13. 趴着，头和前爪向前伸，没精打采；
  14. 躲在木桌底下，只露出脸和前爪，上方垂着米色桌布；
  15. 开心地向右奔跑，耳朵向后飘，身后一小团尘土；
  16. 正面端坐、表情平静，作为基础款。
  限制：高清、干净的像素画质感，每格主体居中、清晰可读，不要写实风格和其他角色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/CEO_Spovisor/status/2050823562681024563
  author: "@CEO_Spovisor"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；角色、项圈颜色和三句台词改为变量；9 句日文台词全部换成中文；第 12 格按示例图由\"眨眼大笑\"改为\"眯眼大笑\""
images:
  - 3453-pixel-puppy-line-sticker-grid-16-1.jpg
imageCredit:
  by: "@CEO_Spovisor"
  url: https://youmind.com/gpt-image-2-prompts?id=18229
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[浅棕色垂耳小奶狗] 换成你家宠物的特征最好用，例如"黑白边牧幼犬""橘色短腿猫""白色垂耳兔"，后面那句品种细节也跟着改；[绿色项圈] 换成它真实的项圈或小围巾；台词变量换成你常用的话，如"在吗？""想吃罐头""收到"；后 7 格不带字，也可以按需配上。

示例图是 4×4 的像素画表情表：一只金棕色垂耳小狗，额头到胸口一道奶油色白毛；前 9 格配着粉、蓝、橙、绿、紫的日文泡泡字（原作者用的是日文），依次是歪头等待、托腮思考、举爪、戴绿项圈散步、守着狗粮碗、合爪感谢、趴地、鞠躬、灯泡亮起；后面是生气冒烟、大哭成一摊水、大笑、趴着、躲在桌子底下、奔跑和端坐。

**常见问题**：
- 像素感不够、变成普通插画：加"16 位复古游戏像素画，能看清方形像素，不要抗锯齿"。
- 中文泡泡字缺笔画：每句控制在 4 个字以内；像素字体很难写对复杂汉字，必要时后期加字。
- 每格小狗花色不一致：把"额头到胸口一道白毛"这类标志特征写清楚并强调 16 格一致。

**适合**：宠物主题表情包、像素游戏社群贴图、宠物店账号素材。

### 英文原版

```text
{"type":"LINE sticker sheet, 4 by 4 grid","style":"cute pixel-art / crisp sticker illustration, white background, thin light-gray grid lines, thick white sticker outlines, colorful Japanese bubble lettering with dark outline, small decorative emotion marks, consistent adorable small tan puppy character in every cell","subject":{"character":"{argument name=\"character name\" default=\"small tan floppy-eared puppy\"}","breed_look":"toy poodle or maltipoo-like puppy, round black eyes, small black nose, cream muzzle and chest blaze, fluffy golden-brown fur, floppy ears","accessory":"green collar appears on the walking sticker only","overall_mood":"friendly, expressive, usable as chat stickers"},"layout":{"canvas":"square sticker-sheet preview, 16 equal panels arranged in 4 columns and 4 rows","panel_count":16,"sections":[{"position":"row 1 column 1","label":"{argument name=\"sticker text 1\" default=\"まだ？\"}","description":"puppy sitting facing forward with a curious waiting expression, pink emphasis marks around the text"},{"position":"row 1 column 2","label":"むむむ…","description":"puppy sitting with one paw near its mouth, thinking or pondering, blue text"},{"position":"row 1 column 3","label":"はいー","description":"puppy sitting and raising one paw in greeting or answering, orange text and orange attention marks"},{"position":"row 1 column 4","label":"散歩中","description":"puppy walking to the right with a green collar, musical note and green motion marks"},{"position":"row 2 column 1","label":"カリカリ食べたい","description":"puppy beside a bowl filled with kibble, small pink hearts"},{"position":"row 2 column 2","label":"{argument name=\"sticker text 2\" default=\"ありがとう\"}","description":"puppy sitting with eyes closed and paws together in gratitude, surrounded by pink hearts and sparkles"},{"position":"row 2 column 3","label":"おつかれです","description":"puppy lying flat on the floor looking tired, blue text"},{"position":"row 2 column 4","label":"よろしくです","description":"puppy bowing politely with eyes closed, pink emphasis marks"},{"position":"row 3 column 1","label":"なるほど","description":"puppy sitting with mouth slightly open beside a glowing light bulb, green and yellow emphasis marks"},{"position":"row 3 column 2","label":"none","description":"puppy sitting sternly with angry eyebrows, a red anger mark near the head and a small puff of steam"},{"position":"row 3 column 3","label":"none","description":"puppy sitting and crying hard with large blue tears and a puddle under its face"},{"position":"row 3 column 4","label":"none","description":"puppy sitting with one eye winking, mouth open laughing, orange laughter marks"},{"position":"row 4 column 1","label":"none","description":"puppy lying down with head and paws stretched forward, sad or resting expression"},{"position":"row 4 column 2","label":"none","description":"puppy hiding under a wooden table or kotatsu with only face and front paws visible, beige cloth above and brown wooden floor"},{"position":"row 4 column 3","label":"none","description":"puppy running happily to the right, ears blown back, small dust puff and shadow under the body"},{"position":"row 4 column 4","label":"none","description":"puppy sitting neutrally facing forward as a simple base sticker"}]},"text_treatment":{"language":"Japanese","font":"rounded bold pop lettering, white fill highlights, colored fill and thick dark outline","main_colors":["pink","blue","orange","green","purple"]},"rendering":"high-resolution clean pixel-art look, transparent-sticker feel on white sheet, no photorealism, no extra characters, keep each panel centered and readable"}
```

> 改编自 [@CEO_Spovisor](https://x.com/CEO_Spovisor/status/2050823562681024563) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "ai表情包制作提示词：短发女生 9 格聊天回复表情包，黑色手写字（gpt-image-2）"
slug: bob-hair-girl-work-chat-stickers-9
model: gpt-image-2
topics: [sticker, character]
aspectRatio: "1:1"
needsRefImage: false
useCase: "做一套日常和工作群里都能用的\"回复型\"表情包：同一个短发女生 9 个动作，对应没事吧、不错、我懂、确实、原来如此、真的吗、正在路上、我确认一下、拜托啦，黑色手写大字在上、人物在下，白底干净好裁切。"
prompt: |
  生成一张聊天表情包：正方形白色画布上 3×3 排列 9 个互相独立的贴纸，间距均匀，不画边框和分格线，每个贴纸的文字在角色上方。
  角色：9 格都是同一个年轻女生——[浅棕色]齐肩短发、斜分刘海，白皙皮肤，黑色豆豆眼，小而有表情的嘴，脸颊微红；穿[纯白短袖 T 恤和蓝色牛仔裤]，露出全身时穿白色运动鞋。
  画风：可爱的手绘 Q 版动漫风，干净的黑色描边，柔和平涂，圆润亲切的比例，极少阴影，纯白背景；文字是粗黑的手写毛笔感字体。
  9 格内容：
  1. 左上"[没事吧？]"——担心地双手握在胸前，眉毛上扬，脸旁一滴蓝色汗珠；
  2. 中上"[不错！]"——右手竖大拇指，闭眼开心笑，拇指旁有橙色强调线；
  3. 右上"[我懂…]"——闭眼温柔微笑，一手托腮一手抱臂，头边蓝色小弧线；
  4. 左中"确实"——闭眼、双臂交叉，旁边绿色的点头弧线；
  5. 正中"原来如此"——惊讶张嘴、竖起一根食指，手指旁一个橙色感叹号；
  6. 右中"真的吗？"——好奇地双手握在下巴下面，头旁一个红色问号；
  7. 左下"正在路上"——全身像，向右奔跑、摆臂，身后蓝色速度线；
  8. 中下"我确认一下"——一手托下巴思考，表情略为难，蓝色强调线；
  9. 右下"拜托啦"——闭眼礼貌鞠躬，双手交叠在身前，两侧橙色弧线。
  限制：角色大小基本一致（只有奔跑那格是全身），高清方图，日系聊天贴纸质感，不要复杂背景、水印和多余文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/frog_tadano/status/2050719758530797712
  author: "@frog_tadano"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；发色、服装和三句台词改为变量；9 句日文台词全部换成中文"
images:
  - 3454-bob-hair-girl-work-chat-stickers-9-1.jpg
imageCredit:
  by: "@frog_tadano"
  url: https://youmind.com/gpt-image-2-prompts?id=17961
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[浅棕色] 是发色，连同"齐肩短发"可以整体换成你自己的样子，如"黑色高马尾""深棕色卷发戴圆框眼镜"；服装变量换成"米色针织衫""工牌 + 衬衫"更有上班味；三句带方括号的台词是示例，9 句都可以按你的聊天习惯改，比如"收到""稍等""已处理""辛苦了"。每句建议不超过 5 个字，字越少越不容易写错。

示例图是白底 3×3 的 9 个贴纸：一个棕色齐肩短发、穿白 T 恤的女生，上方是粗黑的日文手写字（原作者用的是日文），动作依次是握手担心、竖拇指、托腮点头、抱臂闭眼、竖食指恍然大悟、握拳托下巴疑问、全身奔跑、托下巴思考、鞠躬。除了橙、蓝、绿、红的小强调符号外几乎没有别的颜色，很素净。

**常见问题**：
- 9 格里脸型或发型跑偏：加"9 格必须是同一个人，发型、脸型、服装完全一致"，或减少到 6 格。
- 想换成自己的形象：上传一张自己的 Q 版头像，并把角色描述改成"按参考图的角色"。

**适合**：工作群 / 日常聊天的回复表情、个人 IP 表情包、客服话术贴图；不适合需要浓烈色彩和夸张搞笑效果的场景。

### 英文原版

```text
{"type":"LINE sticker sheet / emoji sticker set","style":"cute hand-drawn anime chibi, clean black outlines, soft flat colors, simple white background, rounded friendly proportions, transparent-sticker feel, handwritten Japanese captions in thick black brush lettering","character":{"description":"same young girl in every sticker, short light-brown bob haircut with side-swept bangs, pale skin, black dot eyes, small expressive mouth, rosy cheeks","outfit":"plain white short-sleeve T-shirt, blue jeans or blue skirt depending on pose, simple white sneakers when full body is visible","hair color":"{argument name=\"hair color\" default=\"light brown\"}"},"layout":{"format":"3 by 3 grid of nine separate sticker illustrations, evenly spaced on a white canvas, each sticker has its caption above the character","count":9,"stickers":[{"position":"top left","caption":"{argument name=\"sticker text 1\" default=\"大丈夫？\"}","pose":"worried girl clasping both hands at her chest, eyebrows raised, small sweat drop beside her face"},{"position":"top center","caption":"{argument name=\"sticker text 2\" default=\"いいね！\"}","pose":"girl giving a thumbs-up with her right hand, orange emphasis marks beside the thumb, cheerful approval pose"},{"position":"top right","caption":"{argument name=\"sticker text 3\" default=\"わかる…\"}","pose":"girl smiling gently with eyes closed, one hand on cheek and the other arm folded, blue sympathetic motion marks near her head"},{"position":"middle left","caption":"たしかに","pose":"girl standing calmly with eyes closed and arms crossed, small green nodding marks beside her"},{"position":"middle center","caption":"なるほど","pose":"girl with surprised open mouth raising one index finger, orange exclamation mark near the finger"},{"position":"middle right","caption":"ほんと？","pose":"girl looking curious with hands clasped under her chin, red question mark beside her head"},{"position":"bottom left","caption":"今向かってます","pose":"full-body running girl moving to the right, arms pumping, blue motion lines behind her, white sneakers visible"},{"position":"bottom center","caption":"確認します","pose":"girl thinking with one hand on chin and the other arm folded, slightly concerned expression, blue emphasis marks"},{"position":"bottom right","caption":"よろしくです","pose":"girl bowing politely with eyes closed, hands together in front, orange polite emphasis marks on both sides"}]},"composition":"each character is centered below its caption, no borders or panels, ample whitespace, consistent scale except bottom-left running pose is full body, crisp sticker-ready artwork","rendering":"high-resolution square image, cute Japanese messaging-sticker aesthetic, minimal shading, no complex background"}
```

> 改编自 [@frog_tadano](https://x.com/frog_tadano/status/2050719758530797712) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

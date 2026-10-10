---
title: "表情包提示词：水母吉祥物 16 格聊天贴纸（早安 / 谢谢 / 惊讶 / 辛苦了）（gpt-image-2）"
slug: jellyfish-mascot-sticker-sheet-16
model: gpt-image-2
topics: [sticker]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一张 4×4 的单角色聊天贴纸表：一只戴贝壳花的橙色小水母，四行分别是早安、谢谢、惊讶、辛苦了四种情绪，每行 4 个不同姿势，配手写对话气泡，适合做表情包、动态贴纸素材。"
prompt: |
  生成一张可爱的聊天动态贴纸序列表，只有一个吉祥物角色：[橙色小水母]，外形是柔软的桃橙色水母，伞盖左上方戴一朵小小的奶油色贝壳花。角色有光亮的水彩明暗、红润脸颊、圆圆的黑眼睛、小小的笑嘴或表情嘴、波浪状触手，以及干净的深红棕描边。
  画布：正方形 1:1，约 1254×1254 像素，排成整齐的 4×4 贴纸表，背景是浅灰白棋盘格（表示透明）。贴纸之间间距均匀，每个贴纸完整可见、不被裁切。
  版式：恰好 16 个独立贴纸，4 列 × 4 行。每格一个水母姿势加一个白色对话气泡（深红棕描边、粗圆中文字），气泡在角色上方，小尾巴指向水母；适当加入橙色动作线、气泡和强调线。
  第 1 行（4 个早安，文字"[早安！]"）：正面开心挥一条触手；闭成月牙眼笑着高举一条长触手挥手；正面开心挥手带小弧线；侧背面挥手、脸半转开。
  第 2 行（4 个谢谢，文字"[谢谢！]"）：害羞闭眼鞠躬、触手收拢；正面深鞠躬闭眼；身体压低的小鞠躬带侧边动作线；侧身鞠躬、触手拖向右边。
  第 3 行（4 个惊讶，文字"[吓一跳！]"）：正面睁大眼睛、小圆嘴、橙色感叹号；同样的惊讶正面加两道强调线；小一号的水母向上惊跳、下方竖向速度线；侧背面惊跳带气泡和竖线。
  第 4 行（4 个辛苦了，文字"[辛苦了]"）：困得打哈欠、用触手揉嘴边；更大的哈欠、闭眼、触手下垂；精疲力尽的正面、半睁眼、小皱眉、头旁冒泡泡；困得侧躺漂浮、闭眼张嘴打哈欠。
  画风：卡哇伊聊天贴纸插画，柔和水彩质感，暖珊瑚橙身体，淡奶油色褶边，半透明触手，细微高光和腮红，圆润造型，精致数字绘画；16 格角色设计一致。
  限制：恰好 16 个贴纸、4 列 4 行，不要其他角色、水印、英文文字和单独的贴纸边框，棋盘格背景铺满整张。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hAru_mAki_ch/status/2091362413191057575
  author: "Maki@Sunwood AI Labs."
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；角色名改为变量；原文的四句日文问候语改为中文变量"
images:
  - 3109-jellyfish-mascot-sticker-sheet-16-1.jpg
imageCredit:
  by: "Maki@Sunwood AI Labs."
  url: https://youmind.com/gpt-image-2-prompts?id=32374
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[橙色小水母] 换成你的吉祥物（同时改外形描述），四句话换成你最常用的回复，例如"[收到！]""[好的～]""[哈哈哈]""[晚安]"，每句 2～4 个字最稳。做动态贴纸时，每行 4 帧就是一个小动画，切出来按顺序播放即可。

示例图是棋盘格背景上的 4×4 橙色小水母：第一行挥手、第二行鞠躬、第三行惊讶跳起、第四行打哈欠犯困，每格上方一个白色对话气泡，写着日文"おはよう!""ありがとう!""びっくり!""おつかれさま"（原提示词默认日文，本站已改为中文）。

**常见问题**：
- 棋盘格被当成真背景：这是"透明"的示意，实际使用需要抠图或用透明背景输出。
- 中文气泡字错：每句 4 字以内，生成后逐个检查。
- 同一行 4 个姿势太像：每格写清楚动作差异（正面 / 侧面 / 背面、大小变化）。

**适合**：聊天表情包、动态贴纸素材、品牌吉祥物表情、社群互动图。

### 英文原版

```text
Goal: Create a cute LINE-style animated sticker sprite sheet featuring a single mascot character, {argument name="character name" default="orange jellyfish mascot"}, with the appearance of a soft peach-orange jellyfish wearing a small cream seashell flower accessory on the upper left side of its bell. The character has glossy watercolor shading, rosy cheeks, rounded black eyes, a tiny smiling or expressive mouth, wavy tentacles, and clean dark reddish-brown outlines.

Canvas: Square 1:1 image, about 1254×1254 px, arranged as a clean 4×4 sticker sheet on a light gray-and-white checkerboard background that looks like transparency. Leave even spacing between stickers and keep every sticker fully visible with no cropping.

Layout: Use exactly 16 discrete sticker frames in a 4 columns × 4 rows grid. Each frame contains one jellyfish pose plus one white speech bubble with a dark reddish-brown outline and bold rounded Japanese text. Speech bubbles sit above each character, with a small tail pointing toward the jellyfish. Use orange motion marks, bubbles, and small emphasis lines where appropriate.

Sticker count and labels: Row 1 has 4 morning greeting stickers labeled 「おはよう!」: 1) front-facing happy jellyfish waving one tentacle, 2) smiling with closed crescent eyes and one long raised waving tentacle, 3) front-facing happy wave with small motion arcs, 4) rear/side view waving with the face partly turned away. Row 2 has 4 thank-you stickers labeled 「ありがとう!」: 5) shy bowing jellyfish with closed eyes and tentacles gathered, 6) straight-on deep bow with closed eyes, 7) small bowing pose with body lowered and side motion marks, 8) side-leaning bow with tentacles trailing to the right. Row 3 has 4 surprised stickers labeled 「びっくり!」: 9) front-facing wide-eyed shocked expression with small round mouth and orange exclamation mark, 10) similar front shocked pose with two emphasis marks, 11) smaller jellyfish startled upward with vertical speed lines beneath, 12) rear/side startled jump with bubbles and vertical motion lines. Row 4 has 4 tired stickers labeled 「おつかれさま」: 13) sleepy yawning jellyfish rubbing or holding a tentacle near the mouth, 14) larger yawning pose with closed eyes and drooping tentacles, 15) exhausted front pose with half-lidded eyes, small frown, and bubbles beside the head, 16) sleepy side-lying or drifting pose with closed eyes and open yawning mouth.

Visual style: Kawaii Japanese sticker illustration, soft watercolor texture, warm coral-orange body, pale cream frilled rim, translucent tentacles, subtle highlights and blush, rounded shapes, polished digital art suitable for messaging stickers. Use consistent character design across all 16 frames.

Text content: Preserve the visible Japanese text exactly as shown: {argument name="morning text" default="おはよう!"}, {argument name="thank you text" default="ありがとう!"}, {argument name="surprise text" default="びっくり!"}, and {argument name="tired text" default="おつかれさま"}. The lettering should be thick, hand-drawn, rounded, dark brown, centered inside each bubble.

Constraints: Exactly 16 stickers, exactly 4 columns and 4 rows, no extra characters, no watermark, no English text, no frame borders around individual stickers, keep the checkerboard background visible across the whole canvas as if it were transparent.
```

> 改编自 [Maki@Sunwood AI Labs.](https://x.com/hAru_mAki_ch/status/2091362413191057575) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "漫画提示词：惊慌仓鼠黑白漫画单格，集中线 + 爆炸对话框（gpt-image-2）"
slug: panicked-hamster-manga-panel
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "4:5"
needsRefImage: false
useCase: "想做一张\"事情太多了\"的吐槽反应图时用：一只满头冷汗的仓鼠大特写，黑白网点加速度线，右上、左下两个尖刺对话框各写一句台词，可当表情包和周报配图。"
prompt: |
  画一格戏剧化的黑白日式漫画：一只可爱的[仓鼠]的大特写，位置略偏右，胸部以上入画，两只小爪子攥紧举在胸前，一副慌了神的样子。
  - 表情：又大又圆的震惊眼睛、皱成八字的担忧眉毛、张开的椭圆形嘴里露出两颗门牙，胡须清晰，左上方一只大耳朵；额头和脸颊上挂着好几滴汗；
  - 毛发：蓬松柔软，用密集的网点和细排线表现；
  - 画法：经典的高对比漫画墨线，粗黑的轮廓线、细致的点画、交叉排线，背景是横向扫过的速度线，对话框周围是爆炸状的黑色放射集中线；
  - 对话框：恰好 2 个竖排文字的尖刺形白色对话框，右上角一个瘦高的，写"[要做的事……]"；左下角一个更大的，写"[要做的事太多了……!!]"；文字用粗黑体简体中文竖排，清晰可读；
  - 氛围：焦虑又好笑，像是被一大堆待办事项压垮了；
  - 画幅[4:5]，四周一圈细黑的漫画格边框；纯黑白，除网点外不要灰色晕染；不要水印、多余角色和多余文字。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2091527401402736844
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主角动物、两句台词、画幅改为变量；日文台词换成对应的中文台词，并去掉注音小字的要求；原文写方形画布，按示例图改为 4:5。"
images:
  - 3477-panicked-hamster-manga-panel-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=32488
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：两个对话框的文字换成自己的台词，上句短、下句长效果最好，例如"周一……"和"怎么又是周一……!!"，每个对话框建议不超过 10 个字；[仓鼠] 可换成"猫""柴犬""企鹅"，换动物时把"门牙、大耳朵"等细节一并改掉；原版是方形画幅，示例图是 4:5，两种都可以。

示例图是原作者的日文版：一只满脸冷汗的仓鼠瞪圆了眼、张着嘴露出两颗门牙，两只小爪子攥在胸前；背景是横向速度线，右上和左下各有一个被黑色放射线包围的尖刺对话框，竖排写着"やることが…"和"やることが多い……!!"，四周一圈细黑边框。

**常见问题**：
- 中文字写错：减少字数，避开生僻字，并写明"简体中文、粗黑体、竖排"。
- 画面发灰：强调"纯黑白，只有网点，没有灰色渐变"。
- 表情不够夸张：加"瞳孔缩成小点，眼白占满眼眶"。

**适合**：吐槽类表情包、公众号和群聊里的反应图、周报开头的配图。

### 英文原版

```text
Create a dramatic black-and-white Japanese manga panel featuring a cute hamster in extreme close-up, centered slightly to the right, shown from chest up with tiny clenched paws raised in panic. The hamster has huge round shocked eyes, arched worried eyebrows, an open oval mouth with two front teeth, visible whiskers, one large ear on the upper left, soft fluffy fur rendered with dense screentone dots, fine hatching, and multiple sweat drops on its forehead and cheeks. Use classic high-contrast manga inking: thick black outlines, detailed stippling, crosshatching, speed lines sweeping horizontally across the background, and explosive black radial burst effects around the speech balloons. Include exactly 2 vertical Japanese speech balloons: one tall spiky white balloon at the upper right with the text {argument name="upper right speech text" default="やることが…"}, and one larger tall spiky white balloon at the lower left with the text {argument name="lower left speech text" default="やることが多い……!!"}, including small furigana-like characters beside the first kanji if possible. The composition should feel anxious and comedic, as if the hamster is overwhelmed by too many tasks. Use a square canvas with a thin black manga panel border, no color, no grayscale wash beyond screentone texture, no watermark, and no extra characters or extra text.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2091527401402736844) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

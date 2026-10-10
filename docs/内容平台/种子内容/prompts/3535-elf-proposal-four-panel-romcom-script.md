---
title: "ai四格漫画提示词：黑白竖版恋爱喜剧，按站位、表情、台词写剧本（Nano Banana）"
slug: elf-proposal-four-panel-romcom-script
model: nano-banana
topics: [comic]
modelLabel: Nano Banana Pro
aspectRatio: "9:16"
needsRefImage: false
useCase: "手里已经有一个四格段子、想让画面严格照着剧本走时用：先写类型、格式、场景和人物，再逐格写清谁在左谁在右、什么表情、说哪句话，得到一条黑白竖版四格。示例剧本是\"精灵拒绝人类告白，理由竟是怕手游停服\"。"
prompt: |
  画一条竖版四格漫画，类型是[现代奇幻恋爱喜剧]。
  格式：竖长画幅，约 9:16，四个横向长格从上到下排列，粗黑边框。黑白漫画画风，不上色，线条粗而干净，表情夸张生动，恋爱喜剧的明快语气，尽量少用灰色网点。
  场景：[现代都市的街道]。
  人物（四格里保持一致）：
  - 女主角：[长耳朵的精灵女子]，浅色长直发，穿时髦的现代便装，深色高领上衣配西装外套；
  - 男主角：[黑色短发的人类青年]，穿休闲外套。
  站位：四格里女主角始终在画面右侧，男主角始终在左侧。
  四格内容与对白：
  1. 街头。女主角抱着胳膊站着，一脸冷淡又无奈；男主角在她面前单膝跪地、递上一束花，神情拼命，而她明显在拒绝。女主角的对白："差不多该死心了，凡人。""我是不会接受人类的爱的。"
  2. 男主角捧着花拼命探身向前，背景是表现气势的集中线，旁边一个大号拟声词；女主角微微后退。男主角的对白："这年头跨种族结婚早就不稀奇了！""在爱面前，寿命和种族的差别根本不算什么！"
  3. 女主角神色阴沉下来，举起手机像是要给他看什么；男主角一脸严肃，察觉到了什么。女主角的对白："哦？看了这个，你还说得出同样的话吗？"男主角的心声写在括号里："（难道精灵小姐有什么悲伤的过去！？）"
  4. 女主角把手机举到男主角面前，眼里含着泪；男主角是侧脸，看完之后一脸不服气。两人之间放大画出手机屏幕，像恋爱游戏的官网公告一样写着："《[凡人恋爱 Online]》已停止运营"。女主角的对白："就算是你，也不想碰一款眼看就要停服的手游吧？"男主角的对白："啊……心情我懂，可这个理由我不接受啊——"
  文字：全部用简体中文，对白框竖排，粗体漫画字，清晰可读；除以上对白、拟声词和手机屏幕文字外不要其他文字。
  限制：严格四格；不要水印和签名。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/tori29umai/status/2016053138453848135
  author: "@tori29umai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的剧本式结构保留并改写为中文；日文对白改写成中文；类型、场景、两位主角、手机上的游戏名设为变量；原文写\"不用灰阶网点\"，按示例图改为\"黑白漫画、少用灰色网点\"；按示例图补充人物外形和\"粗黑边框、对白框竖排\"。"
images:
  - 3535-elf-proposal-four-panel-romcom-script-1.jpg
imageCredit:
  by: "@tori29umai"
  url: https://youmind.com/nano-banana-pro-prompts?id=7985
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[现代奇幻恋爱喜剧] 定调，[现代都市的街道] 定场景，两个人物各写一句外形；[凡人恋爱 Online] 是最后一格手机上的游戏名，也是全篇的包袱。想换故事，保留"每格写清谁在左谁在右、什么表情、说哪句话"的写法，把四格改成自己的起承转合。对白每句不超过 20 个字，一格最多两个对白框。

示例图是日文版的黑白竖条四格：第一格街头，黑发青年单膝跪地举着花束，长耳长发、穿高领衫和西装外套的精灵抱臂俯视；第二格青年捧花大喊，背后是集中线和大拟声词；第三格精灵垂着眼举起手机，青年冒着冷汗；第四格精灵眼角带泪，两人中间是放大的手机。每格左右各有竖排对白框。示例图里手机屏幕是空白的，灰色网点也比要求的多。

**常见问题**：
- 手机屏幕没字：把屏幕文字缩短到一行，并单独强调"屏幕上必须写出这行字"。
- 两人左右位置互换：每格开头都写一遍"女右、男左"。
- 出成彩色：把"黑白漫画、不上色"放到第一句。

**适合**：社媒搞笑四格、游戏和二次元社群的梗图、练习写四格剧本。

### 日文原版

```text
Genre: Modern Fantasy / Romantic Comedy
Format: Vertical 4-panel manga
Style: Bright romantic comedy tone, expressive faces, no grayscale tone expression
Setting: Modern Japanese city streets
Clothing: Modern style (Elf: stylish casual clothes + ears, Man: casual clothes)

Panel 1
Modern city streets.
An elf woman with long ears is standing with her arms crossed, looking cool and exasperated. Positioned on the right side of the screen.
In front of her, a human man is kneeling and offering a bouquet of flowers. Positioned on the left side of the screen.
The man is desperate, and the woman is clearly rejecting him.

Dialogue:
Elf Woman
“Give up already, mortal. I will never accept human love.”

Panel 2
The human man, still holding the bouquet, leans forward desperately. Positioned on the left side of the screen.
The background shows speed lines indicating intensity.
The elf is slightly backing away. Positioned on the right side of the screen.

Dialogue:
Human Man
“In this day and age, interspecies marriage is common! Differences in lifespan or species don't matter when it comes to love!”

Panel 3
The elf woman shows a dark, somber expression, making a gesture as if showing a smartphone. Positioned on the right side of the screen.
The man looks serious, sensing something. Positioned on the left side of the screen.

Dialogue:
Elf
“Hmph, look at this, and tell me if you can still say the same?”

Human Man
(Could it be that Ms. Elf has a sad past!?)

Panel 4
The elf woman shows the smartphone to the human man. Tears are welling up in her eyes. Positioned on the right side of the screen.
The man looks dissatisfied after seeing it. Profile view, positioned on the left side of the screen.

Dialogue:
Elf Woman
“Even you wouldn't want to get involved in a social game that looks like it will end service in a short time, would you?”

Background shows the smartphone screen. The screen displays: “Mortal Love Online ~Lifespan Difference Doesn't Matter☆~ Service has ended.” Styled like an official otome game website.

Human Man
“Ah, I understand the feeling, but I don't want to accept this reason~”
```

> 改编自 [@tori29umai](https://x.com/tori29umai/status/2016053138453848135) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

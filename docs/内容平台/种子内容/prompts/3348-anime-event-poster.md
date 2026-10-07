---
title: AI海报提示词：日系动漫风活动宣传海报（霓虹城市夜景 + 金色金属大字标题 + 日期条与侧边胶片格）
slug: anime-event-poster
model: gpt-image-2
topics: [poster, illustration]
needsRefImage: false
aspectRatio: "4:5"
useCase: 做线上活动、训练营、音乐节、社群挑战赛的竖版宣传图时用，得到信息层级完整的日系动漫广告海报：主视觉角色、大标题、日期条、话题标签和三个卖点图标一次排好。
prompt: |
  生成一张戏剧感强的日系动漫风活动宣传海报，竖版 4:5，细节丰富、电影感、霓虹光、高对比，像精致的社交媒体活动公告。
  - 主视觉（偏右）：一位原创动漫少女的半身像，深蓝色长发随风飘动，戴着星星发夹，穿深色连帽衫，脖子上挂着大号监听耳机；
  - 背景：夕阳过渡到夜晚的城市天际线，闪烁的灯光，音乐能量粒子、镜头光晕和发光花瓣；
  - 配色：电光蓝、紫罗兰、洋红、金色、夕阳橙；
  - 文字分 8 组，像专业活动广告一样排版：
    1. 左上标题"[开始的是你我共创的音乐故事]"，副文案一句活动介绍；
    2. 右上发光招牌"[假期限定！]"和霓虹小框"一起做最棒的音乐吧！"；
    3. 中央主标题：小号英文"[AI MUSIC BOOTCAMP 2]"，下方大号中文"[AI 音乐训练营 2]"；
    4. 画面中部巨大的金色金属质感大字"[正式开启！]"；
    5. 日期条："活动时间"＋"[5.2 周六]"→"[5.4 周一]"；
    6. 话题提示："参与很简单！带上 #[活动话题] 发帖即可！"；
    7. 鼓励语："新手也欢迎！一起享受最棒的音乐体验！"；
    8. 底部三个带图标的卖点："一起学习 结识伙伴""用 AI 创作 全新体验""把想法变成 属于自己的一首歌"；
  - 左侧边缘：竖排胶片条，4 格分别是少女在舞台演出、在制作台前、对着麦克风唱歌、弹木吉他；
  - 下方两个霓虹图标：左下倾斜的手机带音符，右下发光麦克风带音符；
  - 文字效果：光泽、发光、金白浮雕，标题周围有能量线条和火花爆闪；
  - 氛围：振奋、庆祝感、未来感、情绪上扬。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2066538267835867647
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文并拆成要点；原文的日文文案改为中文版，标题、招牌、主标题、大字、日期、话题设为变量；删去原文"人物脸部打马赛克"的要求
images:
  - 3348-anime-event-poster-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case406/output.jpg
  license: CC0 1.0
verify:
  - 中文版出一次，检查 8 组文字是否齐全、有无错字
  - 示例图是日文版，页面需提醒用户中文版排版效果可能不同
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：把活动信息逐项替换：主标题写活动名，比如"[AI 绘画挑战赛]""[暑期编程营]"；[正式开启！] 可以换成"报名开始！""限时招募！"；日期和 [活动话题] 填真实信息。人物描述也可以换，比如"短发少年、戴眼镜、穿校服"。示例图是日文版：蓝发少女站在夕阳城市前，画面中间是"AI音楽ブートキャンプ2"的银色大字和金色"開催決定！"，下方是 5.2 到 5.4 的日期条和一行话题标签，左侧一列小格是演出、制作、唱歌的场景，底部三个圆形图标卖点。

**常见问题与调整**：
- 文字太多出错：先砍到 5 组（标题、主标题、大字、日期、话题），其余后期再加。
- 主角被要求的胶片格挤小：去掉左侧胶片条，主角放大占画面一半。
- 风格太花：加"背景压暗，只保留标题区域的发光效果"。
- 想做横版 banner：画幅改 16:9，人物在右，文字区放左侧三分之二。

**适合**：线上活动 / 训练营宣传、社群挑战赛海报、动漫风音乐活动预告；用于真实活动时，日期和参与方式请以实际信息为准。

### 英文原版

```
Generate a dramatic Japanese anime-style event promotional poster in vertical 4:5 format, ultra-detailed, cinematic, neon-lit, high contrast, styled like a polished social media announcement. Center-right subject: a beautiful anime girl from the waist up, long flowing deep blue hair blowing in the wind with small star hairpins, wearing a dark hoodie with large studio headphones around her neck. Her face is softly obscured by a rectangular blur. Background: glowing sunset-to-night city skyline with sparkling lights, music-energy particles, lens flares, and glowing petals. Color palette: electric blue, violet, magenta, gold, and sunset orange.

Layer crisp Japanese typography integrated like a professional event ad with exactly 8 text groups: (1) top-left heading 「始まるのは、キミと創る 音楽の物語。」 with subcopy 「AIを使って、みんなで音楽をつくる特別な3日間。」; (2) top-right glowing marquee 「GW連休!」 and neon box 「みんなで最高の音楽をつくろう!」; (3) center title with English 「AI MUSIC BOOTCAMP 2」 above large 「AI音楽 ブートキャンプ 2」; (4) massive gold metallic text across the middle 「開催決定!」; (5) date bar 「開催期間」 with 「5.2 SAT 土」 and 「5.4 MON 月」; (6) hashtag callout 「参加はカンタン!!  をつけて投稿するだけ!」; (7) encouragement line 「初心者も大歓迎! みんなで最高の音楽体験を!」; (8) three bottom feature captions with icons: 「一緒に学ぶ 仲間とつながる」, 「AIで創る 新しい音楽体験」, 「想いをカタチに 自分だけの1曲を」.

Left edge: vertical filmstrip with 4 panels showing the girl (1) performing on stage before a crowd, (2) at a music production desk with screens, (3) singing into a mic, (4) playing acoustic guitar. Lower area: 2 neon music icons — tilted smartphone with music note (lower left), glowing microphone with musical notes (lower right). Text effects: glossy, luminous, gold and white emboss, energetic streaks and spark explosions around headline. Mood: inspiring, celebratory, futuristic, emotionally uplifting — like a high-impact Japanese Golden Week music event ad.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2066538267835867647) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

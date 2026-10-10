---
title: "ai漫画生成提示词：一张图排 8 页黑白校园恋爱短篇漫画（gpt-image-2）"
slug: morning-greeting-eight-page-romcom-manga
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "2:3"
needsRefImage: false
useCase: "想一次看到一个完整短篇的节奏时用：一张竖图里排 8 个带页码的黑白漫画小页面，每页 3～5 格，讲一个\"说不出口的那句话终于说出来\"的校园恋爱喜剧，适合做短篇预览和分镜节奏参考。"
prompt: |
  画一张黑白漫画稿：把一个 8 页的校园恋爱喜剧短篇排在同一张图上。
  整体：竖版 2:3，干净的少年 / 青年向恋爱喜剧漫画画风，黑色墨线加灰阶网点，教室里柔和的光，表情丰富，脸红、汗滴、对白框俱全，像印刷好的漫画成品。
  版式：整张图分成 2 列 4 行共 8 个小页面，页与页之间留白，每个小页面左下角标一个数字 1～8，先左后右、从上到下编号；每页内部再分 3～5 个大小不一的分格，特写和中景交替。
  地点与时间：[高中教室和走廊]，[清晨上课前]。
  人物：
  - 男主角：[浅色短乱发的害羞男生]，穿校服衬衫，容易慌张，动不动就脸红、瞪大眼睛；
  - 女主角：[黑色长直发、戴发箍的温柔女生]，头发有光泽高光，大眼睛，校服配蝴蝶结，笑容从容又亲切；
  - 同学：约 8 个穿夏季校服的男生女生，在教室背景里聊天。
  故事：男生一直没法好好地对喜欢的女生说出"[早上好]"。女生温柔地鼓励他、逗他，提议两个人一起说；最后他们大声向全班问好，全班都回应了。
  8 页内容：
  1. 教室全景，很多同学坐在座位上，旁白框："清晨的教室有一点冷。"低着头的男生小声说出那句问候，没人听见；书包放到课桌上的手部特写，配一个拟声词。
  2. 女生凑近回了一句问候；男生震惊、脸红；女生笑着说"你刚才说了吧""我可是听得清清楚楚哦"。
  3. 脸红的男生特写；女生闭眼微笑："说得很好嘛。"一格柔光闪点的空镜，旁白："好像……也没那么糟。"
  4. 女生侧脸："你每天都有说吧？"男生紧张地反问："你听到了？"女生："多可惜呀，好好传过去的话，明明会有人回应的。"最后一格是她直视他的特写。
  5. 男生大特写："要是……没人听见呢——"女生："那么——"一格闪光的转场，女生问："要不要一起说说看？"
  6. 走廊窗边的双人镜头，男生："大概不行……"女生："没事的。"女生把手指放在唇边的特写："有我在呢。"
  7. 拉开教室门的动感一格，配大号拟声词；两人并肩站在门口，女生小声喊"预备——"；最后一大格两人一起大喊："[早上好]！"
  8. 全班同学纷纷回应问候的群像；女生笑着说"你看吧"；男生愣住、脸红，随后松了口气露出微笑；结尾旁白："好好地传到了。"右下角小字"[完]"。
  文字：全部用简体中文，对白框竖排，从右往左读；包含对白框、少量旁白框、页码 1～8 和结尾字样。
  画质：专业漫画原稿的精度，网点干净，对白框位置清晰易读，强调眼神交流、脸红反应和恋爱的紧张感。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/yume00112211/status/2047809772892917936
  author: "@yume00112211"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文是 JSON，改写为分条的中文描述；原文只给了每格的英文画面提示并要求日文对白，这里按故事线补写了中文对白与旁白；地点、时间、两位主角、那句问候语、结尾字样设为变量；删去原文\"女主角脸部在部分特写中打码\"的设定（示例图中面部为正常绘制）。"
images:
  - 3529-morning-greeting-eight-page-romcom-manga-1.jpg
imageCredit:
  by: "@yume00112211"
  url: https://youmind.com/gpt-image-2-prompts?id=15822
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[早上好] 是全篇的"那句话"，可以换成"谢谢你""明天见""对不起"，故事逻辑不用动；两个主角各写一个最醒目的特征（发色、发型、饰品），模型才能在三十多个分格里画成同一个人；地点和时间换成"社团活动室、放学后"也成立；[完] 是结尾小字。想讲别的故事，保留 8 页结构逐页重写，每页只写一个情绪节拍。

示例图是日文版：一张竖图里排着两列四行共 8 个黑白小页面，各自标着 1～8。第 1 页是教室全景和放书包的手部特写，第 2～6 页多是浅发男生脸红冒汗的特写和黑长直、戴发箍女生的微笑近景；第 7 页是拉门的大拟声词和两人齐声问好的大格；第 8 页是同学们回应的群像和男生松一口气的笑脸。

**常见问题**：
- 小字糊成一片：单页格数减到 3 格，对白每句不超过 8 个字；或改成一次只出 2 页，分 4 次生成。
- 页码顺序乱：重申"先左后右、从上到下编号"。
- 女主角每页长相不同：把发箍、蝴蝶结在各页描述里重复一遍。

**适合**：短篇漫画的整体预览、分镜节奏练习、给小说片段配一组连续漫画；要印刷级单页请逐页生成。

### 英文原版

```text
{"type":"black-and-white manga page","style":"clean shonen/seinen romantic comedy manga, grayscale screentones, inked line art, soft classroom lighting, expressive faces, blushing, sweat drops, speech bubbles, Japanese text, polished printed manga layout","format":"single page with 8 numbered sections arranged in a 2-column grid","setting":{"location":"Japanese high school classroom and hallway","time":"morning before class"},"characters":[{"role":"male lead","appearance":"teenage boy, short messy light hair, school uniform shirt, shy and easily flustered, frequent blush, startled wide eyes"},{"role":"female lead","appearance":"teenage girl, long straight dark hair with glossy highlights, large gentle eyes, school uniform with ribbon, calm and affectionate smile, face intentionally obscured or blurred in a few close panels"},{"role":"classmates","count":8,"appearance":"high school boys and girls in summer uniforms, chatting in background classroom panels"}],"layout":{"sections":[{"title":"1","position":"top-left","count":4,"labels":["wide classroom establishing shot with many students at desks","close-up of embarrassed boy saying good morning","mid shot from doorway with girl arriving and a school bag on desk","close-up of hand placing bag on desk with sound effect"]},{"title":"2","position":"top-right","count":5,"labels":["close-up of girl greeting him, face obscured","close-up of shocked blushing boy","girl smiling and saying he should say it now","girl smiling and telling him to answer properly"]},{"title":"3","position":"middle-left","count":4,"labels":["close-up of blushing boy","girl close-up with obscured face saying it was okay","soft sparkly atmospheric panel","narration box implying maybe it was not that bad"]},{"title":"4","position":"middle-right","count":5,"labels":["side view of girl saying he should say it every day","boy reacting nervously","girl teasing that it is a waste","girl smiling and saying she returns it properly","close-up of girl looking directly at him"]},{"title":"5","position":"lower-middle-left","count":4,"labels":["extreme close-up of blushing boy saying if she does not mind","close-up of girl saying then okay","sparkly transition panel","girl asking if they should say it together"]},{"title":"6","position":"lower-middle-right","count":4,"labels":["two-shot in hallway or by windows, boy saying maybe impossible","girl replying that it is fine","girl close-up with finger near lips","girl saying she will do it too"]},{"title":"7","position":"bottom-left","count":3,"labels":["window-side motion panel with sudden movement sound effect","small two-shot of boy and girl standing together, girl face obscured","large energetic close-up of both shouting good morning together"]},{"title":"8","position":"bottom-right","count":5,"labels":["classroom group panel with classmates replying good morning","boy and girl side by side, girl saying see","boy stunned and blushing","soft close-up of relieved boy smiling","ending caption box"]}],"numbered_sections":8},"story":"A shy boy struggles to say good morning to a girl he likes. She gently encourages him, teases him, and suggests they say it together. In the final beat, they greet the whole class out loud and the class responds.","text":{"language":"Japanese","include":["speech bubbles","small narration boxes","section numbers 1 to 8","an ending caption"],"do_not_translate":true},"composition":"authentic manga page design with varied panel sizes, alternating close-ups and medium shots, emotional pacing, heavy emphasis on eye contact, blush reactions, and romantic tension","quality":"high-detail professional manga manuscript, crisp tones, readable bubble placement, print-ready page"}
```

> 改编自 [@yume00112211](https://x.com/yume00112211/status/2047809772892917936) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

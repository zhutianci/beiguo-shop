---
title: "ai绘本生成提示词：蔬菜拟人九宫格儿童漫画，西红柿和花菜一起做菜（gpt-image-2）"
slug: veggie-friends-nine-panel-kids-comic
model: gpt-image-2
topics: [comic, illustration, food]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给小朋友讲\"两种食材变成一道菜\"的小故事时用：两样蔬菜变成 Q 版小伙伴，3×3 九格带编号和中文旁白，从菜市场相遇、洗切下锅到出锅品尝，最后还有一个\"超级英雄梦\"的彩蛋。"
prompt: |
  画一幅适合幼儿看的九宫格故事漫画：把菜市场里普通的[西红柿]和[花菜]变成一对可爱的拟人小伙伴，一起做成一道菜。
  角色：甲是一个[西红柿]，乙是一棵[花菜]，都画成 Q 版拟人形象，有脸、有小手小脚和丰富的表情，同时保留各自一眼认得出的外形和颜色。如果上传了这两种食材的照片，以照片里的外形和颜色为准，但不要保留原照片的背景。
  版式：1:1 方图，3×3 共恰好 9 格，圆角边框；每格左上角一个深色圆形数字编号 1～9，上方一个米色圆角旁白框，角色说话时再加白色对白气泡。
  画风：精致的绘本动画风，暖色的市场和厨房灯光，色彩明亮，点缀星星闪光和小爱心，光线柔和有电影感；整体欢快、带一点科普味，适合低龄儿童。
  9 格的画面和文字（简体中文，逐字写在画面上）：
  1. 菜摊前两人初次见面。旁白："在菜市场里，[西红柿]和[花菜]相遇了。"对白："你好呀！""嗨~"
  2. 甲歪着头，头顶一个问号。旁白："[西红柿]好奇地问：你为什么长得像小树呀？"乙回答："因为我有花椰朵朵呀~"
  3. 两人举手欢呼，背景是放射光。旁白："我们一起做菜吧！[西红柿]提议。"对白："好呀好呀！"
  4. 两人戴上厨师帽，在案板前切菜。旁白："他们洗干净、切一切，准备大显身手！"
  5. 铁锅里翻炒，火苗窜起、香气四溅。旁白："下锅啦~滋滋滋——香味四溢！"
  6. 一大盘成品端上桌。旁白："色香味俱全的[西红柿炒花菜]出锅啦！"
  7. 两人拿着小勺品尝，一脸幸福，冒出小爱心。旁白："尝一口，嗯~真好吃！"
  8. 夕阳下并肩而坐的背影。旁白："从此，他们成了最好的朋友！"
  9. 粉色的梦境云朵里，两人披着小披风变成超级英雄。旁白："他们还有一个小小的梦想：成为[超级美味料理侠]！"
  限制：严格 9 格，编号从左到右、从上到下；两个角色在每一格里的长相保持一致；除以上文字外不要其他文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Adam38363368936/status/2053470954471510373
  author: "@Adam38363368936"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分条；原文要求上传两张食材照片作参考，改为直接用文字指定两种食材（上传照片作为可选项保留）；两种食材、菜名、结尾称号设为变量；九格的中文文案沿用原文并逐格补上了对应的画面描述；按示例图补充\"左上角圆形编号、米色旁白框\"。"
images:
  - 3528-veggie-friends-nine-panel-kids-comic-1.jpg
imageCredit:
  by: "@Adam38363368936"
  url: https://youmind.com/gpt-image-2-prompts?id=19530
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[西红柿] 和 [花菜] 换成任意两种食材，如"鸡蛋和韭菜""土豆和牛肉"；[西红柿炒花菜] 是第 6 格的菜名，[超级美味料理侠] 是结尾的梦想称号。第 2 格那句"为什么长得像小树"是专门为花菜写的，换食材时要改成对应的外形梗（如"你为什么圆滚滚的"）。也可以像原作者那样上传两张食材实拍当参考，每张只拍一种、背景干净。

示例图是 3×3 的暖色九宫格：每格左上角一个深色圆形编号，上方一个米色旁白框；圆滚滚的西红柿和花菜长着大眼睛和小手小脚，依次是菜摊初遇、提问、欢呼、戴厨师帽切菜、翻炒、出锅、品尝、夕阳背影，最后是粉色梦境里披披风的两位"料理侠"。中文旁白基本正确，第 3 格多出了两个引号。

**常见问题**：
- 文字多了符号或错字：把每格旁白缩到 12 个字以内，去掉句中的引号。
- 第 8 格角色没有脸：背影格容易这样，改成"并肩坐着、侧脸看夕阳"。

**适合**：幼儿园食育课、亲子厨房的趣味步骤图、绘本练习、餐饮账号的轻科普；不适合当正式菜谱（没有用量和火候）。

### 英文原版

```text
Using REFERENCE_0 as the cauliflower character source and REFERENCE_1 as the tomato character source, transform the ordinary market produce into a cute children's anime story comic. Anthropomorphize one red tomato and one white cauliflower as expressive chibi friends with faces, arms, legs, and lively emotions, while keeping their recognizable vegetable shapes and colors. Create a warm 3x3 storyboard grid with exactly 9 numbered panels, rounded borders, cozy market/kitchen lighting, speech bubbles and narration boxes, in a polished picture-book anime style. The story should show them meeting in the vegetable market, becoming friends, washing and preparing ingredients, cooking together in a pan, creating a colorful tomato-cauliflower dish, tasting it, and ending with a dream of becoming tiny super-chef heroes. Include the following 9 panel texts in Chinese as visible captions/dialogue: {argument name="nine panel Chinese story text" default="1 在菜市场里，西红柿和花菜相遇了。 你好吗！ 嗨~ | 2 西红柿好奇地问：‘你为什么长得像小树呀？’ 因为我有花椰朵朵呀~ | 3 ‘我们一起做菜吧！’ 西红柿提议。 好呀好呀！ | 4 他们洗干净，切一切，准备大显身手！ | 5 下锅啦~滋滋滋——香味四溢！ | 6 色香味俱全的‘西红柿炒花菜’出锅啦！ | 7 尝一口，嗯~真好吃！ | 8 从此，他们成了最好的朋友！ | 9 他们还有一个小小的梦想：成为超级美味料理侠！"}. Make the tone cheerful, educational, and suitable for young children, with bright colors, sparkles, hearts, and soft cinematic lighting. Use the reference images only as ingredient inspiration; do not keep the original photo background except where reimagined as a cozy illustrated vegetable market.
```

> 改编自 [@Adam38363368936](https://x.com/Adam38363368936/status/2053470954471510373) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

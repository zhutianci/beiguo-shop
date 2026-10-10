---
title: "ai书法字体提示词：同一句话五种名家书风对照表，宣纸 + 名签 + 红印（gpt-image-2）"
slug: calligraphy-five-masters-style-comparison-sheet
model: gpt-image-2
topics: [logo, poster, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给店名、标题或一句口号挑书法字体时用：把同一行字用五种历史名家的书风各写一遍，自上而下排在一张宣纸上，左边是名签、右边盖小红印，一眼比较哪种气质最合适。"
prompt: |
  生成一张书法风格对照表：把同一句话"[视觉新时代]"用五种不同的历史书风各写一遍，竖版 3:4。
  - 纸面：暖调的米白色宣纸，能看到细微的纤维、轻微的泛黄和不均匀的色调。
  - 版式：自上而下 5 个横排，行与行之间用很淡的细线隔开；每行最左边是一枚窄长的米色竖名签，用黑色小字竖写书家名；中间是用毛笔写的大字短语，横向居中；最右边盖一枚小小的红色方印。全表共 5 个名签、5 枚印章。
  - 五行的书风（自上而下）：
    1. 名签"王羲之"——行书，笔势流畅、有连带；
    2. 名签"宋徽宗"——瘦金体，笔画细劲、转折锋利、字距疏朗；
    3. 名签"赵孟頫"——行楷，端正圆润、秀雅；
    4. 名签"颜真卿"——楷书，笔画粗壮厚重、结体宽博；
    5. 名签"苏轼"——行书，字形偏扁、笔墨丰腴、率意。
  - 墨色：浓黑的墨，能看到飞白、洇墨、提按的轻重变化和自然的收笔。
  - 文字要求：五行都写同一句话，统一使用[简体字]，字形准确，不能缺笔或写成别的字。
  - 气质：像博物馆里的研究图版，四周留白宽裕，行距均衡；正面平视的扫描件质感，柔和均匀的光线，没有生硬阴影；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ZHO_ZHO_ZHO/status/2046852355535274063
  author: "@ZHO_ZHO_ZHO"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条中文；要写的短语保留为变量，五位书家及其书风描述整理成可替换的清单；补充了\"用简体还是繁体要写明\"的要求"
images:
  - 3574-calligraphy-five-masters-style-comparison-sheet-1.jpg
imageCredit:
  by: "@ZHO_ZHO_ZHO"
  url: https://youmind.com/gpt-image-2-prompts?id=14448
  license: CC BY 4.0
verify:
  - "五行书风只是模型对各家风格的近似，不等于真迹或标准字帖；示例图里\"视觉\"二字出现了简繁与日文字形混用，第三行名签下方有一处小墨渍，正文已说明"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[视觉新时代] 换成你要比较的字，3～6 个字最合适，笔画特别复杂的字容易写错；[简体字] 可以改成"繁体字"，一定要写明，否则模型常常简繁混用。五位书家可以按需要增删或替换，例如换成"欧阳询（楷书，险峻瘦硬）""米芾（行书，欹侧跳宕）"，每行保留"名签 + 书体 + 两三个特征词"的写法。

示例图是一张米色宣纸上的五行大字：第一行是行书，第二行明显是细瘦锋利的瘦金体，第三行秀润端正，第四行笔画最粗最重，第五行字形偏扁、墨色浓；每行左边有竖写的名签，右边一枚小红印。可以看到"视觉"两个字在各行里写法不一致（有的是繁体，有的是日文字形），第三行名签下方还有一处小墨渍——这正是需要自己核对的地方。

**常见问题**：
- 简繁混用、个别字写错：在提示词里逐字注明，如"视（简体，见字旁）"，或减少字数。
- 五行风格差别不明显：把每行的特征词写得更极端，如"极细""极粗""明显连笔"。
- 名签小字出错：名签只写两个字的姓名，或后期自己加。

**适合**：店招、标题和海报字体的风格选型，书法兴趣入门的直观对比。成图只是 AI 对各家书风的近似，不能当作字帖或真迹临本，正式使用请找书法作者书写或使用正版字库。

### 英文原版

```text
{"type":"Chinese calligraphy comparison sheet","subject":"the same five-character phrase written in five different historical calligraphy styles","phrase":"{argument name=\"calligraphy text\" default=\"视觉新时代\"}","canvas":{"orientation":"vertical poster","background":"warm off-white xuan paper texture with subtle fibers, light aging, and soft uneven tone"},"layout":{"structure":"5 horizontal rows separated by faint thin divider lines","row count":5,"left labels count":5,"seal count":5,"left labels":["王羲之","宋徽宗","赵孟頫","颜真卿","苏轼"],"rows":[{"position":"top row","style":"semi-cursive running script inspired by Wang Xizhi","main text":"视觉新时代","label":"王羲之","seal":"small red square seal at far right"},{"position":"second row","style":"slender elegant calligraphy inspired by Emperor Huizong's thin-gold script, with sharp angular strokes and airy spacing","main text":"视觉新时代","label":"宋徽宗","seal":"small red square seal at far right"},{"position":"third row","style":"refined regular-running script inspired by Zhao Mengfu","main text":"视觉新时代","label":"赵孟頫","seal":"small red square seal at far right"},{"position":"fourth row","style":"bold weighty regular script inspired by Yan Zhenqing","main text":"视觉新时代","label":"颜真卿","seal":"small red square seal at far right"},{"position":"bottom row","style":"expressive robust running script inspired by Su Shi","main text":"视觉新时代","label":"苏轼","seal":"small red square seal at far right"}],"left label design":"each row has one narrow vertical beige name plaque aligned on the far left with black Chinese characters","centerpiece":"large black brush-written phrase centered in each row"},"style":{"ink":"deep black sumi ink with visible dry-brush texture, feathering, pressure variation, and natural brushstroke taper","mood":"scholarly, experimental, museum-sheet presentation","composition":"clean spacious margins, balanced row spacing, flat front-facing scan or photographed document"},"quality":{"detail":"high-resolution, crisp brush textures, realistic paper grain","lighting":"soft even studio lighting with no harsh shadows"}}
```

> 改编自 [@ZHO_ZHO_ZHO](https://x.com/ZHO_ZHO_ZHO/status/2046852355535274063) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

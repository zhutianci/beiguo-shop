---
title: 壁纸提示词：宋画意境水墨山水竖幅，云雾留白 + 山亭瀑布 + 题字印章
slug: chinese-ink-landscape-wallpaper
model: gpt-image-2
topics: [wallpaper, illustration]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做国风手机壁纸、茶室 / 书房装饰画、国学课件或中式品牌海报底图时，生成一张宣纸质感的传统水墨山水：层层远山、云雾留白、山亭小桥，配竖排题字和朱红印章。
prompt: |
  一幅传统中国水墨山水画，描绘云雾缭绕的群山，画在泛黄的旧宣纸上。
  - 层次：山峦层层向远处退去，墨色由浓到淡——前景山峰用浓墨、笔触锐利，中景山峦用中等淡墨，远山几乎消融在浅灰色的雾气里；
  - 点景：半山悬崖上立着一座[传统小亭]，一个小小的孤独人影正走过瀑布上方的[木桥]；
  - 草木：松树的枝干带着书法般的笔意，云雾在山峰间流动，用留白表现云；
  - 题款：左下角一方朱红篆刻印章，右上角一列竖排草书题字"[山高水長]"；
  - 纸张：淡淡的暖米色，可见纸张纤维纹理；
  - 意境：宋代山水画传统——沉静、克制、大量留白，每一笔都可见笔墨气韵。
  画幅[2:3] 竖版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ink-and-chinese.md
  author: "EvoLinkAI"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并按层次 / 点景 / 题款 / 纸张拆成要点；点景建筑、桥、题字、画幅设为变量；原文点名的古代画家改为"宋代山水画传统"的风格描述
images:
  - 3235-chinese-ink-landscape-wallpaper-1.jpg
imageCredit:
  by: "EvoLinkAI"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/ink-chinese/ink-landscape.png
  license: MIT
verify:
  - 原始出处：原帖：https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts，核对原帖仍可访问、作者未另行声明保留权利
  - 示例图印章文字无法辨认，题字是"山高水長"四字；换其他题字时检查书法字形是否正确
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[传统小亭] 可以换成"山间草庐""古寺塔影""临水茅屋"；[木桥] 换成"石阶小径""江上孤舟"；题字 [山高水長] 换成四字以内的词，如"[清风徐来]""[宁静致远]""[松风]"，字越少越容易写对。想要彩色版可以加"淡设色，石青石绿点染山头"。示例图是竖幅：浓墨的前景山崖上立着一座小亭，中间瀑布上横着一座木桥，桥上有个小人影，远处群山被雾气隔成一层层淡灰，右上角竖写"山高水長"四个字，左下角是一方红色印章，整张纸是米黄色带纤维纹理。

**常见问题与调整**：
- 像照片加滤镜：强调"毛笔水墨画，有飞白和墨晕，不要写实光影"。
- 题字写错或成乱码：减少到两个字，或改成"不出现文字，只保留印章"。
- 画面太满没有留白：加"画面三分之一以上是空白的云雾和天空"。
- 想做电脑壁纸：画幅改 16:9，改成"横卷式构图，山势从左向右延展"。

**适合**：国风手机壁纸、书房 / 茶室装饰画、国学课件与中式品牌海报底图；不适合冒充古代名家真迹。

### 英文原版

```
A traditional Chinese ink-wash (水墨) landscape painting of mist-shrouded mountains, rendered on aged xuan rice paper. Layered mountain ranges receding into distance through gradations of black ink — bold dark foreground peaks with sharp brushwork, mid-ground ranges in medium wash, far peaks almost dissolved into pale grey mist. A single traditional pavilion perched on a cliff midway up, a small solitary figure crossing a wooden bridge over a waterfall. Pine trees with calligraphic branches, curling cloud-mist flowing between peaks (留白 negative-space clouds). A vertical seal stamp in red (篆刻 zhu-wen style) bottom-left, a vertical column of calligraphic characters reading "山高水長" top-right in elegant caoshu (草書) brushwork. Paper has faint warm beige tone with visible fiber texture. Aesthetic in the tradition of 范寬 Fan Kuan / 馬遠 Ma Yuan Song-dynasty landscape painting — contemplative, restrained, deep negative space, brush-energy (气韵) visible in every stroke.
```

> 改编自 [EvoLinkAI](https://github.com/EvoLinkAI/awesome-gpt-image-2-prompts) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。

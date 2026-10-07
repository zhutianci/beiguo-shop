---
title: 壁纸提示词：国风宋代夜市水墨手卷，拱桥灯船和可读的毛笔招牌字（gpt-image-2）
slug: song-night-market-handscroll
model: gpt-image-2
topics: [illustration, wallpaper]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做国风壁纸、传统节日推文头图、历史文化类内容配图时，生成一张工笔细节 + 水墨氛围的横版夜市长卷，画面里还能出现"茶""书""面"这类可读的毛笔招牌。
prompt: |
  生成一幅横版中国水墨长卷：[宋代河畔夜市]。
  - 笔法：建筑细节达到工笔水准，整体氛围用松动的水墨晕染；
  - 画面元素：石拱桥、[挂灯的小船]、茶楼的回廊阳台、书摊、冒着热气的面摊、灯下读书的书生、追着纸兔子跑的孩童，远处城墙隐入薄雾；
  - 店招：画中出现几块清晰可读的毛笔字招牌："[茶]""[书]""[面]""[灯市]"；
  - 配色：浓淡墨色为主，灯笼的暖赭色，少量朱砂印章，月光是淡淡的蓝灰；
  - 构图：像一幅连续展开的手卷，人群成组有节奏地分布，河面留出大片空白；
  - 避免现代物件、动漫脸、乱写的假书法、过饱和的海报式打光。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ink-and-chinese.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；朝代场景、船只、店招文字、画幅设为变量；补充了常见问题与改法
images:
  - 3242-song-night-market-handscroll-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/ink-chinese/song-night-market-scroll.png
  license: MIT
verify:
  - 示例图左上角题款是模型生成的小字，难以辨认，展示时不要宣称是真实题跋
  - 换成"元宵灯会""端午龙舟"各出一次，看招牌字是否仍然准确
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[宋代河畔夜市] 可以换成"唐代长安西市""明代江南水乡元宵灯会"；店招文字建议每块只写一两个字，例如"酒""药""糖"；[挂灯的小船] 可换成"画舫""乌篷船"。示例图是仓库作者的出图：画面中央一座石拱桥横跨河面，桥上桥下挤满行人和灯船，天上一轮满月，左边茶楼挂着"茶""面"招牌，右下角有"灯市"，人群里能看到一只白色纸兔子。

**常见问题与调整**：
- 招牌字写错或变成乱码：减少招牌数量，并写"每块招牌只有一个汉字，楷书"。
- 太像彩色海报：强调"以水墨为主，设色只用淡赭和朱砂，整体灰度高"。
- 人物像动漫：加"人物用传统工笔白描画法，比例写实，面部简笔"。
- 想做竖版：改成"竖轴立轴构图，近景茶楼，远景城墙和月亮"，画幅 9:16。

**适合**：国风壁纸、传统节日推文头图、历史文化科普配图；不适合当作真实古画或史料引用。

### 英文原版

```
Create a horizontal Chinese ink-and-wash handscroll scene of a Song dynasty riverside night market. Use gongbi-level architectural detail combined with loose ink atmosphere: arched stone bridge, lantern boats, teahouse balconies, book stalls, noodle steam, scholars reading under lamps, children chasing paper rabbits, and distant city walls fading into mist. Add small readable Chinese shop signs in brush style: "茶", "书", "面", "灯市". Palette: black ink, warm lantern ochre, muted cinnabar seals, and pale blue-gray moonlight. Composition should read as a continuous scroll with rhythmic clusters of people and negative-space water. Avoid modern objects, anime faces, fake calligraphy clutter, and overly saturated poster lighting.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

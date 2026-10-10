---
title: "海报提示词：独立短片影展拼贴海报，手绘涂鸦 + 胶片条 + 打字机字体的复古 zine 风（即梦）"
slug: indie-short-film-festival-zine-poster
model: jimeng
topics: [poster, illustration]
modelLabel: Seedream 4.5
aspectRatio: "2:3"
needsRefImage: false
useCase: "给校园影展、独立放映会、社团短片征集做一张有\"手作感\"的宣传海报：撕纸色块拼贴、手绘摄影机和场记板、一条装着老照片的胶片，配打字机字体的标题和时间地点。"
prompt: |
  一张古怪有趣、独立气质的短片影展海报，竖版 2:3。
  - 整体是手工拼贴：撕边的色纸块做背景，配色限制在[芥末黄、橘红、灰蓝、米白]四种以内，带旧纸张纹理，复古 zine（独立小册子）的感觉；
  - 拼贴元素：手绘涂鸦风的老式电影摄影机、场记板、几颗手画的星星；一条弯曲的电影胶片从左侧穿过画面，胶片格里是棕褐色的老照片；右下角贴一张黑白的老电影院外观照片；
  - 文字：顶部是大标题"[独立短片展]"，用打字机字体；标题下面两行小字写"[11月15日—20日]"和"[城市艺术影院]"；最底部一行手写感标语"[小短片，大想法]"；
  - 字体混用打字机体和手写体，像自己动手剪贴出来的；
  - 气质：有创意、不走寻常路、吸引艺术影院的观众；不要写实大片感，不要多余的 Logo。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-10-quirky-independent-short-film-festival-poster
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；影展名称、日期地点、底部标语、配色设为变量；按示例图补充了撕纸色块、摄影机 / 场记板 / 星星涂鸦、胶片条里的棕褐色老照片和老影院照片等具体元素"
images:
  - 3400-indie-short-film-festival-zine-poster-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359726468_zopie3_4d8e818fd456103fde0de05f3d0f862ec8a451a32e6ec72f0dba56f5346c6fd2-600x900.png
  license: CC BY 4.0
verify:
  - "示例图里影院招牌上的英文是乱码，属正常现象；换成中文标题时在即梦里看一下打字机风中文字体是否稳定"
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[独立短片展] 换成你的活动名，如"毕业短片放映夜""纪录片周"；日期和地点各一行，写短一点更不容易出错；[小短片，大想法] 是底部标语，可以换成"带上朋友来看片"。配色想更冷静可以改成"墨绿、米白、砖红"。

示例图是英文版：米黄和橘色的撕纸色块上，顶部打字机字体写着"Indie Shorts Collective"和日期地点，中间是手绘的黑色摄影机和场记板，一条胶片斜穿画面，格子里是三张棕褐色人像老照片，右下角是一张黑白老影院照片，底部写"Short Films, Big Ideas"，四周散落几颗手画星星。

**常见问题**：
- 画面里小字是乱码（如影院招牌）：这是装饰性文字，介意的话加"照片里的招牌不出现可读文字"。
- 中文标题变成普通黑体：强调"仿打字机的等宽中文字体，墨迹略有晕染"。
- 拼贴太满太乱：把元素减到"摄影机、胶片、影院照片"三样，并加"保留三分之一留白"。
- 想放嘉宾或片单：另起一行小字，控制在 3 个名字以内。

**适合**：校园影展、放映会、社团招新、独立书店活动海报；需要严肃正式感的官方活动不合适。

### 英文原版

```text
A quirky and independent-style poster for a short film festival. The design is a collage of hand-drawn doodles, film strips, and vintage photographs. The typography is a mix of different typewriter and handwritten fonts, giving it a DIY, zine-like feel. The color palette is limited and has a retro vibe. The poster should look creative, unconventional, and appeal to an arthouse audience. –ar 2:3
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-10-quirky-independent-short-film-festival-poster) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

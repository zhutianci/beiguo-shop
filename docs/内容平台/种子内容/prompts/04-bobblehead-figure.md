---
title: gpt-image-2 手办提示词：照片变摇头公仔收藏手办
slug: bobblehead-figure
model: gpt-image-2
topics: [figurine]
aspectRatio: "4:5"
needsRefImage: true
useCase: 用本人照片生成"大头小身"的摇头公仔手办效果图，适合做纪念礼物、团队毕业照、个人头像。
prompt: |
  根据我上传的参考照片，生成一张照片级真实的棚拍图：一个按照片中人物定制的摇头公仔收藏手办（大头小身）。外貌只以参考照片为准，不要套用任何人的既有形象。
  相似度：
  - 脸型、眼型、鼻子、嘴唇、肤色与参考照片一致，不要美化或简化；
  - 发型、发量、卷度与参考照片一致，不要拉直或改发型；
  - 胡须、眼镜、耳饰、帽子只在照片里有时才加，没有就不加。
  造型：经典摇头公仔比例，头大身小，脖子短粗，看不到弹簧或关节；不是大眼潮玩风格，也不是夸张漫画风。服装为[白色运动服]。
  姿势与底座：站立，一只脚踩在[足球]上；下方是两层底座，顶层为哑光仿草皮质感，不反光；底座正面用干净的白色字体印上"[名字]"。
  背景与光线：背景是虚化的[运动场]，暖金色黄昏光，手办清晰突出。
  画幅：4:5 竖版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/SaasJunctionHQ/status/2070943717238919211
  author: "@SaasJunctionHQ"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文并精简；原文面向"任意球员"并要求穿对应国家队球衣，本站改为用本人照片，删除与真实球员、国家队队服相关的要求，服装、道具、名字、背景改为变量
imageBrief: 用站长本人（或已同意的同事）一张全身或半身照作输入；输出 2 张：足球 + 运动场一版，"[足球]"换成"篮球"、"[运动场]"换成"体育馆"一版。
verify:
  - 在 gpt-image-2 上实测 3 次，记录相似度和底座文字是否正确
  - 中文名字印在底座上是否清晰，必要时改用拼音
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[白色运动服]、[足球]、[运动场] 三个变量配套改，例如"篮球服 / 篮球 / 体育馆""西装 / 奖杯 / 颁奖台"；[名字] 写 2–4 个字或英文名。

**常见失败与调整**：
- 做成了大眼潮玩：保留"不是大眼潮玩风格"这句。
- 自动加了眼镜或胡子：原图没有的配饰，提示词里已要求"不加"，仍出现就重新生成。
- 底座文字错：中文字少一点更稳，或改用英文、拼音。

**适合 / 不适合**：适合本人或已获同意的家人朋友。不要用明星、运动员等真实公众人物的照片，会涉及肖像权。

> 改编自 [@SaasJunctionHQ](https://x.com/SaasJunctionHQ/status/2070943717238919211) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

---
title: nano banana 等轴测房间提示词：生成"我在家办公"的 3D 小房间插画（可当头像 / 封面）
slug: isometric-home-office
model: nano-banana
topics: [interior, illustration, character]
needsRefImage: false
aspectRatio: "1:1"
useCase: 想要一张代表自己工作状态的可爱 3D 小房间插画——几台显示器、书架、宠物、绿植——用作个人主页封面、公众号头图、团队介绍或居家办公桌面规划。
prompt: |
  生成一张 3D 等轴测（isometric）彩色插画：我在家办公的场景，房间里摆满各种室内细节。
  关于我：[程序员，戴眼镜，短发]；工作习惯与物品：[3 台显示器、比熊犬、满墙书架]。
  房间是从斜上方 45° 俯视的切面小房间（只有两面墙和地板），家具和物品摆放合理、细节丰富：书桌、椅子、显示器、键盘、绿植、地毯、墙上的软木板和便签。
  视觉风格：圆润、精致、俏皮，柔和的光影和温暖的配色，像高品质的 3D 图标。
  画幅 1:1。
negativePrompt: null
source:
  repo: ZeroLu/awesome-nanobanana-pro
  url: https://x.com/dotey/status/1995944319677554985
  author: "@dotey"
  license: MIT
  licenseUrl: https://raw.githubusercontent.com/ZeroLu/awesome-nanobanana-pro/main/LICENSE
  changes: 原文依赖聊天记忆（"根据你对我的了解"），本站改为显式填写"关于我"和"物品"两个变量；补充切面小房间的构图与家具细节
images:
  - 199-isometric-home-office-1.jpg
imageCredit:
  by: "@dotey"
  url: https://x.com/dotey/status/1995944319677554985
  license: MIT
verify:
  - 上传一张自拍并要求"人物参考自拍"实测，看人物相似度
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：在两个方括号里写上你的特征和桌面上最有代表性的物品（越具体越像你：机械键盘、手办、猫爬架、吉他、画板……）。想让小人更像自己，可以额外上传一张自拍，并加一句"人物形象参考上传的照片"。示例图是原作者按"比熊犬 + 3 台显示器"生成的结果。

**原版的小技巧**：原作者在开启了记忆的 AI 聊天里直接写"根据你对我的了解"，让模型自己从过往对话里提取你的职业和爱好——如果你在 Gemini 里开启了个性化 / 记忆功能，也可以这样试试。

**常见问题**：
- 东西太多显得乱：物品控制在 4～6 件；
- 风格太"儿童"：把"俏皮"改成"简洁、低饱和、北欧风"；
- 想做团队版：每人一张，固定画幅和配色，拼成"我们的工位"系列图。

**适合**：个人主页、社媒头图、团队介绍页、居家办公桌面布置灵感。

### 英文原版

```
Based on you know about me, generate a 3D isometric colored illustration of me working from home, filled with various interior details. The visual style should be rounded, polished, and playful. --ar 1:1

[Additional details: a bichon frise and 3 monitors]
```

> 改编自 [@dotey](https://x.com/dotey/status/1995944319677554985) 发布、[ZeroLu/awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) 收录的提示词，仓库许可证 MIT（Copyright (c) 2025 ZeroLu）。

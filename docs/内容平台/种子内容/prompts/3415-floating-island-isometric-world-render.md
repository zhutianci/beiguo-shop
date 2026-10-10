---
title: "ai游戏素材生成提示词：等轴测微缩世界 3D 渲染，浮空蘑菇村 / 雪中渔岛一句话换主题（gpt-image-2）"
slug: floating-island-isometric-world-render
model: gpt-image-2
topics: [game-art, wallpaper, illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: "想快速得到一张细节很满的\"微缩世界\"概念图时用：填上氛围、世界主题、天气和配色四个变量，就能生成一座等轴测视角的浮空岛、小镇或城市街区，可做游戏概念图、壁纸和封面。"
prompt: |
  一张[神秘而温暖]的等轴测[3D 渲染]图：[雨中的浮空蘑菇村]，天气是[绵绵细雨]，表面细节极其丰富，配色为[深绿与琥珀色]。
  - 视角：俯视 45° 的等轴测视角，整个世界像一块悬浮的小岛或一块地块，完整地居中呈现，四周留出简洁的背景；
  - 细节：建筑、植被、道路、水流都刻画到位——屋顶的纹理、窗户里透出的灯光、连接各处的台阶和吊桥、岛屿底部的岩石；
  - 质感：微缩模型般的精致感，体积光，柔和的景深；
  - 不要文字、不要人物特写、不要水印。
  画幅[4:3]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/AllaAisling/status/2058293139375374489
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；保留原文的五个变量（氛围、风格、世界、天气、配色）并换成示例图对应的中文默认值；按示例图补充了\"主体居中、四周留背景、建筑有灯光与栈道等细节\"的描述，使其更容易复现"
images:
  - 3415-floating-island-isometric-world-render-1.jpg
  - 3415-floating-island-isometric-world-render-2.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://youmind.com/gpt-image-2-prompts?id=22105
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：五个方括号对应"氛围 / 风格 / 世界 / 天气 / 配色"。世界可以换成"浮空的城市街区""海上灯塔小岛""沙漠绿洲集市"；天气换成"大雪""晴朗的黄昏""晨雾"；风格可以换成"黏土定格动画""低多边形""水彩插画"；配色写两三种颜色即可。五个变量搭配起来就是无数张图。

示例图第一张：墨绿色雨林背景里悬浮着一座小岛，三朵红褐色的巨型蘑菇是带窗户的房子，窗里亮着橘色的灯，木栈道和吊桥把它们连起来，溪水从岛边落下。第二张换了变量：冰海上一座覆雪的小岛，红色和灰色的北欧木屋、码头、渔船和成排的捕虾笼，屋顶冒着烟。

**常见问题**：
- 不是等轴测、变成了普通透视：加"正交投影，无透视变形，像建筑沙盘"。
- 主体被裁切：加"整座岛完整入镜，四周留白"。
- 细节太碎太乱：减少元素，如"只有三栋房子和一座桥"。

**适合**：游戏场景概念图、桌面 / 平板壁纸、公众号封面、世界观设定配图。

### 英文原版

```text
A {argument name="mood" default="vibrant"} isometric {argument name="style" default="3D render"} of a {argument name="world" default="floating city block"}, with {argument name="weather" default="snowy conditions"} and intricate surface details, and a color palette of {argument name="palette" default="cool blues and whites"}.
```

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2058293139375374489) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

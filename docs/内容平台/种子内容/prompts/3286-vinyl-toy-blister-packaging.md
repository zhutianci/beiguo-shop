---
title: 包装设计 AI：把角色变成吸塑卡盒装的 Q 版潮玩手办（带编号、限量和配件）
slug: vinyl-toy-blister-packaging
model: nano-banana
topics: [figurine, game-art]
needsRefImage: true
aspectRatio: "9:16"
useCase: 想把自己的原创角色、头像或宠物做成"货架上卖的潮玩"效果图时，上传一张角色图，生成带透明吸塑罩、印刷卡板背板、系列名和小配件的零售包装样机，适合做周边提案或社媒展示。
prompt: |
  把上传图里的[角色]变成一只风格化的 Q 版收藏级潮玩手办：
  - 手办是光亮的搪胶 / 塑料质感，头大身小、五官和特征适当夸张，站在一个小底座上；
  - 旁边配几件缩小的配件，和角色身份呼应，例如[武器、道具或小物件]；
  - 装在高级的吸塑零售包装里：透明塑料罩按手办和配件的轮廓压出凹槽，后面是印刷卡板背板，顶部有挂孔；
  - 背板设计：顶部是系列名"[系列名]"和副标题"[副标题]"，左上角有编号"[NO. 001]"和限量说明，背景是[水墨晕染加樱花]风格的插画；底部有年龄标识和比例说明小字；
  - 正面平视拍摄，浅灰色影棚背景，柔和布光，塑料罩上有自然反光。
  竖版 9:16。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/Madhuribhai/status/2082989921024049622
  author: "@Madhuribhai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文只有一句话，本站译成中文后按示例图补充了吸塑罩、卡板背板、系列名 / 编号 / 限量信息、背景插画和拍摄方式；角色、配件、系列名、副标题、编号、背景风格设为变量
images:
  - 3286-vinyl-toy-blister-packaging-1.jpg
imageCredit:
  by: "@Madhuribhai"
  url: https://cms-assets.youmind.com/media/1785482583777_2nxgwf_HOhEOrOaUAAjfZj.jpg
  license: CC BY 4.0
verify:
  - 原文没有写包装上的文字和背景，示例图细节可能来自作者另外的设定；按本站补充版实测一次
  - 用户上传他人角色或知名 IP 时存在版权风险，页面提醒只用自己有权使用的形象
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：上传一张角色图（原创角色、自己的卡通头像、宠物照都可以），[角色] 写一句身份描述，如"我家的橘猫""短发程序员女孩"；[武器、道具或小物件] 跟身份走，橘猫可以配"小鱼干、毛线球、猫碗"，程序员配"迷你键盘、咖啡杯"。[系列名] 和 [副标题] 换成中文也可以，比如"橘座日常 / 第一弹"。[水墨晕染加樱花] 决定背板气质，可换成"赛博霓虹网格""马卡龙波点"。示例图是英文版：一个扎发髻的 Q 版武士手持长刀站在榻榻米底座上，旁边吸塑槽里放着刀鞘、刀和小花瓶，背板上方写着系列名和"NO. 001"，背景是黑色水墨飞白和红色樱花、日文竖排书法。

**常见问题与调整**：
- 角色不像原图：加"保留原图的发型、配色和标志性服饰，只把比例改成 Q 版"。
- 包装像平面海报：强调"透明吸塑罩要有厚度和高光，能看出凸起的立体形状"。
- 文字乱码：背板文字控制在系列名 + 编号两处，其他小字删掉。
- 想做一整套：追问"保持同样包装模板，把角色换成下面这三位，编号依次 002～004"。

**适合**：原创 IP 周边提案、潮玩设计灵感、社媒趣味头像；用于众筹或售卖宣传时，实物要与效果图一致。

### 英文原版

```
Transform the {argument name="subject" default="character"} into a stylized collectible toy with glossy plastic textures, exaggerated features, miniature accessories, and premium blister-pack retail packaging with a cardboard backer.
```

> 改编自 [@Madhuribhai](https://x.com/Madhuribhai/status/2082989921024049622) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

---
title: "ai手办提示词：盲盒风 3D 微缩旅行场景，围着城市地标建的两层观景小屋和 Q 版游客（Nano Banana）"
slug: chibi-miniature-landmark-visitor-center
model: nano-banana
topics: [figurine, illustration, interior]
modelLabel: Nano Banana Pro
aspectRatio: "2:3"
needsRefImage: false
useCase: "做旅行纪念图、城市文创概念或攻略封面：把一个旅行目的地做成盲盒玩具质感的微缩场景——中间是围绕当地标志物建起来的两层观景台兼游客中心，玻璃窗里灯光温暖，Q 版小人在拍照、休息。"
prompt: |
  一个 3D Q 版风格的微缩旅行概念场景，主题是[东京]。画幅 2:3。
  - 建筑：正中是一座设计巧妙的两层观景台兼游客中心，围绕一个巨大的标志物——[红白相间的铁塔]——建造，塔身从屋子中间穿出屋顶；
  - 室内：透过大面积的玻璃窗可以看到细节丰富的内部，暖色灯光，装饰以[朱红色与原木色]为主；
  - 小人：穿导游制服的迷你角色在里面工作，来参观的迷你游客在拍照、用望远镜眺望、坐着休息；
  - 周边：建筑四周有长椅、路灯、石板步道和[盛开的樱花树]，表现当地独有的气氛；
  - 质感：用 Cinema 4D 渲染的微缩城市景观风格，盲盒玩具的审美，细节丰富，柔和的光线，像一个悠闲的旅行午后；
  - 所有招牌只写地名，不出现真实品牌和商标。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/tetumemo/status/1995840893254029554
  author: "@tetumemo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；目的地、标志物、主题色、当地植物四个变量换成示例图对应的默认值；删去\"参考附带的角色设定表摆放小人\"一句，改为直接描述小人（原作者另附了角色表，本条按纯文生图整理）"
images:
  - 3441-chibi-miniature-landmark-visitor-center-1.jpg
imageCredit:
  by: "@tetumemo"
  url: https://cdn.gooo.ai/cms/1764909219639_rjudzk_G7KmtLabwAAqReA.jpg
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：四个变量一起换才成立——目的地、当地最有代表性的标志物、主题色、当地植物或自然元素。例如"巴黎 / 铁塔 / 奶油白与墨绿 / 梧桐树"，"成都 / 一只巨大的熊猫雕塑 / 竹绿与朱红 / 竹林"。标志物写成"一个巨大的……"更容易被放到建筑正中。

示例图：黄昏的天空下，一座被切开的两层木质小屋，屋子正中立着一座红白相间的铁塔，塔尖穿出屋顶；二楼是带栏杆的观景台，几个 Q 版小人在用望远镜看风景，一楼是纪念品货架和地图墙；屋外有自动售货机、长椅、路灯，四周是粉色的樱花树。

**常见问题**：
- 标志物被放在远处当背景：强调"标志物在建筑内部正中，建筑围着它建"。
- 小人太多太挤：写"共 8 个小人，分散在两层"。
- 出现真实连锁店或饮料品牌：保留最后一条约束。

**适合**：旅行纪念图、城市文创概念、攻略封面、盲盒场景设计参考。

### 日文原版

```text
A 3D chibi-style miniature travel concept themed around {argument name="travel location name" default="Mount Fuji"}. At the center is a creatively designed two-story observation deck and tourist information center, built around a giant iconic {argument name="symbol of the travel location" default="symbol of the travel location"} object. Through the large glass windows, you can see the intricately detailed interior, with warm lighting and decorations based on {argument name="theme color of the travel location" default="theme color of the travel location"}. Miniature characters wearing tour guide uniforms are working inside, while visiting mini characters are taking photos and relaxing. Around the building are benches, streetlights, stone-paved walkways, and {argument name="local natural elements or plants" default="local natural elements or plants"}, expressing the unique atmosphere of the destination. It is rendered in a miniature cityscape style using Cinema 4D, with the aesthetic of a blind-box toy, rich details, and soft lighting that evokes the feeling of a relaxing travel afternoon. Please place the mini characters by referring to the attached character sheet. --ar 2:3
```

> 改编自 [@tetumemo](https://x.com/tetumemo/status/1995840893254029554) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

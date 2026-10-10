---
title: "ai创意图提示词：一片树叶里镂刻出一座城市，叶雕风地标微距图（Nano Banana）"
slug: leaf-cutout-city-landmark-macro-art
model: nano-banana
topics: [wallpaper, photography, poster]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: "用\"叶雕\"的手法表现一座城市或一处地标：建筑、桥和街道从一片完整的叶子里镂空出来，叶脉成了连接结构，叶面挂着露珠，背景是柔和的虚化光斑。适合做城市主题海报、旅行封面和壁纸。"
prompt: |
  灵感来自叶雕——在一片叶子上做镂空雕刻的手艺。请拍出这样一件作品的微距照片：一片完整的[枫叶]，里面镂刻着[巴黎的城市地标]。
  - 镂刻：建筑轮廓、地形和象征性的元素（塔、拱门、教堂、桥、河道和街道网格）通过有机的镂空形状呈现出来，并由叶片天然的叶脉结构自然地连接在一起，不能断裂；镂空的地方透出背景的光。
  - 叶片：一整片叶子完整入镜，悬在空中或由叶柄支撑；叶面在柔和的阳光下挂着晶莹的露珠，形成细腻的层次和明暗对比，叶脉和叶肉的纹理清楚。
  - 背景：柔和虚化的自然环境，暖色的逆光和和谐的圆形光斑，不出现具体景物。
  - 拍法：微距镜头、电影感的浅景深，植物的质感要真实，细节越多越好；画幅 16:9 横版，画面里不出现任何文字或水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/aleenaamiir/status/2001227733150691435
  author: "@aleenaamiir"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；城市 / 地标与叶片种类两个变量保留，补充了默认值；按示例图补充了\"逆光、叶片悬在空中、镂空处透出背景光\"的描述"
images:
  - 3506-leaf-cutout-city-landmark-macro-art-1.jpg
  - 3506-leaf-cutout-city-landmark-macro-art-2.jpg
imageCredit:
  by: "@aleenaamiir"
  url: https://youmind.com/nano-banana-pro-prompts?id=2443
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[巴黎的城市地标] 换成任何城市、国家、地标或自然环境，如"威尼斯的运河与拱桥""长城与群山""京都的塔和鸟居"；[枫叶] 换成与主题气质相配的叶子，例如水城配细长的柳叶、东方题材配银杏叶、热带城市配龟背竹叶。叶形越简单，镂刻的城市越清楚。

第一张示例图是一片细长的绿叶横在画面中央，叶子里镂出了威尼斯：拱桥、带圆顶的教堂、连排的拱廊和水面上的几只贡多拉，背后是金色的落日水面和光斑。第二张是一片金黄的枫叶，上半部分镂出铁塔、凯旋门和教堂的剪影，下半部分的叶脉变成了河道与街道网格，叶面满是水珠。两张图右下角都有生成工具自带的四角星标记。

**常见问题**：
- 城市被"画"在叶子表面而不是镂空：强调"镂空雕刻、能透过空洞看到背景"。
- 地标认不出来：只写 2～3 个最有代表性的建筑，不要贪多。
- 叶子不完整或被裁切：加"整片叶子完整位于画面中央，四周留出背景"。

**适合**：城市主题海报、旅行类封面、环保与自然主题的创意图。

### 英文原版

```text
Inspired by leaf-cutout art, depict {argument name="city or landmark" default="[city / country / landmark / environment]"} carved into a single complete {argument name="leaf type" default="[leaf type]"}.
Architectural forms, terrain, and symbolic elements emerge through organic hollow cutouts, seamlessly connected by natural vein structures. 
The leaf surface glistens with dew under soft sunlight, creating subtle depth and contrast.
Background remains a softly blurred natural setting with harmonious bokeh.
Cinematic macro perspective, botanical realism, ultra-detailed.
```

> 改编自 [@aleenaamiir](https://x.com/aleenaamiir/status/2001227733150691435) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

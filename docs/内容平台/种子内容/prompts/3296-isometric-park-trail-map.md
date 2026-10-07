---
title: 即梦提示词：等距卡通风景区导览地图，步道、瀑布、游客中心和营地一图看清
slug: isometric-park-trail-map
model: jimeng
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做景区 / 公园 / 营地的导览图初稿、宣传折页插图、亲子游攻略配图时，生成一张亲切可爱的等距视角插画地图：弯曲步道串起主要景点，配上小动物和地名标签。
prompt: |
  一张风格化的等距视角插画地图，主题是一座[国家公园]。
  - 地图标出主要步道和地标：[瀑布、观景台]、游客中心、露营区，用一条弯曲的米色步道把它们串起来，每个地点有圆点和文字标签；
  - 地形包括草地、河流、小山、岩石和针叶树林，地图边缘露出土层侧面，像一块等距视角的地块；
  - 点缀几只生活在这里的小动物插画，如[鹿、松鼠、小鸟]；
  - 顶部有大标题"[探索国家公园]"；
  - 风格亲切友好、色彩明快柔和，兼顾地理上的大致准确和插画的艺术感，适合做景区折页或官网插图。
  画幅 4:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-39-isometric-national-park-map
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；景区类型、地标、动物、标题设为变量；按示例图补充了步道串联、地点圆点标签、等距地块边缘和顶部标题
images:
  - 3296-isometric-park-trail-map-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765359970268_rcdthd_bf500cba6499874444cf6ff9375a9c765df1bb571a2b8216c70ffa7a3a283d54-600x450.png
  license: CC BY 4.0
verify:
  - 示例图是英文标签版，在即梦里用中文标签实测一次，看地名是否清晰无错字
  - 生成的地图只是示意，不能代替景区真实导览，页面提醒这一点
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[国家公园] 换成你要画的地方，比如"城市湿地公园""露营基地""森林徒步景区"；[瀑布、观景台] 写 2～4 个真实景点名会更有用，例如"玻璃栈道、山顶观景台、溪谷"。[鹿、松鼠、小鸟] 选当地常见的动物。[探索国家公园] 是顶部标题，可改成"XX 湿地漫游图"。示例图是英文版：一块绿色等距地块，右上角岩壁上挂着瀑布，蓝色河流穿过中间，米色步道上依次标着主步道、瀑布观景点、游客中心、露营区和观景台，草地上有一只鹿、长椅、松鼠和几只小鸟，顶部是棕色大标题。

**常见问题与调整**：
- 景点位置和实际不符：先手绘一张简单草图上传，加"按参考图的相对位置布置景点"。
- 标签文字乱：地名控制在 6 个以内，每个不超过 5 个字。
- 想要更有设计感：改成"扁平矢量风，配色只用三种绿色加一个强调色"。
- 需要竖版折页：画幅改 3:4，步道从下往上蜿蜒。

**适合**：景区折页、公园官网插图、亲子游攻略配图；不适合作为精确的导航地图。

### 英文原版

```
A stylized, isometric illustrated map of a national park. The map should highlight key trails, landmarks (like waterfalls and viewpoints), visitor centers, and camping areas. The style should be friendly and inviting, with small illustrations of animals that live in the park. This is for a park brochure or website, requiring a mix of geographic accuracy and artistic illustration. –ar 4:3
```

> 改编自 [@jaredliu_bravo](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-39-isometric-national-park-map) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。

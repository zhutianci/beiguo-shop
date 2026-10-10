---
title: 即梦提示词：侘寂风日式和室全景，榻榻米 + 障子门柔光 + 夯土墙（室内设计提示词）
slug: japanese-tatami-room-interior
model: jimeng
topics: [interior, photography]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做民宿 / 茶室 / 禅意空间的设计提案、室内设计作品集氛围图时，生成一张超广角的日式极简和室全景：榻榻米、矮茶桌、透光障子门和粗糙夯土墙，留白充足。
prompt: |
  一个[60 平方米]的日式极简民宿室内全景：
  - 地面铺满榻榻米（稻草色 [#D4C5A0]），中央是一张低矮的[乌木茶桌]；
  - 温暖的自然光透过障子门（半透明和纸材质），在室内形成柔和的光影；
  - 墙面是带粗糙触感的[夯土墙]肌理，一侧有木质壁龛和推拉柜；
  - 空间大量留白，体现侘寂美学；
  - 真实建筑比例 1:1 还原，16mm 超广角镜头表现空间感；
  - 生活方式杂志式的室内摄影风格，安静、克制、自然。
  画幅 16:9（想要示例图那种超宽横幅可用 21:9）。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-78-wabi-sabi-japanese-interior
  author: "@leahlibest"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；面积、榻榻米色值、茶桌材质、墙面材质设为变量；删去原文中的杂志品牌名，改为"生活方式杂志式"；按示例图补充了壁龛和推拉柜
images:
  - 3300-japanese-tatami-room-interior-1.jpg
imageCredit:
  by: "@leahlibest"
  url: https://cms-assets.youmind.com/media/1765360278768_h291le_1765274957426-7ugun0-02176527494361030d072d337ea6fcc7bbfbe2f0c485be262967b_0-600x257.jpg
  license: CC BY 4.0
verify:
  - 示例图约为 21:9 超宽画幅，原文未写比例，本站按 16:9 填写；实测两种比例确认空间感
  - 换成"中式茶室""北欧小木屋"实测一次，看材质描述是否仍能准确出效果
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[60 平方米] 决定空间尺度，小茶室可写"12 平方米"；[#D4C5A0] 是榻榻米的稻草色色值，想偏绿可换"#C8C49A"；[乌木茶桌] 可换成"原木矮几""黑胡桃木茶台"；[夯土墙] 可换成"硅藻泥墙""白色灰泥墙"。想改成中式茶室，就把障子门换成"木格栅窗配宣纸"、榻榻米换成"青砖地面"。示例图是一张超宽的和室照片：正中一张深色矮茶桌摆在榻榻米上，对面整排障子门透进柔和白光，左右两侧是粗糙的土黄色夯土墙，右侧有深色木框的壁龛和白色推拉柜，整体几乎没有装饰。

**常见问题与调整**：
- 画面太亮像样板间：加"室内整体偏暗，只有障子门方向有光，阴影柔和"。
- 出现多余家具：强调"除茶桌外不放其他家具，保持大量留白"。
- 想要人物氛围：加"一位穿素色棉麻衣服的人背对镜头跪坐在茶桌前"。
- 需要竖版：画幅改 3:4，镜头改为"从门口望向窗边的纵深视角"。

**适合**：民宿 / 茶室设计提案、室内设计作品集氛围图、禅意空间宣传图；不适合当作施工图或尺寸依据。

### 英文原版

```
{argument name="area" default="60 square meter"} Japanese minimalist homestay interior panorama, tatami (straw color #D4C5A0), low ebony tea table, warm natural light penetrating through shoji doors (semi-transparent washi paper material) forming soft light and shadow, rammed earth wall texture with rough touch, spatial white space embodying wabi-sabi aesthetics, real architectural ratio 1:1 restoration, 16mm ultra-wide-angle lens showing sense of space, Kinfolk lifestyle aesthetic photography style
```

> 改编自 [@leahlibest](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-78-wabi-sabi-japanese-interior) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。

---
title: 即梦提示词：城市 3D 地形沙盘地图，秋色山林 + 蓝色湖面 + 红色定位针（杭州示例）
slug: 3d-topographic-city-map
model: jimeng
topics: [infographic, wallpaper]
needsRefImage: false
aspectRatio: "4:3"
useCase: 做城市旅行攻略封面、"我在这座城市"打卡图、地理科普配图或电脑壁纸时，输入一座城市，生成一张写实的立体地形沙盘：山林有季节色彩，湖水湛蓝，中央插着红色定位针。
prompt: |
  一张[杭州]的立体地形图，中央插着一枚红色定位标记。
  - 地图上同时呈现植被覆盖的山地和城市街区，城市部分是灰白色的微缩建筑群和道路；
  - 整体是[秋天]的氛围：山林呈现橙、黄、红、棕的层层秋色；
  - [湖泊]是清澈的蓝色，背景是柔和的米色；
  - 写实风格，像一张实体沙盘模型的微距照片，近处清晰、远处略虚化；
  - 强调细腻的光影效果和丰富的地形细节。
  画幅 4:3。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-109-topographic-map-of-hangzhou
  author: "@liu10102525"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；城市、季节、水体设为变量；按示例图补充了微缩建筑群、沙盘模型质感和景深
images:
  - 3304-3d-topographic-city-map-1.jpg
imageCredit:
  by: "@liu10102525"
  url: https://cms-assets.youmind.com/media/1765360434501_816kxa_1765340306930-vmeass-02176534029138615b33ccaa151d3ed7feaaa761bc71c37d6bb0d_0-600x450.jpg
  license: CC BY 4.0
verify:
  - 生成的地形只是艺术化示意，与真实地理位置不一定对应，页面提醒不可用作导航
  - 换成"重庆""桂林"测一次，看山水地形特征是否明显
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[杭州] 换成任何城市，有山有水的城市效果最好，比如"桂林""重庆""青岛""大理"；[秋天] 可以换"冬天雪后"（山顶积雪、湖面结冰）或"春天"（嫩绿和粉色花树）；[湖泊] 按城市特点换成"江河""海湾""洱海"。示例图里左侧是红棕色和橙黄色的秋季山地，中间一片秋色树林上插着一枚红色定位针，右边是大片灰白色的微缩城区和高楼，几处蓝色湖面穿插其间，远处山峦虚化在米色背景里。

**常见问题与调整**：
- 像卫星图不像沙盘：加"桌面上的实体地形模型，边缘可见模型底座的切面"。
- 定位针太小：加"红色定位针放大，位于画面正中，带轻微投影"。
- 想标出地名：加"在 2～3 个主要区域旁用细小的白色文字标注地名"，字数越少越准。
- 做手机壁纸：画幅改 9:16，定位针放在画面上三分之一。

**适合**：旅行攻略封面、城市打卡图、地理科普、电脑 / 手机壁纸；不适合作为真实地图或导航使用。

### 英文原版

```
A topographical map of Hangzhou, with a red location marker centered. The map displays vegetated areas and urban regions, conveying an overall autumnal feel, with blue lake water and a soft beige background. The style is realistic, emphasizing delicate lighting effects and rich details.
```

> 改编自 [@liu10102525](https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-109-topographic-map-of-hangzhou) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。

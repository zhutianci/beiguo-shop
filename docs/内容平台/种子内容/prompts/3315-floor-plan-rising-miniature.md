---
title: 室内设计提示词：图纸上"长出来"的住宅微缩模型，平面图一半是线条一半是立体房间
slug: floor-plan-rising-miniature
model: nano-banana
topics: [interior, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做建筑 / 室内设计工作室的宣传图、作品集封面、设计课程海报时，生成一张富有想象力的画面：摊在绘图桌上的平面图里，房间一间间立体升起成可居住的微缩空间，小人在里面生活，周围散落比例尺和铅笔。
prompt: |
  一张[摩洛哥风庭院住宅]的建筑平面图摊在绘图桌上，图纸上的空间正逐渐升起，变成可居住的立体微缩模型。
  - [中央庭院]立体升起，里面有[喷泉和橘子树]，有人正在[喝茶聊天]；
  - [屋顶露台]升起，带有[拱廊和灯笼]，几个小人坐在靠垫上；
  - [浴室]从图纸上冒出，有[大理石和蒸汽]，柔和的[暖黄灯光]；
  - 墙体同时以图纸线条和真实隔墙两种形态存在；平面图上标注的视线变成了空间之间真实的视野；
  - 平面图上的人流动线变成半透明的移动残影，图上的比例小人变成真正生活其中的微缩居民；
  - 剖切面展示上下层的关系；
  - 建筑师的工具散落四周：比例尺、铅笔、橡皮、描图纸和揉皱的纸团；
  - 设计工作室的金色暖光，图纸既是承诺也是证明，建筑是生活的容器。
  画幅 16:9。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/AllaAisling/status/2022353962385744076
  author: "@AllaAisling"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 原文用 {BUILDING_TYPE}、{ROOM_1} 等占位符，本站按示例图填入摩洛哥风庭院住宅的具体内容并改成中文方括号变量；删去"管线脉动"等较抽象的描述和 8K 参数，补充橡皮和纸团等桌面道具
images:
  - 3315-floor-plan-rising-miniature-1.jpg
imageCredit:
  by: "@AllaAisling"
  url: https://images.meigen.ai/tweets/2022353962385744076/0.jpg
  license: CC BY 4.0
verify:
  - 示例图房间的具体内容是本站根据画面推断填入的，原文只有占位符，换成"现代公寓"测一次看是否同样稳定
  - 图纸上的小字多为装饰，展示时不必当作真实平面图
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[摩洛哥风庭院住宅] 换成你的项目类型，比如"江南园林小院""现代极简公寓""海边独栋别墅""社区咖啡馆"；三个房间各配一组家具、细节和人物活动，例如现代公寓可以写"[客厅] 有 [L 形沙发和落地窗]，一家人 [在看电影]"。光线 [暖黄灯光] 可换"清晨自然光""夜晚台灯光"。示例图里木桌上铺着一张米色平面图，中间升起一座白墙拱门的庭院住宅：庭院里有八角形喷泉和两棵橘子树，二楼露台挂着灯笼、有人坐在沙发上，右边一间大理石浴室冒着白色蒸汽，图纸上还有几道半透明的人影动线，桌面散落着比例尺、铅笔、橡皮和纸团。

**常见问题与调整**：
- 整栋楼全立起来、看不到图纸：强调"只有约一半的空间升起，其余仍是平面线条"。
- 小人太大：加"人物是 1:100 比例的微缩人偶"。
- 想要俯视角度：改成"从正上方偏 30 度俯视，能同时看清平面和立体部分"。
- 做竖版海报：画幅改 3:4，图纸斜放，上方留白写工作室名称。

**适合**：建筑 / 室内设计工作室宣传、作品集封面、设计课程海报；不适合作为真实施工图或户型展示。

### 英文原版

```
An architectural floor plan of {BUILDING_TYPE} spread across a drafting table, with the spaces rising into inhabitable miniature. {ROOM_1} emerges with {FURNITURE_1} and {ACTIVITY_1} in progress, {ROOM_2} rises with {DESIGN_ELEMENT} and {HUMAN_MOMENT}, {ROOM_3} pushes up with {DETAIL_1} and {LIGHTING_1}. Walls exist as both lines and actual partitions simultaneously. Sight lines marked on the plan become actual views between spaces. The mechanical systems in the plan—HVAC, plumbing, electrical—pulse with invisible function. Human circulation patterns appear as ghosted movement trails. Architectural scale figures become actual tiny inhabitants living their tiny lives. Section cuts reveal vertical relationships. The architect's tools surround: scales, pencils, trace paper. Golden design studio light, the plan as promise and proof, 8K, architecture as life container.
```

> 改编自 [@AllaAisling](https://x.com/AllaAisling/status/2022353962385744076) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

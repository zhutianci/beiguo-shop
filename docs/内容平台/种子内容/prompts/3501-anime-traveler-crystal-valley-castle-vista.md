---
title: "壁纸提示词：动漫奇幻远景桌面壁纸，旅人坐在崖边眺望水晶山谷里的城堡（gpt-image-2）"
slug: anime-traveler-crystal-valley-castle-vista
model: gpt-image-2
topics: [wallpaper, illustration, game-art]
aspectRatio: "16:9"
needsRefImage: false
useCase: "生成一张\"启程、翻山去往新天地\"主题的动漫风宽屏壁纸：右侧前景是背着行囊的旅人背影，远处是群山环抱的城堡之城，天空里漂浮着发光的水晶。适合做桌面壁纸、小说封面或游戏主视觉参考。"
prompt: |
  画一幅 16:9 宽屏、电影感的动漫奇幻风景插画，主题是[启程，翻越群山去往新的土地]。
  - 人物：画面右侧前景，[一位独自旅行的年轻旅人]，从背后略带侧脸的角度，坐在或蹲在深色的岩石崖边，望向远方；穿深蓝色斗篷、长裤和靴子，戴一顶宽檐探险帽，脸隐在阴影里；背一只结实的大号旅行背包，带子和搭扣清晰可见，包顶横绑着一卷睡垫；手里握一根长长的手杖，杖头是一小颗发光的水晶。
  - 景深恰好分三层：前景是岩石崖台，长着明亮的蓝色水晶簇和粉色的高山花；中景是山谷，一条蜿蜒的河和几处小瀑布；远景是积雪的嶙峋群山，环抱着一座[水晶般的城堡之城]，许多高高的尖塔发着光。
  - 天空：许多半透明的蓝紫色水晶漂浮在空中，也嵌在崖壁里，闪着魔法般的微光；天空开阔而梦幻，上方是青蓝色并带星点和星云般的光带，群山后面是大片被夕阳染成桃粉色的云。
  - 光线：宏大、柔和而明亮，旅人身上有一圈轮廓光，山谷里有体积雾，水晶表面有虹彩反光。
  - 配色与画风：以[宝石蓝、薰衣草紫、桃粉和冰白]为主；高细节、带绘画笔触的动漫电影风，壮阔的冒险气氛；不要文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/HarunagaMutsuki/status/2058846038044344495
  author: "@HarunagaMutsuki"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并按\"人物 / 三层景深 / 天空 / 光线\"整理；目的地、旅人、主色调、主题保留为变量；删去重复的风格词"
images:
  - 3501-anime-traveler-crystal-valley-castle-vista-1.jpg
imageCredit:
  by: "@HarunagaMutsuki"
  url: https://youmind.com/gpt-image-2-prompts?id=22638
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[启程，翻越群山去往新的土地] 是主题，可换成"归乡""寻找失落的图书馆"；旅人可改成"带着小龙的少女法师""背着琴的吟游诗人"；目的地换成"漂浮在云上的学院""建在巨树上的城镇"；主色调写三四种颜色，冷色为主、暖色点缀最容易出效果。

示例图里，右侧一位戴深蓝色宽檐帽的旅人侧身坐在岩石上，背着卷了睡垫的大背包，握着一根杖头镶水晶的长杖；脚边是大簇蓝色水晶和粉色小花；远处山谷里一条河流向一座尖塔林立的浅色城堡，四周是雪山；天空左侧是深蓝的星空和漂浮的水晶，右侧是大团粉色的云。

**常见问题**：
- 人物占比太大、挡住风景：写"人物只占画面右侧四分之一，其余留给远景"。
- 城堡太近没有距离感：强调"城堡在山谷尽头，被薄雾隔开"。
- 画风偏 3D：加"手绘背景美术、可见的笔触"。

**适合**：桌面壁纸、奇幻小说和跑团的封面参考、频道横幅。

### 英文原版

```text
Create a cinematic anime fantasy landscape illustration about departure and crossing mountains toward a new land. Use a wide 16:9 canvas. In the right foreground, show a lone young traveler viewed from behind and slightly in profile, sitting or crouching on a dark rocky cliff edge, gazing across a vast valley toward a distant crystalline castle city. The traveler wears a dark navy cloak or jacket, trousers, boots, and a wide-brimmed explorer hat; their face is softly obscured by shadow/blur. They carry one large rugged travel backpack with visible straps and buckles, with one rolled sleeping mat tied across the top, and hold one long walking staff topped with a small glowing crystal ornament. The landscape contains exactly three major depth zones: foreground rocky ledge with bright blue crystal clusters and pink alpine flowers, middle valley with a winding river and small waterfalls, and background snow-covered jagged mountains surrounding a luminous palace-like city with many tall spires. Add numerous floating translucent blue-violet crystals in the sky and embedded in the cliffs, sparkling with magical light. The sky is dreamy and expansive, with turquoise-blue upper atmosphere, stars and nebula-like streaks, and large peach-pink sunset clouds glowing behind the mountains. Lighting should be epic, soft, and radiant, with rim light on the traveler, volumetric mist in the valley, iridescent crystal reflections, high detail, painterly anime style, grand adventure mood, no text, no watermark. Optional customizable elements: make the destination a {argument name="destination" default="crystalline castle city"}, set the traveler as {argument name="character name" default="a lone young traveler"}, use {argument name="main color palette" default="sapphire blue, lavender, peach-pink, and icy white"}, include the theme {argument name="theme" default="departure toward a new land"}, and render in {argument name="visual style" default="cinematic high-detail anime fantasy illustration"}.
```

> 改编自 [@HarunagaMutsuki](https://x.com/HarunagaMutsuki/status/2058846038044344495) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

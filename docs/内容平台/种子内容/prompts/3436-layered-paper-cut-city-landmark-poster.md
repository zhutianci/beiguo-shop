---
title: "海报提示词：多层纸雕风城市文旅海报，窗景构图里的地标、大桥与江景（武汉示例）（gpt-image-2）"
slug: layered-paper-cut-city-landmark-poster
model: gpt-image-2
topics: [poster, illustration]
aspectRatio: "3:4"
needsRefImage: false
useCase: "给城市文旅、地方品牌、毕业旅行纪念做一张有质感的纸雕海报：五到七层厚纸叠出山、楼、江、桥和对岸天际线，前景是一扇中式花窗，右上留白放两行大标题，左下一枚纸质印章。"
prompt: |
  为原创文旅品牌"[鹤望武汉]"设计一张高级感的多层纸雕插画海报，传播主题是"[登楼望江，一眼看见城市的山水骨架]"，竖版 3:4。
  - 构图：前景是一扇窗的窗框（中式花格与栏杆），透过窗看出去；用五到七层有厚度、有纹理的纸叠出[蛇山]、[黄鹤楼]、[长江]、[长江大桥]和对岸的城市天际线；主地标位于后方的山脊上，层层飞檐、金色琉璃瓦和朱红柱子要准确；中景的大桥横向延伸，江面上两艘小渡轮，比例克制；
  - 纸艺质感：纸的切边干净，统一的柔光从左上方打来，层与层之间有真实的投影；
  - 配色：[青蓝、暖米白和朱砂红]，加少量金色，金色只用在视觉焦点上；
  - 文字：主标题"[登楼见江城]"分两行放在右上方的大留白处，用现代宋体；副标题"[从蛇山望向长江的壮阔日常]"横排在标题下方；品牌名做成纸质印章的样子放在左下角；整体现代而不仿古；
  - 要求：使用规范简体中文、没有错字，只出现中文；
  - 禁止：廉价的大红大金模板、满天祥云、古装人物、比例失真的建筑、塑料质感、厚重的发光描边、知名 Logo、水印和多余文案。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Mrpinecone888/status/2086643289525264395
  author: "@Mrpinecone888"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为中文思路的英文转写，改写回通顺中文并拆成要点；品牌名、主题句、主标题、副标题、配色设为变量并恢复为示例图里的中文；地标清单保留为示例并提示替换；保留\"简体中文无错字、不要廉价红金模板\"等约束"
images:
  - 3436-layered-paper-cut-city-landmark-poster-1.jpg
imageCredit:
  by: "@Mrpinecone888"
  url: https://youmind.com/gpt-image-2-prompts?id=30983
  license: CC BY 4.0
verify:
  - "示例图中的地标造型为艺术化表现；换成其他城市时核对地标是否画对、标题有无错字"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：品牌名、主题句、主标题、副标题四处换成你的城市文案；四个地标变量按"山 / 塔或楼 / 水 / 桥"换成你所在城市的代表，例如"西湖、雷峰塔、断桥、保俶塔和远处的钱江新城"；配色可换成"墨绿、米白和橘红"。地标最好写清一两个外形特征，模型更容易画对。

示例图：深青色的雕花窗框和栏杆占据左侧和底部，窗外是层层叠叠的青蓝色纸雕山林，山顶一座金顶红柱的楼阁，中间一座白色钢桁架大桥横跨江面，江上有两艘小船，远处是一排浅色的高楼；右上留白处是两行深青色宋体大字"登楼见江城"和一行副标题，左下角一枚米色方印写着"鹤望武汉"。

**常见问题**：
- 看起来像平面插画、没有纸的厚度：强调"每层纸有 2 毫米厚度，层间有清晰投影"。
- 标题出现错字：标题越短越稳，出图后核对；必要时只生成画面，文字后期加。
- 地标画得不像：补充该地标的层数、屋顶颜色、结构特点。

**适合**：城市文旅海报、地方文创包装、毕业旅行纪念海报、城市主题公众号头图。

### 原版提示词

```text
Create a high-end layered paper-cut illustration poster for the original cultural tourism brand "{argument name="brand name" default="Hewang Wuhan"}", with the communication theme "Gaze at the River from the Tower, Seeing Wuhan's Landscape Skeleton at a Glance", 3:4 vertical version. The image uses a foreground window composition, with five to seven layers of thick textured paper forming Snake Hill, Yellow Crane Tower, the Yangtze River, Wuhan Yangtze River Bridge, and the city skyline on the opposite bank; Yellow Crane Tower is located on the background ridge, with accurate overlapping eaves, gold glazed tiles, and vermilion columns; the mid-ground Yangtze River Bridge extends horizontally, with two small ferries on the river at a restrained scale, and Qingchuan Pavilion must not be merged with Yellow Crane Tower. The paper edges are clean, with unified soft light from the top left and realistic inter-layer shadows. The overall colors are {argument name="color palette" default="cyan, warm off-white, and cinnabar red"} with a small amount of gilded yellow, where gold is only used for visual focal points. The main title "{argument name="main title" default="Denglunjian Jiangcheng"}" is placed in a large white space on the top right in two lines of modern Songti font; the subtitle "The Grand Daily Life Glimpsed from Snake Hill to the Yangtze" is arranged horizontally below the title; the brand name "{argument name="brand name" default="Hewang Wuhan"}" is placed in a paper seal-shaped brand position on the bottom left, maintaining a modern rather than archaic style. Use standard Simplified Chinese with no typos, only Chinese; prohibit cheap red and gold templates, sky full of auspicious clouds, characters in ancient costumes, distorted architectural proportions, plastic materials, heavy glowing borders, well-known logos, watermarks, and extra copy.
```

> 改编自 [@Mrpinecone888](https://x.com/Mrpinecone888/status/2086643289525264395) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

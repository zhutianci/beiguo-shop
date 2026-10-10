---
title: 信息图提示词：历史帝国"考古地层"海报，立体分层地图讲兴起、扩张与衰落（gpt-image-2）
slug: empire-strata-history-cards
model: gpt-image-2
topics: [infographic, illustration]
needsRefImage: false
aspectRatio: "16:9"
useCase: 做历史科普账号封面、课堂讲义插图、历史类视频的片头图时，输入一个古代王朝或帝国，生成羊皮纸风格的"地层剖面"信息海报：底层是起源，中层是扩张，顶层是分裂，四周有战役、经济和王朝更替的小标注。
prompt: |
  输入：[帝国或王朝名称]
  把它渲染成一张高级的"历史文明地层"海报。不要硬写具体年份，除非必要；由模型推断领土扩张的阶段、经济支柱、军事革新周期、文化融合方式，以及衰落的"地质层"。
  - 需要体现的内容：领土结构（起源核心、扩张方向、边境要塞、贸易路线、附属网络）；经济支柱（农业基础、矿产资源、税制、货币、劳力组织）；军事革新（武器技术、战术、后勤、筑城、水军）；衰落机制（继承危机、通货膨胀、边境压力、内部叛乱、环境压力）；
  - 构图：画面中央是这个帝国的多层考古剖面——底层是建立时的聚落，中间几层用不同颜色的地层表现领土扩张，顶层是分裂瓦解的形态；四周悬浮着标注框，展示关键战役、经济指标和王朝更替，标注线像考古发掘报告与军事战役地图的结合；
  - 风格：古代道路地图长卷 + 考古地层图 + 复古军事战役地图 + 博物馆展陈信息图 + 带污渍的旧羊皮纸纹理；
  - 输出：[暖棕褐或深陶土色]背景，典雅的古典衬线字体加手写批注，标注克制，地图纹理写实，做旧精致，留白充足。
  不要：全息、发光元素、现代数字地图、卡通插图、杂乱时间轴、廉价课本排版、图库照片式的帝王像、时代错乱的元素、水印。
  画幅[16:9]横版。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Gdgtify/status/2065057210426900515
  author: "@Gdgtify"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 译成中文；把原文伪代码式的"INFER(...)"权重结构改写成自然语言清单，删掉权重数字；补上原文隐含的"输入帝国名称"变量和背景色、画幅变量
images:
  - 3263-empire-strata-history-cards-1.jpg
imageCredit:
  by: "@Gdgtify"
  url: https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts/blob/main/images/poster_case393/output.jpg
  license: CC0 1.0
verify:
  - 示例图是四个帝国的 2×2 合集（原帖分别输入），单次一般只出一个，页面需说明
  - 生成的年份、战役和地名标注可能有误，页面需提醒"用于教学前逐项核对史实"
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[帝国或王朝名称] 填一个就行，比如"唐朝""秦朝""元朝""古埃及新王国"；想要四宫格，就写"2×2 四格，分别是[唐][宋][元][明]"，或分四次生成再拼。[暖棕褐或深陶土色] 可换"深墨蓝"做出夜色版。示例图是 2×2 英文合集：罗马、蒙古、奥斯曼、大英四个帝国，每格中央是一块像地层蛋糕一样分层的立体地图，侧面露出土层，四周是羊皮纸上的小插图、文物图标和英文批注，标题用古典衬线大字。

**常见问题与调整**：
- 标注年份和史实错误：在提示词里直接写入你核对过的关键年份和事件，例如"标注：618 建立、755 安史之乱、907 灭亡"。
- 中文标注糊：减少到 4～6 个标注框，每框一行字。
- 地层看不出来：强调"剖面侧面露出清晰的彩色土层，每层旁边标注一个时期"。
- 想做竖版封面：画幅改 3:4，地层剖面放大居中，标注放上下两侧。

**适合**：历史科普封面、课堂讲义插图、历史类视频片头；不适合未经核对直接当作史实资料。

### 英文原版

```
SYSTEM: Render the input as a luxury historical civilization stratigraphy poster. Do not hardcode dates unless inevitable. Infer the territorial expansion phases, economic foundation pillars, military innovation cycles, cultural assimilation patterns, and the geological layers of decline.  SEMANTIC SOLVE: EMPIRE_AUTOPSY =    (INFER(territorial_architecture FROM founding_core + expansion_vectors + frontier_fortifications + trade_route_control + vassal_networks) ::5) +    (INFER(economic_pillars FROM agricultural_base + mineral_resources + taxation_system + currency_standard + labor_organization) ::4) +    (INFER(military_innovation FROM weapon_technology + tactical_doctrine + logistics_chain + fortification_engineering + naval_capacity) ::4) +    (INFER(decline_mechanics FROM succession_crises + economic_inflation + frontier_pressure + internal_rebellion + environmental_stress) ::3) -    (generic timeline infographics + cartoon maps + cluttered textbook layouts + stock-photo ruins + cheap educational posters) ::-4  COMPOSITION: One central empire visualized as a multi-layered archaeological cross-section. The bottom layer shows the founding settlement, middle layers reveal territorial expansion through colored strata, and the top layer displays the fragmentation pattern. Surrounding the core are floating callouts showing key battles, economic indicators, and dynastic transitions mapped as physical artifacts. Use callout lines like an archaeological dig site report crossed with a military campaign map.  STYLE DNA: Ancient Roman Tabula Peutingeriana ::0.30 archaeological stratigraphy diagram ::0.25 vintage military campaign map ::0.20 museum exhibit infographic ::0.15 aged parchment with stain texture ::0.10  OUTPUT: Warm sepia or deep terracotta background luxury history poster, elegant classical serif + handwritten annotation typography, restrained callouts, hyper-realistic map textures, refined aging effects, premium negative space.  NEGATIVE: no holograms, no glowing elements, no VR/AR overlays, no modern digital maps, no cartoon illustrations, no cluttered timelines, no stock-photo emperors, no watermark, no anachronistic elements.
```

> 改编自 [@Gdgtify](https://x.com/Gdgtify/status/2065057210426900515) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

---
title: "ppt提示词：咨询公司风市场分析页，柱状图 + 竞争定位四象限 + 一句结论（gpt-image-2）"
slug: consulting-market-landscape-slide-bar-matrix
model: gpt-image-2
topics: [ppt, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做行业分析、商业计划书里的\"市场格局\"页：顶部一句结论，左边是市场规模柱状图，右边是竞争定位四象限，底部一行关键词标签，藏青加宝蓝的咨询公司汇报风格。"
prompt: |
  生成一张 16:9 的咨询公司风格商业汇报幻灯片，干净的白色背景，藏青色与宝蓝色的商务配色，现代无衬线字体，标题用粗体，整体克制、专业。
  - 顶部：左上角是粗体大标题"[市场结构与增长空间]"，下面一行小号英文副标题"Market Landscape"；右上角小字"Confidential | Sample"。
  - 结论条：标题下方一条通栏的极浅蓝色矩形，里面居中一行藏青色粗体字："[结论：增长空间大，竞争转向拼体验]"。
  - 主体分左右两栏，中间一条细竖线：
    - 左栏标题"[市场规模变化]"：一张宝蓝色柱状图，5 根柱子逐年升高，横轴是"2022、2023、2024、2025E、2026E"，每根柱子顶上标数值（示例："1.8、1.9、2.1、2.3、2.5"，单位"[万亿元]"），左上角一个圆角小标签写"[年均增长 8%]"；图下方一个细边框文本框，两条要点："[市场持续扩大，获客竞争加剧]""[高附加值品类拉动整体增长]"。
    - 右栏标题"[竞争定位]"：一个四象限图，纵轴"[客户体验]"（低→高），横轴"[价格竞争力]"（低→高），中间两条虚线分区；四个圆形气泡——右上角一个实心宝蓝色气泡写"[本公司]"，其余三个浅蓝色气泡分别写"竞品A"（左上）、"竞品B"（右下）、"竞品C"（左下）；图下方一个细边框文本框，一行结论："[制胜点：不拼价格，改善体验、会员与配送]"。
  - 底部：一条细横线，下面三个等宽的细边框标签："[市场增长]""[竞争转向]""[高端化]"；右下角页码"02"。
  - 所有中文清晰无错字，图表线条干净，不要立体效果、不要装饰插画和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/houyaji/status/2051201015710687698
  author: "@houyaji"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文（画面文字为日文）改写为分条中文；标题、结论、图表标题、坐标轴、要点和底部标签改为变量，日文文案换成中文；柱状图数值保留为可替换的示例并在说明中提醒"
images:
  - 3511-consulting-market-landscape-slide-bar-matrix-1.jpg
imageCredit:
  by: "@houyaji"
  url: https://youmind.com/gpt-image-2-prompts?id=18468
  license: CC BY 4.0
verify:
  - "示例图中的市场规模数字与增长率是原作者虚构的版式示例，正文已提醒必须换成有来源的真实数据"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：先定顶部结论（一句话说清"所以呢"），再填左右两张图：柱状图的年份、数值和单位换成你的真实数据，增长率标签要和数值对得上；四象限的两条坐标轴换成你所在行业的两个竞争维度，气泡位置按实际判断摆放；底部三个标签是对全页的三词概括。

示例图是白底蓝色调的一页：左上是大标题和英文副标题，下面一条浅蓝色的结论条；左半边是五根逐年升高的蓝色柱子和一个"CAGR 8%"标签，下面两条要点；右半边是标着"高 / 低"的四象限，右上角深蓝色气泡代表自己，另外三个浅色气泡是竞品；底部三个英文标签和页码 02（原图文字为日文）。

**常见问题**：
- 柱子高度和数值不成比例：数值差距小时模型容易画错，生成后务必对照；要求严格时只让它出版式，图表在 PPT 里重画。
- 小字出错：把要点压缩到每条 12 个字以内。
- 气泡位置不对：在提示词里用"左上 / 右上 / 左下 / 右下"明确写每个气泡的位置。

**适合**：行业分析、商业计划书、季度汇报的版式参考。示例中的数字是虚构的排版示例，正式材料必须使用有来源的真实数据并标注出处。

### 英文原版

```text
{"type":"corporate consulting presentation slide","language":"Japanese with small English subtitles","format":"16:9 widescreen slide, clean white background, navy and royal blue business style","title":"{argument name=\"main title\" default=\"市場構造と成長余地\"}","subtitle":"Market Landscape","top_right_label":"Confidential | Sample","page_number":"02","theme":{"primary_color":"deep navy","accent_color":"royal blue","secondary_color":"pale blue","lines":"thin navy divider lines","typography":"modern sans-serif, bold Japanese headings, restrained consulting-deck style"},"layout":{"top":{"position":"upper left","content":"large bold Japanese title with smaller English subtitle underneath; confidentiality label at upper right"},"key_message_banner":{"position":"full width below title","background":"very pale blue rectangle","text":"{argument name=\"key message\" default=\"示唆：成長余地は大きいが、競争軸は『集客量』から『顧客体験』へ変化\"}","style":"centered bold navy Japanese text"},"main_content":{"columns":2,"divider":"thin vertical gray line between columns","left_section":{"title":"市場規模推移","type":"bar chart","position":"left half","chart_details":{"badge":"CAGR 8%","y_axis_label":"(兆円)","y_axis_range":"0.0 to 3.0","gridlines":"light gray dotted horizontal gridlines","bar_count":5,"bars":[{"year":"2022","value_label":"1.8兆円"},{"year":"2023","value_label":"1.9兆円"},{"year":"2024","value_label":"2.1兆円"},{"year":"2025E","value_label":"2.3兆円"},{"year":"2026E","value_label":"2.5兆円"}],"bar_style":"solid royal blue vertical bars"},"note_box":{"count":2,"bullets":["市場拡大は継続する一方、獲得競争は激化","高付加価値カテゴリの伸長が全体成長を牽引"],"style":"outlined white box with navy left accent line"}},"right_section":{"title":"競争ポジション","type":"2x2 positioning matrix","position":"right half","matrix_details":{"x_axis":"価格競争力","x_axis_left":"低","x_axis_right":"高","y_axis":"顧客体験","y_axis_bottom":"低","y_axis_top":"高","axis_arrows":"black arrows pointing right and upward","crosshair":"light gray dotted vertical and horizontal midpoint lines","bubble_count":4,"bubbles":[{"label":"競合A","position":"upper left","style":"pale blue circle"},{"label":"自社","position":"upper right","style":"dark royal blue circle with white text"},{"label":"競合C","position":"lower left","style":"very pale blue circle"},{"label":"競合B","position":"lower right","style":"very pale blue circle"}]},"note_box":{"text":"{argument name=\"right insight text\" default=\"勝ち筋：価格訴求ではなく、UX・CRM・配送品質の一体改善\"}","style":"outlined white box with navy left accent line"}}},"bottom_navigation":{"position":"bottom center","tab_count":3,"tabs":["Market Growth","Competitive Shift","Premiumization"],"style":"three thin outlined rectangular tabs in navy, evenly spaced"}},"composition":"precise slide grid, generous margins, horizontal navy rules separating header/content/footer, polished strategy-consulting PowerPoint aesthetic, no photos or illustrations, sharp vector graphics"}
```

> 改编自 [@houyaji](https://x.com/houyaji/status/2051201015710687698) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

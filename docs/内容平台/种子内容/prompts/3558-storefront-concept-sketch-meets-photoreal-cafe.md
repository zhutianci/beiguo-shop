---
title: "室内设计提示词：门头设计概念图，手绘尺寸标注线稿 + 写实咖啡店门面的混合表现（Nano Banana）"
slug: storefront-concept-sketch-meets-photoreal-cafe
model: nano-banana
topics: [interior, poster]
modelLabel: Nano Banana Pro
aspectRatio: "4:5"
needsRefImage: false
useCase: "开店前给门头出一张\"设计师提案感\"的概念图：中间是写实渲染的店面门窗和店内暖光，四周保留铅笔线稿、尺寸线和手写标注，像一张正在从草图变成实景的立面图。适合咖啡店、花店、面包店的门头方案沟通。"
prompt: |
  生成一张建筑概念表现图，细节丰富，把干净的技术手绘和高级的写实渲染融合在一起：一家现代[咖啡店]的临街门面，正立面视角，竖版 4:5。
  - 门面：一组严格对称的[黑色]细框玻璃门窗，嵌在一面[带细微肌理的纯白极简墙面]上，上方是浅浅的弧形门洞，门洞上方一盏黑色的鹅颈壁灯。
  - 店内：透过玻璃能看到温暖明亮的室内——几盏柔和的球形吊灯、茂盛的绿植、一个小巧的木质吧台和几张高脚凳，背景里有被虚化的人影，带一点生活气息；窗内挂一块小小的黄色咖啡杯图形招牌。
  - 门口：门两侧各一棵种在水泥盆里的橄榄树，左边还有一个种着香草的方形花槽；右边立一块 A 字形黑板立牌，用粉笔字写着"[CAFÉ]"和"[OPEN DAILY]"。
  - 线稿层：门窗四周叠着纤细的铅笔草图线、尺寸标注线、排线阴影和施工辅助网格，还有几处带箭头的手写建筑标注（如"立面图""玻璃节点""花槽"）；线稿从画面边缘向中心逐渐过渡成写实。
  - 质感：白色纸面般的背景，柔和的日光，玻璃有真实的反射；手写标注只起示意作用，不必逐字可读；不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/FutureToolsAI/status/2014473439164104858
  author: "@FutureToolsAI"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并整理为分条；业态、门窗框颜色、立面材质、立牌文字改为变量；补充了\"标注文字只起示意作用\"的说明"
images:
  - 3558-storefront-concept-sketch-meets-photoreal-cafe-1.jpg
imageCredit:
  by: "@FutureToolsAI"
  url: https://youmind.com/nano-banana-pro-prompts?id=7242
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[咖啡店] 换成"花店""面包房""买手店"时，把店内陈设和窗内招牌的图形也换掉；门窗框颜色和墙面材质决定门头气质，如"墨绿色窗框 + 米色手工砖墙"或"原木窗框 + 灰色水洗石"；立牌上的两行字换成你的店名和一句短语，英文或 2～4 个汉字。

示例图是一面白墙上的黑框拱形门窗：玻璃里是暖黄色的店内，能看到吊灯、绿植、木吧台和模糊的人影，窗里贴着一张黄色的咖啡杯小招牌；门口两侧是橄榄树盆栽，右前方的黑板立牌写着"CAFÉ"和"OPEN DAILY"；四周布满浅灰色的铅笔辅助线、尺寸数字和带箭头的英文手写标注，左上角写着"ELEVATION VIEW"。标注里有个别拼写错乱的单词。

**常见问题**：
- 线稿和实景各占一半、中间有硬边：强调"线稿叠加在实景之上，并在边缘处渐隐"。
- 标注文字乱码太显眼：减少标注数量到 3 处，或写"标注用模糊的手写笔迹"。
- 门面不对称：写"以门的中线为轴左右严格对称"。

**适合**：小店门头方案的前期沟通、给装修师傅和设计师看的意向图、开业预告海报；尺寸数字仅为装饰，不能当施工依据。

### 英文原版

```text
"Architectural concept rendering of a modern café storefront, ultra-detailed, blending clean technical sketch and high-end photorealism. The composition features a perfectly symmetrical {argument name="window frame color" default="black"}-framed glass window and door set into a pristine white minimalist façade with subtle texture. Through the central window, a warmly lit, inviting café interior is visible, with soft pendant lights, lush green plants, a compact wooden counter, a few stools, and hints of people blurred in the background for a lived-in feel. Surrounding the window, delicate pencil sketch lines, dimension marks, hatching, construction grids, and small handwritten architectural annotations overlay the wall and ground plane, seamlessly merging drafting aesthetics with finished reality. Add realistic exterior details such as a small black metal lamp centered above the arch or lintel, a neatly designed sandwich board sign on the sidewalk with faint chalk writing, and two tasteful potted plants flanking the entrance in simple modern planters. Emphasize a balanced contrast between crisp monochrome sketch outlines and selective, refined color accents — warm yellow ambient lighting inside, a single bold yellow poster in the window, natural green foliage, and soft, directional shadows on the pavement. The overall mood is elegant, creative, and conceptual, evoking a high-end architectural visualization that appears to transition gradually from blueprint lines at the edges into fully realized photographic realism at the center."
```

> 改编自 [@FutureToolsAI](https://x.com/FutureToolsAI/status/2014473439164104858) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

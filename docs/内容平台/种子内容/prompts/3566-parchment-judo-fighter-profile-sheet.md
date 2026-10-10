---
title: "ai角色设定图提示词：旧纸墨线格斗少年档案，三面图+能力雷达+必杀技（gpt-image-2）"
slug: parchment-judo-fighter-profile-sheet
model: gpt-image-2
topics: [character, comic, infographic]
aspectRatio: "4:5"
needsRefImage: false
useCase: "想给热血运动漫或格斗题材的原创角色做一页\"档案式\"人设时用：泛黄旧纸上排好大立绘、三面图、表情集、能力评级条和雷达图、爱用物品、必杀技和基本信息。"
prompt: |
  画一张复古漫画风的格斗少年角色档案表，角色是奇幻设定的柔道选手"[苍龙]"。
  整体风格：做旧的羊皮纸底，黑色墨线的漫画线稿，藏青与米白为主的低饱和配色，手绘设定稿的感觉；各栏小标题用粗犷的毛笔字写在黑色墨块上，细线边框，带一点陈旧印刷品的磨损质感。
  角色：[龙神族少年，16 岁]，白色刺猬短发，身材精瘦结实；穿白色柔道服，上衣和裤子布满蓝色龙纹与金色云纹，腰系绣金字的黑带，赤脚；随身带一只印着蓝色龙徽的黑色摇摇杯。
  版面（密集的单页设定表，网格均衡）：
  - 左半边：膝盖以上的大幅立绘，左手举着摇摇杯，右手叉腰，神情自信；左上角一枚黑蓝两色的圆形龙纹徽章，旁边用大号毛笔字写角色名并标注读音；下面一句带引号的台词"[锻炼、摔投、然后取胜]"；右边一行竖排小标语。
  - 右上"三面图"：同一身柔道服的正面、侧面、背面 3 个全身像，分别标注。
  - 右中"表情集"：4 个头肩像——平常、笑容、训练中（仰头喝摇摇杯）、愤怒（身周有蓝色电光）。
  - 中下"能力参数"：7 条横向评级条（体力、力量、柔道技术、速度、精神力、[龙神之力]、学习），用 SS、S、AA、A、C 评级，旁边一个蓝色雷达图。
  - 中下"爱用物品"：3 个小图——摇摇杯、定制哑铃、一条折好的绣金黑带，各配一两行说明。
  - 右下"必杀技"：一格动感画面，少年把对手高高摔起，蓝色的龙形气流和旋风环绕两人，旁边写招式名和三四行解说。
  - 左下"基本信息"：11 行小字资料（种族、年龄、所属、年级、身高、体重、生日、最爱的食物、讨厌的东西、兴趣特长、将来的梦想），每行前面一个小菱形。
  - 最底部通栏"一句话"：两行角色自述。
  右下角再放一枚小的圆形龙纹徽章。画面文字全部用[简体中文]，字迹清楚；不要水印，不要真实品牌标志。画幅[4:5]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Finedays_sunday/status/2051407857288118448
  author: "@Finedays_sunday"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "JSON 原文改写为分条的中文描述；日文栏目名和示例文案译为中文；角色名、种族年龄、台词、专属属性、文字语言、画幅设为变量；删去原文里\"人脸打马赛克\"的要求（示例图本身未打码）；摇摇杯上的英文字样改为只画龙徽；补充\"不要水印和真实品牌标志\"。"
images:
  - 3566-parchment-judo-fighter-profile-sheet-1.jpg
imageCredit:
  by: "@Finedays_sunday"
  url: https://youmind.com/gpt-image-2-prompts?id=18416
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[苍龙] 是角色名；[龙神族少年，16 岁] 是种族和年龄的一句话设定；[锻炼、摔投、然后取胜] 是立绘旁的台词，建议 12 个字以内；[龙神之力] 是能力条里那项专属属性；[简体中文] 决定文字语言。想换成"剑道少女""拳击手""围棋少年"，就把服装、三件爱用物品和必杀技画面对应改掉，七项能力也换成该项目的指标。基本信息 11 行的内容可以在提示词后面逐条给出。

示例图是日文版：泛黄旧纸上，左边是白色刺猬头少年的大幅立绘，白底蓝龙纹的柔道服，手举黑色摇摇杯；右上是正面、侧面、背面三面图，中间四个表情头像，下面是七条能力评级条和蓝色雷达图、三件爱用物品、一格龙卷气流中的摔技画面，左下是密密的基本信息，底部通栏一句角色自述。

**常见问题**：
- 小字大面积乱码：把基本信息减到 6 行、能力条减到 5 条，每行不超过 12 个字。
- 雷达图和评级条对不上：加"雷达图的各顶点与评级条的项目一一对应"。
- 三面图的花纹位置不同：加"龙纹在上衣和裤腿上的位置三个视图一致"。

**适合**：热血运动漫和格斗题材的角色档案、跑团人物卡、同人志的人设页。

### 英文原版

```text
{"type":"vintage manga/anime character reference sheet for a fantasy judo fighter","style":"aged parchment paper, black ink manga linework, muted navy and cream palette, hand-drawn Japanese character sheet, rough brush headers, thin panel borders, dramatic sports-anime energy effects, slightly weathered print texture","character":{"name":"{argument name=\"character name\" default=\"蒼龍\"}","reading":"そうりゅう","profile":"dragon-god tribe boy, 16 years old, male","face":"all visible faces are deliberately obscured by soft square pixel blur blocks","hair":"spiky short white hair","build":"lean athletic teenage martial artist","outfit":"white judo gi with ornate blue dragon illustrations and gold cloud arabesque patterns across jacket and pants, black belt with gold embroidery, barefoot","prop":"black shaker bottle labeled RYUJIN PROTEIN with a blue dragon emblem"},"main_left_panel":{"position":"left half","content":"large full-body portrait from knees up, character confidently holding the protein shaker in his left hand and resting his right hand on his hip","top_emblem":"circular black-and-blue dragon crest","large_calligraphy_name":"{argument name=\"character name\" default=\"蒼龍\"}","quote":"{argument name=\"quote\" default=\"鍛え、投げ、そして勝つ。それが俺の生きる道だ\"}","vertical_tagline":"プロテインは裏切らない！"},"layout":{"sections":[{"title":"三面図","position":"upper right","count":3,"labels":["正面","側面","背面"],"description":"three full-body turnaround views of the same fighter wearing the dragon-pattern gi, front view, side view, and back view"},{"title":"表情集","position":"middle right","count":4,"labels":["通常","笑顔","トレーニング中","怒り"],"description":"four head-and-shoulder expression portraits; normal side profile, smiling three-quarter view, drinking from shaker during training, and angry with blue lightning aura"},{"title":"能力パラメータ","position":"lower middle-left","count":7,"labels":["体力 SS","筋力 SS","柔道技術 S","スピード A","精神力 AA","龍神の力 AA","勉強 C"],"description":"horizontal rating bars plus a blue radar chart labeled with the same attributes"},{"title":"愛用アイテム","position":"bottom middle","count":3,"labels":["プロテインドリンク（龍神ブレンド）","特注ダンベル（50kg）","父の形見の黒帯"],"description":"three item illustrations: black RYUJIN protein bottle, heavy black dumbbell, and folded black belt with gold embroidery"},{"title":"必殺技","position":"lower right","count":1,"labels":["神空投（しんくうなげ）"],"description":"dynamic action panel showing the white-haired fighter throwing an opponent while spiraling blue dragon-like energy and wind curl around them"},{"title":"基本情報","position":"lower left","count":11,"labels":["種族","年齢","所属","学年","身長","体重","誕生日","大好物","嫌いなもの","趣味・特技","将来の夢"],"description":"compact bullet-style biography box in Japanese with small diamond markers"}],"bottom_message":{"title":"蒼龍からの一言","text":"{argument name=\"bottom message\" default=\"毎日の積み重ねが、未来を変える。柔道も、ダンベルも、そしてプロテインも…全部、俺の力になる。いつか必ず、父の仇を討ち、皆が笑って暮らせる世界を作ってみせる！\"}"}},"composition":"dense single-page character sheet, balanced grid, left side dominated by the large portrait and basic info, right side filled with turnaround views, expressions, stats, items, and special move panel; add small dragon crest stamp in bottom right","rendering_notes":"make Japanese typography look hand-brushed and printed on paper, keep panel text legible, use crisp manga hatching and blue ink accents, include ornate dragon patterns consistently on all gi views"}
```

> 改编自 [@Finedays_sunday](https://x.com/Finedays_sunday/status/2051407857288118448) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

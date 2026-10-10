---
title: "ai故事板提示词：种子长成大树的 10 格纪录片分镜，带时间码（gpt-image-2）"
slug: seed-to-tree-ten-frame-nature-storyboard
model: gpt-image-2
topics: [comic, photography]
aspectRatio: "4:3"
needsRefImage: false
useCase: "策划一支\"生命历程\"类的自然短片时用：2 行 5 列共 10 个竖长画格，从种子离树、落地生根、熬过风暴到长成大树，景别在极远景和微距之间来回切换，每格带编号、时间码和一行字幕，可直接当图生视频的逐镜参考。"
prompt: |
  为一支[15 秒]的写实 CG 动画短片画一张故事板：2 行 5 列共恰好 10 格，主题是[一粒种子被风吹走，熬过风暴，长成大树]。
  整体：横版 4:3，深色背景，10 个竖长的画格之间留细黑缝；[高品质自然纪录片]的质感，微距摄影，浓郁的绿色和黄金时刻的暖光，自然柔和的阴影，景别在极远景和极微距之间大幅切换。主角是[一粒带薄翅的枫树种子]。
  每格的标注：左上角一个白色小号数字编号；底部压一条由下往上的黑色渐变，上面是白色的时间码和一行简短的中文字幕。
  10 格内容（画面，然后是时间码和字幕）：
  1. 秋天森林的极远景，一粒种子从高大的老树上脱落，背景是金色的虚化光斑。00:00，"一粒种子，乘风而去。"
  2. 微距跟拍：种子在空中飘飞，掠过昆虫和落叶，显得又小又轻。00:01，"它随看不见的气流远行。"
  3. 慢动作落地：种子落在松软的土上，土粒溅起，一滴雨落在它旁边。00:03，"它落下时，雨也来了。"
  4. 带点超现实感的地下微距：黑暗里根须开始生长，纤细而好看。00:04，"地下，生命醒来。"
  5. 戏剧性的大远景：狂风暴雨，一切都被连根拔起，只有种子所在的那一小块地纹丝不动。00:06，"风暴肆虐，这里没有动。"
  6. 微距特写：第一棵绿芽顶破土层，芽尖挂着晨露，被阳光照亮。00:07，"它破土而出。"
  7. 加速生长：一格内竖向切成四条，同一棵小树在春夏秋冬里一条比一条高。00:09，"时间流过，四季轮转。"
  8. 远景：小树已经站稳，鸟儿飞来，叶子在风里轻轻晃动。00:11，"它站住了，生命回来了。"
  9. 暖色中景：几个孩子在树荫下奔跑玩耍，一只鸟在枝头筑巢。00:13，"它给予荫凉，也成了家。"
  10. 与第 1 格呼应的远景：从当初那棵老树的角度看过去，新的大树已经立在那里。00:15，"一粒种子，一段传承。"
  限制：严格 10 格，同宽同高、对齐成网格；每格只有编号、时间码和字幕三处文字，字幕用简体中文；不要 Logo 和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Strength04_X/status/2050143161365012630
  author: "@Strength04_X"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并逐格列出；原文写的某电视台自然纪录片品牌名改为通用的\"高品质自然纪录片\"；时长、风格、故事线、主角种子设为变量；原文没有提字幕，按示例图补充了\"左上角编号、底部时间码 + 字幕\"的标注方式，并把示例图的英文字幕改写成中文。"
images:
  - 3532-seed-to-tree-ten-frame-nature-storyboard-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://youmind.com/gpt-image-2-prompts?id=17601
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[一粒种子被风吹走，熬过风暴，长成大树] 是一句话故事线，可以换成"一滴雨落下，流过溪谷，汇入大海""一只幼龟破壳，爬过沙滩，游向深海"，再把 10 格照"出发—落定—考验—新生—成长—回望"的节奏重写；[一粒带薄翅的枫树种子] 是主角；[15 秒] 是成片时长；[高品质自然纪录片] 决定画面质感，也可以写"定格黏土动画"。

示例图是英文字幕版：深色底上两行五列的竖长画格，左上角是白色编号，底部是时间码和两行白字。上排是金色林海里飘离老树的种子、空中与昆虫落叶同框的翅果、落进湿土的瞬间、黑暗里蔓延的根须、乌云下被掀翻的树根；下排是挂着露珠的绿芽、四季并排的生长条、蓝天下的大树、树荫里奔跑的三个孩子和枝头鸟巢，以及夕阳山丘上的大树。

**常见问题**：
- 中文字幕出错：每格字幕压到 10 个字以内，或让字幕留空、后期自己加。
- 第 7 格没画成四季并排：把"竖向切成四条，春夏秋冬各一条"单独再写一遍。

**适合**：自然科普短片和公益广告的前期分镜、图生视频的逐镜参考、生命教育课件配图。

### 英文原版

```text
A 2x5 storyboard grid of 10 frames for a 15-second photorealistic CGI animated short film, {argument name="aesthetic" default="BBC Planet Earth documentary aesthetic"}, macro cinematography, rich greens and golden hour light, natural soft shadows, extreme scale shifts from micro to macro. Theme: {argument name="theme" default="a single seed's journey blown by wind, surviving a storm, slowly growing into a great tree full of life"}. Frames: (1) extreme wide autumn forest, single seed released from a tall tree, golden bokeh background; (2) macro tracking shot - seed floating through air, passing insects and leaves, delicate and small; (3) slow-motion impact - seed lands on soft soil, dirt particles scatter, raindrop falls beside it; (4) surreal underground macro - roots beginning to grow in darkness, microscopic and beautiful; (5) wide dramatic shot - violent storm raging, everything uprooted, but the seed's spot stays still; (6) macro close-up - first green sprout breaking through soil, morning dew on tip, sunlight catching it; (7) accelerated growth sequence - sapling rising, seasons shifting, light and shadow changing, alive; (8) wide shot - juvenile tree now standing, birds arriving, leaves rustling gently in wind; (9) medium warm shot - children playing in the tree's shade, a bird building a nest in the branches; (10) mirror wide shot - framed from the angle of the original tall tree, the new great tree now stands in its place circle of life.
```

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2050143161365012630) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

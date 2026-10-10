---
title: "ai故事板提示词：动画电影风 8 格故事板，夕阳公园里的纸风车（Nano Banana）"
slug: empty-swing-anime-film-storyboard-board
model: nano-banana
topics: [comic, illustration]
modelLabel: Nano Banana Pro
aspectRatio: "1:1"
needsRefImage: false
useCase: "给一支温情动画短片做前期故事板时用：一张方图排 8 个彩色画格，每格下面写镜头类型、画面说明和情绪关键词，讲一个孤单的孩子因为一只被风吹走的纸风车交到朋友的故事，可整体换成自己的剧情。"
prompt: |
  画一张动画电影的故事板开发稿，用 8 个画格讲一个关于[孤独、善意与找到朋友]的小故事，片名是《[空秋千]》。
  版面：1:1 方图，米白色纸张底。顶部居中是手写感的棕色片名，下面一行小标题"电影故事板"。8 个画格排成三行：第一、二行各 3 格，第三行左边 1 个小格、右边 1 个横向长格作为结尾大画面。每格是细黑边框，里面画一圈红色的安全框线；相邻两格之间用蓝色小箭头标出阅读顺序，顺序是从左到右、从上到下。每格下方有说明文字：加粗的"编号 + 镜头类型"，接一到两行画面说明，最后一行以短横线开头写情绪关键词。
  画风：经典手绘动画电影的质感，背景是细腻的手绘水粉风景，人物表演细致、表情生动；雨后多云的傍晚，全片笼罩在金色的夕阳光里。
  人物：主角是一个[长发小女孩]，穿米黄色毛衣和牛仔短裤，手里拿着一只[手工纸风车]；另有四五个年纪相仿的孩子，其中一个最热心。
  8 格内容：
  1. 大远景，建立镜头：小雨过后的街区小公园，孩子们在远处笑闹；主角独自坐在秋千上，旁边的空秋千被风轻轻吹动。情绪：温暖、怀旧。
  2. 特写，缓慢推近：主角远远看着别的孩子，轻轻转着手里的纸风车，露出一点落寞的微笑。情绪：亲近、惆怅。
  3. 跟拍：一阵风把纸风车从她手里卷走，飞过公园，她起身去追。情绪：动感。
  4. 低角度主观镜头：风车落在那群孩子脚边，她停住了，不敢上前；从她的视角看过去，那群人又远又让人发怵。情绪：脆弱、孤立。
  5. 中景，群像：一个孩子发现了风车，大家没有直接还回去，而是一起把撕破的一角补好，还画上彩色的图案和留言；主角惊讶地看着。情绪：暖心的善意。
  6. 柔和特写：最热心的那个孩子带着微笑走过来，把修好的风车轻轻递还给她，大家邀她一起玩。情绪：真诚、敞开。
  7. 动态奔跑镜头，逆光：她眼里泛着泪光，第一次开怀地笑，攥着风车跑向大家。情绪：喜悦、如释重负。
  8. 结尾大远景，横向长格：她和新朋友们在晚霞下一起欢笑，背景里那只曾经空着的秋千轻轻晃动，修好的风车在晚风里转。情绪：[苦涩又温暖，令人难忘]。
  限制：严格 8 格；说明文字全部用简体中文、清晰可读；不要 Logo 和水印，也不要模仿任何现成动画作品里的角色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/codewithhajra/status/2067971258134745321
  author: "@codewithhajra"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并逐格整理成\"景别 + 画面 + 情绪\"；片名、主题、主角、贯穿道具、结尾情绪设为变量；原文\"像某经典动画电影公司的遗珠之作\"改为通用的\"经典手绘动画电影的质感\"，并加上\"不模仿现成作品角色\"；原文没有写版式，按示例图补充了\"米白底、顶部片名、三行排布、红色安全框、蓝色顺序箭头、每格下方说明文字\"和主角服装。"
images:
  - 3534-empty-swing-anime-film-storyboard-board-1.jpg
imageCredit:
  by: "@codewithhajra"
  url: https://youmind.com/nano-banana-pro-prompts?id=26191
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[空秋千] 是片名，[孤独、善意与找到朋友] 是主题，换题材时把 8 格照"独处—失去—犹豫—被善待—融入"的情绪线重写；[长发小女孩] 和 [手工纸风车] 是主角与贯穿全片的小道具，可换成"戴眼镜的小男孩 + 断线的风筝"；最后一个变量是结尾的情绪词。每格的镜头类型建议保留。

示例图是英文说明版：米白底的方图，顶部是棕色手写片名和一行小标题；8 个带红色安全框的画格里是暖橙色夕阳下的公园和长发、穿米黄毛衣的小女孩——独坐秋千、转风车、追风车、远望一群孩子、孩子们补风车、递还风车、逆光奔跑，最后一个横向长格是大家站在晚霞下。每格下面有编号、镜头类型和两三行说明。第二行的箭头方向和编号顺序是反的，片名下还有一行写错的日文小字。

**常见问题**：
- 箭头和编号对不上：保留"从左到右、从上到下"这一句，或干脆不要箭头。
- 说明文字太小：每格说明压到两行，或把画幅改成 3:4 竖版。

**适合**：动画短片和绘本的前期故事板、分镜课作业、公益短片提案；要送去生成视频时，可以按格拆开逐张重画。

### 英文原版

```text
STORY

Panel 1

Warm cloudy evening after light rain.

A small neighborhood park glows under golden sunset light.

Children are laughing and playing together.

In the distance, the long-haired girl sits alone on a swing.

The empty swing beside her slowly moves in the wind.

Camera note:
Wide establishing shot.

⸻

Panel 2

Close-up.

The girl watches the other children from afar while quietly spinning her handmade paper windmill.

A faint sad smile appears.

Camera note:
Slow push-in.

⸻

Panel 3

A sudden gust of wind lifts the paper windmill from her hands.

It flies across the park.

The girl stands and runs after it.

Camera note:
Tracking shot.

⸻

Panel 4

The windmill lands near a group of children playing.

The girl hesitates and freezes.

She is too shy to approach them.

From her perspective the group feels intimidating and distant.

Camera note:
Low-angle emotional POV.

⸻

Panel 5

One of the children notices the windmill.

Instead of simply returning it, the group carefully repairs a torn corner and decorates it with colorful drawings and messages.

The girl watches in surprise.

Camera note:
Medium emotional shot.

⸻

Panel 6

The kindest child walks toward her with a warm smile and gently offers the windmill back.

The group invites her to join them.

Camera note:
Soft close-up.

⸻

Panel 7

The girl’s eyes fill with tears.

For the first time she smiles openly.

She runs toward the group while clutching the repaired windmill.

Camera note:
Dynamic running shot with sunset backlight.

⸻

Panel 8

Final emotional wide shot.

The girl and her new friends laugh together beneath glowing sunset clouds.

The once-empty swing gently moves in the background.

The repaired windmill spins in the warm evening breeze.

Mood:
{argument name="mood" default="Bittersweet, heartwarming, unforgettable"}.

Camera note:
Large cinematic ending frame.

FINAL GOAL

Create a breathtaking premium {argument name="style" default="anime film development board"} that tells a deeply emotional story about {argument name="theme" default="loneliness, kindness, and finding friendship"}.

The artwork should feel like a lost masterpiece from a classic theatrical anime studio, with stunning painted backgrounds, expressive character acting, emotional visual storytelling, and a touching ending that leaves a lasting emotional impact.
```

> 改编自 [@codewithhajra](https://x.com/codewithhajra/status/2067971258134745321) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

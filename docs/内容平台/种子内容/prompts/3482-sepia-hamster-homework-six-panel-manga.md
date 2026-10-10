---
title: "ai漫画生成提示词：复古棕色调六格仓鼠父子漫画（暑假作业）（gpt-image-2）"
slug: sepia-hamster-homework-six-panel-manga
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "9:16"
needsRefImage: false
useCase: "想把一个亲子小段子画成条漫时用：六个横向分格、棕褐色铅笔线条的老式漫画，讲仓鼠爸爸帮孩子画暑假作业海报、结果自己越画越上头，每格带中文对白，最后一格用旁白抖包袱。"
prompt: |
  目标：画一页竖版的单色日式漫画，讲一个"真实故事"风格的小段子：[仓鼠爸爸]帮孩子做暑假作业海报，结果越画越上头。
  画布：竖长的漫画页，约 9:16；暖米白纸张上的棕褐色墨线，手绘交叉排线和铅笔般的线条，细黑格框，怀旧的老式绘本氛围。
  版式：恰好 6 个上下堆叠的横向分格。场景是一间温馨的木屋：木地板、书架、盆栽、窗帘和窗户，地上有画具、一大张画纸、颜料盘、水桶、画笔和马克杯。所有对白都放在对话气泡和旁白框里，文字用简体中文竖排。
  角色：两只毛茸茸的仓鼠。孩子体型小、圆滚滚，黑亮的眼睛，不戴眼镜，拿着画笔认真地画；爸爸更大更圆，戴[小圆眼镜]，一开始端着马克杯，后来拿起画笔，越来越投入。两只都画成写实又可爱的仓鼠，不要拟人化的吉祥物造型。
  分格内容：
  第 1 格：小仓鼠面对地上一张空白海报纸，画具在左边，身后是窗帘和书架。右侧竖排旁白框："仓鼠的暑假作业，要交一张自由研究的主题海报"；小仓鼠的气泡："今年也画[绿化海报]吧"。
  第 2 格：小仓鼠在大纸上画树，戴圆眼镜的爸爸端着杯子站在旁边看。
  第 3 格：父子并排趴在海报前。爸爸："海报啊"；孩子："嗯，暑假作业"。
  第 4 格：爸爸隔着画纸向孩子借画笔，孩子头上一个问号。爸爸："借我一下"；孩子："嗯？"
  第 5 格：海报特写，画面变得极其精细，画的是[茂密的森林风景]，树木枝叶繁多，右上角是爸爸握笔的爪子。左侧孩子的气泡："哦哦……！爸爸画得真好！"
  第 6 格：爸爸完全沉迷，冒着汗弓着背伏在海报上，带着戏剧化的速度线画出无比繁复的画面；身后的小仓鼠一脸震惊慌张。周围散落画具、颜料盘和水桶。孩子的锯齿形气泡："爸爸……!!这样就不是我画的海报了!!!爸爸!!爸爸!!"；底部旁白框："[最后两天重画了一遍]"。
  风格：老式报纸漫画，柔和的棕褐单色，毛发质感细腻，表情生动，节奏舒缓的幽默，房间透视真实；不要现代数码上色，不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2077569764004860036
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；六格里的日文对白和旁白全部译成中文；主角组合、爸爸的配件、作业主题、最终画的内容、结尾旁白改为变量；原文末尾重复的\"可自定义元素\"段落并入正文。"
images:
  - 3482-sepia-hamster-homework-six-panel-manga-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=28931
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[仓鼠爸爸] 是主角组合，可换成"猫妈妈""熊爷爷"，同时把正文里的"仓鼠"改掉；[小圆眼镜] 是大人的标志配件；[绿化海报] 和 [茂密的森林风景] 是作业主题与最后画出来的内容，可以换成"防火手抄报"和"细节惊人的消防车"；最后一格的旁白 [最后两天重画了一遍] 是包袱，可以换成自己的结尾。六格对白都能改，每个气泡尽量不超过 15 个字。

示例图是原作者的日文版：六个横向分格自上而下，棕褐色铅笔线条。小仓鼠对着白纸说要画绿化海报；戴圆眼镜的爸爸端着杯子在旁边看；父子凑在一起聊作业；爸爸伸手借笔，孩子头上冒出问号；海报特写里树木画得极细；最后一格爸爸满头大汗埋头猛画，孩子在身后惊慌大喊，底部旁白框收尾。

**常见问题**：
- 对白错字多：先生成不带字的版本，写"气泡留空"，再自己排字。
- 分格数量不对：把"恰好 6 个横向分格"提到最前面。
- 两只仓鼠分不清：强调"爸爸体型是孩子的两倍，始终戴圆眼镜"。

**适合**：亲子日常段子漫画、公众号条漫、家长群里的幽默配图。

### 英文原版

```text
Goal: Create a vertical monochrome Japanese manga page about a true-story style hamster father going overboard with a child’s summer homework poster.

Canvas: Tall portrait manga page, about 9:16, sepia ink on warm off-white paper, hand-drawn crosshatching and pencil-like linework, thin black panel borders, nostalgic Showa-era storybook atmosphere.

Layout: Use exactly 6 stacked horizontal comic panels. Interior setting is a cozy wooden room with floorboards, bookshelf, potted plant, curtains and window, art supplies, a large sheet of drawing paper, paint tray, bucket, brushes, and mugs. Keep all dialogue in Japanese speech bubbles and narration boxes.

Characters: Two fluffy hamsters. The child hamster is small, round, cute, black glossy eyes, no glasses, drawing earnestly with a brush. The father hamster is larger and rounder, wearing small round glasses, holding a mug at first, then a brush, becoming increasingly intense and focused. Both are rendered as realistic-cute hamsters rather than humanoid mascots.

Panel details: Panel 1 shows the child hamster facing a blank poster sheet on the floor, art supplies on the left, curtains and bookshelf behind. Add a vertical narration box on the right reading 「ハムスターの夏休みの宿題は『自由研究』の課題ポスターの提出が必要だった」 and a speech bubble from the child reading 「今年も緑化ポスターを描こう」. Panel 2 shows the child hamster drawing trees on the large paper while the father hamster with round glasses stands nearby holding a mug and watching. Panel 3 shows father and child side by side over the poster; father points or comments with a bubble 「ポスターか」 and the child replies 「うん、夏休みの宿題」. Panel 4 shows the father asking to borrow the brush, facing the child across the paper; include a question mark over the child’s head, father bubble 「ちょっと貸して」 and child bubble 「うん？」. Panel 5 is a close-up of the poster becoming extremely detailed: dense forest scenery with many trees and foliage, father’s paw holding a brush at the upper right, child bubble on the left 「おお……！お父さん上手！」. Panel 6 shows the father hamster completely absorbed, sweating and hunched over the poster, drawing an incredibly elaborate forest with dramatic speed lines; the child hamster behind him looks shocked and panicked. Include scattered art supplies, paint tray and bucket. Add a jagged speech bubble from the child reading 「お父さん……!!そしたらハムスターが描いたポスターじゃなくなっちゃう!!!お父さん!!お父さん!!」 and a bottom caption box reading 「ラストの２日で描き直した」.

Visual style: Vintage Japanese newspaper manga, soft sepia monochrome, detailed fur texture, expressive faces, gentle comedy pacing, realistic room perspective, no modern digital coloring, no watermark.

Customizable elements: The homework theme is {argument name="homework poster theme" default="greenery poster"}; the main characters are {argument name="animal characters" default="father and child hamsters"}; the father accessory is {argument name="father accessory" default="round glasses"}; the final poster subject is {argument name="final poster subject" default="dense forest scenery"}; the bottom punchline caption is {argument name="punchline caption" default="ラストの２日で描き直した"}.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2077569764004860036) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

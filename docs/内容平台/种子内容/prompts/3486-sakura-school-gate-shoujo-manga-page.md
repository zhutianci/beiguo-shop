---
title: "漫画提示词：樱花校门黑白少女漫画页，五格分镜 + 眼镜一抹青色发光（gpt-image-2）"
slug: sakura-school-gate-shoujo-manga-page
model: gpt-image-2
topics: [comic, illustration]
aspectRatio: "2:3"
needsRefImage: false
useCase: "需要一页\"印刷品质\"的黑白少女漫画时用：网点、排线、集中线和大号拟声词齐全，五格里有远景、小插格、特写和倾斜大场面，全页只留一处淡青色发光作点睛，适合做原创漫画样页或开篇页。"
prompt: |
  画一页黑白漫画：两个女学生在樱花树下走到校门口，同行的戴眼镜女生身上带一点淡青色的光。
  画布：竖版漫画页，约 2:3，高分辨率的黑白网点漫画风，粗黑的分格线，干净的线稿，集中线、飘落的花瓣和夸张的透视。只用灰阶明暗，全页唯一的彩色是眼镜女生眼镜上的淡青色发光。
  分格：恰好 5 格。
  1. 上方左侧大格：双马尾女生站在樱花道上，身体前倾、双手撑着膝盖，远处是校门。对白框："[啊，看到校门了——]"
  2. 右上的窄长小格：只画到肩膀以下的长发女生，穿水手服，双手在身前提着书包。
  3. 紧挨着的小格：同行的另一个女生戴贝雷帽，眼镜发出淡青色的光，她用手指扶了一下镜架，神情笃定。
  4. 中间的横向宽格：双马尾女生的近景特写，一只手拢在嘴边，另一只手高高挥起打招呼。对白框："[沙罗同学——、小葵！]"
  5. 下方大格：倾斜的仰视构图，雕花铁艺校门在强烈的逆光里打开；长发女生回头转向观众，戴眼镜的女生站在右侧稍远处。画面里用大号手写拟声词表现开门声："[哗啦啦——]"
  人物：双马尾女生扎着蓬松的中长双马尾、系缎带，动作腼腆又有活力；长发女生头发很长、随风飘动，神情从容；眼镜女生戴圆贝雷帽、长发、及膝袜，带一点神秘的科技感。三人都穿[水手服配蝴蝶结和百褶裙]。
  场景与画风：[樱花盛开的春天]，校门前两排茂密的樱花树、飘落的花瓣、石板路、雕花铁门、门后射来的强光；细致的漫画排线、网点、速度线和电影感透视，精致的日系少女漫画页面，头发刻画细腻。
  限制：除眼镜的青色光之外全页黑白；不要多余的分格、多余的主要角色、水印、Logo 和英文；人物旁可以有极少量的小拟声词，但不能抢画面。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/charon_artist/status/2056721178224636315
  author: "@charon_artist"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并分格列出；两句日文对白和开门拟声词译成中文并设为变量；校服和季节保留为变量；删去原文\"脸部用灰色模糊块遮挡\"的设定（示例图中人物面部为正常绘制）。"
images:
  - 3486-sakura-school-gate-shoujo-manga-page-1.jpg
imageCredit:
  by: "@charon_artist"
  url: https://youmind.com/gpt-image-2-prompts?id=21575
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：三处引号里的文字是两句对白和一个大拟声词，对白写成"第一格自言自语、第四格喊人名"最顺；人名换成你角色的名字。[水手服配蝴蝶结和百褶裙] 可以换成"西式制服外套配格子裙""运动服"；[樱花盛开的春天] 换成"飘雪的冬日清晨"时，把樱花树和花瓣一并改成落雪的行道树。那一抹青色可以换成别的单色，但全页只留一种。

示例图是日文对白版的黑白漫画页：左上大格里，双马尾水手服女生在樱花道上弯腰撑膝，身后远处是校门；右上的小插格里并排画着提书包的长发女生和戴贝雷帽、眼镜发着青光、手扶镜架的女生；中间横格是双马尾女生挥手喊人的特写；下方大格是倾斜视角的雕花铁门和逆光，两个长发女生的背影与回眸，左下角是一排超大的手写拟声词。全页只有眼镜和那位女生的头发边缘带淡青色。

**常见问题**：
- 整页变成彩色：把"只用黑白灰，仅眼镜处一抹淡青色"放到提示词第一句。
- 第 2、3 格合成了一格：不影响阅读；介意就写"两个小格之间有明确的黑色分格线"。
- 中文拟声词不好看：拟声词保留日文假名，只把对白换成中文。

**适合**：原创漫画开篇页、轻小说黑白插页、漫画分镜练习的参考样张。

### 英文原版

```text
Goal: Create a black-and-white manga page about two schoolgirls arriving at a school gate under cherry blossoms, with one character partly highlighted in pale cyan and the other character’s face obscured by gray blur blocks.

Canvas: Vertical manga page, approximately 2:3 aspect ratio, high-resolution monochrome screentone style with thick black panel borders, clean line art, speed lines, petals, and dramatic perspective. Use grayscale shading with only one accent color: faint cyan glow on the glasses-haired girl.

Layout: Use exactly 5 visible manga panels. Panel 1 is a large top-left scene showing a twin-tailed schoolgirl in a sailor uniform standing on a cherry blossom path with the school gate far behind her; her face is covered by a soft-edged gray rectangular blur. Panel 2 is a narrow inset at the top right showing a cropped long-haired girl in sailor uniform holding a school bag in front of her body. Panel 3 is another top-right inset beside it showing the same long-haired girl wearing a beret and glowing cyan glasses, touching the bridge of her glasses with a confident gesture. Panel 4 is a wide middle panel showing the twin-tailed girl close up, raising one hand in greeting; her face is again covered by a larger gray rectangular blur. Panel 5 is a large bottom panel showing a dramatic tilted view of an ornate school gate opening in bright light, with the long-haired girl running or turning toward the viewer and the cyan-glasses girl standing farther back on the right.

Characters: The twin-tailed girl has messy medium-length twin ponytails tied with ribbons, a sailor school uniform with bow, pleated skirt, and shy energetic body language. The long-haired girl has very long flowing hair, sailor uniform, pleated skirt, school bag in one inset, and a composed expression in the bottom panel. The second version of the long-haired girl wears a round beret, glasses glowing pale cyan, sailor uniform, dark skirt, knee socks, and has a mysterious tech-like aura.

Text content: Include exactly 3 Japanese speech/sound text elements: a speech bubble in panel 1 reading {argument name="first speech bubble" default="あ見えたー校門"}, a speech bubble in panel 4 reading {argument name="second speech bubble" default="沙羅さーん、葵ちゃん！"}, and large stylized gate-opening sound effects in panel 5 reading {argument name="sound effect text" default="ザァァァ"}. Add small handwritten manga sound effects near the girls if needed, but keep them minimal and visually secondary.

Setting and style: A spring school entrance lined with dense cherry blossom trees, falling petals, stone path, ornate iron gate, bright backlight from the gate, detailed manga hatching, screentones, speed lines, and cinematic perspective. The overall style should resemble a polished Japanese shoujo manga page, with expressive poses, delicate hair rendering, dramatic lighting, and clean page composition.

Constraints: Keep the page monochrome except for the cyan glow on the glasses character. Keep the blurred gray face blocks visible on the twin-tailed girl in panels 1 and 4. Do not add extra panels, extra main characters, watermarks, logos, or English text. Use {argument name="school uniform style" default="Japanese sailor uniforms with bow ties and pleated skirts"} and a {argument name="season" default="spring cherry blossom season"} atmosphere.
```

> 改编自 [@charon_artist](https://x.com/charon_artist/status/2056721178224636315) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

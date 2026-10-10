---
title: "ai故事板提示词：品牌短片提案分镜板，12 格画面 + 每格画面说明与情绪备注（gpt-image-2）"
slug: brand-film-pitch-storyboard-12-frame-board
model: gpt-image-2
topics: [ppt, comic, poster]
aspectRatio: "4:3"
needsRefImage: false
useCase: "给品牌短片、公益片或课程宣传片做提案时用：一张 4:3 的版面排出 3 行 4 列共 12 个镜头，每格下面是编号、镜头名、一句画面说明和一句备注，底部一条情绪走向线，统一的暖色调，直接可以放进提案 PPT。"
prompt: |
  我要给一支品牌短片做提案，请帮我出一张分镜板：4:3 画幅，版面像杂志内页一样讲究，整体要有高级感。
  - 标题：顶部居中一行加粗的大写标题（示例图写的是 "WITHIN — EMOTIONAL WELLNESS EDITORIAL"，可整行换成你的片名）。
  - 镜头格子一共 12 个，排成 3 行、每行 4 个；每个格子上面放一张 16:9 的电影感画面，下面留一块浅色区域写字；格子之间的间隔相等，四周有很细的边线。
  - 统一母题：12 张画面都以[一只摊开、掌心向上的手]为主体，手的位置和大小基本一致，变化的只是手周围的环境和光线，用来表现情绪的推进。
  - 情绪推进（从第 1 格到第 12 格）分五个阶段：[混乱不堪]、[停下来]、[呼吸]、[感受]、[回到自己]——开头两格是飞旋的碎片和纸屑；随后碎片落定，出现一束斜光和植物的影子；中段是飘动的叶子和柔和的气流；接着掌心上方浮起一小团暖光，背景变成拱门和庭院；最后几格是开阔的山谷、被树影照亮的墙面和日出的云海。
  - 每格文字（英文或中文均可，全板统一）：第一行是赭色的编号加镜头名（如"01 OVERWHELM""03 PAUSE"）；第二行以"Visual:"开头写一句画面说明；第三行以"Note:"开头写一句导演备注。
  - 版面最下方画一条从左指向右的细箭头线，线上按顺序写出五个阶段的名字，让人一眼看懂整支片子的情绪怎么走。
  - 全板的颜色控制在[暖赤陶色 + 柔和的鼠尾草绿]之内，底色是米白的纸面；每张小画面都带一点胶片的柔光，景深要浅。
  - 所有文字排得整齐、看得清；真实品牌的名字和标志一概不出现，也不要水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/Strength04_X/status/2065824927408959965
  author: "@Strength04_X"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；仓库收录的原文较短且在标题处截断，这里按示例图补全了 12 格的结构、每格的文字格式、统一的视觉母题和底部的情绪线；统一母题、配色、五个阶段改为变量，顶部标题保留原文作示例并注明可替换；删去原文点名的两个心理健康品牌"
images:
  - 3572-brand-film-pitch-storyboard-12-frame-board-1.jpg
imageCredit:
  by: "@Strength04_X"
  url: https://youmind.com/gpt-image-2-prompts?id=25540
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：顶部标题不是方括号变量，直接把括号里的示例整行替换成你的片名；统一母题是这张分镜板的关键，可以换成"一杯冒着热气的茶""一双走路的脚""一扇窗"，12 格都围绕它变化；五个阶段各填一个短词，再把破折号后面的画面描述按你的故事改写；配色选两种主色即可。

示例图是一张米白底的版面：顶上一行大写英文标题，下面 12 张小画面里都是一只伸出的手，前两张周围是飞散的棕色碎片，随后依次出现斜射的光、绿叶、缭绕的白色气流、掌心上的小光球、拱门、山谷和日出；每张图下面是橙褐色的编号和镜头名，以及"Visual""Note"两行小字；最底下一条箭头线标着 OVERWHELM、PAUSE、BREATHE、FEEL、RETURN。

**常见问题**：
- 每格小字是乱码：把每格文字缩成"编号 + 镜头名"一行，说明文字回到 PPT 里自己写。
- 12 格画面毫无关联：强调"同一母题、同一机位，只改变环境与光线"。
- 色调跳来跳去：把两种主色写进每一段画面描述。

**适合**：品牌短片与公益广告的提案、课程和冥想类产品的宣传片脚本、视频团队内部对齐镜头用的分镜板。

### 英文原版

```text
Create a high-end 4:3 pitch deck storyboard in 3x4 grid (12 frames), editorial layout, Headspace/Better Help premium campaign style, warm terracotta + soft sage palette. Add a bold centered heading at the top of the storyboard:
```

> 改编自 [@Strength04_X](https://x.com/Strength04_X/status/2065824927408959965) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

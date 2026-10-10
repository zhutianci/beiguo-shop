---
title: "ppt提示词：正反例对比讲解页，左边要点 + 坏例好例两张卡，右边大示范图（gpt-image-2）"
slug: good-vs-bad-example-teaching-slide
model: gpt-image-2
topics: [ppt, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做教程、培训课件里\"这样写不好、这样写才对\"的讲解页：左栏是编号标签、一句结论和坏例 / 好例两张对比卡，右栏用一整块区域展示按好例做出来的效果。示例讲的是\"写生图提示词要先说清留白和不要什么\"。"
prompt: |
  请做一页用来"讲一个技巧"的教学幻灯片，横版 16:9：底色是偏暖的米白，四周边距留得宽，排版走现代极简的杂志路线，正文深藏青色，强调色用青绿。
  - 版式：分左右两栏。左栏约占 48% 宽度，放讲解文字和两张对比卡；右栏约占 47% 宽度，放一张大的示范图。
  - 左栏从上到下：
    - 左上角一个青绿色圆角胶囊标签，白字"[技巧①]"；
    - 一行很大的深藏青色粗体标题："[先说清留白和「不要放什么」]"，只在引号里的那几个字下面加一条青绿色细下划线；
    - 一个青绿色的圆形对勾图标，后面跟一句粗体短语"[最管用。]"；
    - 并排两张圆角卡片：左卡顶部是灰色小标签"坏例子"，写一句含糊的要求"[做一张夏季促销横幅，要好看一点。]"，下面配一张元素堆得很满的花哨促销横幅缩略图；右卡顶部是青绿色小标签"好例子"，右上角带对勾，里面是四行要点："[背景用纯藏青色]""[上下左右留出大片空白]""[中央只放「夏季特卖」大字]""[其他文字、装饰、角标都不要]"。
  - 右栏：一个纯深藏青色的大矩形，正中只有一行白色粗体大字"[夏季特卖]"，四周全是留白——这就是按"好例子"做出来的效果。
  - 全部文字为简体中文，要清楚、不能有错别字；页码、水印和无关的装饰一概不要。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/tasky_ai/status/2071615037173858700
  author: "@tasky_ai"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文（画面文字为日文）译为中文并精简；编号、结论标题、坏例与好例的文字、示范图上的大字改为变量，日文文案全部换成对应的中文；保留左右栏比例和配色"
images:
  - 3508-good-vs-bad-example-teaching-slide-1.jpg
imageCredit:
  by: "@tasky_ai"
  url: https://youmind.com/gpt-image-2-prompts?id=27231
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这一页的骨架是"编号 → 一句结论 → 坏例 / 好例 → 右侧效果"。把结论标题换成你要讲的要点（如"先给角色，再给任务"）；坏例写一句大家常犯的含糊说法，好例拆成 3～4 条具体做法；右侧大图的内容要和好例对应，如果讲的不是设计类主题，可以把右栏改成"一段示范输出的截图样式"。

示例图左上是绿色的编号胶囊和两行深色大标题（原图为日文），其中一个词带绿色下划线；下面两张卡片，左边"坏例"里是一张塞满椰树、折扣角标和日期的夏季促销横幅，右边"好例"是四行要点；右半边是一整块藏青色矩形，中间只有一行白色大字。

**常见问题**：
- 卡片里的小字糊成一团：好例只留 3 条、每条不超过 10 个字；或者让卡片文字留空，自己后期排。
- 左右两栏比例失衡：写死"左右各占一半，中间留一条空白间距"。
- 坏例缩略图不够"乱"：加"至少包含 5 种颜色、3 种字体和多个角标"。

**适合**：提示词教程、设计规范培训、写作课里的对比讲解页；整套课件可以保持同一配色，只换编号和内容。

### 英文原版

```text
Goal: Create a clean Japanese instructional slide about prompt-writing tip {argument name="tip number" default="コツ①"}, explaining that whitespace and excluded elements should be stated first.

Canvas: 16:9 horizontal presentation slide, warm off-white background, generous margins, modern minimalist editorial layout. Use dark navy text and teal accents.

Layout: Split the slide into two main columns. The left column takes about 48% width and contains the lesson text plus two comparison cards. The right column takes about 47% width and shows a large example banner: a solid navy rectangle with only one centered white headline.

Left column details: At top left, place a rounded teal pill label reading {argument name="badge text" default="コツ①"}. Below it, use a large bold Japanese headline in dark navy: {argument name="main headline" default="余白と「入れないもの」を最初に明示する"}. Add a thin teal underline only under the phrase 「入れないもの」. Under the headline, place a teal circular check icon followed by bold text: 「一番効きます。」 with a short teal underline beneath the sentence.

Comparison section: Below the lesson text, place exactly 2 rounded rectangular cards side by side with light gray borders. Card 1 is the bad example, labeled with a small gray pill 「悪い例」 at the top and a pale gray X icon near the upper-left corner. It contains the quote 「夏のセールのバナーを作って。おしゃれな感じで。」 and below it a busy colorful summer-sale banner thumbnail with palm leaves, beach colors, decorative badges, English words, discount circles, dates, and many small ornaments; visible text includes “SPECIAL”, “SUMMER”, 「夏のセール」, 「今だけおトク！」, 「最大50% OFF」, and 「期間限定！7.1 TUE ▶ 7.31 THU」. Card 2 is the good example, labeled with a teal pill 「良い例」 at the top and a teal check icon at the upper-right corner. It contains a short bullet list in Japanese describing the constraints: 「夏のセールのバナー。」, 「背景は単色のネイビー」, 「上下左右に広い余白を残す」, 「中央に『夏のセール』のみ大きく」, 「他の文字・英語・装飾・バッジは一切入れない」.

Right column example: Create one large solid dark navy rectangle with no border, no decoration, and wide empty space. Center a single white Japanese headline reading {argument name="banner headline" default="夏のセール"}. The text should be large, bold, clean sans-serif, horizontally and vertically centered. Do not add any other text, icons, badges, images, patterns, gradients, or decorative elements inside this right banner.

Visual style: Japanese tech/business education design, crisp typography, high contrast, precise spacing, subtle rounded corners, teal accent color, no watermark. Keep the composition close to a screenshot-like presentation slide.
```

> 改编自 [@tasky_ai](https://x.com/tasky_ai/status/2071615037173858700) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

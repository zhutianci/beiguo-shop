---
title: seedance 提示词：田园美食治愈短片（摘菜—切菜—上桌三镜头）
slug: seedance-rural-cooking-film
model: seedance
topics: [cinematic]
modelLabel: Seedance 2.0
aspectRatio: "16:9"
needsRefImage: false
useCase: 生成 15 秒"现代田园生活"风格的治愈美食短片：清晨采摘、灶台切菜、院中上桌，适合美食号、民宿、农产品账号的氛围视频。
prompt: |
  【风格】现代田园美学，商业广告级电影质感，电影机拍摄的 4K 超清画面，极致微距，自然通透的光线，治愈系 ASMR；不要古装剧的感觉。
  【场景】一间整洁的现代农家开放式厨房，背景是一片茂盛的[菜园]，阳光明亮。
  【人物】一位现代田园创作者，黑色长发用[木簪]随意挽起，穿[深蓝色亚麻衣服]，淡妆，眼神专注而平静。
  【分镜】
  [00:00-00:05] 镜头一｜清晨采摘：高清特写，晨光从侧后方照在植物上。她用手指（修长、干净）从藤上摘下一个挂着露珠的[红番茄]。焦点极其锐利，能看清果皮上的细绒和水珠滑落的轨迹，背景是柔和虚化的绿色。
  [00:05-00:10] 镜头二｜灶台手艺：室内灶台区，生活气息浓但一尘不染。她熟练、利落地切菜（不是表演式动作）。微距捕捉刀刃切开食材、汁水溅出的瞬间，随后切到[土灶]里跳动的橙色火苗，光影温暖真实。
  [00:10-00:15] 镜头三｜安静时光：全景 / 中景。一盘精致的家常菜放到院子里的长木桌上，她安静坐下，轻轻拢起一缕碎发，夹起一口菜。逆光中热气缓缓升起，安静得仿佛能听见风声。
  【声音】鸟鸣、刀切在案板上的清脆声、柴火噼啪声、轻风声；没有背景音乐和人声。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedance-2-prompts
  url: https://x.com/johnAGI168/status/2021818021354848258
  author: "@johnAGI168"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 由仓库英文版回译为中文；删去具体相机型号；菜园、发饰、服装、食材、灶具改为变量；新增【声音】一段
images:
  - 205-seedance-rural-cooking-film-1.jpg
imageCredit:
  by: "@johnAGI168"
  url: https://x.com/johnAGI168/status/2021818021354848258
  license: CC BY 4.0
verify:
  - 实测切菜镜头刀与手指是否穿模、是否出现多余手指
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**时长与镜头**：3 个镜头各 5 秒，用【风格】【场景】【人物】【分镜】分段写，是中文创作者常用的 Seedance 结构，换题材时只改方括号里的内容。

**怎么填变量**：[红番茄] 可换"带泥的萝卜""刚摘的青椒"；[土灶] 换成"铁锅""砂锅"；想做民宿宣传，把镜头三的场景改成"[民宿露台]"。

**常见失败与调整**：
- 切菜时手指畸形或刀穿过手：镜头二改成"刀刃特写，只露出握刀的手背"，或直接拍"切好的食材落入碗中"。
- 人物在三个镜头里长得不一样：上传一张人物参考图，并加一句"人物长相、发型、服装全程一致"；或者镜头一、二只拍手。
- 画面像古装剧：保留"不要古装剧的感觉"，服装写得更现代，如"亚麻衬衫、围裙"。

**提醒**：不要在提示词里写具体博主的名字或模仿某位真人的形象。

> 改编自 [@johnAGI168](https://x.com/johnAGI168/status/2021818021354848258) 发布、[YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) 收录的提示词，许可证 CC BY 4.0。

### 英文原版

```
[Style]
Modern Rural Aesthetics, Cinematic Commercial quality, shot with Sony A7S3/cinema camera, 4K/8K ultra-clear, Extreme Macro, natural transparent lighting, healing ASMR, no historical costume drama feel.

[Scene]
A well-maintained modern farmhouse open kitchen, background is a lush vegetable garden, bright sunshine.

[Character]
Modern Rural Creator, black long hair casually tied up with a wooden hairpin, wearing a dark blue comfortable linen outfit, clear makeup, focused and peaceful eyes.

[Shot Details]
[00:00-00:05] Shot 1: Morning Harvest (The Freshness)
Visuals: High-definition close-up. Morning sunlight hits the plants with side backlighting.
Action: The Creator's bare hands (long, clean fingers) pick a bright red tomato with glistening dew drops from the vine.
Details: Extremely sharp focus, clearly showing the fuzz on the tomato surface and the trajectory of sliding water droplets. Background is blurred high-quality green.

[00:05-00:10] Shot 2: Extreme Craftsmanship (The Craft)
Visuals: Indoor stove area, full of life but spotless.
Action: The Creator is cutting vegetables, movements are skilled and precise (non-performance nature).
Details: Macro lens captures the moment the knife blade slices through the ingredients, juice splattering. Then switches to the orange flame flickering in the earthen stove, light and shadow are warm and real.

[00:10-00:15] Shot 3: Tranquil Time (The Moment)
Visuals: Full shot/Medium shot.
Action: A delicate home-cooked dish is placed on the wooden long table in the yard. The Creator sits down quietly, gently tidies a stray hair, and picks up a bite of food.
Atmosphere: Steam slowly rises against the backlight, the scene is so quiet you can almost hear the wind, showcasing the ultimate sense of relaxation modern people yearn for.
```

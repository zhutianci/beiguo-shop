---
title: 信息图提示词：俯拍食材 + 编号步骤 + 成品的菜谱长图，奶油蘑菇意面示例（gpt-image-2）
slug: step-by-step-recipe-infographic
model: gpt-image-2
topics: [food, infographic]
needsRefImage: false
aspectRatio: "9:16"
useCase: 做美食账号教程长图、料理课讲义、食谱电子书内页时，生成一张白底极简的分步菜谱：顶部是带克数标签的食材实拍图，中间是带图标的编号步骤和每步锅中实拍，底部是成品摆盘。
prompt: |
  为[奶油蒜香蘑菇意面]制作一张分步菜谱信息图，俯拍视角，白色背景，极简风格。
  - 顶部标题：菜名大字；
  - 食材区：每种食材单独一张俯拍小图，下面带用量标签："[200g 意面]"、"150g 蘑菇"、"3 瓣大蒜"、"200ml 淡奶油"、"1 汤匙橄榄油"、"帕玛森芝士"、"欧芹"；
  - 做法区：[4] 个编号步骤从上到下排列，每步左边是线性图标（[煮锅、炒锅、搅拌]），中间是简短说明，右边是这一步锅里的实拍俯视图；步骤之间用虚线连接；
  - 底部：一盘装好盘的成品意面特写，旁边可加一句手写小字提示；
  - 整体干净、留白充足，配色以白色、浅米色和食物本色为主。
  竖版长图。
negativePrompt: null
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/egeberkina/status/2046705259267948789
  author: "@egeberkina"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成食材区 / 做法区 / 成品三段；菜名、首个食材标签、步骤数、步骤图标设为变量；按示例图补充了每步锅中实拍和手写小字
images:
  - 3312-step-by-step-recipe-infographic-1.jpg
imageCredit:
  by: "@egeberkina"
  url: https://images.meigen.ai/tweets/2046705259267948789/0.jpg
  license: CC BY 4.0
verify:
  - 示例图是英文版，换成中文食材标签和步骤说明测一次，看小字是否清晰
  - 步骤说明里的时间、用量由模型生成，正式发布前需人工核对
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么填变量**：[奶油蒜香蘑菇意面] 换成任何菜，比如"番茄牛腩""日式亲子丼""蒜蓉粉丝蒸虾"；食材标签整串按新菜改写，[200g 意面] 示意第一项的写法，例如亲子丼写"200g 鸡腿肉""2 个鸡蛋""半个洋葱""1 碗米饭"。[4] 是步骤数，3～5 步最清晰；[煮锅、炒锅、搅拌] 是步骤图标，蒸菜可写"蒸锅、刀、碗"。示例图是英文版竖长图：顶部黑色大写标题，食材区两行共七个白碗装的食材，下面四个带编号的步骤，左边是锅和平底锅线条图标、中间是小字说明、右边是锅里从煮面到拌面的实拍，最底下一大盘蘑菇意面，左下角有手写体小字。

**常见问题与调整**：
- 食材图大小不一：加"所有食材图使用同样大小的白色圆碗，排成整齐网格"。
- 步骤说明太长糊掉：每步说明压到一句话，或只保留步骤名。
- 想做中式菜谱的氛围：背景改成"浅木纹桌面"，碗换成"青花瓷小碟"。
- 要横版 PPT 页：画幅改 16:9，食材在左、步骤在中、成品在右。

**适合**：美食教程长图、料理课讲义、食谱电子书；不适合需要严格营养计算的专业食谱。

### 英文原版

```
Create step-by-step recipe infographic for creamy garlic mushroom pasta, top-down view, minimal style on white background, ingredient photos labeled: "200g spaghetti", "150g mushrooms", "3 garlic cloves", "200ml cream", "1 tbsp olive oil", "parmesan", "parsley", dotted lines showing process steps with icons (boiling pot, sauté pan, mixing), final plated pasta shot at the bottom
```

> 改编自 [@egeberkina](https://x.com/egeberkina/status/2046705259267948789) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，仓库许可证 CC BY 4.0。

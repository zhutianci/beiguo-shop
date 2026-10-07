---
title: "菜品照片变海报提示词：手机随手拍的菜一键改成餐厅品牌海报（gpt-image-2）"
slug: phone-food-photo-to-brand-poster
model: gpt-image-2
topics: [food, photo-edit]
aspectRatio: "9:16"
needsRefImage: true
useCase: "上传一张手机随手拍的菜品照片，保留菜的食材、摆盘和角度，改成有品牌名、菜名和氛围光的竖版餐厅海报，适合小餐馆做外卖头图、门店海报和社媒宣传。"
prompt: |
  基于我上传的手机菜品原图，做一次高质量的风格改造，生成一张 9:16 竖版品牌海报。
  【商家品牌名】：[山海煲舍]
  【菜品类型】：[私房砂锅]
  【菜品名称】：[支竹焖排骨煲]
  【副标题 / 口号】：[一煲慢火，满屋生香]
  【主色调】：[深棕与暗金]
  请保留原图的核心食材结构、菜品类型辨识度、主要摆盘关系和大致视角，不要把它改成另一道菜。
  在此基础上提升为专业餐饮摄影：柔和的侧光与暖色氛围、深色背景与质感桌面、适量热气和高光，让食物更有光泽和食欲。
  版面：品牌名放在顶部，菜名用醒目的中文书法或宋体大字，副标题小字放在菜名下方，底部可加一行菜品类型或品牌英文名；整体高级、克制，像精品餐厅的菜品海报。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/MrLarus/status/2071555063865082205
  author: "Larus Canus"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文的中文模板整理为中文提示词；品牌名、菜品类型、菜名、副标题、主色调改为变量，并补充了画面风格与文字层级的说明"
images:
  - 3064-phone-food-photo-to-brand-poster-1.jpg
  - 3064-phone-food-photo-to-brand-poster-2.jpg
  - 3064-phone-food-photo-to-brand-poster-3.jpg
imageCredit:
  by: "Larus Canus"
  url: https://youmind.com/gpt-image-2-prompts?id=27190
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传一张自己店里菜品的手机照片（光线差、背景乱都没关系，菜要拍完整），然后填写品牌名、菜名、副标题和主色调。粤菜、私房菜适合"深棕与暗金"，日料适合"原木色与米白"，川菜可以试"深红与黑"。

示例图是作者做的改造前后对比：左边是普通的手机原图，右边是改造后的海报——支竹焖排骨煲（黑色砂锅、金色"山海煲舍"品牌名）、花胶鸡汤（岭南汤府）、古法卤鹅拼盘（潮味臻选），食材和摆盘与原图一致，只是光线、背景和排版都升级了。

**常见问题**：
- 菜被改成了别的样子：重复"保留原图的食材和摆盘，不要新增或删除食材"。
- 与实物差距过大：外卖平台要求图片与实物相符，改造只提升光线和氛围，不要夸大分量。
- 书法字有错：菜名尽量用常见字，生成后核对。

**适合**：小餐馆外卖头图、门店海报、菜单升级、餐饮社媒宣传。

### 原版提示词

```text
Upload an original photo of a dish taken with a mobile phone and perform a high-quality style transformation based on it.

[Merchant Brand Name]: {argument name="brand name" default="[Merchant Name]"}
[Dish Type]: {argument name="dish type" default="[Dish Category]"}
[Dish Name]: {argument name="dish name" default="[Dish Name]"}
[Subtitle / Slogan]: 
[Main Color Tone]: 
[Aspect Ratio]: 9:16

Please preserve the core ingredient structure, dish type recognizability, main plating relationship, and general perspective of the original image; do not change it into a different dish.
```

> 改编自 [Larus Canus](https://x.com/MrLarus/status/2071555063865082205) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

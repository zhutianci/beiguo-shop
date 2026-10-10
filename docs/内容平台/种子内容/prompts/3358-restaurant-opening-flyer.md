---
title: 即梦提示词：餐厅开业宣传单（木桌俯拍美食 + 手写体店名 + 日期地址，暖色调）
slug: restaurant-opening-flyer
model: jimeng
topics: [food, poster]
needsRefImage: false
aspectRatio: "4:5"
useCase: 新店开业、新品上市、节日活动需要一张有食欲的竖版宣传单或朋友圈海报时用，得到乡村风木桌美食摄影 + 手写体店名 + 日期地址的完整版面。
prompt: |
  一张令人垂涎、亲切诱人的[意大利餐厅]开业宣传单。
  - 主视觉：一张质朴美观的平铺美食照，木桌上摆满[披萨、一碗番茄意面、一杯红酒]，点缀新鲜罗勒叶；
  - 店名"[店名]"用温暖的手写花体字，放在画面上方；
  - 开业日期"[开业日期]"和地址"[店铺地址]"清晰可见；
  - 整体感觉温暖、地道、让人有食欲，暖色灯光，深色背景；
  - 竖版画幅[4:5]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5#no-12-italian-restaurant-grand-opening-flyer
  author: "@jaredliu_bravo"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文并拆成要点；餐厅类型、菜品、店名、日期、地址、画幅设为变量；补充文字位置和暖色灯光描述
images:
  - 3358-restaurant-opening-flyer-1.jpg
imageCredit:
  by: "@jaredliu_bravo"
  url: https://cms-assets.youmind.com/media/1765367961890_sii4rm_1f4e43ff4dda6b28373b94aed5aa7bffc4815c1f5d212053ab1a343051b86704-600x750.png
  license: CC BY 4.0
verify:
  - 中文店名和地址出一次，检查文字是否准确、手写体是否清晰
  - 示例图里的店名和地址是模型生成的虚构信息，页面需提醒使用时替换为真实信息
  - 确认原帖仍可访问、作者未另行声明保留权利（CC BY 4.0 需保留署名）
---
原作者用 Seedream 4.5 生成；即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：[意大利餐厅] 换成你的店型，比如"川菜馆""日式居酒屋""社区烘焙店"；菜品跟着改，川菜馆写"水煮鱼、麻婆豆腐、一碗米饭"，烘焙店写"可颂、欧包、一杯拿铁"；[店名] [开业日期] [店铺地址] 填真实信息，地址尽量简短。示例图是一张暗色背景的竖版海报：上方是橙黄色手写体英文店名和日期，左边一张玛格丽特披萨，中间一碗番茄意面，右上角一杯红酒，木桌上散落着罗勒叶，左下角是两行英文地址。示例图是英文版。

**常见问题与调整**：
- 中文手写体变形：店名控制在 2～6 个字，或改用"圆润的书法字体"。
- 食物看起来不像自家菜：先上传自家菜品实拍图，加"菜品外观参考上传图"。
- 想加优惠信息：在底部加一行"开业期间[优惠内容]"，但信息越多越容易出错。
- 做横版大屏海报：画幅改 16:9，菜品放右侧，店名和日期放左侧。

**适合**：餐厅开业单页、朋友圈 / 外卖平台活动图、门店易拉宝；用于宣传时，实物菜品要与图片一致。

### 英文原版

```
A delicious and inviting flyer for the grand opening of a new Italian restaurant. The main visual is a beautiful, rustic flat-lay photograph of a table laden with Italian food: a pizza, a bowl of pasta, a glass of red wine, and some fresh basil. The restaurant’s name is in a warm, handwritten script font. The date and address of the opening are clearly visible. The overall feel is warm, authentic, and appetizing. –ar 4:5
```

> 改编自 [@jaredliu_bravo](https://x.com/jaredliu_bravo) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，仓库许可证 CC BY 4.0。

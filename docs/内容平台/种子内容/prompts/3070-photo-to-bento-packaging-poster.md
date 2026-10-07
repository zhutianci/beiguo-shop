---
title: "照片转便当提示词：上半实拍、下半变成便利店便当盒的创意海报（gpt-image-2）"
slug: photo-to-bento-packaging-poster
model: gpt-image-2
topics: [ecommerce, food]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张照片，上半保留原图，下半把画面里的主体和构图\"翻译\"成透明盒装的日式便利店便当（米饭、蔬菜、蛋、海苔拼出原图），配商品标签和价格，适合创意海报、餐饮品牌营销和社媒趣味内容。"
prompt: |
  请把我上传的每一张照片分别做成一张独立的高端设计海报，不要拼贴，逐张输出。3:4 竖版，上下严格 1:1，各占画面 50%。
  上半部分：保留原照片，主体的身份、结构、姿态、真实质感、自然光线和原有色彩氛围都不变，只做轻微的高级调色，像艺术杂志或展览图片；环境可以自然延展以适配画幅，但主体不能被拉伸变形。
  下半部分：提取照片中最有辨识度的主体、轮廓和叙事关系，重构为[便利店便当包装视觉]。不要逐个照搬，而是理解核心视觉关系，把人物、建筑、植物等映射成米饭、蔬菜、鸡蛋、海苔等食材，让人通过食物依然能认出原图的灵魂。
  所有内容最终都装在一个透明的便利店熟食盒或便当托盘里。保持原图的构图层次，但可以重新编排：去掉无关背景，用模块化的食材和餐盒分格做出商业视觉，只保留定义身份的元素。
  下半部分使用俯拍的包装食品摄影视角，强调透明盒的质感、食物颗粒和新鲜感，像高端零售商品；构图干净精致，留白充足。
  从上半照片中提取最鲜明的颜色，转成自然的食物色（绿色用香草蔬菜、黄色用鸡蛋），避免暗沉油腻。
  加一套简洁的日式熟食包装标签系统：品名、价格或条形码。
  整体是日本便利店熟食包装美学：不是把照片画成食物，而是保留视觉灵魂，用食材和零售包装重新演绎。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/xiaoxiaodong01/status/2096609211870576683
  author: "小小东"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文中文说明的英文写法改写为中文；便当风格改为变量；精简重复的原则说明"
images:
  - 3070-photo-to-bento-packaging-poster-1.jpg
  - 3070-photo-to-bento-packaging-poster-2.jpg
imageCredit:
  by: "小小东"
  url: https://youmind.com/gpt-image-2-prompts?id=33687
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传构图简单、主体明确的照片效果最好（一只猫、一段楼梯、一只海鸟、一栋房子）。[便利店便当包装视觉] 可以换成"寿司拼盘""饭团礼盒""蛋糕切块"等其他食物载体。标签想要中文，就写"标签用中文：品名、价格、条形码"。

示例图两张：一张是白墙蓝边台阶和一只橘猫，下半变成透明便当盒里用白米饭和蓝色米粒拼出的台阶、小猫，配西兰花、番茄和炒蛋，贴着日文品名标签和价格；另一张是海边礁石上的小鸟和夕阳，下半用彩色米粒和海苔拼出夕阳海面与小鸟。

**常见问题**：
- 下半只是把照片印在盒子上：强调"必须由真实食材拼出，能看到米粒和蔬菜质感"。
- 太复杂的照片（人群、街景）效果差：先用主体单一的照片。
- 标签文字乱：标签只保留品名、价格、条形码三项。

**适合**：创意海报、餐饮 / 便利店品牌营销、社媒趣味内容、设计作品集。

### 原版提示词

```text
Please transform each photo I upload into an individual high-end design poster, not a collage, outputting each photo separately. Use a 3:4 vertical composition, where the top and bottom sections are strictly 1:1, each occupying 50% of the frame.

The top half preserves the original photo, maintaining the subject's identity, structure, posture, realistic texture, natural lighting, and original color atmosphere, with only slight high-end color grading to give it the quality of an art magazine or exhibition image. The environment can be naturally extended to fit the frame, but the subject must not be stretched or distorted.

The bottom half extracts the most recognizable subjects, outlines, and narrative relationships from the photo, reconstructing them into a {argument name="bento style" default="Bento-fication / convenience store deli packaging visual"}. Instead of copying the original item by item, understand the core visual relationships and map people, buildings, or plants to food ingredients like rice, vegetables, eggs, or seaweed, so that the soul of the original is still recognizable through a food medium.

All visual information is ultimately contained within a clear convenience store deli box or bento tray. Maintain the original composition hierarchy but allow for re-direction: remove irrelevant backgrounds and use modular ingredients and container sections to create a commercial visual. Only retain elements that define identity.

The bottom part uses a top-view packaged-food photography perspective, emphasizing transparent box textures, food particles, and freshness to look like a premium retail product. The composition should be clean and sophisticated with ample white space.

Extract the most vibrant colors from the top photo and convert them into natural food colors (e.g., greens for herbs, yellows for eggs). Avoid dull or greasy colors.

Add a minor product labeling system like Japanese deli packaging with item names, prices, or barcodes. The overall aesthetic is Japanese konbini deli packaging aesthetic / packaged-food reinterpretation. The core principle: don't just paint the photo as food; preserve the visual soul and re-direct it using ingredients and retail packaging.
```

> 改编自 [小小东](https://x.com/xiaoxiaodong01/status/2096609211870576683) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

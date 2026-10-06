---
title: nano banana 食物热量标注提示词：拍一张饭菜照，自动标出每样食物的卡路里
slug: meal-calorie-label
model: nano-banana
topics: [infographic, photography]
needsRefImage: true
useCase: 减脂、控糖期间拍下一餐，让 nano banana 直接在照片上标注每种食物的名称、热量密度和估算热量，得到一张可分享的"饮食记录卡"。
prompt: |
  在这张饭菜照片上做营养标注：
  - 识别盘中的每一种食物，用细线引出标签，写上[中文]名称；
  - 每个标签注明热量密度（低 / 中 / 高）和估算热量（千卡）；
  - 在画面[右下角]加一个汇总框：整餐估算总热量（给出范围）；
  - 标签样式简洁统一，白底黑字小卡片，不遮挡食物主体。
  照片本身保持不变，只叠加标注。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/icreatelife/status/1963646757222715516
  author: "@icreatelife"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文为一句"用食物名称、卡路里密度和近似卡路里来注释这顿饭"；本站扩写为标签样式、汇总框位置、语言变量等具体要求
images:
  - 169-meal-calorie-label-1.jpg
imageCredit:
  by: "@icreatelife"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case48
  license: Apache-2.0
verify:
  - 用一份已知热量的外卖（包装上有营养成分表）实测，记录估算误差
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：从正上方或 45° 拍一张光线充足的饭菜照上传。示例是一盘鸡胸肉沙拉的标注结果。[中文] 可换"中英双语"；汇总框位置可改为"左上角"等。

**一定要知道**：图片里的热量是**模型目测估算**，误差可能很大（份量、油量、酱料都看不准），只适合做大致参考和打卡记录，不能当作营养师建议；有疾病或严格饮食要求的请以专业意见为准。

**提高准确度的办法**：
- 在提示词里补充已知信息，比如"米饭约 150 克""鸡胸肉 120 克"；
- 先追问"列出你识别出的食物和估算克数"，纠正后再让它出图。

**适合**：减脂打卡、小红书饮食记录、健身餐分享。

### 英文原版

```
annotate this meal with names of food and calorie density and approximate calories
```

> 改编自 [@icreatelife](https://x.com/icreatelife/status/1963646757222715516) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

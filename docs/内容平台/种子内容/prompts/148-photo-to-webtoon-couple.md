---
title: 照片转韩漫提示词：情侣合照变成手绘韩系条漫插画（gpt-image-2）
slug: photo-to-webtoon-couple
model: gpt-image-2
topics: [comic, illustration]
needsRefImage: true
useCase: 上传情侣或朋友的合照，转成粉彩、圆眼睛、带小涂鸦的韩系条漫风插画，适合纪念日头像、情侣壁纸和朋友圈。
prompt: |
  把我上传的照片转换成一张可爱的手绘韩系条漫插画，画面是一对开心的[情侣]在户外自拍。
  柔和的粉彩配色，圆圆的大眼睛，红扑扑的脸颊，温暖的笑容，温馨浪漫的氛围；身边漂浮着可爱的手绘涂鸦（爱心、花朵、星星、螺旋线、小太阳图标）。
  背景是[绿意盎然的公园]，阳光明媚；童话绘本般的美感，干净的线稿，柔和的手绘上色，可爱的比例，田园治愈风。
  画面梦幻、开心，细节丰富，有绘本品质；可爱风格，质感温和，色彩鲜明又柔和，适合发社交平台。
  保留两人的发型、衣服、配饰（如帽子、眼镜）和彼此的位置关系。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Taaruk_/status/2065105428862886301
  author: "@Taaruk_"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文并精简堆叠的修饰词；人物关系和背景场景改为变量；补充"保留发型、衣服、配饰和位置关系"
images:
  - 148-photo-to-webtoon-couple-1.jpg
  - 148-photo-to-webtoon-couple-2.jpg
imageCredit:
  by: "@Taaruk_"
  url: https://x.com/Taaruk_/status/2065105428862886301
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 两人的发型、衣服和左右位置是否与原照片一致
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[情侣] 可以换成"闺蜜""一家三口""我和我的狗"；[绿意盎然的公园] 换成照片拍摄地的简化描述，如"海边""樱花树下""城市天台夜景"。

**常见问题**：
- 两个人画得一模一样：在最后加"两人的脸型、发型要有明显区别，与原照片对应"。
- 涂鸦太多太花：把涂鸦限定为"只在画面四角出现少量爱心和星星"。
- 人数多于 3 人：效果不稳定，建议裁成 2–3 人再上传。

**迭代**：满意后追问"同一画面做成 2 格条漫：第 1 格是原画面，第 2 格两人看着手机里的自拍偷笑"，就成了一个小故事。

### 英文原版

```text
Transform the uploaded photo into a cute hand-painted Korean webtoon illustration of a happy couple taking a selfie outdoors. Soft pastel color palette, round expressive eyes, rosy cheeks, warm smiles, cozy romantic atmosphere, charming doodle elements floating around them (hearts, flowers, stars, swirls, sunshine icons). Lush green park or beach scenery in the background, bright sunny day, whimsical children's-book aesthetic, clean line art, soft painterly shading, adorable proportions, cozy cottagecore vibes, dreamy and cheerful mood, highly detailed digital illustration, storybook quality, kawaii aesthetic, gentle textures, vibrant yet soft colors, Instagram-worthy artwork, wholesome couple portrait, cute lifestyle illustration, masterpiece, ultra detailed.
```

> 改编自 [@Taaruk_](https://x.com/Taaruk_/status/2065105428862886301) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。

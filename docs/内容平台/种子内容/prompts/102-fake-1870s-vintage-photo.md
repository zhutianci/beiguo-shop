---
title: AI做旧照片提示词：生成以假乱真的 19 世纪老照片（gpt-image-2）
slug: fake-1870s-vintage-photo
model: gpt-image-2
topics: [old-photo, photography]
aspectRatio: "4:5"
needsRefImage: false
useCase: 凭空生成一张"1870 年拍的"泛黄破损老照片，适合历史题材短视频、读书笔记、复古海报的配图素材。
prompt: |
  一张 [1870] 年风格的老照片。画面：[清末街头一家茶馆门口]；人物：[两位穿长衫的茶客]和[一个挑担的小贩]，戴瓜皮帽，服饰符合年代；动作：[小贩正把茶点递给茶客]，[一位茶客侧身望向镜头]。
  照片有明显的岁月痕迹：化学药水留下的斑渍、厚重的颗粒、深褐色调、几道很深的划痕。
  大幅降低清晰度，让[人物]的细节不锐利、略微模糊，像早期湿版摄影的低保真效果。
  加重磨损：边角有小撕口和缺角、水渍、虫蛀的小洞；照片中间有一道斜向的锯齿状裂口，被发黄的旧胶带笨拙地粘了起来。
  不要出现任何现代物品、彩色或水印文字。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/Arminn_Ai/status/2065104900590109130
  author: "@Arminn_Ai"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文模板译为中文，场景、人物、动作给出中国清末示例并保留为变量；补充"不要现代物品 / 彩色 / 水印"的约束
imageBrief: 按默认变量生成 1 张；再把场景换成"民国火车站月台"生成 1 张，对比年代感是否成立。
images:
  - 102-fake-1870s-vintage-photo-1.jpg
imageCredit:
  by: "@Arminn_Ai"
  url: https://x.com/Arminn_Ai/status/2065104900590109130
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 人物服饰与建筑是否符合所填年代，有无明显穿帮
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[1870] 可以换成 1900、1930 等年份，年代越早画面越模糊、越偏褐色；场景、人物、动作三处分开写，越具体越像真照片。人物不要超过 3–4 个，人多了容易出现肢体错乱。

**常见问题**：
- 太清晰、像新拍的：把"大幅降低清晰度"再强调一遍，或加"轻微重影、长曝光留下的拖影"。
- 破损盖住了主体：把"斜向裂口"挪到画面边缘，例如"右下角有一道裂口"。
- 出现现代元素（电线杆、塑料制品）：在最后一句里点名排除。

**提醒**：这是生成"并不存在的老照片"，适合创作和教学；发布时请注明 AI 生成，不要冒充真实历史影像。

### 英文原版

```text
Non Existence Vintage Photographs with GPT Image 2 📸

- Prompt 👇
a photographic image in the style of 1870, [SCENE DESCRIPTION], with [CHARACTERS described in period accurate clothing], [Describe the interaction].

The photo has an aged and worn appearance, as it was taken in 1870. It features prominent time-induced chemical stains, heavy grain, sepia toning, and deep scratches.

Significantly reduce the sharpness so that the details of the [SUBJECT] are not crisp, making the [SUBJECT] blurry and low-fidelity.

Greatly increase the wear of the photo, including small tears, missing corners, water damage, and small wormholes caused by insect damage. Add a prominent, jagged diagonal cut across the photo, mended clumsily with old, discolored tape.
```

> 改编自 [@Arminn_Ai](https://x.com/Arminn_Ai/status/2065104900590109130) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0。

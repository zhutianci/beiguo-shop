---
title: nano banana 版画头像提示词：照片转黑白木刻 / 铜版画风格肖像
slug: woodcut-portrait
model: nano-banana
topics: [portrait, illustration]
needsRefImage: true
aspectRatio: "4:5"
useCase: 想要一个有质感、辨识度高的头像（公众号作者头像、播客封面、简历个人页、文章配图），上传一张正脸照，生成高对比的黑白木刻 / 铜版画风格肖像。
prompt: |
  以我上传的照片为参考，画一幅黑白版画风格的人物肖像，保持人物的脸型、五官和发型特征。
  - 经典木刻 / 麻胶版画（linocut）技法，高对比黑色油墨印在有纹理的米白色纸上；
  - 用细密的交叉排线和线条明暗塑造立体感，下巴下方和头发周围有浓重的黑色阴影，轮廓线有力；
  - 构图极简：居中的头像，只到脖子，不出现身体；背景干净留白；
  - 复古报刊插画气质，线条极其精细、锐利，单色，对比强烈，像可以直接矢量化的版画。
negativePrompt: 彩色，水彩，柔和晕染，模糊线条，低对比，写实照片，3D 渲染，动漫风，卡通风，潦草草图，粗细不均的笔触，背景杂物，噪点，像素化，面部扭曲，多余的眼睛或耳朵，结构错误，现代数字绘画，油亮皮肤，高光过曝
source:
  repo: jau123/nanobanana-trending-prompts
  url: https://x.com/Naiknelofar788/status/2042785774245154868
  author: "@Naiknelofar788"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；原文为文生图（"一个人的肖像"），本站改为上传照片的用法并要求保持人物特征；负面提示词单独放入 negativePrompt
imageBrief: 用站长本人或 AI 生成的虚构人物正脸照作输入，生成 1 张木刻风肖像，附输入图对比（仓库示例图为真实公众人物，不使用）。
images:
  - 191-woodcut-portrait-1.jpg
imageCredit:
  by: "@Naiknelofar788"
  url: https://x.com/Naiknelofar788/status/2042785774245154868
  license: CC BY 4.0
verify:
  - 仓库示例图为真实公众人物肖像，按本站规则未使用；需站长自行生成示例图
  - 实测"保持人物特征"的相似度
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传一张正脸、光线有明暗方向的照片（侧光比平光更出版画效果）。想换风格：把"木刻 / 麻胶版画"换成"19 世纪铜版画（etching）"线条会更细；换成"中国传统木刻年画"则更粗犷。负面提示词在 Gemini 里可以直接拼到正文末尾，写成"避免：……"。

**常见问题**：
- 变成了素描而不是版画：强调"只有纯黑和纯白，没有灰色过渡，明暗完全靠排线疏密表现"。
- 不像本人：照片越清晰越好，必要时补"保留眼镜 / 刘海 / 胡子"等特征。
- 想加文字做封面：追问"在下方加一行衬线字体的名字：[你的名字]"。

**注意**：只用自己或已获授权的照片，不要用于名人或他人肖像的二次创作商用。

### 英文原版

```
Black and white engraved portrait illustration of a person.
Drawn in classic woodcut / linocut engraving style, high contrast black ink on textured off-white paper background. Fine cross-hatching and line shading to create depth and shadow, bold black ink shadows under chin and around hair, strong contour lines, traditional printmaking aesthetic.
Minimal composition, centered portrait, no body visible, clean negative space, vintage editorial illustration style, ultra detailed linework, sharp crisp ink strokes, professional vector-ready engraving look, monochrome palette, dramatic contrast.
Negative Prompt:
color, watercolor, soft shading, blurred lines, low contrast, realistic photography, 3D render, anime style, cartoon style, messy sketch, thick uneven strokes, background objects, noisy texture, pixelated, distorted face, extra eyes, extra ears, bad anatomy, modern digital painting, glossy skin, overexposed highlights
```

> 改编自 [@Naiknelofar788](https://x.com/Naiknelofar788/status/2042785774245154868) 发布、[jau123/nanobanana-trending-prompts](https://github.com/jau123/nanobanana-trending-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。

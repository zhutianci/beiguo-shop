---
title: "改图标注提示词：在原图上用红绿笔圈出要修改的地方（给 AI 改图写\"批注\"）（gpt-image-2）"
slug: red-pen-edit-markup-on-image
model: gpt-image-2
topics: [photo-edit]
aspectRatio: "16:9"
needsRefImage: true
useCase: "上传一张需要修改的图，让模型保持原图不变，只在上面叠加手写的红色 / 绿色批注（斜线、箭头、圈和文字说明），得到一张\"改图需求标注图\"，可以直接再丢给模型执行修改，或交给设计师沟通。"
prompt: |
  以我上传的图片为底图，城堡画面保持完全不变，在上面叠加潦草的手写修改批注，就像在为一次改图标出需要修改的地方。
  加入恰好 2 组批注：
  1. 红色批注组，位于画面中上偏右那座最高的后方塔楼：在塔楼上画红色斜线阴影，加一个指向它的红色箭头，并在右上方的天空处手写批注"[把最里面这座高塔拆掉，变成天空]"。
  2. 绿色批注组，位于画面中上部残缺的边缘 / 剩余结构：沿残缺处画一个不规则的绿色圈，加一个向下指向它的绿色箭头，并在中上方的天空处手写批注"[这一带保留残垣]"。
  风格要求：批注要像用数位笔快速画的标记，不要融进原画里；原来的水彩奇幻城堡画面其他部分保持原样，这一步还不要真的拆掉任何建筑。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/craftcapitallab/status/2087192481054290301
  author: "ててつろう"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；两条批注文字改为变量（原文为日文），并补充\"标注图 → 执行修改\"的两步用法"
images:
  - 3159-red-pen-edit-markup-on-image-1.jpg
imageCredit:
  by: "ててつろう"
  url: https://youmind.com/gpt-image-2-prompts?id=31240
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：上传你要改的图；两条批注换成你的修改需求，例如"[把这个人去掉]""[天空换成晚霞]""[招牌文字改成 XX]"，红色用于"删除 / 修改"，绿色用于"保留 / 注意"。位置描述（"中上偏右那座塔楼"）也要改成你图里的位置。

**两步用法**：第一步用这条提示词生成标注图，检查标的位置对不对；第二步把标注图上传，说"按图中的红绿批注修改，修改后去掉所有批注"。比纯文字描述"右上角第二座塔"更不容易改错地方。

示例图是一幅夜色下的水彩奇幻城堡：右上方最高的塔楼被红色斜线涂满，旁边红色箭头和三行红色日文手写"把最里面这座高塔拆掉，变成天空"，中间残缺处用绿色线圈出，配绿色日文"这一带残留着"（原提示词为日文批注，本站已改为中文）。

**常见问题**：
- 模型直接把塔拆了：重复"这一步只加批注，不修改原画"。
- 批注字太大遮住画面：写"批注文字写在天空空白处，字号小"。
- 批注位置偏：位置描述越具体越好，也可以先自己用画图工具粗略圈一下再上传。

**适合**：AI 改图前的需求标注、设计修改沟通、团队审稿、改图教学。

### 英文原版

```text
Using REFERENCE_0 as the base image, keep the castle artwork unchanged and overlay rough handwritten edit notes directly on top of it, as if marking areas for an image-editing revision.

Add exactly 2 annotation groups:
1. Red annotation group on the tall rear tower near the upper-right center: draw red diagonal hatching across the tower, add a red arrow pointing toward it, and add the handwritten Japanese note {argument name="red edit note" default="一番奥の高いこの塔を崩して、無くして空にして。"} in the upper-right sky area.
2. Green annotation group around the crumbling edge/remaining structure near the middle top: draw a green irregular outline around the broken area, add a green arrow pointing down to it, and add the handwritten Japanese note {argument name="green edit note" default="この辺崩れのこっている"} in the upper-middle sky area.

Style constraints: the annotations should look like quick digital pen markup, not integrated into the painting; keep the original watercolor fantasy castle image otherwise intact with no actual architectural removal yet.
```

> 改编自 [ててつろう](https://x.com/craftcapitallab/status/2087192481054290301) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

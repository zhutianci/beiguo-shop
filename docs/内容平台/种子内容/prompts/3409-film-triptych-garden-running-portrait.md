---
title: "人像写真提示词：三格电影胶片感写真，花园奔跑 + 花束特写 + 侧脸特写带字幕（即梦）"
slug: film-triptych-garden-running-portrait
model: jimeng
topics: [portrait, photography, photo-edit]
modelLabel: Seedream 4.5
aspectRatio: "3:4"
needsRefImage: true
useCase: "把一张人像照做成有故事感的三联胶片写真：上格侧面奔跑的中景、中格花束特写、下格侧脸大特写，过曝、动态模糊、漏光，底部带一行电影字幕，适合发朋友圈或小红书。"
prompt: |
  把上传的人像编辑成一张等分三格的胶片质感艺术写真，三格上下排列合成一张图，画幅 3:4。人物长相与参考图保持一致，穿[白色连衣裙]。场景是阳光灿烂的绿色午后，[像印象派油画一样的花园]。
  - 第一格（中景，侧面拍摄）：人物手捧[一大束鲜花]向[右]奔跑，花园绿意盎然，画面过曝；
  - 第二格（特写）：对准手里的花束，过曝，带动态模糊，人物只露出肩膀和下巴；
  - 第三格（大特写）：人物奔跑中的侧脸，面向右侧，头发被风吹起，过曝、动态模糊，背景是绿色花园，眼睛里有眼神光，神情带一点忧郁又带着希望；
  - 质感：直闪补光的人像摄影，高光突出、前景曝光充足，细碎闪烁的光斑，梦幻的电影胶片质感，慢门拖影，暗角和漏光，每格带黑色胶片边框；
  - 字幕：在第二格与第三格之间的黑边上居中加一行白色小字"[莫奈花园的午后]"。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-seedream-4.5
  url: https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-69-three-panel-film-art-grid
  author: "@leahlibest"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文为即梦作品的提示词（仓库收录的是英文转写），改写为通顺中文并拆成三个镜头分别描述；服装、手持物、奔跑方向、场景、字幕文字设为变量；把\"莫奈花园\"改为\"印象派油画般的花园\"；合并了重复的胶片术语"
images:
  - 3409-film-triptych-garden-running-portrait-1.jpg
imageCredit:
  by: "@leahlibest"
  url: https://cms-assets.youmind.com/media/1765360229744_nvm9w5_1765288935135-wud1t9-0217652888936922504cb05148e9a08cc7612c3f2b24e52b75ef9_0-600x800.jpg
  license: CC BY 4.0
verify:
  - "需要上传一张清晰的人像参考图；仅使用本人或已获授权的照片"
  - "上线前在 即梦 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
原作者用 Seedream 4.5 生成；在即梦里选用 Seedream 系列图片模型使用。

**怎么填变量**：上传一张五官清晰的正面或侧面人像；[白色连衣裙] 可换成"米色针织衫""学士服"；[一大束鲜花] 可换成"一只气球""一本书"；[右] 改成"左"时，第三格的朝向也要一起改；场景可换成"金黄的麦田""海边栈道"；字幕换成一句有画面感的短句，10 个字以内。

示例图：三格竖排，黑色胶片边框。上格是穿白裙的短发女生捧着花束在草地上向右奔跑，阳光很亮；中格是粉橙色花束的特写，背景被拖成放射状的模糊；下格是她的侧脸特写，发丝飞扬、脸上有光；中下两格之间的黑边上有一行白字"莫奈花园的午后"。

**常见问题**：
- 三格里的人不像同一个人：加"三格为同一人，发型、服装完全一致"，并上传更清晰的参考图。
- 过曝过头、脸白成一片：把"过曝"改成"轻微过曝，保留皮肤细节"。
- 字幕位置跑偏或有错字：字幕尽量短，写明"位于两格之间的黑色间隔上，居中"。

**适合**：个人写真、情侣 / 毕业纪念照二次创作、小红书封面。请只处理自己或已获同意的人像照片。

### 原版提示词

```text
Edit the image into an equal three-panel grid film texture artistic portrait. The scene is a green afternoon. The sun is shining brightly. The character in the picture is consistent with the reference image, wearing a {argument name="clothing" default="white dress"}. The first shot is a medium shot, taken from the side, the character is running towards the {argument name="direction" default="right"} in an overexposed, green Monet garden, holding a {argument name="item" default="gorgeous bouquet"} in hand. The second shot is a close-up, photographing the bouquet, overexposed, dynamic blur. The third shot is a large close-up of the character, the profile of the character running, facing right, overexposed, dynamic blur, background is a green garden, giving the character eye light, allowing the character's expression to bring a sense of melancholy and hope. Portrait photography, image generation style with strong, direct flash effect: highlight mode, foreground exposure, surrealism, light and shadow atmosphere, fine shimmering light and shadow, dreamy movie film texture, dynamic blur, slow shutter effect, positive and negative film, peel-apart film, minimalism, extreme composition, vignette, light leak. Subtitles are located at the bottom center, three-panel grid synthesized into one picture. Ratio 3:4.
```

> 改编自 [@leahlibest](https://github.com/YouMind-OpenLab/awesome-seedream-4.5/blob/8b09e6de35de0b6f90121cb6cf916cba3d453403/README.md#no-69-three-panel-film-art-grid) 发布、[YouMind-OpenLab/awesome-seedream-4.5](https://github.com/YouMind-OpenLab/awesome-seedream-4.5) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

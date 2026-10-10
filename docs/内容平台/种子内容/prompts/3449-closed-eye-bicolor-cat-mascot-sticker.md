---
title: "ai贴纸设计提示词：极简黑白奶牛猫吉祥物贴纸，眯眼表情可换（gpt-image-2）"
slug: closed-eye-bicolor-cat-mascot-sticker
model: gpt-image-2
topics: [sticker, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "需要一个线条极简、辨识度高的小猫吉祥物时用：粗黑描边的黑白花小猫端坐在白底上，带白色模切边，只改一句眼睛描述就能换表情，适合做头像、成套表情和周边图案。"
prompt: |
  画一张可爱的卡哇伊贴纸插画：一只[端坐]的 Q 版小猫，纯白背景。
  - 花色：身体以白色为主，带[黑色]斑块——画面右侧的头顶连同耳朵盖着一大块圆润的色斑，身体两侧各有一小块深色斑，画面右侧露出一条卷起来的深色尾巴；
  - 五官：一对超大的三角耳朵，内耳是柔和的粉色；小小的黑色椭圆鼻子，微微嘟起的小猫嘴，两边脸颊各三根胡须；眼睛闭着，画成[两条水平短横线]；
  - 腮红：两颊各一块粉色椭圆腮红，上面各有三道颜色更深的短斜线；
  - 线条与贴纸边：粗而顺滑的黑色描边，爪子圆润简化、能看到脚趾线；角色外面一圈白色模切贴纸边，贴纸边外再有一层非常淡的浅灰阴影；
  - 构图：小猫居中、正面、左右对称，极简、干净，像矢量绘制的动漫吉祥物；
  - 不要文字，不要任何背景物件。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/ippoippo522/status/2082784300836294747
  author: "@ippoippo522"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；斑块颜色、眼睛形状改为变量，另把坐姿设为变量；原文用符号\"ーー\"描述闭眼，改写为\"两条水平短横线\""
images:
  - 3449-closed-eye-bicolor-cat-mascot-sticker-1.jpg
  - 3449-closed-eye-bicolor-cat-mascot-sticker-2.jpg
imageCredit:
  by: "@ippoippo522"
  url: https://youmind.com/gpt-image-2-prompts?id=30394
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[黑色] 换成"橘色""灰色""奶茶色"就是不同花色的猫；[两条水平短横线] 是表情开关，换成"向内挤的 > < 形，同时张嘴大笑""圆圆的黑豆眼""弯弯的月牙形笑眼""一睁一闭眨眼"就能出同一只猫的不同表情；[端坐] 可以换成"趴着""举起一只前爪"。想做成套表情时，其余描述一个字都不要动。

示例图第一张是白底上的黑白花小猫：粗黑描边，右耳到头顶一大块深灰黑色斑，眼睛是两条横线、小嘴嘟着，两颊粉色腮红各带三道斜线，外面一圈白边和很淡的灰影。第二张是同一只猫换了表情——眼睛变成"> <"，张嘴大笑露出粉色的嘴，其他部分几乎完全一致。

**常见问题**：
- 换表情后斑块位置变了：把第一张图一起上传，并说明"保持这只猫的花色和姿势，只改眼睛和嘴"。
- 描边变细、出现渐变阴影：强调"粗黑描边、纯平涂、不要渐变"。
- 白边看不出来：让背景改成浅灰色，白色模切边就明显了。

**适合**：聊天表情、账号头像、贴纸和徽章周边、小店吉祥物；不适合需要写实毛发质感的宠物画像。

### 英文原版

```text
Create a cute kawaii sticker illustration of a sitting chibi cat on a plain white background. The cat is mostly white with {argument name="patch color" default="black"} markings: one large rounded patch covering the viewer-right side of the head and ear, small dark patches on both sides of the body, and a dark curled tail on the viewer-right. Give it oversized triangular ears with soft pink inner ears, a tiny black oval nose, a small pouty cat mouth, three whiskers on each cheek, and closed horizontal eyes shaped like {argument name="eye shape" default="ーー"}. Add two pink blush ovals on the cheeks, each with three darker blush strokes. Use thick smooth black outlines, rounded simplified paws with visible toe lines, a white sticker die-cut border around the character, and a very subtle light gray shadow/outline outside the sticker edge. Center the cat, front-facing, symmetrical, minimal, clean vector-like anime mascot style, no text, no background objects.
```

> 改编自 [@ippoippo522](https://x.com/ippoippo522/status/2082784300836294747) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "ai头像生成提示词：风格化人物插画模板，简化造型 + 夸张肢体语言 + 抽象背景（Nano Banana）"
slug: flat-stylized-character-illustration-template
model: nano-banana
topics: [illustration, character, portrait]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: "给文章、专栏、课程做有辨识度的人物配图或头像：用\"角色类型 + 标志性特征 + 画风 + 配色\"四个变量，生成造型简化、肢体语言夸张、背景只有几块抽象色块的风格化插画。"
prompt: |
  一张风格化插画：[一位蓄着络腮胡的老街头摄影师]，带有[鸭舌帽、圆框眼镜和一台老式相机]。
  - 造型：形状高度简化，肢体语言夸张、有表现力，面部细节刻画充分；
  - 插画风格：[扁平风]（可选：扁平 / 赛璐璐 / 柔和 3D）；
  - 配色：[低饱和的橄榄绿与灰蓝]（可选：低饱和 / 鲜艳 / 单色）；
  - 背景：极简、抽象，只用几块几何色块和几根细线暗示环境；
  - 人物占画面主体，不要文字。
  画幅[16:9]。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/aleenaamiir/status/2018987065468436669
  author: "@aleenaamiir"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；保留原文的四个变量并换成示例图对应的中文默认值；补充了画幅和\"人物占画面主体、背景为几何色块\"的说明"
images:
  - 3422-flat-stylized-character-illustration-template-1.jpg
  - 3422-flat-stylized-character-illustration-template-2.jpg
imageCredit:
  by: "@aleenaamiir"
  url: https://youmind.com/nano-banana-pro-prompts?id=8960
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：第一个变量写"什么人"，如"加班到深夜的程序员""抱着一摞书的图书管理员"；第二个写 1～3 个标志性特征或道具；风格三选一；配色写两三种颜色或直接写"黑白灰单色"。想做头像就把画幅改成 1:1，并加"半身像，人物居中"。

示例图第一张：橄榄绿和灰蓝的色块拼出街道的感觉，一位戴鸭舌帽、圆眼镜、留着大胡子的老人弓着身子举起相机拍照，胸前还挂着一台折叠相机，动作幅度很大。第二张是黑白灰单色版：一位戴圆框眼镜的中年人靠在一摞厚书旁，神情疲惫，背景是几块深浅不同的灰色矩形。

**常见问题**：
- 画得太写实：强调"几何化的简化造型，没有写实的皮肤纹理"。
- 背景变成具体场景：加"背景只允许出现三到四个色块，不画具体物体"。
- 人物表情平淡：在角色类型里直接写情绪，如"得意地""愁眉苦脸地"。

**适合**：专栏 / 公众号配图、个人头像、课程封面、品牌人设形象草图。

### 英文原版

```text
“A stylized illustration of [{argument name="character type" default="CHARACTER TYPE"}] with [{argument name="distinct feature" default="DISTINCT FEATURE / ACCESSORY"}].

Simplified shapes, expressive body language with heavy facial details.

Illustration style: [{argument name="illustration style" default="FLAT / CEL-SHADED / SOFT 3D"}].
Color palette: [MUTED / VIBRANT / MONOCHROME].
Background minimal and abstract”
```

> 改编自 [@aleenaamiir](https://x.com/aleenaamiir/status/2018987065468436669) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "ai图标生成提示词：软糯黏土质感的 3D 卡哇伊小云朵角色图标（gpt-image-2）"
slug: squishy-clay-kawaii-cloud-3d-icon
model: gpt-image-2
topics: [sticker, logo]
aspectRatio: "1:1"
needsRefImage: false
useCase: "给 App、小程序、社群或个人账号做一个软萌的 3D 角色图标或头像：黏土捏捏乐质感的小云朵，黑亮豆豆眼、粉色腮红，边缘带一点粉蓝紫渐变，纯白背景、柔和阴影，换一个词就能做成一整套同风格图标。"
prompt: |
  一张 3D 渲染图：一个可爱的卡哇伊[云朵]角色，放在纯白背景上。
  - 质感：柔软、哑光、软糯，像黏土或捏捏乐解压玩具，表面带细细的绒面颗粒；
  - 五官：一双大大的黑亮眼睛，带白色高光；一道简单的弧形微笑；两颊各一块圆圆的粉色腮红；
  - 颜色：主体是[奶白色]，边缘和底部带一点[粉、蓝、紫]的柔和粉彩渐变；
  - 光线与构图：柔和的影棚光，主体居中、略带俯视角度，在白底上投下轻柔的阴影；
  - 风格：极简图标感，造型圆润饱满，没有多余装饰；
  - 不要文字，不要背景物件，画幅 1:1。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/yurunekofree/status/2046016054305145102
  author: "@yurunekofree"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；主体、点缀色改为变量，另把主体底色设为变量；按示例图补充了\"表面有细绒面颗粒\"\"略带俯视角度\"和画幅"
images:
  - 3460-squishy-clay-kawaii-cloud-3d-icon-1.jpg
imageCredit:
  by: "@yurunekofree"
  url: https://youmind.com/gpt-image-2-prompts?id=14218
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[云朵] 换成任何你想做成图标的东西，如"星星""水滴""吐司""小幽灵""月亮""信封"；[奶白色] 是主体底色，换主体时一起改，比如吐司用"浅麦色"、水滴用"淡蓝色"；[粉、蓝、紫] 是边缘的渐变点缀色，换成"薄荷绿和柠檬黄"会更清爽。要做一整套图标时，只改这三个变量、其余一字不动，分别出图，风格会很统一。

示例图是白底正中的一朵胖乎乎的 3D 小云：奶白色的哑光表面像撒了一层细绒，两只黑亮的圆眼睛带白色高光，中间一道小弧线微笑，两颊是粉色圆腮红，两侧和底部的"云团"晕着淡淡的粉、蓝、紫色，下面有一圈很浅的阴影。

**常见问题**：
- 质感太光滑、像塑料：强调"哑光、绒面、无镜面高光"。
- 脸画得太复杂（睫毛、牙齿）：保留"简单的弧形微笑"，并补"不要其他五官细节"。
- 一套图标大小角度不一：每次都写"主体居中、占画面约七成、同样的略俯视角度"。

**适合**：App 与小程序图标、社群头像、表情贴图、PPT 里的装饰小角色；不适合需要精确品牌标志的正式 Logo。

### 英文原版

```text
A 3D render of a cute kawaii {argument name="subject" default="cloud"} character on a pure white background. The character has a soft, matte, squishy texture resembling clay or a stress toy. It features large glossy black eyes with white highlights, a simple curved smile, and round pink blush on its cheeks. The edges and bottom of the figure have a subtle pastel gradient of {argument name="accent colors" default="pink, blue, and purple"}. Soft studio lighting, minimalist icon style, casting a gentle shadow.
```

> 改编自 [@yurunekofree](https://x.com/yurunekofree/status/2046016054305145102) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

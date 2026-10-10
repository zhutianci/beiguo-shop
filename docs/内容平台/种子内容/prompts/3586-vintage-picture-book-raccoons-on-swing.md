---
title: "ai绘本生成提示词：两只浣熊牵手坐秋千的背影，复古铅笔淡彩（Nano Banana）"
slug: vintage-picture-book-raccoons-on-swing
model: nano-banana
topics: [illustration, wallpaper]
modelLabel: Nano Banana Pro
aspectRatio: "16:9"
needsRefImage: false
useCase: "想要一张温柔怀旧的绘本跨页式插图时用：两只小动物背对画面并排坐着、手牵着手，前面是花园和小屋，铅笔线加淡彩，泛黄纸张质感，适合做绘本内页、情侣或闺蜜贺卡、桌面壁纸。"
prompt: |
  一张复古绘本风格的横版插画，画幅 16:9：[两只圆滚滚的小浣熊]背对画面，并排坐在一架木头秋千长椅上，中间的两只小手牵在一起，蓬松的条纹尾巴垂在木板后面。
  - 角色区分：左边那只[头戴雏菊和小黄花编的花环]，右边那只[戴一顶系蝴蝶结的草帽]并微微侧头看向同伴；只画背影，不画正脸；
  - 秋千：粗木搭成的 A 字形支架立在画面两侧，麻绳吊着一块厚木板；
  - 背景：[夏日花园和红屋顶小屋]，园子里有向日葵、绣球花和一排白色木栅栏，远处是淡淡的树丛和云；
  - 画法：细腻的铅笔线勾出绒毛的方向，薄薄的水彩淡彩上色，颜色柔和偏暖，以米黄、浅棕、灰绿和少量红色为主；
  - 纸张：泛黄的旧画纸质感，四边颜色略深，像老绘本里的一页；
  - 氛围：安静、亲密、温柔怀旧；
  - 画面中不要任何文字和水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/PSN62595111/status/2055627323639013651
  author: "@PSN62595111"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "原文只有一句话（\"两只浣熊角色，绘本风格\"），按示例图补充了背影牵手的构图、花环与草帽、木秋千、花园小屋背景、铅笔淡彩画法和泛黄纸张质感；动物、两处头饰、背景设为变量"
images:
  - 3586-vintage-picture-book-raccoons-on-swing-1.jpg
imageCredit:
  by: "@PSN62595111"
  url: https://youmind.com/nano-banana-pro-prompts?id=20781
  license: CC BY 4.0
verify:
  - "上线前在 Nano Banana 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[两只圆滚滚的小浣熊] 换成任意一对小动物，如"两只小狐狸""一只兔子和一只刺猬"，换了没有条纹尾巴的动物就把尾巴那句改掉；[头戴雏菊和小黄花编的花环] 和 [戴一顶系蝴蝶结的草帽] 用来区分两个角色，可换成"围红围巾""背小书包"；[夏日花园和红屋顶小屋] 换季节和场景，如"秋天果园和小木屋""雪后的松林"，后面那句花草也跟着改。

示例图是横版：两只灰棕色浣熊坐在木秋千上的背影，左边戴花环、右边戴黄色草帽并侧过头，两只小手在中间牵着；远处有向日葵、绣球花、白栅栏和红顶小屋，整张图是铅笔线加淡彩，纸面泛黄。右下角有一个很小的四角星标记。

**常见问题**：
- 画成了 3D 或毛绒照片感：加"平面手绘，能看到铅笔线和水彩纸纹，不要三维渲染"。
- 两只长得一模一样：把两处头饰写得差别更大，或加"一只稍高一只稍矮"。
- 颜色太鲜：加"整体低饱和，像放了很多年的印刷品"。

**适合**：绘本内页、情侣和闺蜜贺卡、纪念日配图、桌面壁纸。

### 英文原版

```text
{argument name="subject" default="two raccoon characters"} in the style of a {argument name="art style" default="picture book"}
```

> 改编自 [@PSN62595111](https://x.com/PSN62595111/status/2055627323639013651) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

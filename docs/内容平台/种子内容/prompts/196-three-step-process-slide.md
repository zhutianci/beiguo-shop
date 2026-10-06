---
title: nano banana PPT 流程图提示词：三步骤卡片式流程页（手绘插画 + 商务排版）
slug: three-step-process-slide
model: nano-banana
topics: [ppt, illustration, infographic]
modelLabel: Nano Banana Pro
needsRefImage: false
aspectRatio: "16:9"
useCase: 写培训材料、新人手册、项目汇报时需要一页"三步走"流程图，填入标题、每步名称、周期和说明，直接生成一页干净友好的 16:9 PPT 插图页。
prompt: |
  【输入数据】
  - 总标题：[新员工独立值夜班三步走]
  - 第 1 步：标题"[白班熟悉]"/ 周期"[0～3 个月]"/ 说明"[跟随白班记录流程和要点]"
  - 第 2 步：标题"[夜班跟岗]"/ 周期"[3～6 个月]"/ 说明"[与前辈一起值夜班]"
  - 第 3 步：标题"[独立值班]"/ 周期"[6 个月起]"/ 说明"[一人安全完成夜班]"
  - 主题色：[绿色]
  【版式规范】
  - 风格：干净友好的三步骤流程插图，适合商务 PPT、培训手册或内部文件，16:9 横版；
  - 背景：干净的米白或纯白；
  - 顶部：左上角放"图 3"小徽标，右侧用粗体、易读的黑体写大标题；最右侧放一个简洁的抽象 Logo 小标记；
  - 三张漂亮的圆角矩形卡片从左到右并排，用粗箭头连接，卡片描边按主题色统一配色；
  - 每张卡片：顶部是圆形数字徽章和该步标题，下方是写着周期的胶囊标签；中间是一幅带温和手绘感的插画（第 1 步：白天在窗边做笔记的人；第 2 步：夜空下两人拿着手电筒巡查；第 3 步：月亮下一个人比出胜利手势）；底部是该步说明文字。
  【质量与字体】
  - 简洁干净的 2D 扁平插画，线稿清晰；
  - 所有文字用清晰易读的[简体中文]黑体，不要错字；
  - 不要 3D 效果、阴影、笔记本电脑样机或镜头倾斜，整页就是平面图表本身。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-nano-banana-pro-prompts
  url: https://x.com/AIGuideNote/status/2098480666380038330
  author: "@AIGuideNote"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: 译成中文；原文为日文商务幻灯片，本站把所有字段改为中文变量并给出完整示例；插画描述改为不限定人物国籍
images:
  - 196-three-step-process-slide-1.jpg
imageCredit:
  by: "@AIGuideNote"
  url: https://x.com/AIGuideNote/status/2098480666380038330
  license: CC BY 4.0
verify:
  - 用一组较长的中文说明实测，记录错字率
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：只改【输入数据】里的内容，插画描述也要跟着你的三步改（例如"第 1 步：填写申请表的人；第 2 步：审核盖章；第 3 步：拿到证书"）。示例图是原作者的日文版"夜班导入三步流程图"。

**常见问题**：
- 中文错字：说明文字控制在 15 字以内；错字较多时可以只让它生成插画和版式，文字留空，回到 PPT 里自己填。
- 想要 4 步或 5 步：改成"四张卡片"并补齐第 4 步数据，但卡片越多每张越小，建议不超过 5 步。
- 配色和公司 VI 不一致：把 [绿色] 换成具体色值，如"#0057B8 蓝色"。

**适合**：培训 PPT、新人手册、项目里程碑、办事流程说明。

### 英文原版

```
[Input Data]
- Overall Title: {argument name="main title" default="3-Step Flowchart for Night Shift Introduction"}
- Step 1: Title "{argument name="step 1 title" default="Day Shift Mastery"}" / Period "{step1Period}" / Description "{step1Desc}"
- Step 2: Title "{step2Title}" / Period "{step2Period}" / Description "{step2Desc}"
- Step 3: Title "{step3Title}" / Period "{step3Period}" / Description "{step3Desc}"
- Color Theme: {argument name="color theme" default="green"}

[Structure and Layout Specifications]
- Style: A clean and friendly 3-step flowchart illustration suitable for Japanese business slides, educational manuals, or internal documents. 16:9 landscape slide configuration.
- Background: Clean off-white or solid white background.
- Top Title:
  - Place "Figure 3" or a step badge in the upper left, and to its right, draw a large Japanese main title "{mainTitle}" in a bold, easy-to-read Gothic font. Place a small, clean abstract logo mark at the right edge.
- Step Card Arrangement:
  - Three beautiful rectangular cards arranged side-by-side. Placed in order from left to right, connected by thick arrows. Each card border is color-coded neatly according to the color theme ({colorTheme}).
- Card 1 (Left) Interior:
  - Draw a circular badge "1" and the Japanese title "{step1Title}" prominently. Below that, a capsule label saying "{step1Period}".
  - In the center, place an illustration of a Japanese woman with a gentle hand-drawn touch taking notes, and a window showing the sun.
  - At the bottom, place the Japanese description "{step1Desc}".
- Card 2 (Center) Interior:
  - Draw a circular badge "2" and the Japanese title "{step2Title}" prominently. Below that, a capsule label saying "{step2Period}".
  - In the center, place an illustration of two Japanese women with a flashlight, night sky, and buildings.
  - At the bottom, place the Japanese description "{step2Desc}".
- Card 3 (Right) Interior:
  - Draw a circular badge "3" and the Japanese title "{step3Title}" prominently. Below that, a capsule label saying "{step3Period}".
  - In the center, place an illustration of the night sky and crescent moon, and a Japanese woman smiling with a victory pose.
  - At the bottom, place the Japanese description "{step3Desc}".

[Quality and Font Specifications]
- Simple, clean 2D illustration, flat design, crisp clear line art.
- All text must be accurately drawn in readable Japanese fonts (Gothic) without spelling errors.
- Exclude all 3D effects, shadows, laptop mockup backgrounds, or camera tilt; display the flat diagram itself across the entire screen.

- Aspect Ratio: --ar 16:9
```

> 改编自 [@AIGuideNote](https://x.com/AIGuideNote/status/2098480666380038330) 发布、[YouMind-OpenLab/awesome-nano-banana-pro-prompts](https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。

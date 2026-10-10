---
title: "ai分镜提示词：装修施工流程 12 格分镜表，从毛坯到完工的黑白手绘记录（gpt-image-2）"
slug: renovation-process-12-panel-storyboard
model: gpt-image-2
topics: [comic, interior, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "需要把一个施工 / 安装 / 操作流程画成\"一页看懂\"的分镜表时用：12 个镜头按顺序排成三行，每格下面有场景和备注栏，黑白手绘加写实阴影，像影视前期的分镜稿。"
prompt: |
  一张超写实的电影分镜表，在一张白纸上用专业分镜版式排列 12 个连续镜头，展示[房间电路安装的全过程]。画幅 16:9，3 行 4 列，每格左上角有编号，格与格之间用箭头表示先后，每格下方有两行很小的说明栏（场景 / 动作、备注）。顶部一行手写体标题"[房间电路安装 · 分镜表]"。
  12 个镜头依次是：
  1. 空荡、满是灰尘的毛坯房；
  2. 电工带着工具和线卷进场；
  3. 在墙上开线槽；
  4. 天花板布线；
  5. 安装空调铜管；
  6. 安装开关面板并接线；
  7. 装好 LED 灯座；
  8. 安装吊扇；
  9. 空调室内机挂上墙；
  10. 电工测试电路；
  11. 清扫房间、做最后调整；
  12. 完工的现代房间：灯亮着、风扇转着、空调运行。
  风格：手绘电影构图与写实渲染结合，固定机位，纪录片式的施工现场；工人穿安全服、戴安全帽，每格都能看到工具；12 格里的房间布局保持一致；黑白素描为主，带柔和的电影感明暗；专业的前期概念稿，所有镜头在同一张图里。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/saniaspeaks_/status/2056327928414433443
  author: "@saniaspeaks_"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；流程主题与 12 个步骤设为可替换内容（步骤列表整体保留为示例）；补充了\"每格下方两行说明栏、格与格之间用箭头连接、顶部标题栏\"等示例图中的版式"
images:
  - 3414-renovation-process-12-panel-storyboard-1.jpg
imageCredit:
  by: "@saniaspeaks_"
  url: https://youmind.com/gpt-image-2-prompts?id=21303
  license: CC BY 4.0
verify:
  - "示例图中每格下方的英文小字基本可读；换成中文说明时文字量要更少，核对是否清晰"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[房间电路安装的全过程] 和下面的 12 个步骤可以整体替换成你的流程，例如"卫生间防水施工""咖啡店开业筹备""一台电脑的组装"；步骤不足 12 个就改成"8 个镜头、2 行 4 列"。每一步用一句短话写清"谁在做什么"，模型更容易画对。标题换成对应名称。

示例图：白底上三行四列的黑白分镜格，第 1 格是空房间，随后是戴安全帽、穿反光背心的工人在开槽、爬梯布线、接开关、装吊扇、挂空调，最后一格是亮着灯带的整洁房间；每格下面有两行英文小字，顶部写着英文标题和项目名、日期。

**常见问题**：
- 房间前后不一致：加"所有镜头是同一个房间，窗户位置固定在正前方"。
- 说明小字是乱码：把说明栏改成"每格下方只写 4 个字以内的步骤名"。
- 步骤顺序错乱：给每一步加编号，并写"严格按编号从左到右、从上到下排列"。

**适合**：装修公司流程说明、施工交底、培训课件、提案里的"我们怎么做"一页图。画面只是示意，实际施工规范与安全要求以行业标准和持证人员为准。

### 英文原版

```text
Ultra realistic cinematic storyboard sheet showing 12 sequential panels of a {argument name="process" default="room electrical installation process"}, all frames arranged in a professional storyboard layout on a single white sheet, hand-drawn cinematic composition mixed with realistic rendering, static camera angles, documentary construction style.

Panel 1: Empty dusty unfinished room.
Panel 2: Electricians entering with tools and wire rolls.
Panel 3: Wall cutting for electrical wiring channels.
Panel 4: Ceiling wiring installation process.
Panel 5: AC copper pipe installation.
Panel 6: Switch board fitting and wire connections.
Panel 7: LED light holders installed.
Panel 8: Ceiling fan mounting process.
Panel 9: AC indoor unit mounted on wall.
Panel 10: Electricians testing electrical system.
Panel 11: Room cleaning and final adjustments.
Panel 12: Fully completed modern room with lights on, fan spinning and AC running.

Detailed storyboard frames, cinematic arrows and scene transition notes, realistic workers in safety uniforms, tools visible in every panel, consistent room layout across all storyboard frames, film production storyboard style, highly detailed black-and-white sketch mixed with soft cinematic shading, professional pre-production concept sheet, one single image containing all storyboard panels.
```

> 改编自 [@saniaspeaks_](https://x.com/saniaspeaks_/status/2056327928414433443) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

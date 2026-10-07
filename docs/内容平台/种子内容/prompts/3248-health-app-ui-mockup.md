---
title: UI设计提示词：健康打卡 App 日报页，步数睡眠心率卡片+三个环形进度（gpt-image-2）
slug: health-app-ui-mockup
model: gpt-image-2
topics: [product-design]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做健康 / 运动类 App 概念设计、比赛提案或作品集时，生成一张薄荷绿清爽风的手机日报页样机，数据卡、进度环、周折线和按钮一次排好。
prompt: |
  设计一张精致的移动端[健康打卡 App]日报页，展示在一部竖屏手机里，明亮的杂志感界面。
  - 配色：[浅薄荷绿、深森林绿、奶油白、珊瑚色、冷灰]；
  - 顶部：应用名"[应用名]"、标题"[今日概览]"和日期；
  - 四张数据卡："[步数 8,420]""[睡眠 7.6 小时]""[心率 64 次/分]""[饮水 2.1 升]"，每张卡下方有迷你图表；
  - 三个环形进度："[活动 78%]""[恢复 84%]""[专注 66%]"；
  - 一张本周折线图，横轴"周一 至 周日"；
  - 两个按钮："[记录饮食]""[开始训练]"；
  - 一张健康提示卡："[本周恢复度提升 12%]"；
  - 底部导航栏，中间是圆形主按钮。
  卡片干净、间距讲究、渲染锐利，像可交付的设计稿，文字和数字准确清晰，画幅[2:3]竖版。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ui-ux-mockups.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 仓库整理的提示词，译成中文并拆成要点；应用名、页面标题、各项数据、按钮文字、提示卡文案设为变量；去掉"医疗级"的表述；补充了常见问题与改法
images:
  - 3248-health-app-ui-mockup-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/uiux-mockups/health-tracker-wellness-app.png
  license: MIT
verify:
  - 示例图是英文版，中文版出一次看四张数据卡的单位是否排得下
  - 页面不要把生成的数据描述成健康建议，只作界面示意
  - 页面署名需保留"Copyright (c) 2026 Wuyoscar, MIT License"及许可证链接
---
**怎么填变量**：[健康打卡 App] 可换成"喝水提醒""冥想""减脂饮食"等，数据卡跟着改，比如冥想 App 写"[今日冥想 15 分钟]""[连续 7 天]"；环形进度换成你关心的三项指标；配色换成"[雾紫、白、深灰]"就是更安静的风格。示例图是英文版：顶部"VITA LOOP"和"Daily Summary"，四张卡片各带小柱图或心率线，三个绿色环形进度，一条周折线，下方两个按钮，其中"Start Session"是深绿实心，最下面一张带植物插画的提示卡。

**常见问题与调整**：
- 环形百分比和环的长度不一致：加"环形进度弧长与百分比严格对应"。
- 信息太多看不清：删掉一张数据卡或折线图，模块少了字会更准。
- 想做手表配套：追问"在手机右侧加一块圆形智能手表表盘，显示同样的三个环"。
- 换成深色：加"深色模式，背景墨绿近黑，文字奶油白"。

**适合**：健康运动类 App 概念稿、设计比赛提案、作品集；不适合直接作为开发标注稿或当作健康数据参考。

### 英文原版

```
Create a refined mobile health tracking app screen for a fictional wellness product named VITA LOOP, displayed on a tall smartphone with a bright editorial UI aesthetic. Use a palette of soft mint, deep forest green, cream, coral, and cool gray. Compose a daily overview screen with clean cards, circular progress rings, miniature charts, and a tidy bottom navigation. Include crisp in-image text: "VITA LOOP", "Daily Summary", "Steps 8,420", "Sleep 7.6 h", "Heart Rate 64 bpm", and "Hydration 2.1 L". Add three progress rings labeled "Move 78%", "Recovery 84%", and "Focus 66%". Show a weekly chart labeled "Mon Tue Wed Thu Fri Sat Sun" and two buttons reading "Log Meal" and "Start Session". Add a health insight card with the text "Recovery improved 12% this week". The result should feel production-ready, medically clean, carefully spaced, sharply rendered, and optimized for crisp typography and accurate labels.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

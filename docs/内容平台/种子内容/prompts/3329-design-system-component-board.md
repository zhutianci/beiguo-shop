---
title: UI设计提示词：一张图生成设计系统组件总览板（按钮、输入框、状态、卡片、字号层级）
slug: design-system-component-board
model: gpt-image-2
topics: [product-design]
needsRefImage: false
aspectRatio: "1:1"
useCase: 做设计规范封面、作品集里的"设计系统"展示页，或给团队快速对齐视觉风格时用，生成像从设计软件导出的方形组件总览图。
prompt: |
  生成一张干净的设计系统总览板，产品设计语言叫"[设计系统名]"，排成方形组件展示墙。
  - 中性配色：象牙白、炭黑、[雾蓝]、鼠尾草绿，点缀珊瑚红；
  - 构图是整齐的卡片网格，展示按钮、输入框、徽标、开关、标签页、头像、提示条和价格卡片；
  - 字体锐利、间距均匀、阴影轻柔、对齐精确，像从专业设计工具导出的；
  - 分区标题："[设计系统名]""按钮""输入框""状态""卡片""字号层级"；
  - 按钮示例文字："主要""次要""危险"；徽标文字："成功""待处理""错误"；
  - 字号样张："展示 48""标题 24""正文 16"；
  - 整体系统化、有杂志编排感、高度易读，层级清楚、标签准确、组件风格统一；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-ui-ux-mockups.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；虚构设计系统名、主色设为变量，画面文字改为中文版；删去具体像素尺寸
images:
  - 3329-design-system-component-board-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/uiux-mockups/design-system-component-card-set.png
  license: MIT
verify:
  - 中文版出一次，检查按钮和分区标题文字是否准确、组件是否对齐
  - 换一套品牌色出一次，看配色是否全板统一
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[设计系统名] 写你的产品或规范名称，例如"青禾设计规范""某某 Design"；[雾蓝] 是主色，换成品牌色，例如"薄荷绿""暖橙""深紫"，其余中性色保持不动效果最稳。示例图是一张米白底的英文组件板：左上大号 Logo 和标题，右上五个色块的色板，中间三栏分别是按钮（主要 / 次要 / 危险三组状态）、输入框和状态徽标开关，下面一行是标签页、头像和提示条，底部左边三档价格卡、右边 Display 48 / Heading 24 / Body 16 字号样张。示例图是英文版。

**常见问题与调整**：
- 组件太多太挤：删掉头像和提示条，只保留"按钮、输入框、卡片、字号"四块。
- 想要深色主题版：加"同一套组件的暗色模式，背景炭黑"。
- 字体不像中文规范：指定"中文用无衬线黑体，数字用等宽字体"。
- 想做成多页规范：分别追问"只展示按钮的所有状态""只展示表单组件"。

**适合**：设计规范封面、作品集展示、团队视觉风格讨论；不适合直接当可开发的组件库，具体尺寸和交互仍需设计师在设计工具里落地。

### 英文原版

```
Generate a clean design system overview board for a fictional product language called LUMEN UI, arranged as a square component gallery on a 2048x2048 canvas. Use a neutral palette of ivory, charcoal, muted blue, sage, and coral accents. The composition should be an orderly grid of cards showing buttons, input fields, badges, toggles, tabs, avatars, alerts, and pricing cards. Include crisp typography, even spacing, subtle shadows, and exact alignment as if exported from a professional design tool. Add labeled sections with the in-image text "LUMEN UI", "Buttons", "Inputs", "Status", "Cards", and "Type Scale". Include sample button labels "Primary", "Secondary", and "Danger"; badge labels "Success", "Pending", and "Error"; and typography specimens "Display 48", "Heading 24", and "Body 16". Ensure the board feels systematic, editorial, and highly legible, with clean hierarchy, correct labels, and polished component consistency suitable for a design systems gallery.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

---
title: "ppt提示词：极简编辑风观点页，超大黑体结论 + 三行分级说明（gpt-image-2）"
slug: editorial-big-headline-three-tier-risk-slide
model: gpt-image-2
topics: [ppt, infographic]
aspectRatio: "16:9"
needsRefImage: false
useCase: "做演讲里\"一句话观点\"的页面：暖灰色纸张底、瑞士网格、一行超大的中文结论，下面用三行细线分隔的列表讲轻 / 中 / 重三个层级，右边配一张小小的对比示意图，适合技术分享和行业观点类演讲。"
prompt: |
  请做一页"只讲一个观点"的演讲幻灯片，16:9：底色像暖调的浅灰色纸张，留白很多，按瑞士网格排版，有高级发布会幻灯片的质感；中文用优雅的宋体，再配几处极小的英文导航字。
  - 顶部：左上角两行很小的全大写英文面包屑，字距拉开——"[COMPARISON · LOCK-IN]"和"[CLOSED VS OPEN]"；右上角页码"[04 / 08]"。
  - 结论大字：放在页面上半部、左对齐，只占一行，字号极大，黑色粗宋体："[真正的锁定，不是模型，是记忆。]"
  - 标题下方的左半边排三行"分级条目"，灰色细横线把它们一行行隔开；每一行都是同样的三段：左端粗体标签、中段一句解释、右端一个贴边的全大写英文小词：
    - 第 1 行，标签"[轻度风险]"，解释"[状态存在服务端，换模型后无法恢复线程。]"，右端小词 STATE；
    - 第 2 行，标签"[中度风险]"，解释"[闭源框架的记忆形态不可见，难以迁移。]"，右端小词 SHAPE；
    - 第 3 行，标签"[最高风险]"，解释"[整个框架和长期记忆都在 API 后面。]"，右端小词 LOCK-IN。
  - 页面右半边放一张白底、圆角的小卡片，卡片里画一幅分成左右两栏的对比流程图：左边一栏代表"封闭"，右边一栏代表"开放"，每栏都是几层带小图标的方框，从上往下用细线串起来；受限的环节在左栏用红色小图标标出，可以迁移的环节在右栏用深蓝色标出；图里的字都很小，只是示意。
  - 页脚：左下一行很小的灰字注脚；正中是一排表示分页的小圆点，当前页那一个画成短横；右下是同样很小的翻页提示。
  - 全页只用黑、灰和暖白三种颜色，红色与深蓝只在小图里点到为止；中文必须清楚、没有错字，不加水印。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/op7418/status/2049094944405737512
  author: "@op7418"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并精简；面包屑、页码、大标题、三行的标签与说明、英文小关键词改为变量；右侧示意图改为\"两栏对比的小流程图\"的通用描述；保留底部分页圆点等细节"
images:
  - 3512-editorial-big-headline-three-tier-risk-slide-1.jpg
imageCredit:
  by: "@op7418"
  url: https://youmind.com/gpt-image-2-prompts?id=16946
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：大标题是这一页的灵魂，写成一句有判断的短句（15 个字以内，逗号断成两三节更有节奏）；三行列表的标签用同一组分级词（轻 / 中 / 重、短期 / 中期 / 长期、个人 / 团队 / 公司），说明各一句话，超过 20 个字的请直接改写进提示词；英文小关键词各一个单词。右侧示意图可以换成"一张简单的柱状对比""前后两个状态的小图"。

示例图是暖灰色的一页：左上角两行小英文、右上角"04 / 08"；中间一行很大的黑色中文标题；下面三行分别以"轻度风险""中度风险""最高风险"开头，右端各有一个小英文词；右侧是一张白色卡片，里面是两栏密密的小流程图，一栏带红色图标、一栏带深蓝色块；底部中间是一排分页圆点。

**常见问题**：
- 右侧小图里的字是乱码：这是预期内的，小图只做示意；要可读就删掉小图，改成右侧留白。
- 标题被自动换成两行：写"标题单行排布，字号以一行放得下为准"。
- 版面变花：强调"除红、深蓝两处点缀外不使用其他颜色"。

**适合**：技术分享、行业观点演讲、发布会里的"金句页"；整套演示可以固定面包屑和页码样式连续生成。

### 英文原版

```text
A minimalist editorial presentation slide in 16:9 format with a warm light-gray paper background, lots of negative space, refined Swiss-style grid layout, and high-end PPT/keynote design aesthetics. The slide is a comparison page about lock-in, using elegant Chinese typography mixed with tiny English navigation text. At the top left, place two small uppercase English breadcrumb lines: “COMPARISON · LOCK-IN” and below it “CLOSED VS OPEN”, in a thin sans-serif with wide tracking. At the top right, place the page indicator “04 / 08”. Center-left across the upper half, add a very large bold black Chinese headline: “真正的锁定，不是模型，是记忆。” On the left half below the headline, create a three-row comparison list separated by thin horizontal gray rules. Row 1 has the bold Chinese label “轻度风险” on the left, with the explanatory sentence “状态存在服务端，换模型后无法恢复线程。” to its right, and a tiny uppercase English keyword aligned far right: “STATE”. Row 2 has the bold label “中度风险”, with the sentence “闭源 harness 的记忆形态不可见,难以迁移。” and the far-right keyword “SHAPE”. Row 3 has the bold label “最高风险”, with the sentence “整个 harness 和长期记忆都在 API 后面。” and the far-right keyword “LOCK-IN”. On the right side of the slide, place a small inset comparison diagram card with a white background and subtle border, containing 2 side-by-side system architecture panels. The left panel represents a closed system in dark gray and muted red accents; the right panel represents an open system in deep blue accents. Each panel should have 5 small top icon tabs, a central highlighted harness block, several stacked rounded rectangular modules below, and a bottom row of 4 small capability icons with short Chinese labels. Keep the inset detailed but small, so it reads as a supporting visual rather than the main focus. At the bottom left, add tiny light-gray Chinese footer text: “布局测试 · 顶部标题 + 下方两段式内容”. At the bottom right, place a small page number “04”. Centered near the bottom edge, add a carousel indicator with exactly 7 small dots, where the 4th dot is a short dark rounded pill indicating the active slide and the other 6 dots are pale gray circles. Also add tiny faint navigation hints at the lower right edge reading “← → 翻页   ESC 关闭”. Use crisp vector text rendering, understated contrast, elegant spacing, and a calm premium infographic style suitable for a business presentation about AI platform comparison and API memory lock-in.
```

> 改编自 [@op7418](https://x.com/op7418/status/2049094944405737512) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

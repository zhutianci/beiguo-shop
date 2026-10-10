---
title: "ai表情包制作提示词：丑萌手绘小动物聊天贴纸，一张出 24 个（gpt-image-2）"
slug: hetauma-animal-line-stickers-24
model: gpt-image-2
topics: [sticker, illustration]
aspectRatio: "1:1"
needsRefImage: false
useCase: "想快速出一整套\"看着随手画、其实很耐看\"的小动物聊天贴纸时用：蜡笔铅笔质感的小熊、兔子、企鹅、小狗、猫，每个配一句手写短语，一张图排二十多个，适合做面向年轻人的日常表情包。"
prompt: |
  用"丑萌"的稚拙手绘风（看似随手画、其实很耐看的那种）设计[24]个[小动物]聊天贴纸，全部排在一张正方形图里。目标用户是[年轻人 / Z 世代]，风格要时髦、讨喜，适合日常聊天高频使用。
  - 排版：白色或米白背景上排成整齐的网格，每行 5～6 个，贴纸之间留出均匀的空隙，不画分格线；
  - 角色：小熊、猫、柴犬、兔子、企鹅、卷毛小狗等，圆滚滚的身体、豆豆眼、粉色圆腮红，每个贴纸一只动物、一个动作；
  - 线条与上色：略带抖动的蜡笔 / 铅笔质感黑色描边，淡淡的彩铅或水彩晕染上色，颜色柔和；
  - 文字：每个贴纸上方一句手写体短语，如[早呀、谢谢、收到、辛苦啦、晚安]，全部用简体中文，每句不超过 6 个字，互不重复；
  - 点缀：小爱心、星星、音符、汗滴、问号、灯泡等手绘小符号；
  - 顶部可加一行手写标题"[丑萌动物表情包]"；
  - 不要水印，不要真实品牌和已有的卡通形象。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/midori_tatsuta/status/2045367592353943984
  author: "@midori_tatsuta"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "日文原帖只有一句话（24 个丑萌手绘动物 LINE 贴纸、面向日本 Z 世代、冲下载榜）；译为中文并按示例图补充了网格排版、动物种类、蜡笔淡彩画法、手写短语、小符号点缀和可选标题；数量、动物、人群、短语示例、标题改为变量；目标人群由\"日本 Z 世代\"改为通用的年轻人"
images:
  - 3456-hetauma-animal-line-stickers-24-1.jpg
imageCredit:
  by: "@midori_tatsuta"
  url: https://youmind.com/gpt-image-2-prompts?id=13987
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[24] 是贴纸数量，想让每个画得更大更清楚就改成 12 或 16；[小动物] 可以限定成一种，如"各种姿势的仓鼠""只有猫"；[年轻人 / Z 世代] 换成"宝妈群""大学生""打工人"，模型会相应调整短语的语气；短语示例换成你想要的几句，其余的模型会照着补全。

示例图没有标题：白底上 5 行 5 列的蜡笔质感小动物，有小狗、白熊、企鹅、水獭、青蛙、兔子、仓鼠、熊猫、刺猬、乌龟、浣熊等，每个上方一句日文手写短语（原作者用的是日文），配小爱心和星星。示例图实际画了 25 个，说明数量不一定准，要严格的数量就在提示词里把行列数写死。

**常见问题**：
- 数量多一个或少一个：写明"4 行 6 列、恰好 24 个"，仍不准就按行分两次生成。
- 画得太精致、不够"丑萌"：加"线条故意歪一点、比例随意，像小朋友画的"。
- 中文手写字出错：减少到 12 个贴纸，字会更大更准。

**适合**：日常聊天表情包、手账贴纸、社群打卡贴图；上架售卖前请确认图里没有与现有卡通形象撞脸的角色。

### 日文原版

```text
Create {argument name="quantity" default="24"} LINE stickers of {argument name="animals" default="animals"} in a quirky hand-drawn style. Target {argument name="target audience" default="Japanese Gen Z"} with a trendy style that can aim for top downloads.
```

> 改编自 [@midori_tatsuta](https://x.com/midori_tatsuta/status/2045367592353943984) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

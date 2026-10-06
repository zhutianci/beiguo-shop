---
slug: midjourney
name: Midjourney
kind: MODEL
updated: 2026-10-06
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://updates.midjourney.com/edit-model-for-v8/
  - https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
  - https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video
  - https://updates.midjourney.com/introducing-our-v1-video-model/
  - https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans
  - https://docs.midjourney.com/hc/en-us/articles/32019750070669-Stealth-Mode
verify:
  - 当前默认版本 V8.2（2026-07-24 起）：docs.midjourney.com 本次抓取被 403 拦截，信息来自官方文档的搜索摘要，上线前打开 Version 页面确认
  - 免费试用：文档称 Discord 不提供免费试用、niji·journey App 有有限试用，需确认是否仍有效
  - 中文提示词的实际效果：本站提示词按规则用中文书写，需在 V8.2 上实测中文与英文的差别，必要时在单条里附英文版
  - 视频：官方文档写「Animate 把一张图变成 5 秒视频」，是否已有更新的视频模型需确认
---
## Midjourney 是什么

Midjourney 是一家独立研究实验室推出的 AI 绘画服务，以画面美感和风格化见长。截至 2026-10，官方默认模型是 V8.2（2026-07-24 起成为默认版本）。可以在官网 midjourney.com 的网页版里使用，也可以在 Discord 里使用。

## 能做什么

- **文生图**：特别适合插画、概念设计、电影感画面、风格探索
- **Edit Model**：V8.2 的新功能，最多可用 4 张参考图生成新图，取代了原来的 Omni Reference、Character Reference 和 Retexture
- **风格控制**：Style Reference（风格参考）、Moodboards（情绪板）、Personalization（个性化）
- **视频**：生成图片后点「Animate」，可以把一张图变成约 5 秒的短视频
- **常用参数**：`--ar` 画幅、`--stylize` 风格化强度、`--sref` 风格参考、`--hd` 高清

## 怎么用

1. 打开 midjourney.com 并登录，或者加入官方 Discord
2. 订阅任一付费计划
3. 在输入框写提示词，参数接在末尾，比如 `--ar 3:4`

## 免费与付费的区别

按官方文档：Discord 里不提供免费试用，niji·journey 手机 App 有有限的试用。付费计划分 Basic、Standard、Pro、Mega 四档。Relax 模式（不消耗快速 GPU 时间、可以不限量排队生成图片）从 Standard 起才有；隐身模式（作品不公开展示）只有 Pro 和 Mega 有。也就是说，**低档计划生成的图默认会公开**，涉及商业保密的内容要注意。

## 本页的提示词怎么用

Midjourney 的提示词更像「关键词 + 风格描述」，不需要写成完整的句子。本页条目会把主体、风格、光线、构图拆开写，参数单独列出。生成后先看四张图里哪张最接近，再用变体或 Edit 继续调整，比反复改提示词更快。

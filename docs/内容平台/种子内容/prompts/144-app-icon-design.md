---
title: App 图标提示词：轻拟物风圆角应用图标（App Store 质感）
slug: app-icon-design
model: gpt-image-2
topics: [logo]
aspectRatio: "1:1"
needsRefImage: false
useCase: 给自己的 App、小程序、独立开发项目生成一枚有质感的应用图标，也可以做个人项目的头像。
prompt: |
  为一款叫"[闪聊]"的应用设计一枚 macOS 风格的应用商店图标。
  单个超椭圆（squircle）圆角图标，四角平滑连续圆润，放在白色画布正中，四周留白，图标约占画布的 80%。
  现代轻拟物风格，达到应用商店上架的品质。图标主题：[对话气泡 + 闪电]，主色[紫蓝渐变]。
  只画一个图标。
negativePrompt: null
source:
  repo: EvoLinkAI/awesome-gpt-image-2-API-and-Prompts
  url: https://x.com/iamaiistudio/status/2069900481770737707
  author: "@iamaiistudio"
  license: CC0 1.0
  licenseUrl: https://creativecommons.org/publicdomain/zero/1.0/
  changes: 英文原文译为中文；应用名改为中文示例，补充图标主题和主色两个变量
images:
  - 144-app-icon-design-1.jpg
imageCredit:
  by: "@iamaiistudio"
  url: https://x.com/iamaiistudio/status/2069900481770737707
  license: CC0 1.0
verify:
  - 在 gpt-image-2 上实测 3 次，记录成功率与最常见的失败形式
  - 图标是否只有一个、四周留白是否足够
  - 缩小到 64px 时是否仍可辨认
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[图标主题] 用 1–2 个元素组合表达 App 的核心功能，例如记账 App 写"钱包 + 对勾"，天气 App 写"太阳 + 云"；元素超过 2 个就会显得乱。[主色] 写一种颜色或一组渐变。

**常见问题**：
- 图标里出现文字：在最后加"图标里不要任何文字和字母"。
- 生成了多个图标：保留"只画一个图标"。
- 太像某个大厂 App：生成后和同类 App 对比一下，避免和知名应用图标过于相似。

**迭代**：满意后追问"同一个图标，做一版深色模式"，就能得到浅色 / 深色两版。上架前按各平台要求导出对应尺寸。

### 英文原版

```text
Design a macOS App Store icon for an app called 'Flash Chat'. Single squircle icon with smooth, continuously rounded corners, centered on a white canvas with padding, filling roughly 80% of the canvas. Modern light skeuomorphic style, macOS App Store quality. One icon only.
```

> 改编自 [@iamaiistudio](https://x.com/iamaiistudio/status/2069900481770737707) 发布、[EvoLinkAI/awesome-gpt-image-2-API-and-Prompts](https://github.com/EvoLinkAI/awesome-gpt-image-2-API-and-Prompts) 收录的提示词，仓库许可证 CC0 1.0；示例图同样来自该仓库收录的原帖出图。

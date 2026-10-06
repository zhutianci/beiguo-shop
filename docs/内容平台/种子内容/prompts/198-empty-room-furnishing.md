---
title: nano banana 空房间软装提示词：拍一张毛坯 / 空房照片，预览摆上家具后的效果
slug: empty-room-furnishing
model: nano-banana
topics: [interior, photo-edit]
needsRefImage: true
useCase: 刚收房、租到空房、准备换软装时，拍一张空房间照片上传，直接看到摆好家具后的样子，方便比较不同风格、和家人或设计师沟通。
prompt: |
  这是一间空房间的照片。请在不改变房间结构的前提下，帮我把它布置成一间[客厅]，展示摆好家具后的效果：
  - 墙体、门窗、地板、天花板、窗外景色和拍摄角度完全保持不变；
  - 软装风格：[奶油原木风]，主要家具包括[布艺沙发、茶几、地毯、落地灯、绿植]；
  - 家具尺寸符合房间比例，摆放合理，留出正常的通行空间；
  - 光线与原照片一致（同样的窗光方向和色温），家具有真实的投影，整体像实拍照片而不是效果图。
negativePrompt: null
source:
  repo: ZeroLu/awesome-nanobanana-pro
  url: https://x.com/NanoBanana/status/1994483569625022487
  author: "@NanoBanana"
  license: MIT
  licenseUrl: https://raw.githubusercontent.com/ZeroLu/awesome-nanobanana-pro/main/LICENSE
  changes: 原文只有一句"告诉我这个房间放上家具会是什么样"；本站扩写为房间用途、风格、家具清单变量，并补充"结构不变、比例合理、光线一致"的约束
imageBrief: 站长用一张自家或样板间的空房间照片作输入，分别生成"奶油原木风"和"现代极简黑白灰"两版，附原图共 3 张（仓库示例结果图单张超过 1.2MB，未下载）。
verify:
  - 实测窗户位置、门洞是否被改动
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：站在房间角落、手机横拍、尽量拍到两面墙和窗户，上传后发送提示词。[客厅] 可换"主卧""书房""儿童房"；风格可以连续试几种：奶油风、日式原木、现代极简、法式复古、中古风。

**常见问题**：
- 房间结构被改（窗户变大、墙被打通）：把"墙体、门窗……完全保持不变"挪到第一句，并加"只添加家具和软装"。
- 家具比例不对（沙发过大）：在家具清单里写尺寸，如"2.4 米三人沙发"。
- 想换墙面颜色：单独追问"把背景墙刷成[燕麦色]，其他不变"，一次只改一件事更稳定。

**适合**：收房后的软装规划、租房改造、二手房挂牌美化（挂牌时请注明"效果示意"）。配合 159 号"户型图转 3D"可以先看全屋布局，再逐个房间细化。

### 英文原版

```
Show me how this room would look with furniture in it
```

> 改编自 [@NanoBanana](https://x.com/NanoBanana/status/1994483569625022487) 发布、[ZeroLu/awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) 收录的提示词，仓库许可证 MIT（Copyright (c) 2025 ZeroLu）。

---
title: nano banana 相机参数提示词：用 ISO、光圈、快门、焦段"重拍"一张照片
slug: camera-params-reshoot
model: nano-banana
topics: [photography, photo-edit]
needsRefImage: true
useCase: 手机照片噪点多、景深浅不够、想要"单反感"时，上传原图，写上想要的相机参数，让 nano banana 按这些参数重新渲染出一张更像专业相机拍的照片。
prompt: |
  用以下相机参数重新拍摄这张照片：RAW 格式，ISO [100]，光圈 [F2.8]，快门 [1/200 秒]，焦段 [24mm]。
  画面内容、人物长相、姿势和构图保持不变，只改变成像质感：
  - 低 ISO 带来的干净画面、细腻的皮肤和材质纹理；
  - 与光圈匹配的景深和背景虚化；
  - 与焦段匹配的透视感；
  - 宽容度更高的高光和暗部细节，色彩自然。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/hckinz/status/1962803203063586895
  author: "@hckinz"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只是一串参数"RAW-ISO 100 - F2.8-1/200 24mm"；本站拆成 4 个参数变量，并写明每个参数应带来的画面变化
images:
  - 160-camera-params-reshoot-1.jpg
  - 160-camera-params-reshoot-2.jpg
imageCredit:
  by: "@hckinz"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case62
  license: Apache-2.0
verify:
  - 分别用 F1.4 和 F11 实测，看景深变化是否明显
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传照片，按需要改参数。示例第 1 张是结果，第 2 张是原图（地铁站手机自拍）。几个常用组合：
- 人像虚化：ISO 100、F1.8、1/250、85mm；
- 风景全清晰：ISO 100、F8～F11、1/125、24mm；
- 夜景氛围：ISO 800、F1.4、1/60、35mm，可以再加"保留适量颗粒感"。

**常见问题**：
- 脸变了：加"人物五官完全不变"，并避免把焦段改得太极端（比如 24mm 改 200mm 会改变透视，容易连脸型一起改）。
- 效果不明显：模型并不真的"懂"物理参数，可以在参数后补一句画面描述，比如"背景强烈虚化成光斑"。

**适合**：手机照"单反化"、社媒配图、摄影爱好者对比不同参数的画面效果。

### 英文原版

```
RAW-ISO [100] - [F2.8-1/200 24mm] settings
```

> 改编自 [@hckinz](https://x.com/hckinz/status/1962803203063586895) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

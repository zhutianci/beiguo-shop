---
title: nano banana 改人物朝向提示词：侧脸、低头照片改成正视镜头
slug: face-forward-fix
model: nano-banana
topics: [photo-edit, portrait]
needsRefImage: true
useCase: 合影里有人没看镜头、自拍角度太偏、低头被抓拍时，上传照片让人物改成直视前方，其他内容不变。
prompt: |
  让图中[穿黑色西装的女生]把头和视线转向正前方，直视镜头。
  只调整头部朝向和眼神，五官长相、发型、表情、身体姿势、衣服、背景和光线都保持和原图一致。
  转头后脖子和肩膀的衔接要自然，光影方向与原图一致，保持照片真实感。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/arrakis_ai/status/1955901155726516652
  author: "@arrakis_ai"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原文只有一句"让图中人物直视前方"；本站扩写为指定人物变量 + 只改头部朝向的约束清单
images:
  - 153-face-forward-fix-1.png
  - 153-face-forward-fix-2.png
imageCredit:
  by: "@arrakis_ai"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/case25
  license: Apache-2.0
verify:
  - 用多人合影实测"只改其中一个人"能否成功
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传照片后发送提示词。照片里只有一个人时，[穿黑色西装的女生] 可以直接写"图中人物"；多人合影一定要用衣服颜色、位置（"左边第二个"）把目标人物描述清楚。示例第 1 张为结果，第 2 张为原图。

**常见问题**：
- 脸变得不像本人：改朝向时偶尔会"换脸"，多生成 2～3 次挑最像的；角度变化越大越容易失真，侧脸 90° 改正脸的成功率明显低于 30° 左右的微侧。
- 其他人也被改了：加"其他人物保持完全不变"。
- 还想改表情：追问"再让她微笑一点"，一次只改一个属性更稳定。

**适合**：合影补救、头像预处理、社交头像；不要用于伪造他人照片。

### 英文原版

```
Have the person in the picture look straight ahead
```

> 改编自 [@arrakis_ai](https://x.com/arrakis_ai/status/1955901155726516652) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

---
title: nano banana 老照片修复上色提示词
slug: old-photo-colorize
model: nano-banana
topics: [old-photo]
needsRefImage: true
useCase: 给黑白或褪色的老照片去划痕并自然上色，适合家庭相册、纪念日分享。
prompt: |
  修复并为这张照片上色。
  修复：去掉划痕、折痕、霉斑和噪点，补全缺损的边角。
  上色：颜色自然真实，符合[20世纪60年代]的服装和环境，肤色自然。[已知颜色，如外套是藏蓝色]
  保持不变：人物的脸、表情、发型、姿势和照片构图都不要改，不要美颜，不要添加原图没有的东西。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/GeminiApp/status/1960347483021959197
  author: "@GeminiApp"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 原提示词只有一句"修复并为这张照片上色"，本站保留原句，并补充了修复项、年代变量、已知颜色变量和"保持不变"约束
imageBrief: 用站长自家（已获家人同意）的一张黑白老照片作输入，生成 2 张：只用第一句短提示词一版，用本页完整提示词一版，并排对比两者差别；附原图。
images:
  - 16-old-photo-colorize-1.jpg
  - 16-old-photo-colorize-2.jpg
imageCredit:
  by: "@GeminiApp"
  url: https://x.com/GeminiApp/status/1960347483021959197
  license: Apache-2.0
verify:
  - 在 Gemini 应用中用 nano banana 实测 3 次，对比"一句话版"与"完整版"的差别
  - 上色后人脸是否被改动
  - 确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）
---
**怎么填变量**：[20世纪60年代] 写照片大致拍摄年代，模型会据此推测服装和环境的颜色；[已知颜色……] 这一格写你确定的颜色，例如"军装是草绿色"，不知道就删掉。

**一句话也能用**：原版只有"修复并为这张照片上色"，简单照片已经够用；补充的几条主要是为了减少"改脸"和"乱加东西"。

**常见失败与调整**：
- 颜色发灰或过于鲜艳：加"饱和度适中，像那个年代的彩色胶片"。
- 人脸被改：保留"保持不变"那一行，原图尽量用高分辨率扫描件。
- 和 gpt-image-2 怎么选：两边都可以试，本站另有 gpt-image-2 的老照片高清化提示词，可对比效果。

**适合 / 不适合**：适合家庭留念；AI 上色的颜色是推测的，不能当作历史真实颜色使用。

> 改编自 [@GeminiApp](https://x.com/GeminiApp/status/1960347483021959197) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

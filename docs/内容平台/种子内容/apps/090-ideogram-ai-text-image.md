---
title: "Ideogram 是什么、怎么用：擅长图中文字的 AI 生图工具（含 4.0 开放权重）"
slug: ideogram-ai-text-image
name: Ideogram
url: https://ideogram.ai/
pricing: 免费+付费（Plus / Pro / Team）
platforms: 网页 / iOS / API
trialNote: 用 Google、Apple 或 Microsoft 账号登录每周送 30 积分；邮箱注册不送免费积分；免费版作品公开
products: [ai-tools]
models: []
topics: [poster, logo, illustration]
excerpt: "Ideogram 是以图中文字准确著称的 AI 生图平台，适合做海报、Logo、贴纸和广告图，旗舰模型 Ideogram 4.5，4.0 版开放权重可下载，网页、iOS 和 API 都能用。"
checkedOn: 2026-10-07
sources:
  - https://docs.ideogram.ai/welcome-to-ideogram
  - https://docs.ideogram.ai/plans-and-billing/available-plans
  - https://docs.ideogram.ai/get-started/signup-and-registration
  - https://docs.ideogram.ai/create/models
  - https://ideogram.ai/blog/ideogram-4.0/
  - https://docs.ideogram.ai/about-ideogram/company
---

> 本文根据 Ideogram 官方帮助文档和官方博客整理，资料核对于 2026-10-07。功能和价格变化快，以官网为准。

## 是什么

Ideogram（读作 eye-dee-oh-gram）是同名 AI 公司推出的生图平台。按官方文档的博客列表，Ideogram 于 2023 年 8 月 22 日对外发布，8 月 29 日 Ideogram 0.1 向所有人免费开放。它一直以**能在图片里写对字**著称——海报、招牌、Logo 上的文字清晰可读，官网也专门把印花（Print on Demand）和可编辑文字图层列为主要使用场景。

现在官方定位是「生成式媒体平台」：自有模型 + 合作方模型 + 单一功能小应用 + API。按官方文档：
- **Ideogram 4.5**：最新旗舰，唯一可用参考图（最多 5 张）编辑和融合图片的 Ideogram 模型；
- **Ideogram 4.0**：官方博客 2026 年 6 月 3 日发布，是其首个**开放权重**模型（权重在 Hugging Face、代码在 GitHub），可下载自行部署，但生产环境使用需另购商业授权；支持 23:9、3:1 等超宽比例；
- **Ideogram 3.0**：唯一支持风格预设、风格参考图、负面提示词和配色的版本。

## 能做什么

- **带文字的设计图**：海报、封面、Logo、贴纸、T 恤图案，文字内容、排版和颜色可用提示词或 JSON 精确指定。
- **Magic Prompt**：自动扩写简短提示词，新手也能出完整画面。
- **Studio 编辑器**：分图层改图、扩图、加文字层，还能把图里的文字转成可编辑图层。
- **透明背景**：4.0 / 3.0 Transparent 模型直接出 PNG 透明底素材。
- **放大与抠图**：Upscale 最多放大 8 倍；Background Remover、Object Remover 等小应用一键处理。
- **批量生成**：从表格一次导入最多 500 条提示词，结果打包下载。
- **自定义模型与视频**：用自己的图片训练模型；也可生成带声音的短视频。

## 怎么上手

1. 打开 ideogram.ai，点 Sign up，**建议用 Google、Apple 或 Microsoft 账号登录**（这样才有每周免费积分）。
2. 设置用户名（3–16 位字母数字，设定后不能改），选择计划时可点 Skip 留在免费版。
3. 进入 Image 应用，模型保持 Auto 或选 Ideogram 4.5，在提示词里用英文引号写出要出现的文字。
4. 挑选结果后用 Studio 修改细节，或下载 PNG / 透明底文件。

![Ideogram 生图页的模型选择器，可按 Ideogram、OpenAI、Google、Tongyi 等提供方筛选模型](seed:a090-ideogram-model-picker.jpg)
*图片来源：[Ideogram 官方文档《Models》](https://docs.ideogram.ai/create/models)*

可以这样开始：`Vintage travel poster of a lighthouse at sunset, bold title text "CAPE BLUE", retro screen print style`

## 免费与付费

官方文档《Plans and Credits》列出的方案（官方文档定价表，标注核对于 2026-10-01，美元不含税）：

| 方案 | 月付 | 年付折合每月 | 每月积分 |
| --- | --- | --- | --- |
| Free | 0 | 0 | 每周 30 |
| Plus | 20 | 15 | 2,400 |
| Pro | 60 | 42 | 7,500 |
| Team | 每人 30 | 每人 20 | 每人 3,600 |

年付也是每月发放积分；月度积分不结转；付费方案可额外购买积分。Team 至少 2 人。所有方案（含免费）都能用 Ideogram 自家全部模型；合作方的高级模型需要付费方案或另购积分。Plus、Pro、Team 积分用完后，仍可在慢速队列里继续用 Ideogram 自家模型生成。

## 适合谁 / 不适合谁

适合：
- 需要海报、广告图、社媒配图里带准确英文文字的设计和营销人员。
- 做 T 恤、贴纸、杯子印花的 Print on Demand 卖家。
- 想下载 4.0 开放权重研究或自部署的开发者（商用需授权）。

不适合：
- 主要需要中文大段文字排版的场景，建议先小量测试。
- 免费版又不希望作品公开的用户。
- 只用邮箱注册、想白嫖的用户：邮箱账号没有免费积分。

## 注意事项

- **公开与私密**：免费版和旧 Basic 方案生成的内容全部公开；Plus 及以上默认私密，发布到社区才公开。
- **商用**：官方 FAQ 表示商用以服务条款为准，使用前请阅读 Terms of Service。
- **账号不能合并**：不同登录方式即使邮箱相同也是不同账号，选定一种后长期使用。
- **开放权重 ≠ 随便商用**：4.0 权重可下载，但生产使用需另购商业许可。

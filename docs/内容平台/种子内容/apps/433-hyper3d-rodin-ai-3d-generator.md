---
title: "Rodin AI（Hyper3D）是什么、怎么用：图片和文字生成 3D 模型，支持 3D ControlNet 与局部编辑"
slug: hyper3d-rodin-ai-3d-generator
name: Hyper3D Rodin
url: https://hyper3d.ai/
pricing: 免费试用+订阅，价格以官网为准
platforms: 网页 / API / Blender、Unity、Unreal 等插件
trialNote: 官网提供 7 天免费试用
products: [ai-tools]
models: []
topics: [figurine, game-art, product-design]
excerpt: "Hyper3D Rodin 是 Deemos 公司的 AI 3D 生成器，可从图片或文字生成 3D 资产，特色是 3D ControlNet（用包围盒、体素、点云约束形体）、局部编辑和智能低面数优化，并有多款三维软件插件。"
checkedOn: 2026-10-11
sources:
  - https://hyper3d.ai/
---

> 本文根据 Hyper3D 官网整理，资料核对于 2026-10-11。功能和价格变化快，以官网为准。

## 是什么

Rodin 是 Deemos Corporation 推出的 AI 3D 模型生成器，产品网站叫 Hyper3D，所以搜索时会同时看到「Rodin AI」「Hyper3D」两个名字，指的是同一个产品。它可以根据文字提示或图片生成 3D 资产，官网当前的生成模型选项显示为 Gen-2.5。

在一众 AI 3D 工具里，Rodin 的特点是**可控性**：不只是「给图出模型」，还允许你用粗略的三维形状去约束结果。

## 能做什么

- **Image to 3D / Text to 3D**：图片或文字生成模型。
- **3D ControlNet**：用包围盒（Bounding Box）、体素（Voxel）或点云（Point Cloud）作为引导，控制生成模型的比例和大致形体——比如规定「这个角色必须是这样的高矮胖瘦」。
- **Partial Edit（局部编辑）**：只改模型的一部分，其余保持不变。
- **Smart Low-Poly（智能低面数）**：把模型优化成面数更低的版本，方便进游戏引擎。
- **免费重试**：对不满意的结果可以重新生成。
- **导出格式**：STL、FBX、OBJ、GLB、GLTF、USDZ。
- **API 与插件**：提供 API，以及 Blender、Unity、Unreal、Godot、Maya、3DS Max 插件。

## 怎么上手

1. 打开 hyper3d.ai 注册登录。
2. 选择图片或文字输入；图片生成时可以上传多张不同角度的图以提高准确度。
3. 需要控制比例时，打开 ControlNet，先摆一个包围盒或导入一个粗模作为引导。
4. 生成后预览，按需要做局部编辑或低面数优化。
5. 选择格式导出，或通过插件直接送进三维软件。

## 免费与付费

官网提供 7 天免费试用和订阅方案，并有单独的定价页；核对时页面未直接展示各档金额，**具体价格与积分数量以官网定价页为准**。API 另行计费。

## 适合谁 / 不适合谁

**适合：**
- 对模型比例和形体有明确要求、希望 AI 「按框生成」的游戏和动画美术；
- 需要把生成结果直接送进 Blender、Maya、Unreal 等软件继续制作的团队；
- 想通过 API 把 3D 生成集成进自己产品的开发者。

**不适合：**
- 只想偶尔玩一下、希望长期免费的用户；
- 需要参数化、可精确修改尺寸的 CAD 类建模；
- 完全没有三维软件基础、也不打算学习的人——ControlNet、低面数这些功能需要一点基础概念。

## 注意事项

- **名字别搞混**：Rodin 是产品 / 模型名，Hyper3D 是网站名，Deemos 是公司名；认准 hyper3d.ai。
- **商用授权**：不同订阅档对生成资产的私有性和商用权利规定不同，购买前看清条款。
- **输入素材的版权**：用他人作品或受保护角色的图片生成模型，风险由使用者承担。
- **生成结果仍需检查**：留意破面、贴图接缝和内部多余面，尤其是要 3D 打印时。

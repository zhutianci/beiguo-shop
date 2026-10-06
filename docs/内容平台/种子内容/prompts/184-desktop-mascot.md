---
title: nano banana 桌面宠物提示词：让你的角色趴在电脑桌面窗口上（半 3D 吉祥物）
slug: desktop-mascot
model: nano-banana
topics: [character, illustration]
modelLabel: Nano Banana Pro
needsRefImage: true
aspectRatio: "16:9"
useCase: 给原创角色、品牌吉祥物或 VTuber 形象做一张"住在电脑桌面里"的趣味图——角色趴在浏览器窗口上、坐在文件夹旁边，可做壁纸、社媒宣传图或桌宠产品概念图。
prompt: |
  操作系统环境：[Windows 11]风格的真实电脑桌面截图，包含逼真的应用窗口（如浏览器、文件夹）、桌面图标和任务栏，界面元素只作背景。
  主体：参考图中的角色，以半 3D 动漫风格渲染（柔和的卡通着色、清晰的阴影和立体高光），作为"桌面吉祥物"与系统界面互动。
  动作（自然、略带趣味，任选其一或组合）：趴在窗口顶部边缘、坐在窗框上、伸手戳一个图标、从文件夹后面探出头。
  构图：16:9 的真实桌面，正面截图视角；角色明显位于窗口和图标之上，图层分离清晰。
  光照与颜色：中性的正面或顶部光，阴影清晰；桌面为系统风格的冷色调，角色配色严格遵循参考图。
  除非必要，不添加额外文字。高分辨率。
negativePrompt: null
source:
  repo: PicoTrex/Awesome-Nano-Banana-images
  url: https://x.com/munou_ac/status/1995774756369666109
  author: "@munou_ac"
  license: Apache-2.0
  licenseUrl: https://www.apache.org/licenses/LICENSE-2.0
  changes: 在仓库中文译文基础上大幅压缩（原文为长篇分项设定），合并重复的风格与光照说明；保留操作系统为变量
images:
  - 184-desktop-mascot-1.jpg
imageCredit:
  by: "@munou_ac"
  url: https://github.com/PicoTrex/Awesome-Nano-Banana-images/tree/main/images/pro_case34
  license: Apache-2.0
verify:
  - 分别用 Windows 11 和 macOS 实测，检查界面是否逼真、有无乱码
  - 仓库只收录了中文译文，原帖语言待核实
  - 确认原帖仍可访问、作者未另行声明保留权利
---
**怎么用**：上传角色图（立绘、Q 版形象都可以），[Windows 11] 可改成"macOS"。示例图是一个 Q 版角色坐在 Windows 资源管理器窗口上的效果。想指定具体动作，就把"任选其一或组合"改成一个明确的动作，比如"从回收站里探出半个身子"。

**常见问题**：
- 窗口里的文字是乱码：这是正常现象，界面文字只作背景；如果要用作宣传图，可以加"窗口内容模糊处理"。
- 角色和桌面"贴"在一起不自然：强调"角色有投在窗口上的阴影"。
- 想要动起来：把这张图作为首帧，交给可灵、Seedance 等视频模型做"角色挥手"的图生视频。

**注意**：使用自己的原创角色或已获授权的形象；系统界面仅作示意，不要用于冒充官方产品宣传。

### 原版（仓库收录的中文译文，节选）

```
操作系统环境：
- 选择一项："Windows 11 风格桌面"或"macOS Sonoma 风格桌面"
- 如果未指定，则让模型选择最自然的操作系统界面
- 使用基于所选操作系统的真实界面元素
主题：
- 基于参考图像 A 的角色
- 使用半 3D 动漫风格渲染
- 清晰的阴影和立体的高光
- 以桌面吉祥物的形式与真实的操作系统界面互动
构图：
- 16:9 比例的逼真电脑桌面
- 包含逼真的应用程序窗口和图标
- 角色自然地位于这些界面元素上或周围
动作：
- 允许模型自由选择吉祥物般的行为，例如：趴在窗口顶部边缘、坐在窗框上、触摸或对图标做出反应、从文件夹或应用程序后面窥视
（后略：位置、风格、相机光照、颜色、文本、编辑说明等分项，完整原文见仓库「例 34：电脑桌面吉祥物」）
```

> 改编自 [@munou_ac](https://x.com/munou_ac/status/1995774756369666109) 发布、[PicoTrex/Awesome-Nano-Banana-images](https://github.com/PicoTrex/Awesome-Nano-Banana-images) 收录的提示词，仓库许可证 Apache-2.0。

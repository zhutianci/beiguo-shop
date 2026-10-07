---
title: "AI游戏素材生成提示词：把简陋的像素图标表升级成精致体素素材（布局不变）（gpt-image-2）"
slug: upgrade-pixel-icons-to-voxel-sheet
model: gpt-image-2
topics: [game-art]
aspectRatio: "3:4"
needsRefImage: true
useCase: "上传一张自己做的等轴测像素图标表（建筑、角色、怪物），让模型在保持网格、背景和文字标签不变的前提下，把每个图标重绘成细节丰富的体素风格，适合独立游戏原型美术升级。"
prompt: |
  以我上传的参考图为基础，把所有等轴测像素图标重新生成，质量和细节大幅提升。
  布局、网格结构、背景颜色和文字标签保持完全不变。
  把每个图标从简单的低面数方块升级为细节丰富的体素风插画：有正确的明暗、纹理和鲜明特征（比如给建筑加上窗户和门，给角色加上武器和盾牌，给动物加上毛发细节）。
  保持原有的角色设计和建筑类型不变，只让它们看起来更精致、更专业。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/NANDEMO_BUILD/status/2102352216686579802
  author: "赤池ラムネ@なんでもクリエイター"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；补充\"标签语言随原图保留\"的说明，示例中的日文标签改为\"原图标签\""
images:
  - 3092-upgrade-pixel-icons-to-voxel-sheet-1.jpg
imageCredit:
  by: "赤池ラムネ@なんでもクリエイター"
  url: https://youmind.com/gpt-image-2-prompts?id=35236
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：这条没有方括号变量，关键是上传一张排好网格的素材表（每格一个图标、下面一行标签），原图越整齐，升级后越不容易错位。想要特定风格，可以把"体素风"改成"手绘卡通 2.5D""16-bit 像素风"。

示例图是升级后的结果：深绿底上分成"建物 / 味方 / 敌"三个区，每格米色卡片里是一个体素风图标——冒险者公会、瞭望塔、风车、农田、教堂、市场，骑士、弓箭手、法师、石像魔像，骷髅、狼、兽人、魔王等，卡片下方保留了原图的日文标签。

**常见问题**：
- 文字标签被改写或乱码：强调"文字标签逐字保留，不要重绘文字"；必要时让它不画标签，后期再贴。
- 图标数量或位置变了：加"每个格子与原图一一对应，不增不减"。
- 风格不统一：写"所有图标同一光照方向、同一描边粗细"。

**适合**：独立游戏原型美术升级、策略 / 模拟经营游戏图标、桌游卡牌素材。

### 英文原版

```text
Using the provided reference image, regenerate all isometric pixel art icons with significantly higher quality and detail. Keep the exact same layout, grid structure, background color, and Japanese text labels unchanged. Upgrade each icon from simple low-poly blocks to richly detailed voxel-style illustrations with proper shading, textures, and distinct features (e.g., add windows/doors to buildings, weapons/shields to characters, fur details to animals). Maintain the same character designs and building types but make them look more polished and professional.
```

> 改编自 [赤池ラムネ@なんでもクリエイター](https://x.com/NANDEMO_BUILD/status/2102352216686579802) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

---
title: "AI像素画生成提示词：Q 版蓝色史莱姆怪物像素精灵（游戏素材 / 头像）（gpt-image-2）"
slug: cute-slime-pixel-monster-sprite
model: gpt-image-2
topics: [game-art, sticker]
aspectRatio: "1:1"
needsRefImage: false
useCase: "生成一个白底居中、Q 版可爱的 2D 像素风怪物精灵，示例是光亮的蓝色水滴史莱姆，适合 RPG 游戏收集怪物、头像、贴纸和表情包。"
prompt: |
  生成一个居中的 2D 像素风游戏精灵：一只可爱的[蓝色水滴史莱姆吉祥物]，纯白背景。
  角色是一个光亮的圆润水滴形团子，顶部有一个细细的小脖子和一颗小气泡般的水珠；身体用明亮的水蓝和青色，外面一圈深宝蓝色像素描边。
  卡哇伊、开心：恰好 2 只大大的深蓝椭圆眼睛，带白色方块高光；脸颊上 2 块粉色方形腮红；1 张张开微笑的小嘴，深色描边、粉色舌头。
  加入块状像素高光：额头左上 1 大块白色高光、左脸中间 1 个白色小点、右侧 1 个亮色小高光，身体下缘和两侧有浅青色的轮廓光。
  清晰的块状像素、低分辨率精灵美感、简单对称的正面姿势；不要文字、阴影、环境和其他角色，白底单独呈现。
  风格是精致的[复古 RPG 收集怪物精灵]，可爱、鲜艳，可以直接当游戏素材使用。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/flowoodzx/status/2096080474133201053
  author: "바스"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文；怪物类型、游戏风格改为变量；保留五官与高光的数量约束"
images:
  - 3095-cute-slime-pixel-monster-sprite-1.jpg
imageCredit:
  by: "바스"
  url: https://youmind.com/gpt-image-2-prompts?id=33548
  license: CC BY 4.0
verify:
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：[蓝色水滴史莱姆吉祥物] 换成别的小怪物，如"火焰小精灵""蘑菇宝宝""云朵小羊"，颜色和高光描述要跟着改（火焰写"橙红渐变、黄色内焰"）；[复古 RPG 收集怪物精灵] 可以换成"16-bit 平台跳跃游戏敌人"。做一套怪物图鉴时，保留"描边、眼睛、腮红、高光"这些写法，风格会很统一。

示例图是白底正中的一只蓝色像素史莱姆：顶部一颗小水珠，深蓝描边，两只大眼睛带白色方块高光，粉色腮红和张嘴笑，额头左上一块大白高光，像素块清晰。

**常见问题**：
- 像素感不够、像矢量图：加"低分辨率 32×32 像素，放大显示，无抗锯齿"。
- 背景不纯白：强调"纯白背景，无阴影"。
- 要透明底：生成后抠图，或在 API 中请求透明背景。

**适合**：RPG / 休闲游戏怪物素材、社交头像、贴纸与表情包、像素周边。

### 英文原版

```text
Create a centered 2D pixel-art game sprite of one cute {argument name="creature type" default="blue water slime mascot"} on a plain white background. The character is a glossy round teardrop-shaped blob with a small narrow neck and a tiny bubble-like droplet on top, using bright aqua and cyan body colors with a dark royal-blue pixel outline. Make it kawaii and cheerful: exactly 2 large oval dark-blue eyes with white square highlights, 2 pink square blush patches on the cheeks, and 1 small open smiling mouth with a dark outline and pink tongue. Add chunky pixelated shine effects: 1 large white shine patch on the upper-left forehead, 1 small white dot near the center-left face, 1 small bright highlight on the right side, and soft lighter-cyan rim highlights along the lower edge and sides. Use crisp blocky pixels, low-resolution sprite aesthetics, simple symmetrical front-facing pose, no text, no shadow, no environment, no extra characters, isolated on white. Style should look like a polished {argument name="game style" default="retro RPG collectible monster sprite"}, cute, vibrant, and ready for use as a game asset.
```

> 改编自 [바스](https://x.com/flowoodzx/status/2096080474133201053) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

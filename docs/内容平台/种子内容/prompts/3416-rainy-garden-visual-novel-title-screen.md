---
title: "ai游戏素材生成提示词：日式视觉小说标题画面，雨夜庭园 + 金色标题 + 三个菜单按钮（gpt-image-2）"
slug: rainy-garden-visual-novel-title-screen
model: gpt-image-2
topics: [game-art, illustration]
aspectRatio: "4:3"
needsRefImage: false
useCase: "给独立游戏、视觉小说、剧本杀小程序做标题界面概念图：雨夜的日式庭园做背景，金色衬线大标题、副标题和恰好三个深紫色菜单按钮居中排列，四周一圈细金边框。"
prompt: |
  为一款暗黑奇幻策略游戏生成一张有氛围感的日式视觉小说标题画面，游戏名"[紫阳花连锁]"。画幅 4:3 横版，带暗角和精致的古典边框。
  - 背景：午夜雨中的日式庭园。斜向的密集雨丝落在幽暗的石板路和湿润反光的地面上；左侧是一栋传统木屋，圆窗透出暖光；右侧是一座深色的塔形亭阁，窗内有微弱的暖光；还有树木、篱笆、灌木和石灯笼的剪影，左下和右下的前景是成簇的淡紫色绣球花。景物氛围化、低对比，大部分隐在黑暗和雾气里；
  - 标题区：位于画面中上部。标题上方有一条细金色横线，中间被一个带四角星的小圆徽隔开；大标题用典雅的金属质感金色衬线字；标题下面一行小字副标题"[穿过六片领域，以花破局。]"；
  - 菜单：副标题下方居中竖排恰好 3 个横向按钮，深紫色矩形、细金边、轻微内发光，左右两端各有一个金色小菱形；按钮文字从上到下依次是"[开始对战]""[玩法说明]""[设置]"；第一个按钮比另外两个略亮，像是被选中；
  - 边框与风格：整个画面外圈有一道细的双线金色边框，四角有小的断口装饰；典雅的和风哥特气质，靛蓝、黑、紫的低饱和配色，古金色界面点缀，背景是厚涂手绘感，界面文字清晰锐利；
  - 不要出现现代图标、多余按钮、Logo、水印和角色。
negativePrompt: null
source:
  repo: YouMind-OpenLab/awesome-gpt-image-2
  url: https://x.com/hmst_yyyy/status/2071118899882643861
  author: "@hmst_yyyy"
  license: CC BY 4.0
  licenseUrl: https://creativecommons.org/licenses/by/4.0/
  changes: "英文原文译为中文并拆成要点；游戏名、副标题、三个按钮文字设为变量并换成中文示例；保留\"恰好 3 个按钮、第一个高亮\"等数量约束；删去具体像素尺寸"
images:
  - 3416-rainy-garden-visual-novel-title-screen-1.jpg
imageCredit:
  by: "@hmst_yyyy"
  url: https://youmind.com/gpt-image-2-prompts?id=27091
  license: CC BY 4.0
verify:
  - "示例图为日文界面；改成中文后核对金色标题字体是否仍为衬线 / 明朝体风格、按钮文字有无错字"
  - "上线前在 gpt-image-2 上试跑 2～3 次，记录成功率与最常见的失败形式"
  - "确认原帖仍可访问、作者未另行声明保留权利（仓库许可证只代表仓库维护者）"
---
**怎么填变量**：游戏名建议 3～6 个字；副标题一句话，12 个字以内；三个按钮的文字可以改成"开始游戏 / 读取存档 / 设置"。想换题材，把背景那一段整体替换，例如"黄昏的废弃车站，铁轨延伸到远处"，同时把配色改成对应的色调，其余版式保持不变。

示例图是日文版：近乎全黑的雨夜庭园，左边木屋的圆窗亮着暖光，前景两侧是淡紫色绣球花；正中是金色大字"紫陽花連鎖"和一行小副标题，下面三条深紫色按钮，最上面一条稍亮；整个画面套着一圈细金线边框。

**常见问题**：
- 按钮数量不对或多出图标：保留"恰好 3 个按钮""不要现代图标"两句，并把它们放到提示词靠前的位置。
- 背景太亮抢了标题：加"背景整体压暗到只剩轮廓，标题区域最亮"。
- 中文标题变成黑体：写明"宋体 / 明朝体衬线字，金色金属质感"。

**适合**：独立游戏 / 视觉小说标题界面概念稿、游戏提案 PPT、剧本杀主视觉。它是一张效果图，实际界面仍需切图和开发。

### 英文原版

```text
Goal: Create a moody Japanese visual-novel title screen for a dark fantasy strategy game named {argument name="game title" default="紫陽花連鎖"}.

Canvas: 4:3 landscape game menu screen, approximately 920×768, with a dark cinematic vignette and refined antique framing.

Background: A rainy midnight Japanese garden scene. Show heavy diagonal rain streaks over a shadowy stone path and wet reflective ground. On the left, place a traditional wooden building with a warm glowing round window; on the right, a dark pagoda-like pavilion with faint warm window lights. Add silhouettes of trees, fences, shrubs, lantern-like structures, and clusters of pale purple hydrangeas in the lower left and lower right foreground. Keep the scenery atmospheric, low-contrast, and mostly obscured by darkness and mist.

Layout: Center the title area in the upper-middle of the screen. Above the title, add a thin gold horizontal divider line split by a small circular emblem containing a simple four-point sparkle/star. Use elegant metallic gold typography for the large Japanese title. Beneath it, add the small subtitle text {argument name="subtitle text" default="六つの領域を、花で突破せよ。"}. Below the subtitle, place exactly 3 horizontal menu buttons stacked vertically and centered.

Menu buttons: Use exactly 3 rectangular dark purple buttons with thin gold borders, subtle inner glow, and small gold diamond ornaments near both left and right edges. The visible button labels, from top to bottom, must be: {argument name="first button label" default="対戦を始める"}, {argument name="second button label" default="遊び方"}, {argument name="third button label" default="設定"}. The first button should be slightly lighter/brighter purple than the other two, as if selected.

Frame and style: Add a thin double-line gold border around the entire screen with small decorative corner breaks and short accent line segments near the corners. Use a refined Japanese gothic aesthetic, muted indigo/black/purple palette, antique gold UI accents, painterly background art, and crisp game UI typography. Avoid modern icons, extra buttons, logos, watermarks, or characters.
```

> 改编自 [@hmst_yyyy](https://x.com/hmst_yyyy/status/2071118899882643861) 发布、[YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) 收录的提示词，许可证 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本站已翻译并改写（修改内容见 changes）；示例图来自同一条目。

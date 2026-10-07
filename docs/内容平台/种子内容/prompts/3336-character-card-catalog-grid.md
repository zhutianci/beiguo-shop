---
title: 角色设定提示词：九宫格角色卡片图鉴（世纪末动漫赛博风，外星人与仿生人夜店成员）
slug: character-card-catalog-grid
model: gpt-image-2
topics: [character, game-art]
needsRefImage: false
aspectRatio: "1:1"
useCase: 想一次性批量出一组风格统一的原创角色时用，3×3 九张卡片各有名字标签和主题色，适合做卡牌游戏角色池、乐队 / 战队成员介绍或同人企划招募图。
prompt: |
  创建一张方形的[赛博朋克外星夜店]角色图鉴，名叫"[团体名称]"。
  - 布局：干净的 3×3 网格，九张卡片，带细细的镀铬边框；
  - 每张卡片画一个不同的原创[外星人或仿生人]夜店角色，分别是：[角色清单]（例如：玻璃角 DJ、锦鲤鳞调酒师、蛾翼黑客、镀铬艺伎贝斯手、水母快递员、霓虹女祭司、蜥蜴模特、自动售货机占卜师、面具舞者）；
  - 每张卡片底部有一个清晰可读的小名牌，各自有独特的点缀色；
  - 整组统一为精致的[九十年代末动漫赛博朋克]画风：黑色背景、荧光轮廓光、光泽材质、贴纸式的界面小图标，时髦有活力；
  - 不要血腥，不要露骨内容，全部是原创设计；
  - 方形画幅[1:1]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-retro-and-cyberpunk.md
  author: null
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并拆成要点；主题、团体名、角色种类、九个角色清单、画风年代设为变量，原角色清单保留为填写示例
images:
  - 3336-character-card-catalog-grid-1.jpg
imageCredit:
  by: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/retro-cyberpunk/synth-moon-crew-grid.png
  license: MIT
verify:
  - 示例图卡片上混有日文、中文小字，检查是否有错字或无意义字符
  - 换成"古风妖怪茶馆""海底学院"等主题出一次，看九宫格是否仍对齐
  - 页面署名需保留 Copyright (c) 2026 Wuyoscar, MIT License 及许可证链接
---
**怎么填变量**：[赛博朋克外星夜店] 换成整组角色的共同设定，例如"古风妖怪茶馆""深海学院""末日废土车队"；[外星人或仿生人] 换成角色种类，如"妖怪""机器人""动物拟人"；[角色清单] 写九个"特征 + 职业"组合，越具体差异越大，比如"九尾狐掌柜、河童跑堂、雪女说书人"。[九十年代末动漫赛博朋克] 也可以改成"水墨国风""美式复古漫画"。示例图是黑底霓虹的英文版九宫格：顶部大标题"SYNTH MOON CREW"，九张卡片分别是金角 DJ、锦鲤调酒师、蛾翼黑客、贝斯手、水母快递员、粉色女祭司、绿色蜥蜴模特、售货机占卜师和狐面舞者，每张底部有名字和职业小字。

**常见问题与调整**：
- 九个角色长得太像：在清单里给每个角色指定主色和标志物，例如"红色 / 灯笼""青色 / 渔网"。
- 名牌文字乱：名字改成 2～4 个字的短名，或要求"名牌只写编号"。
- 想单独展开某个角色：追问"把第 5 号角色单独画成全身立绘，保持同样画风"。
- 画面太暗：加"背景深紫，卡片内有更亮的环境光"。

**适合**：卡牌 / 手游角色池概念、原创企划成员介绍、社媒角色合集图；不适合模仿已有动漫或游戏角色。

### 英文原版

```
Create a square cyberpunk alien nightclub catalog sheet called "SYNTH MOON CREW". Layout: a clean 3×3 grid of nine cards with thin chrome borders. Each card shows a different original alien or android nightlife character: glass-horn DJ, koi-scale bartender, moth-wing hacker, chrome geisha bassist, jellyfish courier, neon priestess, reptile fashion model, vending-machine oracle, and masked dancer. Each card has a tiny readable name tag and a unique color accent, but the whole grid shares a polished late-90s anime cyberpunk aesthetic, black background, fluorescent rim lights, glossy materials, sticker-like UI glyphs, playful stylish energy, no gore, no explicit content, original designs only.
```

> 改编自 [wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词（仓库整理），许可证 MIT（Copyright (c) 2026 Wuyoscar）。

---
title: 信息图提示词：古人发朋友圈，穿越风手机界面整活图（宋朝示例，可换任意朝代人物）
slug: ancient-dynasty-moments-feed
model: gpt-image-2
topics: [infographic, comic]
needsRefImage: false
aspectRatio: "2:3"
useCase: 做历史科普账号的趣味配图、语文 / 历史课堂导入、节日或美食话题的整活海报时，生成一张"古人发朋友圈"的手机截图：头像是工笔画像、配图是工笔美食、评论区是同时代人物互怼。
prompt: |
  古今穿越幽默风格的界面设计：画面模拟一个手机社交软件的朋友圈页面，但内容完全是[宋朝]场景，标题"[宋朝朋友圈]"。
  - 发帖人：头像是一幅[宋代文人]的工笔肖像，昵称"[某某居士]"；
  - 正文："[刚到黄州，虽被贬但心情尚可。今日亲手做了一道菜，味道绝佳，食谱见下图。]"；
  - 配图：一张[红烧肉]的工笔画特写；
  - 点赞栏："[某某、某某等 126 人觉得赞]"；
  - 评论区：两三位同时代人物的简短调侃，例如"[呵呵]""[还是那个味道]"；
  - 点赞等图标替换成古风纹样；
  - 状态栏显示"[大宋移动 5G]"和"[元丰三年]"；
  - 配色：手机深色模式，搭配雅致的宋代色调；
  - 所有文字为简体中文，清晰无错字。
  整体是历史与社交媒体碰撞的趣味作品，画幅[2:3]。
negativePrompt: null
source:
  repo: wuyoscar/GPT-Image2-Skill
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/skills/gpt-image/references/gallery-infographics-and-field-guides.md
  author: "@Panda20230902"
  license: MIT
  licenseUrl: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/LICENSE
  changes: 译成中文并按发帖人 / 正文 / 配图 / 评论区拆成要点；原文中的具体历史人物名、菜名、朝代、状态栏文字全部设为变量；补充了"简体中文无错字"的约束
images:
  - 3216-ancient-dynasty-moments-feed-1.jpg
imageCredit:
  by: "@Panda20230902"
  url: https://github.com/wuyoscar/GPT-Image2-Skill/blob/main/docs/infographics-field-guides/song-dynasty-feed.png
  license: MIT
verify:
  - 原始出处：原帖：https://x.com/Panda20230902，核对原帖仍可访问、作者未另行声明保留权利
  - 示例图出现宋代历史人物姓名和戏说评论，确认作为历史趣味内容展示无不妥
  - 换成"唐朝""三国"各出一次，看中文正文和评论是否错字
---
**怎么填变量**：[宋朝] 可以换成"唐朝""三国""明朝"，状态栏跟着改成"[大唐移动]""[贞观十年]"；发帖人写清身份和事件，比如"一位唐代诗人刚被贬到江州"；[红烧肉] 换成和人物相关的东西，如"荔枝""一壶酒""赤壁的江景"。评论区的调侃写短句效果最好。示例图是原作者的出图：深色手机界面标题"宋朝朋友圈"，状态栏是"大宋移动 5G"和"元丰三年"，发帖人是一位戴黑帽的文人画像，配图是盘中扎着草绳的方块东坡肉工笔画，下面显示 126 人点赞，两条评论分别是"呵呵"和"还是那个味道"。

**常见问题与调整**：
- 中文正文出错字：把正文缩短到两三句，每句不超过 15 个字。
- 界面不像手机截图：加"顶部有状态栏和返回箭头，底部有输入框'说点什么'"。
- 想做成多条动态：改成"同一页面上下两条动态，第二条是另一位人物发的诗"。
- 评论太正经：给出具体调侃方向，如"评论互相拆台、斗嘴，但不涉及人身攻击"。

**适合**：历史科普账号配图、课堂导入趣味素材、文旅美食话题整活图；不适合当作严肃史料，内容属于戏说。

### 英文原版

```
"Song Dynasty People's Moments"/"SONG DYNASTY SOCIAL MEDIA FEED", Ancient and modern time-travel humor fusion interface design style, The image simulates a mobile phone social media interface, but the content is entirely Song Dynasty scenes, The avatar is a portrait of a Song Dynasty literati, Username "Su Dongpo SuShi_Official", Post content "Just arrived in Huangzhou, demoted but feeling okay. Made Dongpo pork myself today, tastes amazing, recipe attached:", The attached image is a close-up of Dongpo pork in Gongbi painting style, Likes list "Huang Tingjian, Qin Guan, Fo Yin etc. 126 people", Comments section "Wang Anshi: Hehe" "Sima Guang: Still the same taste", Interface elements such as the like icon are replaced with Song Dynasty patterns, The status bar shows "Great Song Mobile 5G" and "Third Year of Yuanfeng", The color scheme is mobile phone dark mode paired with elegant Song Dynasty tones, A masterpiece of fun collision between history and social media
```

> 改编自 [@Panda20230902](https://x.com/Panda20230902) 发布、[wuyoscar/GPT-Image2-Skill](https://github.com/wuyoscar/GPT-Image2-Skill) 收录的提示词，仓库许可证 MIT（Copyright (c) 2026 Wuyoscar）。

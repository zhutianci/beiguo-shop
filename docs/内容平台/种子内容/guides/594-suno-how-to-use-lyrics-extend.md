---
title: Suno怎么用：简单模式与自定义模式、自己写歌词、延长歌曲和免费额度
slug: suno-how-to-use-lyrics-extend
products: [ai-tools]
models: []
accountTier: FREE
excerpt: Suno怎么用？本文按 Suno 官方帮助中心讲清 Simple 和 Custom 两种创作模式、怎么用自己的歌词、风格描述怎么写、怎么排除不想要的元素、用 Extend 延长歌曲，以及 v6 各模型的区别、免费额度和下载规则。
checkedOn: 2026-10-11
sources:
  - https://help.suno.com/en/articles/2462273
  - https://help.suno.com/en/articles/2415873
  - https://help.suno.com/en/articles/2409601
  - https://help.suno.com/en/articles/3161921
  - https://help.suno.com/en/articles/13924737
  - https://help.suno.com/en/articles/13924929
  - https://help.suno.com/en/articles/2410049
  - https://help.suno.com/en/articles/3198209
  - https://help.suno.com/en/articles/13876865
---

## 适用于谁

- 搜「suno怎么用」「suno 提示词」「suno 歌词」「suno 延长」「suno 免费额度」的人；
- 第一次用 AI 写歌，或者生成出来的歌和想象差得远、不知道该调哪里的人。

本文根据 Suno 官方帮助中心（英文）整理，资料核对于 2026-10-11。Suno 的界面是英文的，文中按钮名保留英文原文。做出来的歌能不能商用是另一个问题，见《Suno 版权与商用规则》。

## 结论先说

1. **入口是 suno.com/create**，有两种模式：Simple（写一句描述就出歌）和 Custom（自己填歌词、风格等细节）。
2. **想用自己的歌词，选 Custom 模式**。官方说明，不管用哪个版本，你输入的原创歌词所有权都归你。
3. **风格描述写「流派 + 乐器 + 人声 + 情绪」**，不要写歌手的名字。官方说明提示词里出现知名艺人的名字时，歌曲可能无法生成。
4. **不想要的东西填在 Exclude 里**，在 Custom 模式的 Advanced Options 下。
5. **歌不够长或想换结尾，用 Extend**。官方称目前单次最长可以生成 8 分钟。
6. **免费版每天 50 积分**，官方说够做 10 首歌；免费版做的歌只能个人、非商业使用。

## 模型怎么选

官方「Current Models」一文列出的三个模型：

| 模型 | 官方定位 | 谁能用 |
| --- | --- | --- |
| v6 | 最先进的模型，表现力强、风格覆盖广，控制更精确 | Pro、Premier 订阅用户 |
| v6-wild | 为实验而生，会把你的想法带向更难预料的方向 | Pro、Premier 订阅用户 |
| v6-mini | 更快更省，把新一代的生成体验带给免费版 | 所有用户 |

官方的建议是：想让想法被准确呈现时从 v6 开始；想要意外和新鲜感时试 v6-wild。

## 步骤

### 1. 用 Simple 模式做第一首歌

1. 打开 suno.com/create，选择 **Simple**；
2. 用一句话描述你想听到的歌。官方举的例子是「一首关于整晚尽情玩乐的合成器流行歌」；也可以写得更细，把流派混搭、乐器、歌曲结构都写上；
3. 没有灵感就点骰子图标，随机一条提示词；
4. 点 Create。

Simple 模式下歌词由 Suno 自动生成，适合先感受一下效果。

### 2. 用 Custom 模式写自己的歌

1. 在 suno.com/create 页面顶部选择 **Custom**（也可以点左侧工具栏的 Create 图标进入）；
2. 界面会多出几个输入框，其中有一个专门填歌词；
3. 分别填写歌词和风格描述，点 Create。

**风格描述怎么写**。官方的说法是，歌曲是根据描述生成的，描述里可以包含流派、具体乐器、人声风格等。一个实用的组织方式：

```
流派（可混搭）+ 主要乐器 + 人声类型 + 情绪 / 氛围 + 速度
```

例如：`国风流行，古筝与钢琴，温柔女声，怀旧而明亮，中速`。

写的时候注意：

- **不要写歌手、乐队的名字**。官方的审核说明里，「知名艺人或人物的名字」和「受版权或商标保护的词」排在可能导致歌曲无法生成的清单最前面。想要某种感觉，就把它拆成流派、年代、乐器和唱法来描述；
- 描述越具体，结果越可控；只写「好听的歌」基本等于没写；
- 官方帮助中心有一篇音乐术语表（Music Glossary），卡在不知道怎么形容时可以去查。

**歌词怎么写**。歌词按段落分行书写，主歌、副歌分开。在歌词里用方括号标注段落（例如 `[Verse]`、`[Chorus]`）是用户中很常见的写法，但本文核对的官方帮助文章没有给出一份完整的标签清单，效果以实际生成为准。

### 3. 排除不想要的元素

生成的歌里总有某种乐器或唱法是你不想要的，用 **Exclude**：

1. 照常在 Custom 模式里填写；
2. 点 **Advanced Options**，展开的菜单第一项就是 Exclude；
3. 填入不想出现的内容（乐器等）；
4. 填完其他项，点 Create。

官方的小提示：对用了 Exclude 的歌点赞或点踩，有助于之后得到更好的结果。

### 4. 延长歌曲或换结尾

官方「How do I make my song longer?」一文的步骤：

1. 找到要改的歌；
2. 点歌名右侧的三个点（...），找到 **Remix/Edit**；
3. 往下选择 **Extend**；
4. 在 Extend 窗口里拖动白色箭头，选择保留原曲的哪一部分、从哪里开始续写。可以边播放边确定位置；
5. 填入新的歌词或风格细节，点 Create；
6. 找到满意的续写版本后，点三个点，把鼠标移到 Create 上，选 **Get Whole Song**，新结尾会和原曲拼接成一首完整的歌。

关于长度，官方的说法是：v6、v6-wild、v6-mini 单次生成最长都可以到 8 分钟，还想更长就用 Extend 接着写。

### 5. 其他编辑功能

官方帮助中心各有专文介绍，这里只列用途：

| 功能 | 用途 |
| --- | --- |
| Crop | 裁掉开头或结尾多余的部分 |
| Replace Section | 替换歌曲中的某一段 |
| Cover | 保留旋律、换一种风格重新演绎。官方注明这是 Beta 功能，仅 Pro 和 Premier 可用，且只能用于你自己创建的歌 |
| Personas / Voices | 保留某种声音特征，用到其他歌里 |
| Remaster | 重新处理已有歌曲的音质 |

### 6. 下载

在 Library 或 Workspace 里找到歌曲，点 More Actions（...）→ Download，选择格式。官方说明：

- MP3 所有方案都可以下载；WAV 仅 Pro 和 Premier 订阅用户可用，且要在 suno.com 网页上操作（手机端默认下载 MP3）；
- 下载现在有次数：Pro 每月 20 个下载额度，Premier 每月 60 个；2026 年 9 月 3 日之前注册的免费用户最多有 7 次试用下载，之后注册的免费用户偶尔会获得试用下载，也可以另外购买。官方特别注明**试用下载不享有商业使用权**。

## 积分与方案

官方「What type of plan do I have?」一文的数字（2026-10-11 核对，以官网为准）：

| 方案 | 积分 |
| --- | --- |
| Free | 每天 50 积分，每日补充，官方称够做 10 首歌 |
| Pro | 每月 2500 积分 |
| Premier | 每月 10,000 积分 |

Pro 和 Premier 可以另外购买积分；官方还说明，付费用户用完当月积分后，每天仍可获得最多 50 积分。方案对比在 suno.com/account 页面。

## 常见问题

**Q：歌曲生成不出来，提示有问题？**
官方的审核说明：提示词或歌词里包含知名艺人或人物的名字、受版权或商标保护的词、贬损或诽谤性的词、过多脏话时，歌曲可能无法生成。改掉对应内容再试。

**Q：我做的歌别人能看到吗？**
官方说明，目前生成的歌默认是 Link Only（只有拿到链接的人能听），你可以随时切换为 Published。公开后会出现在你的个人主页，也可能被收进 Suno 首页的歌单。

**Q：能指定男声还是女声吗？**
可以在风格描述里写明人声类型。官方帮助中心有一篇专门讲怎么选择歌手性别的文章。

**Q：能用中文歌词吗？**
直接在歌词框里写中文即可。发音和咬字的效果因歌而异，不满意就多生成几次，或者调整断句。

**Q：生成两首都不满意，积分会退吗？**
官方帮助中心没有这样的退还说明。动手前先把风格描述想清楚，比反复生成更省积分。

## 参考资料

- Suno 帮助中心：Make a song in Simple Mode — https://help.suno.com/en/articles/2462273
- Can I use my own lyrics? — https://help.suno.com/en/articles/2415873
- How do I make my song longer? — https://help.suno.com/en/articles/2409601
- How do I exclude elements of a song? — https://help.suno.com/en/articles/3161921
- Current Models: v6 — https://help.suno.com/en/articles/13924737
- How long will my song be? — https://help.suno.com/en/articles/13924929
- What type of plan do I have? — https://help.suno.com/en/articles/2410049
- Does Suno moderate songs? — https://help.suno.com/en/articles/3198209
- How do downloads work? — https://help.suno.com/en/articles/13876865

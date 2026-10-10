---
title: Midjourney 风格参考 --sref 怎么用：图片参考、sref 代码与 --sw 权重
slug: midjourney-style-reference
products: [ai-tools]
models: [midjourney]
accountTier: OTHER
excerpt: 想让一批 Midjourney 图片保持同一种画风？本文按官方文档讲清风格参考（--sref）怎么上传图片、怎么用 sref 代码和 Style Explorer 找风格、--sw 和 --sv 怎么调，以及提示词怎么写才不和参考图打架。
checkedOn: 2026-10-07
sources:
  - https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
  - https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
  - https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
  - https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
  - https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights
---

## 适用于谁

- 搜「Midjourney 风格参考」「sref 怎么用」「sref code」「sw 参数」的人；
- 做系列插画、品牌视觉、社媒配图，需要几十张图保持同一画风的人；
- 看到别人分享「--sref 2708276657」这类代码，不知道怎么用的人。

本文根据 Midjourney 官方文档整理，资料核对于 2026-10-07；网页版为英文界面，以实际为准。

## 结论先说

1. **风格参考只借「感觉」不借内容**：颜色、媒介、质感、光线会被学走，参考图里的人和物不会被复制。要复制内容用图片提示（Image Prompt）或 Edit 模型。
2. **两种来源**：上传一张图（可以多张），或者用一个数字形式的 **sref 代码**（来自 Midjourney 内部风格库）。
3. **强度用 `--sw` 调**：0–1000，默认 100。
4. **提示词只写内容**：写「detailed portrait of a dog」，不要写「照这张图的风格画一只狗」。

![风格参考示例：左边的参考图把画风迁移到了狗的肖像和乡间房屋两张新图上（官方示例）](seed:g318-sref-header.jpg)
*图片来源：[Midjourney 官方文档 · Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)*

## 步骤

### 1. 用图片做风格参考

**网页版**：点 Imagine 栏的图片图标打开图片面板，把图拖到 **Style reference** 格子（可以放多张），然后写提示词。悬停图片点 X 可移除，点锁形图标可固定。

**Discord**：在提示词末尾写 `--sref` 加图片地址，多张用空格分隔。图片必须已经在线（本地图片可以先发到 Discord 生成链接）。还能分别给每张参考图设权重，例如：

```
--sref URL1::2 URL2::1 URL3::1
```

图片格式需为 png、gif、webp、jpg 或 jpeg，并且**必须同时有文字提示词**。

### 2. 用 sref 代码

不想上传图片，也可以直接写代码：

```
a lighthouse on a cliff at dusk --sref 2708276657
```

- `--sref random`：随机挑一个风格代码，提交后「random」会变成具体数字，之后重跑或做变体会保留这个代码；配合 `--repeat`、排列组合或 V8.1 草稿模式时，每张图会拿到不同代码，适合「刷风格」。
- 可以同时写多个代码混合，也可以图片和代码一起用。
- **不能把自己上传的图变成代码**；想要自定义代码，官方提供了 Style Creator 功能。

### 3. 在 Style Explorer 里找风格

打开 **Explore** 页，点右上角 **Styles** 标签：

- 用 Random（随机）/ 热门排序浏览；
- 在搜索框里输入 photographic、anime 等关键词，模糊搜索相关代码；
- 点开某个代码看示例图，**Try Style** 会用这个风格重跑你最近的提示词，**Copy** 会把 `--sref 代码` 加到 Imagine 栏；
- 点 Like 收藏，之后在 Likes 标签里找到（收藏不影响你的个性化档案）。

![Explore 页的 Styles 标签：每组示例图下方显示 sref 代码，悬停有 Try Style 按钮（英文界面）](seed:g318-style-explorer.jpg)
*图片来源：[Midjourney 官方文档 · Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)*

### 4. 用 `--sw` 调强度

`--sw` 取值 0–1000，默认 100。数值越高，参考风格越强。官方提到在 V7 里，`--sw` 对风格代码的影响往往比对图片更明显。注意 `--sw` 不兼容情绪板（Moodboards）。

![同一参考风格在 --sw 0、50、100、1000 下的效果：0 几乎不受影响，1000 风格最强](seed:g318-sref-weight.jpg)
*图片来源：[Midjourney 官方文档 · Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)*

### 5. 版本差异：`--sv`

- **V7**：用图片做风格参考时有多个算法版本，用 `--sv` 选择，默认 `--sv 6`；`--sv 4` 是 2025 年 6 月 16 日之前的旧 V7 算法。sref random 和 sref 代码只兼容 `--sv 4` 和 `--sv 6`。
- **V6**：`--sv 1`～`--sv 4`，默认 4。
- 官方提醒：风格参考在 V6 到 V7 之间更新过，**旧代码可能出不来原来的风格**，可以加 `--sv 4` 或切回 V6 试试。
- `--sv` 同样不兼容情绪板。

## 提示词怎么写

官方给的三条：

1. **提示词保持简单**：别加和参考图冲突的风格词；
2. **风格出不来时再选择性补词**：比如参考图是水彩，就在提示词里加 watercolor；
3. **描述内容，不写修改指令**。

```
不推荐：the look of this image but a dog
不推荐：copy this style and make a bunny
推荐：detailed portrait of a dog
推荐：ballpoint pen sketch of a bunny
```

和 Edit 模型一起用时，官方建议在提示词里也描述一下风格，有助于更稳定地「激活」参考的美学。

## 常见问题

**Q：风格参考、图片提示、Edit 模型参考有什么区别？**
风格参考只学画风；图片提示（Image Prompt，`--iw` 调权重）会参考内容、构图和颜色；Edit 模型参考用来保持角色 / 物体本身或按指令改图。三者可以同时用。

**Q：别人分享的 sref 代码在我这里效果不一样？**
可能是版本不同。官方说明旧代码在 V7 及以后可能不再产生相同风格，试试加 `--sv 4` 或指定对方使用的版本。

**Q：可以拿别人的作品当风格参考吗？**
技术上可以上传，但 Midjourney 条款要求你对上传的图片拥有必要的权利，也禁止利用服务侵犯他人知识产权。商用项目请用自己的作品、已授权素材或 sref 代码。

**Q：风格参考能保证每张图完全一样的风格吗？**
不能百分百保证。固定 sref 代码 + 固定 `--sw` + 固定版本 + 相近的提示词结构，能让系列图的一致性高很多。

## 参考资料

- Midjourney 官方文档：Style Reference — https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
- Midjourney 官方文档：Image Prompts — https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts
- Midjourney 官方文档：Edit Model — https://docs.midjourney.com/hc/en-us/articles/48495453462797-Edit-Model
- Midjourney 官方文档：Version — https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version
- Midjourney 官方文档：Multi-Prompts & Weights — https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights

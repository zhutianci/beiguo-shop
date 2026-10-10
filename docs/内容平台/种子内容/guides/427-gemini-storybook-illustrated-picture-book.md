---
title: Gemini 怎么生成绘本：Storybook 故事书的用法、朗读、打印与下载 PDF
slug: gemini-storybook-illustrated-picture-book
products: [gemini]
models: [gemini-llm, nano-banana]
accountTier: FREE
excerpt: Gemini 的 Storybook（故事书）能把一句话或几张照片变成约 10～12 页、带插图和朗读的绘本。本文按官方帮助中心讲三种开始方式、怎么修改和回退版本、翻页与朗读、分享链接、打印和存成 PDF，以及年龄限制和「storybook 要用英文写」这类容易踩的坑。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/gemini/answer/16434396
  - https://support.google.com/gemini/answer/16275805
  - https://support.google.com/gemini/answer/13743730
  - https://support.google.com/gemini/answer/18560919
  - https://gemini.google/overview/storybook/
verify:
  - Storybook 目前以 Gem 的形式出现在侧边栏；Gems 将在 2026 年 11 月起对个人账号停止支持，届时 Storybook 的入口如何变化官方未说明
  - 故事书的每日生成次数官方未单独公布，受账号整体用量额度约束
  - 朗读可选的声音和语言范围以实际界面为准
---

> 本文根据 Google 官方 Gemini 帮助中心整理，核对日期 2026-10-10。文中的提示词示例为本站编写，仅供参考。

## 适用于谁

- 搜「gemini 生成绘本」「gemini 怎么生成绘本」「gemini 故事书」「gemini storybook 教学」「gemini storybook 下载」的人；
- 想给孩子做一本专属睡前故事的家长；
- 想把知识点、旅行照片做成图文小册子的老师和普通用户。

## 结论先说

1. **Storybook 是 Gemini 里生成带插图故事书的功能**，一次生成通常是 **10～12 页**，大约需要 1～2 分钟，还能让 Gemini 朗读。
2. **三种开始方式**：侧边栏 Gems 里的「Storybook」；新对话里用「Create a storybook about…」开头；或上传照片后点「创建故事书」。
3. **免费可用**：帮助中心的功能表里 Storybook 对所有档位都标了可用；需要登录，且**暂不对 18 岁以下用户开放**（由成年人来操作）。
4. **能带走**：可以生成公开分享链接，也可以「打印」，在打印选项里选「另存为 PDF」得到 PDF 文件。
5. **一个小坑**：用文字提示开始时，「storybook」这个词必须用英文写。

## 一、三种开始方式

**方式一：从 Storybook Gem 开始**

1. 打开 gemini.google.com 并登录；
2. 在左侧「Gems」下点「Storybook」；找不到的话点「探索 Gems（Explore Gems）」，在完整列表里找；
3. 在输入框里描述想要的故事；
4. （可选）点「添加文件」上传自己的照片或文件，让 Gemini 用在故事里；
5. 提交。生成好的故事书会在右侧面板打开。

**方式二：在新对话里用提示词开始**

在输入框里以「Create a storybook about」开头，后面接主题。帮助中心特别注明：用文字提示触发时，**「storybook」必须用英文输入**。主题和要求可以接着用中文写，例如：

```
Create a storybook about 一只害怕打雷的小刺猬，在朋友的帮助下学会面对雷雨夜。
适合 4 岁孩子，水彩绘本风格，每页两三句话，结尾温暖。请用简体中文写故事。
```

**方式三：从照片开始**

1. 点输入框的「添加文件」，选择一张或几张照片；
2. 点输入框下方出现的「创建故事书（Create a storybook）」。

适合把孩子的画、家庭旅行照片、宠物照片做成故事。上传照片的注意事项见第五节。

![官方示例：Storybook 生成的一本故事书封面（填色画风格），封面下方是书名](seed:g427-storybook-cover-example.jpg)
*图片来源：[Google 官方 Gemini Storybook 介绍页](https://gemini.google/overview/storybook/)*

## 二、把故事写得更合心意

Storybook 没有复杂的参数，效果主要靠描述。可以在提示里交代这些（本站建议）：

| 要素 | 例子 |
| --- | --- |
| 读者年龄 | 「给 5 岁孩子」「给小学三年级学生」 |
| 主角和性格 | 「一只爱提问的小章鱼」；也可以用孩子的名字当主角 |
| 想传达的道理或知识点 | 「学会分享」「月亮为什么有圆缺」 |
| 画风 | 水彩、蜡笔、剪纸、粘土、像素风 |
| 篇幅和语言 | 「每页不超过三句话」「用简体中文」 |
| 结尾 | 「以一个开放的问题结尾，方便我和孩子讨论」 |

避免直接要求知名动画角色或特定在世画师的风格，这既可能被拒绝，也有版权风险。

## 三、修改和版本

- **改故事**：在左侧输入框里告诉 Gemini 想怎么改（「把主角换成小女孩」「第三页太吓人，改温和一点」「整体缩短到 8 页」），它会生成一个**新版本**的故事书；
- **看旧版本**：顶部的「上一个版本 / 下一个版本」可以在保存过的版本之间切换。

所以不用担心改坏——旧版本还在。

## 四、阅读、朗读、分享、打印

故事书顶部的操作：

| 操作 | 方法 |
| --- | --- |
| 全屏阅读 | 点「全屏（Full screen）」 |
| 翻页 | 点「下一页 / 上一页」，或直接点书页的右下角 / 左下角 |
| 跳到开头或结尾 | 点页码，选「跳到开头」或「跳到结尾」 |
| 朗读 | 点「收听（Listen）」；旁边的菜单可以换朗读的声音 |
| 分享 | 「分享 → 分享」，复制 g.co/gemini/share 链接 |
| 打印 / 存 PDF | 「分享 → 打印（Print）」，按屏幕提示操作；在打印选项里选「另存为 PDF」就能得到 PDF 文件 |

打印时如果浏览器拦截了弹出窗口，需要允许 gemini.google.com 弹出窗口后再试。

分享链接是公开链接，任何拿到链接的人都能看，规则见本站《Gemini 分享对话怎么操作》。

## 五、限制和注意事项

- **年龄**：功能暂不对 18 岁以下用户开放；
- **登录**：必须登录 Gemini；
- **额度**：生成故事书会消耗账号的用量额度（包含多张插图），见本站《Gemini 怎么看额度》；
- **上传照片**：开启「保留活动记录」时，上传的照片属于活动记录的一部分，可能用于改进服务；分享故事书之前，确认里面没有不想公开的人物照片。给别人家的孩子做故事书，先征得家长同意；
- **AI 标识**：Gemini 生成的图片带有不可见的 SynthID 水印，说明见本站《Gemini 生成的图片有水印吗：可见水印、SynthID 与发布时的合规要求》；
- **内容问题**：故事书封面页底部有「举报内容（Report content）」，可以举报不当内容；
- **Gems 即将调整**：Storybook 目前挂在 Gems 下面，而 Gems 正在被技能取代（个人账号 2026 年 11 月起）。官方的迁移说明没有提到 Storybook 的去向，它的入口之后可能变化，以帮助中心为准；入口变了的话，可以先试方式二的提示词。

## 常见问题

**Q：Storybook 无法使用、找不到入口？**
对照检查：是否已登录；账号是否年满 18 岁；侧边栏 Gems 里没有的话点「探索 Gems」；或者换用方式二，在新对话里用英文「Create a storybook about」开头。

**Q：能生成中文故事吗？**
帮助中心只要求触发词「storybook」用英文，没有限制故事的语言。在提示里写明「用简体中文写」即可；插图里的文字可能不如正文准确，生成后翻一遍检查。

**Q：页数能指定吗？**
官方说通常是 10～12 页。可以在修改时提要求（如「缩短到 8 页」），是否严格遵守没有保证。

**Q：可以拿去出版或售卖吗？**
帮助中心这一页没有就商用作出说明。涉及商用请以 Google 服务条款和生成式 AI 使用政策为准，并参考本站《AI生成图片有版权吗、能商用吗：各平台条款与中美官方观点》。

## 参考资料

- Create an illustrated storybook in Gemini Apps（Gemini 帮助中心）：https://support.google.com/gemini/answer/16434396
- Gemini Apps limits & upgrades for Google AI subscribers（功能对比表）：https://support.google.com/gemini/answer/16275805
- Share your chats from Gemini Apps：https://support.google.com/gemini/answer/13743730
- About the transition from Gems to skills：https://support.google.com/gemini/answer/18560919
- 截图来源：https://gemini.google/overview/storybook/

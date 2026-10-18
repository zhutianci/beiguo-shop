---
title: Claude 怎么设置成中文：界面语言、回答语言和语音语言分别怎么设
slug: claude-set-chinese-language
products: [claude]
models: []
accountTier: FREE
excerpt: Claude 怎么设置中文？官方帮助中心列出的 11 种界面语言里目前没有中文，但 Claude 会用你提问的语言回答，直接用中文问即可；想固定用中文，可在设置的 Instructions for Claude 里写一句。语音模式的语言要单独选。
checkedOn: 2026-10-19
sources:
  - https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
  - https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
  - https://support.claude.com/en/articles/8114491-get-started-with-claude
verify:
  - 官方语言文章（更新日期 2026-08-06）列的 11 种界面语言不含中文；产品会更新，以你账号里「Language」列表实际显示的为准
  - 官方语言文章只写了网页版和桌面版的切换步骤，没有写 iOS / Android App 的界面语言怎么改，本文不写手机端的具体点击路径
  - 「在 Instructions for Claude 里写一句让它用中文回答」是按官方对该设置用途的描述（写下通用的沟通要求）给出的做法，官方文章没有专门举这个例子
---

> 本文根据 Claude 帮助中心《How to use Claude in your preferred language》《Understanding Claude's personalization features》《Get started with Claude》整理，资料核对于 2026-10-19。图为本站根据官方文章整理的示意图，不是软件截图。

## 适用于谁

- 打开 Claude 想找「中文」选项，翻遍设置也没找到的人；
- 英文界面看着吃力，想知道能不能换成中文的人；
- 想让 Claude 每次都用中文回答，又不想每次都在开头写「请用中文」的人；
- 用语音模式聊天，发现它听不懂或说的不是中文的人。

## 结论先说

1. **界面语言**：官方帮助中心写明，Claude 的网页版和桌面版提供多种界面语言，目前列出 11 种：English、French、German、Hindi、Indonesian、Italian、Japanese、Korean、Portuguese（Brazilian）、Spanish（Latin America）、Spanish（Spain）。**名单里没有中文**，所以目前没有官方的「把菜单和按钮改成中文」的开关。以你账号里「Language」列表实际显示的为准。
2. **回答语言**：这和界面语言是两回事。官方说，即使你改了语言设置，仍可以用任何语言和 Claude 聊天，**Claude 会用你使用的语言和你对话**。所以直接用中文提问，它就用中文回答。
3. **想固定用中文**：在 **Settings** 里的 **Instructions for Claude** 写一句通用要求，例如「请始终用简体中文回答」，会应用到你所有的对话。
4. **语音模式**：有自己的语言设置，和界面语言分开，在 **Settings → General → Voice → Language** 里选。

![Claude 网页版和桌面版换界面语言的官方步骤，以及官方列出的语言](seed:g930-claude-language-steps.png)
*图：本站根据 [Claude 帮助中心：How to use Claude in your preferred language](https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language) 整理的示意图*

## 一、界面语言：官方怎么说

官方文章说，Claude 在网页和桌面应用上有多种语言可选。切换步骤只有四步，下面按官方原文的顺序写：

1. 点击**左下角的头像（个人资料图标）**；
2. 进入 **Language**（语言）部分；
3. 选你想要的语言；
4. **界面会自动更新**，不用手动刷新。

官方列出的语言一共 11 种，就是上面「结论先说」里那一串。**中文（简体或繁体）不在其中。** 这意味着：

- 想把菜单、按钮、设置项变成中文，目前官方没有提供这个选项；
- 市面上有的文章说「在语言里选 Chinese」，你在列表里找不到就是找不到，不是你没找对，也不要去装来历不明的插件或「汉化版」，账号安全比界面语言重要；
- 官方文章只写了**网页版和桌面版**，没有写 iOS、Android App 的界面语言怎么改，所以本文也不写手机端的点击路径；

如果你已经习惯了中文界面的 ChatGPT 或 Gemini，可以对照看本站的 [/guides/gemini-language-settings-chinese](/guides/gemini-language-settings-chinese)：Gemini 的做法是跟随浏览器或设备语言，和 Claude 不一样。

## 二、回答语言：用中文问，它就用中文答

官方「Get started with Claude」里说，Claude 在英语上训练得最充分，在许多其他常见语言上表现也不错，对不太常见的语言也有一定能力。语言文章里的那条提示更直接：

> 即使改了语言设置，你仍然可以用任何语言和 Claude 聊天，Claude 会用你使用的语言回应。

所以最简单的办法就是：**不用设置，直接用中文写第一句话。** 比如：

```
请帮我把下面这段英文邮件翻译成自然的中文，保持礼貌但简洁：
[粘贴邮件]
```

几点注意：

- 如果你**贴了一大段英文**再用英文提问，它自然会用英文回答；想要中文，在问题里明说「请用中文回答」；
- 想让它**翻译或写作成别的语言**，明确写出目标语言，比如「把下面这段话译成英文」；
- 回答是中文，不代表代码、命令、专有名词也会变成中文，这些保持原样是正常的。

## 三、想每次都用中文：写进 Instructions for Claude

如果你不想每次都在开头写一句要求，可以用官方的「个人说明」功能。官方在「Understanding Claude's personalization features」里写的步骤是：

1. 点击左下角的**头像或姓名首字母**；
2. 选 **Settings**；
3. 在 **Instructions for Claude** 里写下你的说明。

官方说，这里可以写你偏好的做事方式、常用术语、典型场景和**通用的沟通要求**，写在这里的内容会应用到你和 Claude 的所有对话。把语言偏好写进去，例如：

```
请始终用简体中文回答；代码、命令和专有名词保留英文原文；
如果我用英文提问，也请用中文回答，并在需要时附上英文术语。
```

另外两个更小范围的办法：

- **只想在某个项目里用中文**：在项目的说明里写这一句，只对该项目里的对话生效，见 [/guides/claude-projects-guide](/guides/claude-projects-guide)；
- **想控制回答风格**：官方还提供 Skills，可以调整回答的语气和格式，见 [/guides/claude-skills](/guides/claude-skills)。

写完后可以开一个新对话，用一句英文提问试一下，看它是否按你的要求用中文回答；如果你装了 Claude 的记忆功能，也可以参考 [/guides/claude-memory](/guides/claude-memory)。

![想让 Claude 说中文的几种情况：界面、回答、固定偏好、语音](seed:g930-claude-chinese-decide.png)
*图：本站根据 [Claude 帮助中心：How to use Claude in your preferred language](https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language) 与 [Understanding Claude's personalization features](https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features) 整理的示意图*

## 四、语音模式的语言：单独设置

官方说，语音模式有**独立于显示语言的语言设置**。要改 Claude 说话和听写所用的语言：

1. 打开 **Settings → General**；
2. 找到 **Voice → Language**；
3. 选一种语言。

所以会出现这种情况：界面是英文，语音里却可以用你选的语言聊天；反过来，界面语言改了，语音语言不会跟着变。语音模式本身怎么用，见 [/guides/claude-voice-mode](/guides/claude-voice-mode)。

## 常见问题

**Q：为什么我在语言列表里看不到中文？**
因为官方文章列出的 11 种界面语言里没有中文。官方没有说以后会不会加，以你账号里实际看到的为准。

**Q：界面是英文，会不会影响回答质量？**
官方没有这样说。界面语言只管菜单和按钮，回答用什么语言取决于你怎么提问；回答质量主要和你选的模型有关，见 [/guides/claude-models-compare](/guides/claude-models-compare)。

**Q：我写了「用中文回答」，它偶尔还是回英文？**
可以在对话里再说一遍，或者把要求写得更具体（比如「用简体中文回答，术语后括号附英文」）。如果是长对话，早期的要求可能被后面的内容稀释，开一个新对话最干净。

**Q：我所在的地区能用 Claude 吗？**
Claude 只在官方列出的国家和地区提供，名单见 [Anthropic 的 Supported Regions Policy](https://www.anthropic.com/supported-countries)；名单里没有的地区，官方说不支持。详细说明见 [/guides/claude-cant-login-or-use](/guides/claude-cant-login-or-use)。

**Q：免费版和付费版在语言上有区别吗？**
官方没有说有区别。套餐的区别见 [/guides/claude-plans-free-pro-max](/guides/claude-plans-free-pro-max)；如果你要升级 Claude Pro，可以看本站的 [/chongzhi/claude-pro](/chongzhi/claude-pro)。

## 参考资料

- Claude 帮助中心：How to use Claude in your preferred language — https://support.claude.com/en/articles/10769299-how-to-use-claude-in-your-preferred-language
- Claude 帮助中心：Understanding Claude's personalization features — https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
- Claude 帮助中心：Get started with Claude — https://support.claude.com/en/articles/8114491-get-started-with-claude
- Anthropic：Supported Regions Policy — https://www.anthropic.com/supported-countries

---
title: ChatGPT 深色模式怎么开：夜间模式、主题颜色、对比度与字体大小在哪设置
slug: chatgpt-dark-mode-appearance
products: [chatgpt]
models: []
accountTier: FREE
excerpt: 想把 ChatGPT 换成深色（夜间）模式、改掉蓝色的消息气泡，或者把字调大？本文按官方帮助中心讲清网页、Windows、iPhone、安卓各自的入口，外观、对比度、强调色、文字大小四个设置分别管什么、哪些会跨设备同步，以及「为什么突然变蓝了」等常见问题。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt
verify:
  - 中文界面里「外观 / 对比度 / 强调色 / 文字大小」的具体译名以实际界面为准
  - macOS 应用的外观设置入口，官方文章没有单独写步骤
---

> 本文根据 OpenAI 帮助中心《Updating your visual experience on ChatGPT》整理，资料核对于 2026-10-13；截图引用自 OpenAI 帮助中心，为英文界面。

## 适用于谁

- 晚上用 ChatGPT 觉得白底刺眼，想开深色 / 夜间模式的人；
- 某天打开发现消息气泡变成蓝色，想换回去或换个颜色的人；
- 觉得字太小、界面元素看不清的人。

## 结论先说

ChatGPT 的「长相」由四个互相独立的设置决定，都在 **Settings（设置）** 里：

| 设置 | 管什么 | 可选项 |
| --- | --- | --- |
| **Appearance（外观）** | 浅色还是深色 | System（跟随系统）、Light（浅色）、Dark（深色） |
| **Contrast（对比度）** | 文字和界面元素的区分度 | System、Medium（中等）、Increased（增强） |
| **Accent color（强调色）** | 消息气泡、按钮、高亮文字等的颜色 | Blue、Green、Yellow、Pink、Orange、Purple，以及一个中性色（Black 或 White） |
| **Text size（文字大小）** | 整个应用的缩放 | 只有 Windows 应用里有 |

- **深色模式** = 把 **Appearance** 选成 **Dark**。网页和 Windows 应用在 **头像 → Settings → General（通用）**；手机 App 在设置里的 **Appearance**（iOS 在 **Theme** 分组下）。
- 外观**不会跨设备同步**：网页改成深色，手机 App 不会跟着变，要各设一次。
- 官方提醒：能看到哪些设置和颜色，会因平台、App 版本、账号、套餐和灰度发布而不同。

## 步骤

### 1. 网页版 / Windows 应用：开深色模式

1. 点你的头像；
2. 选 **Settings（设置）**；
3. 选 **General（通用）**；
4. 在 **Appearance（外观）** 下选 **System**、**Light** 或 **Dark**。

![ChatGPT 设置的 General 页面：Appearance、Contrast、Accent color、Language 等选项，Accent color 下拉展开（英文界面）](seed:g805-settings-accent.png)
*图片来源：[OpenAI 帮助中心：Updating your visual experience on ChatGPT](https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt)*

三个选项的含义：

- **System**：跟随你设备当前的浅色 / 深色设置。电脑设了「日落后自动变暗」的话，ChatGPT 会跟着切换；
- **Light**：浅色背景、深色文字；
- **Dark**：深色背景、浅色文字。

### 2. iPhone / 安卓：开深色模式

1. 在 ChatGPT App 里打开你的个人资料菜单；
2. 打开 **Settings（设置）**；
3. 选 **Appearance（外观）**。iOS 上它在 **Theme（主题）** 分组里；部分安卓版本要先进 **General（通用）**；
4. 选 **System**、**Light** 或 **Dark**。安卓上跟随系统的选项可能显示为 **System (Default)**。

![ChatGPT iOS 设置页：Theme 分组下有 Appearance 和 Accent color，强调色列表展开（英文界面）](seed:g805-ios-theme.png)
*图片来源：[OpenAI 帮助中心：Updating your visual experience on ChatGPT](https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt)*

### 3. 换强调色（消息气泡和按钮的颜色）

强调色会改变消息气泡、按钮、高亮文字等界面元素的颜色；有些部分为了可读性会保留自己的颜色。

- **网页 / Windows**：头像 → **Settings → General → Accent color**，选一个颜色；
- **iOS / 安卓**：个人资料菜单 → **Settings → Accent color**（iOS 在 **Theme** 下），选一个颜色。

官方列出的颜色可能包括 Blue（蓝）、Green（绿）、Yellow（黄）、Pink（粉）、Orange（橙）、Purple（紫），以及一个中性色：**浅色模式下叫 Black，深色模式下叫 White**，是同一个选项。有的账号还会看到 **Default**，有的账号则没有中性色。

强调色**保存在账号里**，登录同一账号的其他设备会跟着变（各端可选的颜色和实际效果可能略有差异）。

### 4. 调对比度（仅网页和 Windows 应用）

1. 头像 → **Settings → General**；
2. 在 **Contrast（对比度）** 下选：
   - **System**：跟随设备的无障碍对比度偏好，系统要求高对比度时用增强，否则用中等；
   - **Medium**：始终保持标准对比度；
   - **Increased**：提高受支持界面元素的对比度。

![Contrast 下拉菜单：System、Medium、Increased，当前选中 Increased（英文界面，深色外观）](seed:g805-contrast-menu.jpg)
*图片来源：[OpenAI 帮助中心：Updating your visual experience on ChatGPT](https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt)*

对比度和外观是两回事：改对比度不会开关深色模式。官方说明，目前增强对比度最明显的变化出现在**浅色外观**下，深色模式里效果有限。

### 5. 把字调大

- **Windows 应用**：头像 → **Settings → General → Text size（文字大小）**，点减号或加号缩小 / 放大，点 **Reset** 恢复默认。它缩放的是整个应用，包括文字和其他界面元素；
- **网页版**：用浏览器自带的缩放；
- **iOS / 安卓**：到手机系统的显示与文字大小设置里调。

### 四个设置一览

![ChatGPT 四个视觉设置在哪些平台有、会不会跨设备同步的对照表](seed:g805-visual-settings-compare.png)
*图：本站根据 [OpenAI 帮助中心：Updating your visual experience on ChatGPT](https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt) 整理的示意图*

## 常见问题

**Q：为什么我的强调色突然变成蓝色了？**
官方说明蓝色可能是 ChatGPT 的默认强调色。如果你的账号有中性色选项，浅色模式下选 **Black**、深色模式下选 **White**，就是单色风格。

**Q：选了 Default 为什么还是蓝的？**
在某些版本里，Default 用的就是蓝色。有 Black / White 的话改选它。

**Q：能把以前的灰色消息气泡换回来吗？**
不一定。官方说明选 Black / White 只是选了单色强调色，不保证恢复以前的灰色气泡样式；浅色外观下选 Black，气泡可能是黑底白字。菜单里也没有 Gray、None 或 Classic 这几个选项。

**Q：选了 Black / White，为什么有些按钮还是蓝色？**
一些可交互的元素会使用对比色，保证看得见、读得清。

**Q：能只改消息气泡的颜色、不动别的吗？能选红色或自定义颜色吗？**
都不能。强调色同时作用于包括气泡在内的多处界面，没有单独的气泡颜色设置；颜色只能从列表里选。

**Q：我这里没有文章里说的某个设置或颜色？**
先更新 App，确认登录的是你想用的账号，并在你正在用的平台上查看。官方说明 Contrast 菜单在 iOS、安卓和 macOS 应用里可能没有。

**Q：改了外观，ChatGPT 的回答会变吗？**
不会，这些都只是界面显示。想调整回答的语气和格式，看 [/guides/chatgpt-custom-instructions](/guides/chatgpt-custom-instructions)；想把界面文字改成中文，看 [/guides/chatgpt-language-settings](/guides/chatgpt-language-settings)。手机 App 的其他常用设置见 [/guides/chatgpt-mobile-app-tips](/guides/chatgpt-mobile-app-tips)。

## 参考资料

- OpenAI 帮助中心：Updating your visual experience on ChatGPT — https://help.openai.com/en/articles/11958281-updating-your-visual-experience-on-chatgpt

---
title: ChatGPT 宠物（Pets）是什么、怎么关闭和自定义：桌面版、网页版、命令行的官方说明
slug: chatgpt-pets-turn-off-customize
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的宠物是可选的动画伙伴，帮你跟踪任务进展，只改外观不影响完成任务的方式。官方文档写了桌面版、网页版、命令行各自的选择和隐藏办法，以及怎么创建自定义宠物。本文按官方文档整理。
checkedOn: 2026-10-28
sources:
  - https://learn.chatgpt.com/docs/pets
  - https://developers.openai.com/docs/pets
verify:
  - 官方文档只说「账号和工作区允许时可用」，没有列出具体套餐；网页版选项仅在账号和工作区允许时出现
  - 官方帮助中心没有 Pets 专门文章，本文的依据是官方文档站（learn.chatgpt.com 与 developers.openai.com）的 Pets 页面
  - 文档中的快捷键、命令、文件规格（1536 × 1872 像素、20 MiB 以内、透明 PNG 或 WebP）是当天的写法，之后可能调整
  - 桌面版自定义宠物存在本机，官方说不会自动同步到网页版
---

> 本文根据 OpenAI 官方文档站的《Pets in ChatGPT and Codex》整理（learn.chatgpt.com 与 developers.openai.com 的 Pets 页面），资料核对于 2026-10-28。官方帮助中心没有 Pets 的专门文章，功能和命令可能调整，请以官方文档和你账号里实际显示的为准。配图为本站整理的示意图，不是界面截图。

## 适用于谁

- 看到 ChatGPT 桌面版出现一只悬浮的小动画，不知道是什么、怎么关的人；
- 想自己做一个宠物的人；
- 在网页或命令行里找不到宠物选项的人。

## 结论先说

1. **宠物是什么**：官方说是**可选的动画伙伴**，帮你跟踪任务进展。它出现在哪里、显示什么，取决于你用的界面。**选宠物只改变外观，不影响 ChatGPT 完成任务的方式。**
2. **桌面版（macOS、Windows）**：头像菜单选 **Pets**，或 **设置 → Pets**；隐藏用：右键宠物选 **Hide**，或命令菜单、设置里的 **Hide pet**，或再输一次 **/pet**。
3. **网页版**：**设置 → Personalization → Pet → Select pet**，选 **Default** 就是不用宠物。网页版的宠物只出现在支持的 Work 对话里，没有悬浮层。
4. **命令行（Codex CLI）**：输入 **/pets** 或 **/pet** 打开选择器，输入 **/pets off** 关闭终端宠物。
5. **Codex IDE 扩展**没有宠物选择器和悬浮层。
6. **找不到宠物选项**：官方说要看你的账号和工作区是否允许；桌面版先更新应用。

![ChatGPT 宠物：在哪、怎么关](seed:g1222-pet-decide.png)
*图：本站根据 [OpenAI 官方 Pets 文档](https://learn.chatgpt.com/docs/pets) 整理的示意图*

## 一、宠物出现在哪里

官方文档：

- **桌面版（macOS 和 Windows）**：悬浮的宠物可以停在其他应用窗口上方，带有输入或语音的聊天控件，以及一个活动托盘；
- **网页版**：宠物出现在支持的 ChatGPT Work 对话里，没有悬浮层、活动托盘或 /pet 命令；
- **Codex CLI（终端）**：终端里的宠物报告当前 CLI 会话的活动；
- **Codex IDE 扩展**：没有宠物选择器和悬浮层。

## 二、怎么选、怎么关

### 桌面版

- **选择**：打开头像菜单选 **Pets**（或 **设置 → Pets**），选内置宠物、自定义宠物，或选 **Mini**（只显示聊天控件，不显示宠物）；没有自定义宠物时先点 **Create pet**；
- **显示与隐藏**：输入 **/pet**，或用命令菜单的 **Show pet**；隐藏：右键宠物选 **Hide**、用命令菜单或 **设置 → Pets** 里的 **Hide pet**、或再输一次 **/pet**。选择和位置会被记住；
- **快捷键**：macOS 是 **Option+Space**，Windows 是 **Windows+Alt+P**，可以在 **设置 → Keyboard shortcuts** 里改；
- **大小**：**设置 → Pets → Customize**，调 **Pet size**，**Reset** 恢复默认。

### 网页版

**设置 → Personalization → Pet → Select pet**，选内置宠物，或选 **Default** 表示不用宠物。

### 命令行

**/pets** 或 **/pet** 打开选择器，**/pets 名字** 直接选，**/pets off** 关闭。终端宠物需要 iTerm2 3.6 或更高，或支持 Kitty 图形或 Sixel 的终端，在 tmux 或 Zellij 里不能用。

## 三、桌面版的宠物能做什么

- **移动**：拖动，或用方向键移动，Esc 回到原位；
- **聊天**：点铅笔图标新开一个聊天，用 **@** 加上下文，用 **$** 选技能，这样开的聊天不属于任何项目；点铃铛图标可以关注对话；
- **语音**：点语音图标，是否可用见语音文档；
- **状态**：**Running**（有聊天在工作）、**Needs input**（需要你批准、回答或决定）、**Ready**（聊天完成且有未读）、**Blocked**（聊天失败或遇到系统错误）；优先级是 Needs input、Blocked、Ready、Running；
- **减弱动态效果**：系统开启了该选项时，宠物显示静态画面而不是动画。

## 四、创建自定义宠物

**桌面版**：

1. 打开 **设置 → Pets**，点 **Create pet**；
2. 应用会安装内置的 **hatch-pet** 技能、重新加载技能，并新开一个对话；
3. 描述你想要的宠物并发送；
4. 任务完成后回到 **设置 → Pets**，点 **Refresh**，再选择新宠物。

桌面版的自定义宠物存在本机，**不会自动同步到网页版**。

**网页版上传**：在同一设置里点 **Upload pet**。文件必须是**透明的 PNG 或 WebP**，尺寸**正好 1536 × 1872 像素**，**不超过 20 MiB**。上传后可以编辑、下载、刷新或删除。

![桌面版自定义宠物的官方步骤](seed:g1222-pet-steps.png)
*图：本站根据 [OpenAI 官方 Pets 文档](https://learn.chatgpt.com/docs/pets) 整理的示意图*

自己做宠物图时，要遵守官方的内容规则和图片版权要求，见 [/guides/ai-image-copyright-commercial](/guides/ai-image-copyright-commercial)。

## 五、找不到宠物选项

官方说：宠物在**账号和工作区允许**时可用。网页版只有在你的账号和工作区可用时才出现该选项；桌面版里如果没有相关控件，**先更新应用**，再确认工作区是否允许宠物。官方没有列出具体套餐。桌面版的更新方法见 [/guides/chatgpt-desktop-app-wont-open-update](/guides/chatgpt-desktop-app-wont-open-update)，新旧桌面版见 [/guides/chatgpt-desktop-app](/guides/chatgpt-desktop-app)。想用到更多功能，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)，但官方没有说宠物与套餐挂钩。

## 官方没说的

- **哪些套餐有宠物**，官方文档没有列；
- 官方**帮助中心没有 Pets 专门文章**，本文依据的是官方文档站的页面；
- 宠物的内置形象有哪些，官方这篇没有逐一列出；
- 官方没有写在手机 App 里是否有宠物。

## 常见问题

**Q：宠物会影响 ChatGPT 的回答吗？**
不会，官方说选宠物只改变外观，不影响完成任务的方式。

**Q：怎么让桌面上的宠物消失？**
右键宠物选 Hide，或在 设置 → Pets 里点 Hide pet；也可以选 Mini，只显示聊天控件。

**Q：网页版怎么不显示宠物？**
网页版选 Default 就不用宠物；宠物只出现在支持的 Work 对话里。

**Q：自己做的宠物能同步到网页吗？**
桌面版自定义宠物存在本机，官方说不会自动同步；网页版可以单独上传符合规格的图。

## 参考资料

- OpenAI 官方文档：Pets in ChatGPT and Codex — https://learn.chatgpt.com/docs/pets
- OpenAI 开发者文档：Pets — https://developers.openai.com/docs/pets

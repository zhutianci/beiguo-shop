---
title: Gemini in Chrome 怎么开启：Chrome 侧边栏提问网页、多标签、Live、自动浏览与没有图标的原因
slug: gemini-in-chrome-side-panel-auto-browse
products: [gemini]
models: [gemini-llm]
accountTier: FREE
excerpt: Gemini in Chrome 是 Chrome 自带的 AI 助手：点顶部的 Ask Gemini，就能针对当前网页和最多 10 个标签页提问。本文按官方帮助中心讲清设备、地区和语言要求，多标签、Live、自动浏览的用法，怎么隐藏图标，以及没有 Gemini 图标的官方原因。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/chrome/answer/16283624
  - https://support.google.com/chrome/answer/17140089
  - https://support.google.com/chrome/answer/16363185
  - https://support.google.com/chrome/answer/16821166
  - https://support.google.com/chrome/answer/16706253
  - https://support.google.com/chrome/answer/16716225
  - https://support.google.com/chrome/answer/16988996
  - https://support.google.com/chrome/answer/17077507
  - https://support.google.com/googleone/answer/14534406
  - https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/
  - https://blog.google/products-and-platforms/products/chrome/gemini-in-chrome-android-auto-browse/
verify:
  - 自动浏览（auto browse）的可用地区两处说法不一：Chrome 帮助页写「年满 18 岁且在美国」，Google One 帮助页写「仅印度和美国」
  - 自动浏览的 Chrome 版本要求：Chrome 帮助页写「最新版」，Google One 帮助页写「144 或更高版本」
  - 安卓版要求：帮助页写须年满 18 岁、设备语言为英语、在受支持地区；官方博客（2026-08-18）说已向美国全部安卓用户开放，其他地区的安卓可用范围未单列
  - 「AI innovations」「Ask Gemini」等在简体中文版 Chrome 里的确切译名以实际界面为准
  - 官方「找不到 Gemini in Chrome」排查项里还有一条关于网络工具的建议，本文未收录
  - 截图来自官方博客（2026 年 1 月），已遮去演示账号的标签标题和头像
---

> 本文根据 Google 官方 Chrome 帮助中心、Google One 帮助中心和 Google 官方博客整理，核对日期 2026-10-10。**本文只陈述官方公布的可用范围，不提供、也不讨论任何改变网络环境或账号地区的方法**；请遵守所在地法律和服务条款。

## 适用于谁

- 搜「gemini in chrome 如何开启」「gemini chrome 侧边栏」「chrome 没有 gemini 图标」「gemini 浏览器助手」的人；
- 想让 AI 直接读当前网页、对比几个标签页，而不是把内容复制到聊天窗口的人；
- 想了解自动浏览（auto browse）是什么、哪些订阅能用的人。

提醒：Gemini in Chrome 是 Chrome **内置**的功能，不是扩展程序，官方没有让你去应用商店安装任何东西。

## 结论先说

1. **入口在浏览器顶部的 Ask Gemini 按钮**，第一次用要按提示同意开启（opt in）。之后它会以侧边栏形式打开，默认读取你当前标签页的内容。
2. **有没有这个按钮取决于四件事**：设备（Windows、Mac、Chromebook Plus；另有安卓和 iPhone 版）、登录了 Chrome 且不在无痕模式、设备语言在支持列表里（含中文）、所在地区在官方名单里。官方同时说明它在逐步推出，符合条件也可能暂时没有。
3. **基础功能不要求订阅**；**自动浏览需要 Google AI Pro 或 Ultra**，并且有每日次数上限。
4. **电脑上最多可以共享 10 个标签页**，输入 `@` 就能点名某个标签。
5. **不想看到它可以隐藏图标**：在 Chrome 设置的 Gemini in Chrome 页面里关掉显示，或右键浏览器顶部选择取消固定。

## 一、可用条件：设备、账号、语言、地区

| 平台 | 官方要求 |
| --- | --- |
| 电脑 | 13 岁以上（或所在国家的适用年龄）且在受支持地区；Chromebook Plus、Mac 或 Windows；Chrome 为最新版；已登录 Chrome；设备语言为受支持的语言 |
| 安卓 | 18 岁以上且在受支持地区；内存至少 4GB、系统 Android 12 或更高；Chrome 为最新版；已登录；设备语言设为英语 |
| iPhone / iPad | 13 岁以上（或适用年龄）且在受支持地区；Chrome 为最新版；已登录；设备语言为受支持的语言 |

共同点：**无痕模式下不可用**；工作 / 学校账号需要管理员开启；家长可以通过 Family Link 关闭受监管孩子的访问权限。

**语言**：官方列了约 50 种，包括**中文**、英语、日语、韩语、法语、德语、西班牙语等。

**地区**：官方按年龄给了两份名单。18 岁及以上的名单很长，包含美国、加拿大、英国、澳大利亚、新西兰、日本、韩国、新加坡、马来西亚、印度、印度尼西亚、泰国、越南、菲律宾，以及**香港、澳门、台湾**等；18 岁以下的名单短得多。完整名单见参考资料里的「Gemini in Chrome availability」。截至核对日，**中国大陆不在这两份名单中**，名单里也没有看到欧盟成员国。请以官方页面为准，并遵守所在地法律和服务条款。

## 二、开启和基本用法（电脑）

1. 打开 Chrome，点浏览器顶部的 **Ask Gemini**；
2. 首次使用按屏幕提示同意开启；
3. 在输入框里提问。

开启后，Gemini 还会出现在 Mac 的菜单栏或 Windows 的系统托盘里，并启用快捷键：

| 操作 | Mac | Windows | ChromeOS |
| --- | --- | --- | --- |
| 打开 / 关闭 | Ctrl + G | Alt + G | 搜索键 + G |
| 在网页和 Gemini 之间切换 | Ctrl + ⌘ + G | Alt + Shift + G | 搜索键 + Alt + G |
| 进入框选模式 | Ctrl + Shift + G | Ctrl + Alt + G | Ctrl + Shift + G |

官方举的用途：总结文章要点、换个方式解释难懂的概念、就正在学的内容出题考你、按饮食需求改食谱、跨页面对比或汇总信息、起草 Gmail 邮件。它还能回答你**已经播放过**的音视频内容（「媒体理解」默认开启，可在 `chrome://settings/ai/gemini` 里关）。

面板顶部可以**弹出为独立窗口 / 停靠回原标签**、开始新对话、查看最近的对话；输入框里可以切换 Gemini 模型。

## 三、让它读哪些标签页

- **默认共享当前标签页**。被 Gemini 使用的标签下方会有一条发光的下划线；
- **加标签**：点输入框里的「Add tabs」勾选，或输入 `@` 搜索并选中。除当前页外，最多共享**最近打开的 10 个标签页**，可以跨窗口；
- **停止共享**：点输入框上方的「Show shared tabs」，在不想共享的标签旁点移除；
- **不想默认共享**：在 Chrome 设置里关掉「Share current tab by default」；
- **只问页面的一部分**：点面板里的加号菜单 →「Select from screen」，在网页上拖出一个或多个框，框住的内容会附到提问里；按 Esc 退出。

一个容易忽略的点：如果你共享的是 Google 文档这类 Workspace 网页，官方说明 Gemini 可能直接访问你的 Workspace 账号来回答，以便读到整份文档而不只是标签里显示的那部分。

## 四、Live：边浏览边语音对话

1. 点 Ask Gemini，在输入框里点 **Go Live**；
2. 首次使用按提示完成设置，需要允许麦克风和扬声器；
3. 直接说话，可以随时打断。

Live 里同样可以共享当前标签和最多 10 个其他标签，可以开关实时字幕、切回文字模式、更换声音。官方还在逐步推出「用语音操作网页」：说「Scroll me…」「Go to…」「Take me to…」让它滚动到并高亮相关内容（PDF 不支持）。18 岁以下用户不能使用 Live。更完整的 Live 说明见本站《Gemini Live 怎么用：如何开启语音对话、共享摄像头和屏幕、后台通话与字幕》。

## 五、自动浏览（auto browse）：让 Gemini 替你点网页

自动浏览是让 Gemini 在网页上**替你完成多步任务**：比价、找优惠并加入购物车、按条件找酒店、订餐厅、预约等。

**使用条件**（Chrome 帮助中心）：

- 年满 18 岁，且在美国（Google One 帮助页写的是「仅印度和美国」，两处不一致）；
- 个人账号订阅了 **Google AI Pro 或 Google AI Ultra**；用学校账号登录不可用；
- 设备语言为英语；Chrome 的「安全浏览」设为增强型保护或标准保护；
- 不能在 Live 对话里用；iPhone / iPad 上暂不提供。官方博客 2026-08-18 宣布，美国的 AI Pro / Ultra 订阅者在安卓上也可以使用。

**流程**：描述任务 → 查看 Gemini 给出的计划（确认它对你的要求、页面和个人信息的理解没错）→ 点 **Start Task**。执行中的标签上有自动浏览图标；需要你出面时，浏览器顶部会通知你。你可以随时点 **Take over task** 接手，做完再点 Resume 或 Give back task 交还；点 Stop 或关掉任务标签即可终止。

**次数上限**（官方数字）：Google AI Pro 每天最多 20 个多步任务请求，Google AI Ultra 每天最多 200 个；同时进行的任务数也有上限。

![自动浏览进行到需要本人操作的步骤时，侧边栏提示「Gemini needs your help with this step」，点 Take over task 接手（官方博客配图，2026 年 1 月）](seed:g425-chrome-auto-browse-take-over.jpg)
*图片来源：[Google 官方博客《The new era of browsing: Putting Gemini to work in Chrome》](https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/)（已遮去演示账号的标签标题和头像）*

**官方的安全提醒**，建议用之前读一遍：

- 这是实验性功能，**你要为 Gemini 在任务中的行为负责，包括误操作和意外下单**；
- 它能访问你已登录的网站，可能把你的个人信息提供给它选择访问的网站；
- 存在**提示注入**风险：网页、邮件、文档里可能藏着你看不见、但 AI 读得到的恶意指令；
- 防护措施包括：付款、接受服务条款、创建账号这类步骤会要求你接手；发送消息、修改数据、提交表单、访问高度敏感的金融或健康网站前会请你确认；使用 Google 密码管理工具代你登录前要先征得许可，且密码不会交给 Gemini；
- 官方原话的意思是：这些防护不能替代你自己的监督。重要、敏感的任务要盯着看。

## 六、其他几个功能

- **搜索浏览历史**：直接问「我上周看的那家棕榈泉的酒店是哪个」。需要个人账号并已同步 Chrome 历史记录；工作 / 学校账号、无痕模式、Live 对话里不可用；
- **改网页上的图片**：在图片上右键 →「Create image with Gemini」，在面板里描述要怎么改。生成图片须满 13 岁，编辑图片须满 18 岁；工作 / 学校账号暂不可用；菜单里没有这一项说明该图片受保护或不受支持；
- **Skills**：在输入框里输入 `/` 可以调用或新建技能，把常用提示存下来一键运行。目前要求个人账号、Chrome 语言为英语（美国），并在逐步推出；
- **关联应用**：连接 Google Workspace 后，可以在 Chrome 里让它总结 Gmail、往 Tasks 加待办、建日历活动；目前可连接 Google Workspace、Google 相册、YouTube 和搜索服务。设置方法同本站《Gemini 关联应用怎么设置》；
- **Personal Intelligence**：须年满 18 岁，且在加拿大、印度、新西兰或美国。

## 七、自定义、隐藏图标与关闭

路径：Chrome 右上角「更多」→「设置」→ **AI innovations → Gemini in Chrome**。

**偏好设置（Preferences）**里可以分别开关：

- 在浏览器顶部显示 Gemini；
- 在 Mac 菜单栏显示 Gemini 并启用快捷键；
- 在 Windows 系统托盘显示 Gemini 并启用快捷键。

也可以直接右键浏览器顶部，选 **Unpin Gemini（取消固定）**。

**权限（Permissions）**里可以开关：精确位置、麦克风、默认共享当前标签页、允许 Gemini 替你浏览（Let Gemini browse for you），以及查看和移除「Gemini 可以代你登录的网站」。关掉精确位置后，它只能根据 IP 地址估算大致位置。

**数据在哪**：你和 Gemini in Chrome 的对话保存在「Gemini 应用活动记录」里；自动浏览访问过的网站会出现在 Chrome 历史记录里，并带有 Gemini 操作图标。活动记录的管理见本站《Gemini 隐私设置：怎么关闭模型训练、活动记录保留多久、人工审核怎么回事》。

## 八、Chrome 没有 Gemini 图标：官方排查项

帮助中心先说明了前提：它在逐步向用户推出，可能还没到你所在的国家或地区。在官方名单内仍然没有时，依次检查：

1. **是否以符合条件的用户登录了 Chrome**：无痕模式和未登录的 Chrome 个人资料里没有；达到年龄要求的可以做年龄验证；
2. **是否在受支持的国家或地区**：如果你刚从名单外的地方回来，位置信息可能还没更新，先重启浏览器再试；
3. **Chrome 是否为最新版**；仍然没有就等下一个版本更新后再看；
4. **设备和语言**：是否是 Windows、Mac 或 Chromebook，设备语言是否在支持列表里；
5. （进阶）把 Chrome flags 重置为默认，然后重启浏览器；
6. 在 Gemini 面板或浮动聊天框上右键选「Reload」；
7. **虚拟机**里某些功能可能受限；
8. **工作 / 学校账号**：问管理员是否禁用了 Gemini in Chrome。

安卓和 iPhone 上，官方给的步骤更短：登录 Chrome（非无痕）、更新 Chrome、重启浏览器；并注明在 Google 搜索结果页上不能使用。

## 常见问题

**Q：Gemini in Chrome 要下载或装扩展吗？**
不用。它是 Chrome 自带的功能，条件满足时按钮会出现在浏览器顶部。地址栏里输入 `@gemini` 再按 Tab 是另一个功能：把问题发到 gemini.google.com 网页版。

**Q：免费账号能用吗？**
帮助中心对基础功能（提问当前网页、共享标签、Live 等）没有列订阅要求；自动浏览写明需要 Google AI Pro 或 Ultra。

**Q：它会读我所有的标签页吗？**
官方说明默认只共享当前标签页，其余的要你手动添加或用 `@` 点名；共享状态可以随时取消。

**Q：提示所在地区不可用怎么办？**
这表示你所在的国家或地区不在官方当前的可用名单里，或功能还没推送到你。官方的做法是逐步扩大范围，只能等待；本站不提供任何改变地区的办法。

## 参考资料

- Use Gemini in Chrome：https://support.google.com/chrome/answer/16283624
- Gemini in Chrome availability：https://support.google.com/chrome/answer/17140089
- Go Live with Gemini in Chrome：https://support.google.com/chrome/answer/16363185
- Ask Gemini in Chrome to complete tasks for you with auto browse：https://support.google.com/chrome/answer/16821166
- Edit images from the web in Gemini in Chrome：https://support.google.com/chrome/answer/16706253
- Search your Chrome history with Gemini in Chrome：https://support.google.com/chrome/answer/16716225
- Customize your Gemini in Chrome experience：https://support.google.com/chrome/answer/16988996
- Share specific parts of your screen with Gemini in Chrome：https://support.google.com/chrome/answer/17077507
- Use Google AI Pro benefits（auto browse 一节）：https://support.google.com/googleone/answer/14534406
- Google 官方博客 The new era of browsing: Putting Gemini to work in Chrome（2026-01-28）：https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/
- Google 官方博客 Tap into the power of Gemini in Chrome on Android（2026-08-18）：https://blog.google/products-and-platforms/products/chrome/gemini-in-chrome-android-auto-browse/

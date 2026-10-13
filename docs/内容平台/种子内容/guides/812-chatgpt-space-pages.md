---
title: ChatGPT Space 是什么、怎么用：页面（Pages）怎么创建和编辑、多人协作与分享权限
slug: chatgpt-space-pages
products: [chatgpt]
models: []
accountTier: PRO
excerpt: ChatGPT 侧边栏多了个 Space，文件库却不见了？Space 是放页面、文件和成果的新地方，页面可以让 ChatGPT 起草、多人一起编辑。本文按官方帮助中心讲清谁能用、Space 和项目 / 文件库的关系、怎么创建和整理页面、分享后别人能看到什么，以及手机上的限制。
checkedOn: 2026-10-13
sources:
  - https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt
  - https://help.openai.com/en/articles/20001544-chatgpt-space-sharing-data-and-controls
  - https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
  - https://help.openai.com/en/articles/10169521-projects-in-chatgpt
verify:
  - Space、page、space 的中文界面译名以实际界面为准，本文保留英文并注「页面」
  - 官方只写「Pro、Business、Enterprise 可以在 Space 里创建和编辑内容」，Plus 等套餐今后是否开放未说明
  - 官方文章没有配界面截图，按钮位置以实际界面为准
---

> 本文根据 OpenAI 帮助中心《Getting started with Space in ChatGPT》《ChatGPT Space: sharing, data, and controls》整理，资料核对于 2026-10-13。官方这两篇文章没有配界面截图，文中配图为本站整理的示意图。

## 适用于谁

- 升级到 Pro，或在公司的 Business / Enterprise 工作区里，看到侧边栏出现 **Space** 的人；
- 想把一段聊天整理成一份能长期维护、能和同事一起改的文档的人；
- 准备把页面分享出去，担心对方看到不该看的内容的人。

## 结论先说

1. **Space 是什么**：官方的定义是「你的页面、上传的文件和其他成果在 ChatGPT 里的家」。其中的**页面（page）**是可编辑的文档，可以让 ChatGPT 帮你写和改，也可以分享给别人一起编辑。
2. **谁能用**：在 Space 里创建和编辑内容需要 **ChatGPT Pro、Business 或 Enterprise**。
3. **和文件库的关系**：对有 Space 的账号，**Space 取代文件库（Library）**；项目（Projects）保持独立，照常使用。
4. **在哪用**：创建和编辑要在**网页版或桌面应用**；手机 App 只能查找、阅读、分享页面，不能编辑。
5. **分享要留意**：写在页面上的内容，所有能看这个页面的人都看得到——包括 ChatGPT 借助你的记忆写进去的信息。

## Space、项目、文件库怎么分

![Space、项目、文件库分别放什么](seed:g812-space-vs-projects.png)
*图：本站根据 [OpenAI 帮助中心：Getting started with Space in ChatGPT](https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt) 整理的示意图*

两个容易混的词：

- **page（页面）**：一份可编辑的文档，比如项目简介、会议记录、调研总结、团队周报。页面下面还可以有**子页面（subpage）**，把总结和支撑材料放在一起；
- **space**：把相关内容归到一起的「分组」。每个人有一个个人 space，也可以另建 space 按主题或团队来组织，里面可以有文件夹和页面。

官方特别说明：创建或使用 space **不会取代你已有的项目**。项目继续管项目聊天、文件和项目指令，用法见 [/guides/chatgpt-projects](/guides/chatgpt-projects)。没有 Space 的账号（比如 Free、Plus）继续使用文件库，见 [/guides/chatgpt-library-files](/guides/chatgpt-library-files)。

## 步骤

### 1. 创建一个 space

直接用一句话让 ChatGPT 建，并给它起名。官方的例子：

```
Create a space named Website launch.
```

用中文说「创建一个名为『官网改版』的 space」是同样的意思。

### 2. 创建页面

官方给了三种起点：**从一段对话生成**、**在 Space 里直接开始写**、**用 Space 首页的模板**。从对话生成最常用：

![把一段 ChatGPT 对话变成 Space 页面的 5 步](seed:g812-space-create-page.png)
*图：本站根据 [OpenAI 帮助中心：Getting started with Space in ChatGPT](https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt) 整理的示意图*

可以直接照这个句式说：

```
根据这段对话创建一个页面，包含项目目标、已经做出的决定和下一步。放到「官网改版」这个 space 里。
```

### 3. 让 ChatGPT 改页面

打开页面后，可以自己直接改，也可以让 ChatGPT 改整页或只改一节。官方举的例子：

- 「把引言缩短，建议部分保持不变。」
- 「把附件里的会议记录总结一下，加到『决定』下面。」
- 「比较这两份方案，把主要区别加到这个页面里。」

页面里还能放 ChatGPT 生成的**图表、跟踪表和可交互的小工具**，比如让它加一张对比报告数字的图表。

两种反馈方式：

- **评论**：选中一段文字添加评论，说明你想怎么改——适合针对具体段落；
- **页面的聊天**：适合问整体性的问题，或做跨全文的修改。

官方提醒：使用或分享页面之前，核对里面的姓名、日期、计算和来源信息。

### 4. 整理：子页面与移动

- 建子页面：「在『项目概览』下面创建一个『会议记录』子页面。」
- 改名：直接让 ChatGPT 重命名页面；
- 移动：告诉 ChatGPT 把哪个页面移到哪个页面下面（同一个 space 内）。你需要对两个页面都有编辑权限，而且**移动可能改变谁能访问这个页面**，确认前先看一眼权限变化。

### 5. 找内容

Space 里的几个视图：

- **All › Your items**：你个人 space 里的内容，包括页面、文件和文件夹；
- **All › Shared with you**：直接分享给你、或分享给你所在团队的内容。只能通过某个共享 space 访问的内容可能不在这里，要打开那个 space 去找；
- **Pages**：你拥有的或别人分享给你的页面；
- **Suggested** 和 **Recents**：帮你回到最近用过的内容；
- **Images**：分成 **Your creations（你的创作）** 和 **Uploads（上传）**。

手机上通过 Space 搜索或全局搜索找页面，最近看过的页面也会出现在 Suggested 里。

### 6. 分享与协作

打开页面，点 **Share（分享）**，选择分享给谁、对方是**只能查看**还是**可以编辑**。有编辑权限的人可以实时一起修改。也可以直接分享整个 space，让大家在一组相关的页面和文件上协作。

![分享 Space 页面后别人能看到什么](seed:g812-space-sharing.png)
*图：本站根据 OpenAI 帮助中心 [Getting started with Space in ChatGPT](https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt) 与 [ChatGPT Space: sharing, data, and controls](https://help.openai.com/en/articles/20001544-chatgpt-space-sharing-data-and-controls) 整理的示意图*

权限上最容易出错的两点：

- **访问权限有三个来源**：直接邀请到页面、来自上级页面、来自所在的 space。所以移除某人的直接邀请，并不会去掉他从上级页面或 space 继承来的权限；要去掉，得改授予权限的那个上级页面或 space 的分享设置。
- **记忆会「漏」到页面上**：开着记忆时，ChatGPT 帮你写页面可能用到关于你的个人背景。一旦写到页面上，能看页面的人都能读到。你原来的那段私人对话不会被分享，但写出来的信息会。**分享前通读一遍**。

## 手机上能做什么

![Space 在电脑和手机上能做什么](seed:g812-space-devices.png)
*图：本站根据 [OpenAI 帮助中心：Getting started with Space in ChatGPT](https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt) 整理的示意图*

## 常见问题

**Q：我是 Plus，为什么没有 Space？**
官方写明在 Space 里创建和编辑内容需要 Pro、Business 或 Enterprise。Plus 继续用文件库和项目。套餐区别见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

**Q：为什么我编辑不了某个页面？**
要有编辑权限；有权限的话，请在网页版或桌面应用里打开，手机只支持阅读和分享。

**Q：对方打不开我页面里链接的文件？**
读者除了页面的权限，还需要原文件的访问权限。分享页面不会改变文件自身的权限；存在外部服务（如网盘）里的文件，沿用那个服务的权限。但要注意反过来的情况：如果你或 ChatGPT 把文件里的内容**抄写或总结**到了页面上，能看页面的人就能读到，即使他打不开原文件。

**Q：删除页面会怎样？**
页面连同它的子页面会移到 **Trash（废纸篓）**，**包括别人拥有的子页面**。删除上级页面之前先检查子页面。

**Q：我关了「用于训练」，分享出去的内容还会被用于训练吗？**
可能会。官方说明：每个协作者的训练和记忆设置，适用于他自己的 ChatGPT 对共享内容的使用。你关了训练，但协作者开着，你写的内容仍可能通过对方的交互被用于训练；对方开着记忆的话，他的 ChatGPT 也可能记住页面上的信息。Business 和 Enterprise 的数据默认不用于训练。个人账号的开关在 **Settings → Data controls → Improve the model for everyone**，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)。

**Q：Space 能做幻灯片和表格吗？**
官方标注 Slides 和 Sheets「即将推出」。现在要生成 PPT、Excel 文件，见 [/guides/chatgpt-create-word-excel-ppt](/guides/chatgpt-create-word-excel-ppt)。

**Q：Space 和 Sites 是一回事吗？**
不是。Space 的页面是协作文档；Sites 是把内容发布成网页，见 [/guides/chatgpt-sites](/guides/chatgpt-sites)。

## 参考资料

- OpenAI 帮助中心：Getting started with Space in ChatGPT — https://help.openai.com/en/articles/20001549-getting-started-with-space-in-chatgpt
- OpenAI 帮助中心：ChatGPT Space: sharing, data, and controls — https://help.openai.com/en/articles/20001544-chatgpt-space-sharing-data-and-controls
- OpenAI 帮助中心：Using Library to manage files in ChatGPT — https://help.openai.com/en/articles/20001052-using-library-to-manage-files-in-chatgpt
- OpenAI 帮助中心：Projects in ChatGPT — https://help.openai.com/en/articles/10169521-projects-in-chatgpt

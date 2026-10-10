---
title: ChatGPT Skills 怎么用：创建、@调用与推荐（附哪些套餐能用）
slug: chatgpt-skills
products: [chatgpt]
models: []
accountTier: TEAM
excerpt: ChatGPT Skills（技能）能把一套固定做法打包，让 ChatGPT 每次都按同样流程完成任务。本文讲清哪些套餐能用、在哪找、几种创建方式、怎么用 @ 调用，以及适合做成技能的场景。
checkedOn: 2026-10-10
sources:
  - https://help.openai.com/en/articles/20001066-skills-in-chatgpt
  - https://help.openai.com/en/articles/20001256-plugins-in-chatgpt-and-codex
  - https://learn.chatgpt.com/docs/skills-and-plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://learn.chatgpt.com/docs/extend/record-and-replay
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/10128477-chatgpt-enterprise-and-edu-release-notes
  - https://explainx.ai/blog/how-to-use-skills-in-chatgpt-complete-guide-2026
  - https://www.tonyreviewsthings.com/how-to-use-skills-in-chatgpt/
  - https://composio.dev/content/best-chatgpt-skills
---

## 适用于谁

- 公司用的是 **ChatGPT Business / Enterprise / Edu** 工作区，想把周报、合同初审、客服回复这类固定工作流程化的人；
- 搜「ChatGPT skill 怎么用」「ChatGPT skills 推荐」，想先搞清楚自己账号能不能用的人。

**先说明：截至 2026 年 10 月，OpenAI 帮助中心写明个人技能（Personal Skills）面向 Business、Enterprise、Healthcare、Edu 用户开放，并且还取决于工作区设置和所用的端。官方没有把个人 Free / Plus / Pro 账号列在可用范围内。** 下文按企业类工作区的界面来写，本文根据官方文档和公开资料整理，界面截图来自第三方公开文章。

## 结论先说

1. **技能 = 一份可复用的「做事说明书」**。里面写清这件事的步骤、输出格式、示例和检查项，必要时还能带脚本。ChatGPT 在你需要时按它来做，结果更稳定。
2. **两种调用方式**：在输入框输入 **@** 选择技能（明确调用）；或者不选，ChatGPT 判断你的请求和技能描述匹配时会自动使用（隐式调用）。所以**技能描述要写清楚「什么时候用」**。
3. **几种创建方式**：技能页的「创建」菜单里有三种——用对话创建（内置的 skill-creator）、用编辑器创建、从电脑上传；另外在 Mac 版 ChatGPT 桌面 App 里还能「录制」一遍操作生成技能。
4. 技能和项目、GPTs 不冲突：项目管「这件事的资料」，技能管「这类事怎么做」。

## 步骤

### 1. 找到技能入口

打开侧边栏的 **插件（Plugins）**，进入插件目录（Plugin Directory），切到 **技能（Skills）** 标签页。

![ChatGPT 侧边栏里的「Plugins」入口，技能没有单独的侧边栏入口](seed:g05-sidebar-plugins.webp)
*图片来源：[explainx.ai](https://explainx.ai/blog/how-to-use-skills-in-chatgpt-complete-guide-2026)*

技能页按分组列出：已安装（Installed）、我创建的（Created by me）、分享给我的（Shared with me），以及工作区共享的技能。右上角有搜索框和「+」创建按钮。

![插件目录顶部切到「Skills」后的技能页：已安装与我创建的技能列表，右上角是搜索和「+」按钮（2026 年 7 月英文界面）](seed:g05-skills-tab.png)
*图片来源：[Tony Reviews Things](https://www.tonyreviewsthings.com/how-to-use-skills-in-chatgpt/)*

如果看不到：确认你在公司工作区（而不是个人账号）里，并联系管理员确认工作区已开启技能。Enterprise 和 Edu 工作区的管理员可以在「权限与角色（Permissions & roles）」里控制哪些角色能创建、使用、上传、分享和安装技能。

### 2. 方式一：用对话创建（最简单）

在技能页点 **+（创建）→ 用对话创建（Create with chat）**，或者直接在对话里说「帮我创建一个技能：……」。符合条件的账号默认带有一个名为 **skill-creator** 的技能，你让 ChatGPT 创建或修改技能时它会自动启用，也可以输入 `@skill-creator` 明确调用。它会追问：

- 这个技能做什么、什么时候该用；
- 步骤是什么、输出长什么样；
- 有没有示例或模板；
- 是只要文字说明，还是需要附带脚本（默认只写说明）。

回答完，它会提示你安装这个技能。

![在 ChatGPT 对话框里发起「帮我创建一个技能」的请求（2026 年 7 月英文界面）](seed:g05-create-with-chat.png)
*图片来源：[Tony Reviews Things](https://www.tonyreviewsthings.com/how-to-use-skills-in-chatgpt/)*

### 3. 方式二：用编辑器创建

如果你已经想清楚怎么写，选 **+ → 用编辑器创建（Create with editor）**，直接填写名称、描述和说明正文，比对话来回更可控。

![技能编辑器：名称、描述（可一键优化描述）和说明正文三个区域](seed:g05-skill-editor.png)
*图片来源：[Tony Reviews Things](https://www.tonyreviewsthings.com/how-to-use-skills-in-chatgpt/)*

### 4. 方式三：上传技能文件夹

如果团队已经写好技能，选择 **+ → 从电脑上传（Upload from your computer）**。一个技能就是一个文件夹，至少包含一个 `SKILL.md`，开头写明 `name`（名称）和 `description`（什么时候用），正文写步骤；可以附带 `scripts/`（脚本）、`references/`（参考资料）、`assets/`（模板）等子文件夹。

![技能页「+」菜单：用对话创建、用编辑器创建、从电脑上传三个选项](seed:g05-create-menu.webp)
*图片来源：[explainx.ai](https://explainx.ai/blog/how-to-use-skills-in-chatgpt-complete-guide-2026)*

上传后 ChatGPT 会先做一次扫描：多数技能扫描完即可使用；有的会标记为「需要审核（Needs Review）」，要你确认额外信息；看起来有风险的会被「拦截（Blocked）」无法使用。从外部下载或别的组织给的技能，上传前自己先读一遍，确认来源可信。

### 5. 方式四：录制并回放（Mac 桌面 App）

有些流程「演示比描述容易」。按 OpenAI 文档，**录制并回放（Record & Replay）** 目前只在 macOS 上提供，并且需要电脑操作（Computer Use）功能可用且已开启：在 ChatGPT 桌面 App 里切到 Work（或 Codex），打开 **Plugins**，点 **+ → 录制技能（Record a skill）**，授权后在 Mac 上演示一遍，结束后它会分析步骤并起草一个技能。官方发布说明提到该功能初期不含欧盟、英国和瑞士地区。网页版暂无此入口。

### 6. 调用技能

在输入框输入 **@**，从列表里选技能，再写本次的具体内容：

> @周报生成 这是本周的会议纪要和任务表，按模板出周报。

### 7. 修改与分享

点技能卡片可以打开详情，查看和修改说明；卡片的「•••」菜单里有分享等操作，可以搜索工作区里的同事或群组来分享，也可以复制分享链接、设置访问权限。别人分享给你的技能，在「分享给我的」或工作区分组里点「•••」→「安装」即可。能否分享、能否发布到整个工作区，取决于管理员的权限设置。想把多个技能或技能加连接器一起分发，可以打包成插件。

![一个技能的详情面板：名称、简介和完整说明，右上角有启用开关和「•••」菜单（英文界面）](seed:g05-skill-detail.jpg)
*图片来源：[Composio](https://composio.dev/content/best-chatgpt-skills)*

## 推荐：适合做成技能的事

不在这里推荐具体第三方技能包，只给判断标准——**重复做、格式固定、有明确检查标准**的事最适合：

- **周报 / 日报**：固定栏目、固定语气；
- **会议纪要整理**：结论、待办、负责人、截止日期四段式；
- **合同 / 文案初审**：按清单逐项检查并标出风险；
- **品牌文案改写**：带上品牌用词表和禁用词；
- **数据报表解读**：固定先看哪些指标、怎么写结论。

写技能时，一次只做一件事，描述里写清「什么时候用、什么时候不用」，把关键用途写在描述开头，附一两个好的示例输出，效果最好。

## 2026-10-10 更新

- **OpenAI 的示例仓库换了地方**：`openai/skills` 的 README 已标注弃用，官方示例转到 `openai/plugins`；自己写的技能，官方建议做成「只含技能的插件」。
- **Codex 的技能目录**：官方文档现在写的用户级目录是 `$HOME/.agents/skills`（项目内是 `.agents/skills`），不少旧教程写的 `~/.codex/skills` 已不是文档里的位置，以官方文档为准。
- **ChatGPT 与 Codex 共用插件目录**：按 OpenAI 文档，两边看到的是同一个插件目录，Codex CLI 里用 `/plugins` 打开。
- **想找现成的技能库**：本站整理了讨论和使用较多的 Skill 库，每个都有介绍、安装命令和注意事项，见 [Skill 库](/skills)。第三方技能可以运行脚本、读取文件，安装前先看清来源和内容。

## 常见问题

**Q：我是个人 Plus，能用吗？**
按官方帮助的现行说明，个人技能面向 Business、Enterprise、Healthcare、Edu，个人 Plus / Pro 不在列出的范围内，以官方后续说明为准。插件目录对各套餐开放，部分插件里自带技能，能不能装、能不能用取决于具体插件和你的套餐。替代做法是用「项目」放固定说明和模板，或者做一个 GPT。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：技能会自动生效吗？**
会，前提是你的请求和技能描述匹配。如果它该用的时候没用，改写描述，或直接 @ 调用。

**Q：网页、桌面端、手机都能用吗？**
官方文档写法有差异：帮助中心给出的入口是网页 / 桌面 / 手机侧边栏的 Plugins；OpenAI 开发者文档则说独立技能主要在 ChatGPT 桌面 App、Codex CLI 和 IDE 扩展里可用，**打包进插件的技能**才在网页、桌面和手机上都能用。第三方文章还提到桌面端和网页 / 手机端添加的个人技能目前不会自动同步。实际以你账号里的界面为准。

**Q：和 Codex 里的技能是一回事吗？**
格式相同，都基于 `SKILL.md`（开放的 agent skills 标准）；ChatGPT 里用 @ 调用，Codex 里用 $ 调用。不过 ChatGPT 和 Codex 里的技能可能需要分别管理。

## 参考资料

- OpenAI 帮助中心：Skills in ChatGPT — https://help.openai.com/en/articles/20001066-skills-in-chatgpt
- OpenAI 帮助中心：Plugins in ChatGPT — https://help.openai.com/en/articles/20001256-plugins-in-chatgpt-and-codex
- OpenAI 文档：Skills & Plugins — https://learn.chatgpt.com/docs/skills-and-plugins
- OpenAI 文档：Build skills — https://learn.chatgpt.com/docs/build-skills
- OpenAI 文档：Record & Replay — https://learn.chatgpt.com/docs/extend/record-and-replay
- ChatGPT Release Notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- ChatGPT Enterprise and Edu Release Notes — https://help.openai.com/en/articles/10128477-chatgpt-enterprise-and-edu-release-notes
- 截图来源：explainx.ai、Tony Reviews Things、Composio（见各图下方链接）

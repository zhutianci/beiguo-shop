---
title: ChatGPT Skills 怎么用：创建、@调用与推荐（附哪些套餐能用）
slug: chatgpt-skills
products: [chatgpt]
models: []
accountTier: TEAM
excerpt: ChatGPT Skills（技能）能把一套固定做法打包，让 ChatGPT 每次都按同样流程完成任务。本文讲清哪些套餐能用、在哪找、三种创建方式、怎么用 @ 调用，以及适合做成技能的场景。
sources:
  - https://help.openai.com/en/articles/20001066-skills-in-chatgpt
  - https://learn.chatgpt.com/docs/skills-and-plugins
  - https://learn.chatgpt.com/docs/build-skills
  - https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
screenshots:
  - 侧边栏「插件（Plugins）」→ 插件目录里的「技能（Skills）」标签页
  - 技能页「创建 → 用对话创建 / 从电脑上传」菜单
  - 对话里输入 @ 弹出的技能列表
  - skill-creator 追问并提示安装技能的对话示例
  - 已安装技能的详情页（名称、描述、编辑 / 删除）
verify:
  - 个人 Plus / Pro 账号能否使用 Skills：官方帮助写明个人技能面向 Business、Enterprise、Healthcare、Edu；多家第三方称 Free / Plus / Pro 不在本轮开放范围，需用 Plus 实号确认是否已有变化
  - 入口位置：帮助中心写「侧边栏 → Plugins → Skills 标签」；OpenAI 文档又说独立技能主要在桌面 App 可用、打包进插件的技能才在网页 / 手机上可用，需实测两端差异
  - 「录制并回放（Record & Replay）」创建方式在 ChatGPT（非 Codex）里的入口与可用范围
  - Enterprise 工作区自 2026-07-23 起默认开启技能（第三方说法），需核对
---

## 适用于谁

- 公司用的是 **ChatGPT Business / Enterprise / Edu** 工作区，想把周报、合同初审、客服回复这类固定工作流程化的人；
- 搜「ChatGPT skill 怎么用」「ChatGPT skills 推荐」，想先搞清楚自己账号能不能用的人。

**先说明：截至 2026 年 10 月，OpenAI 帮助中心写明个人技能（Personal Skills）面向 Business、Enterprise、Healthcare、Edu 套餐。个人 Free / Plus / Pro 账号目前很可能看不到技能入口（待实测）。** 下文按 Business 工作区界面来写。

## 结论先说

1. **技能 = 一份可复用的「做事说明书」**。里面写清这件事的步骤、输出格式、示例和检查项，必要时还能带脚本。ChatGPT 在你需要时按它来做，结果更稳定。
2. **两种调用方式**：在输入框输入 **@** 选择技能（明确调用）；或者不选，ChatGPT 判断你的请求和技能描述匹配时会自动使用（隐式调用）。所以**技能描述要写清楚「什么时候用」**。
3. **三种创建方式**：用对话让 ChatGPT 帮你建（内置的 skill-creator）、上传写好的技能文件夹、录制一遍操作让它生成。
4. 技能和项目、GPTs 不冲突：项目管「这件事的资料」，技能管「这类事怎么做」。

## 步骤

### 1. 找到技能入口

打开侧边栏的 **插件（Plugins）**，进入插件目录，切到 **技能（Skills）** 标签页。这里能看到你已安装的技能，以及工作区共享或目录里可安装的技能。

【截图：侧边栏 Plugins → Skills 标签页】

如果看不到：确认你在公司工作区（而不是个人账号）里，并联系管理员确认工作区已开启技能。

### 2. 方式一：用对话创建（最简单）

在技能页选择 **创建 → 用对话创建**，或者直接在对话里说「帮我创建一个技能：……」。符合条件的账号默认带有一个名为 **skill-creator** 的技能，也可以输入 `@skill-creator` 明确调用。它会追问：

- 这个技能做什么、什么时候该用；
- 步骤是什么、输出长什么样；
- 有没有示例或模板；
- 交付前要检查什么。

回答完，它会提示你安装这个技能。

【截图：skill-creator 追问并提示安装的对话】

### 3. 方式二：上传技能文件夹

如果团队已经写好技能，选择 **创建 → 从电脑上传**。一个技能就是一个文件夹，至少包含一个 `SKILL.md`，开头写明 `name`（名称）和 `description`（什么时候用），正文写步骤；可以附带 `scripts/`（脚本）、`references/`（参考资料）、`assets/`（模板）等子文件夹。上传失败时，可以把**单个技能文件夹**压缩成 ZIP 再传，注意 `SKILL.md` 要在压缩包的根目录。

【截图：「创建 → 从电脑上传」菜单】

### 4. 方式三：录制并回放

有些流程「演示比描述容易」，OpenAI 文档提到可以录制一遍操作，由系统分析步骤生成技能。该方式在 ChatGPT 里的具体入口待实测。

### 5. 调用技能

在输入框输入 **@**，从列表里选技能，再写本次的具体内容：

> @周报生成 这是本周的会议纪要和任务表，按模板出周报。

【截图：输入 @ 弹出的技能列表】

### 6. 修改与分享

在技能详情页可以编辑说明、替换示例。想给整个团队用，可以通过工作区共享，或打包成插件发布到插件目录（取决于管理员设置）。

## 推荐：适合做成技能的事

不在这里推荐具体第三方技能包，只给判断标准——**重复做、格式固定、有明确检查标准**的事最适合：

- **周报 / 日报**：固定栏目、固定语气；
- **会议纪要整理**：结论、待办、负责人、截止日期四段式；
- **合同 / 文案初审**：按清单逐项检查并标出风险；
- **品牌文案改写**：带上品牌用词表和禁用词；
- **数据报表解读**：固定先看哪些指标、怎么写结论。

写技能时，一次只做一件事，描述里写清「什么时候用」，附一两个好的示例输出，效果最好。

## 常见问题

**Q：我是个人 Plus，能用吗？**
按官方帮助的现行说明，个人技能面向企业类套餐，个人 Plus / Pro 暂不在内（待实测）。替代做法是用「项目」放固定说明和模板，或者做一个 GPT。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

**Q：技能会自动生效吗？**
会，前提是你的请求和技能描述匹配。如果它该用的时候没用，改写描述，或直接 @ 调用。

**Q：网页、桌面端、手机都能用吗？**
OpenAI 文档提到不同端的支持有差异，打包成插件的技能覆盖面更广（待实测）。

**Q：和 Codex 里的技能是一回事吗？**
格式相同，都基于 `SKILL.md`；ChatGPT 里用 @ 调用，Codex 里用 $ 调用。

## 参考资料

- OpenAI 帮助中心：Skills in ChatGPT — https://help.openai.com/en/articles/20001066-skills-in-chatgpt
- OpenAI 文档：Skills & Plugins — https://learn.chatgpt.com/docs/skills-and-plugins
- OpenAI 文档：Build skills — https://learn.chatgpt.com/docs/build-skills
- OpenAI 帮助中心：Troubleshooting plugins & apps in ChatGPT — https://help.openai.com/en/articles/20001497-troubleshooting-plugins-apps-in-chatgpt
- ChatGPT Release Notes — https://help.openai.com/en/articles/6825453-chatgpt-release-notes

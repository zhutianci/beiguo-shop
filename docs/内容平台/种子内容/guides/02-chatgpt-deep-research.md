---
title: ChatGPT 深度研究怎么用：次数限制与用不了的排查
slug: chatgpt-deep-research
products: [chatgpt]
models: []
accountTier: PLUS
excerpt: ChatGPT 深度研究是什么、适合问什么、怎么指定网站和文件、次数怎么算、什么时候重置；按钮不见了、一直转圈、次数用完时该怎么排查。
checkedOn: 2026-10-07
sources:
  - https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
  - https://help.openai.com/en/articles/6825453-chatgpt-release-notes
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://status.openai.com/
  - https://thoughtsbrewing.com/blog/ai-quick-tips-296-chatgpts-deep-research-upgrade
  - https://theaibreak.substack.com/p/tutorial-how-to-master-deep-research
---

## 适用于谁

- 想让 ChatGPT 帮你做一份**有出处的调研报告**：行业概况、竞品对比、文献综述、政策梳理；
- 搜过「ChatGPT 深度研究次数」「深度研究用不了」，想知道额度怎么算、为什么点不出来；
- 本文根据 OpenAI 帮助中心和公开教程整理，按 Plus 账号写。官方说明额度按套餐不同，也会受国家 / 地区限制。

## 结论先说

1. **深度研究 ≠ 普通联网搜索**。普通搜索几秒钟给出简短回答；深度研究会先给出研究计划，再花更长时间阅读、分析大量来源，最后交一份带引用的结构化报告。
2. **次数以产品里显示的剩余次数为准**。官方帮助只写了：用量按套餐不同；对于有固定月度额度的套餐，**从你第一次使用起每 30 天重置**。各套餐的具体数字，现行帮助中心没有列出。
3. 用不了时，先看四件事：**套餐与剩余次数、App 版本、国家地区 / 工作区设置、OpenAI 服务状态**。

## 步骤

### 1. 打开深度研究

官方给了三种入口：

- 点输入框左侧的「**+**」（工具菜单），选择**深度研究**（Deep research）；在一些账号上它收在「更多」里；
- 直接在输入框输入 `/Deepresearch`；
- 从侧边栏菜单里选择深度研究。

![「+」菜单 →「更多」里的「深度研究」](seed:g02-deep-research-menu.png)
*图片来源：[Thoughts Brewing](https://thoughtsbrewing.com/blog/ai-quick-tips-296-chatgpts-deep-research-upgrade)*

### 2. 把问题写成「要交付什么」

深度研究最怕问题太宽。建议写清四点：

- **目标**：报告给谁看、用来做什么决策；
- **范围**：时间范围、地区、行业；
- **格式**：要不要表格、对比维度有哪些、多长；
- **来源偏好**：优先官方 / 论文 / 某几个网站。

示例：「调研 2026 年国内主流 AI 写作工具，面向中小企业采购；对比价格、中文能力、数据安全条款；输出一张对比表加 800 字结论，来源尽量用各家官网。」

### 3. 指定网站和文件（可选）

- **网站**：在输入框里找到「**网站 → 管理网站**」（Sites › Manage sites），可以只在你填写的网站 / 域名里搜索，或打开「优先这些网站，但允许全网搜索」；也可以用英文逗号一次填多个网址。
- **文件**：把 PDF、表格等直接上传，深度研究会一并阅读。
- **已连接的应用**：支持深度研究、且你的账号和工作区允许使用的应用（例如 Google Drive、SharePoint 等文档库）会自动作为来源；深度研究只会「读取」应用里的内容，不会执行写入操作。能连哪些取决于套餐、地区和工作区设置。

![「管理网站」：只搜这些网站，或优先这些网站](seed:g02-manage-sites.png)
*图片来源：[OpenAI 帮助中心：Deep research in ChatGPT](https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt)*

### 4. 审核研究计划

提交后，ChatGPT 可能先问几个澄清问题，然后列出一份研究计划。觉得方向不对，先点「编辑」改计划再开始——这一步省下的次数最多。

![开跑前的研究计划，左下角可「编辑」](seed:g02-research-plan.png)
*图片来源：[Thoughts Brewing](https://thoughtsbrewing.com/blog/ai-quick-tips-296-chatgpts-deep-research-upgrade)*

### 5. 等待与中途纠偏

运行时可以实时看进度，随时打断补充「再加上某某方向」「不要用某类来源」，也可以调整它能访问的来源。不必守着页面，完成后在对话里就能看到报告。

![运行中的进度卡片：右上角「更新」可中途补充要求](seed:g02-research-progress.png)
*图片来源：[Thoughts Brewing](https://thoughtsbrewing.com/blog/ai-quick-tips-296-chatgpts-deep-research-upgrade)*

### 6. 核对报告

完成的报告会以全屏视图打开：左侧是目录，右侧有「来源」和「活动记录」。每个关键结论都应有来源链接，重要数字请点开原文核对——深度研究也会出错。报告可以下载为 Markdown、Word、PDF 等格式。

![全屏报告视图：左侧目录、正文引用角标、右侧来源列表](seed:g02-report-citations.jpg)
*图片来源：[Thoughts Brewing](https://thoughtsbrewing.com/blog/ai-quick-tips-296-chatgpts-deep-research-upgrade)*

## 常见问题：用不了怎么办

**Q：找不到「深度研究」入口？**
- 先确认已登录，App 更新到最新版；网页端刷新或换浏览器试试；也可以直接输入 `/Deepresearch`；
- 企业 / 教育工作区的管理员可以按角色控制谁能用深度研究；
- 官方明确说深度研究并非所有国家都可用，取决于套餐和所在国家 / 地区；
- 如果打开了「锁定模式」（Lockdown Mode，设置 → 安全），深度研究等联网能力会被限制。

**Q：提示次数用完？**
把鼠标放到入口上可以看到剩余次数和下次补充的日期（下图是 2025 年的界面，数字只是该作者账号当时的情况）。用完后只能等重置，或换更高套餐。为了不浪费：一次把需求写清楚、先改计划再开跑，简单的问题用普通联网搜索就够了。

![悬停在「深度研究」上显示剩余次数与补充日期（2025 年界面）](seed:g02-remaining-count.png)
*图片来源：[The AI Break](https://theaibreak.substack.com/p/tutorial-how-to-master-deep-research)*

**Q：一直转圈或中途失败？**
先去 OpenAI 状态页（status.openai.com）看有没有故障；没有的话刷新页面，看任务是否已在后台完成。失败的任务是否返还次数，官方未公开说明，以产品内计数为准。

**Q：深度研究和 ChatGPT Work 有什么关系？**
2026 年 7 月 OpenAI 推出了 ChatGPT Work，它本身也能调研、分析并产出报告等成品。官方说明 Work 的用量与 Codex 走同一套额度结构；普通聊天里的深度研究仍看深度研究自己的计数。在 Work 里做调研具体怎么计数，官方没有逐项说明，以产品内显示为准。

**Q：Free 和 Plus 差多少？**
官方帮助只说用量按套餐不同。2025 年 4 月 OpenAI 曾公布过各套餐的次数和「轻量版」安排，但之后深度研究多次升级（2026 年 3 月还移除了旧版模式），现行帮助中心已不再列出具体数字，请以产品内计数为准。如需开通 Plus，可前往 /chongzhi/chatgpt-plus。

## 参考资料

- OpenAI 帮助中心：Deep research in ChatGPT — https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
- OpenAI 帮助中心：ChatGPT Work and Codex — https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- ChatGPT Release Notes（2026-02-10 深度研究更新、2026-03 旧版模式下线、2026-06-04 锁定模式） — https://help.openai.com/en/articles/6825453-chatgpt-release-notes
- OpenAI 服务状态 — https://status.openai.com/

---
title: Kimi浏览器插件怎么用：安装、侧边栏对话与让AI操作网页
slug: kimi-browser-extension
products: [kimi]
models: []
accountTier: FREE
excerpt: Kimi 浏览器插件（原 Kimi WebBridge）在哪下载、怎么安装、能做什么？本文按官方帮助中心讲清 Chrome / Edge 安装、侧边栏对话与本地 Agent 远程控制两种用法、把操作存成技能和常见故障处理。
checkedOn: 2026-10-11
sources:
  - https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-introduction
  - https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-how-it-works
  - https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-use-cases
  - https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-faq
---

## 适用于谁

- 搜「kimi浏览器插件」「kimi浏览器插件下载」「kimi浏览器插件chrome」「kimi浏览器助手插件」的人；
- 想让 AI 帮忙在网页上比价、填表、扒数据，或者想把每天重复的网页操作自动化的人。

本文根据 Kimi 官方帮助中心「Kimi 浏览器扩展」的四篇文章整理，资料核对于 2026-10-11，入口名称以实际界面为准。

## 结论先说

1. **它现在的正式名字是「Kimi 浏览器扩展」**，原名 Kimi WebBridge，商店里的条目名称仍是 Kimi WebBridge。
2. **支持 Chrome 和 Edge**，系统为 macOS 或 Windows；从 Chrome Web Store 或 Edge Add-ons 官方商店安装。
3. **两种用法**：点工具栏图标在浏览器侧边栏里直接对话；或者由 Kimi Work、Kimi Code、Claude Code 等本地 Agent 远程驱动它去操作网页。
4. **它用的是你浏览器里已有的登录状态**。官方说明所有执行在本地完成，登录态和网页内容不会离开你的设备。
5. 如果你印象里的 Kimi 插件是网页总结、划词这类阅读助手，要注意帮助中心现在介绍的重点是**替你操作网页**：打开页面、点击、填表、截图、提取数据。

## 步骤

### 1. 安装扩展

**从官方商店安装（推荐）**

- Chrome：在 Chrome Web Store 搜索并安装 Kimi WebBridge；
- Edge：在 Edge Add-ons 搜索并安装 Kimi WebBridge。

**打不开商店时手动安装**（官方给的步骤）

1. 到 Kimi 浏览器扩展的官网页面下载安装包并解压；
2. 在地址栏打开扩展管理页：Chrome 输入 `chrome://extensions/`，Edge 输入 `edge://extensions/`；
3. 打开「开发者模式」（Chrome 的开关在页面右上角，Edge 在左下角）；
4. 点「加载已解压的扩展程序」，选中解压出来的文件夹；
5. 把扩展固定到浏览器工具栏，方便以后点开。

只从官方商店或 Kimi 官网获取安装包。提示「无法从该网站添加应用」时，说明来源不对，回到上面两种官方方式。

### 2. 用法一：在侧边栏里直接对话

1. 点浏览器工具栏上的 Kimi 图标，展开侧边栏；
2. 登录 Kimi 账号；
3. 直接说你要它在当前网页上做什么。

官方列出的可执行操作有：打开指定网址、点击按钮和链接、填写表单、截图、读取页面的文字和表格。可以这样下指令：

```
把这个页面里的产品表格提取出来，整理成可以粘贴进 Excel 的格式，保留价格和规格两列。
```

```
比较这三个标签页里同一款耳机的价格和用户评价，告诉我差别在哪。
```

涉及提交订单、付款、发送消息这类不可撤销的动作，让它做到「填好但不提交」，最后一步自己确认再点。

### 3. 用法二：让本地 Agent 远程控制

想把网页操作编进更长的任务里（比如「查资料 → 整理成表格 → 写报告」），可以让桌面端的 Agent 驱动扩展。

**搭配 Kimi Work**（官方步骤）

1. 从官网下载 Kimi 桌面端并切换到 Work 模式；
2. 在插件市场里找到并安装「Kimi 浏览器扩展」；
3. 之后在 Kimi Work 或浏览器侧边栏里发送指令都可以。

**搭配其他本地 Agent**

官方说明支持 Claude Code、Codex、Cursor、Kimi Code 等所有本地 Agent，配置方式相同：在 Agent 里发送帮助中心提供的安装指令（一条 curl 命令），Agent 会按你的操作系统自动完成安装，连接成功后就能下达网页任务。指令内容以帮助中心页面为准，不要运行来路不明的脚本。

### 4. 把重复操作存成「技能」

这是它区别于普通网页助手的地方。官方帮助中心给了三种方式（在侧边栏里选择，或输入 `/` 调出）：

- **把操作录成技能**：你手动做一遍有固定步骤的操作（比如每天从后台导出数据），它录下来，之后一句话重放；
- **把网页变成技能**：让它分析你常用的网站（数据看板、内部系统）的结构，封装成可调用的技能；
- **把会话存成技能**：一次对话里已经跑通的流程，保存下来以后复用。

保存后的技能通过输入 `/` 调用。

### 5. 几个适合的任务

官方举的例子可以直接照着改：

- **比价**：「比较三个平台上这款耳机的价格和用户评价，告诉我哪个更值得买」；
- **租房筛选**：「在几个平台找离地铁站近、月租五千以内的两居室，并按通勤时间排序」；
- **文献调研**：「搜索近三年关于某主题的论文，整理成综述表格」；
- **出行规划**：「比较下周末去杭州的机票和酒店，并列出三天行程和预算」。

## 常见问题

**Q：会不会泄露我的登录信息？**
官方的回答是不会：所有执行在本地完成，登录态和网页内容不会离开设备，Agent 只能拿到被授权的操作结果。即便如此，网银、支付这类高敏感页面建议不要交给任何自动化工具操作。

**Q：扩展显示「未连接」？**
先确认扩展已安装。用 Kimi 桌面版的，重启桌面版后重试；用其他本地 Agent 的，在 Agent 里重新发送安装指令，运行后重启该 Agent。

**Q：提示与 Chrome 不兼容，点击、截图等操作失败？**
官方说多半是和其他插件冲突，尤其是爬虫、网站助手、录屏和 AI 辅助类插件。先关掉其他插件只留它，重启浏览器，再逐个开启找出冲突的那个。

**Q：操作偶尔失败是怎么回事？**
网页结构复杂或内容是动态加载的时候容易失败。把指令拆简单一些，或者让它先截图确认页面状态再操作。

**Q：能在多台电脑上用吗？**
可以，每台电脑都要单独安装和配置。

**Q：支持 Safari、Firefox 吗？**
官方写的是目前支持 Chrome 和 Edge，建议用最新版本。

**Q：用它要钱吗？**
帮助中心的这几篇文章没有单独说明收费。侧边栏对话需要登录 Kimi 账号，Kimi 的模型和 Agent 任务按额度计费，见《Kimi 会员怎么选》。

## 参考资料

- Kimi 帮助中心：Kimi 浏览器扩展 · 产品介绍 — https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-introduction
- Kimi 帮助中心：Kimi 浏览器扩展 · 使用步骤与工作原理 — https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-how-it-works
- Kimi 帮助中心：Kimi 浏览器扩展 · 使用案例 — https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-use-cases
- Kimi 帮助中心：Kimi 浏览器扩展 · 常见问题 — https://www.kimi.com/help/kimi-webbridge/kimi-webbridge-faq

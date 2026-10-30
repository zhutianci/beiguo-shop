---
title: Sora 官网入口在哪、现在是什么状态：官方网页和 App 已停用，作品怎么导出，怎么认假站
slug: sora-official-website-status-export
products: [chatgpt]
models: [sora]
accountTier: OTHER
excerpt: 搜 Sora 官网、Sora2 官网的人，先要知道官方 Sora 网页和 App 已于 2026-04-26 停用，API 已于 2026-09-24 停用。官方现在只提供作品导出入口 sora.chatgpt.com/sunset。本文讲导出步骤和怎么识别仿冒站点。
checkedOn: 2026-10-30
sources:
  - https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
  - https://openai.com/index/sora/
  - https://developers.openai.com/api/docs/deprecations
verify:
  - 官方帮助中心写明 Sora 网页与 App 于 2026-04-26 停用、API 于 2026-09-24 停用；官方文章没有给导出的固定截止日，只说可能提供最终导出窗口并会提前发邮件
  - 官方文章没有讨论订阅、退款与替代产品，本文不涉及
  - 导出页网址和 Export 按钮来自官方文章当天的写法，之后可能变化
---

> 本文根据 OpenAI 帮助中心《What to know about the Sora discontinuation》整理，资料核对于 2026-10-30。配图为本站整理的示意图，不是软件截图。**本文不推荐任何第三方「Sora 镜像」「Sora 中文版」网站。**

## 适用于谁

- 搜「Sora 官网」「Sora2 官网」，想找入口的人；
- 以前用 Sora 生成过视频、图片，想把作品拿回来的人；
- 看到某个站点自称「Sora 在线版」，不确定是不是官方的人。

## 结论先说

1. **官方 Sora 网页和 App 已于 2026 年 4 月 26 日停用。** 官方帮助中心的原话是「The Sora web and app experiences were discontinued on April 26, 2026」。现在不存在一个可以继续生成视频的「Sora 官网」。
2. **Sora API 已于 2026 年 9 月 24 日停用。** 详见 [/guides/sora-api-discontinued-videos-api](/guides/sora-api-discontinued-videos-api)。
3. **官方现在唯一能做的事是导出你的内容**：打开 sora.chatgpt.com/sunset，选择 Export，导出准备好后官方会发邮件通知。
4. **官方没有固定的导出截止日**，只说可能提供最终导出窗口并会提前邮件通知，建议尽快导出。
5. 官方说，停用并过了最终导出期之后，**会永久删除与你使用 Sora 相关的数据**。

![现在搜到 Sora 官网，先看这几点](seed:g1369-fake-decide.png)
*图：本站根据 [OpenAI 帮助中心：Sora 停用说明](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) 整理的示意图*

## 一、为什么搜到的「官网」可能不对

搜索结果里会混进几类页面：

- **老文章的链接**：写的是 Sora 刚发布时的入口，现在打开要么跳转，要么只剩停用说明；
- **仿冒站点**：页面做成输入提示词就能出视频的样子，实际是别的服务，或者只为收费、收集账号信息；
- **「Sora 中文版」「Sora 免登录」之类**：官方没有这些版本。

判断办法很简单：既然官方已经停用生成功能，**任何还在让你直接生成「Sora」视频的页面，都不是官方的 Sora**。涉及付款、登录的，一律不要碰。

## 二、导出作品的官方步骤

按官方文章，步骤是：

1. 打开 **sora.chatgpt.com/sunset**；
2. 登录你的账号（只在这个官方页面登录）；
3. 选择 **Export**，提交导出请求；
4. 导出准备好后，注册邮箱会收到通知；
5. 按邮件提示把文件下载保存到自己的电脑或网盘。

![导出 Sora 内容的官方步骤](seed:g1369-export-steps.png)
*图：本站根据 [OpenAI 帮助中心：Sora 停用说明](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) 整理的示意图*

官方强调：**建议尽快导出**。如果你已经错过，官方文章没有给出补救办法，只能联系官方帮助中心确认。注意别把邮件里的链接当成唯一依据：只通过官方入口操作，不要点邮件之外别人转发的「导出链接」。

## 三、导出的内容怎么保管

官方没有说明导出文件的具体格式和结构。拿到文件后建议：

- 先备份一份到另一块硬盘或网盘；
- 如果有第三方人物、品牌的内容，自己再使用或发布前先确认授权；
- 想继续做视频，转去其他官方工具，见 [/guides/ai-video-tools-which-to-choose](/guides/ai-video-tools-which-to-choose)。

## 四、想在 ChatGPT 里做视频

Sora 停用之后，ChatGPT 里能不能生成、上传视频，本站有专门的文章，按官方当前功能整理：[/guides/chatgpt-video-generate-upload](/guides/chatgpt-video-generate-upload)。

## 常见问题

**Q：Sora 以后会回来吗？**
官方文章没有说。以官方公告为准。

**Q：我订阅的 ChatGPT 套餐受影响吗？**
这篇官方文章没有讨论订阅。ChatGPT 套餐本身的说明见 [/guides/chatgpt-monthly-price-official-plans](/guides/chatgpt-monthly-price-official-plans)，开通入口 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Sora 到底是什么？**
见 [/guides/sora-what-is-it-still-available](/guides/sora-what-is-it-still-available)。

## 参考资料

- OpenAI 帮助中心：What to know about the Sora discontinuation — https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- OpenAI：Sora — https://openai.com/index/sora/
- OpenAI API 弃用页面 — https://developers.openai.com/api/docs/deprecations

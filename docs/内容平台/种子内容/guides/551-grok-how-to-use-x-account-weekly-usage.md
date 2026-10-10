---
title: Grok 怎么用：登录、和 X 的关系、文件上传、每周额度与用不了怎么办
slug: grok-how-to-use-x-account-weekly-usage
products: [grok]
models: []
accountTier: FREE
excerpt: Grok 怎么用、和 X（推特）是什么关系？按官方文档与 FAQ 讲清 grok.com 与 App 入口、X 账号怎么关联、X Premium 权益怎么带过来、文件上传限制、SuperGrok 每周统一额度怎么看和用完怎么办，以及登录、订阅不生效的排查。
checkedOn: 2026-10-11
sources:
  - https://docs.x.ai/grok/overview
  - https://docs.x.ai/grok/faq
  - https://x.ai/grok
  - https://docs.x.ai/grok/connectors
verify:
  - 免费档各项功能的具体次数官方 FAQ 未列出，只说免费档的聊天与语音有自己的上限和重置周期
  - 各付费档的价格本文不列，以官方定价页为准
  - 在 X App 内使用 Grok 的入口与权益由 X 平台决定，本文未单独核对 X 帮助中心
---

> 本文根据 Grok 官方文档《Welcome to Grok》《FAQ - Grok Website / Apps》和官网产品页整理，资料核对于 2026-10-11。Grok 是什么、各档位区别，见本站 AI 应用目录里的 Grok 条目；本文讲具体怎么用和常见问题。

## 适用于谁

- 第一次用 Grok，不清楚该去哪个网址、用什么账号登录的人；
- 搜「grok 怎么用」「grok 和 x 的关系」「grok 怎么用不了了」的人；
- 订阅了 SuperGrok 或 X Premium，权益却没生效的人。

## 结论先说

1. **入口**：网页用 **grok.com**（官方建议在 Chrome / Chromium 浏览器里打开，不要用 grok.x.ai），手机用 iOS / Android 的 Grok App。登录一次，对话、设置和订阅在各端同步。
2. **和 X 的关系**：Grok 由 SpaceXAI（原 xAI）提供，X 是另一个独立运营的平台。可以用 X 账号登录 Grok，Grok 也能实时搜索 X 上的帖子；但 **X 平台本身的问题不归 Grok 的客服管**。
3. **X Premium 的权益要手动关联**：在 grok.com 的 Settings → Account 里点 **Connect your X Account**，关联后才会识别你的 X 订阅状态并发放对应权益。
4. **免费可以开始用**；付费的 SuperGrok 各档提高上限，并且所有产品（聊天、Imagine、语音、Build）**共用一个每周额度池**。
5. 「用不了」最常见的三种原因：登录的不是购买订阅的那个账号、每周额度用完、网址或浏览器不对。

## 步骤一：注册与登录

1. 打开 grok.com，或在应用商店下载 Grok App；
2. 用 X 账号或邮箱登录（官网产品页的说法）；也支持 Apple、Google 登录；
3. 在输入框里直接提问，或切换到搜索、推理、语音、Imagine 等模式。

官网列出的基础能力包括：聊天写作、实时搜索网页与 X、分步推理、语音对话、文件与 PDF 分析、看图、跨对话记忆、自定义指令、分享对话链接等。登录方式可以在 accounts.x.ai 统一管理。

## 步骤二：弄清和 X 的关系

| 问题 | 官方说法 |
| --- | --- |
| Grok 是谁的 | SpaceXAI 的 AI 助手（官网页脚署名 SpaceXAI LLC） |
| 能在 X 里用吗 | 能。官方称之为「Grok in X」，由 SpaceXAI 在 X.com 和 X 的 App 上提供 |
| X 用不了、X 账号出问题找谁 | 找 X。官方明确说 SpaceXAI 对 X 的服务没有运营上的管理权，需要联系 X 的帮助中心 |
| X Premium 订阅的退款找谁 | 找 X，由 X 处理 |
| 订阅了 X Premium，在 grok.com 怎么拿权益 | Settings → Account → **Connect your X Account**，跳到 X 的登录页授权，关联后 SpaceXAI 才能读取你的 X 订阅状态 |
| Grok 能看到 X 上的什么 | 官网的说法是实时搜索网页和 X，用于突发新闻、趋势和帖子 |

一句话：**账号可以打通，但两边是两套服务、两套客服、两套订阅**。

## 步骤三：上传文件

- **大小**：多数文件（文档、图片、代码、音频）单个最大 150 MB；具体上限可能因平台或订阅略有不同，超限时会有明确报错。
- **能做什么**：多文件综合对比、总结与改写、提取数据和表格、看图表、调试代码、转写音视频、跨文字和图片一起推理。
- **官方的使用建议**：
  - 图片尽量用高分辨率（1000×1000 像素以上）；
  - 超过 100 页的 PDF，Grok 会侧重文字和关键图表——**提问时写明具体页码**；
  - 特别大的文档拆成几份；
  - 多种格式混着传没问题（TXT、PDF、PPTX、图片、代码）。
- **局限**：多数文档只提取文字，**非 PDF 文件里嵌入的图片可能不会被当成图像处理**；部分音视频能上传但转写质量不稳定。

想让 Grok 读邮件、网盘和日历，用连接器（Connectors）：官方文档列出了 Google Drive、Gmail 与 Google 日历、Outlook、OneDrive、SharePoint、Microsoft Teams、Salesforce 等。

## 步骤四：看懂每周额度（付费用户）

官方 FAQ 说明，自 2026 年 6 月起付费用户改用更简单的规则：**不再按产品分别设每日上限，而是一个可以随意分配的每周额度池**。

- **怎么计**：以「已用百分比」显示，并按产品细分。不同操作消耗不同——发一条聊天消息很少，生成一段高质量视频或跑一个长时间的编程任务多得多。
- **怎么看**：**Settings → Usage**（网页和手机都有）。能看到进度条、各产品（API、Build、Chat、Imagine、Voice）占比、每周重置的日期和时间、额外额度余额。
- **用完了**：付费功能暂停到下次重置；但你仍然可以使用免费档的聊天和语音额度（它们单独计算、单独重置）。还可以：
  - 购买 **Extra Usage Credits**（额外额度）立刻继续——目前**只能在网页购买**，最低 5 美元，有效期一年；
  - 升级到更高档；
  - 开启 Auto Top Up（余额低时自动充值，可设金额和每月上限）。
- **官方的提醒**：额外额度按标准价计，单次成本高于套餐内额度。偶尔超出买额度更方便；经常超出，升级更划算。

想开通 SuperGrok，可以看本站的 [/chongzhi/grok-super](/chongzhi/grok-super)。

## 用不了的排查

**订阅了却显示没订阅 / 一直让我升级**

- 订阅绑定在**购买时用的那个账号**上。网页买的、App 里看不到，多半是两边登录的不是同一个账号（比如一边用 X 登录、一边用邮箱）。官方说这是常见的混淆，不一定是重复扣费。
- 用 Apple「隐藏邮件地址」注册的，必须用 **Apple 登录**，而不是把那个中转邮箱拿去用邮箱 / Google 登录。
- 仍然弹升级提示：重启 App（或卸载重装）、退出重新登录、清缓存、更新到最新版。

**网页功能缺失、登录异常**

- 确认网址是 grok.com；官方提到用 grok.x.ai 等地址的用户会遇到功能缺失（比如没有 Projects）。
- 用 Chrome / Edge 的无痕窗口试一次，排除浏览器扩展的影响。官方特别提到广告拦截类扩展会让「Manage Subscription」按钮打不开。

**突然不能用付费功能**

- 到 Settings → Usage 看是不是每周额度用完了。

**账号被盗**

- 立即联系客服，提供用户 ID 和能证明归属的信息。官方说明客服可以取消被盗账号上的订阅；如果邮箱已被改、无法验证身份，可以删除账号后重新注册。

**找人工**

- 用产品里的 **Report an issue**，账单问题可以直接回复收据邮件。附上账号邮箱、平台、浏览器 / 系统、截图或对话分享链接。

## 常见问题

**Q：怎么取消订阅？**
看你在哪买的：网页买的在 grok.com 的 Settings → Billing 管理；App Store 买的找 Apple；Google Play 买的在 Google Play 取消。

**Q：能退款吗？**
网页和 Google Play 购买的由 SpaceXAI 处理，要通过官方的退款申请表单提交，审核通过后通常 5–10 个工作日退回原支付方式；App Store 购买的由 Apple 处理。

**Q：怎么删除账号？**
在 accounts.x.ai 的账户页操作。如果同一个账号还在用 API，API 权限会一并移除。30 天内重新登录并确认可以恢复。

**Q：Companions（伙伴角色）网页版有吗？**
没有。官方说只在 iOS App 提供，没有上网页或 Android 的计划。

**Q：Grok Studio 去哪了？**
官方 FAQ 里有专门一条说明它已不再提供访问，本站应用条目记录的官方建议是改用 Grok Build。

## 参考资料

- Welcome to Grok（官方文档）：https://docs.x.ai/grok/overview
- FAQ - Grok Website / Apps（官方文档）：https://docs.x.ai/grok/faq
- Grok 产品页（官方）：https://x.ai/grok
- Connectors（官方文档）：https://docs.x.ai/grok/connectors

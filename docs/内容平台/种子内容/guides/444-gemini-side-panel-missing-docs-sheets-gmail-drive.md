---
title: Gemini 侧边栏不见了怎么办：文档、表格、Gmail、云端硬盘里打不开的官方原因与开启条件
slug: gemini-side-panel-missing-docs-sheets-gmail-drive
products: [gemini]
models: [gemini-llm]
accountTier: PRO
excerpt: Google 文档、表格、幻灯片、Gmail、云端硬盘右上角的 Ask Gemini 侧边栏不见了、点不开？本文按官方帮助中心整理一份排查清单：账号档位够不够、智能功能有没有开、语言是否受支持、管理员有没有关，以及「其实没消失只是换了位置」的几种情况。
checkedOn: 2026-10-10
sources:
  - https://support.google.com/docs/answer/13952129
  - https://support.google.com/docs/answer/14925782
  - https://support.google.com/mail/answer/15604322
  - https://support.google.com/docs/answer/13447104
  - https://support.google.com/docs/answer/13607340
  - https://support.google.com/a/answer/15756885
  - https://support.google.com/docs/answer/16880047
  - https://support.google.com/docs/answer/13447609
  - https://support.google.com/drive/answer/14217860
  - https://support.google.com/mail/answer/16789526
  - https://support.google.com/docs/answer/14356410
verify:
  - 帮助中心没有一篇专门的「侧边栏不见了」排查文章，本文的清单是把各功能页上分散的「What you need / 用不了的原因」汇总而成
  - 个人订阅档位：方案对比表中，文档 / 表格 / 幻灯片 / 云端硬盘的 Gemini 功能只列了 Google AI Pro 和 Ultra；Gmail 的「总结和起草邮件」列了 Plus / Pro / Ultra 并带脚注
  - 官方脚注只说美国的 Google AI Pro / Ultra 订阅者「可能不再看到」Gmail 里的 Ask Gemini，其他地区是否同样处理未说明
  - 管理员「管理 Workspace 各服务中的 Gemini 功能访问权限」在管理员帮助页标注为仅 Enterprise 版本
  - 语言表里「支持 Gems」的星号没有标在英语上，英语下 Gems 是否可用官方页面未明说
  - 「Ask Gemini」在简体中文界面的译名以实际界面为准；截图为官方英文演示界面，已遮去头像
---

> 本文根据 Google 官方文档编辑器、Gmail、云端硬盘和管理员帮助中心整理，核对日期 2026-10-10。本文讲的是 **Google Workspace 应用里**（文档、表格、幻灯片、Gmail、云端硬盘）的 Gemini 侧边栏；如果你找的是 Chrome 浏览器顶部的 Gemini，见本站《Gemini in Chrome 怎么开启》。

## 适用于谁

- 搜「gemini 侧边栏不见了」「gemini 侧边栏打不开」「gemini 侧边栏消失」「gemini 侧边栏开启」的人；
- 以前文档右上角有 Gemini 图标，现在没了的人；
- 刚订阅了 Google AI 方案，或公司开通了 Workspace，却到处找不到入口的人。

## 结论先说

1. **侧边栏不是所有账号都有**。个人账号要有 Google AI 方案（文档、表格、幻灯片、云端硬盘在官方对比表里列的是 **Pro 和 Ultra**），或者加入 Workspace Experiments；工作 / 学校账号要看 Workspace 版本和管理员设置。
2. **最容易漏掉的是「智能功能」开关**。关掉「Google Workspace 中的智能功能」，侧边栏和其他 Workspace AI 功能会一起消失；在欧洲经济区、日本、瑞士、英国，这些开关默认就是关的。
3. **语言也会卡住**。侧边栏支持包括中文在内的 29 种语言；但官方写明，语言总表里没单列的功能只支持英语，需要把 Google 账号语言设成英语。
4. **有时它没消失，只是换了位置**：文档里它可能缩成了页面底部的提示栏；云端硬盘里它现在是全屏界面；Gmail 在美国可能已改为内嵌功能。
5. **「对话不见了」是另一回事**：刷新、关闭文件或离线，都会清掉侧边栏里没插入的内容。

## 一、先确认：正常情况下入口在哪

| 应用 | 入口 | 形态 |
| --- | --- | --- |
| Google 文档 | 右上角 Ask Gemini；另有页面底部的提示栏 | 右侧侧边栏 / 底部栏 |
| Google 表格 | 右上角 Ask Gemini | 右侧侧边栏 |
| Google 幻灯片 | 右上角 Ask Gemini | 右侧侧边栏 |
| Gmail | 右上角 Ask Gemini（手机 App 在搜索栏右侧） | 右侧面板，可在「侧边 / 宽」布局间切换 |
| 云端硬盘 | 右上角 Ask Gemini | 网页上打开为**全屏沉浸式界面**，左侧是来源面板 |

官方给的自查方法很简单：**打开 Gmail 或一个文档，看右上角有没有 Gemini 图标**。有，说明你的账号已具备 Google Workspace with Gemini（或 Workspace Experiments）的权限。

![云端硬盘里的 Gemini 现在是全屏界面而不是窄侧边栏：左侧管理来源和搜索范围，右侧提问（官方演示界面）](seed:g444-drive-gemini-workspace.jpg)
*图片来源：[Google 官方云端硬盘帮助中心《Get started with Gemini in Google Drive》](https://support.google.com/drive/answer/14217860)（已遮去头像区域）*

## 二、排查清单（按命中率从高到低）

### 1. 账号档位够不够

**个人 Google 账号**（官方对比表，资料核对于 2026-10-10）：

| 应用里的 Gemini | Google AI Plus | Google AI Pro | Google AI Ultra |
| --- | --- | --- | --- |
| Gmail：帮我写、邮件串 AI 概览、建议回复、校对等 | 有 | 有 | 有 |
| Gmail：侧边栏「总结和起草邮件」 | 有* | 有* | 有* |
| 文档：帮我写、写与改、总结、生成图片等 | 未列 | 有 | 有 |
| 表格：数据分析、AI 函数、增强型智能填充 | 未列 | 有 | 有 |
| 幻灯片：生成和编辑幻灯片、生成图片 | 未列 | 有 | 有 |
| 云端硬盘：Ask Gemini、AI 概览等 | 未列 | 有 | 有 |

\* 官方脚注：为了把 AI 直接做进 Gmail，**美国的 Google AI Pro 和 Ultra 订阅者可能不再看到 Ask Gemini，也无法打开 Gmail 侧边栏**；帮我写、AI 概览这类内嵌功能照常可用。也就是说，在 Gmail 里「侧边栏不见了」可能是官方的调整，而不是故障。

此外还要**年满 18 岁**。没有任何订阅的个人账号，官方只写了在美国可以免费用 Gmail 的帮我写、邮件串 AI 概览和建议回复三项，不含侧边栏。

**工作 / 学校账号**：文档、表格、幻灯片、云端硬盘的 Gemini 功能列在 Business Standard、Business Plus、Enterprise Standard、Enterprise Plus 下；Gmail 的多数功能还覆盖 Business Starter、Enterprise Starter 和 Frontline Plus。不确定自己是哪个版本就问管理员。

各档的其他差别见本站《Gemini 会员有什么区别：免费版、Google AI Plus、Pro、Ultra 功能与额度对比》；订阅在哪些国家和地区销售，见本站《Gemini 不支持所在地区是什么意思：支持哪些国家和地区、哪些功能有地区限制》。

### 2. 智能功能有没有开

Gemini 属于「**Google Workspace 中的智能功能**」这一开关管的范围。Gmail 帮助中心明确写着：关闭智能功能，会同时关掉 Gmail 侧边栏等其他 Workspace AI 功能。

打开方法（任选一处，设置对所有已登录的设备生效）：

- **Gmail**：设置 → 查看所有设置 →「常规」→「Google Workspace 智能功能」→ 管理 Workspace 智能功能设置 → 打开「Google Workspace 中的智能功能」→ 保存；
- **云端硬盘**：设置 → 设置 → 隐私权 → 管理 Workspace 智能功能设置；
- **日历 / Chat / Meet**：各自的设置里也有同名入口。官方注明，除 Gmail 外，其余几处（含云端硬盘）的这个开关只能在网页版上打开。

官方说明：住在**欧洲经济区、日本、瑞士、英国**的用户，智能功能默认关闭，需要自己打开。

### 3. 语言是否受支持

- 文档、表格、幻灯片、Gmail、云端硬盘的侧边栏都支持 29 种语言，**含中文**；Chat 的侧边栏只支持英、法、德、意、日、韩、葡、西 8 种；
- 侧边栏里的 Gems 不是每种语言都支持：官方在语言表里用星号标出了法、德、意、日、韩、葡、西这几种「支持 Gems」的语言；
- 语言总表末尾写着：**表里没有单列的其他功能只支持英语**，要用就把 Google 账号语言设为英语；
- 表格里出现「AI function not available」，官方给的原因之一就是语言设置。

所以如果入口在、但某个具体功能点不了，先去 Google 账号里看一下语言。

### 4. 管理员有没有关（工作 / 学校账号）

管理员帮助中心列出的控制项包括：

- 管理 Workspace 各服务里 Gemini 功能的访问权限（标注为仅 Enterprise 版本）；
- 为组织开启或关闭 Google Workspace 智能功能；
- 是否允许 Google AI 在会议里记笔记；
- 开启或关闭 Gemini 应用（gemini.google.com）——官方特别注明，这一项**不影响** Workspace 各应用里的 AI 功能；
- 是否启用 Beta 功能：对话历史、AI 收件箱等标注了「需要 Gemini Beta」，管理员没开就看不到。

这些你自己改不了，只能找管理员。

### 5. 个人账号的另一条路：Workspace Experiments

这是面向个人账号的受信任测试者计划，可以提前试用 Gmail、文档、表格、云端硬盘等应用里的 AI 功能。条件：年满 18 岁、是你自己管理的个人 Google 账号；**不对 Workspace 账号开放**。官方称它在 170 多个国家和地区、部分语言下提供，功能还在开发中，质量和可用性可能变化；数据处理适用它自己的隐私声明。

### 6. 文件本身的问题

- **Excel 文件**：表格的 Gemini 功能在原生 Google 表格文件里效果最好，`.xlsx` 先「文件 → 另存为 Google 表格」；
- **第三方云存储**：通过 Box、Dropbox、Egnyte 打开表格时，AI 函数不能生成内容；
- **外部共享文件**：侧边栏出现「Gemini 添加的内容可能对域外用户可见」的警告属于提示，不是故障。

### 7. 功能还没推送到你

多个功能页都写着「正在逐步推出，你可能暂时还没有」。在以上条件都满足的情况下，只能等。

## 三、其实没消失：换了位置的三种情况

1. **文档的底部提示栏**。新版文档把「写和改」放在页面底部，默认会自动收起；把鼠标移到底部的 Gemini 图标上就会出现。提示栏上有「切换到侧边栏（Switch to side panel）」，侧边栏顶部也有「切换到底部栏」，两者可以来回切；
2. **云端硬盘的全屏界面**。在网页版云端硬盘点 Ask Gemini，打开的是全屏的研究界面，不再是窄窄的一条；
3. **Gmail 的内嵌功能**。见上面的脚注：侧边栏可能被撤掉，但撰写窗口里的帮我写、邮件顶部的 AI 概览还在。

## 四、侧边栏在，但对话没了

文档、表格、幻灯片的帮助页都提醒，以下情况会丢失侧边栏里的对话：

- 刷新浏览器；
- 关闭后重新打开文件；
- 电脑离线。

所以有用的回答要及时点「插入」。另外，Google AI Pro / Ultra、Workspace Experiments 账号以及开通 Gemini Beta 的工作账号，可以在侧边栏左上角「更多选项 → History」里查看历史对话；历史按应用分开保存，文档里的对话不会出现在 Gmail 里，功能上线之前的对话也不在其中。个人账号可以把自动删除设为 3 个月、18 个月、36 个月或仅手动删除。

## 常见问题

**Q：订阅的是 Google AI Plus，文档里为什么没有 Gemini？**
官方对比表里，文档、表格、幻灯片、云端硬盘的 Gemini 功能只列在 Pro 和 Ultra 下，Plus 一栏列的主要是 Gmail 和 Vids 的功能。

**Q：刚订阅完还是没有？**
先确认登录的是订阅所用的那个账号，再检查智能功能和语言。帮助中心没有给出权益生效需要多久的说明。

**Q：gemini.google.com 能用，但文档里没有 Gemini，正常吗？**
正常。Gemini 应用和 Workspace 应用里的 Gemini 是分开控制的：前者免费账号也能用，后者要看上面的档位和开关；工作账号里两者也由管理员分别开关。

**Q：家人共享的 Google AI 方案，成员也有侧边栏吗？**
Google One 帮助中心写的是家庭方案成员可以享受「部分」AI 权益，没有逐项列出；以成员账号里实际出现的入口为准。

## 参考资料

- Get started with Google Workspace with Gemini（条件与方案对比表）：https://support.google.com/docs/answer/13952129
- Supported languages for Google Workspace with Gemini：https://support.google.com/docs/answer/14925782
- Learn about smart features & controls for Google Workspace & other Google products：https://support.google.com/mail/answer/15604322
- Get started with Google Workspace Experiments：https://support.google.com/docs/answer/13447104
- Where you can use Google Workspace Experiments：https://support.google.com/docs/answer/13607340
- Gemini AI features now included in Google Workspace subscriptions（管理员帮助）：https://support.google.com/a/answer/15756885
- Find & manage your Gemini in Workspace conversation history：https://support.google.com/docs/answer/16880047
- Write & edit with Gemini in Docs（底部栏与侧边栏切换）：https://support.google.com/docs/answer/13447609
- Get started with Gemini in Google Drive：https://support.google.com/drive/answer/14217860
- Get an AI Overview in Gmail search（关闭智能功能的影响）：https://support.google.com/mail/answer/16789526
- Collaborate with Gemini in Google Sheets：https://support.google.com/docs/answer/14356410

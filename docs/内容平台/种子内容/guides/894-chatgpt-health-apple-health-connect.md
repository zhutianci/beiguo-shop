---
title: ChatGPT 健康功能（Health）怎么用：哪些地区能用、怎么连接 Apple Health、隐私和断开设置
slug: chatgpt-health-apple-health-connect
products: [chatgpt]
models: []
accountTier: FREE
excerpt: ChatGPT 的 Health 功能能连接 Apple Health 和美国的电子病历，让回答参考你自己的数据。按 OpenAI 帮助中心：目前只向美国 18 岁以上的登录用户开放，支持网页和 iOS；连接步骤、权限设置、怎么断开、数据是否用于训练，本文逐项讲清，并说明找不到 Health 时怎么查。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/20001036-health-in-chatgpt
verify:
  - 官方写明 Health 仅向美国的 ChatGPT 用户开放（Free、Go、Plus、Pro，18 岁以上，网页和 iOS），并说明在逐步推出；这是 2026-10-14 读到的版本，开放范围可能变化，以官方页面为准
  - 官方说连接 Apple Health 需要 iPhone，网页版不能同步 Apple Health
  - 官方对「健康数据不用于训练」只说明了连接的病历和 Apple Health 信息，以及用到它们的对话；没用到这些数据的普通对话仍按你的训练设置
  - 本文不提供医疗建议，官方也明确 Health 不用于诊断或治疗
---

> 本文根据 OpenAI 帮助中心《Health in ChatGPT》整理，资料核对于 2026-10-14。三张截图引自官方文章，为英文界面。Health **不用于诊断或治疗**，本文只讲功能和设置，不提供任何医疗建议；有紧急症状请直接寻求专业救治。

## 适用于谁

- 听说 ChatGPT 有「健康」功能，想知道是什么、能不能用的人；
- 想把 Apple Health 里的睡眠、运动数据连给 ChatGPT 的 iPhone 用户；
- 已经连了，想知道数据怎么保护、怎么断开的人；
- 侧边栏找不到 Health 的人。

## 结论先说

1. **Health 是什么**：官方说它把你**选择连接**的信息汇到一起，包括 Apple Health 和支持的电子病历，经你允许后，ChatGPT 能据此给出更贴合你情况的回答和主动提醒，比如对比新旧化验结果、总结上次就诊以来的变化、看睡眠和运动的变化。
2. **谁能用**：官方原话的意思是，向**美国**的、**18 岁以上**、已登录的 ChatGPT Free、Go、Plus、Pro 用户开放，支持**网页和 iOS**，正在逐步推出，所以符合条件的人也可能暂时看不到。连接 Apple Health 需要 iPhone。**美国以外的用户，目前官方没有开放。**
3. **不连接也能问健康问题**：官方说，不连接任何东西也可以在 ChatGPT 里问健康问题；连接是为了让回答基于你自己的数据。
4. **它不是医生**：官方明确说 Health 旨在支持而不是取代医疗，**不用于诊断或治疗**。
5. **数据怎么处理**：官方说，连接的病历和 Apple Health 信息，以及用到它们的对话，**不会用于训练基础模型，也不会用于定向广告**，无论你的模型训练设置怎么选。可以随时断开，断开后同步的数据会在 30 天内从 OpenAI 系统删除。
6. **ChatGPT 只读不写**：它只能读取你连接的病历和 Apple Health 信息，不能修改它们。

## 一、哪些地区、哪些设备能用

按官方文章：

| 项目 | 官方说法 |
| --- | --- |
| 地区 | 美国 |
| 年龄 | 18 岁及以上 |
| 套餐 | 已登录的 Free、Go、Plus、Pro |
| 平台 | 网页和 iOS（官方提到版本需 ChatGPT 1.2026.188 或更新） |
| Apple Health | 仅 iPhone |
| 病历 | 支持的美国医院系统、One Medical、Function Health |
| Codex | 目前不支持 |

不在美国的读者，官方没有提供其他地区的开通方式，本站也不推荐任何改地区、绕过限制的做法。官方支持的国家和地区，见 [/guides/chatgpt-supported-countries](/guides/chatgpt-supported-countries)。

### 在美国但找不到 Health

![官方截图：ChatGPT 侧边栏点 More 后弹出的菜单里有 Health（英文界面）](seed:g894-health-sidebar-more.png)
*图片来源：[OpenAI 帮助中心：Health in ChatGPT](https://help.openai.com/en/articles/20001036-health-in-chatgpt)*

官方说：打开侧边栏，你可能需要点 **More（更多）** 菜单才能看到 Health。如果确实没有：

![找不到 Health 时的排查顺序：地区、年龄、版本、Apple Health、@Health](seed:g894-health-not-showing.png)
*图：本站根据 [OpenAI 帮助中心：Health in ChatGPT](https://help.openai.com/en/articles/20001036-health-in-chatgpt) 整理的示意图*

- 确认你符合条件：在美国、18 岁以上、已登录、用的是网页或 iOS，且 App 版本够新；
- 如果你注册在美国但仍然无法访问，官方说明是系统可能**预测你未满 18 岁**，这时可以验证年龄，让 ChatGPT 确认你满足 Health 的年龄要求，见 [/guides/chatgpt-age-verification](/guides/chatgpt-age-verification)；
- 官方说，向所有符合条件的用户推出可能需要几周。

## 二、怎么连接

官方给的开始步骤：

1. 在 ChatGPT 侧边栏打开 **Health**（可能要点 **More**）；
2. 选 **Connect Health** 或 **Get started**；
3. 选择要连接的来源：**Apple Health**、**Medical Records（病历）**或其他支持的来源；
4. 按提示完成登录和授权；
5. 等待数据同步：数据多的话，同步可能要几分钟甚至更久；
6. 更新或补充你当前的疾病情况、用药和家族史（这一步是为了让 ChatGPT 了解你的当前情况，**ChatGPT 不能修改你的医疗服务方或 Apple Health 里的记录**）。

![官方截图：iOS 里 Health 的「Connect your health data」页面，点 Continue 开始（英文界面，示例数据）](seed:g894-health-connect-screen.png)
*图片来源：[OpenAI 帮助中心：Health in ChatGPT](https://help.openai.com/en/articles/20001036-health-in-chatgpt)*

### 连接 Apple Health

首次连接时，如果你用的是最新的 ChatGPT iOS App，会被一步步引导。之后要再连：在 iOS App 里进入 **Health → 右上角「…」菜单 → Apple Health**，再选择要共享的数据类别。

### 连接病历

首次连接时同样会引导。之后添加：**Health → Accounts → Add account**，搜索你的医疗服务方，完成对方的登录和同意步骤。如果你的服务方不在列表里，官方说可以通过帮助中心联系客服，请求添加，并写明服务方名称，**消息里不要包含任何医疗信息**。

官方还特别提醒：连接后的 Health 体验是给**你自己的记录**用的；想看别人的信息，要用单独的账号，或单独的项目（只用项目内的记忆和上传文件）。

### 手表、运动和饮食 App 怎么连

官方说，WHOOP、Oura、Garmin、Strava、MyFitnessPal 这类可以连接 Apple Health 的应用，要先让它们**把数据共享给 Apple Health**，ChatGPT 连上 Apple Health 后，才能读到这些应用共享出来的信息。以 WHOOP、Oura、Garmin 为例，官方给了各自应用里的开启路径，例如 Oura：左上角菜单 → Settings → 数据共享下的 Apple Health → 开启 Connect to Health。其他应用：iPhone「设置 → 应用 → 健康 → 数据访问与设备」里选应用，再选要共享的数据。

注意：ChatGPT 只能看到应用通过 Apple Health 共享的信息，**有些应用自己的评分（比如睡眠评分、排行榜位置）可能不共享，或者算法不同**，所以和应用里看到的数字不一定一致。

## 三、用的时候

- **怎么用上你的数据**：同步好后，在 ChatGPT 的任何地方提问都可以。官方说，在相关且你允许时，ChatGPT 可能用 Health 里的数据个性化回答；用上了没有？可以在消息里加 **@Health**，明确让它用 Health；
- **Health 标签页**：用来连接和管理账号、看近期数据和趋势、浏览建议提示、查看已同步的记录、回到过去的健康对话；选中一张图表、指标或记录，可以看到个性化解释；
- **能用来做什么**：官方举的例子有：解释最近的化验结果、准备就诊时要问医生的问题、了解睡眠和运动趋势、查找照顾过敏情况的餐厅；
- **记忆**：开启记忆时，用了 Health 的对话**可以**生成记忆，让以后的聊天更贴合你；但**记忆不会直接由 Health 里同步的数据生成**。想不留记忆，可以用临时聊天或在设置里关闭记忆，见 [/guides/chatgpt-temporary-chat](/guides/chatgpt-temporary-chat)；想把健康记忆和别的分开，可以建一个单独的项目并开启项目记忆，见 [/guides/chatgpt-projects](/guides/chatgpt-projects)、[/guides/chatgpt-memory-full](/guides/chatgpt-memory-full)；
- **语音**：官方说 Health 可以和语音模式一起用，见 [/guides/chatgpt-voice-mode](/guides/chatgpt-voice-mode)；
- **使用边界**：不用于诊断和治疗。想让回答对你的就诊有帮助，可以让它帮你整理问题清单、对比数据变化，最终的判断交给医生。

## 四、隐私和权限设置

![官方截图：Health 权限页面，选项有 Always ask、Allow read actions、Allow low-risk actions（默认）、Allow all actions（英文界面）](seed:g894-health-permissions.png)
*图片来源：[OpenAI 帮助中心：Health in ChatGPT](https://help.openai.com/en/articles/20001036-health-in-chatgpt)*

- **权限怎么改**：**Settings（设置）→ Plugins → Health**，选你要的权限。官方文章写的是：2026 年 9 月起，新的 Health 连接默认沿用你全局的插件权限设置；不改的话默认是 **Allow low-risk actions（允许低风险操作）**。从截图能看到四个选项：Always ask、Allow read actions、Allow low-risk actions（DEFAULT）、Allow all actions（标注 ELEVATED RISK，即风险升高）；
- **训练和广告**：官方说，连接的病历和 Apple Health 信息，以及用到它们的对话，不用于训练基础模型，也不用于定向广告，无论你在数据控制里怎么选；没用到这些数据的普通对话，仍按你的模型训练设置，可在 **Settings → Data Controls** 改，见 [/guides/chatgpt-data-controls-privacy](/guides/chatgpt-data-controls-privacy)；
- **保护**：官方说 ChatGPT 的所有聊天在传输和存储时默认加密，Health 里连接的信息有额外的加密保护；
- **敏感操作**：在把可能泄露健康信息的内容发给其他已连接的插件之前，比如把基于 Apple Health 数据的训练计划发给跑友，会有额外的检查，部分敏感操作会先请你确认；
- **隐私声明**：Health 里的数据适用官方的 Health Privacy Notice。

### 怎么断开

- **断开病历**：Health → **Accounts** 标签 → 点要断开的账号旁的「…」→ **Remove account**；
- **断开 Apple Health**：Health → 右上角「…」→ **Apple Health** → **Disconnect**；
- 断开后界面更新可能要几秒；**同步来的数据会在 30 天内从 OpenAI 系统删除**，但**已经进入对话历史的内容会保留，直到你删除那些对话**，见 [/guides/chatgpt-delete-chats-bulk](/guides/chatgpt-delete-chats-bulk)。

### 旧的健康对话在哪

以前用过早期 Health 体验的，官方说旧的聊天和上传文件还在侧边栏 **Projects** 里的 **Health Project** 中，并保留旧版的隔离设置，比如这个项目里的记忆只在项目内使用。它和新的 Health 标签页是分开的，旧内容不会自动搬进来。

## 常见问题

**Q：中国大陆或其他国家的用户能用吗？**
按官方文章，目前只向美国用户开放。官方没有写其他地区的开通计划；开放范围随时可能变化，以官方页面为准。

**Q：ChatGPT 能给我的化验结果下诊断吗？**
不能。官方明确 Health 不用于诊断或治疗，它的作用是帮你理解、整理和准备问医生的问题。

**Q：ChatGPT 会往 Apple Health 里写数据吗？**
不会。官方说它只能读取连接的病历和 Apple Health 信息，不能更新它们。

**Q：Health 符合 HIPAA 吗？**
官方说，个人用的 Health 不用于临床或受监管机构，也不提供业务伙伴协议（BAA）。医疗机构和保险公司等需要走官方另外提供的面向医疗行业的产品。

**Q：Health 能在 Codex 里用吗？**
官方说目前不支持。

**Q：健康数据会拿去训练吗？**
官方说连接的病历和 Apple Health 信息，以及用到它们的对话，不用于训练基础模型和定向广告。其他普通对话看你的训练设置。

## 参考资料

- OpenAI 帮助中心：Health in ChatGPT — https://help.openai.com/en/articles/20001036-health-in-chatgpt

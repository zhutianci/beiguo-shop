---
title: Kimi K3 Coding Plan 是什么、怎么用：Kimi Code 会员、模型 ID、套餐价格和额度规则
slug: kimi-k3-coding-plan-kimi-code
products: [kimi]
models: []
accountTier: OTHER
excerpt: Kimi K3 Coding Plan 是什么？按 Kimi 官方文档核对：官方现在叫 Kimi Code，是 Kimi 会员权益里的编程服务，Plus 及以上才有；讲 K3 等模型 ID、国内新套餐价格、三种客户端、第三方工具接入和额度规则。
checkedOn: 2026-10-19
sources:
  - https://www.kimi.com/code/docs/en/kimi-code/models
  - https://www.kimi.com/help/kimi-code/membership-guide
  - https://www.kimi.com/code/docs/en/kimi-code/membership.html
  - https://www.kimi.com/help/membership/membership-overview
verify:
  - 官方文档没有用「Kimi K3 Coding Plan」这个名字当产品名：官方称 Kimi Code，是 Kimi 会员权益里面向开发者的编程服务；站外有文章把它叫作 Coding Plan，本文按官方名字写
  - 套餐价格取自官方会员说明页（国内新会员套餐，页面截图日期 2026-10-12）：Go 49 元、Plus 99 元、Pro 199 元、Max 699 元（连续包月）；官方说最新价格与购买资格以购买页为准
  - 国内与海外页面可能存在差异（官方文档里模型页和会员页提到的档位名称是 Plus / Pro，旧套餐名为 Andante、Moderato、Allegretto、Allegro）；海外价格官方文档未在同一页给出，本文不写
  - 新套餐是否取消周限额、仍有滚动 5 小时限额，来自 Kimi Code 官方会员权益页；旧套餐规则不变
---

> 本文根据 Kimi 官方帮助中心和 Kimi Code 官方文档整理，资料核对于 2026-10-19，价格为「2026-10 查询」。会员体系近期调整过名称，**以官方购买页和你账号里显示的为准**。其中套餐价格图来自官方帮助中心，其余为本站整理的示意图。

## 适用于谁

- 搜「kimi k3 coding plan」的人：想知道它是不是单独的套餐、多少钱；
- 想用 K3 写代码，不知道要订哪个档位的人；
- 想把 Kimi 接到 Claude Code、Codex 等工具里的开发者；
- 看过旧文章里的 Moderato、Allegretto 等档位名，现在对不上号的人。

Kimi 会员的整体介绍见 [/guides/kimi-membership-plans](/guides/kimi-membership-plans)，Kimi Code CLI 的安装和命令见 [/guides/kimi-code-cli-getting-started](/guides/kimi-code-cli-getting-started)。

## 结论先说

1. **官方名字叫 Kimi Code**，是 **Kimi 会员权益**里专为开发者提供的智能编程服务，用 Kimi 最新旗舰模型，通过桌面版、CLI、VS Code 扩展等形态提供代码阅读、文件编辑、命令执行等能力；订阅用户还能拿到 API Key，接到第三方开发工具里。
2. **不是单独买的套餐**：官方说 Kimi Code 和 Kimi 会员一起提供，**共用同一份额度**，CLI、VS Code、桌面版和第三方工具的请求都算进这份额度。
3. **哪档才有**：国内新会员套餐为 **Go、Plus、Pro、Max**。官方说 **Go 档不含 Kimi Code，Plus 及以上可以用**。
4. **价格**（官方会员页，国内，连续包月）：Go 49 元、Plus 99 元、Pro 199 元、Max 699 元；连续包年折合每月 39、79、159、559 元。
5. **模型**：官方文档里 Kimi Code 提供四个模型 ID：`k3`、`k3-256k`、`kimi-for-coding`（K2.8 Preview）、`kimi-for-coding-highspeed`（K2.7 Code 高速版）。K3 是旗舰编程模型，官方称有 2.8 万亿参数、100 万 token 上下文。
6. **新会员只剩 5 小时滚动限额**，取消了周限额，但仍受月度共享额度限制；旧套餐规则不变。

![Kimi 国内会员购买页：Go、Plus、Pro、Max 四档价格（官方截图，2026-10-12）](seed:g944-kimi-plans-official.jpg)
*图片来源：[Kimi 帮助中心：会员订阅服务权益介绍](https://www.kimi.com/help/membership/membership-overview)（官方说明截图于 2026 年 10 月 12 日）*

## 一、模型 ID：该填哪个

官方模型配置页写明，Kimi Code 当前提供 K3、K2.8 Preview、K2.7 Code HighSpeed 三个模型，对应四个模型 ID：

![Kimi Code 的 4 个模型 ID 与可用范围](seed:g944-kimi-code-model-ids.png)
*图：本站根据 [Kimi Code 官方文档：Model Configuration](https://www.kimi.com/code/docs/en/kimi-code/models) 整理的示意图*

几点官方说明：

- **K3**：官方称是最强的旗舰编程模型，2.8T 参数、100 万上下文；推理强度支持 low、high、max，默认 high；支持图片和视频输入；
- **k3-256k**：K3 的 256K 上下文版；256K 以内效果与 K3 相同，**用 k3（1M）的消耗约是 k3-256k 的两倍**，适合日常问答、代码补全、少量文件修改；只支持图片，不支持视频；
- **kimi-for-coding**：官方说已原地升级为 K2.8 Preview，性能接近 K3、思考更高效，擅长代码补全和常规开发，最高 1M 上下文，推理强度默认 max；
- **kimi-for-coding-highspeed**：K2.7 Code 的高速版，编码能力相同，输出快约 5 到 6 倍，但**配额消耗约 3 倍**；
- **关闭思考时**：对 K3 系列和 K2.8 Preview 的请求会由 K2.8 Preview（非思考模式）处理；
- **填模型 ID，不是版本名**：填「K3」「K2.8 Preview」会调用失败；
- **切模型后开新会话**：切换模型会让之前建立的上下文缓存失效，官方建议新开会话，否则会看到用量突然变高。

401 报错多半是权限不够：套餐不够（没有 K3 权限）、没有 1M 上下文权限（Plus 上 K3 最多 256K，1M 要 Pro 及以上）、没有高速版权限。

## 二、套餐与价格

官方会员页的新套餐（国内）：

| 套餐 | 连续包月 | 连续包年总价 | 年付折合每月 | Kimi Code |
| --- | --- | --- | --- | --- |
| Go | 49 元/月 | 468 元/年 | 39 元 | 不支持 |
| Plus | 99 元/月 | 948 元/年 | 79 元 | 支持 |
| Pro | 199 元/月 | 1,908 元/年 | 159 元 | 支持 |
| Max | 699 元/月 | 6,708 元/年 | 559 元 | 支持 |

- 官方说所有会员功能（网站部署、深度研究、PPT、Kimi Code、Kimi Work、K3 等）**共用一个额度池，按实际 token 消耗扣除**，任一功能用尽额度都会影响其他功能；
- 旧套餐 Andante、Moderato、Allegretto、Allegro 的用户**名称、权益规则和自动续费保持不变**，不必为了继续使用而切换；旧套餐 Andante 及以上仍可用 Kimi Code，保留 5 小时限额和周限额；
- 升级会员：在 kimi.com 点左下角头像 → 会员计划，选新计划、完成支付，按当前会员剩余天数折算，新权益当天生效；
- 官方说付费服务属于虚拟服务，成功购买开通后原则上不可退费或转让，购买前请核对权益、价格和期限。

## 三、怎么开始用

![Kimi Code 上手 5 步](seed:g944-kimi-code-steps.png)
*图：本站根据 [Kimi Code 官方文档：概览与模型配置](https://www.kimi.com/help/kimi-code/membership-guide) 整理的示意图*

官方提供三种客户端，登录 Kimi 账号即可，不用手动管 API Key：

- **Kimi Code Desktop**：图形界面，支持 macOS 和 Windows，适合想在界面里管理项目和会话的人；
- **Kimi Code CLI**：终端使用，安装后运行 `kimi`，第一次用 `/login` 登录；官方说 CLI 已升级为 Node.js 版本，旧的 Python 版不再维护；
- **Kimi Code for VS Code**：在扩展市场搜「Kimi Code」安装，通过侧边栏登录；JetBrains、Zed 等可通过 CLI 的 ACP 协议接入。

切换模型：桌面版在输入区的模型选择器里选；CLI 里输入 `/model`；VS Code 在输入栏下拉菜单里选；没看到最新模型，就重启应用或重新登录（CLI 里先 `/logout` 再 `/login`）。

## 四、接到第三方工具

官方说，Kimi Code API 同时兼容 OpenAI 和 Anthropic 两种协议：

| 协议 | 国内 Base URL | 海外 Base URL |
| --- | --- | --- |
| OpenAI 兼容 | `https://api.kimi.com/coding/v1` | `https://api.kimi.ai/coding/v1` |
| Anthropic 兼容 | `https://api.kimi.com/coding/` | `https://api.kimi.ai/coding/` |

步骤：到 Kimi Code 控制台创建 API Key（最多 5 个，仅创建时显示一次，请妥善保存），把 Base URL、API Key 和模型 ID 填进工具（官方有 Claude Code、OpenCode、Codex 的接入文档）。

官方特别提醒：使用时**请保持工具的真实身份标识，篡改客户端标识（User-Agent）将被视为违规，可能导致会员权益暂停**。另外官方说明：Kimi Code 会员是按月或按年订阅、有频控的权益，适合终端或 IDE 里的 Agent 编程；要把大模型能力集成进自己的产品，或需要团队协作和用量管理，应该用 Kimi 开放平台（按量付费）。Kimi API 的用法见 [/guides/kimi-api-key-quickstart](/guides/kimi-api-key-quickstart)。

## 五、额度规则

- **新会员（Plus 及以上）**：没有周限额，保留**滚动 5 小时限额**：短时间请求太多会被限速，窗口滚过后自动恢复；
- **旧套餐会员**：每 7 天按订阅日自动刷新额度，未用完的不结转，同样有 5 小时滚动窗口；
- **月度共享额度**：新旧套餐都受限，月度总额度用完，Kimi Code 额度会被冻结，到下次刷新或升级才恢复；
- **多设备共享**：所有登录设备和 API Key 共用一份额度；超过 30 天不活跃的设备会自动解绑，运行 `/login` 可恢复；
- **查看额度**：Kimi 网页或 App 的「设置 → 订阅」，Kimi Code 控制台，或在 CLI 里输入 `/usage`；
- **额度用完**：可以等刷新、升级、或开通按量付费的「加油包」（Extra Usage）；官方说加油包按实际用量计费，价格接近 Kimi 开放平台官方 API，用量大时升级订阅通常更划算，最低充值 25 元。

## 常见问题

**Q：K3 一定要订 Kimi Code 才能用吗？**
Kimi 网页和 App 里的 K3 按会员额度计费，见 [/guides/kimi-membership-plans](/guides/kimi-membership-plans)；Kimi Code 是面向编程场景的会员权益，只有 Plus 及以上档位包含。

**Q：我是旧套餐用户，需要换吗？**
官方说迁移是可选的，旧套餐会一直续费，按需决定。

**Q：Kimi 和 DeepSeek、Claude Code 哪个更适合写代码？**
各家都有自己的工具与计费，见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price) 和 [/guides/claude-code-getting-started](/guides/claude-code-getting-started)。AI 会员充值的总览可以看本站的 [/chongzhi](/chongzhi)。

## 参考资料

- Kimi Code 官方文档：Model Configuration — https://www.kimi.com/code/docs/en/kimi-code/models
- Kimi 帮助中心：Kimi Code 概览 — https://www.kimi.com/help/kimi-code/membership-guide
- Kimi Code 官方文档：Membership Benefits — https://www.kimi.com/code/docs/en/kimi-code/membership.html
- Kimi 帮助中心：会员订阅服务权益介绍 — https://www.kimi.com/help/membership/membership-overview

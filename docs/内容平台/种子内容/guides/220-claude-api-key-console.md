---
title: Claude API Key 怎么获取：Claude Console 创建密钥、充值与用量查看
slug: claude-api-key-console
products: [claude]
models: []
accountTier: OTHER
excerpt: Claude API Key 在 Claude Console（platform.claude.com）里创建。本文讲注册、创建密钥、三种密钥类型、预付费额度怎么买、用量页怎么看、密钥安全，以及 Claude Pro 订阅为什么不包含 API。
checkedOn: 2026-10-07
sources:
  - https://platform.claude.com/docs/en/get-api-key
  - https://platform.claude.com/docs/en/get-started
  - https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage
  - https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console
  - https://support.claude.com/en/articles/9534590-cost-and-usage-reporting-in-the-claude-console
  - https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure
  - https://support.claude.com/en/articles/8384961-what-should-i-do-if-i-suspect-my-api-key-has-been-compromised
  - https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces-in-the-claude-console
  - https://support.claude.com/en/articles/8987200-can-i-use-the-claude-api-for-individual-use
  - https://support.claude.com/en/articles/8987223-can-i-have-a-claude-account-and-a-console-account
  - https://www.anthropic.com/supported-countries
verify:
  - 用量页截图为帮助中心 2025 年的配图，Console 界面可能已更新
  - API 具体单价以官方定价页为准，本文不列价格
---

> 本文根据 Claude API 官方文档和 Claude 帮助中心整理，核对日期 2026-10-07；截图引用自 Claude 帮助中心并注明出处。Console 界面会更新，菜单以实际为准。

## 适用于谁

- 想用 Python、Node.js 等程序调用 Claude，或者在第三方工具里填 Claude API Key 的开发者；
- 搜「claude api key 获取」「claude console 是什么」「claude console 充值」的人；
- 已经买了 Claude Pro，搞不清为什么还要另外付 API 费用的人。

## 结论先说

1. **API Key 在 Claude Console 里创建**：登录 platform.claude.com → Settings → API keys → Create key。密钥以 `sk-ant-` 开头，**只在创建时完整显示一次**，丢了只能新建。
2. **Claude 订阅（Pro / Max / Team / Enterprise）和 Console 是两个独立产品**：订阅不包含 API 使用权，API 要在 Console 单独付费。
3. Console 大多数组织用**预付费额度（prepaid credits）**：先买额度再用；额度用完就不能再调用 API。官方说明额度自购买之日起一年过期、购买后不退款。
4. 用量和花费在 Console 左侧的 **Usage / Cost** 页查看，可以按工作区、模型、API Key 筛选并导出 CSV。
5. Claude API 和 Console 只在 Anthropic 支持的国家和地区提供，中国大陆目前不在列表中（见 https://www.anthropic.com/supported-countries ），请遵守所在地法律和服务条款。

## 步骤

### 1. 注册 / 登录 Claude Console

打开 platform.claude.com 登录，没有账号就按页面提示创建。Console 是 Anthropic 的开发者平台，用来管理 API Key、额度、用量、团队成员和工作区，也可以在 Workbench 里直接试提示词。

官方说明同一个邮箱可以同时拥有 Claude（聊天）账号和 Console 账号，两者独立运作。

### 2. 创建 API Key

1. 进入 **Settings → API keys**；
2. 点 **Create key**，给密钥起名、选择**过期时间**，把 **Linked account** 设为你自己或某个服务账号，还可以限定在某个工作区内使用；
3. 复制完整密钥，存进密码管理器或密钥管理系统。**页面关闭后就再也看不到完整密钥了。**

如果 Create key 按钮是灰的，说明你在这个组织里的角色没有创建密钥的权限，请组织管理员调整角色或替你创建服务账号密钥。

**三种密钥类型怎么选（官方说明）：**

| 类型 | 特点 | 适合 |
| --- | --- | --- |
| 个人密钥（personal key） | 代表你本人；你离开组织后自动失效 | 自己开发调试 |
| 服务账号密钥（service account key） | 代表一个服务账号 | CI 流水线、线上服务、智能体等共享场景 |
| 工作区密钥（workspace key） | 旧式密钥，没有所有者，属于创建它的工作区，创建者离开后仍有效 | 官方建议优先用前两种 |

### 3. 在代码里使用

官方推荐把密钥设成环境变量，SDK 会自动读取 `ANTHROPIC_API_KEY`：

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

直接发 HTTP 请求时，把密钥放在 `x-api-key` 请求头里。用 curl 测试第一个请求（官方快速开始示例）：

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-5-5",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "用一句话介绍你自己"}]
  }'
```

返回的 JSON 里，`content` 是回复内容，`usage` 是本次消耗的输入 / 输出 token 数。用 Python SDK 的完整入门详见本站《Claude API Python 入门：安装 SDK、第一个请求、流式输出与多轮对话》。

### 4. 购买额度（充值）

1. 用有 **Admin 或 Billing 角色**的账号登录 Console；
2. 进入 **Settings → Billing**，点 **Buy credits**；
3. 输入金额并确认，额度立即到账。同一页面能看到余额和消耗情况。

官方说明的计费规则：

- 只对**成功的** API 调用和完成的任务计费，失败的请求不收费；但如果请求本来会成功、只是你的客户端中途断开或超时，仍然会计费；
- 额度覆盖 API 调用、Workbench（playground）以及用 Console 账号登录的 Claude Code；
- **额度购买一年后过期，不能延期；所有额度购买都不退款**；
- 可以开启 **Auto-reload**：余额低于你设定的阈值时自动补充到指定金额；
- 部分通过销售团队签约的组织采用**按月账单**（先用后付），而不是预付费。

API 的具体单价按模型不同，见官方定价页（claude.com/pricing 的 API 部分），本文不列价格。

### 5. 查看用量和花费

Console 左侧导航的 **Usage** 和 **Cost** 页（Developer、Billing、Admin 角色可见）：

- 按工作区、API Key、模型、月 / 日 / 小时查看输入、输出 token；
- 查看因为速率限制被拦下的请求、每分钟 token 用量相对速率上限的情况；
- 导出 CSV 做进一步分析。

![Claude Console 的 Usage 页面：可按工作区、API Key、模型和时间筛选，图表显示每日 token 用量，下方是被速率限制拦截的请求统计](seed:g220-console-usage.png)
*图片来源：[Claude 帮助中心《Cost and Usage Reporting in the Claude Console》](https://support.claude.com/en/articles/9534590-cost-and-usage-reporting-in-the-claude-console)*

### 6. 用工作区隔离项目

工作区（Workspaces）是 Console 组织里按用途划分 API 资源的空间，比如「测试」「线上」分开，各自有成员和密钥。只有组织管理员能新建工作区（Settings → Workspaces → Add Workspace），每个组织最多 100 个；默认工作区不能编辑或删除。如果一个密钥能用于多个工作区，每次请求还要带上 `anthropic-workspace-id` 请求头。

## 密钥安全

官方把 API Key 比作信用卡号：别人拿到就能用你的额度。官方建议：

- **不要分享**：不要发到论坛、邮件、工单里，也别把密钥交给不信任的第三方工具——把密钥填进第三方平台，等于把你的 Console 账号交给了它的开发者；
- **不要写进代码**：用环境变量或云平台的密钥管理；本地用 `.env` 文件时一定把它加入 `.gitignore`；
- **监控用量**：定期查看 Usage；合理设置自动充值的上限，它也是防止密钥泄露后被刷爆的一道保险；
- **定期轮换**：比如每 90 天新建密钥、停用旧密钥；
- **怀疑泄露时立刻删除**：在 API keys 页面点密钥旁的「…」菜单选择删除，再新建一个；仍有可疑调用就联系官方支持。

## 常见问题

**Q：我买了 Claude Pro / Max，能拿到 API Key 吗？**
不能。官方明确说付费订阅只增强聊天体验（网页、桌面、手机），**不包含 API 或 Console 的使用权**；两者都要的话需要分别开通。需要订阅的话可以在本站开通：[/chongzhi/claude-pro](/chongzhi/claude-pro)。

**Q：Claude Code 可以用 API Key 吗？**
可以。首次运行 Claude Code 时选择 Console 账号登录，或者设置 `ANTHROPIC_API_KEY` 环境变量，用量从 Console 额度里扣。注意环境变量里的 API Key 优先级高于订阅登录，有订阅又误设了 Key 会导致「余额不足」等报错，详见本站《Claude Code 常见报错与解决：403、400、Error editing file、command not found》。

**Q：额度用完了会怎样？**
API 和 Workbench 都无法再调用，直到你补充额度。开启自动充值可以避免中断。

**Q：个人能用 API 吗？Claude 账号和 Console 账号能用同一个邮箱吗？**
帮助中心的答复是：个人和爱好者都可以使用 Claude API，但无论个人还是公司，API 的使用都受 Anthropic《商业服务条款》（Commercial Terms of Service）约束。Claude 账号和 Console 账号可以用同一个邮箱注册，两者独立运作。

**Q：Admin API 能找回丢失的密钥吗？**
不能。官方说明 Admin API 只返回密钥的部分提示信息，无法恢复丢失的密钥，只能在 Console 新建。

## 参考资料

- Get your Claude API key（官方）：https://platform.claude.com/docs/en/get-api-key
- Get started with Claude（官方）：https://platform.claude.com/docs/en/get-started
- How do I pay for my API usage?（帮助中心）：https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage
- 为什么付费订阅还要单独为 API 付费（帮助中心）：https://support.claude.com/en/articles/9876003
- Cost and Usage Reporting in the Claude Console（帮助中心）：https://support.claude.com/en/articles/9534590-cost-and-usage-reporting-in-the-claude-console
- API Key Best Practices（帮助中心）：https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure
- 支持的国家和地区（官方）：https://www.anthropic.com/supported-countries

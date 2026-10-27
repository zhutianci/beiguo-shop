---
title: ChatGPT Business 怎么开通、怎么加成员：席位、角色、邀请和 CSV 批量导入的官方步骤
slug: chatgpt-business-sign-up-add-members
products: [chatgpt]
models: []
accountTier: TEAM
excerpt: ChatGPT Business（原 Team）怎么开通、怎么邀请同事？官方步骤是登录后选 Business、选席位和计费方式、结账，再到工作区设置的 Members 里邀请。本文按官方帮助中心整理席位、角色和批量导入，价格标注 2026-10 查询。
checkedOn: 2026-10-28
sources:
  - https://help.openai.com/en/articles/8980713
  - https://help.openai.com/en/articles/8792828-chatgpt-business-overview
  - https://help.openai.com/en/articles/8542216
verify:
  - 价格是官方页面 2026-10 的写法，会因国家和币种不同，Premium 席位也可能调整，以官方定价页为准
  - 官方帮助中心页面当天显示刚更新过，席位规则有过调整，以最新版为准
  - 本文没有写支付方式、发票和采购流程，官方说这类需求要走销售渠道的合同方案
---

> 本文根据 OpenAI 帮助中心《Sign up for ChatGPT Business》《ChatGPT Business overview》《Managing members, seat types, and roles》整理，资料核对于 2026-10-28。价格只写官方页面标明的数字并标 2026-10 查询，以官方定价页为准。配图为本站整理的示意图，不是网页截图。

## 适用于谁

- 想给团队开通 ChatGPT Business 的人；
- 开通后不知道怎么邀请同事、怎么分配席位的人；
- 想弄清 Business 和原来的 Team 是什么关系的人。

## 结论先说

1. **Business 就是原来的 ChatGPT Team**，2025 年 8 月 29 日改名。
2. **开通步骤**：在浏览器打开 ChatGPT Business 注册页 → 用要使用的账号登录 → 如果出现套餐选项，选 Business → 核对席位、计费周期、付款信息和总价，完成结账 → 按提示完成设置并邀请队友。
3. **新建账号至少买 2 个付费席位**（可以是两个 Standard、两个 Premium，或各一个），上限 200 个席位。
4. **你开通后是工作区所有者（Owner）**，之后可以按角色和席位类型邀请成员。
5. **席位和成员是两回事**：席位是工作区里的付费容量，所有者买席位后再分配给成员，发出邀请不会买下或预留席位。

![ChatGPT Business 开通 4 步](seed:g1224-signup-steps.png)
*图：本站根据 [OpenAI 帮助中心：Sign up for ChatGPT Business](https://help.openai.com/en/articles/8980713) 整理的示意图*

## 一、席位类型和价格（2026-10 查询）

![Business 的两种席位](seed:g1224-seats-compare.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Business overview](https://help.openai.com/en/articles/8792828-chatgpt-business-overview) 整理的示意图*

官方说明：Standard 和 Premium 席位都包含 ChatGPT、ChatGPT Work 和 Codex，区别是用量。Premium 的用量是 Standard 的 5 倍，且没有 5 小时用量窗口。一个工作区可以全是 Standard、全是 Premium，或混合。**买更多 Standard 席位不会把你自己的席位升级成 Premium**，要 Premium 就选或申请 Premium 席位。价格会因国家和币种而异，以官方定价页为准。

另外官方提到：超出包含用量后可以用灵活定价购买工作区点数（credits）。Business 订阅**不含 API**，API 单独计费。

## 二、开通后怎么加成员

官方《Managing members, seat types, and roles》的步骤：

1. 进入 Business 工作区；
2. 打开 **Workspace settings > Members**；
3. 点 **Invite member**；
4. 导入 CSV，或手动输入邮箱；
5. 所有者可以为每个邀请选角色和席位类型；管理员和普通成员只能邀请「成员」角色，用工作区默认席位类型；
6. 确认默认席位类型（Standard 或 Premium）后发出邀请。

**发出邀请不会买下或预留席位**，席位是否可用在对方接受邀请时才检查。如果请求的席位类型没有了，被邀请人可以点 **Request to join**，由所有者增加席位或购买后再批准。**邀请的人应该是团队里长期的成员**，官方警告：违反服务协议滥用席位分配，可能导致工作区被停用或账号被暂停。

### CSV 批量导入

格式是 `email,role,seat type`，例如：

```text
user1@company.com,member,standard
admin@company.com,admin,premium
```

角色可选 member、admin、owner、analytics_viewer；席位类型可选 standard、premium；不区分大小写。角色没写或不认识会按「成员」处理；没写席位类型就用默认值。上传 CSV 不会让你获得额外的邀请权限。

## 三、四种内置角色

| 角色 | 官方说明 |
| --- | --- |
| Owner（所有者） | 完全访问，包括账单、身份管理、工作区配置，可邀请其他角色 |
| Admin（管理员） | 协助管理用户和日常管理任务 |
| Analytics Viewer | 有限权限，查看工作区信息和分析 |
| Member（成员） | 完整使用 ChatGPT 并可创建 GPT，没有管理权限 |

只有所有者能改成员角色、更换成员的席位类型、邀请新的管理员或所有者；管理员可以取消邀请、移除用户、设置支出控制。成员可以在席位为 Standard 时申请升级 Premium。

## 四、加入已有工作区，个人账号怎么办

官方说明：如果你的公司已经有 Business 工作区，向所有者要邀请，用收到邀请的邮箱接受。**加入 Business 不会自动迁移你的内容，也不会取消你的个人订阅。** 之后可以选择把个人工作区保持独立，或合并进 Business；合并没有撤销选项，不能把 Business 的内容再移回个人空间。你私人的聊天不会自动被其他成员看到。

## 五、不适合自助 Business 的情况

官方明确：需要发票、采购单、银行转账、电汇、ACH、账期、分期付款、零数据保留、BAA 等销售主导方案的，应使用合同形式的方案，而不是自助 Business。Business 和个人套餐、Enterprise 的对比见 [/guides/chatgpt-business-vs-plus](/guides/chatgpt-business-vs-plus)、[/guides/chatgpt-business-vs-pro](/guides/chatgpt-business-vs-pro)、[/guides/chatgpt-enterprise-vs-business-team](/guides/chatgpt-enterprise-vs-business-team)。

## 常见问题

**Q：只有我一个人，能开 Business 吗？**
官方要求新账号至少 2 个付费席位，一个人通常更适合个人套餐，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；想开通 Plus 可看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

**Q：Business 里能用 Codex 吗？**
官方说 Standard 和 Premium 席位都包含 ChatGPT Work 和 Codex，见 [/guides/chatgpt-and-codex-merged-relationship](/guides/chatgpt-and-codex-merged-relationship)。

**Q：工作区因停付被停用了？**
官方说用所有者账号登录，在个人资料菜单里找到该工作区，如有 **Reactivate workspace** 就按提示操作；另建一个新工作区不会恢复原来的订阅和数据。

## 参考资料

- OpenAI 帮助中心：Sign up for ChatGPT Business — https://help.openai.com/en/articles/8980713
- OpenAI 帮助中心：ChatGPT Business overview — https://help.openai.com/en/articles/8792828-chatgpt-business-overview
- OpenAI 帮助中心：Managing members, seat types, and roles in ChatGPT Business — https://help.openai.com/en/articles/8542216

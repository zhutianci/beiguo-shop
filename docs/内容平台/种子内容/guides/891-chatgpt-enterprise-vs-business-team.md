---
title: ChatGPT 企业版 Enterprise 是什么、和团队版 Business（原 Team）有什么区别、怎么买
slug: chatgpt-enterprise-vs-business-team
products: [chatgpt, codex]
models: []
excerpt: 搜「ChatGPT 企业版」「团队版」「Enterprise 价格」，先分清两个套餐：Business 就是原来的 Team，可以自助开通；Enterprise 面向组织，个人不能直接注册，要联系销售团队。本文按官方帮助中心讲区别、什么情况该选哪个、公司已开通后怎么加入。
checkedOn: 2026-10-14
sources:
  - https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise
  - https://help.openai.com/en/articles/8792828-chatgpt-business-overview
  - https://help.openai.com/en/articles/8542115-chatgpt-business-general-faq
  - https://chatgpt.com/business/enterprise/
verify:
  - 官方帮助中心没有公布 Enterprise 的价格，正文写的是「取决于协议」，没有给任何数字；Business 席位价格来自官方概览页，2026-10 查询，因国家和币种不同
  - Business 每个订阅最多 200 个付费席位，官方写明从 2026-08-24 起生效，此前创建的工作区保留原上限
  - 发票、采购单、BAA、零数据保留等，官方只写了「自助 Business 不提供，要走合同方案」，没有逐项列出 Enterprise 的具体条款，以与销售团队签的协议为准
  - 帮助中心文章更新很频繁，席位类型和价格可能随时调整
accountTier: TEAM
---

> 本文根据 OpenAI 帮助中心《What is ChatGPT Enterprise?》《ChatGPT Business - Overview》《ChatGPT Business: General FAQ》和 ChatGPT Enterprise 官方产品页整理，资料核对于 2026-10-14。这几篇官方文章没有配界面截图，配图是本站整理的示意图，不是软件截图。套餐、席位和价格经常调整，请以官方页面和销售团队给出的方案为准。

## 适用于谁

- 公司想给员工统一开 ChatGPT，分不清「团队版」「企业版」「Business」「Enterprise」的人；
- 搜「ChatGPT team 和 plus 的区别」，发现 Team 找不到了的人；
- 公司已经买了 Enterprise，自己不知道怎么进工作区的人；
- 想知道「Enterprise 多少钱」的人。

## 结论先说

1. **「团队版」就是 Business。** 官方说明：ChatGPT Team 在 2025 年 8 月 29 日改名为 ChatGPT Business，现有 Team 工作区直接变成 Business 工作区，不用重新开通，**改名本身不改变套餐的功能、价格和用量限制**。
2. **Business 是自助的**：在自己的 ChatGPT 账号里就能创建工作区，官方描述为「面向希望拥有共享 ChatGPT 工作区的团队的自助计划」，至少要有 2 个付费席位。
3. **Enterprise 是面向组织购买的**：官方原话的意思是「在组织层面采购，个人用户不能直接注册 Enterprise」。入口是联系 OpenAI 销售团队。
4. **价格**：Business 的席位价格官方公布了（见下文）；**Enterprise 官方页面不公布价格**，席位类型和计费方式取决于你们和 OpenAI 签的协议，所以「ChatGPT Enterprise 价格」没有一个统一数字，只能问销售团队。
5. **该选哪个**：几个人到几十人的团队想自己开通，先看 Business；需要更大的席位规模、发票或采购单付款、BAA、零数据保留等「合同方案」里的东西，官方建议走 Enterprise 这类销售渠道。
6. **个人用户都不适用。** 这两个都不是个人套餐，个人看 Plus、Pro 等，见 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)。

![Business（原 Team）和 Enterprise 的主要区别对比](seed:g891-business-vs-enterprise.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Business - Overview](https://help.openai.com/en/articles/8792828-chatgpt-business-overview) 与 [What is ChatGPT Enterprise?](https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise) 整理的示意图*

## 一、Business（原 Team）：自助的团队工作区

官方概览页对 Business 的描述是：一个让团队共享的 ChatGPT 工作区，提供协作环境、对前沿模型的充足访问、统一计费、成员与角色管理、用量可见性和支出控制，并按席位类型提供 ChatGPT 和 Codex 的访问。

**席位和价格**（官方概览页，美元，2026-10 查询，不同国家和币种会不同）：

| 席位 | 月付 | 年付（按月折算） | 包含 |
| --- | --- | --- | --- |
| Standard | 25 美元 / 人 / 月 | 20 美元 / 人 / 月 | ChatGPT、ChatGPT Work、Codex |
| Premium | 125 美元 / 人 / 月 | 100 美元 / 人 / 月 | 同上，用量更高 |

- **Premium 的差别**：官方写的是比 Standard 多 5 倍用量、没有 5 小时用量限制，并且可以在一个工作区里混搭、分配和重新分配席位类型；
- **至少 2 个席位**：Standard 和 Premium 加起来至少 2 个，两个都是 Standard、两个都是 Premium，或者各 1 个，都满足；
- **席位上限**：官方说明，从 2026 年 8 月 24 日起，一个 Business 订阅最多 **200 个**付费席位（含没分配出去的席位），此前创建的工作区保留原来的上限；客服无法替你调高；
- **谁能买席位**：只有工作区所有者能购买、增减、分配席位；管理员可以管邀请和日常的成员设置；
- **加席位**：立即按比例补扣当期费用；**减席位**：从下一个计费周期开始生效；
- **用量不够**：可以用「灵活定价」买工作区点数，超出包含的用量部分再用点数。

**隐私**：官方写明 OpenAI 不会用你工作区的数据训练模型；每位成员有自己的聊天和 Codex 历史，默认情况下管理员和所有者看不到所有成员的私人对话。

**不包含的东西**：Business 订阅**不含 API 用量**，API 另外计费，也不能把 API 额度转给 Business；官方还明确说，需要**发票付款、采购单、银行转账、电汇、ACH、账期、拆分付款、零数据保留、BAA** 或其他销售渠道方案的，要用合同方案，而不是自助的 Business。

Business 和个人 Plus 的逐项对比，见 [/guides/chatgpt-business-vs-plus](/guides/chatgpt-business-vs-plus)，这篇不再重复。

## 二、Enterprise：卖给组织的托管方案

官方帮助中心把 Enterprise 描述为「面向组织的托管 ChatGPT 套餐」，把企业级的隐私和安全、集中的管理控制和高级功能放在一起。官方列出的内容包括：

- 企业级的隐私和安全控制；
- 集中的成员管理和工作区管理；
- 面向工作场景的高级工具和更高用量的工作流程；
- 管理功能：**域名验证、SSO、SCIM、用量洞察**；
- 更长的上下文窗口、高级数据分析和定制选项。

官方产品页上还强调：默认情况下业务数据（包括对话、文件和 ChatGPT 的输出）不会用于训练模型；管理员可以在整个工作区管理谁能使用智能体、已连接的工具；支持合规相关的 API 可见性；提供 7x24 小时技术支持（含服务级别协议），并可升级为高级服务计划。

**席位类型取决于协议。** 官方帮助中心写的是：你的组织有哪些席位类型、怎么计费，要看你们的协议。对于按点数计费的 Enterprise 协议，文章里描述了两种席位：

- **标准 ChatGPT 席位**：包含 ChatGPT，以及 GPTs、Projects、Apps、Company Knowledge、ChatGPT Agent、Deep Research，还有 Codex；包含基础用量，超出部分可以用工作区点数；
- **Codex 席位**：只能用 Codex，**不含 ChatGPT**，在这类协议下是按用量计费的席位，没有固定的每人每月费用，需要工作区点数。如果被分配了 Codex 席位的人去访问 ChatGPT，会被告知他们的席位类型不能使用 ChatGPT；升级成标准席位才能两个都用。

官方还写明，部分符合条件的 Enterprise 协议可以采用按 token 的计费，用美元结算；这个选项目前不对 ChatGPT Edu 和医疗版开放。

### Enterprise 和 Edu 的关系

官方说，帮助中心里有时把 Enterprise 账号写成 Enterprise/Edu，**Edu 是 Enterprise 的一种变体，专门面向教育机构**。想了解教育版，见 [/guides/chatgpt-student-discount-edu](/guides/chatgpt-student-discount-edu)。

### Enterprise 怎么买

官方给的步骤：

1. 联系 OpenAI 销售团队；
2. 在表单里把「感兴趣的产品」选为 ChatGPT Enterprise；
3. 填写其余信息并提交，OpenAI 的代表会跟你沟通需求，匹配合适的方案。

没有「自助下单」按钮，价格、席位、合同条款都在这个沟通过程里确定。

![我该选 Business 还是 Enterprise：按需求对照](seed:g891-which-plan.png)
*图：本站根据 [OpenAI 帮助中心：ChatGPT Business General FAQ](https://help.openai.com/en/articles/8542115-chatgpt-business-general-faq) 与 [ChatGPT Business - Overview](https://help.openai.com/en/articles/8792828-chatgpt-business-overview) 整理的示意图*

## 三、Business 升级到 Enterprise

如果你们已经在用 Business，想升级成 Enterprise 并保留现有工作区和数据，官方的做法是**联系销售团队**；想改成另一个独立的 Enterprise 工作区，也是找销售团队讨论可行的方案。官方还说明，Business 到 Business 的工作区之间不能合并，新工作区不会继承旧工作区的内容或订阅。

## 四、公司已经买了 Enterprise，我怎么用上

官方的说明是：成员通常在工作区所有者或管理员邀请，或者通过组织的身份系统自动开通后获得访问权限，并被分配一种与业务需要匹配的席位类型。如果你已经被告知公司有 Enterprise：

1. 联系你们的工作区所有者、管理员或 IT；
2. 按邀请或公司给的登录方式进入工作区（你**不能自己更改席位类型**，由所有者或管理员分配）；
3. 如果同时有个人工作区，点 ChatGPT 里的**头像（profile icon）**，选要使用的工作区；切换只是换环境，**不会搬运或复制数据**；
4. 注意**合并个人工作区**：有些组织要求成员在接受邀请时把个人工作区合并进来，这样个人聊天、文件和自定义 GPT 会转入组织的控制，**合并是永久的，不能撤销**，之后按组织的工作区政策管理；不要求合并的，个人工作区和 Enterprise 工作区完全分开。

![公司有 Enterprise 之后怎么加入和切换工作区](seed:g891-join-enterprise.png)
*图：本站根据 [OpenAI 帮助中心：What is ChatGPT Enterprise?](https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise) 整理的示意图*

另外有两条官方提醒：

- **你原来的个人付费订阅**：如果你用同一个账号从个人付费订阅迁移进 Enterprise 工作区，个人订阅会自动取消，并按未使用部分给你部分退款；
- **工作区和 API 是两套成员系统**：成为公司 Enterprise 工作区的成员，不会自动成为公司 API 平台组织的成员，需要 API 权限要找管理 API 组织的管理员。ChatGPT 订阅和 API 的区别，见 [/guides/chatgpt-subscription-vs-openai-api](/guides/chatgpt-subscription-vs-openai-api)。

## 常见问题

**Q：ChatGPT Team 还能买吗？**
已经改名为 Business，没有一个单独叫 Team 的套餐了。老的 Team 工作区自动成了 Business 工作区。

**Q：ChatGPT Enterprise 多少钱？**
官方页面没有公布价格，取决于你们和 OpenAI 签的协议。要问具体数字，只能联系销售团队。不要相信第三方网站上的「Enterprise 价格表」。

**Q：个人能买 Enterprise 吗？**
不能。官方明确说 Enterprise 是在组织层面采购，个人用户不能直接注册。

**Q：两个人能不能开 Business？**
可以，Business 要求至少 2 个付费席位，Standard 和 Premium 的任意组合都可以。

**Q：Business 的数据会拿去训练吗？**
官方说 OpenAI 不会训练你工作区的数据。Enterprise 产品页写的也是业务数据默认不用于训练。

**Q：我是 Business 工作区的成员，能自己导出数据吗？**
官方 FAQ 写的是：Business 工作区里没有自助数据导出。导出个人数据的方法见 [/guides/chatgpt-export-chat-history](/guides/chatgpt-export-chat-history)。

**Q：想要发票，用 Business 行吗？**
官方概览页写的是：需要发票付款、采购单等销售渠道方案的，要用合同方案，而不是自助 Business。已付款订阅的发票下载见 [/guides/chatgpt-invoice-download](/guides/chatgpt-invoice-download)。

**Q：个人想用得多一点，该看什么？**
个人套餐看 [/guides/chatgpt-plans-comparison](/guides/chatgpt-plans-comparison)；要开通 ChatGPT Plus，可以看 [/chongzhi/chatgpt-plus](/chongzhi/chatgpt-plus)。

## 参考资料

- OpenAI 帮助中心：What is ChatGPT Enterprise? — https://help.openai.com/en/articles/8265053-what-is-chatgpt-enterprise
- OpenAI 帮助中心：ChatGPT Business - Overview — https://help.openai.com/en/articles/8792828-chatgpt-business-overview
- OpenAI 帮助中心：ChatGPT Business: General FAQ — https://help.openai.com/en/articles/8542115-chatgpt-business-general-faq
- OpenAI：ChatGPT Enterprise 产品页 — https://chatgpt.com/business/enterprise/

---
title: DeepSeek API 开放平台怎么充值、怎么查余额和用量：官方常见问题逐项整理
slug: deepseek-api-platform-balance-topup
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek 开放平台（platform.deepseek.com）怎么充值、怎么查余额、用量和账单、余额会不会过期、能不能退款开票？按官方常见问题和价格页（2026-10-24 查询）整理，并对照 402 报错和余额不对的情形。
checkedOn: 2026-10-24
sources:
  - https://static.deepseek.com/faq/index.html?lang=zh
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
  - https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
verify:
  - 官方常见问题页是前端渲染页面，本文引用的条目来自页面加载的文本：中文版写在线充值用支付宝 / 微信，英文版写 PayPal、银行卡、支付宝、微信支付，不同语言版本的支付方式可能不同，请以你登录后看到的充值页为准
  - 价格与计费规则取自官方价格页（2026-10-24）：扣费时优先扣赠送余额；官方保留调整价格的权利
  - 官方没有写赠送余额的具体额度，也没有写最低充值金额；本文不写这两项
  - 开放平台页面的菜单名称可能调整，本文只给出官方页面写明的网址和名称
---

> 本文根据 DeepSeek 官方常见问题、价格页与错误码页整理，资料核对于 2026-10-24。页面、价格可能调整，以官方为准。图为本站整理的示意图。获取 API Key 的步骤见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。

## 适用于谁

- 搜「deepseek api 开放 平台」「deepseek api platform」的人；
- 已经拿到 Key，却不知道怎么充值、怎么看还剩多少钱的开发者；
- 调用时遇到 402「余额不足」，或充了值余额却不对的人。

## 结论先说

1. **API 用的是开放平台账号，不是聊天账号**。开放平台网址是 platform.deepseek.com，聊天是 chat.deepseek.com，两边的使用方式和计费不同。聊天产品的用法见 [/guides/deepseek-how-to-use](/guides/deepseek-how-to-use)。
2. **先充值再用**。官方价格页写明：模型调用费用 = token 消耗量 × 模型单价，费用从充值余额或赠送余额里扣；两者同时有时，**优先扣赠送余额**。
3. **在线充值要先完成实名认证**（官方常见问题原意）。充值结果可以在账单页面查询。
4. **充值余额永久有效，不会过期；未消费的金额支持退款**。这是官方常见问题里的说法。
5. **402 就是余额不足**，官方错误码页的处理办法就是去充值页充值。

![DeepSeek 开放平台充值 4 步](seed:g1005-deepseek-platform-topup-steps.png)
*图：本站根据 [DeepSeek 官方常见问题](https://static.deepseek.com/faq/index.html?lang=zh) 整理的示意图*

## 一、充值

官方常见问题写了两种充值方式：

- **在线充值**：完成实名认证后，在充值页面（platform.deepseek.com/top_up）用支付方式充值，在账单页面（platform.deepseek.com/transactions）查询结果。中文版写的是支付宝、微信；英文版写的是 PayPal、银行卡、支付宝、微信支付；
- **对公汇款**：只支持企业用户，暂时只对 +86 手机号注册的用户开放。完成企业实名认证后会得到专属汇款账号；汇款方开户名称要和开放平台实名认证名称一致。款项到账后一般在 10 分钟到 1 小时内自动入账，没到可联系官方。

关于实名认证：官方说明个人认证和企业认证在用户权益和产品功能上目前没有差异，区别是所需材料和流程；个人认证可以改为企业认证，已完成企业认证的不能改回个人。认证失败的常见原因是：同一证件号绑定的账号超过数量限制，或证件号连续输错次数过多被暂时锁定。

充多少合适：价格按百万 token 计，具体单价、高峰与空闲时段的差别见 [/guides/deepseek-v4-pro-vs-flash-api-price](/guides/deepseek-v4-pro-vs-flash-api-price)。官方让用户「依据实际用量按需充值，定期查看价格页」，所以先小额试用再追加比较稳妥。

## 二、查余额、用量和账单

- **余额与充值记录**：登录开放平台，在充值、账单相关页面查看；
- **按 Key 看用量**：官方给的步骤是：进入用量页面（platform.deepseek.com/usage），在「时间维度」菜单选择时间范围，在「API Key」菜单选中要查的 Key；还可以点「导出」，下载压缩包，里面有两个 CSV 文件，按 Key 统计的明细在其中一个里；
- **请求返回里的 usage**：每次调用结果的 `usage` 字段会给出这次实际用掉的 token，官方 Token 页说明实际处理的 token 数量以模型返回为准，不同模型分词不同，估算只能参考（大致 1 个中文字符约 0.6 个 token，1 个英文字符约 0.3 个 token）。

## 三、余额不对、扣费不明时

![余额和扣费问题，对照官方说明](seed:g1005-deepseek-balance-decide.png)
*图：本站根据 [DeepSeek 官方错误码](https://api-docs.deepseek.com/zh-cn/quick_start/error_codes) 与常见问题整理的示意图*

「充了值，余额却不对」，官方给的解释是通常充值的账号和当前登录的账号不是同一个，可以这样找：

1. 如果你有 Google 或邮箱登录方式，换那种方式登录，看充值记录在不在；
2. 打开支付宝或微信里的充值订单详情页，在「商品」条目下查看对应的充值账号；
3. 如果注销过账号又重新注册，新旧账号相互独立，原账号的余额不能在新账号使用，需要联系官方按指引申请处理。

## 四、退款与发票

- **退款**：未消费金额支持退款。在线支付的，登录开放平台在页面里点「退款管理」自助操作；企业对公转账的需要填写官方的申请表。**已开票或开票中的金额不支持退款**，要退款得先把发票作废；
- **发票**：登录开放平台，在账单页点「发票管理」，按提示填入开票金额、抬头等信息；电子发票发送到你填写的邮箱。官方说明支持按消耗金额或按充值金额开具，类型有增值税普通发票和专用发票；个人认证可以开个人抬头或公司抬头，企业认证只能开企业认证主体的抬头；票面项目名称为「生产生活服务*技术服务费」，税率 6%（均为官方常见问题原文要点，以实际页面为准）。需要在发票上增加使用明细，可在「备注信息」栏填写；
- **作废重开**：在「发票管理」→「开票记录」里可以申请作废并重新开具。

## 五、关于限速与并发

不是余额问题却报 429 的，通常是并发或请求频率到了上限。官方限速页写明：并发限制按账号计，不是按 Key 计；deepseek-flash 是 2500，deepseek-v4-pro 是 500；超过会收到 HTTP 429。官方说目前没有分级收费套餐，需要更高并发可提交扩容工单，不额外收费。更多报错的处理见 [/guides/deepseek-api-error-codes](/guides/deepseek-api-error-codes)。

## 常见问题

**Q：余额不足时之前的数据会丢吗？**
官方文档没有这方面的说明。调用返回 402 时请求不会成功，充值后重试即可。

**Q：Key 泄漏了会被盗刷吗？**
有这个风险。官方建议立即在 API Keys 页面删除泄漏的 Key，再创建新的，见 [/guides/deepseek-api-key](/guides/deepseek-api-key)。

**Q：网页版聊天要充值吗？**
网页版不用在开放平台充值；开放平台的余额只对 API 调用生效。

**Q：Python 怎么调用？**
见 [/guides/deepseek-api-python-quickstart](/guides/deepseek-api-python-quickstart)。

## 参考资料

- DeepSeek 官方常见问题 — https://static.deepseek.com/faq/index.html?lang=zh
- DeepSeek API 文档：模型 & 价格（扣费规则）— https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：错误码 — https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
- DeepSeek API 文档：限速与隔离 — https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit

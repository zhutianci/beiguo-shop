---
title: DeepSeek API Key怎么获取：申请、充值、余额查询与泄漏处理
slug: deepseek-api-key
products: [ai-tools]
models: [deepseek]
accountTier: OTHER
excerpt: DeepSeek API Key 在哪里申请、要不要实名、怎么充值和查余额、Key 泄漏了怎么办？本文按官方开放平台文档和常见问题，一步步讲清从创建 Key 到看用量、开发票、退款的完整流程。
checkedOn: 2026-10-11
sources:
  - https://platform.deepseek.com/api_keys
  - https://api-docs.deepseek.com/zh-cn/
  - https://api-docs.deepseek.com/zh-cn/quick_start/pricing
  - https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
  - https://static.deepseek.com/faq/index.html?lang=zh#/category/4
---

## 适用于谁

- 搜「deepseek api key 怎么获取」「deepseek api key 申请」「deepseek 充值入口」「deepseek余额查询」的开发者和想把 DeepSeek 接进第三方工具的人；
- 已经有 Key，但遇到 401、402 报错或担心 Key 泄漏的人。

本文根据 DeepSeek 开放平台官方文档和常见问题整理，资料核对于 2026-10-11。

## 结论先说

1. **API Key 只在官方开放平台 platform.deepseek.com 创建**，和聊天用的 chat.deepseek.com 是两套入口；聊天产品免费，不等于 API 免费。
2. **API 按 token 计费，先充值后使用**。在线充值需要先完成实名认证，支持支付宝和微信。
3. **充值余额不会过期，未消费的金额可以退款**（官方常见问题原话的意思）。
4. **Key 要当密码保管**。泄漏后立刻在平台删除并新建，官方提醒不要把 Key 暴露在浏览器或其他客户端代码里。
5. 不要用来路不明的「共享 Key」：别人能看到你的请求内容，Key 也随时可能失效。

## 步骤

### 1. 注册并登录开放平台

浏览器打开 platform.deepseek.com，登录后左侧能看到 API Keys、用量、充值等页面（名称以实际界面为准）。

### 2. 创建 API Key

进入 API Keys 页面（platform.deepseek.com/api_keys），点「创建 API key」，起一个能看出用途的名字，例如 `blog-summary-prod`、`local-test`。创建后**马上复制保存**到密码管理器或环境变量里——出于安全考虑，这类平台通常不会再次完整显示 Key，以页面提示为准。

建议一个用途一个 Key：哪个泄漏了就删哪个，也方便分开看用量。

### 3. 完成实名认证并充值

官方常见问题写明的两种充值方式：

- **在线充值**：完成实名认证后，在充值页面用支付宝或微信支付，充值结果可在账单页面查询；
- **对公汇款**：仅支持企业用户（暂时只对 +86 手机号注册的用户开放），完成企业实名认证后向专属汇款账号打款，汇款方户名要和实名认证名称一致，到账后一般 10 分钟到 1 小时内自动入账。

个人认证和企业认证在权益和功能上目前没有差异，区别只在认证材料和流程；个人认证可以改成企业认证，反过来不行。

充多少合适：价格是按百万 token 计的，先充一笔小额试用即可，具体单价见官方「模型与价格」页（价格会调整，官方保留修改权利）。

### 4. 查余额和用量

- **余额**：在开放平台的充值 / 账单相关页面查看。扣费规则是「费用 = token 消耗量 × 模型单价」，同时有赠送余额和充值余额时，优先扣赠送余额；
- **分 Key 看用量**：进入用量页面，在「时间维度」里选时间范围，在「API Key」菜单里选要查的 Key；也可以点「导出」下载压缩包，里面有按 Key 统计的 CSV 明细。

### 5. 把 Key 配到程序或工具里

官方文档给出的接入参数：

| 参数 | 值 |
| --- | --- |
| base_url（OpenAI 格式） | `https://api.deepseek.com` |
| base_url（Anthropic 格式） | `https://api.deepseek.com/anthropic` |
| model | `deepseek-flash` 或 `deepseek-v4-pro` |

推荐用环境变量保存 Key，不要写进代码和 Git 仓库：

```bash
# macOS / Linux
export DEEPSEEK_API_KEY="你的 Key"
```

```powershell
# Windows PowerShell
$env:DEEPSEEK_API_KEY="你的 Key"
```

调用示例见《DeepSeek API 怎么用》。

### 6. Key 泄漏了怎么办

官方给的处理步骤：登录开放平台进入 API Keys 页面 → 找到泄漏的 Key，点「回收箱」图标 → 在确认框里点「删除」。看到「API Key 已删除」的提示即表示该 Key 立即失效，之后尽快创建新 Key 换到你的应用里。

## 常见问题

**Q：调用返回 401？**
官方错误码说明：401 是认证失败，API Key 错误。检查是否复制完整、是否多了空格、请求头是否是 `Authorization: Bearer <Key>`。

**Q：调用返回 402？**
账号余额不足，去充值页面充值后再试。

**Q：DeepSeek API 有免费额度吗？**
是否赠送余额、赠多少，官方页面没有固定说明，以你登录开放平台后看到的余额为准。

**Q：充了钱但余额不对？**
官方的解释是通常充到了另一个账号上：试试用 Google 或邮箱方式登录看看；或者到支付宝 / 微信的订单详情页，在「商品」条目下查对应的充值账号。注销后重新注册的账号和旧账号互相独立，旧余额不能在新账号使用。

**Q：能开发票、能退款吗？**
可以。在账单页面点「发票管理」提交申请，支持按消耗金额或按充值金额开票，电子发票发到你填的邮箱；在线支付的未消费金额可以在「退款管理」里自助退款。已开票或开票中的金额要先作废发票才能退。

**Q：有没有并发更高的套餐？**
官方说明目前是统一收费标准，没有分级套餐；需要更高并发可以提交扩容工单，扩容不额外收费。

## 参考资料

- DeepSeek 开放平台 · API Keys — https://platform.deepseek.com/api_keys
- DeepSeek API 文档：首次调用 API — https://api-docs.deepseek.com/zh-cn/
- DeepSeek API 文档：模型与价格（扣费规则）— https://api-docs.deepseek.com/zh-cn/quick_start/pricing
- DeepSeek API 文档：错误码 — https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
- DeepSeek 官方常见问题（API 相关：充值、余额、发票、Key 泄漏、分 Key 用量）— https://static.deepseek.com/faq/index.html?lang=zh#/category/4

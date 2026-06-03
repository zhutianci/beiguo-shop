# 支付宝（网站支付）配置指南

## 一、开放平台申请（用企业支付宝账号）

1. https://open.alipay.com → 创建「网页/移动应用」→ 拿到 **APPID**。
2. 用「支付宝开放平台密钥工具」生成 **RSA2 (PKCS8) 密钥对**：
   - **应用私钥** → 填到 `ALIPAY_PRIVATE_KEY`
   - **应用公钥** → 上传到开放平台
3. 上传应用公钥后，平台会给出一串 **支付宝公钥** → 填到 `ALIPAY_PUBLIC_KEY`
   - ⚠️ 注意区分：`ALIPAY_PUBLIC_KEY` 是「支付宝公钥」，不是你自己的应用公钥。验签用它。
4. 给应用**签约**：「手机网站支付」（必选）、可加「电脑网站支付」。
5. 应用网关 / 授权回调域名按需配置；接口加签方式选「**公钥**」（即普通公钥模式）。

## 二、环境变量（追加到 `/opt/beiguo/beiguo-shop/.env.production`）

```bash
ALIPAY_APP_ID=2021xxxxxxxxxxxx
ALIPAY_PRIVATE_KEY=<应用私钥，去掉头尾和换行的一长串 base64>
ALIPAY_PUBLIC_KEY=<支付宝公钥，一长串 base64>
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
```

> 私钥/公钥粘贴时去不去头尾换行都行，代码会自动整理成 PEM。
> 沙箱测试时网关换成 `https://openapi.alipaydev.com/gateway.do`，并用沙箱 APPID/密钥。

改完重启（改 env 不用 build）：`docker compose up -d`

## 三、回调地址（已自动用 NEXT_PUBLIC_APP_URL 拼好）

- 异步通知 notify_url：`https://bigolab.com/api/pay/alipay/notify`（**到账唯一依据**）
- 同步回跳 return_url：`https://bigolab.com/api/pay/alipay/return` → 跳回 `/orders`

你有 Cloudflare Tunnel，这两个地址是公网可达的，支付宝服务器能回调到 ✅。
无需在开放平台单独填 notify_url（代码每次下单都带上了）。

## 四、流程

1. 用户登录 → 下单（`POST /api/orders`，订单 UNPAID）
2. 订单页点「支付宝支付」→ `POST /api/pay/alipay/create` 返回收银台 URL → 浏览器跳转
   - 手机端自动用「手机网站支付(WAP)」，桌面端用「电脑网站支付」
3. 用户付款 → 支付宝异步 POST notify → 验签+校验金额 → 订单置为 PAID、发货中，写 Payment 记录、商品销量+1
4. 用户被带回 `/orders`

## 五、自检

- 后台/日志看 `[alipay notify]` 输出。
- 验签失败常见原因：`ALIPAY_PUBLIC_KEY` 填成了应用公钥（应填“支付宝公钥”）。
- 发起失败「支付宝支付未配置」：env 没生效，`docker compose up -d` 重建容器。
- 金额不匹配/订单不存在会返回 failure，支付宝会重试。

# 到期提醒功能 · 部署与配置指南

## 一、功能概览

1. **用户自助设置**（前台 `/lookup` 页面）
   - 用户输入 Claude 邮箱查询订阅后，下方出现「设置到期提醒」面板。
   - 可勾选 **邮箱提醒**（默认开启，默认邮箱=账户邮箱）和 **短信提醒**（默认关闭，需填手机号）。
   - 至少选一种；勾选短信必须填手机号。

2. **自动提醒**（每天中午 12:00，北京时间）
   - 由 `cron` 容器内网调用 `POST /api/cron/remind`（带 `x-cron-secret`）。
   - 提醒所有 **7 日内到期** 的订单。
   - **已提醒过的订单不再自动提醒**；续费后到期日变化会重新纳入。

3. **后台管理**（`/admin/reminders`）
   - 查看邮件 / 短信服务配置状态。
   - 查看 N 日内到期订单、联系人、是否已提醒。
   - 单条 / 批量 **手动提醒**（不受「已提醒」限制）。
   - 「立即执行自动提醒」按钮可手动跑一次定时逻辑（用于测试）。

## 二、阿里云配置（统一用 API，邮件+短信共用一对 AccessKey）

### 1. AccessKey
建议用 RAM 子账号，授权 `AliyunDirectMailFullAccess` + `AliyunDysmsFullAccess`。
拿到 AccessKeyId / AccessKeySecret 填入 `.env.production`。

### 2. 邮件推送 DirectMail
- 控制台 → 邮件推送 → 发信地址 → 新建并 **验证** 一个发信地址（如 `notice@mail.bigolab.com`，需先验证发信域名）。
- 把该地址填到 `ALIYUN_DM_ACCOUNT`。
- ⚠️ 之前「邮件服务没配置成功」多半是 **发信域名/发信地址未验证通过**，或 AccountName 填错。验证状态必须为「已通过」。

### 3. 短信服务 SMS
- 控制台 → 短信服务 → 签名（如「贝果科技」）→ 审核通过 → 填 `ALIYUN_SMS_SIGN_NAME`。
- 模板审核通过 → 填 `ALIYUN_SMS_TEMPLATE_CODE`。
- 模板变量需与代码一致，代码会传 `${type}`（订阅类型）和 `${days}`（剩余天数）。
  推荐模板文案：`您购买的${type}订阅还剩${days}天到期，请及时续费续期。`

## 三、环境变量（追加到 `/root/beiguo-shop/.env.production`）

```bash
CRON_SECRET=<openssl rand -hex 24 生成>
ALIYUN_ACCESS_KEY_ID=<你的>
ALIYUN_ACCESS_KEY_SECRET=<你的>
ALIYUN_REGION=cn-hangzhou
ALIYUN_DM_ACCOUNT=notice@mail.bigolab.com
ALIYUN_DM_FROM_ALIAS=贝果科技
ALIYUN_SMS_SIGN_NAME=贝果科技
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxx
```

> 注意：本项目环境变量文件是 `.env.production`，docker compose 默认只读 `.env`，
> 所以已通过 `ln -s .env.production .env` 软链解决。新增变量写进 `.env.production` 即可。

## 四、部署步骤（服务器 `/root/beiguo-shop`）

```bash
cd /root/beiguo-shop
git pull

# 1. 追加上面的环境变量到 .env.production
nano .env.production

# 2. 重新构建并启动（会新增 cron 容器）
docker compose up -d --build

# 3. 创建新数据库表（account_contacts / reminder_logs + external_orders 新列）
docker compose exec app node node_modules/prisma/build/index.js db push

# 4. 验证 cron 容器
docker compose logs cron --tail 20
docker compose exec cron crontab -l    # 应看到 0 12 * * * ...
```

## 五、测试

- 后台 `/admin/reminders` → 看邮件/短信是否「已配置」。
- 找一条 7 日内到期订单 → 点「提醒」→ 看是否收到邮件/短信。
- 点「立即执行自动提醒」→ 看返回的成功/失败数。
- 手动触发 cron 接口测试：
  ```bash
  docker compose exec cron curl -fsS -X POST \
    -H "x-cron-secret: <你的CRON_SECRET>" \
    http://app:3000/api/cron/remind
  ```

## 六、排查

- 邮件发不出：检查 `ALIYUN_DM_ACCOUNT` 发信地址验证状态、AccessKey 权限。
- 短信发不出：检查签名/模板审核状态、模板变量名是否为 `type`/`days`、手机号格式。
- 提醒记录写在 `reminder_logs` 表，`detail` 字段含阿里云返回的错误信息，可直接查库定位。

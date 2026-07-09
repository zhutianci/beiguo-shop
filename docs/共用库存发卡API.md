# 共用库存发卡 API（beiguo 库存中心）

让**第二个销售站点**（另一台服务器、自研程序）与 beiguo **共用同一批卡密库存**：
第二站付款成功后调本 API 领卡，与 beiguo 自动发货抢的是**同一个卡密池，先到先得，任何一张卡绝不会被两处各发一次**。

- **单一事实来源**：卡密只存在 beiguo，`CARDKEY_SECRET` 只留 beiguo 一台。第二站拿到的是**已解密明文**（走 HTTPS），不接触密钥。
- **库存自动同步**：第二站领走卡后，beiguo 前台该商品库存（= 未使用卡密数）立即同步减少。

---

## 鉴权

所有接口都需带共享密钥（服务端 `.env` 的 `DISPENSE_API_SECRET`），**只走请求头**：

```
Authorization: Bearer <DISPENSE_API_SECRET>
```

> 刻意不支持 `?secret=` 查询串——避免长期密钥随 URL 落入反代 access log / Referer 泄露。请务必用请求头。

- 服务端未配置 `DISPENSE_API_SECRET`（或不足 16 位）→ 整个接口关闭，返回 `503`。
- 密钥错误 → `401`。
- 密钥请用足够随机的长串：`openssl rand -hex 32`。**走 HTTPS（Cloudflare Tunnel），切勿明文放到前端。**

---

## 1) 发卡 `POST /api/inventory/dispense`

外部站点**付款成功后**调用，从共用池领卡。

### 请求体（JSON）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `client` | string | 是 | 调用方标识，如 `site2`。仅 `[A-Za-z0-9_-]`，≤40。|
| `orderNo` | string | 是 | **第二站的订单号**，作幂等键。仅 `[A-Za-z0-9_.:-]`，≤64。|
| `sku` | string | 二选一 | 商品编码（= beiguo 后台商品的「对外发卡 SKU」）。推荐用它。|
| `productId` | number | 二选一 | beiguo 的商品数字 id，作为 sku 的替代寻址。**该商品仍须已配置「对外发卡 SKU」**（未配 = 未开启共享，一律 `403`）。|
| `quantity` | int | 否 | 默认 1，范围 1–50。|

```bash
curl -X POST https://bigolab.com/api/inventory/dispense \
  -H "Authorization: Bearer $DISPENSE_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"client":"site2","orderNo":"S2-20260709-0001","sku":"claude-pro-1m","quantity":1}'
```

### 成功响应 `200`

```json
{
  "success": true,
  "data": {
    "productId": 12,
    "sku": "claude-pro-1m",
    "requested": 1,
    "delivered": 1,
    "status": "FULFILLED",
    "cards": ["卡密明文1"],
    "reused": false
  }
}
```

- `status`：`FULFILLED` 足额发出 / `PARTIAL` 库存不足只发了部分。
- `delivered`：实际发出的卡密数（= `cards.length`）。
- `reused`：`true` 表示这是幂等重放（此前该 `orderNo` 已发过，返回同一批卡）。

### 关键语义（务必按此处理）

1. **幂等**：同一 `(client, orderNo)` 无论调用多少次，只发一次卡；重试返回**同一批**卡密（`reused:true`）。失败/超时可安全重试。
2. **只有 `status === "FULFILLED"` 才算发货完成**——此时把 `cards` 交付买家、把第二站订单标记已发货。
3. **`PARTIAL`**（`delivered < requested`）：库存不足。已发的 `cards` 是真实占用的（不会再给别人），但订单没发满：请挂起订单 / 退差价 / 告警，**补货后用同一 `orderNo` 重试即可补足剩余**。
4. **库存不足 `409`**：一张都没发出（`delivered = 0`）。**不要**把订单标记已发货；挂起或退款，补货后重试。
5. **务必对同一 `orderNo` 串行调用**，不要并发重复请求同一订单。

### 错误码

| 状态码 | 含义 |
|--------|------|
| `400` | 参数错误（缺 sku/productId、字段非法、非 JSON、非自动发货商品） |
| `401` | 密钥错误 |
| `403` | 该商品未配置「对外发卡 SKU」，即未开启对外共享 |
| `409` | 库存不足（`delivered=0`）／ 订单正在处理中（并发，稍后重试）／ `orderNo` 复用到了不同商品或不同数量 |
| `500` | 服务端未配 `CARDKEY_SECRET` / 卡密解密失败 / 其他内部错误 |
| `503` | 未启用（服务端未配 `DISPENSE_API_SECRET`） |

> 注意：`400/500/503` 一般应视为「本次未发货」，可修正后重试；`409(库存不足)` 是缺货，补货后重试；`409(复用冲突)` 是调用方 bug，需换正确的 `orderNo`/商品。

---

## 2) 查库存 `GET /api/inventory/stock`

上架 / 下单前查可售数量。

```bash
# 查指定 SKU（逗号分隔）
curl "https://bigolab.com/api/inventory/stock?sku=claude-pro-1m,gpt-plus-1m" \
  -H "Authorization: Bearer $DISPENSE_API_SECRET"

# 不带 sku：返回所有已配置「对外发卡 SKU」的自动发货商品
```

响应：

```json
{
  "success": true,
  "data": {
    "list": [
      { "sku": "claude-pro-1m", "productId": 12, "name": "Claude Pro 月卡", "online": true, "stock": 37 }
    ]
  }
}
```

- `stock`：当前可售（未使用）卡密数，beiguo 与第二站**共享**这个数。
- `online`：是否在 beiguo 前台上架（下架不影响第二站领卡）。

---

## 第二站集成流程

1. **建映射**：在 beiguo 后台给每个要共享的「自动发货」商品填一个「对外发卡 SKU」（如 `claude-pro-1m`），第二站商品记住这个 SKU。
2. **展示库存**（可选）：下单前调 `/api/inventory/stock` 查 `stock`，为 0 就别让下单。
3. **付款成功** → 调 `POST /api/inventory/dispense`，`orderNo` 用**第二站自己的订单号**。
4. **判 `status`**：
   - `FULFILLED` → 把 `data.cards` 交付买家，订单标记已发货。
   - `PARTIAL` / `409` → 挂起或退款，稍后用**同一 orderNo** 重试补足（幂等，不会重复发）。
5. 网络失败/超时 → 直接用同一 `orderNo` 重试，安全。

---

## beiguo 侧部署

1. **配密钥**：服务器 `.env` 增加
   ```env
   DISPENSE_API_SECRET=<openssl rand -hex 32 的输出>
   ```
2. **建表**（新增字段/表，全部可空，对既有数据安全，不需迁移脚本）：
   ```bash
   cd /opt/beiguo/beiguo-shop
   git pull
   docker compose exec app npx prisma db push --skip-generate   # 或按项目现有 db push 流程
   docker compose up -d --build
   ```
3. **配 SKU**：后台 → 商品管理 → 编辑「自动发货」商品 → 填「对外发卡 SKU」。
4. **自测**：
   ```bash
   curl -X POST https://bigolab.com/api/inventory/dispense \
     -H "Authorization: Bearer $DISPENSE_API_SECRET" -H "Content-Type: application/json" \
     -d '{"client":"test","orderNo":"probe-1","sku":"<你的SKU>","quantity":1}'
   # 再用同一 orderNo 调一次，应返回同一张卡且 reused:true（验证幂等）
   ```

---

## 审计

- 每次外部发卡记录在 `external_dispenses` 表（`client`/`externalNo`/`productId`/`delivered`/`status`/`cardIds`）。
- 每张被外部领走的卡密，`card_keys.external_ref` = `<client>:<orderNo>`（本站订单发的卡此字段为空，改看 `order_id`），可据此追溯「哪张卡发给了哪个站的哪个订单」。

# HeroSMS API 调研报告（面向"短信接码"转售对接）

**资料来源（已抓到完整原始规格，不是凭网页片段拼的）**
- `https://hero-sms.com/cn/api` 用 Scalar 渲染，内容全部来自 OpenAPI 3.2 规格文件 `https://hero-sms.com/docs/v1/openapi.json?locale=cn|en|ru`。三种语言的接口集合完全一致，本地副本放在 scratchpad。
- 官方规则页 `https://hero-sms.com/rules`（中文版 `/cn/rules`）。
- 官方前端界面文案 `https://hero-sms.com/_i18n/cb5270b1/{cn,en}/messages.json`，以及前端 JS 包里的枚举定义。
- 我做过的只读实测：只调了公开分类接口，或用无效 key 触发鉴权错误。**全程没有登录、没有取号、没有扣费、没有改状态。**

**标注说明**
- 【文档原文确认】：出自 OpenAPI 规格或规则页原文。
- 【官方站点确认】：出自官方前端文案或前端代码，不属于 API 文档本身。
- 【实测】：我的只读请求实际返回的结果。
- 【推断/未确认】：推断结论，或文档里没有写。

---

## 1. 总体

| 项目 | 内容 | 标注 |
|---|---|---|
| 两套协议 | ① SMS-Activate 兼容协议：`https://hero-sms.com/stubs/handler_api.php?action=...&api_key=...`<br>② 新 REST 协议：`https://hero-sms.com/api/v1/...` | 文档原文确认（`servers` 字段） |
| 与 SMS-Activate 的兼容 | 原文要求把软件里的主机 `https://api.sms-activate.ae` 换成 `https://hero-sms.com`，路径 `/stubs/handler_api.php` 不变 | 文档原文确认 |
| 兼容协议的鉴权 | query 参数 `api_key` | 文档原文确认 |
| v1 协议的鉴权 | 请求头 `Authorization: ApiKey {your_token}` | 文档原文确认 |
| API Key 的获取条件 | 必须先开两步验证（2FA）才能生成；key 只显示一次 | 官方站点确认 |
| HTTP 方法 | 兼容协议全部是 GET，只有 `reactivate` 和 `prolong` 是 POST | 文档原文确认 |
| 成功时的返回格式 | 老 action 返回纯文本串，例如 `ACCESS_NUMBER:id:phone`；V2 系列和列表类返回 JSON。规格里一律写 `application/json`，文本结果实际是纯文本还是带引号的 JSON 字符串无法验证 | 文档原文确认 + 推断/未确认 |
| 失败时的返回格式（与原版 SMS-Activate 不同） | 用非 200 的 HTTP 状态码加 JSON：`{"title":"错误码","details":"...","info":{...}}` | 文档原文确认；实测：无效 key 返回 `401 {"title":"BAD_KEY","details":"Unauthorized"}`，缺 key 返回 `422 {"title":"UNPROCESSABLE_ENTITY",...,"info":{"field":"api_key","code":"REQUIRED"}}` |
| 例外情况 | `getNumber` / `getNumberV2` 没号时返回 **HTTP 200、纯文本 `NO_NUMBERS`**；`getRentNumber` 没号时返回 **404 JSON `NO_NUMBERS`**。解析时两种都要处理 | 文档原文确认 |
| v1 协议的错误格式 | 401 `{"title":"Unauthenticated."}`；422 `{title,details,errors:{field:[msg]}}`；500 `SERVER_ERROR`。实测用无效 key 得到 **403 `{"title":"BAD_API_KEY","details":"Invalid API key"}`**，和文档写的 401 不一致 | 文档原文确认 + 实测 |
| 限流 | 每个账户 **50 RPS**。超限返回错误 1020 或 400，并**封 10 秒**，再次超限再封。`/activations/offers` 另有 429 `RATE_LIMIT` | 文档原文确认（规则页 API 节 + 规格） |
| 免 key 可用的接口 | `getServicesList`、`getCountries`、`getOperators`、`GET /api/v1/classifiers/activations/custom-durations`。`getPrices` / `getBalance` 必须带 key | 实测 |
| 币种 | `Currency` 枚举只有 840(USD) / 978(EUR) / 156(CNY)，默认 840；租用相关接口还多接受 643(RUB) | 文档原文确认 |

---

## 2. 兼容协议：逐个 action

### getBalance
- **参数**：无（只需 `api_key`）。
- **成功**：`ACCESS_BALANCE:100.5`。
- **错误**：401 `BAD_KEY`；404 `BAD_ACTION`（"Method Not Found"）；422 `UNPROCESSABLE_ENTITY`；500 `SERVER_ERROR`（"Server Gone"）。
- 标注：文档原文确认。

### getNumber
**参数**（全部来自文档原文）：

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `service` | 必填 | 服务代码，如 `tg` |
| `country` | 必填 | 国家 ID，数字 |
| `operator` | 可选 | 运营商列表，"逗号分隔、不带空格"，如 `tele2,beeline` |
| `maxPrice` | 可选 | 最高价 |
| `fixedPrice` | 可选 | 字符串 `true`。原文：必须配合 `maxPrice` 使用，严格按 `maxPrice` 价格购买 |
| `ref` | 可选 | 推荐人 ID |
| `phoneException` | 可选 | 排除号段前缀，如 `7934,7900`，最多 20 个 |

- **文档里没有的参数**：`activationType`、`forward`、`verification`、`useCashBack`、`userId`/`resellerUserId` 都不在 HeroSMS 文档中。【文档原文确认它们不存在；传了是否生效：推断/未确认】
- **成功**：`ACCESS_NUMBER:123456789:7*********0`，含义是 `ACCESS_NUMBER:<activation_id>:<number>`。
- **错误**（文档原文确认）：

| HTTP | 错误码 | 说明 |
|---|---|---|
| 200 | `NO_NUMBERS` | 纯文本 |
| 400 | `WRONG_MAX_PRICE` | `info.min` 给出允许的最低价，例 0.1234 |
| 401 | `BAD_KEY` | |
| 402 | `NO_BALANCE` | "Payment Required" |
| 403 | `CHANNELS_LIMIT` | `info.current_threads` / `info.max_allowed` |
| 403 | `SERVICE_NOT_AVAILABLE` | |
| 403 | `BANNED` | `info.scope` 为 `global` 或 `specific`，另有 `banned_until`（unix 时间）、`retry_after_seconds`、`readable_date` |
| 403 | `ACCOUNT_INACTIVE` | |
| 404 | `BAD_ACTION` | |
| 422 | `UNPROCESSABLE_ENTITY` | |
| 500 | `SERVER_ERROR` | |

- **规格里定义了但没有挂到任何接口上的老式文本错误**：`BAD_SERVICE`、`BANNED:'YYYY-m-d H-i-s'`、`WRONG_MAX_PRICE:0.025`、`ERROR_SQL`、`NO_KEY`、文本形式的 `CHANNELS_LIMIT`。实现时应该兼容。【文档原文确认】
- **官网购买界面还会处理这些错误**：`WRONG_EXCEPTION_PHONE`（排除前缀不合法）、`NOT_AVAILABLE`（该国不支持一号多服务）、`BAD_BALANCE`、`ERROR_SQL25`、`WHATSAPP_NOT_AVAILABLE`、`NO_YULA_MAIL`、`BAD_COUNTRY`、`MAX_RENT_DATE_ERROR`。【官方站点确认】

### getNumberV2
- **参数**：和 getNumber 完全相同。
- **成功返回 JSON**，字段如下：
  - `activationId`、`phoneNumber`（不带 +）、`activationCost`、`currency`
  - `countryCode`（国家 ID）、`countryPhoneCode`（国际区号）
  - `canGetAnotherSms`（布尔）
  - `activationTime`、`activationEndTime`（RFC3339 时间）
  - `activationOperator`（默认 `"any"`）
  - `verificationType`（`sms` / `call`）
  - `subtype`（1 = 激活，2 = 租用）
  - `serviceCode`、`status`（例 4）
- **示例**：`{"activationId":"635468024","phoneNumber":"79584******","activationCost":12.5,"currency":840,"countryCode":6,"countryPhoneCode":62,"canGetAnotherSms":true,"activationTime":"2026-02-18T16:11:33+00:00","activationEndTime":"2026-02-18T18:11:23+00:00","activationOperator":"any","verificationType":"sms","subtype":1,"serviceCode":"vk","status":4}`
- **错误**：和 getNumber 相同，没号时同样是 200 文本 `NO_NUMBERS`。
- 标注：文档原文确认。
- **注意**：示例里 id 是字符串，schema 却写 integer，两边都要兼容。【推断】

### getStatus
- **参数**：`id`。
- **成功**（文档原文确认）：

| 返回 | 含义 |
|---|---|
| `STATUS_WAIT_CODE` | 等待短信 |
| `STATUS_WAIT_RETRY:100001` | 原文 "Waiting for the code clarification"。按 SMS-Activate 惯例，这是调用 status=3 之后等新码、冒号后面是上一个码【推断】 |
| `STATUS_WAIT_RESEND` | 等待短信重发 |
| `STATUS_CANCEL` | 已取消 |
| `STATUS_OK:100001` | 已收到码 |

- **错误**：400 `BAD_STATUS`；401；402 `NO_BALANCE`；403（与 getNumber 同一组）；404 `NOT_FOUND`（"Activation Not Found"）/ `BAD_ACTION`；422；500。
- 收到多条短信时返回哪一条，文档没写，推测是最新一条。【推断/未确认】

### getStatusV2
- **参数**：`id`。
- **成功**：`{"verificationType":"sms","data":{"id":"3416693217","phoneFrom":"Telegram","code":"123456","text":"Telegram code 123456","service":"tg","date":"2026-02-16T12:36:59+03:00","type":"sms"}}`。`code` / `text` 可以为 null（语音来电时就是 null）。
- **已取消时返回的是纯字符串 `STATUS_CANCEL`，不是 JSON。**【文档原文确认】
- 还在等码时返回什么，文档没写。【未确认】
- **错误**：和 getStatus 相同。

### setStatus
- **参数**：`id`、`status`。`status` 的枚举只有 **3 / 6 / 8**（schema 默认值 3，示例值却写 1，规格自相矛盾）。

| status | 原文含义 | 成功返回 |
|---|---|---|
| 3 | 请求重新发送短信 | `ACCESS_RETRY_GET` |
| 6 | 完成激活（已收到并确认码） | `ACCESS_ACTIVATION` |
| 8 | 取消激活（返还资金） | `ACCESS_CANCEL` |

- **status=1 不在 HeroSMS 文档里**。它是 SMS-Activate 老协议的"号码已就绪"；规格里有一个未挂到接口上的 `ACCESS_READY` 示例，第三方库 osyduck/Hero-SMS 仍保留 `markReady`。建议不要用。【推断/未确认】
- **错误**（文档原文确认）：
  - 400 `BAD_STATUS`；401；403（同 getNumber 一组）；404 `NOT_FOUND` / `BAD_ACTION`；422；500。
  - **409 冲突**：
    - `EARLY_CANCEL_DENIED`：`"info":{"minActivationTime":120}`。未挂到接口上的文本示例还写了"You can't cancel a number within the first 2 minutes"。
    - `OTP_RECEIVED`："号码已收到 OTP，无法终止"。
    - `FREE_CANCELLATION_EXPIRED`："time limit exceeded (20 minutes)"。
    - `NEW_OTP_RECEIVED`："Otp was received on this number. Please confirm termination."，`info.data[]` 附带 OTP 列表。怎么"确认"文档没写。【未确认】
    - `ACTIVATION_NOT_ACTIVE`："Activation is terminated/refunded"。
- **前置条件**：
  - 取消需满足"取号满 2 分钟且没收到码"。长时效号码（≥24 小时）还必须在购买后 20 分钟内。【文档原文确认】
  - 完成（status 6）需要已经有码。依据是前端提示"Activation cannot be completed, no code."。【官方站点确认】

### getActiveActivations
- **参数**：`start`（偏移，默认 0）、`limit`（最大 100）。
- **成功**：`{"status":"success","data":[{activationId, serviceCode, phoneNumber, activationCost, currency, activationStatus, smsCode, smsText, activationTime, countryCode, countryName, canGetAnotherSms:"1", verificationType, subtype}]}`。示例里的数字字段是字符串类型。
- **错误**：400 / 401 / 402 / 403 / 404 / 422 / 500。
- 标注：文档原文确认。

### getHistory
- **参数**：`start`、`end`（unix 时间）、`offset`、`size`（最大 100）。
- **成功**：数组 `[{id, date, phone, sms, cost, status, currency}]`。
- 标注：文档原文确认。

### getAllSms（取某个激活收到的全部短信）
- **参数**：`id`、`size`、`page`。
- **成功**：`{"data":[OtpItem...],"meta":{"total":42,"service":"full"}}`。`OtpItem` 字段为 `id, phoneFrom, code|null, text|null, service, date, type(sms|call)`。
- **错误**：409 `ACTIVATION_NOT_ACTIVE`，**激活被取消或退款后就取不到短信了**；另有 404 / 400 / 401 / 403 / 500。
- 标注：文档原文确认。

### finishActivation / cancelActivation（兼容协议里的新 action）
- **参数**：`id`。
- **成功**：**HTTP 204，无响应体**。
- **finishActivation 的 409**：`NEW_OTP_RECEIVED`、`ACTIVATION_NOT_ACTIVE`。
- **cancelActivation 的 409**：`NEW_OTP_RECEIVED`、`FREE_CANCELLATION_EXPIRED`、`OTP_RECEIVED`、`ACTIVATION_NOT_ACTIVE`、`EARLY_CANCEL_DENIED`。
- 其余错误同上。
- 标注：文档原文确认。

### reactivate（POST，重新启用已成功用过的号码）
- **参数**：`id`、`duration`（小时，可选）。
- **成功**：返回和 getNumberV2 一样的对象。
- **错误**：
  - 403：`SERVICE_NOT_AVAILABLE`、`SIM_OFFLINE`（号码已下线）、`SIM_TEMPORARY_OFFLINE`（号码暂时离线，稍后再试）。
  - 402 `NO_BALANCE`；404；500。
- 标注：文档原文确认。

### reactivateOptions（GET）
- **参数**：`id`。
- **成功**：`{"data":{"options":[{"price":0.2145,"duration":{"unit":"hour","value":2}},{"price":1.4324,"duration":{"value":24,"unit":"hour"}}]}}`，`unit` 可为 `minute` / `hour`。
- 标注：文档原文确认。

### prolong / prolongOptions / prolongHistory（续租）
- **prolong（POST，只对"租用"类型有效）**：
  - 参数：`id`、`duration`（必填）。
  - 400 错误：`SIM_OFFLINE`、`SIM_TEMPORARY_OFFLINE`、`MAX_HOURS_EXCEED`（`info.max` 336）、`BAD_DURATION`（`info` 中 min 24、max 720、`available_durations` [24,72,168,720]）、`ACTION_NOT_AVAILABLE`（提示改用 reactivate）、`FREEZE_PERIOD_NOT_REACHED`（带 `retry_after_seconds`）。
- **prolongHistory**：`{"data":[{userPrice, hours, createDate, payerType: client|partner}]}`。
- 标注：文档原文确认。

### getCountries
- **参数**：无。
- **文档示例**是数组 `[{id, rus, eng, chn, visible(0/1), retry(0/1)}]`。
- **实测**：免 key 可用，实际返回的是**以 id 为键的对象**，并且多一个 `rent` 字段：`{"6":{"id":6,"rus":"...","eng":"Indonesia","chn":"印度尼西亚","visible":1,"retry":1,"rent":1},...}`。
  - 共 **195 个国家**，id 范围 1–204，**没有 0（俄罗斯）**，也没有 12。
  - 自带中文名字段 `chn`，可以直接用于中文界面。
- `retry` 字段表示该国是否支持再次收码（按 SMS-Activate 惯例）。【推断】
- 错误：`NO_KEY` / `BAD_KEY`（文本）。

### getServicesList
- **参数**：`country`（可选）、`lang`（可选，取值 en/cn/es/de/fr/pt/ru/id/vi/tr/ja/ko/ar，默认 en）。
- **成功**：`{"status":"success","services":[{"code":"aoo","name":"Pegasus Airlines"}]}`。【文档原文确认】
- **实测**：
  - 免 key 可用。
  - 共 **811 个服务**。带 `country=6` 时只返回 327 个，说明是按国家过滤后的可用服务。
  - **`lang=cn` 返回的仍是英文名**，中文服务名要自己维护。
  - 代码长度：2 位 295 个、3 位 515 个、4 位 1 个；正则为 `^[a-zA-Z]{2,4}$`。
  - 几个常用代码：`full` = Full rent（整号租用）、`ot` = Any other、`dr` = OpenAI、`acz` = Claude、`tg`、`wa`、`go`、`wb`（WeChat）。

### getOperators
- **参数**：`country`（可选）。
- **成功**：`{"status":"success","countryOperators":{"175":["optus","vodafone","telstra","lebara"]}}`。
- **错误**：`OPERATORS_NOT_FOUND`、`ERROR_SQL`、`NO_KEY`、`BAD_KEY`。
- 标注：文档原文确认。
- **实测**：免 key 可用；不传 `country` 时返回全部 137 个国家的运营商。例如：
  - 6（印尼）：`["axis","byu","indosat","smartfren","telkomsel","three"]`
  - 187（美国）：`["at_t","boost_mobile",...,"verizon","virgin"]`

### getPrices（已废弃，文档要求改用 `GET /activations/offers/{verificationType}`）
- **参数**：`service`、`country`，均可选。
- **成功**：`{国家:{服务:{cost, count, physicalCount}}}`。
- **错误**：`{"status":"false","msg":"service is incorrect"}`、`{"status":"false","msg":"country is incorrect"}`、`BAD_ACTION`、`NO_KEY`、`BAD_KEY`。
- 标注：文档原文确认。实测必须带 key。

### getTopCountriesByService / getTopCountriesByServiceRank（均已废弃）
- **参数**：`service`（可选）、`freePrice`（布尔）。
- **成功**：`{country, count, price, retail_price, physicalTotalCount, physicalCountForDefaultPrice, physicalPriceMap:{价格:数量}}`。
- Rank 版本按用户的会员等级计价。
- 标注：文档原文确认。

### 租用系列
- **serviceCountRent**
  - 参数：`service`（必填）、`country`、`operator`、`currency`（643/840/978/156）。
  - 成功：`{"6":{"2":{"count":..,"price":..,"retail_price":..},...}}`，外层键是国家，内层键是小时数；无数据时返回 `"{}"`。
  - 400 错误：`BAD_DURATION`、`WRONG_COUNTRY`、`WRONG_SERVICE`、`WRONG_CURRENCY`。
- **getRentServicesAndCountries**
  - 参数：`country`、`duration`，均必填。
  - 成功：`{"operators":{"1":"tmobile"},"services":{"tg":{"quantity":2,"price":1.2,"retail_price":1.2}}}`。
- **getRentNumber**
  - 参数：`service`、`country`、`duration`（必填）、`operator`、`currency`、`ref`。
  - 成功：返回 V2 对象，其中 `subtype=2`。
  - 错误：400（同上一组）、401、402、403（同 getNumber 一组）、**404 `NO_NUMBERS`（JSON）**、500。
  - 另有一个未挂到接口上的示例：`{"id","phoneNumber","cost","currency","lockCancelTime":120,"endDate","operator":"mtt"}`。
- 标注：文档原文确认。

### 任务里点名但 HeroSMS 文档中不存在的 action【文档原文确认它们不在规格里】
- `getPricesVerification`、`getFullSms`、`getAdditionalService`、`getExtraActivation`、`getRentStatus`、`setRentStatus`、`getRentList`、`getMultiServiceNumber`、`getNumbersStatus`。
- 服务端是否仍兼容这些 action，无法用无效 key 验证：鉴权先于 action 路由，任何 action 都只返回 `BAD_KEY`。【未确认】
- 文档给出的替代接口：
  - 取短信全文 → `getAllSms` 或 v1 的 `/otp`
  - 语音验证价格 → `/activations/offers/call`
  - 租用状态 → `getAllSms` / `finishActivation` / `cancelActivation` / `prolong`

---

## 3. v1 REST（`/api/v1`，请求头鉴权）

以下各项均为【文档原文确认】，另有标注的除外。

- **`POST /activations`：购买**
  - 请求体：`service`*、`country`*、`amount`*（1–10，可批量）、`operator`（默认 any）、`maxPrice`（最小 0.0067）、`fixedPrice`（布尔）、`duration`（24/72/168/336/720/1440/2160/4320，传了即为租用）、`verificationType`（`sms` / `call`）、**`resellerUserId`**（`^[a-zA-Z0-9_.@-]{1,36}$`，"End customer identifier in the reseller's system"）。
  - 返回：`{"data":[Activation]}`。`Activation` 字段为 `id, status, phone, service, country, countryPhoneCode, operator, price, createdAt, expiredAt, verificationType, subtype, otpList[]`。
  - 错误：401；403 `BANNED_GLOBAL` / `BANNED_SPECIFIC`；404；422；500。
  - **文档没有给 v1 列出 402（余额不足），缺钱时返回什么未确认。**
- **`DELETE /activations/{id}`：取消并退款，成功返回 204**
  - 原文："仅当激活未收到任何 OTP，或对于有效期为 24 小时及以上的激活已过时间少于 20 分钟时，方可取消。否则请调用 finish。"
- **`POST /activations/{id}/finish`**：成功完成，"不予退款"，返回 204。
- **`POST /activations/{id}/replace`：请求更换号码**
  - 返回：新的 `{"data":[Activation]}`；错误 403 `BANNED_*`、404、422、500。
  - 前置条件文档没写。官网提示"你可以在 2 分钟后更换号码"，失败文案为"变更激活号码失败"。【官方站点确认】
  - 推测收到 OTP 后不能换，旧激活作取消处理；新号码价格可能与原来不同。【推断/未确认】
- **`POST /activations/{id}/reactivate`**：请求体 `{duration?}`，"仅当激活已成功完成时"可用。另有 `GET .../reactivate/options`。
- **`POST /activations/{id}/prolong`**：请求体 `{duration*}`，可能返回 425 `TOO_EARLY`。另有 `GET .../prolong/options`（也可能 425）和 `GET .../prolong/history`（`{data:[{duration, price, createdAt}]}`）。
- **`GET /activations/{id}/otp/last`**：`{"data":{id, smsCode, smsText, receivedAt, type, phoneFrom, service}}`。
- **`GET /activations/{id}/otp`**：`{"data":[...]}`，全部 OTP。
- **`GET /activations`：活跃激活列表**
  - 每条都带完整 `otpList`。
  - 参数：`size`（1–25）、`page`、`sort[id]`、`search`、`verificationType`、`from`、`to`。
  - **v1 没有"按 id 查询单个激活"的 GET 接口。**
- **`GET /activations/history`**
  - 参数：`from`* / `to`*（ISO8601）、`services[]`、`countries[]`、`statuses[]`（6 / 8 / 10）、`size` / `page` / `sort` / `search`。
  - 返回：`data[{id, createDate, service, country, phone, moreCodes, cost, status, phoneCode, currency}]`、`totals{sum, successCount}`、`meta`。
- **`GET /activations/stats?date=`**：`{data:{国家:{服务:{count, success, percent}}}}`。
- **`GET /activations/offers/{sms|call}?services=tg,go&countries=6,33`**：用来取代 getPrices
  - 返回：`data[服务][国家] = {prices:{default, retail, min}, counts:{total, physical, defaultPrice}, map:{价格:数量}}`。
  - `meta.order.rate`：按评分排序的服务和国家；`meta.order.deliverability.countries`：按到达率排序的国家。
  - 错误：404 `OFFER_NOT_FOUND`；429 `RATE_LIMIT`。
  - 实测：不带 key 返回 401。
- **`GET /classifiers/activations/custom-durations`**：不需要鉴权，返回 `{data:{服务:{国家:分钟数}}}`。
  - 实测结果只有 10 个服务存在例外时长，数值为 40 / 45 / 60 分钟：`cy, md, ig, ft, wx, ya, ff, tg, bte, dh`，其中 `tg` 只在国家 6 和 151 为 45 分钟。
- **Emails 系列**（与本需求无关）：`GET/POST /emails`、`POST /emails/batch`、`GET/DELETE /emails/{id}`、`POST /emails/{id}/reorder`、`GET /emails/domains`。

---

## 4. Webhook

【文档原文确认】
- **唯一的事件**是 `sms-incoming`（收到短信时推送）。**取消、超时、退款都没有事件推送。**
- 请求形式：`POST`，`Content-Type: application/json`，只推送到 **HTTPS** 地址。
- **请求体字段**：`activationId`、`phoneFrom`、`service`、`text`、`code`（可为 null）、`country`、`receivedAt`（ISO8601）。
  - 规格的 `required` 列表里写了 `id`，但 `properties` 里没有定义 `id`，自相矛盾。
- **地址配置**：最多 3 个 URL，在账户个人信息里设置，每个 URL 独立推送。**添加 webhook 需要先开 2FA。**【官方站点确认】
- **超时与重试**：响应超时 3 秒，非 200 视为失败。至少重试 7 次，间隔 20–30 秒，总时长至少 3 分钟。原文强烈建议：即使已经处理过，也回 200。
- **没有签名机制。**只能靠来源 IP 白名单识别：`84.32.223.53`、`185.138.88.87`。
- 【推断】应以 OTP 的 id（如果有）或 `activationId + receivedAt + text` 做幂等去重。

---

## 5. 状态码体系

- **ActivationStatusTypes 枚举**：`[1,2,3,4,6,7,8,10]`。文档**没有写每个值的含义**。
- **官网前端代码里的映射**【官方站点确认】：

| 值 | 含义 |
|---|---|
| 2 | SMS_RECEIVED（已收到短信；如果是语音验证则显示"已收到来电"） |
| 3 | WAITING_RESEND（等待重发） |
| 4 | WAITING_SMS（等待短信） |
| 6 | SUCCESS（成功） |
| 8 | CANCELLED（已取消） |
| 10 | REFUND（已退款） |
| 1、7 | 前端没有映射【未确认】 |

- **ActivationHistoryStatus**【文档原文确认】：6 = Completed successfully，8 = Cancelled，10 = Refund。
- 【推断】8 是主动取消，10 是超时自动退款或客服退款。
- **Email 状态**（不相关）：3 等待、4 取消、5 已收未完成、6 完成、7 退款。

---

## 6. 规则与时序

| 问题 | 结论 | 标注 |
|---|---|---|
| 激活有效期 | 普通激活默认 **20 分钟**。个别"服务+国家"组合为 40 / 45 / 60 分钟，见 custom-durations。<br>内部接口的 `activationFinishTime` 字段印证：tg/6 为 45，ot/187 为 20。<br>**以取号返回的 `activationEndTime` 为准。** | 规则页 / 官网文案原文确认；实测 |
| 多久后才能取消 | 取号后 **2 分钟**内取消会报 `EARLY_CANCEL_DENIED`，`info.minActivationTime=120`（秒） | 文档原文确认 + 规则页 |
| 取消是否退款 | 没收到码就取消 → 退回余额。收到码后不能取消（`OTP_RECEIVED`），也不退款 | 规则页原文确认 |
| 超时没收到码 | 20 分钟内因任何原因没收到码 → **自动退回余额** | 规则页原文确认 |
| 租用 / 长时效号码 | 购买 2 分钟后到 **20 分钟内**可以取消退款；超过 20 分钟即使没收到码也不退（`FREE_CANCELLATION_EXPIRED`） | 规则页 + 文档原文确认 |
| 扣费时点 | 原文："Funds are deducted from the balance upon completion of the purchase; a purchase is considered completed if an OTP code has been received and displayed"，没收到码就退回。<br>取号时余额必须够，否则 402 `NO_BALANCE`。<br>实际行为推测是取号时先扣，未成功再退回（SMS-Activate 惯例）。 | 规则页原文确认；扣费机制为推断 |
| 再次收码 | 前端提示"额外的短信将自动送达"；营销文案"无需为额外验证码和使用时长支付超额费用"，**即免费**。<br>兼容协议可调用 `setStatus=3`（返回 `ACCESS_RETRY_GET`），之后 getStatus 为 `STATUS_WAIT_RETRY:<旧码>`。<br>是否可以再次收码看 `canGetAnotherSms` 以及国家的 `retry` 字段。 | 官方站点确认 + 文档原文确认；计费为官网文案 |
| 多条短信 | `getStatus` / `getStatusV2` 只给单条（推测为最新一条）。取全部用 `getAllSms`（分页、`meta.total`）或 v1 的 `/otp`、`/activations.otpList`；webhook 每条短信推一次 | 文档原文确认；"最新一条"为推断 |
| 完成激活 | `setStatus=6` 或 `finishActivation`，不退款；前端要求必须已有码。不手动完成的话，到期后自动结束 | 文档原文 + 官方站点确认；到期自动结束为推断 |
| 号码被目标平台拒绝 | API **没有"号码不可用 / 已被注册"之类的专门状态**。可选做法：<br>① 满 2 分钟、未收到码时取消退款，或调用 v1 的 `replace` 换号；<br>② 规则页原文：号码上已有注册账户、要求 2FA 等供应商侧问题，可**通过客服**退款；需要准备截图和从买号起的录屏，个案审核 | 文档原文 + 规则页原文确认 |
| 封禁与线程限制 | **按"国家+服务"封禁**：取号 100 个以上且成功率 <6%，封 30 分钟。<br>**全账户封禁**：5 个以上"国家+服务"组合被封后触发，封 30 分钟。<br>**线程限制**：500 / 750 / 1000 个以上且成功率 <3% 时，同时等码的号码数分别限为 10 / 5 / 1；每天 21:00 UTC 重置。<br>前端还有提示"你的账户因取消太多号码已被封禁"。 | 规则页原文 + 官方站点确认 |
| 转售商（Reseller） | 需要向客服申请转售商身份。取得身份后，**每次激活都传入买家 ID**，封禁就只针对这个买家，不影响你的主账号。<br>**禁止**：复制或模仿 HeroSMS 的名称、logo、配色等品牌元素；把买家引导到 HeroSMS 客服；在争议中推给 HeroSMS。<br>买家的技术支持由转售商自己负责；加价不受限制 | 规则页原文确认 |

---

## 7. 运营商（号码地区 operator）

- **取值来源**：`getOperators?country=X`，返回 `countryOperators[X]`，是一组小写代码，如 `at_t`、`boost_mobile`。【文档原文确认 + 实测】
- **传参方式**：`getNumber` / `getRentNumber` / `serviceCountRent` 的 `operator` 参数，多个值用逗号分隔、不带空格。v1 的 `operator` 默认 `"any"`，正则 `^([a-zA-Z0-9!_]{2,},)*[_a-zA-Z0-9!]{2,}$`，文档原文："If omitted, any operator"。【文档原文确认】
  - 正则允许 `!` 字符，**推测**是排除某个运营商的写法。【推断/未确认】
- **返回里的运营商**：getNumberV2 的 `activationOperator`，v1 的 `operator`。
- **按运营商的价格和库存，公开 API 拿不到**：getPrices 和 offers 都只到"服务+国家"一级。
- **官网内部接口可以拿到**（非公开，可能随时变动）：`GET /api/v1/left-menu/services/{svc}/countries/{cid}/offers`，免登录可访问。【实测】
  - 每个运营商包含：`name`（API 代码）、`localName`（显示名，如 "AXIS (XL Axiata)"）、`activationsCount`、`freePriceOffers`（价格 → 累计数量）、`rentOffers`、`verificationsOffers`。
  - 列表中有一项 `name:"any"`（"Any operator"）。
  - 各运营商的起价和整个"服务+国家"的 `userPrice` 相同。据此**推测：价格按"服务+国家"定，运营商只起筛选库存的作用。**【推断】
  - 同一接口还返回 `userPrice`，匿名访问时大约是 `default × 1.2`；官网说明价格随会员等级变化。【观察/未确认】

## 8. "Any other" 服务
- 代码 **`ot`**，名称 "Any other"。【实测：getServicesList 与官网内部接口一致】
- 官网原文：如果找不到需要的服务，可选择任何其他（"Any Other"）。【官方站点确认】

---

## 9. 文档内的不一致和坑
1. 所有文本结果都声明为 JSON，错误却是 HTTP 状态码加 JSON，与原版 SMS-Activate 的"200 + 文本"不同。解析时先看 HTTP 状态码，再判断响应体是 `{` / `[` 开头还是纯文本，并去掉可能包裹的引号。
2. `NO_NUMBERS` 有三种形态：getNumber 为 200 文本，getRentNumber 为 404 JSON，v1 未说明。
3. `getStatusV2` 取消时返回文本 `STATUS_CANCEL`。
4. 数字字段在示例里常是字符串：`activationId`、`activationStatus`、`countryCode`。
5. setStatus 的示例值 1 不在枚举里。
6. v1 无效 key 的实测结果是 403 `BAD_API_KEY`，文档写 401。
7. `getCountries` 实际返回对象而不是数组，并多一个 `rent` 字段。
8. getNumberV2 的示例有效期是 2 小时，只是示例，不能当作规则。

---

## 10. 对我方设计最关键的 10 条事实

1. **有效期和取消窗口都是硬约束。**普通号 20 分钟，少数组合 40 / 45 / 60 分钟，以 `activationEndTime` 为准。取号后 **2 分钟内不能取消或换号**。**收到码后不能取消或换号**（`OTP_RECEIVED`）。这正好对应"接码成功后无法更换手机号"的需求。【文档 + 规则原文】
2. **上游退款只发生在"没收到码"的时候**：主动取消（状态 8），或到期自动退款（状态 10）。我方给买家退款，应以上游进入 8 或 10 为触发条件，不要只看自己的计时器。【原文 + 前端映射】
3. **先收款、后取号有失败风险。**取号可能返回 `NO_NUMBERS` / `WRONG_MAX_PRICE` / `BANNED` / `CHANNELS_LIMIT` / `NO_BALANCE`。付款前应先用 offers 或 getPrices 确认有库存并锁定价格。付款后取号时带上 `maxPrice = 我方成本上限`，防止上游涨价导致亏损（`WRONG_MAX_PRICE` 会通过 `info.min` 给出允许的最低价）。取号失败要有自动退款或转余额的流程。【原文 + 推断】
4. **换号有两种方式**：v1 的 `POST /activations/{id}/replace`，或者"取消 + 重新取号"。都只能在满 2 分钟、未收到码时使用。新号价格可能变化；频繁取消会拉低成功率，甚至导致封号。**应限制每单换号次数和换号时间窗口。**【原文 + 官方文案 + 推断】
5. **成本按"服务+国家"定价，公开 API 只到这一级。**operator 只是可选的筛选条件，默认 `any`，选定运营商会减少可用库存，公开 API 看不到按运营商的价格。定价公式"上游 USD 成本 × 汇率 + 加价"应以"服务+国家"为粒度，用 `/activations/offers/sms` 批量拉取后缓存。`getPrices` 和 `getTopCountries*` 已废弃。【原文 + 推断】
6. **同一激活期内再次收码免费**，多条短信会自动送达。买家页面应展示全部短信（`getAllSms` 或 v1 `/otp`），不能只显示 `STATUS_OK` 里的单个码；激活被取消或退款后就取不到短信了。【官网 + 原文】
7. **Webhook 只推送"收到短信"一种事件**：没有签名，只能靠两个来源 IP 做白名单校验；有重试所以必须幂等；需要账户开 2FA，最多 3 个地址。**取消、超时、退款仍需轮询**。【原文】
8. **限流是每账户 50 RPS，超限封 10 秒。**买家页面的轮询必须由我方后端集中拉取上游、写库，前端只查我方数据库，不能按买家请求一对一透传到上游。【规则原文 + 推断】
9. **所有买家共用我方一个上游账户，成功率统计是合并计算的。**会被"国家+服务"封禁（100 个以上且成功率 <6%）、全账户封禁、线程限制。应当：申请 Reseller 身份；用 **v1 `POST /activations` 传 `resellerUserId`**（兼容协议的 getNumber 文档里没有这个参数）；对 `BANNED` 读取 `info.scope` 和 `retry_after_seconds` 做降级处理。【规则原文 + 文档】
10. **"Any other" 的代码是 `ot`**；服务 811 个、国家 195 个，列表接口免 key，国家自带中文名 `chn`。但**服务名接口不返回中文（`lang=cn` 仍是英文）**，中文名需要自己维护。另外，按转售商规则，**不得复制 HeroSMS 的名称、logo、配色，不得把买家引导到 HeroSMS 客服**：只能复刻功能，界面要用我们自己的品牌，并且必须有自建客服页。【实测 + 规则原文】

---

**本地留存文件**（都在 `C:\Users\zbb\AppData\Local\Temp\claude\D--selfData-code-selling-system\ab827589-609b-4c60-82bf-5779ac1e4292\scratchpad\`）

| 文件 | 内容 |
|---|---|
| `openapi_cn.json` / `openapi_en.json` / `openapi_ru.json` | 完整规格原件 |
| `compact_en.txt` | 逐接口整理版 |
| `page_cn_rules.html.txt` | 规则页全文 |
| `msg_cn.json` | 官网中文文案 |
| `resp_getServicesList.txt` | 811 个服务 |
| `countries.json` | 195 个国家 |
| `ops_all.json` | 各国运营商 |
| `resp_cd.txt` | 例外时长 |
| `offers_tg_6.json` / `offers_ot_187.json` | 内部按运营商报价的示例 |

仓库代码没有改动。
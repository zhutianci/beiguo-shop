# hero-sms 只读 API 实测报告（部分完成，生产服务器探测被拦截）

**没做完的部分：** 第一步要在生产服务器上读 `.env.production` 里的 HEROSMS_API_KEY 并调接口，被权限系统拒绝了（理由：Production Reads）。这条命令完全没有执行，所以服务器上没有建 `/tmp/herosms-probe`，也就不用清理。我没有换别的方式绕过去。

所以下面凡是**需要 key** 的 action 都没测到：getBalance、getPrices、getTopCountriesByService(Rank)、getActiveActivations、getPricesVerification、getNumbersStatus。要补测，需要站长明确授权：要么放行在生产机读 key，要么在对话里提供一个可用的 key。

下面的数据分三种来源，每条都标了：
- **【实测】**：在本机用 curl 不带 key 调公开接口，只调了只读 action，没有任何取号、扣费或改状态的操作。
- **【文档】**：来自 GitHub 上第三方仓库 itemsCenter/herosms-integration 附带的 `api-docs.json`（hero-sms 官方 OpenAPI 的副本）。hero-sms 自己的文档站是 SPA，抓不到内容。
- **【仓库】**：来自 `D:\selfData\code\selling system\ai-service-shop\docs\接码-国家与卡类代码.md`，是 09-22 用 key 实拉的数据。

## 0. 接口通用行为【实测】
- 接口地址：`https://hero-sms.com/stubs/handler_api.php?action=...&api_key=...`，全部用 GET。
- 不需要 key 就能返回数据的只有三个：getCountries、getServicesList、getOperators。
- 需要 key 的 action，不带 key 时返回 HTTP 422：
  `{"title":"UNPROCESSABLE_ENTITY","details":"Validation failed","info":{"field":"api_key","code":"REQUIRED","message":""}}`
- **没法判断 BAD_ACTION：** 这个 422 在检查 action 之前就返回了。随便编一个 `action=fooBar` 也是同样的 422。所以 getPricesVerification、getNumbersStatus 到底存不存在，没法区分。【文档】列出的 action 共 14 个，这两个都不在里面，大概率不存在：
  getBalance, getNumber, getNumberV2, setStatus, getStatus, getStatusV2, getActiveActivations, getHistory, getCountries, getServicesList, getOperators, getPrices, getTopCountriesByService, getTopCountriesByServiceRank
- **耗时（本机到 hero-sms）：** 单次 2.3–6.0 秒，中位数约 3.5 秒，就算返回只有几十字节也这么慢。说明延迟主要在网络和对方网关上，数据量影响不大。**所有调用必须走服务端缓存，买家页面不能直接穿透调用。**

## 1. getCountries【实测】
- 耗时 2.9–4.0 秒，大小 21,145 B。连拉两次字节完全一致，基本是静态数据。
- 格式是**以国家 id 为 key 的对象**，不是【文档】写的数组：
  `{"187":{"id":187,"rus":"США","eng":"USA","chn":"美国（物理)","visible":1,"retry":1,"rent":1},"16":{"id":16,...,"eng":"United Kingdom","chn":"英格兰",...,"rent":1}}`
- 共 195 个国家，全部 `visible=1`、`retry=1`，其中 `rent=1` 的有 37 个。
- **没有 id 12**（美国虚拟号）。美国只有 187「美国（物理)」。
- `chn` 字段质量差，繁简混杂，还有错译：158 写成「丁烷」、146 写成「團圓」、128 写成「佐治亞州」、16 写成「英格兰」，187 的括号也不配对。**建议本站自己维护中文国名表。**

## 2. getServicesList【实测】
- 耗时 3.9–5.9 秒。全量 811 个服务，大小 26,386 B。
- 格式：`{"status":"success","services":[{"code":"full","name":"Full rent"},{"code":"go","name":"Google,youtube,Gmail"},...]}`，每条只有 code 和 name 两个字段。**没有图标 URL，没有价格。**
- **`lang=cn` 不给中文：** 它和 lang=en、不带 lang 的返回逐字节相同，都是英文。`lang=ru` 才是俄文（例：ot 返回 "Любой другой"）。811 个名字里只有 11 个自带中文，比如 `btd` "Volcengine 火山引擎"、`auh` "KeeTa 美团"、`ccw` "夸克  Quark"。**中文服务名要自己维护映射。**
- **「Any other」：** 代码是 `ot`，名字 "Any other"，在全量列表里排第 11 位。
- **排序：** 全量列表按热度排，前 30 个是：
  full, go, ig, lf(TikTok/Douyin), wa, ccu, fb, gp, wb(WeChat), tg, ot, ka(Shopee), dr(OpenAI), ds, mb, tw, qf(RedBook), ub, jg, cq, kc, nv, am, hw(Alipay), oi, ts(PayPal), wx(Apple), bex, qq
  带 `&country=` 时变成按字母排：
  - country=52：236 个服务，包含 ot。
  - country=187：264 个服务。
  - **建议：** 热度顺序取全量列表，某国能不能买用该国列表求交集。
- **其他格式细节：**
  - 代码长度：2 位 295 个，3 位 515 个，4 位 1 个；没有重复代码。
  - 有的名字带尾部空格，比如 `acz` 返回 "Claude "，用之前要 trim。
  - `full` 是整号租用，不是接码服务，需要过滤掉。
- **图标 CDN【实测，用 HEAD 请求验证】：**
  - 服务图标 `https://cdn.hero-sms.com/assets/img/service/{code}0.webp`：tg0、ot0、dr0、acz0 都返回 200。注意代码后面有个 **"0"**，不带 "0" 的 `tg.webp` 返回 404。
  - 国旗 `https://cdn.hero-sms.com/assets/img/country/{id}.svg`：187、52 都返回 200。
  - 建议把图标镜像到自己的 CDN，不要直接盗链。

## 3. getPrices（未测，需要 key）
- 【文档】结构是 国家 → 服务 → 价格三层嵌套：
  `{"<countryId>":{"<service>":{"cost":0.5,"count":10,"physicalCount":10}}}`
  - 参数 service、country 都可选。
  - `cost` 是单价，单位应该是美元：【文档】里 getNumberV2 / getHistory 返回的 `"currency":840` 是 ISO 4217 的 USD，和仓库里以 `$` 标注的实测价格一致。
  - `count` 是可用号码数，`physicalCount` 是其中的实体卡数量。
  - 每个 service+country 只有**一个 cost**，没有多档价格，也没有运营商维度。
- 【仓库】09-22 实测值（单价 · 库存）：

  | 国家 | dr（OpenAI） | acz（Claude） |
  |---|---|---|
  | 泰国 52 | $0.10 · 571,670 | — |
  | 美国 187 | $0.55 · 414,653 | $0.25 · 538,468 |
  | 荷兰 48 | $0.075 · 82,340 | $0.05 · 304,389 |
  | 菲律宾 4 | $0.025 | — |
  | 印尼 6 | $0.045 | — |

  泰国其他服务：go $0.10，wa $0.45，tg $0.40，ds $0.01。
- **还没测：** 全量大小（KB）和耗时；ot、wa、tg、go 各自最便宜的 10 个国家。

## 4. getOperators【实测】
- 格式：`{"status":"success","countryOperators":{"<id>":["op1",...]}}`，运营商代码全是小写 slug，**没有显示名**。
- 不带 country 时一次返回全部：大小 6,913 B，覆盖 137 个国家。有约 58 个国家没有这个 key，比如 70、79、81、93、97、100 等。
- 各国运营商：

  | 国家 | 数量 | 运营商代码 |
  |---|---|---|
  | 美国 187 | 19 | at_t, boost_mobile, cricket_wireless, free, h2o_wireless, hello_mobile, joltmobile, lycamobile, mint_mobile, moabits, physic, simple, smartone, textnow, tmobile, ultra_mobile, us_mobile, verizon, virgin |
  | 美国虚拟 12 | 0 | 返回空数组 `{"12":[]}` |
  | 英国 16 | 18 | airtel, cmlink, ee, ezmobile, generic_mobile, giffgaff, lebara, lycamobile, o2, orange, talk_telecom, tata_communications, teleena, tesco, three, tmobile, vectone, vodafone |
  | 印尼 6 | 6 | axis, byu, indosat, smartfren, telkomsel, three |
  | 泰国 52 | 5 | ais, cat_mobile, dtac, my, truemove |
  | 荷兰 48 | 7 | kpn, lebara, lycamobile, l_mobi, odido, tmobile, vodafone |
  | 加拿大 36 | 8 | at_t, cellular, chatrmobile, fido, lucky, rogers, telus, verizon |
  | 印度 22 | 3 | airtel, bsnl, vodafone |
  | 中国 3 | 4 | chinamobile, china_telecom, china_unicom, unicom |

- 【文档】取号时传 `operator=a,b`（逗号分隔、不留空格）。没找到的返回 `OPERATORS_NOT_FOUND`。
- 运营商列表里没有 "any"，所以前端「随机运营商」应该做成**不传 operator**。
- **「号码地区」的注意点：** hero-sms 的 API 里没有「地区」这一维度，只有**运营商**。注意这份清单**不含单个运营商的价格和库存**：getPrices 没有运营商维度，所以选了运营商之后的实际价格和能不能取到号，只能在取号时由 maxPrice 和 NO_NUMBERS 兜底。

## 5. getTopCountriesByService / Rank（未测，需要 key）
- 【文档】结构（未经实测验证）：
  `{"<service>":[{"country":6,"price":0.045,"retail_price":0.2,"count":4528,"physicalTotalCount":9405,"physicalCountForDefaultPrice":4066,"physicalPriceMap":{"0.018":1234,"0.025":5678}}]}`
  - 参数：service 可选，freePrice=true/false。
  - `price` 是折后价，`retail_price` 是零售价。
  - `physicalPriceMap` 是「价格 → 数量」的多档映射，这是唯一带多档价格的地方。
  - Rank 版本按账户等级给价，结构相同。
  - **没有成功率字段。**
- 注意：老版 SMS-Activate 在 freePrice=true 时返回的字段叫 `freePriceMap`，hero-sms 可能已改名为 `physicalPriceMap`，需要实测确认。
- dr、acz、ot、wa、tg 的实际返回都没测。

## 6. 其他与流程设计相关的约束【文档 + 公开页面】
- **getNumberV2 返回：**
  `{"activationId":635468024,"phoneNumber":"79584******","activationCost":12.5,"currency":840,"countryCode":"2","canGetAnotherSms":"1","activationTime":"...","activationOperator":"mtt"}`
  - 错误码：NO_NUMBERS、`WRONG_MAX_PRICE:<最低价>`（冒号后是能成交的最低价）、BAD_SERVICE、`BANNED:'时间'`、CHANNELS_LIMIT、ORDER_ALREADY_EXISTS、NO_KEY、BAD_KEY。
- **getStatusV2 返回：**
  `{"verificationType":2,"sms":{"dateTime","code","text"},"call":{"from","text","code","dateTime","url","parsingCount"}}`
  可能收到的是语音验证码，页面要能展示 call 的内容。
- **getStatus 文本状态：** STATUS_WAIT_CODE、`STATUS_WAIT_RETRY:码`、STATUS_WAIT_RESEND、`STATUS_OK:码`、STATUS_CANCEL、NO_ACTIVATION。
- **setStatus 状态码：**

  | 状态码 | 含义 | 返回 |
  |---|---|---|
  | 1 | 号码就绪 | ACCESS_READY |
  | 3 | 请求重发 | ACCESS_RETRY_GET |
  | 6 | 完成 | ACCESS_ACTIVATION |
  | 8 | 取消并退款 | ACCESS_CANCEL |

  - **取号后 2 分钟内不能取消**，会返回 `EARLY_CANCEL_DENIED`。这直接限制「更换手机号」：取号后 2 分钟内不能换。
  - 号码有效期 **20 分钟**，没收到码自动退款到 hero-sms 余额。本站 `HEROSMS_TIMEOUT_MIN` 应小于等于 20。
  - 收到码以后只能调 6（完成）或 3（请求重发），不能调 8 退款。这和「接码成功后不能换号」的需求一致。
- **getActiveActivations：** 参数 start、limit（最多 100）。返回：
  `{"status":"success","activeActivations":[{"activationId","serviceCode","phoneNumber","activationCost","activationStatus","smsCode","smsText","activationTime","discount","repeated","countryCode","countryName","canGetAnotherSms","currency"}]}`
  没有记录时返回 NO_ACTIVATIONS。
- **getHistory：** 参数 start、end（Unix 时间戳）、offset、size（最多 100）。返回：
  `[{"id","date","phone","sms","cost","status","currency":840}]`
- **getBalance：** 返回文本 `ACCESS_BALANCE:<amount>`。

## 7. 建议的缓存 TTL

| 数据 | 建议 TTL | 理由 |
|---|---|---|
| getCountries / getServicesList（全量加按国家） / getOperators（全量拉一次） | 12–24 小时 | 基本静态，单次 3–6 秒 |
| getPrices（按 service 或按 country 拉） | 60–120 秒，加后台预热 | 价格和库存实时变动；单次 3–5 秒，不能在买家下单时同步拉 |
| getTopCountriesByService | 60–120 秒 | 同上 |
| getStatus | 不缓存 | 每个激活单独轮询，每 3–5 秒一次 |

**下单时一律带 `maxPrice`：**
- 设为缓存里的 cost 乘一个上浮系数。
- 遇到 `WRONG_MAX_PRICE:x` 就按 x 重新核价，并提示买家补差价或换国家。
- 遇到 NO_NUMBERS 引导买家换运营商或换国家。

## 待补测（需要站长授权读取生产 key）
1. getBalance。
2. getPrices：全量、`service=ot`、`country=52`、`service=ot&country=52`，记录大小、耗时，以及是否真的只有一档价格。
3. getTopCountriesByService：dr、acz、ot、wa、tg，freePrice 分别为 true 和 false，确认字段名到底是 physicalPriceMap 还是 freePriceMap，retail_price 和 price 的关系。
4. ot、wa、tg、go 各自最便宜的 10 个国家（价格、库存）。
5. getActiveActivations 的真实形状。
6. getPricesVerification、getNumbersStatus 带 key 调用时是否返回 BAD_ACTION。

本机公开接口的原始返回保存在：
`C:\Users\zbb\AppData\Local\Temp\claude\D--selfData-code-selling-system\ab827589-609b-4c60-82bf-5779ac1e4292\scratchpad\hs\`
包括 countries.json、svc_*.json、ops_*.json。

参考来源：
- [itemsCenter/herosms-integration api-docs.json](https://github.com/itemsCenter/herosms-integration)
- [osyduck/Hero-SMS](https://github.com/osyduck/Hero-SMS)
- [hero-sms.com](https://hero-sms.com/cn)
- [sms-activater.com HeroSMS review](https://sms-activater.com/reviews/hero-sms-com/)
export const meta = {
  name: 'sms-jiema-design',
  description: 'Research hero-sms (API+UX+live probe+competitors+codebase) and produce a verified design doc for a generic 短信接码 section',
  phases: [
    { title: 'Research', detail: 'API docs / site UX / live read-only probe / codebase map / competitors' },
    { title: 'Design', detail: 'synthesize full design doc' },
    { title: 'Review', detail: 'adversarial review by 3 lenses' },
    { title: 'Revise', detail: 'apply confirmed fixes, finalize doc' },
  ],
}

const REPO = 'D:/selfData/code/selling system/ai-service-shop'
const DOC = REPO + '/docs/短信接码-设计.md'
const RESEARCH_DOC = REPO + '/docs/短信接码-调研.md'

const USER_REQ = `
【站长原始需求】
网站 bigolab.com（Next.js 14 App Router + Prisma + MySQL，真实营业的 AI 订阅转售站，仓库 ${REPO}）已经对接了 hero-sms（https://hero-sms.com ，SMS-Activate handler_api.php 协议）做 Codex / Claude 的单品接码（后台商品配 smsService/smsCountry/smsMaxPrice，付款后自动取号）。现在要：
1. 导航栏新增【短信接码】，完整复刻 hero-sms 的短信验证服务：支持所有服务的接码，可搜索服务，搜不到时建议使用「Any other」服务；
2. 选完国家后可选「号码地区」（运营商/operator）；
3. 选完后提交付款 → 去付款页 → 支付完成后跳到拿到的手机号页面；
4. 支持多次更换手机号；接码成功之后不能再换号；
5. 客服页面，特殊情况买家能联系到站长；
6. 后台定价：成本价为美元（如 $0.01），后台设汇率 x、加价 y 元，则向买家收 0.01*x + y 人民币；
7. 从用户体验、逻辑完整性、服务周全、页面流畅美观、功能丰富等角度调研、构思、设计；参考成熟平台和大厂的成熟方案；务必保证整体流程与逻辑正确。
`

const REPO_RULES = `
【仓库已知硬约束（来自交接文档与记忆，设计必须遵守）】
- 先读 ${REPO}/docs/交接-进度与待办.md 相关章节；设计文档风格参考 ${REPO}/docs/多渠道分销-设计.md、docs/营销推广-设计.md（中文、讲清「为什么」）。
- Order.amount 永远是不含税货款，开票税费单独放 invoiceTaxFee；收银台收 amount+invoiceTaxFee。
- schema 改动上线必须「先 db push 再换镜像」。
- 后台接口一律 adminGuard；登录门禁等 useHydrated。
- 收银台只支持支付宝；下单不填邮箱。
- 多渠道分站（tenant，如 lulu.bigolab.com）已上线，订单有 tenantId 与结算快照列。
- 服务器 1.8G 内存，cron 容器每分钟调 /api/cron/sms-poll；cron 鉴权 fail-closed（lib/cron-auth.ts）。
- 现有接码核心：src/lib/herosms.ts、src/lib/sms.ts（acquireForOrder / pollActivation / retryActivation 全部 CAS 写入）、src/components/order-sms.tsx、src/app/api/orders/[id]/sms/*、prisma SmsActivation（orderId @unique）。
- 已有 docs/接码-国家与卡类代码.md（国家/服务代码实测）。
`

const NO_SPEND = `
【绝对禁止】不得登录/注册 hero-sms、不得提交任何表单、不得付款；不得调用 getNumber / getNumberV2 / setStatus / getRentNumber / 任何会取号、扣费、改状态的 action。不得修改仓库代码（除非明确要求你写文档）。`

phase('Research')

const researchTasks = [
  {
    key: 'api-docs',
    prompt: `${NO_SPEND}
任务：完整调研 hero-sms 的 API 文档。页面：https://hero-sms.com/cn/api 、https://hero-sms.com/api （及其中链接的子页）。该文档站是 SPA，WebFetch 很可能拿不到内容——请用内置浏览器工具（ToolSearch 加载 mcp__Claude_Browser__tabs_create, navigate, get_page_text, read_page, computer, find；**先 tabs_create 建自己的 tab 并始终传 tabId**，因为有别的 agent 同时用浏览器），必要时逐个展开折叠项/切换 tab 读取；也可 WebFetch / WebSearch 辅助（如 GitHub 上的 hero-sms SDK、sms-activate 兼容协议文档）。
产出一份**中文、完整、精确**的 API 参考，覆盖：
1. Base URL、鉴权、请求/响应格式（文本 vs JSON）、是否兼容 SMS-Activate 协议、限流。
2. **每一个 action**：名字、全部参数（原样写参数名，如 service/country/operator/maxPrice/fixedPrice/activationType/phoneException/ref/forward/verification/useCashBack 等凡文档有的）、成功返回样例、全部错误码（NO_NUMBERS/NO_BALANCE/BAD_KEY/BAD_ACTION/BAD_SERVICE/WRONG_MAX_PRICE/BANNED/NO_ACTIVATION/EARLY_CANCEL_DENIED 等）。尤其：getBalance、getNumber、getNumberV2、getStatus、getStatusV2、setStatus（1/3/6/8 各自含义与前置条件）、getActiveActivations、getPrices、getPricesVerification、getCountries、getServicesList、getOperators、getTopCountriesByService、getAdditionalService/getExtraActivation、getFullSms、rent 系列、webhook（回调格式、签名、IP）。
3. 规则与时序：激活有效期（20 分钟？）、取号后多久内不能取消（EARLY_CANCEL_DENIED 的时长）、取消是否退款、只有收到码才扣费还是取号即扣费、再次收码（status 3）如何工作与计费、多条短信如何返回、号码被目标平台拒绝时怎么办。
4. 运营商/号码地区（operator）在 API 中如何表达（getOperators 返回结构、getNumber 的 operator 参数取值、"any"）。
5. 「Any other」服务的代码（通常 ot）及说明。
逐条标注「文档原文确认」或「推断/未确认」。最后附一节「对我方设计最关键的 10 条事实」。直接输出报告正文。`,
  },
  {
    key: 'site-ux',
    prompt: `${NO_SPEND}
任务：从**用户体验**角度细致调研 https://hero-sms.com/cn （以及英文版 https://hero-sms.com ）在**未登录**状态下可见的全部流程与页面细节。用内置浏览器工具（ToolSearch 加载 mcp__Claude_Browser__tabs_create, navigate, get_page_text, read_page, computer, find, resize_window；**先 tabs_create 建自己的 tab 并始终传 tabId**，有别的 agent 同时在用浏览器）。多截图观察视觉，但以 read_page/get_page_text 为准记录文字。可点击展开、搜索、切换国家——但**不要**点任何购买/注册/登录提交按钮（点购买会跳登录的话，只记录它会跳登录即可，不要填写）。
请记录：
1. 首页整体布局（左侧服务栏/国家栏/价格区等），桌面与手机（resize_window mobile）两种形态。
2. 服务选择：列表排序、图标、收藏/置顶、热门、搜索交互（模糊搜索？中英文？别名？）、搜不到时的提示与「Any other」引导文案（原样摘录短句）。
3. 国家选择：每行展示什么（国旗/名称/价格/库存数量/成功率?），排序方式（价格/数量/热门），搜索，库存为 0 时如何展示。
4. 运营商/号码地区选择的交互（在哪一步出现、默认 any、价格是否因运营商变化）。
5. 价格展示（货币、是否显示「起」、是否有多档价格/批发价/「保证价」）。
6. 购买后激活面板（能从公开的帮助/FAQ/教程/截图/视频中了解到的）：号码展示与复制、倒计时、状态、取消/完成/再次收码按钮、短信全文、历史记录、多个同时激活。
7. FAQ / 规则页 / 帮助中心 / 退款规则 / 客服入口（在线客服、Telegram、工单）的全部要点。
8. 其他功能：API、租号(rent)、批量、推荐返利、语言/货币切换、通知等。
输出：中文报告，按页面/流程组织，最后给「值得我方复刻的 UX 要点清单（按优先级）」和「hero-sms 做得不好、我方可以做得更好的点」。`,
  },
  {
    key: 'live-probe',
    prompt: `${NO_SPEND}
任务：在生产服务器上用**只读** action 实测 hero-sms API 的真实返回结构，给设计提供确凿的数据形状。
操作服务器方法（严格遵守）：阿里云 Workbench CLI，Windows 路径 C:\\Users\\zbb\\AppData\\Local\\Programs\\workbench\\workbench.exe，实例 i-2ze8s6my1msl5q6thpum，region cn-beijing。用 PowerShell 工具执行，**所有远程命令一律 base64 传输**：
$wb="$env:LOCALAPPDATA\\Programs\\workbench\\workbench.exe"; $script=@'
<bash>
'@; $norm=$script -replace "\`r\`n","\`n"; $b64=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($norm)); & $wb exec -i i-2ze8s6my1msl5q6thpum -r cn-beijing --timeout 300 -c "echo $b64 | base64 -d | bash"
exec 会截断长输出：先把结果写到服务器 /tmp/herosms-probe/*.json，再分段用 head -c / python3 -c 摘要读取。
API Key 在 /opt/beiguo/beiguo-shop/.env.production 的 HEROSMS_API_KEY（用 set -a; . ./.env.production; set +a 读取，**绝不把 key 打印到输出**，输出里如出现 key 要替换）。用 curl（该接口拦 Python 默认 UA）。
**绝对禁止**：docker system df（会 OOM 打挂整机）、任何 docker build、重启容器、改文件（/tmp 之外）、以及白名单外的 action。
白名单 action（只读、不花钱）：getBalance, getCountries, getServicesList（试 lang=cn / lang=en / country 参数）, getPrices（无参、带 service、带 country、带 service+country）, getPricesVerification（若存在）, getOperators（带 country）, getTopCountriesByService（带 service，试 freePrice=true）, getActiveActivations, getNumbersStatus（若存在）, getServicesAndCostWithStatistics / getOperatorsByCountry 之类只读查询（先确认是只读再调）。
请测量并报告：
1. 每个 action 的原始返回格式（截取有代表性片段）、字段含义、单位（价格是美元吗？count 是库存吗？）、数据量（服务数、国家数、getPrices 全量大小 KB 与耗时）。
2. getServicesList 是否带中文名、图标 URL？「Any other」的代码与名字。
3. getPrices 中同一 service+country 是否有多档价格（如 {cost,count,physicalCount} 或 价格→数量 的 map / freePriceMap），是否有 operator 维度。
4. getOperators 的返回结构；几个大国（美国187? 12?, 英国16, 印尼6, 泰国52, 荷兰48）各有哪些运营商。
5. getTopCountriesByService 对 dr、acz、ot、wa、tg 的返回（含 retail_price / price / count / 成功率字段?）。
6. 以 service=ot（或 Any other 实际代码）、wa、tg、go 为例列出前 10 便宜国家的价格与库存。
7. 响应耗时，建议的缓存 TTL。
全部结论用中文报告，附原始片段；标注哪些 action 不存在（返回 BAD_ACTION）。最后清理 /tmp/herosms-probe。`,
  },
  {
    key: 'codebase',
    prompt: `${NO_SPEND}
任务：深入阅读仓库 ${REPO}，为「新增通用短信接码板块」产出**集成点地图**。只读，不改代码。
${REPO_RULES}
请逐项查清并引用 文件:行号：
1. 现有接码全链路：herosms.ts / sms.ts / order-sms.tsx / api/orders/[id]/sms(+retry) / api/cron/sms-poll / pay/sms-notify(这个是什么？收款短信监控还是接码？) / Product 上 sms* 字段 / fulfillOrder（lib/vmq.ts）里触发取号的位置 / 超时与【待退款】处理 / 后台如何看接码记录。
2. 下单与支付：lib/order/create-shop-order.ts、收银台/支付宝/VMQ 流程、订单超时关闭（vmq-close）、支付回调幂等、付款成功跳转页面、Order 模型必填字段（productId 必填！新板块没有固定商品时怎么办？现有是否有「虚拟商品」先例）、PayMethod/PayStatus/DeliveryStatus 枚举。
3. 用户体系与钱包：是否有站内余额（wallet/BalanceLog）、余额支付、余额退款是否已有实现；匿名下单是否允许（订单查询 lookup 页）；登录门禁。
4. 优惠券/推荐返现/抽奖/开票/营销邮件/渠道分站（tenant）对订单的钩子——新接码订单应该参与还是排除，各自的代码入口在哪。
5. 导航栏（components/layout/header.tsx）结构、移动端菜单；客服页（app/(shop)/support/page.tsx）现在有什么（微信二维码？留言？企业微信推送 lib/notify.ts）；站点设置（后台 settings 表/接口）可放汇率/加价配置的位置。
6. 后台：admin 目录结构、adminGuard、商品/订单页、仪表盘利润统计口径（成本字段 ExternalOrder 成本报价利润）——接码订单的成本/利润如何落库展示。
7. cron 容器 crontab 在哪、如何加任务；lib/cron-auth.ts。
8. UI 技术栈（tailwind、组件库、图标库、国旗/服务图标可用资源）、现有页面视觉风格。
输出：中文「集成点地图」，每点给出事实+文件行号+对新设计的含义/风险。末尾列「新设计必须复用的模块」「必须避免的坑」「需要新增的 schema 候选」。`,
  },
  {
    key: 'competitors',
    prompt: `${NO_SPEND}
任务：调研成熟接码平台与大厂在同类「按次取号收码 + 预付款 + 失败退款」业务上的**成熟方案与逻辑**，供我方设计参考。用 WebSearch / WebFetch（ToolSearch 加载），必要时用内置浏览器（mcp__Claude_Browser__*，先 tabs_create 建自己 tab 并传 tabId）。
对象：sms-activate（已于 2025 关停？确认，它的规则是业界事实标准）、5sim.net、smspool.net、grizzlysms、tiger-sms、sms-man、onlinesim、textverified、smsbower，以及中文圈接码/转售站的常见做法。
重点比较：
1. 计费模型：先充值余额再按次扣 vs 单次直接付款；冻结(hold)金额→收码才扣→失败解冻 的做法；价格波动如何处理（下单时锁价？maxPrice？）。
2. 激活生命周期与状态机：有效期（15/20 分钟）、早取消限制（2 分钟）、取消自动退款、超时自动退款、收码后再收一条（重发）规则、收码后不可取消、号码「坏号」报告与自动换号。
3. 换号策略：免费换号次数、冷却、换号是否重新计价。
4. 运营商/地区选择、「Any other」、服务搜索（别名、多语言）、价格与库存展示、成功率展示、收藏。
5. 退款与售后：自动退回余额 vs 原路退、争议处理、客服渠道（Telegram/工单/在线聊天）、SLA。
6. 反滥用与风控：限频、同一用户并发激活上限、黑名单、防刷单、价格被上游抬升时的保护。
7. 大厂成熟模式可借鉴：Stripe PaymentIntent 的状态机/幂等键、电商「预授权-扣款-撤销」、Outbox/对账、订单超时关闭、补偿事务（SAGA）；如何保证「付款成功但取号失败」「上游扣了钱我方没记录」「重复回调」都不出错。
输出：中文报告：每个平台一小节要点 + 一张对比表 + 「推荐我方采用的规则集（含具体数值建议与理由）」。标注信息来源 URL。`,
  },
]

const research = await parallel(researchTasks.map(t => () =>
  agent(t.prompt, { label: 'research:' + t.key, phase: 'Research' }).then(r => ({ key: t.key, text: r }))
))
const got = research.filter(r => r && r.text)
log('Research done: ' + got.map(r => r.key).join(', ') + (got.length < researchTasks.length ? ' (some failed)' : ''))
const researchBundle = got.map(r => `\n\n==================== 调研：${r.key} ====================\n${r.text}`).join('')

phase('Design')
const designResult = await agent(`你是资深产品+架构师。基于下面的五份调研，为 bigolab.com 设计「短信接码」通用板块，并写成两个文件：
1) ${RESEARCH_DOC} —— 调研汇编（整理后的 hero-sms API 参考、UX 观察、实测数据形状、竞品对比、集成点地图；可精简但事实完整，保留来源与「未确认」标记）。
2) ${DOC} —— 设计文档（设计契约，后续实施以它为准）。
${USER_REQ}
${REPO_RULES}
设计文档必须包含（中文，讲清每个决策的「为什么」，可引用代码 文件:行号）：
0. 裁决表：所有关键决策一行一条（决策/选择/理由/被否方案）。例如：单次付款 vs 余额充值、失败退款去向（站内余额即时到账 vs 原路退款 vs 待客服）、是否锁价、换号次数/冷却/是否另收费、收码后是否允许「再收一条」、是否上渠道分站、是否参与优惠券/推荐返现/抽奖/开票。
1. 用户旅程与页面：导航入口、/sms（或更好的路由，给 SEO 考虑）主页面（服务列表+搜索+热门+收藏、国家列表含价格与库存、运营商/号码地区选择）、确认下单、付款页（复用现有收银台）、号码页（号码/复制/倒计时/状态/短信全文/换号/取消/完成/联系客服）、我的接码记录、客服页。给出每页线框（ASCII/文字）、桌面与手机布局、空状态/加载/错误/缺货态与文案；搜不到服务时引导 Any other 的文案。
2. 完整状态机：订单（未付款→已付款→取号中→等码→已收码→完成 / 取号失败 / 超时 / 买家取消 / 退款中 / 已退款）与激活记录（多次换号 = 一单多个激活，建议新表 SmsAttempt 或类似；说明与现有 SmsActivation.orderId @unique 的关系与迁移/兼容策略）。每个转移：触发者、前置条件、上游调用、数据库 CAS 写法、失败补偿、幂等键。画状态图（mermaid 或 ASCII）。
3. 关键异常全覆盖（逐条给处理）：付款后无库存 NO_NUMBERS；付款后上游价格上涨超过 maxPrice；上游余额不足 NO_BALANCE；取号成功落库失败；付款回调重复/迟到（订单已超时关闭后才到账）；换号时并发轮询；换号时码刚好到达；上游早取消拒绝；激活到期；收到码后买家说码不对/没用；买家关页面；cron 挂掉；上游宕机；汇率/加价在下单与付款之间被后台修改；同一买家大量并发下单；渠道站订单。
4. 定价：公式 售价 = 成本(USD)×汇率x + 加价y，取整规则（精确到分、向上取整？给理由）、最低售价、按服务/国家的覆盖加价（可选）、价格展示用哪个成本（getPrices 最低档？运营商价？）、下单锁价与 maxPrice 传参（锁定 costUsd 快照 + 容差）、换号时成本变化谁承担、利润落库字段、后台展示。给数值例子。
5. 数据模型：Prisma schema 增量（新表/新列，全部可空或带默认值，兼容现有数据），索引、唯一约束；配置存储（汇率、加价、超时分钟、换号上限、冷却、启停开关、服务黑白名单、中文别名）。
6. 服务端：hero-sms 客户端扩展（getPrices/getServicesList/getOperators/getTopCountriesByService 等）、目录缓存策略（进程内+DB，TTL，1.8G 内存约束下的数据量）、API 路由清单（公开目录接口/下单/订单状态轮询/换号/取消/完成/后台配置），每个接口的鉴权、限频、输入校验、返回 DTO（不得泄露成本）。
7. 后台：定价配置页、接码订单列表（每单多次尝试、成本/利润、上游原始返回）、手动退款/补号、服务别名与热门配置、上游余额与告警（余额低于阈值企业微信推送）。
8. 客服：客服页设计（微信/企业微信/留言工单），号码页内一键「联系客服」自动带订单号与激活信息；站长侧通知。
9. 退款与资金：自动退款规则、退到哪里、与 Order.amount/发票/推荐返现/渠道结算的关系，对账方法。
10. 反滥用、安全、监控告警、日志。
11. 实施分包（按可独立上线的包拆分，含每包的 DDL、验收用例清单）与上线步骤（先 db push 再换镜像）。
12. 测试用例清单（正常流 + 每个异常），以及需要站长拍板的开放问题（尽量少，给出默认建议）。
要求：凡调研中「未确认」的上游行为，设计要做成对两种可能都安全（防御式），并在文中标注。不要改动任何代码文件，只写这两个文档。写完后返回：两个文件路径 + 设计要点摘要（≤40 行）。

${researchBundle}`, { label: 'design:synthesize', phase: 'Design' })

phase('Review')
const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          section: { type: 'string' },
          problem: { type: 'string' },
          scenario: { type: 'string', description: '具体触发场景与后果' },
          fix: { type: 'string', description: '具体修改建议' },
        },
        required: ['severity', 'section', 'problem', 'scenario', 'fix'],
      },
    },
  },
  required: ['findings'],
}
const lenses = [
  { key: 'money-state', text: '资金与状态机正确性：逐个状态转移与异常推演，找出会导致「买家付了钱拿不到号也没退款」「退款重复」「上游扣费我方未记录/未释放号码」「利润算错」「并发下状态被覆盖」「换号上限/冷却被绕过」「收码后仍能换号或退款」的漏洞；核对幂等键与 CAS 条件是否真能挡住；核对定价公式、取整、锁价与 maxPrice 在换号时的行为。' },
  { key: 'ux-parity', text: '用户体验与对 hero-sms 的复刻完整度：对照调研汇编里 hero-sms 的 UX 与 API 能力，找出遗漏的功能与交互（搜索/Any other 引导/国家与运营商/价格库存展示/号码页操作/再收码/历史/客服入口/手机端/空状态与错误文案/倒计时与提示），以及流程中让买家困惑或卡住的点；判断页面信息架构是否流畅。' },
  { key: 'integration', text: '与现有代码库集成与运维可行性：打开设计里引用的真实代码核对（文件:行号是否真实、描述是否正确），检查与 Order 模型（productId 必填等）、收银台、vmq fulfillOrder、订单超时关闭、优惠券/推荐返现/抽奖/发票/渠道分站/营销邮件、cron、adminGuard、db push 顺序、1.8G 内存、hero-sms API 真实能力（调研汇编中的实测数据）是否冲突；找出设计里假设了但上游/代码其实不支持的东西。' },
]
const reviews = await parallel(lenses.map(l => () =>
  agent(`你是挑剔的评审，目标是**推翻**设计中错误或不周全之处。阅读 ${DOC} 与 ${RESEARCH_DOC}，必要时阅读仓库代码（${REPO}）。
评审视角：${l.text}
${REPO_RULES}
只报告真实、具体、可复现的问题；每条给严重度、所在章节、问题、触发场景与后果、具体修改建议。不要报告风格问题。不要改任何文件。`,
    { label: 'review:' + l.key, phase: 'Review', schema: FINDINGS }).then(r => ({ lens: l.key, findings: (r && r.findings) || [] }))
))
const allFindings = reviews.filter(Boolean).flatMap(r => r.findings.map(f => ({ ...f, lens: r.lens })))
log('Review findings: ' + allFindings.length + ' (critical ' + allFindings.filter(f => f.severity === 'critical').length + ', major ' + allFindings.filter(f => f.severity === 'major').length + ')')

phase('Revise')
const final = await agent(`你是设计文档的作者。下面是三位评审对 ${DOC} 的意见（JSON）。请：
1) 逐条核实（必要时读代码/调研汇编 ${RESEARCH_DOC}），成立的就修改 ${DOC}（以及必要时 ${RESEARCH_DOC}）；不成立的在文末「评审处理记录」表里写明驳回理由；
2) 修改后通读全文，保证各章节前后一致（状态机、定价、schema、API、分包、测试用例互相对得上）；
3) 在文档顶部加「版本/日期 2026-09-28/状态：待站长确认」与一段 ≤15 行的执行摘要；
4) 不要改任何代码文件。
${USER_REQ}
${REPO_RULES}
评审意见：
${JSON.stringify(allFindings, null, 1)}

完成后返回（中文）：
- 文件路径
- 执行摘要（≤25 行，含关键裁决）
- 评审处理统计（采纳/驳回条数，列出 critical 与 major 的处理结果各一行）
- 需要站长拍板的开放问题（逐条，含默认建议）`, { label: 'revise:finalize', phase: 'Revise' })

return { design: designResult, final, findingsCount: allFindings.length, researchOk: got.map(r => r.key) }

/**
 * 卡密兑换：与**任何具体充值平台无关**的领域类型。
 *
 * 【这个文件存在的全部意义，是让第二家平台接入时不用改前端】
 * 我们从不同商家拿货，同一个商品的不同批次可能来自不同上游，各家 API 形状完全不同：
 * 字段名不一样、状态码不一样、错误文案不一样。如果前端直接读上游的 JSON，
 * 接第二家时整个兑换页都要重写一遍，接第三家再重写一遍。
 *
 * 所以约定：**上游的字段名、状态码、文案，一个都不许漏到这一层之外。**
 * 适配器（providers/*.ts）负责把各家的响应翻译成下面这些类型，
 * 页面与接口只认这些类型。加一家平台 = 加一个适配器文件 + 注册一行，前端零改动。
 *
 * 【买家永远看不到上游是谁】对外一律是「贝果科技 · AI会员自助充值系统」。
 * 上游的 msg 可能带对方品牌或内部术语，所以文案由我们按稳定机器码自己映射，
 * 不直接透传 —— 见各适配器里的 message 映射表。
 */

/** 买家要填的账号字段类型。新增类型时，兑换页要同步加一种输入控件 */
export type RedeemFieldKind =
  /** Claude 的 sessionKey，sk-ant-sid 开头 */
  | 'session_key'
  /** ChatGPT 的完整 session JSON（含 accessToken）*/
  | 'session_json'
  /** 标准 UUID（Claude Organization ID / Grok userId）*/
  | 'uuid'
  /** 开关选项（如 GPT 的「放弃剩余会员时间强制充值」）。提交时值为 '1' / '' */
  | 'toggle'

export interface RedeemField {
  /** 提交时用的字段名。**这是我们自己的名字**，不是上游的 —— 适配器负责映射 */
  name: string
  kind: RedeemFieldKind
  /** 输入框标题，如「Claude SessionKey」 */
  label: string
  /** 一句话说明去哪里取这个值 */
  help: string
  placeholder?: string
  /** 前端粗校验用的正则源码字符串。**只是体验优化，真正的校验在上游** */
  pattern?: string
  required: boolean
  /** 多行输入（session JSON 很长） */
  multiline?: boolean
}

/**
 * 卡密状态。上游各家的状态码五花八门，全部收敛到这几个。
 *
 * 【区分 READY 与 COMPLETED 是刚需】买家最常见的操作就是重复打开页面看一眼，
 * 已完成的卡必须明确告诉他「已经充好了，账号是 xxx」，而不是让他再提交一次。
 */
export type RedeemState =
  | 'READY' // 可以提交
  | 'PROCESSING' // 上游处理中，稍后再查
  | 'COMPLETED' // 已完成
  | 'COOLDOWN' // 冷却中，过一会儿才能提交
  | 'OUT_OF_STOCK' // 上游缺货
  | 'VOID' // 已作废 / 售后处理过 / 换码作废
  | 'NOT_FOUND' // 上游查不到这张卡
  | 'ERROR' // 其他异常

/** 服务可用性横幅。上游给了就展示，没有就不展示 —— 拉取失败绝不能挡住主流程 */
export interface RedeemNotice {
  level: 'normal' | 'unstable' | 'abnormal' | 'unknown'
  text: string
}

/**
 * 取号指引的一步。
 *
 * 【为什么指引也由适配器提供，而不是写死在页面里】
 * 不同产品的取值路径完全不同：Claude 要开 F12 从 Cookie 里翻 sessionKey（6 步），
 * ChatGPT 只要打开一个 URL 复制整段 JSON（4 步）。
 * 写死在页面里，接第二家平台、或上游换了取值方式，就得改前端 ——
 * 而那正是这套抽象要避免的事。
 */
export interface RedeemGuideStep {
  title: string
  detail: string
  /** 可直达的官方页面，如「打开 AuthSession 页面」 */
  link?: { label: string; url: string }
}

/**
 * 一条充值渠道。
 *
 * 【为什么需要这个概念】sysa 靠卡密自己就能判出产品（响应里带 app 字段），
 * 但 sysb 不行 —— 它的文档明确写着**不要预检卡密**，而 ChatGPT 的
 * 「信用卡通道」和「iOS 通道」是两个不同的产品，卡密前缀（PLUS-/5X-）
 * 只说明档位、区分不了通道。上游自己的页面也是让用户先选「按购买的卡密类型选择」。
 *
 * 所以：适配器给得出唯一路径时就不返回 variants（sysa 就是这样，前端毫无变化）；
 * 给不出时返回多条，前端渲染成渠道选择，选中哪条就用哪条的 fields 与 guide。
 */
export interface RedeemVariant {
  /** 渠道标识，提交时原样回传给适配器 */
  code: string
  label: string
  /** 一句话说明这条渠道对应什么卡 */
  hint?: string
  fields: RedeemField[]
  guide?: RedeemGuideStep[]
  guideIntro?: string
}

export interface RedeemCheckResult {
  state: RedeemState
  /** 给买家看的一句话。已经是我们自己的文案，可直接渲染 */
  message: string
  /** 上游的商品名，如「Claude Pro」。用于让买家确认卡对不对 */
  productName?: string
  /** 该填哪些账号字段。state=READY 时才有意义 */
  fields: RedeemField[]
  /** 分步取号指引。按产品不同而不同，由适配器给出 */
  guide?: RedeemGuideStep[]
  /** 指引的一句话总述 */
  guideIntro?: string
  /**
   * 多条充值渠道，买家需要先选一条。为空/缺省表示只有一条路径，
   * 直接用上面的 fields / guide（sysa 就是这种）。
   */
  variants?: RedeemVariant[]
  /** 已自动判定的渠道 code。前端应默认选中它，买家仍可改 */
  variantDefault?: string
  /** 渠道选择区的标题与说明 */
  variantLabel?: string
  variantHint?: string
  /** 已完成时的账号展示值（邮箱或 UID） */
  account?: string
  completedAt?: string
  /** 冷却剩余秒数 */
  cooldownSeconds?: number
  notice?: RedeemNotice | null
  /**
   * 上游的请求追踪号。**只用于排查，不展示给买家**（除非出错时给客服看）。
   * 对接文档明确建议与卡密一起留存。
   */
  requestId?: string
}

/**
 * 站内充值失败时给买家的备用出口。
 *
 * 【这是唯一一处刻意暴露上游的地方，别当成 bug 修掉】
 * 本文件开头写着「买家永远看不到上游是谁」，这条是站长的明确决定下的例外：
 * 卡付 gpt1 通道在本站失败时，与其让买家开工单干等，不如直接给他一条能走通的路 ——
 * 何况这个商品历史上本来就给过买家同一个兑换链接。
 * 只在**充值失败**时出现；成功、处理中、卡已消耗这些情况都不显示。
 */
export interface RedeemFallback {
  /** 给买家看的一句话 */
  text: string
  /** 按钮文案 */
  label: string
  url: string
}

export interface RedeemActivateResult {
  state: Extract<RedeemState, 'COMPLETED' | 'PROCESSING' | 'COOLDOWN' | 'ERROR'>
  message: string
  account?: string
  completedAt?: string
  /** 建议等待秒数；上游给了就用它，不要自己写死 */
  retryAfter?: number
  /**
   * 这张卡还能不能再试。
   * 【必须区分】「稍后再试」和「这张卡废了」对买家是完全不同的两件事：
   * 前者让他等，后者要立刻走售后。混在一起就是客服工单。
   */
  retriable: boolean
  requestId?: string
  /** 上游订单号（异步平台）。只用于排查与续查，不展示给买家 */
  orderRef?: string
  /** 充值失败时的备用出口。由路由按适配器的 fallbackFor() 统一附加，适配器自己不用管 */
  fallback?: RedeemFallback
}

/** 适配器抛出的、可直接展示的错误。用它避免把上游的原始异常泄漏到前端 */
export class RedeemError extends Error {
  readonly state: RedeemState
  readonly retriable: boolean
  constructor(message: string, state: RedeemState = 'ERROR', retriable = true) {
    super(message)
    this.name = 'RedeemError'
    this.state = state
    this.retriable = retriable
  }
}

/**
 * 一个充值平台的适配器。
 *
 * 【加一家平台要做的全部事情】
 *   1. 在 providers/ 下新建一个文件，实现这个接口
 *   2. 在 registry.ts 里注册一行
 * 路由 /redeem/<key> 与后台的下拉选项都会自动出现，前端不用动。
 */
export interface RedeemProvider {
  /**
   * 平台标识。**进 URL（/redeem/sysa）也进数据库（card_keys.redeem_provider）**，
   * 一旦有卡密用了它就不能再改 —— 改了历史卡密会找不到适配器。
   * 只用小写字母和数字。
   */
  readonly key: string

  /**
   * 辨识名。**只给站长看**：后台导入卡密时在下拉里显示，用来区分是谁家的货。
   * 买家侧任何地方都不会出现这个字符串。想改随时改，不影响历史数据。
   */
  readonly adminLabel: string

  /**
   * 查询卡密状态，并告诉前端该收集哪些账号字段。
   *
   * ctx 是可选的本站上下文。异步下单的平台（sysb）上游**没有验卡接口**，
   * 它判断「这张卡是不是已经充过了」的唯一依据，就是我们自己记下的上游订单号。
   */
  check(
    cdk: string,
    ctx?: {
      cardKeyId?: number
      /** 本站商品名。适配器可据此自动判定渠道，省掉让买家选的那一步 */
      productName?: string
      /** 读回这张卡上一次的上游订单号；没有则返回 null */
      loadOrderRef?: () => Promise<string | null>
    }
  ): Promise<RedeemCheckResult>

  /**
   * 提交激活。values 的键是 check() 返回的 fields[].name；
   * variant 是买家选中的渠道 code（适配器没返回 variants 时为 undefined）。
   */
  activate(input: {
    cdk: string
    values: Record<string, string>
    variant?: string
    /** 本站卡密 id。异步下单的平台用它拼出稳定的幂等订单号 */
    cardKeyId?: number
    /** 读回这张卡上一次的上游订单号；没有则返回 null */
    loadOrderRef?: () => Promise<string | null>
    /** 记下本次的上游订单号，供下次续查 */
    saveOrderRef?: (ref: string) => Promise<void>
    /** 这张卡一共下过几笔不同的上游订单。用来给「失败后重试」封顶 */
    countOrderRefs?: () => Promise<number>
    /**
     * 原子占位：宣告「这张卡要被提交给上游了，可能会被消耗」。返回 false = 没抢到。
     *
     * 【只有没有幂等键的上游才需要它】V2 靠 order_id 去重，天然安全；
     * 但卡付改走 V1 之后上游**不接受任何幂等键**，同一张卡并发提交两次
     * 就是两笔真实扣款。适配器必须在发起不可逆调用**之前**拿到这个占位，
     * 拿不到就绝不能继续。
     */
    claimIrreversible?: () => Promise<boolean>
  }): Promise<RedeemActivateResult>

  /**
   * 可选：售后重绑 / 刷新订阅。
   * 不是每家都有，所以是可选方法 —— 前端据此决定要不要显示「订阅没到账？」入口。
   */
  rebind?(input: { cdk: string; values: Record<string, string> }): Promise<RedeemActivateResult>

  /** 可选：rebind 需要买家填什么。有 rebind 就必须有这个 */
  rebindFields?(): RedeemField[]

  /**
   * 可选：本站充值失败时，给买家的备用出口。
   *
   * 【为什么做成适配器上的一个方法，而不是在结果里逐处拼】
   * 失败有两条返回路径：适配器 return 一个 ERROR 结果，或者直接 throw RedeemError
   * （后者会被 service.ts 的 toActivateFailure 接住，那里看不见适配器）。
   * 放在适配器上、由路由在最后统一附加，两条路径才都能覆盖到。
   * 返回 null = 这个平台没有备用出口（sysa 就是）。
   */
  fallbackFor?(): RedeemFallback | null
}

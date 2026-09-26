/**
 * 结算中心的文案表（WP7）。纯常量与纯函数：结算中心、结算单页面共用。
 */

export const APPLY_REASON_TEXT: Record<string, string> = {
  BELOW_MIN: '可结算金额低于最低结算额，暂不能申请',
  NEGATIVE: '可结算余额不为正（有待抵扣金额），暂不能申请',
  HOLD: '本店结算已暂停，请联系站长',
  OPEN_EXISTS: '已有未完结的结算单，完结后才能再次申请',
  PAYEE_MISSING: '尚未设置收款信息，请联系站长',
  PAYEE_COOLDOWN: '收款信息刚变更，72 小时冷静期内不能申请',
  INTERVAL: '距上次申请的间隔不足，或今日申请次数已用完',
  RECONCILE_FAILED: '对账自检未通过，已暂停出单并通知站长核查',
}

export const LEDGER_TYPE_TEXT: Record<string, string> = {
  ACCRUE: '计提',
  ACCRUE_INV: '发票分成计提',
  RELEASE: '解冻',
  RELEASE_INV: '发票分成解冻',
  REVERSE: '冲销',
  SHORTPAY: '少付',
  ADJUST: '调账',
  STATEMENT: '出结算单',
  PAYOUT: '打款',
  WITHHOLD: '代扣',
  RETURN: '结算单退回',
  REPAY: '回款',
  BOUNCE: '退票',
  WRITEOFF: '核销',
  DEPOSIT_IN: '保证金转入',
  DEPOSIT_APPLY: '保证金抵扣',
  DEPOSIT_REFUND: '保证金退还',
}

export const COMPONENT_TEXT: Record<string, string> = {
  SALE: '货款',
  PURCHASE: '进货款',
  INVOICE_SHARE: '发票分成',
  FEE: '手续费',
  INVOICE_FEE: '发票分成手续费',
  LOSS: '售后损失',
  SHORT: '少付',
  MANUAL: '调整',
  NET: '净额',
}

export const BUCKET_TEXT: Record<string, string> = {
  PENDING: '冻结中',
  AVAILABLE: '可结算',
  IN_PAYOUT: '结算中',
  DEPOSIT: '保证金',
  SETTLED: '已结算',
  RETURNED: '所在结算单已退回',
  MIXED: '部分冲销 / 多处',
  NONE: '不计',
}

export const STATEMENT_STATE_TEXT: Record<string, string> = {
  GENERATED: '待打款',
  CONFIRMED: '已确认',
  DISPUTED: '有异议',
  PAYING: '打款中',
  PAID: '已打款',
  RECEIVED: '已到账',
  RETURNED: '已退回',
}

export const STATEMENT_ORIGIN_TEXT: Record<string, string> = { SCHEDULE: '周期结算', REQUEST: '申请结算', MANUAL: '临时结算' }
export const PAYEE_METHOD_TEXT: Record<string, string> = { ALIPAY: '支付宝', BANK: '银行卡', WECHAT: '微信' }
export const VOUCHER_TEXT: Record<string, string> = { INVOICE: '渠道开具发票', AGENT_INVOICE: '代开发票', SMALL_RECEIPT: '小额收据', WITHHOLD_RECORD: '代扣个税凭证' }

export const txt = (map: Record<string, string>, v: string | null | undefined, empty = '—') => (v ? map[v] ?? v : empty)

/** 申请结算的请求编号：打开确认框时生成一次（双击 / 重试提交同一个编号 → 服务端返回同一张结算单） */
export function newRequestId(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const buf = new Uint8Array(20)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) window.crypto.getRandomValues(buf)
  else for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256)
  let s = ''
  for (let i = 0; i < buf.length; i++) s += A[buf[i] % A.length]
  return s
}

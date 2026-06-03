// 支付宝对接（手机网站支付 / 电脑网站支付），普通公钥模式 RSA2，零第三方依赖
import crypto from 'crypto'

const APP_ID = process.env.ALIPAY_APP_ID || ''
const APP_PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY || '' // 应用私钥（PKCS8 base64）
const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY || '' // 支付宝公钥（base64）
const GATEWAY = process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'

export function alipayConfigured(): boolean {
  return !!(APP_ID && APP_PRIVATE_KEY && ALIPAY_PUBLIC_KEY)
}

// 把裸 base64 密钥包装成 PEM（支持已带头尾的情况）
function toPem(key: string, type: 'PRIVATE' | 'PUBLIC'): string {
  const body = key
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const lines = body.match(/.{1,64}/g)?.join('\n') || ''
  const label = type === 'PRIVATE' ? 'PRIVATE KEY' : 'PUBLIC KEY'
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`
}

// 北京时间 yyyy-MM-dd HH:mm:ss
function bjTimestamp(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
}

// 待签名串：参数按 key 升序，原始值（不编码），跳过空值与 sign
function buildSignContent(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
}

function signRSA2(content: string): string {
  return crypto
    .createSign('RSA-SHA256')
    .update(content, 'utf8')
    .sign(toPem(APP_PRIVATE_KEY, 'PRIVATE'), 'base64')
}

export interface CreatePayParams {
  outTradeNo: string
  totalAmount: string // 元，两位小数字符串
  subject: string
  channel: 'wap' | 'page' // 手机网站 / 电脑网站
  notifyUrl: string
  returnUrl: string
  quitUrl?: string
}

// 生成支付跳转 URL（GET，浏览器直接跳到收银台）
export function buildPayUrl(p: CreatePayParams): string {
  const method = p.channel === 'page' ? 'alipay.trade.page.pay' : 'alipay.trade.wap.pay'
  const productCode = p.channel === 'page' ? 'FAST_INSTANT_TRADE_PAY' : 'QUICK_WAP_WAY'

  const bizContent: Record<string, string> = {
    out_trade_no: p.outTradeNo,
    total_amount: p.totalAmount,
    subject: p.subject,
    product_code: productCode,
  }
  if (p.channel === 'wap' && p.quitUrl) bizContent.quit_url = p.quitUrl

  const params: Record<string, string> = {
    app_id: APP_ID,
    method,
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: bjTimestamp(),
    version: '1.0',
    notify_url: p.notifyUrl,
    return_url: p.returnUrl,
    biz_content: JSON.stringify(bizContent),
  }

  const sign = signRSA2(buildSignContent(params))
  params.sign = sign

  const query = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')

  return `${GATEWAY}?${query}`
}

// 验证异步通知 / 同步回跳的签名（普通公钥模式）
export function verifyNotify(params: Record<string, string>): boolean {
  const sign = params.sign
  if (!sign) return false
  const content = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  try {
    return crypto
      .createVerify('RSA-SHA256')
      .update(content, 'utf8')
      .verify(toPem(ALIPAY_PUBLIC_KEY, 'PUBLIC'), sign, 'base64')
  } catch {
    return false
  }
}

export function getAppId(): string {
  return APP_ID
}

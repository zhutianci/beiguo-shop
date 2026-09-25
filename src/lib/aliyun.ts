// 阿里云 OpenAPI 对接（RPC 风格 v1.0 签名，零第三方依赖）
// - 邮件：DirectMail SingleSendMail (Version 2015-11-23, endpoint dm.aliyuncs.com)
// - 短信：Dysmsapi SendSms (Version 2017-05-25, endpoint dysmsapi.aliyuncs.com)
// 两者共用同一对 AccessKey。

import crypto from 'crypto'

const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const REGION = process.env.ALIYUN_REGION || 'cn-hangzhou'

// DirectMail
const DM_ACCOUNT = process.env.ALIYUN_DM_ACCOUNT || '' // 发信地址，如 remind@mail.bigolab.com（到期/营销类）
const DM_NOREPLY = process.env.ALIYUN_DM_NOREPLY || '' // 触发类发信地址 no-reply@mail.bigolab.com（注册/交易/找密等系统通知）
const DM_FROM_ALIAS = process.env.ALIYUN_DM_FROM_ALIAS || '贝果科技'

// 短信
const SMS_SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME || ''
const SMS_TEMPLATE_CODE = process.env.ALIYUN_SMS_TEMPLATE_CODE || ''

export function emailConfigured(): boolean {
  return !!(ACCESS_KEY_ID && ACCESS_KEY_SECRET && DM_ACCOUNT)
}

export function smsConfigured(): boolean {
  return !!(ACCESS_KEY_ID && ACCESS_KEY_SECRET && SMS_SIGN_NAME && SMS_TEMPLATE_CODE)
}

export interface SendResult {
  ok: boolean
  detail: string // 成功时为 RequestId，失败时为错误信息
}

// 阿里云要求的百分号编码（严格 RFC3986）
// encodeURIComponent 不会编码 ! ' ( ) *，但阿里云签名要求这些必须编码，
// 否则含这些字符的参数（如 HTML 邮件正文里的 rgba()、'Segoe UI'）会导致 SignatureDoesNotMatch
function percentEncode(s: string): string {
  return encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )
}

function isoTimestamp(): string {
  // 形如 2026-06-03T04:00:00Z（UTC，去掉毫秒）
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * 一次 RPC 调用的完整结果。营销发送要靠它区分「没发出去」和「不知道发没发」：
 *
 *  ok            HTTP 2xx 且没有错误 Code（DirectMail 成功不带 Code，短信成功 Code=OK）
 *  api_error     阿里云明确返回了错误 Code（请求到了阿里云，被拒）
 *  connect_error 请求根本没到阿里云（DNS 失败、连接被拒、连接超时）→ 重试不会重复发送
 *  unknown_error 超时、响应读到一半断了、5xx 且没有 Code → 阿里云可能已经受理，**不能自动重发**
 *
 * 之所以单独分出 connect_error：DNS 故障时如果一律当成 unknown，营销队列会堆出一片
 * 「结果未知」要人工核对；而那些请求其实一个字节都没发出去，退避重试是安全的。
 */
export type RpcKind = 'ok' | 'api_error' | 'connect_error' | 'unknown_error'

export interface RpcOutcome {
  kind: RpcKind
  httpStatus?: number
  code?: string
  message?: string
  requestId?: string
  /** 完整 JSON 响应（查询类接口从这里取数据） */
  json?: any
  /** 异常名 / 底层错误码，排障用 */
  errName?: string
}

/** undici 的连接阶段错误码：出现这些说明请求没有送达 */
const CONNECT_ERROR_CODES = new Set([
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
])

function classifyThrown(e: unknown): RpcOutcome {
  const err = e as { name?: string; message?: string; cause?: { code?: string; name?: string } }
  const causeCode = err?.cause?.code
  if (causeCode && CONNECT_ERROR_CODES.has(causeCode)) {
    return { kind: 'connect_error', errName: causeCode, message: err?.message }
  }
  // 超时（AbortSignal.timeout → TimeoutError）以及其余一切：可能已送达
  return { kind: 'unknown_error', errName: causeCode || err?.name || 'Error', message: err?.message }
}

function signedBody(bizParams: Record<string, string>): string {
  const params: Record<string, string> = {
    Format: 'JSON',
    AccessKeyId: ACCESS_KEY_ID,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    Timestamp: isoTimestamp(),
    ...bizParams,
  }

  const sortedKeys = Object.keys(params).sort()
  const canonical = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&')

  const stringToSign = `POST&${percentEncode('/')}&${percentEncode(canonical)}`
  const signature = crypto
    .createHmac('sha1', ACCESS_KEY_SECRET + '&')
    .update(stringToSign)
    .digest('base64')

  return `Signature=${percentEncode(signature)}&${canonical}`
}

/**
 * 通用 RPC 调用（带超时、保留 Code / RequestId / 原始 JSON）。
 * 超时覆盖整个请求 + 读响应体：响应体读到一半卡住同样算「不知道发没发」。
 */
export async function rpcCall(
  endpoint: string,
  bizParams: Record<string, string>,
  opts: { timeoutMs?: number } = {}
): Promise<RpcOutcome> {
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    return { kind: 'api_error', code: 'LocalConfigMissing', message: '阿里云 AccessKey 未配置' }
  }
  const body = signedBody(bizParams)
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 30_000)

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      // 同 lib/llm.ts 里的说明：POST 不会自动跳过 Next 的数据缓存。
      // 发短信/邮件的响应缓存一年没有任何意义，只会白占磁盘（签名带随机串，键还每次都不同）
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal,
    })
  } catch (e) {
    return classifyThrown(e)
  }

  let json: any
  try {
    const raw = await res.text()
    json = raw ? JSON.parse(raw) : {}
  } catch (e) {
    // 读体超时 / 非 JSON：2xx 却读不出来，或 5xx 网关页 —— 都当「不确定」
    if ((e as { name?: string })?.name === 'SyntaxError') {
      return res.ok
        ? { kind: 'unknown_error', httpStatus: res.status, errName: 'BadJson' }
        : res.status >= 500
          ? { kind: 'unknown_error', httpStatus: res.status, errName: 'NonJson5xx' }
          : { kind: 'api_error', httpStatus: res.status, code: `HTTP${res.status}`, message: `HTTP ${res.status}` }
    }
    return { ...classifyThrown(e), kind: 'unknown_error', httpStatus: res.status }
  }

  const code: string | undefined = json?.Code
  // SMS 成功返回 Code === 'OK'；DirectMail 成功无 Code 字段（仅 RequestId/EnvId）
  if (res.ok && (!code || code === 'OK')) {
    return { kind: 'ok', httpStatus: res.status, requestId: json?.RequestId, json }
  }
  if (code) {
    return { kind: 'api_error', httpStatus: res.status, code, message: json?.Message, requestId: json?.RequestId, json }
  }
  // 5xx 且没有阿里云错误码（多半是网关超时页）：后端可能已受理
  if (res.status >= 500) return { kind: 'unknown_error', httpStatus: res.status, errName: 'Http5xx', json }
  return { kind: 'api_error', httpStatus: res.status, code: `HTTP${res.status}`, message: `HTTP ${res.status}`, json }
}

const DM_ENDPOINT = 'https://dm.aliyuncs.com/'

/** DirectMail（2015-11-23）通用调用：营销发送与回执同步都走这里 */
export function dmCall(
  action: string,
  params: Record<string, string>,
  opts: { timeoutMs?: number } = {}
): Promise<RpcOutcome> {
  return rpcCall(DM_ENDPOINT, { Action: action, Version: '2015-11-23', ...params }, opts)
}

export function aliyunKeysConfigured(): boolean {
  return !!(ACCESS_KEY_ID && ACCESS_KEY_SECRET)
}

// 旧接口：交易邮件 / 短信沿用 {ok, detail} 语义，调用方不需要任何改动
async function rpcRequest(
  endpoint: string,
  bizParams: Record<string, string>
): Promise<SendResult> {
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    return { ok: false, detail: '阿里云 AccessKey 未配置' }
  }
  const r = await rpcCall(endpoint, bizParams)
  if (r.kind === 'ok') return { ok: true, detail: r.requestId || 'OK' }
  if (r.kind === 'api_error') return { ok: false, detail: r.message || r.code || `HTTP ${r.httpStatus}` }
  return { ok: false, detail: r.message || r.errName || '请求异常' }
}

export async function sendDirectMail(
  to: string,
  subject: string,
  htmlBody: string,
  fromAccount?: string
): Promise<SendResult> {
  const account = fromAccount || DM_ACCOUNT
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !account) {
    return { ok: false, detail: '邮件服务未配置（缺少 AccessKey 或发信地址）' }
  }
  return rpcRequest('https://dm.aliyuncs.com/', {
    Action: 'SingleSendMail',
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '1', // 1 = 使用发信地址（需在控制台验证）
    ReplyToAddress: 'false',
    ToAddress: to,
    Subject: subject,
    HtmlBody: htmlBody,
    FromAlias: DM_FROM_ALIAS,
  })
}

// 系统/触发类通知邮件（注册验证码、交易通知、找回密码等），用 no-reply 发件地址
export function systemEmailConfigured(): boolean {
  return !!(ACCESS_KEY_ID && ACCESS_KEY_SECRET && (DM_NOREPLY || DM_ACCOUNT))
}

export async function sendSystemEmail(to: string, subject: string, htmlBody: string): Promise<SendResult> {
  return sendDirectMail(to, subject, htmlBody, DM_NOREPLY || DM_ACCOUNT)
}

export async function sendSms(
  phone: string,
  templateParam: Record<string, string>
): Promise<SendResult> {
  if (!smsConfigured()) {
    return { ok: false, detail: '短信服务未配置（缺少 AccessKey / 签名 / 模板）' }
  }
  return rpcRequest('https://dysmsapi.aliyuncs.com/', {
    Action: 'SendSms',
    Version: '2017-05-25',
    RegionId: REGION,
    PhoneNumbers: phone,
    SignName: SMS_SIGN_NAME,
    TemplateCode: SMS_TEMPLATE_CODE,
    TemplateParam: JSON.stringify(templateParam),
  })
}

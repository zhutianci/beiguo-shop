// 阿里云 OpenAPI 对接（RPC 风格 v1.0 签名，零第三方依赖）
// - 邮件：DirectMail SingleSendMail (Version 2015-11-23, endpoint dm.aliyuncs.com)
// - 短信：Dysmsapi SendSms (Version 2017-05-25, endpoint dysmsapi.aliyuncs.com)
// 两者共用同一对 AccessKey。

import crypto from 'crypto'

const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || ''
const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
const REGION = process.env.ALIYUN_REGION || 'cn-hangzhou'

// DirectMail
const DM_ACCOUNT = process.env.ALIYUN_DM_ACCOUNT || '' // 发信地址，如 notice@mail.bigolab.com
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

// 通用 RPC 调用：caller 提供业务参数（Action/Version/RegionId 等），这里补全公共签名参数并发送
async function rpcRequest(
  endpoint: string,
  bizParams: Record<string, string>
): Promise<SendResult> {
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    return { ok: false, detail: '阿里云 AccessKey 未配置' }
  }

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

  const body = `Signature=${percentEncode(signature)}&${canonical}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const json: any = await res.json().catch(() => ({}))

    // SMS 成功返回 Code === 'OK'；DirectMail 成功无 Code 字段（仅 RequestId/EnvId）
    if (res.ok && (!json.Code || json.Code === 'OK')) {
      return { ok: true, detail: json.RequestId || 'OK' }
    }
    const msg = json.Message || json.Code || `HTTP ${res.status}`
    return { ok: false, detail: msg }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : '请求异常' }
  }
}

export async function sendDirectMail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<SendResult> {
  if (!emailConfigured()) {
    return { ok: false, detail: '邮件服务未配置（缺少 AccessKey 或发信地址）' }
  }
  return rpcRequest('https://dm.aliyuncs.com/', {
    Action: 'SingleSendMail',
    Version: '2015-11-23',
    AccountName: DM_ACCOUNT,
    AddressType: '1', // 1 = 使用发信地址（需在控制台验证）
    ReplyToAddress: 'false',
    ToAddress: to,
    Subject: subject,
    HtmlBody: htmlBody,
    FromAlias: DM_FROM_ALIAS,
  })
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

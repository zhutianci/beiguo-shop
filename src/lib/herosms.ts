// hero-sms 客户端（SMS-Activate handler_api.php 协议，JSON/文本兼容）
// 文档为 SPA 无法静态抓取，故对返回做容错解析，并保留原始返回供排查。

const BASE = process.env.HEROSMS_BASE || 'https://hero-sms.com/stubs/handler_api.php'
const KEY = process.env.HEROSMS_API_KEY || ''
export const HEROSMS_TIMEOUT_MIN = parseInt(process.env.HEROSMS_TIMEOUT_MIN || '15')

export function heroSmsConfigured(): boolean {
  return !!KEY
}

async function call(action: string, params: Record<string, string | number> = {}): Promise<{ raw: string; json: any | null }> {
  const qs = new URLSearchParams({ api_key: KEY, action })
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v))
  const res = await fetch(`${BASE}?${qs.toString()}`, { method: 'GET', cache: 'no-store' })
  const raw = await res.text()
  let json: any = null
  try {
    json = JSON.parse(raw)
  } catch {
    json = null
  }
  return { raw, json }
}

export interface GetNumberResult {
  ok: boolean
  activationId?: string
  phone?: string
  cost?: number | null
  error?: string
  raw: string
}

// 取号（maxPrice：愿意接受的最高单价，传给 hero-sms 控成本）
export async function getNumber(service: string, country: string, maxPrice?: number | null): Promise<GetNumberResult> {
  if (!heroSmsConfigured()) return { ok: false, error: '未配置 HEROSMS_API_KEY', raw: '' }
  const params: Record<string, string | number> = { service, country }
  if (maxPrice != null && maxPrice > 0) params.maxPrice = maxPrice
  const { raw, json } = await call('getNumber', params)

  // JSON 形态：{ activationId, phoneNumber/phone/number, activationCost/cost }
  if (json && typeof json === 'object') {
    const id = json.activationId ?? json.id ?? json.activation_id
    const phone = json.phoneNumber ?? json.phone ?? json.number
    if (id && phone) {
      return {
        ok: true,
        activationId: String(id),
        phone: String(phone).replace(/^\+?/, '+'),
        cost: json.activationCost != null ? Number(json.activationCost) : json.cost != null ? Number(json.cost) : null,
        raw,
      }
    }
    // 错误 JSON：{ title:"NO_NUMBERS"/"NO_BALANCE", ... }
    return { ok: false, error: String(json.title || json.message || json.error || '取号失败'), raw }
  }

  // 文本形态：ACCESS_NUMBER:<id>:<phone>
  const m = raw.match(/^ACCESS_NUMBER[:|](\d+)[:|]\+?(\d+)/)
  if (m) {
    return { ok: true, activationId: m[1], phone: '+' + m[2], cost: null, raw }
  }
  // 文本错误：NO_NUMBERS / NO_BALANCE / BAD_KEY ...
  return { ok: false, error: raw.trim() || '取号失败', raw }
}

export interface StatusResult {
  state: 'WAITING' | 'CODE' | 'CANCELLED' | 'UNKNOWN'
  code?: string
  raw: string
}

// 查码
export async function getStatus(activationId: string): Promise<StatusResult> {
  const { raw, json } = await call('getStatus', { id: activationId })

  // JSON：{ status:"STATUS_OK", code/sms:"123456" } 或 { status:"STATUS_WAIT_CODE" }
  if (json && typeof json === 'object') {
    const st = String(json.status ?? json.title ?? '').toUpperCase()
    const code = json.code ?? json.sms ?? json.text
    if (st.includes('STATUS_OK') || code) return { state: 'CODE', code: code != null ? String(code) : undefined, raw }
    if (st.includes('WAIT')) return { state: 'WAITING', raw }
    if (st.includes('CANCEL')) return { state: 'CANCELLED', raw }
    return { state: 'UNKNOWN', raw }
  }

  // 文本：STATUS_OK:<code> / STATUS_WAIT_CODE / STATUS_CANCEL
  const t = raw.trim().toUpperCase()
  if (t.startsWith('STATUS_OK')) {
    const c = raw.split(/[:|]/).slice(1).join(':').trim()
    return { state: 'CODE', code: c || undefined, raw }
  }
  if (t.includes('WAIT')) return { state: 'WAITING', raw }
  if (t.includes('CANCEL')) return { state: 'CANCELLED', raw }
  return { state: 'UNKNOWN', raw }
}

// 设置状态：8=取消(退号费) 6=完成 3=请求再发
export async function setStatus(activationId: string, status: number): Promise<{ raw: string }> {
  const { raw } = await call('setStatus', { id: activationId, status })
  return { raw }
}

export const cancelActivation = (id: string) => setStatus(id, 8)
export const finishActivation = (id: string) => setStatus(id, 6)

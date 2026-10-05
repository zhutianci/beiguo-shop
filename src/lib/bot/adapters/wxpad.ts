/**
 * WeChatPadPro 适配器（docs/微信机器人-设计.md §11）。协议服务是闭源程序，按不可信处理：
 * 只经 Docker 内网访问（BOT_WXPAD_BASE，默认 http://wxpad:8080），不暴露端口；它拿不到任何业务密钥。
 *
 * 接口形状来自 WeChatPadPro 的公开部署文档与 AstrBot v4.1.0 的对接代码（只参照接口事实，未复制代码）：
 *  - POST /admin/GenAuthKey1?key=<ADMIN_KEY>      {Count, Days}        → Data.authKeys[0]（账号授权码）
 *  - POST /login/GetLoginQrCodeNew?key=<authKey>  {Proxy?}             → Data.QrCodeUrl
 *  - GET  /login/CheckLoginStatus?key=<authKey>                        → Data.state（2 = 登录成功，-2 = 二维码过期）、Data.wxid
 *  - GET  /login/GetLoginStatus?key=<authKey>                          → Code 200 且 Data.loginState = 1 在线 / 3 离线；Code 300 已退出
 *  - POST /message/SendTextMessage?key=<authKey>  {MsgItem:[{MsgType:1, TextContent, ToUserName}]}
 *  - POST /friend/GetContactList?key=<authKey>    {CurrentChatRoomContactSeq:0, CurrentWxcontactSeq:0} → Data.ContactList.contactUsernameList
 *  - POST /friend/GetContactDetailsList?key=<authKey> {RoomWxIDList, UserNames}                         → Data.contactList
 *  - 消息推送：WebSocket /ws/GetSyncMsg?key=<authKey> 或 Webhook（PoC 定），每条形如
 *    { msg_id, new_msg_id?, from_user_name:{str}, to_user_name:{str}, content:{str}, msg_type, create_time, msg_source, push_content }；
 *    群消息的 content 以「发送人wxid:\n」开头，被 @ 的人在 msg_source 的 <atuserlist> 里。
 * 唤醒登录的接口名以 PoC 为准（BOT_WXPAD_WAKE_PATH，默认 /login/WakeUpLogin）。
 *
 * 所有调用 8 秒超时、不抛异常（返回 ok=false + 原因）；日志不打印授权码与消息正文。
 */
import { patchBotState, readBotState } from '../state'
import type { Inbound } from '../types'
import type { AdapterCapability, AdapterStatus, BotAdapter, ChatInfo, SendResult } from './types'

const TIMEOUT_MS = 8000

function base(): string {
  return (process.env.BOT_WXPAD_BASE || 'http://wxpad:8080').replace(/\/+$/, '')
}

function adminKey(): string {
  return (process.env.BOT_WXPAD_ADMIN_KEY || '').trim()
}

function proxy(): string {
  return (process.env.BOT_WXPAD_PROXY || '').trim()
}

/**
 * 后台概览 / 设置页用：只告诉「配没配」，值本身不出这个文件（scripts/check-bot-boundary.mjs 规则 B5：
 * BOT_WXPAD_* 只许适配器与回调路由读）。回调密钥不足 32 字符时回调路由一律 503，这里同样算没配。
 */
export function wxpadEnvStatus(): { proxyConfigured: boolean; adminKeyConfigured: boolean; hookSecretConfigured: boolean } {
  return {
    proxyConfigured: !!proxy(),
    adminKeyConfigured: !!adminKey(),
    hookSecretConfigured: (process.env.BOT_WXPAD_HOOK_SECRET || '').trim().length >= 32,
  }
}

type Json = Record<string, unknown>

async function call(method: 'GET' | 'POST', path: string, key: string, body?: unknown): Promise<{ ok: boolean; status: number; json: Json | null; error?: string }> {
  const url = `${base()}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    const text = await res.text().catch(() => '')
    let json: Json | null = null
    try {
      json = text ? (JSON.parse(text) as Json) : null
    } catch {
      /* 非 JSON */
    }
    return { ok: res.ok, status: res.status, json }
  } catch (e) {
    const cause = (e as { cause?: { code?: string } })?.cause?.code
    return { ok: false, status: 0, json: null, error: cause || (e as Error)?.name || '连接失败' }
  }
}

function dataOf(j: Json | null): Json {
  const d = j?.Data
  return d && typeof d === 'object' && !Array.isArray(d) ? (d as Json) : {}
}

function codeOf(j: Json | null): number | null {
  const c = j?.Code
  return typeof c === 'number' ? c : c != null ? Number(c) : null
}

function textOf(j: Json | null): string {
  return String(j?.Text ?? j?.Message ?? '').slice(0, 120)
}

/** 取（必要时生成）账号授权码 */
async function ensureAuthKey(): Promise<{ key: string | null; error?: string }> {
  const st = await readBotState()
  if (st.authKey) return { key: st.authKey }
  const admin = adminKey()
  if (!admin) return { key: null, error: '未配置 BOT_WXPAD_ADMIN_KEY' }
  const r = await call('POST', '/admin/GenAuthKey1', admin, { Count: 1, Days: 3650 })
  if (!r.ok || codeOf(r.json) !== 200) return { key: null, error: `生成授权码失败：${r.error || textOf(r.json) || r.status}` }
  const d = dataOf(r.json)
  const list = Array.isArray(d.authKeys) ? d.authKeys : Array.isArray(r.json?.Data) ? (r.json?.Data as unknown[]) : []
  const key = typeof list[0] === 'string' ? (list[0] as string) : null
  if (!key) return { key: null, error: '生成授权码成功但没有拿到授权码' }
  await patchBotState({ authKey: key })
  return { key }
}

/** 解析消息 source 里的被 @ 列表（<atuserlist>a,b,c</atuserlist>，可能带 CDATA） */
export function parseAtUserList(msgSource: string): string[] {
  const m = msgSource.match(/<atuserlist>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/atuserlist>/i)
  if (!m) return []
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function strField(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && typeof (v as Json).str === 'string') return (v as Json).str as string
  return ''
}

/** 单条推送消息 → Inbound；不是我们要的结构返回 null */
export function parseWxpadMessage(raw: unknown, selfWxid: string | null): Inbound | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Json
  const msgId = String(m.new_msg_id ?? m.msg_id ?? '').trim()
  const from = strField(m.from_user_name)
  if (!msgId || !from) return null
  if (selfWxid && from === selfWxid) return null // 自己发的
  if (['weixin', 'newsapp', 'newsapp_wechat', 'fmessage', 'medianote', 'floatbottle'].includes(from)) return null
  const content = strField(m.content)
  const msgType = Number(m.msg_type)
  const createTime = Number(m.create_time)
  const ts = Number.isFinite(createTime) && createTime > 0 ? new Date(createTime * 1000) : new Date()
  const msgSource = typeof m.msg_source === 'string' ? m.msg_source : ''
  const isGroup = from.endsWith('@chatroom')

  // 系统消息（入群、退群、改群名）：msg_type 10000 / 10002
  if (msgType === 10000 || msgType === 10002) {
    return {
      kind: 'SYSTEM',
      msgId,
      convExternalId: from,
      isGroup,
      senderWxid: '',
      text: content.slice(0, 500),
      atWxids: [],
      atAll: false,
      ts,
    }
  }
  if (msgType !== 1) return null // 只处理文本

  let sender = from
  let text = content
  if (isGroup) {
    const i = content.indexOf(':\n')
    if (i <= 0) return null // 群消息没有发送人前缀：不认（身份必须来自协议，不猜）
    sender = content.slice(0, i)
    text = content.slice(i + 2)
  }
  const atWxids = isGroup ? parseAtUserList(msgSource) : []
  return {
    kind: 'MESSAGE',
    msgId,
    convExternalId: from,
    isGroup,
    senderWxid: sender,
    text: text.slice(0, 2000),
    atWxids,
    atAll: atWxids.some((w) => w === 'notify@all'),
    ts,
  }
}

export class WxpadAdapter implements BotAdapter {
  readonly name = 'wxpad' as const
  readonly capabilities: ReadonlySet<AdapterCapability> = new Set<AdapterCapability>(['sender_id', 'mention_list', 'system_msgs', 'chat_list', 'login_qr'])

  async status(): Promise<AdapterStatus> {
    const { key, error } = await ensureAuthKey()
    if (!key) return { reachable: false, online: false, detail: error }
    const r = await call('GET', '/login/GetLoginStatus', key)
    if (!r.ok && r.status === 0) return { reachable: false, online: false, detail: `协议服务连不上（${r.error}）` }
    const code = codeOf(r.json)
    const st = await readBotState()
    if (code === 200) {
      const ls = Number(dataOf(r.json).loginState)
      return { reachable: true, online: ls === 1, botWxid: st.botWxid, nickname: st.nickname, detail: ls === 1 ? '在线' : `离线（loginState=${ls}）` }
    }
    if (code === 300) return { reachable: true, online: false, detail: '小号已退出登录' }
    if (code === -2) {
      await patchBotState({ authKey: null })
      return { reachable: true, online: false, detail: '授权码已失效，将重新生成' }
    }
    return { reachable: true, online: false, detail: `状态未知：${textOf(r.json) || r.status}` }
  }

  async loginQr(): Promise<{ qr: string | null; error?: string }> {
    const { key, error } = await ensureAuthKey()
    if (!key) return { qr: null, error }
    const p = proxy()
    const r = await call('POST', '/login/GetLoginQrCodeNew', key, p ? { Proxy: p } : {})
    if (!r.ok || codeOf(r.json) !== 200) {
      if (/key\s*无效|该\s*key/i.test(textOf(r.json))) await patchBotState({ authKey: null })
      return { qr: null, error: `获取二维码失败：${r.error || textOf(r.json) || r.status}` }
    }
    const d = dataOf(r.json)
    const qr = typeof d.QrCodeUrl === 'string' ? d.QrCodeUrl : typeof d.QrBase64 === 'string' ? d.QrBase64 : null
    return qr ? { qr } : { qr: null, error: '接口没有返回二维码' }
  }

  async loginProgress() {
    const { key, error } = await ensureAuthKey()
    if (!key) return { state: 'ERROR' as const, error }
    const r = await call('GET', '/login/CheckLoginStatus', key)
    const code = codeOf(r.json)
    if (code === 300) return { state: 'WAITING' as const }
    if (!r.ok || code !== 200) return { state: 'ERROR' as const, error: r.error || textOf(r.json) || String(r.status) }
    const d = dataOf(r.json)
    const s = Number(d.state)
    if (s === 2) {
      const wxid = typeof d.wxid === 'string' ? d.wxid : null
      const nickname = typeof d.nick_name === 'string' ? d.nick_name : typeof d.nickName === 'string' ? d.nickName : null
      await patchBotState({ botWxid: wxid, nickname, loginAt: new Date().toISOString(), online: true, offlineSince: null })
      return { state: 'DONE' as const, wxid, nickname }
    }
    if (s === -2) return { state: 'EXPIRED' as const }
    if (s === 1) return { state: 'SCANNED' as const }
    return { state: 'WAITING' as const }
  }

  async wakeLogin(): Promise<{ ok: boolean; error?: string }> {
    const { key, error } = await ensureAuthKey()
    if (!key) return { ok: false, error }
    const path = (process.env.BOT_WXPAD_WAKE_PATH || '/login/WakeUpLogin').trim()
    const r = await call('POST', path, key, {})
    if (r.ok && codeOf(r.json) === 200) return { ok: true }
    return { ok: false, error: r.error || textOf(r.json) || String(r.status) }
  }

  async listChats(): Promise<ChatInfo[]> {
    const { key } = await ensureAuthKey()
    if (!key) return []
    const r = await call('POST', '/friend/GetContactList', key, { CurrentChatRoomContactSeq: 0, CurrentWxcontactSeq: 0 })
    if (!r.ok || codeOf(r.json) !== 200) return []
    const cl = dataOf(r.json).ContactList as Json | undefined
    const names = (Array.isArray(cl?.contactUsernameList) ? cl!.contactUsernameList : []) as unknown[]
    const rooms = names.filter((x): x is string => typeof x === 'string' && x.endsWith('@chatroom')).slice(0, 200)
    if (!rooms.length) return []
    const d = await call('POST', '/friend/GetContactDetailsList', key, { RoomWxIDList: rooms, UserNames: [] })
    const details = (Array.isArray(dataOf(d.json).contactList) ? dataOf(d.json).contactList : []) as Json[]
    const nameOf = new Map<string, { name: string; count?: number }>()
    for (const c of details) {
      const id = strField(c.userName) || strField(c.user_name)
      if (!id) continue
      const name = strField(c.nickName) || strField(c.nick_name) || id
      const members = c.newChatroomData && typeof c.newChatroomData === 'object' ? Number((c.newChatroomData as Json).member_count) : NaN
      nameOf.set(id, { name, count: Number.isFinite(members) ? members : undefined })
    }
    return rooms.map((id) => ({ externalId: id, name: nameOf.get(id)?.name || id, memberCount: nameOf.get(id)?.count }))
  }

  async sendText(externalId: string, text: string): Promise<SendResult> {
    const { key, error } = await ensureAuthKey()
    if (!key) return { ok: false, error }
    const r = await call('POST', '/message/SendTextMessage', key, { MsgItem: [{ MsgType: 1, TextContent: text, ToUserName: externalId }] })
    if (r.ok && codeOf(r.json) === 200) {
      // 批量接口：逐条结果在 Data 里（形状以 PoC 为准），能看出失败就当失败
      const d = r.json?.Data
      if (Array.isArray(d) && d.length && d.every((x) => x && typeof x === 'object' && (x as Json).isSendSuccess === false)) {
        return { ok: false, error: '协议服务返回发送失败' }
      }
      return { ok: true }
    }
    return { ok: false, error: r.error || textOf(r.json) || `HTTP ${r.status}` }
  }

  parseCallback(body: unknown, selfWxid: string | null): Inbound[] {
    const list = Array.isArray(body) ? body : body && typeof body === 'object' && Array.isArray((body as Json).messages) ? ((body as Json).messages as unknown[]) : [body]
    const out: Inbound[] = []
    for (const raw of list.slice(0, 100)) {
      const m = parseWxpadMessage(raw, selfWxid)
      if (m) out.push(m)
    }
    return out
  }
}

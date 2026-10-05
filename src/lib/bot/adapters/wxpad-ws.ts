/**
 * WeChatPadPro 收消息的 WebSocket 方式（docs/微信机器人-设计.md §11.3、§11.6 第 4 项）：协议服务没有可用的 Webhook 时用。
 * BOT_WXPAD_RECEIVE=ws 才启用（缺省 webhook：协议服务回调 /api/bot/wxpad/hook/<密钥>，这里什么都不做）。
 *
 * 连 ws://wxpad:8080/ws/GetSyncMsg?key=<授权码>（只走 Docker 内网），每条推送与 Webhook 的回调体同形，
 * 交给同一个解析（WxpadAdapter.parseCallback）与同一个入站处理（inbound.handleInbound），三道闸、去重都一样。
 *
 * 【保活】进程里只维持一条连接；断了不自己狂重连，由每分钟的 tick（tick.ts → ensureWxpadSocket）补连，
 * 另在断开 10 秒后试一次。授权码还没生成（小号没登录过）时不连。
 * 【运行环境】用 Node 自带的 WebSocket：生产镜像是 node:20，要在 app 容器加 NODE_OPTIONS=--experimental-websocket
 * （Node 22 起默认就有）；没有时打一次日志、不连（部署说明里写了）。不引入 ws 依赖。
 * 【日志】不打印授权码与消息正文。
 */
import { readBotState } from '../state'
import { botEnabledByEnv } from '../config'

type WsLike = {
  readyState: number
  close(): void
  addEventListener(type: 'open' | 'message' | 'close' | 'error', fn: (ev: { data?: unknown }) => void): void
}

const g = globalThis as unknown as {
  __botWxpadWs?: { ws: WsLike | null; connecting: boolean; retryTimer: ReturnType<typeof setTimeout> | null; warnedNoWs: boolean; key: string | null }
}
const S = (g.__botWxpadWs ||= { ws: null, connecting: false, retryTimer: null, warnedNoWs: false, key: null })

export function wxpadReceiveMode(): 'webhook' | 'ws' {
  return (process.env.BOT_WXPAD_RECEIVE || '').trim().toLowerCase() === 'ws' ? 'ws' : 'webhook'
}

function wsBase(): string {
  return (process.env.BOT_WXPAD_BASE || 'http://wxpad:8080').replace(/\/+$/, '').replace(/^http/i, 'ws')
}

/** 当前连接是否在线（后台概览可显示） */
export function wxpadSocketState(): 'off' | 'connecting' | 'open' | 'closed' {
  if (wxpadReceiveMode() !== 'ws') return 'off'
  if (S.connecting) return 'connecting'
  return S.ws && S.ws.readyState === 1 ? 'open' : 'closed'
}

async function onMessage(raw: unknown): Promise<void> {
  let body: unknown
  try {
    body = JSON.parse(typeof raw === 'string' ? raw : Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw))
  } catch {
    return // 心跳 / 非 JSON
  }
  // 动态 import：inbound → adapters → 这里，静态引用会成环
  const [{ getAdapter }, { handleInbound }] = await Promise.all([import('./index'), import('../inbound')])
  const state = await readBotState()
  const list = getAdapter().parseCallback(body, state.botWxid)
  if (list.length) await handleInbound(list)
}

/** 确保连接在（tick 每分钟调一次；webhook 模式、机器人休眠、没有授权码时什么都不做） */
export async function ensureWxpadSocket(): Promise<void> {
  if (wxpadReceiveMode() !== 'ws' || !botEnabledByEnv()) return
  const state = await readBotState()
  // 授权码换了（重新登录 / 换备用号）：旧连接作废，用新码重连
  if (S.ws && S.key !== state.authKey) resetWxpadSocket()
  if (S.connecting || (S.ws && (S.ws.readyState === 0 || S.ws.readyState === 1))) return
  const Ctor = (globalThis as unknown as { WebSocket?: new (url: string) => WsLike }).WebSocket
  if (typeof Ctor !== 'function') {
    if (!S.warnedNoWs) console.error('[bot] BOT_WXPAD_RECEIVE=ws 但运行时没有 WebSocket：app 容器要加 NODE_OPTIONS=--experimental-websocket（Node 20）')
    S.warnedNoWs = true
    return
  }
  if (!state.authKey) return // 小号还没登录过：没有授权码可连
  S.connecting = true
  try {
    const ws = new Ctor(`${wsBase()}/ws/GetSyncMsg?key=${encodeURIComponent(state.authKey)}`)
    S.ws = ws
    S.key = state.authKey
    ws.addEventListener('open', () => {
      S.connecting = false
      console.log('[bot] 协议服务消息通道已连接（WebSocket）')
    })
    ws.addEventListener('message', (ev) => {
      void onMessage(ev.data).catch((e) => console.error('[bot] 处理推送消息失败', (e as Error)?.message))
    })
    const closed = () => {
      S.connecting = false
      if (S.ws !== ws) return
      S.ws = null
      if (S.retryTimer) return
      S.retryTimer = setTimeout(() => {
        S.retryTimer = null
        void ensureWxpadSocket()
      }, 10_000)
      S.retryTimer.unref?.()
    }
    ws.addEventListener('close', closed)
    ws.addEventListener('error', () => {
      console.error('[bot] 协议服务消息通道出错，稍后重连')
    })
  } catch (e) {
    S.connecting = false
    S.ws = null
    console.error('[bot] 连接协议服务消息通道失败', (e as Error)?.message)
  }
}

/** 授权码变了（重新生成 / 换号）时断开，下一次 ensure 用新码重连 */
export function resetWxpadSocket(): void {
  const ws = S.ws
  S.ws = null
  S.connecting = false
  try {
    ws?.close()
  } catch {
    /* 已关闭 */
  }
}

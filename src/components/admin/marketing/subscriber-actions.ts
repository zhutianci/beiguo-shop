/**
 * 后台对订阅的操作（订阅与退订页、用户详情页的营销卡共用）。
 *
 * 【管理员只能「减少来信」】设计 10.3：管理员只能退订、暂停、加入抑制；不能把退订的人改回订阅、
 * 不能解除投诉抑制 —— 否则就等于替用户伪造了同意。服务端同样强制，这里只是把规则讲给站长听。
 * 每个操作都必须填备注（写进审计与留痕），prompt 里说明后果。
 */
import { mktFetch } from './api'

export type SubscriberAction = 'unsubscribe' | 'pause' | 'suppress' | 'unsuppress'

const PAUSE_DAYS = 30

function promptText(action: SubscriberAction, who: string): string {
  switch (action) {
    case 'unsubscribe':
      return (
        `把 ${who} 设为「已退订」？\n\n` +
        '之后不再收到任何营销邮件（订单、验证码等交易邮件不受影响），排队中的也会立即拦下。\n' +
        '管理员不能再把他改回订阅 —— 只有用户本人能在个人中心重新订阅。\n\n' +
        '请填写备注（例如「客服收到邮件退订请求」）：'
      )
    case 'pause':
      return `暂停 ${who} 接收营销邮件 ${PAUSE_DAYS} 天？\n\n到期自动恢复；期间排队中的邮件会被跳过。\n\n请填写备注：`
    case 'suppress':
      return (
        `把 ${who} 加入抑制名单？\n\n` +
        '抑制名单里的邮箱永远不会再收到营销邮件（与订阅状态无关），适合「地址已失效」「对方明确要求别再发」等情况。\n\n' +
        '请填写备注：'
      )
    case 'unsuppress':
      return (
        `解除 ${who} 的抑制？\n\n` +
        '解除后这个邮箱如果仍符合条件，会重新收到营销邮件。请确认原因已经消除（例如邮箱已恢复可用）。\n' +
        '投诉（标记垃圾邮件）的抑制不能解除。\n\n' +
        '请填写备注：'
      )
  }
}

/**
 * 弹窗填备注 → 提交。返回服务端的结果说明；取消或失败返回 null（失败时已 alert）。
 */
export async function runSubscriberAction(opts: {
  action: SubscriberAction
  userId?: number
  email?: string
  /** 给人看的对象描述，如「用户 #12（a@qq.com）」 */
  who: string
}): Promise<string | null> {
  const raw = prompt(promptText(opts.action, opts.who), '')
  if (raw == null) return null
  const note = raw.trim()
  if (note.length < 2) {
    alert('备注至少 2 个字（会记入审计，方便日后查证为什么这么操作）')
    return null
  }
  const body: Record<string, unknown> = { action: opts.action, note: note.slice(0, 200) }
  if (opts.userId) body.userId = opts.userId
  if (opts.email) body.email = opts.email
  if (opts.action === 'pause') body.days = PAUSE_DAYS
  const r = await mktFetch<{ message?: string }>('/api/admin/marketing/subscribers', { body })
  if (!r.ok) {
    alert(r.error || '操作失败')
    return null
  }
  return r.message || r.data?.message || '已完成'
}

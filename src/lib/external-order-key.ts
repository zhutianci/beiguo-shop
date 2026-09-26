/**
 * ExternalOrder.sourceKey 的去重键公式（设计 9.3）。原来在三处各写了一份同样的 hashKey
 * （api/admin/external-orders/import、api/admin/external-orders/[id]、api/admin/orders/[id]），合并到这里。
 *
 *  · 平台行（tenantId = 1）：**沿用旧公式** sha1(小写邮箱|开通日|类型)，与线上已有的 sourceKey 逐字相同，唯一索引不动；
 *  · 渠道行（tenantId ≥ 2）：加前缀 `t<id>:`，并把 tenantId 纳入哈希。同一订阅邮箱、同一开通日在两站各一单时
 *    不再撞键（撞键会让后导入的一行 upsert 覆盖另一站的行，票据就挂错了站）。
 *
 * 结果最长 `t` + 10 位数字 + `:` + 40 位十六进制 = 52 字符，远小于列宽 128。
 * 纯函数，只依赖 node:crypto。
 */
import crypto from 'crypto'

export function externalOrderSourceKey(a: { tenantId: number; claudeAccount: string; startDate: string; subscriptionType: string }): string {
  const base = `${a.claudeAccount.toLowerCase()}|${a.startDate}|${a.subscriptionType}`
  if (a.tenantId === 1) return crypto.createHash('sha1').update(base).digest('hex')
  if (!Number.isInteger(a.tenantId) || a.tenantId < 2) throw new Error(`[external-order-key] tenantId 非法：${a.tenantId}`)
  return `t${a.tenantId}:` + crypto.createHash('sha1').update(`t${a.tenantId}|${base}`).digest('hex')
}

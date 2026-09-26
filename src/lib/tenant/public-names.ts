/**
 * 兑换平台的对外名称（设计 6.4.1：卡密使用情况「provider 只给对外名称」，6.4.2 第 9 条：兑换平台内部键与上游不给渠道）。
 *
 * 渠道层（partner-services）不能直接 import src/lib/redeem（边界检查规则 3），经这里拿公开名。
 * 所有已登记的平台对外都叫同一个名字（与买家兑换页一致），渠道看不出上游是谁、有几家；
 * 未知或空值给「其他」，同样不回显原始键。
 */
import { hasProvider, PUBLIC_SYSTEM_NAME } from '../redeem/registry'

export function redeemProviderPublicName(provider: string): string {
  return hasProvider(provider) ? PUBLIC_SYSTEM_NAME : '其他'
}

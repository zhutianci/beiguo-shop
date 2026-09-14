export const dynamic = 'force-dynamic'

import { indexNowKey } from '@/lib/indexnow'

/**
 * IndexNow 的密钥校验文件。
 *
 * 协议要求密钥可以通过 HTTP 取到，用来证明「提交者确实控制这个域名」。
 * 默认约定是放在 `https://host/<key>.txt`（文件名就是密钥本身）——
 * 那样得开一个根级通配路由，会把所有未匹配的路径都吃进来，不划算。
 * 所以改用协议同样支持的 `keyLocation`：文件固定放这里，提交时告诉对方地址。
 *
 * 【这不是秘密】密钥本来就设计成公开可读的，它证明的是域名控制权，不是身份。
 * 别人拿到它最多只能替你提交你自己的 URL，没有危害。
 */
export async function GET() {
  const key = indexNowKey()
  if (!key) {
    // 没配就明确 404，而不是返回空串 —— 空串会让对方认为校验通过但密钥不匹配，
    // 排查时看到的是「密钥错误」，比「文件不存在」难定位得多
    return new Response('IndexNow key not configured', { status: 404 })
  }
  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

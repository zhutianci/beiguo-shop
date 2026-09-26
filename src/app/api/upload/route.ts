export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
// 魔数识别、上传目录总量配额（含「论坛只能用到 90%」那条线）、落盘都在 lib/upload-store.ts：
// 后台营销邮件图片上传与这里共用同一份用量计数，否则两条通道各守各的上限，合起来照样能写满磁盘
import { CONTACT_QR_MAX_BYTES, sniffImage, storeContactQr, storeUpload } from '@/lib/upload-store'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/auth-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'

const MAX_SIZE = 5 * 1024 * 1024 // 单文件 5MB
// 请求体上限：单文件 5MB + multipart 边界与字段头的开销。nginx 对 /api/upload 另卡 6m（nginx.conf）
const MAX_BODY = MAX_SIZE + 64 * 1024
// 单个身份的频率限制（进程内计数，重启即清零；配合总量上限已足够挡住滥用）
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_MAX = 12

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

/**
 * 业务子目录白名单。
 *
 * 【为什么不能直接用表单传来的目录名】那就是任意路径写入：`../../` 能把图片写到
 * 代码目录甚至覆盖掉构建产物。白名单是这里唯一可接受的做法，多一个业务就在这里加一行
 * （同时在 lib/upload-store.ts 的 STORE_SCOPES 登记目录）。
 *
 * 营销邮件图片（mail）刻意不在这里：它只许管理员传，走 /api/admin/marketing/upload。
 */
const SCOPES: Record<string, string> = {
  forum: 'forum', // 论坛发帖配图（允许匿名）
  links: 'links', // 友链 / 招商位的站点 logo（后台录入）
  products: 'products', // 商品主图（后台录入，展示在商品列表与详情页）
  // 渠道客服二维码（二期改动 4.3：超管在渠道详情里替渠道上传；渠道自己走 /api/partner/settings/contact-qr）。
  // 只许 ADMIN（下面的准入对 forum 以外一律要求 ADMIN）；落盘走 storeContactQr：≤2MB、按文件头只收 png/jpg/webp（不收 gif）
  contact: 'contact',
}

/** scope=contact 允许的声明类型（与 storeContactQr 按文件头的判定一致：gif 不收） */
const CONTACT_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp'])

// 图片上传：保存到 public/uploads/<scope>，返回可访问 URL
export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    // 先看 Content-Length 再 formData()：formData() 会把整个请求体读进内存，
    // 以前是先读完再看 file.size，一批并发的 20MB 请求就能把 app 顶到 mem_limit。
    // 浏览器用 FormData 上传一定带 Content-Length，nginx 缓冲后转发也会带上（写法同营销上传接口）
    const declared = Number(request.headers.get('content-length') || '')
    if (!Number.isFinite(declared) || declared <= 0) return error('请求缺少 Content-Length', 411)
    if (declared > MAX_BODY) return error('图片不能超过 5MB', 413)

    // 限流身份：登录用户按用户 id 计；匿名一律按 IP 计（IPv6 按 /64 聚合，同 auth-throttle）。
    // 【不再认 x-anon-id】它是请求方随便填的（forum-client 里 localStorage 的 UUID），
    // 每次换一个值就是一个新身份，每 10 分钟 12 张的限制形同虚设。
    // 代价：同一出口 IP 后面的多个匿名用户合用这份额度，登录用户不受影响。
    // 两种 key 前缀不同，在 rate-limit 里各占一个桶，匿名刷 IP 挤不掉登录用户的计数。
    const user = await getCurrentUser().catch(() => null)
    const ip = clientIp(request.headers)
    const rateKey = user ? `upload:u:${user.id}` : `upload-ip:${ipKey(ip)}`
    if (rateLimited(rateKey, { windowMs: RATE_WINDOW_MS, max: RATE_MAX })) {
      return error('上传过于频繁，请稍后再试', 429)
    }

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return error('上传内容格式不正确')
    }

    // 目录白名单 + 准入：只有论坛允许匿名和普通用户上传；links / products 是后台录入，只许管理员。
    // 以前这里不做准入，匿名请求就能往 products/links 里写，并占掉「给后台留的最后 10%」配额
    // （quotaForScope），之后后台传商品图、友链 logo、营销邮件图全部 507。
    // hasOwnProperty：scope 是表单值，'__proto__' / 'constructor' 不能命中原型链。
    // getCurrentUser 会查库，不认被禁用或 sessionEpoch 已失效的账号，口径与 requireAdmin 一致；
    // 微信 WebView 里的管理员靠 auth-fetch-patch 补的 Bearer 头也能通过。
    const rawScope = String(form.get('scope') || 'forum')
    const scope = Object.prototype.hasOwnProperty.call(SCOPES, rawScope) ? SCOPES[rawScope] : 'forum'
    if (scope !== 'forum' && user?.role !== 'ADMIN') return error('无管理员权限', 403)

    const file = form.get('file')
    if (!file || !(file instanceof File)) return error('未找到上传文件')

    if (scope === 'contact') {
      // 客服二维码：单独的上限与格式（2MB、不收 gif），返回的地址必然匹配 CONTACT_QR_URL_RE，超管 PATCH 渠道时 zod 只收这种地址
      if (!CONTACT_TYPES.has(file.type)) return error('客服二维码仅支持 JPG / PNG / WebP 图片')
      if (file.size > CONTACT_QR_MAX_BYTES) return error('客服二维码不能超过 2MB')
      const qr = await storeContactQr(Buffer.from(await file.arrayBuffer()))
      if (!qr.ok) {
        if (qr.reason === 'size') return error('客服二维码不能超过 2MB')
        if (qr.reason === 'type') return error('文件内容不是 JPG / PNG / WebP 图片')
        return error('图片存储空间已满，请联系管理员', 507)
      }
      console.log(`[upload] scope=contact url=${qr.url} by=u:${user?.id}`)
      return success({ url: qr.url }, '上传成功')
    }

    if (!ALLOWED[file.type]) return error('仅支持 JPG / PNG / GIF / WebP 图片')
    if (file.size > MAX_SIZE) return error('图片不能超过 5MB')

    const bytes = Buffer.from(await file.arrayBuffer())
    if (bytes.length > MAX_SIZE) return error('图片不能超过 5MB')
    // 以真实文件头为准，而不是客户端声明的 Content-Type
    const ext = sniffImage(bytes)
    if (!ext) return error('文件内容不是有效的图片')

    // 用量按 uploads 根目录统计、论坛只能用到 90% 的线（理由见 lib/upload-store.ts 的 quotaForScope）；
    // 超线时 storeUpload 会打一条 [upload] 告警日志
    const stored = await storeUpload(scope, bytes, ext)
    if (!stored.ok) return error('图片存储空间已满，请联系管理员', 507)

    // 留痕（不入库）：论坛允许匿名传图，出了违规图要能从日志查到来源
    console.log(`[upload] scope=${scope} name=${stored.name} size=${bytes.length} by=${user ? 'u:' + user.id : 'ip:' + ip}`)
    return success({ url: stored.url }, '上传成功')
  } catch (err) {
    console.error('Upload error:', err)
    return error('上传失败')
  }
}

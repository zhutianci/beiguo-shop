import type { Metadata } from 'next'
import Link from 'next/link'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { getStorefront } from '@/lib/storefront/resolve'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('注册', '注册贝果科技账号。')

/*
 * 【渠道店面未开业 / 已停业：注册页换成说明（设计 6.7，终审第 2 轮）】
 * 注册接口对 CHANNEL 的 DRAFT / TERMINATED 一律 403「本站暂不开放注册」（api/auth/register、send-code），
 * 页面却照常给出完整表单：买家填完、收不到验证码、点提交才被拒。这里在服务端直接换成说明，入口也在外壳里隐藏了
 * （(shop)/layout.tsx 传给 Header 的 registrationOpen）。
 * 店面解析不包 try（notFound / 解析失败靠异常控制流）；没有店面的 Host 在 (shop)/layout 已经 404，不会走到这里。
 * 主站恒为 ACTIVE 的 PLATFORM：原样渲染 children，与改造前逐字相同（休眠）。
 */
export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const sf = await getStorefront()
  if (sf && sf.kind === 'CHANNEL' && (sf.status === 'DRAFT' || sf.status === 'TERMINATED')) {
    return (
      <div className="page-top container pb-24">
        <div className="mx-auto max-w-lg rounded-2xl glass p-8 text-center">
          <h1 className="text-2xl font-bold">{sf.status === 'TERMINATED' ? '本店已停止营业' : '本店暂未开放注册'}</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {sf.status === 'TERMINATED' ? '本店已停止营业，不再开放注册；已有账号请直接登录，查看订单、取卡与联系客服。' : '本店暂未开放注册；已有账号请直接登录。'}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login" className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90">
              登录
            </Link>
            <Link href="/orders" className="rounded-full glass px-6 py-2.5 text-sm font-medium hover:bg-white/10">
              我的订单
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

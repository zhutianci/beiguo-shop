import Link from 'next/link'
import type { CatalogService } from '@/lib/jiema/dto'
import { JIEMA_SEO_SERVICES, jiemaSvcHref } from '@/lib/jiema/seo-whitelist'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE } from '@/lib/terms/jiema-wallet'
import { DISPLAY_DURATION_MIN } from '@/lib/jiema/catalog'

/**
 * /jiema hub 的服务端正文（docs/SEO-重构/SEO-重构设计.md §1.6、§3.3、§5.4，批 2 的 F1；站长 2026-10-07 要求接码进搜索）。
 *
 * 【每一句都对得上代码或条款】这一页会被收录、被 AI 摘录，写错一个字就会被放大：
 *  · 号码有效期 DISPLAY_DURATION_MIN（lib/jiema/catalog.ts）；免费换号次数取 sms_config.maxReplace；取号 2 分钟后可换号 / 取消、
 *    收到验证码后不能再换号或取消、价格每 10 分钟更新——与本页规则卡片（page.tsx）同口径；
 *  · 退款去向：整单退回站内余额（含支付宝付的部分），余额不可提现、不退回支付宝（D3、D4；条款第一节）；
 *  · 开票：D37 原文「暂不支持开票，可联系客服开票处理」，不写成可开票；
 *  · 付款方式按 canUseForJiema 渲染（支付宝或站内余额 / 只有支付宝）；
 *  · 号码类型只写一句「不区分、不能指定」（D26）；**不写成功率**、不写「秒收」「必收」、不承诺能通过任何平台的验证；
 *  · 不原样引用平台的拒绝提示，不教人绕过平台风控（条款第二节第（六）项）。
 * 【不链账号类商品与 KYC】（§2.5 硬规则）相关链接只到 ChatGPT Plus、Claude Pro 充值与 Codex 接码说明页。
 * 【常用服务表取 SEO 白名单】不取后台 hotRank（§0.3 #34）；起价与下单同源（catalogSnapshot → salePriceCents）。
 */

function priceText(s: CatalogService | undefined): string {
  if (!s) return '暂无号码'
  if (s.level === 'OUT') return '暂无号码'
  if (s.fromCents == null) return '起价以实际为准'
  const yuan = (s.fromCents / 100).toFixed(2).replace(/\.00$/, '')
  return `${s.approx ? '约 ' : ''}￥${yuan} 起`
}

export function JiemaHubServices({ services }: { services: CatalogService[] }) {
  const byCode = new Map(services.map((s) => [s.code, s]))
  const rows = JIEMA_SEO_SERVICES.filter((w) => byCode.has(w.code))
  if (!rows.length) return null
  return (
    <section aria-labelledby="jiema-popular" className="mt-10">
      <h2 id="jiema-popular" className="mb-2 text-lg font-semibold text-white/85">
        常用服务的实时起价
      </h2>
      <p className="mb-4 text-[13px] leading-relaxed text-white/50">
        价格按服务和国家/地区实时报价，下表是该服务所有可选国家/地区里的最低价；点「选这个服务」直接进入国家/地区列表。
        列表里没有的服务，在上面的搜索框按名称搜。
      </p>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-white/50">
              <th scope="col" className="px-4 py-2.5 font-medium">服务</th>
              <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">适合接收</th>
              <th scope="col" className="whitespace-nowrap px-4 py-2.5 font-medium">起价</th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.slug} className="border-t border-white/5">
                <td className="px-4 py-2.5 text-white/85">{w.name}</td>
                <td className="hidden px-4 py-2.5 text-white/50 sm:table-cell">{w.use}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-white/80">{priceText(byCode.get(w.code))}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <a href={jiemaSvcHref(w.slug)} className="text-cyan-300/90 hover:underline">
                    选这个服务
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function JiemaHubGuide({ maxReplace, payText }: { maxReplace: number; payText: string }) {
  return (
    <section aria-labelledby="jiema-guide" className="mt-12 space-y-8 text-[14px] leading-[1.9] text-white/60">
      <div>
        <h2 id="jiema-guide" className="mb-2 text-lg font-semibold text-white/85">
          短信接码是什么，适合什么场景
        </h2>
        <p>
          短信接码就是临时用一个海外手机号接收一次短信验证码：你在本页选好要验证的服务和国家/地区，付款后系统分配一个号码，
          你把号码填到要验证的网站或 App 里，对方发来的验证码会显示在本站的号码页上。适合在本人的境外服务账号上做注册或手机验证、
          手边没有对应国家/地区的手机号时使用，也适合软件开发测试。号码只用于接收这一次验证码，不是长期使用的手机号。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">怎么用：三步接收验证码</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>选服务：在上面的列表里点要验证的服务，或按名称搜索；没有的服务选「其他服务」。</li>
          <li>选国家/地区：每个国家/地区都写着实时价格和库存，按需要挑一个。</li>
          <li>
            确认并付款（{payText}，登录后下单）：系统分配号码，进入号码页；号码 {DISPLAY_DURATION_MIN} 分钟有效，验证码到达后直接显示在号码页上。
          </li>
        </ol>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">美国手机号接收验证码</h2>
        <p>
          选好服务后，在国家/地区列表里选「美国」即可拿到一个美国手机号接收这一次的验证码；英国、日本、中国香港等也在同一个列表里。
          每个国家/地区有没有号、价格多少，按服务实时显示。号码能不能通过对方平台的验证，由对方平台决定，本站不对号码适用于任何特定用途作出承诺。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">价格怎么定</h2>
        <p>
          同一个服务在不同国家/地区价格不同，页面价格每 10 分钟更新一次，下单时以实时价格为准。本站不区分、也不能指定号码类型（实体号或虚拟号），
          号码能否被平台接受由平台决定。暂不支持开票，可联系客服开票处理。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">没收到短信怎么办</h2>
        <p>
          取号 2 分钟后可以换号或取消；收到验证码之前可以免费换号 {maxReplace} 次。号码到期或你主动取消、始终没收到短信的，本单整单退回站内余额（含支付宝付的部分）；
          退回的余额不能提现、不退回支付宝，目前可用于短信接码。收不到码时先确认填进对方页面的号码和国家/地区区号没有填错，稍后再试一次；
          收到验证码后就不能再换号或取消了。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">合法用途</h2>
        <p>
          本服务仅限用于学习交流、软件开发测试与本人合法注册验证等合法用途，严禁用于违法犯罪、电信网络诈骗或冒用他人身份；
          每一单付款前都要阅读并同意下单须知，完整规则见
          <Link href={JIEMA_TERMS_PATH} className="mx-0.5 text-cyan-300/90 hover:underline">
            《{JIEMA_TERMS_TITLE}》
          </Link>
          。
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white/85">相关说明</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Codex 登录要验证手机号：见
            <Link href="/chongzhi/codex-jiema" className="mx-0.5 text-cyan-300/90 hover:underline">
              Codex 接码说明
            </Link>
          </li>
          <li>
            注册完 ChatGPT，想开通 Plus：见
            <Link href="/chongzhi/chatgpt-plus" className="mx-0.5 text-cyan-300/90 hover:underline">
              ChatGPT Plus 充值
            </Link>
          </li>
          <li>
            注册完 Claude，想开通 Pro：见
            <Link href="/chongzhi/claude-pro" className="mx-0.5 text-cyan-300/90 hover:underline">
              Claude Pro 充值
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}

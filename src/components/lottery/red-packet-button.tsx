'use client'

import { useStorefront } from '@/components/storefront-provider'
import { MailOpen } from 'lucide-react'
// 只取类型：lib/lottery 间接引用了 lib/coupon（带 prisma 与 node crypto），值导入会把它们打进前端包
import type { BuyerLotteryView } from '@/lib/lottery'

/**
 * 订单卡片上的「下单有奖」红包按钮，紧跟在「与客服在线沟通」后面。
 *
 *  · 有资格、已付款、未抽 → 合着的红包（红底 + 金色「奖」字），带一点呼吸光吸引注意
 *  · 已抽 → 拆开的红包（深色底 + 红描边），显示「已中奖 / 未中奖」，点开重看结果
 *  · 其它情况（未付款、已取消、资格作废）→ 不渲染，由调用方决定要不要给文字提示
 *
 * 尺寸与同一行的 ActionButton 保持一致（px-4 py-2 / lg:px-5 lg:py-2.5、text-sm / lg:text-[15px]、
 * 16px 图标位、1px 边框），同一行按钮高度不齐会很显眼。
 */
function RedPacketButtonInner({
  view,
  canDraw,
  onClick,
}: {
  view: BuyerLotteryView
  canDraw: boolean
  onClick: () => void
}) {
  if (view.state === 'PENDING' && canDraw) {
    return (
      <span className="relative inline-flex">
        {/* 呼吸光：只在系统没开「减弱动态效果」时动（pulse-glow 关键帧在 globals.css） */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/35 via-red-500/40 to-amber-400/35 opacity-60 blur-md motion-safe:animate-[pulse-glow_2.4s_ease-in-out_infinite]"
        />
        {/* 字色用暖白而不是纯金：金字压在偏亮的红上对比度不到 3:1，暖白在整条渐变上都 ≥4.5:1 */}
        <button
          type="button"
          onClick={onClick}
          title="拆红包，看看这一单抽中了什么"
          className="relative inline-flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-amber-300/40 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#e53e3e] hover:to-[#c81e1e] shadow-[0_4px_16px_rgba(185,28,28,0.35)] text-sm lg:text-[15px] font-semibold text-amber-50 transition-colors"
        >
          {/* 金色圆章「奖」：红包封面的视觉锚点，和图标位同为 16px，保证与邻居按钮等高 */}
          <span
            aria-hidden
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#fde68a] to-[#f59e0b] text-[10px] font-bold leading-none text-[#9a3412] shadow-[0_0_0_1px_rgba(154,52,18,0.35)]"
          >
            奖
          </span>
          下单有奖
          {/* 右上角小金点，与「客服新回复」的红点同一个位置和尺寸 */}
          <span aria-hidden className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
        </button>
      </span>
    )
  }

  if (view.state === 'DRAWN') {
    const won = !!view.won
    return (
      <button
        type="button"
        onClick={onClick}
        title="查看抽奖结果"
        className="relative inline-flex items-center gap-1.5 px-4 py-2 lg:px-5 lg:py-2.5 rounded-lg border border-red-400/35 bg-red-500/10 hover:bg-red-500/15 lg:hover:border-red-400/50 text-sm lg:text-[15px] font-medium transition-colors"
      >
        <MailOpen className={`w-4 h-4 ${won ? 'text-amber-300' : 'text-red-300/70'}`} />
        <span className={won ? 'text-amber-300' : 'text-white/55'}>{won ? '已中奖' : '未中奖'}</span>
      </button>
    )
  }

  return null
}

/**
 * 渠道分站（实施分包 WP1）：抽奖在渠道站关闭（设计 7.6）。
 * 只控制显示；对应接口在渠道 Host 上服务端 404（denyOnChannel）。组件本体改名为 RedPacketButtonInner、原样不动，
 * 由这层按店面决定挂不挂：不渲染就不会发出任何请求（验收 W1-9：渠道站页面零 404 请求）。主站恒为渲染，行为不变。
 */
export function RedPacketButton(props: React.ComponentProps<typeof RedPacketButtonInner>) {
  const { features } = useStorefront()
  if (!(features.lottery)) return null
  return <RedPacketButtonInner {...props} />
}

export default RedPacketButton

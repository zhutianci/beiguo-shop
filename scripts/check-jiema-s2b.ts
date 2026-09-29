/**
 * 短信接码 · S2b（页面与后台）的纯函数检查（不连库）。docs/短信接码-设计.md §12.1 第 6、7 条、§12.3 第 69–77、118–120、126 条里能写成纯函数断言的部分：
 *
 *   npx tsx scripts/check-jiema-s2b.ts
 *
 * 覆盖：确认面板的付款拆分与三种按钮文案（§1.8）、409 PRICE_CHANGED / BALANCE_CHANGED 的一个弹窗（含 suggestPayWith）、clientToken 什么时候换、
 * 登录 / 注册回跳整段编码与 safeRedirect（D24、§6.6 第 30 条）、去充值 returnTo、号码拆分与复制文本（§12.1 第 6 条）、倒计时、
 * 后台低频轮询（§1.10）、开票提示的四种状态（D37 清单第 ④ 项）、重新发起支付的关单判定与文案（§1.9）、复制订单信息（§8.2）、
 * 「我的订单」接码卡片（§6.6 第 27 条、§12.2 第 93 条）、悬浮组件让位（§6.6 第 31 条）、条款默认勾选、
 * §9.5 的营收 / 成本 / 毛利口径（售后冲减的例子）与后台页脚「营收 − 成本 = 毛利」、后台付款一格、号码页 DTO 新增字段不泄露成本。
 */
import {
  payPlan,
  defaultPayWith,
  payButtonLabel,
  changeDialog,
  shouldRenewOrderToken,
  jiemaSelectionPath,
  loginHref,
  withRedirect,
  topupHref,
  groupNational,
  copyTexts,
  fmtCountdown,
  pollDelay,
  BACKGROUND_POLL_MS,
  showInvoiceNoticeFor,
  flashTitle,
  payErrorClosedOrder,
  payRetryText,
  stateBadge,
  orderInfoText,
  bjTime,
  jiemaOrderCard,
  orderAmountText,
  termsPreTicked,
  effectivePayWith,
  jiemaAmountLines,
} from '../src/lib/jiema/ui'
import { claimReopenTarget, manualEventInfo, adminClaimReject, overEffCap, unmanualBlock, INFLIGHT_TEXT, type ClaimReopenInput } from '../src/lib/jiema/machine'
import { summarizeFinance, listFooter, payCellText, type FinanceRow } from '../src/lib/jiema/report'
import { safeRedirect } from '../src/lib/safe-redirect'
import { hideLiveOrdersOn, hideFloatingContactOn } from '../src/lib/floating-widgets'
import { toJiemaOrderView, FORBIDDEN_BUYER_KEYS, collectKeyNames, type JiemaOrderView } from '../src/lib/jiema/dto'
import { JIEMA_ORDER_AVAILABLE, jiemaPublicOpen, smsConfigSaveBlockers, FACTORY_SMS_CONFIG } from '../src/lib/jiema-config-schema'

let pass = 0
let fail = 0
function ok(cond: boolean, name: string, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
const eq = (a: unknown, b: unknown, name: string) => ok(JSON.stringify(a) === JSON.stringify(b), name, `实际 ${JSON.stringify(a)}，期望 ${JSON.stringify(b)}`)

console.log('\n【确认面板：付款拆分（§1.8、D32：先充值格、后返现格）】')
{
  eq(payPlan(170, 200, 0, 'BALANCE'), { mode: 'BALANCE', balanceCents: 170, topupCents: 170, cashCents: 0, alipayCents: 0 }, '余额 ≥ 应付 → 余额付清（只扣充值格）')
  eq(payPlan(170, 70, 50, 'BALANCE'), { mode: 'MIXED', balanceCents: 120, topupCents: 70, cashCents: 50, alipayCents: 50 }, '余额 ¥1.20（充值 0.70 · 返现 0.50）< 应付 ¥1.70 → 组合：余额 1.20 + 支付宝 0.50')
  eq(payPlan(170, 100, 100, 'BALANCE'), { mode: 'BALANCE', balanceCents: 170, topupCents: 100, cashCents: 70, alipayCents: 0 }, '充值格不够 → 扣光充值格再扣返现格')
  eq(payPlan(170, 0, 0, 'BALANCE'), { mode: 'ALIPAY', balanceCents: 0, topupCents: 0, cashCents: 0, alipayCents: 170 }, '余额为 0 → 支付宝全额（不管选了什么）')
  eq(payPlan(170, 500, 0, 'ALIPAY'), { mode: 'ALIPAY', balanceCents: 0, topupCents: 0, cashCents: 0, alipayCents: 170 }, '选支付宝 → 支付宝全额')
  ok(defaultPayWith(120, true) === 'BALANCE' && defaultPayWith(0, true) === 'ALIPAY' && defaultPayWith(120, false) === 'ALIPAY', '默认选中：余额 > 0 且余额支付开 → 余额抵扣，否则支付宝')
  ok(payButtonLabel(payPlan(170, 200, 0, 'BALANCE')) === '确认支付（余额 ¥1.70）', '余额付清的按钮：「确认支付（余额 ¥1.70）」')
  ok(payButtonLabel(payPlan(170, 70, 50, 'BALANCE')) === '确认支付：余额 ¥1.20 + 支付宝 ¥0.50', '组合的按钮写清两段金额')
  ok(payButtonLabel(payPlan(170, 0, 0, 'ALIPAY')) === '确认支付（支付宝 ¥1.70）', '支付宝全额的按钮')
}

console.log('\n【409 的一个弹窗（§1.8：价格与拆分一起确认；余额用完时服务端给 suggestPayWith）】')
{
  const p = changeDialog('PRICE_CHANGED', { oldPriceCents: 170, payWith: 'BALANCE' }, { priceCents: 186, balanceCents: 120, alipayCents: 66 })
  ok(!!p && p.text === '价格已更新为 ¥1.86（原 ¥1.70）：余额抵扣 ¥1.20 + 支付宝 ¥0.66，是否继续？', 'PRICE_CHANGED：「价格已更新为 ¥1.86（原 ¥1.70）：余额抵扣 ¥1.20 + 支付宝 ¥0.66，是否继续？」', p?.text)
  eq(p?.next, { expectPriceCents: 186, payWith: 'BALANCE', expectBalanceCents: 120 }, '继续时新价与新拆分一起提交（不会再弹第二次）')
  const pa = changeDialog('PRICE_CHANGED', { oldPriceCents: 170, payWith: 'ALIPAY' }, { priceCents: 186, balanceCents: 0, alipayCents: 186 })
  ok(!!pa && pa.text.includes('支付宝 ¥1.86') && pa.next.payWith === 'ALIPAY' && pa.next.expectBalanceCents === null, '纯支付宝单的价格变化：只写支付宝金额')
  const b = changeDialog('BALANCE_CHANGED', { oldPriceCents: 170, payWith: 'BALANCE' }, { balanceCents: 80, alipayCents: 90 })
  ok(!!b && b.text === '你的可用余额刚刚变化：余额抵扣 ¥0.80 + 支付宝 ¥0.90，是否继续？' && b.next.expectBalanceCents === 80, 'BALANCE_CHANGED：「你的可用余额刚刚变化：余额抵扣 ¥0.80 + 支付宝 ¥0.90，是否继续？」', b?.text)
  const s = changeDialog('BALANCE_CHANGED', { oldPriceCents: 170, payWith: 'BALANCE' }, { balanceCents: 0, alipayCents: 170, suggestPayWith: 'ALIPAY' })
  ok(!!s && s.text === '你的余额已用完，本单改用支付宝 ¥1.70 支付？' && s.confirmLabel === '用支付宝支付' && s.next.payWith === 'ALIPAY' && s.next.expectBalanceCents === null, '余额用完 + suggestPayWith → 改用支付宝提交（不带 expectBalanceCents）')
  ok(changeDialog('PRICE_CHANGED', { oldPriceCents: 170, payWith: 'BALANCE' }, { priceCents: 186, balanceCents: 120, alipayCents: 60 }) === null, '拆分对不上价格（120 + 60 ≠ 186）→ 不弹（前端不自己猜）')
  ok(changeDialog('BALANCE_CHANGED', { oldPriceCents: 170, payWith: 'BALANCE' }, { balanceCents: -1, alipayCents: 171 }) === null, '负数 / 非整数 → 不弹')
  ok(shouldRenewOrderToken(503, 'PAY_BUSY') && shouldRenewOrderToken(429, 'OPEN_PAYMENTS', { released: true }), '服务端建了单又关掉（PAY_BUSY、事后复核超限）→ 换 clientToken')
  ok(!shouldRenewOrderToken(429, 'OPEN_PAYMENTS') && !shouldRenewOrderToken(409, 'PRICE_CHANGED') && !shouldRenewOrderToken(503, 'BUSY'), '预检 429、409、未知 5xx → 保留 token（重试时同一张单原样返回，不重复建单）')
}

console.log('\n【登录 / 注册回跳（D24、§6.6 第 30 条）】')
{
  const path = jiemaSelectionPath('tg', 6, 'tmobile')
  ok(path === '/jiema?s=tg&c=6&op=tmobile&confirm=1', '选择状态 → /jiema?s=&c=&op=&confirm=1', path)
  ok(jiemaSelectionPath('tg', 6, null) === '/jiema?s=tg&c=6&confirm=1' && jiemaSelectionPath('tg', 6, 'any') === '/jiema?s=tg&c=6&confirm=1', '任意运营商不写 op')
  const login = loginHref(path)
  const q = new URLSearchParams(login.split('?')[1])
  ok(Array.from(q.keys()).join(',') === 'redirect' && q.get('redirect') === path, '登录地址整段编码：登录页只看到一个 redirect 参数（&c=、&op=、&confirm= 不会被吃掉）', login)
  ok(safeRedirect(q.get('redirect')) === path, '登录页 safeRedirect 之后原样回到确认面板')
  const reg = withRedirect('/register', safeRedirect(q.get('redirect')))
  ok(reg === `/register?redirect=${encodeURIComponent(path)}` && safeRedirect(new URLSearchParams(reg.split('?')[1]).get('redirect')) === path, '登录页的「注册」链接带同一个 redirect；注册成功按 safeRedirect 回到确认面板')
  ok(withRedirect('/register', '/') === '/register' && withRedirect('/login', null) === '/login', '回跳是首页 / 没有 redirect → 与改造前的链接逐字相同')
  ok(safeRedirect('//evil.com') === '/' && safeRedirect('javascript:alert(1)') === '/', '外站 / javascript: 回跳仍被拒（开放重定向）')
  ok(topupHref(path) === `/wallet/topup?returnTo=${encodeURIComponent(path)}`, '「去充值」带 returnTo（/jiema 开头）')
  ok(topupHref('/jiema?' + 'x'.repeat(130)) === '/wallet/topup' && topupHref('/orders') === '/wallet/topup', 'returnTo 超过 120 字或不是 /jiema → 不带（充值页本来就不收）')
}

console.log('\n【号码页：号码拆分、复制、倒计时、轮询（§1.10、§12.1 第 6 条）】')
{
  ok(groupNational('81234567890') === '812 3456 7890', '11 位本地号按 3-4-4 分组')
  ok(groupNational('7700900123') === '770 090 0123', '10 位按 3-3-4')
  ok(groupNational('1234567') === '123 4567', '短号：末 4 位一组')
  eq(copyTexts({ full: '+6281234567890', national: '81234567890' }), { full: '+6281234567890', national: '81234567890' }, '复制文本：完整号带 +、不含区号只有本地号，都不带空格')
  eq(copyTexts({ full: '+62 812 3456 7890', national: '812 3456 7890' }), { full: '+6281234567890', national: '81234567890' }, '即使显示带空格，复制出来也不带')
  ok(fmtCountdown(17 * 60_000 + 42_000) === '17:42' && fmtCountdown(-5) === '0:00' && fmtCountdown(3_725_000) === '1:02:05', '倒计时 mm:ss（负数按 0，超过 1 小时 h:mm:ss）')
  ok(pollDelay('WAITING', 3000, false) === 3000 && pollDelay('RECEIVED', 3000, false) === 3000, '前台：按服务端 pollMs（3 秒）')
  ok(pollDelay('WAITING', 3000, true) === BACKGROUND_POLL_MS && pollDelay('REPLACING', 3000, true) === 12_000 && pollDelay('CANCELLING', 3000, true) === 12_000, '后台：WAITING / REPLACING / CANCELLING 以 12 秒低频继续（标题闪烁、提示音在后台也能触发）')
  ok(pollDelay('RECEIVED', 3000, true) === 0 && pollDelay('PENDING_PAY', 3000, true) === 0, '后台：其他状态暂停（回到前台立即拉一次）')
  ok(pollDelay('FINISHED', 0, false) === 0 && pollDelay('CLOSED', 0, true) === 0, '终态 pollMs=0 → 不再轮询')
  ok(['RECEIVED', 'FINISHED', 'REFUNDED', 'CANCELLED'].every(showInvoiceNoticeFor) && !['PENDING_PAY', 'CLOSED', 'WAITING', 'MANUAL'].some(showInvoiceNoticeFor), '开票提示：RECEIVED / FINISHED / REFUNDED / CANCELLED 四种状态有，PENDING_PAY、CLOSED 没有（D37 ④）')
  ok(flashTitle('482917') === '【验证码 482917】' && flashTitle(null) === '【收到短信】', '收到码时闪烁的标题')
  ok(payErrorClosedOrder('HOLD') && payErrorClosedOrder('UNAVAILABLE') && payErrorClosedOrder('QUOTE_EXPIRED') && !payErrorClosedOrder('PAID_PROCESSING') && !payErrorClosedOrder(null), '重新发起支付：HOLD / UNAVAILABLE / QUOTE_EXPIRED 表示已关单（刷新成 CLOSED，不再提示「可以重试」）')
  ok(payRetryText('MIXED') === '发起支付失败，可以重试，或取消订单（预扣的余额立即退回）' && payRetryText('ALIPAY') === '发起支付失败，可以重试，或取消订单', '其他失败的固定提示：纯支付宝单去掉括号')
  ok(stateBadge('CANCELLED').label === '已取消 · 已退回余额' && stateBadge('CLOSED').label === '未支付 · 已关闭' && stateBadge('WAITING').tone === 'amber' && stateBadge('RECEIVED').tone === 'green', '状态徽章：等待琥珀、收到绿、取消灰')
  const info = orderInfoText(
    {
      orderNo: '2026092914035521',
      state: 'WAITING',
      createdAt: '2026-09-29T06:03:00.000Z',
      service: { name: 'Telegram（电报）' },
      country: { name: '印度尼西亚' },
      operator: null,
      number: { dial: '62', national: '81234567890', seq: 2, endsAt: '2026-09-29T06:23:00.000Z' },
    },
    Date.parse('2026-09-29T06:10:29.000Z'),
  )
  eq(
    info.split('\n'),
    ['【短信接码售后】', '订单号：2026092914035521', '服务 / 国家或地区：Telegram（电报） / 印度尼西亚（任意运营商）', '号码：+62 812 3456 7890（第 2 个号）', '下单：2026-09-29 14:03 · 状态：等待短信（剩余 12:31）', '问题：'],
    '「复制订单信息」逐行与 §8.2 一致（时间按北京时间）',
  )
  ok(bjTime('2026-09-29T16:30:00.000Z') === '2026-09-30 00:30', '北京时间跨零点')
}

console.log('\n【「我的订单」里的接码卡片（§6.6 第 27 条、§12.2 第 93 条）】')
{
  const bal = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'BALANCE', holdCents: 170, holdState: 'HELD' } })
  ok(bal.label === '正在确认付款' && !bal.showGoPay && bal.showAlipay === false && !bal.showInvoiceNotice, '余额付清单停在 PENDING_PAY：「正在确认付款」、没有任何支付按钮')
  const mix = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'MIXED', holdCents: 120, holdState: 'HELD' } })
  ok(mix.showGoPay && mix.showAlipay === false && !!mix.hint?.includes('余额已预扣 ¥1.20'), '组合单待支付：注明「余额已预扣」、按钮是「去付款（号码页）」而不是「支付宝支付」')
  const closed = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'CANCELLED', jiema: { state: 'CLOSED', payMode: 'MIXED', holdCents: 120, holdState: 'RELEASED' } })
  ok(closed.label === '未支付 · 已关闭' && closed.hint === '未支付 · 已关闭，预扣 ¥1.20 已退回' && !/超时/.test(`${closed.label}${closed.hint}`), '买家取消的组合单：「未支付 · 已关闭 · 预扣 ¥x 已退回」，不出现「超时取消」')
  const closedAli = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'CANCELLED', jiema: { state: 'CLOSED', payMode: 'ALIPAY', holdCents: 0, holdState: null } })
  ok(closedAli.label === '未支付 · 已关闭' && closedAli.hint === null, '纯支付宝的关闭单不写「已退回」（什么都没退），也不重复一行')
  const recv = jiemaOrderCard({ payStatus: 'PAID', deliveryStatus: 'DELIVERED', jiema: { state: 'RECEIVED', payMode: 'BALANCE', holdCents: 246, holdState: 'CAPTURED' } })
  ok(recv.label === '已收到短信', '收到码（订单已 DELIVERED、号码还能继续收）→「已收到短信」而不是「已完成」')
  const proc = jiemaOrderCard({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', jiema: { state: 'WAITING', payMode: 'ALIPAY', holdCents: 0, holdState: null } })
  ok(proc.label === '正在接码' && proc.hint === '正在接码，点「查看号码」' && proc.showInvoiceNotice, 'PROCESSING：「正在接码」；已付款卡片有开票提示')
  const canc = jiemaOrderCard({ payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED', jiema: { state: 'CANCELLED', payMode: 'BALANCE', holdCents: 170, holdState: 'REFUNDED' } })
  ok(canc.label === '已取消 · 已退回余额' && canc.showInvoiceNotice && !canc.showGoPay, '已取消（REFUNDED + CANCELLED）：「已取消 · 已退回余额」，开票提示照样显示')
  ok([bal, mix, closed, proc, canc].every((c) => c.showNumberLink && c.showChat), '任何状态的接码单都有「查看号码 →」与在线沟通')
  ok(!mix.showInvoiceNotice && !closed.showInvoiceNotice, '待支付、已关闭的卡片没有开票提示（D37 ⑤）')
  ok(orderAmountText(1.7, 'SMS_POOL') === '¥1.70' && orderAmountText(12, 'AUTO') === '¥12', '金额：接码单按分（¥1.70 不显示成「¥2」），普通商品不变')
}

console.log('\n【悬浮组件让位（§6.6 第 31 条）与条款默认勾选（§1.8）】')
{
  ok(hideLiveOrdersOn('/jiema') && hideLiveOrdersOn('/jiema/order/X') && hideLiveOrdersOn('/wallet') && hideLiveOrdersOn('/wallet/topup') && !hideLiveOrdersOn('/products') && !hideLiveOrdersOn('/jiemax'), '成交弹窗：/jiema/*、/wallet/* 不渲染')
  ok(hideFloatingContactOn('/jiema') && hideFloatingContactOn('/jiema/order/X') && !hideFloatingContactOn('/wallet') && !hideFloatingContactOn('/wallet/topup') && !hideFloatingContactOn(null), '客服按钮：只在 /jiema/* 隐藏，/wallet/* 保留')
  ok(!termsPreTicked(null, { jiema: 'a', wallet: 'b' }), '首单：两份条款都要勾')
  ok(termsPreTicked({ jiema: 'a', wallet: 'b' }, { jiema: 'a', wallet: 'b' }) && !termsPreTicked({ jiema: 'a', wallet: 'old' }, { jiema: 'a', wallet: 'b' }), '同一版默认勾选；任一份升版后重新勾选')
  ok(JIEMA_ORDER_AVAILABLE === true && !jiemaPublicOpen({ ...FACTORY_SMS_CONFIG }) && jiemaPublicOpen({ ...FACTORY_SMS_CONFIG, enabled: true, audience: 'ALL' }), 'S2b：JIEMA_ORDER_AVAILABLE=true；出厂配置（关、仅管理员）仍不开放')
  ok(!smsConfigSaveBlockers({ ...FACTORY_SMS_CONFIG, audience: 'ALL' }).audience, '后台可以保存「全部用户」（S4 对账跑满 3 天前不要切，部署说明写明）')
}

console.log('\n【§9.5 营收 / 成本 / 毛利口径与后台页脚】')
{
  const day0 = new Date('2026-09-29T16:00:00.000Z') // 北京 09-30 00:00
  const day1 = new Date(day0.getTime() + 86400_000)
  const at = new Date(day0.getTime() + 3600_000)
  const row = (o: Partial<FinanceRow>): FinanceRow => ({ state: 'FINISHED', priceCents: 0, chargedMicro: null, costCents: null, profitCents: null, lossCents: null, costFinal: false, costAt: null, refundedAt: null, refundTopupCents: null, refundCashCents: null, ...o })
  const rows: FinanceRow[] = [
    row({ state: 'FINISHED', priceCents: 968, chargedMicro: 660000, costCents: 476, profitCents: 492, costFinal: true, costAt: at }),
    // §9.5 的例子：RECEIVED 的 ¥2.46 单当天售后退款，成本 ¥0.94 → 营收 +2.46、成本 −0.94、冲减 −2.46 → 当天毛利 −¥0.94
    row({ state: 'REFUNDED', priceCents: 246, chargedMicro: 130000, costCents: 94, profitCents: -94, costFinal: true, costAt: at, refundedAt: at }),
    row({ state: 'CANCELLED', priceCents: 172, lossCents: 18, refundedAt: at, refundTopupCents: 122, refundCashCents: 50 }),
    row({ state: 'RECEIVED', priceCents: 300, costCents: 50, profitCents: 250, costFinal: false }),
    row({ state: 'FINISHED', priceCents: 500, costCents: 100, profitCents: 400, costFinal: true, costAt: new Date(day0.getTime() - 1) }),
  ]
  const s = summarizeFinance(rows, day0, day1)
  ok(s.revenueCents === 968 + 246 && s.costCents === 476 + 94 && s.refundOffsetCents === 246, '营收 = 当天定稿（FINISHED / REFUNDED）的售价；真实成本 = Σ costCents；售后冲减 = 当天售后退款单的售价')
  ok(s.profitCents === 492 - 94, '毛利 = 营收 − 成本 − 冲减 = Σ profitCents（¥4.92 − ¥0.94）', String(s.profitCents))
  ok(s.cancelled.count === 1 && s.cancelled.topupCents === 122 && s.cancelled.cashCents === 50 && s.lossCents === 18, '已取消：单数、两格退回金额、亏损；不进营收成本毛利')
  ok(s.estimating === 1 && s.finalized === 2, '预估中（已收码未定稿）单独计数、不进毛利；昨天定稿的单不算今天')
  const only = summarizeFinance([rows[1]], day0, day1)
  ok(only.revenueCents - only.costCents - only.refundOffsetCents === -94, '单看 §9.5 的例子：当天毛利 −¥0.94（不是 −¥2.46）')
  const foot = listFooter(rows.map((r) => ({ state: r.state, priceCents: r.priceCents, costCents: r.costCents, profitCents: r.profitCents, lossCents: r.lossCents, costFinal: r.costFinal })))
  ok(foot.revenueCents - foot.costCents === foot.profitCents, '后台页脚：营收 − 真实成本 = 毛利（售后单营收记 0、利润 −成本）', JSON.stringify(foot))
  ok(foot.notCounted === 1 && foot.estimating === 1 && foot.lossCents === 18, '页脚：已取消单「不计」、预估单单独计数、亏损单列')
  ok(payCellText({ payMode: 'MIXED', topupCents: 70, cashCents: 50, alipayCents: 50, alipayPaidCents: 52 }) === '余额 ¥1.20（充值 0.70 / 返现 0.50） + 支付宝 ¥0.50（实收 0.52）', '后台「付款」一格（§7.2）')
  ok(payCellText({ payMode: 'BALANCE', topupCents: 170, cashCents: 0, alipayCents: 0, alipayPaidCents: null }) === '余额 ¥1.70（充值 1.70 / 返现 0.00）' && payCellText({ payMode: 'ALIPAY', topupCents: 0, cashCents: 0, alipayCents: 170, alipayPaidCents: null }) === '支付宝 ¥1.70', '余额付清 / 支付宝全额')
}

console.log('\n【号码页 DTO 的 S2b 增补字段（§6.4；白名单不出成本）】')
{
  const leak = {
    orderNo: '2026092912345678',
    orderId: 1,
    state: 'PENDING_PAY',
    version: 0,
    service: { code: 'tg', name: '电报' },
    country: { id: 6, name: '印度尼西亚', iso2: 'ID', dial: '62' },
    operator: null,
    priceCents: 170,
    pay: { mode: 'MIXED', balanceCents: 120, balanceTopupCents: 70, balanceCashCents: 50, alipayCents: 50, alipayPaidCents: null, holdState: 'HELD' },
    quoteExpiresAt: 'x',
    cashierUrl: '/pay/abc',
    cashierExpiresAt: 'y',
    createdAt: 'z',
    progress: { tries: 2, maxTries: 3, confirming: true, capMicro: 1 },
    number: null,
    replace: { used: 0, left: 5 },
    messages: [],
    history: [],
    refund: null,
    lateCredits: [],
    replaceBlocked: null,
    actions: { pay: true, close: true, replace: false, cancel: false, finish: false, start: false, refundReady: false, complain: false, message: true },
    notice: null,
    serverNow: 'x',
    pollMs: 3000,
    costMicro: 1,
  }
  const v = toJiemaOrderView(leak as unknown as JiemaOrderView)
  const names = collectKeyNames(JSON.parse(JSON.stringify(v)))
  ok(FORBIDDEN_BUYER_KEYS.every((k) => !names.has(k)), '增补字段（cashierExpiresAt、createdAt、progress）之后仍搜不到成本、cap、系数')
  ok(v.cashierExpiresAt === 'y' && v.createdAt === 'z' && JSON.stringify(v.progress) === '{"tries":2,"maxTries":3,"confirming":true}', '增补字段逐字段构造（progress 里夹带的键被丢掉）')
  ok(v.actions.message === true, '接码单任何状态都能留言（§6.6 第 29 条）')
}

console.log('\n【S2b 评审修复：后台认领恢复到哪（claimReopenTarget）——按冻结前状态与事实，不再只看尝试的 reason】')
{
  const base: ClaimReopenInput = {
    attempt: { id: 2, reason: 'REPLACE' },
    manual: { attemptId: 2, from: 'REPLACING', legacy: false },
    payStatus: 'PAID',
    refundReason: null,
    anyCode: false,
    cur: { id: 1, state: 'ACTIVE', smsCount: 0 },
    otherInflight: false,
    otherLive: true,
  }
  ok(claimReopenTarget(base) === 'REPLACING', '换号结果未知冻结（from=REPLACING）、旧号仍 ACTIVE 没收码 → 恢复 REPLACING（完成换号）')
  ok(claimReopenTarget({ ...base, manual: { attemptId: 2, from: 'RECEIVED', legacy: false }, anyCode: true, cur: { id: 1, state: 'RECEIVED', smsCount: 1 } }) === 'RECEIVED', '评审第 1 条：换号期间旧号收码（from=RECEIVED）→ 恢复 RECEIVED（afterClaim 放掉新号），不是 REPLACING')
  ok(claimReopenTarget({ ...base, anyCode: true, cur: { id: 1, state: 'RECEIVED', smsCount: 1 } }) === null, 'from=REPLACING 但冻结后旧号收了码 → 不恢复（留 MANUAL、新号放掉）')
  ok(claimReopenTarget({ ...base, manual: { attemptId: 2, from: 'CANCELLING', legacy: false }, refundReason: 'EXPIRED', cur: { id: 1, state: 'RELEASING', smsCount: 0 } }) === 'CANCELLING', '变体：换号未知期间旧号到期（from=CANCELLING、EXPIRED）→ 恢复 CANCELLING 继续退款，不给新号')
  ok(claimReopenTarget({ ...base, cur: { id: 1, state: 'CANCELLED', smsCount: 0 } }) === null, 'from=REPLACING 但旧号已结束 → 不恢复')
  ok(claimReopenTarget({ ...base, manual: { attemptId: 9, from: 'REPLACING', legacy: false } }) === null, '冻结的起因是别的尝试 → 不恢复')
  ok(claimReopenTarget({ ...base, manual: { attemptId: null, from: 'REFUNDING', legacy: false }, refundReason: 'EXPIRED' }) === null, '冻结的起因不是结果未知（退款核对不上之类，事件没有 attemptId）→ 不恢复')
  ok(claimReopenTarget({ ...base, otherInflight: true }) === null && claimReopenTarget({ ...base, payStatus: 'UNPAID' }) === null, '还有别的在途取号 / 订单没付款 → 不恢复')
  const first: ClaimReopenInput = { ...base, attempt: { id: 1, reason: 'FIRST' }, manual: { attemptId: 1, from: 'ACQUIRING', legacy: false }, cur: null, otherLive: false }
  ok(claimReopenTarget(first) === 'ACQUIRING', '首次取号结果未知（from=ACQUIRING）→ 恢复 ACQUIRING（T8 挂成当前号）')
  ok(claimReopenTarget({ ...first, otherLive: true }) === null && claimReopenTarget({ ...first, refundReason: 'ACQUIRE_FAILED' }) === null, '首次取号：已有别的活着的号 / 已有退款原因 → 不恢复')
  ok(claimReopenTarget({ ...base, manual: { attemptId: null, from: null, legacy: true } }) === 'REPLACING' && claimReopenTarget({ ...base, manual: null, anyCode: true }) === null, '旧事件（不知道 from）/ 没有事件：只按事实判 ACQUIRING / REPLACING，收过码 → 不恢复')
  eq(manualEventInfo({ attemptId: 5, detail: JSON.stringify({ why: 'x', from: 'REPLACING', attemptId: 5 }) }), { attemptId: 5, from: 'REPLACING', legacy: false }, 'MANUAL 事件解析：新事件带 from 与 attemptId')
  eq(manualEventInfo({ attemptId: null, detail: JSON.stringify({ why: 'x' }) }), { attemptId: null, from: null, legacy: true }, '旧事件（detail 里没有 from 键）→ legacy')
  eq(manualEventInfo({ attemptId: null, detail: JSON.stringify({ why: 'x', from: 'REFUNDING' }) }), { attemptId: null, from: 'REFUNDING', legacy: false }, '新事件、起因不是结果未知 → attemptId 为空、不是 legacy')
}

console.log('\n【S2b 评审修复：手动认领的硬闸门（价格 > eff(cap)、运营商不同 → 拒绝）】')
{
  ok(adminClaimReject({ operator: null, maxPriceMicro: 100_000 }, { operator: 'any', priceMicro: 300_000 }) === 'OVER_CAP', 'cap $0.10、候选 $0.30 → OVER_CAP（成本不能记到 cap 以上）')
  ok(adminClaimReject({ operator: null, maxPriceMicro: 5_000 }, { operator: 'any', priceMicro: 6_500 }) === null, 'cap $0.005 < $0.0067：实际上限 eff(cap)=6700，$0.0065 的候选合法')
  ok(adminClaimReject({ operator: null, maxPriceMicro: 5_000 }, { operator: 'any', priceMicro: 6_800 }) === 'OVER_CAP' && adminClaimReject({ operator: null, maxPriceMicro: 5_000 }, { operator: 'any', priceMicro: null }) === 'OVER_CAP', '超过 eff(cap) / 价格未知 → OVER_CAP')
  ok(adminClaimReject({ operator: 'tmobile', maxPriceMicro: 100_000 }, { operator: 'verizon', priceMicro: 90_000 }) === 'OPERATOR' && adminClaimReject({ operator: 'tmobile', maxPriceMicro: 100_000 }, { operator: null, priceMicro: 90_000 }) === 'OPERATOR', '指定了 tmobile：候选 verizon / 没给运营商 → OPERATOR')
  ok(adminClaimReject({ operator: 'tmobile', maxPriceMicro: 100_000 }, { operator: 'tmobile', priceMicro: 100_000 }) === null && adminClaimReject({ operator: null, maxPriceMicro: 100_000 }, { operator: 'verizon', priceMicro: 1 }) === null, '运营商一致 / 没指定运营商 → 可以认领')
  ok(!overEffCap(6_500, 5_000) && overEffCap(6_800, 5_000) && overEffCap(100_001, 100_000) && !overEffCap(null, 1), '候选标红按 eff(cap) 判（cap < 6700 时合法候选不再误标超上限）')
}

console.log('\n【S2b 评审修复：解除 MANUAL 的前提（unmanualBlock：结果未知的尝试、收款单、预扣）】')
{
  const A = (id: number, state: string, smsCount = 0) => ({ id, state, smsCount, codeAt: null })
  const pp = { target: 'PENDING_PAY', payStatus: 'UNPAID', deliveryStatus: 'PENDING', payMode: 'MIXED', holdState: 'HELD' as string | null, paidVmq: false, attempts: [] as ReturnType<typeof A>[], currentAttemptId: null as number | null }
  ok(unmanualBlock(pp) === null, '组合单：未付款未取消、预扣 HELD、没有到账收款单 → 可以回到 PENDING_PAY')
  ok(!!unmanualBlock({ ...pp, paidVmq: true })?.includes('关单并把到账退入余额'), 'E44：有 state=1 的收款单 → 拒绝回到 PENDING_PAY（钱到了却回待支付，之后没人推进）')
  ok(!!unmanualBlock({ ...pp, holdState: 'CAPTURED' })?.includes('预扣不是 HELD') && !!unmanualBlock({ ...pp, payMode: 'BALANCE', holdState: null })?.includes('预扣不是 HELD'), '余额付清 / 组合单的预扣不是 HELD → 拒绝')
  ok(unmanualBlock({ ...pp, payMode: 'ALIPAY', holdState: null }) === null, '纯支付宝单没有预扣 → 不看预扣')
  const w = { target: 'WAITING', payStatus: 'PAID', deliveryStatus: 'PROCESSING', payMode: 'BALANCE', holdState: 'CAPTURED' as string | null, paidVmq: true, attempts: [A(1, 'ACTIVE')], currentAttemptId: 1 as number | null }
  ok(unmanualBlock(w) === null && unmanualBlock({ ...w, target: 'REFUNDING' }) === null, '已付款、预扣 CAPTURED、当前号 ACTIVE 没收码 → 可以回到 WAITING / REFUNDING')
  ok(
    ['PENDING_PAY', 'ACQUIRING', 'WAITING', 'REFUNDING'].every((t) => unmanualBlock({ ...(t === 'PENDING_PAY' ? pp : w), target: t, attempts: [A(1, 'ACTIVE'), A(2, 'UNKNOWN')] }) === INFLIGHT_TEXT),
    '评审第 7 条：任何目标，只要还有 UNKNOWN / REQUESTING 尝试 → 拒绝（扫描器会再冻回去）',
  )
  ok(!!unmanualBlock({ ...w, holdState: 'HELD' })?.includes('预扣不是 CAPTURED'), '已付款的余额单预扣不是 CAPTURED → 拒绝（T15 只退 CAPTURED）')
  ok(!!unmanualBlock({ ...w, attempts: [A(1, 'ACTIVE', 1)] })?.includes('售后退款') && !!unmanualBlock({ ...w, target: 'ACQUIRING' })?.includes('活着的号'), '收过码 → 只能售后退款；回 ACQUIRING 时还有活着的号 → 拒绝')
}

console.log('\n【S2b 评审修复：确认面板付款方式（显示与提交同一个判定）、我的订单金额与卡片】')
{
  ok(effectivePayWith('BALANCE', 0, true) === 'ALIPAY', '选过余额、可用余额变成 0 → 提交也按支付宝（不再「显示支付宝、提交余额」）')
  ok(effectivePayWith('BALANCE', 120, false) === 'ALIPAY' && effectivePayWith(null, 120, true) === 'ALIPAY' && effectivePayWith('BALANCE', 120, true) === 'BALANCE', '余额支付关（含 503 BALANCE_PAY_OFF 之后）→ 支付宝；选了余额且有余额 → 余额')
  eq(
    jiemaAmountLines({ amount: 1.7, payable: 0, payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'BALANCE', holdCents: 170, holdState: 'HELD' } }),
    { main: 1.7, lines: ['余额已预扣 ¥1.70'] },
    '余额付清单停在待支付：大字是订单金额 ¥1.70（不是 ¥0.00），下面「余额已预扣 ¥1.70」',
  )
  eq(
    jiemaAmountLines({ amount: 1.7, payable: 0.5, payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'MIXED', holdCents: 120, holdState: 'HELD' } }),
    { main: 1.7, lines: ['余额已预扣 ¥1.20', '还需支付宝 ¥0.50'] },
    '组合单：订单金额 ¥1.70，「余额已预扣 ¥1.20」「还需支付宝 ¥0.50」分两行',
  )
  eq(jiemaAmountLines({ amount: 1.7, payable: 1.7, payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'MIXED', holdCents: 120, holdState: 'RELEASED' } }).lines, [], '预扣不是 HELD → 不写「余额已预扣」')
  const man = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'MANUAL', payMode: 'MIXED', holdCents: 120, holdState: 'CAPTURED' } })
  ok(man.label === '人工处理中' && !man.showGoPay, 'E44：未付款但接码单 MANUAL → 「人工处理中」，没有「去付款」')
  const manBal = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'MANUAL', payMode: 'BALANCE', holdCents: 170, holdState: 'HELD' } })
  ok(manBal.label === '人工处理中' && !manBal.showGoPay, '余额付清单 T19 失败转 MANUAL → 「人工处理中」')
  const mixRel = jiemaOrderCard({ payStatus: 'UNPAID', deliveryStatus: 'PENDING', jiema: { state: 'PENDING_PAY', payMode: 'MIXED', holdCents: 120, holdState: 'RELEASED' } })
  ok(mixRel.showGoPay && !mixRel.hint?.includes('已预扣'), '组合单预扣不是 HELD：提示不写「余额已预扣」')
  const ready = jiemaOrderCard({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', jiema: { state: 'READY', payMode: 'ALIPAY', holdCents: 0, holdState: null } })
  ok(ready.label === '已付款 · 待开始' && !!ready.hint?.includes('开始接码') && !ready.showGoPay, 'READY：「已付款 · 待开始」，提示去号码页点「开始接码」（不再写「正在接码」）')
  const paidMan = jiemaOrderCard({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', jiema: { state: 'MANUAL', payMode: 'ALIPAY', holdCents: 0, holdState: null } })
  ok(paidMan.label === '人工处理中' && paidMan.showInvoiceNotice, '已付款的 MANUAL 单仍是「人工处理中」、有开票提示')
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
if (fail) {
  console.log('有失败 ❌')
  process.exit(1)
}
console.log('全部通过 ✅')

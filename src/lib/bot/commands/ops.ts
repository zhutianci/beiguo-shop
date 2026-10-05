/**
 * 动钱 / 动库存类指令（docs/微信机器人-设计.md §7.2、§7.3、§8、§9）：提卡、补货、上架（T3），下架、补发（T2），改价（T3）。
 * 只在主站管理群（后台勾了「允许提卡补货」）与管理员私聊里用；锁定时全部拒绝（inbound 统一判）。
 * 业务都在 src/lib/bot/ops/**（事务、CAS、上限、审计、抄送），这里只解析参数、拼回复——指令层不直接查业务表（边界规则 B4）。
 * 业务性拒绝（超上限、库存不足、货号不对……）回复原因并把这条指令记成 REJECTED（BotReply.rejected），不算执行。
 */
import { notify } from '../../notify'
import { ProductStatusError, setProductStatus } from '../../product-status'
import { RefillError } from '../../order/refill'
import { linkOrigin } from '../config'
import { yuan } from '../render'
import { BotProductError, findAutoProductByCode } from '../ops/products'
import { IssueError, issueCards, renderIssueReceipt } from '../ops/issue'
import { createRestockLink, RestockError, RESTOCK_TTL_MS } from '../ops/restock'
import { RepriceError, repriceIssuedOrder } from '../ops/reprice'
import { looksLikeOrderNo, refillByOrderNo, refillByProduct, REFILL_BATCH_MAX } from '../ops/refill'
import { T3BusyError, withT3Lock } from '../ops/t3-lock'
import { parsePositiveInt, parsePrice, toHalfWidth } from './parse'
import type { BotCommandDef, BotContext, BotReply } from './types'

/** 已知的业务性拒绝 → 回复原因；其它异常交给 inbound（回「执行出错」并记 ERROR） */
function refusal(e: unknown, what: string): BotReply | null {
  if (e instanceof IssueError || e instanceof BotProductError || e instanceof T3BusyError || e instanceof RepriceError || e instanceof ProductStatusError || e instanceof RefillError || e instanceof RestockError) {
    return { text: `❌ ${what}没有执行：${e.message}`, summary: e.message.slice(0, 120), rejected: e.name.replace(/Error$/, '').toUpperCase().slice(0, 24) }
  }
  return null
}

function convOf(ctx: BotContext): { id: number; kind: 'MGMT' | 'DM'; name: string | null } {
  if (!ctx.conv.id || (ctx.conv.kind !== 'MGMT' && ctx.conv.kind !== 'DM')) throw new Error('提卡类指令只能在已登记的管理群或私聊里执行')
  return { id: ctx.conv.id, kind: ctx.conv.kind, name: ctx.conv.name }
}

const code = (s: string) => toHalfWidth(s).trim().toUpperCase()

// ---------------------------------------------------------------------------------------------
// 提卡 <货号> <单价> [数量]（§8）
// ---------------------------------------------------------------------------------------------

const ISSUE_USAGE = '用法：提卡 <货号> <单价> [数量]，例：提卡 GPT1 150、提卡 GPT1 150 3（单价是每张的价格）'

export const issueCmd: BotCommandDef<{ code: string; price: number; qty: number }> = {
  name: '提卡',
  aliases: ['发卡'],
  scopes: ['MGMT', 'DM'],
  tier: 3,
  auditAction: 'bot.card.issue',
  selfAudited: true,
  parse(args) {
    if (args.length < 2 || args.length > 3) return { ok: false, usage: ISSUE_USAGE }
    const price = parsePrice(args[1])
    if (price === null) return { ok: false, usage: `单价写法不对：${args[1]}。${ISSUE_USAGE}` }
    const qty = args.length === 3 ? parsePositiveInt(args[2], 50) : 1
    if (qty === null) return { ok: false, usage: `数量写法不对：${args[2]}。${ISSUE_USAGE}` }
    return { ok: true, value: { code: code(args[0]), price, qty } }
  },
  async run(ctx, a) {
    const conversation = convOf(ctx)
    try {
      const r = await issueCards({
        commandId: ctx.commandId,
        admin: { id: ctx.admin.id, name: ctx.admin.name, siteUserId: ctx.admin.siteUserId },
        conversation,
        code: a.code,
        unitPrice: a.price,
        quantity: a.qty,
        config: ctx.config,
      })
      return {
        text: renderIssueReceipt(r),
        sensitive: true,
        summary: `提卡 ${r.botCode} ×${r.quantity} ${yuan(r.amount)} 订单 ${r.orderNo}`,
        auditTarget: { type: 'order', id: r.orderNo },
      }
    } catch (e) {
      // 撞上每日上限这类：可能是有人在用管理员的微信，抄送企业微信（独立通道）
      if (e instanceof IssueError && e.alert) {
        notify('bot.sensitive', [
          { label: '操作', value: '机器人提卡被拦下' },
          { label: '原因', value: e.message },
          { label: '指令', value: `提卡 ${a.code} ${a.price} ${a.qty}` },
          { label: '操作人', value: ctx.admin.name },
          { label: '处理', value: '不是本人操作请立刻在群里发「@贝果助手 锁定」' },
        ], { link: '/admin/bot', linkText: '前往后台' })
      }
      const r = refusal(e, '提卡')
      if (r) return r
      throw e
    }
  },
  help: { summary: '提卡：建一张提卡订单、发卡，回执里给核销链接（只回本群）', usage: '提卡 <货号> <单价> [数量]', example: '提卡 GPT1 150' },
}

// ---------------------------------------------------------------------------------------------
// 补货 [货号]（§9）：开一个 5 分钟、提交成功后作废的一次性网页
// ---------------------------------------------------------------------------------------------

export const restockCmd: BotCommandDef<{ code: string | null }> = {
  name: '补货',
  aliases: ['导卡'],
  scopes: ['MGMT', 'DM'],
  tier: 3,
  auditAction: 'bot.card.restock_link',
  parse(args) {
    if (args.length > 1) return { ok: false, usage: '用法：补货 [货号]，例：补货 GPT1' }
    return { ok: true, value: { code: args[0] ? code(args[0]) : null } }
  },
  async run(ctx, a) {
    const conversation = convOf(ctx)
    try {
      const out = await withT3Lock(async () => {
        const product = a.code ? await findAutoProductByCode(a.code) : null
        const link = await createRestockLink({
          commandId: ctx.commandId,
          adminId: ctx.admin.id,
          conversationId: conversation.id,
          productId: product?.id ?? null,
          origin: linkOrigin(ctx.config),
          now: ctx.now,
        })
        return { product, link }
      })
      const minutes = Math.round(RESTOCK_TTL_MS / 60_000)
      return {
        text:
          `📦 补货链接（${minutes} 分钟内有效，提交成功后作废）：\n${out.link.url}` +
          (out.product ? `\n已预选：${out.product.name}（${out.product.botCode}）` : '') +
          '\n只发给本群；别转发给别人。',
        sensitive: true,
        summary: out.product ? `补货链接 ${out.product.botCode}` : '补货链接',
        auditTarget: { type: 'bot_action_token', id: 'RESTOCK' },
        auditDiff: { productId: out.product?.id ?? null, expiresAt: out.link.expiresAt.toISOString() },
      }
    } catch (e) {
      const r = refusal(e, '补货')
      if (r) return r
      throw e
    }
  },
  help: { summary: `开一个一次性补货网页（${Math.round(RESTOCK_TTL_MS / 60_000)} 分钟内有效，提交成功后作废）`, usage: '补货 [货号]', example: '补货 GPT1' },
}

// ---------------------------------------------------------------------------------------------
// 上架（T3）/ 下架（T2）<货号>：与后台商品保存同一个服务函数（lib/product-status.ts）
// ---------------------------------------------------------------------------------------------

function statusCmd(name: '上架' | '下架'): BotCommandDef<{ code: string }> {
  const on = name === '上架'
  return {
    name,
    scopes: ['MGMT', 'DM'],
    tier: on ? 3 : 2,
    auditAction: on ? 'bot.product.list' : 'bot.product.delist',
    parse(args) {
      if (args.length !== 1) return { ok: false, usage: `用法：${name} <货号>，例：${name} GPT1` }
      return { ok: true, value: { code: code(args[0]) } }
    },
    async run(ctx, a) {
      try {
        const doIt = async () => {
          const p = await findAutoProductByCode(a.code)
          return { p, r: await setProductStatus(p.id, on ? 1 : 0) }
        }
        // 上架是 T3（会开始卖），与提卡同一把锁；下架是「往安全方向」的 T2，不排队
        const { p, r } = on ? await withT3Lock(doIt) : await doIt()
        if (!r.changed) return { text: `「${p.name}」（${p.botCode}）本来就是${on ? '上架' : '下架'}状态`, summary: 'unchanged' }
        if (on) {
          notify('bot.sensitive', [
            { label: '操作', value: '机器人上架商品' },
            { label: '商品', value: `${p.name}（${p.botCode}）` },
            { label: '操作人', value: ctx.admin.name },
          ], { link: '/admin/products', linkText: '前往后台' })
        }
        return {
          text: on
            ? `✅ 已上架｜${p.name}（${p.botCode}），当前库存 ${r.stock} 张`
            : `⛔ 已下架｜${p.name}（${p.botCode}）。已授权这个商品的分站会收到「停止供货」通知`,
          summary: `${name} ${p.botCode}`,
          auditTarget: { type: 'product', id: String(p.id) },
          auditDiff: { productId: p.id, botCode: p.botCode, from: r.before, to: r.status },
        }
      } catch (e) {
        const r = refusal(e, name)
        if (r) return r
        throw e
      }
    },
    help: on
      ? { summary: '上架一个自动发货商品（与后台保存同一个流程）', usage: '上架 <货号>', example: '上架 GPT1' }
      : { summary: '下架一个自动发货商品；已授权的分站会收到停止供货通知', usage: '下架 <货号>', example: '下架 GPT1' },
  }
}

export const onShelfCmd = statusCmd('上架')
export const offShelfCmd = statusCmd('下架')

// ---------------------------------------------------------------------------------------------
// 补发 <订单号 / 货号>（T2）：与后台「补发」按钮同一个函数（幂等补缺口）
// ---------------------------------------------------------------------------------------------

export const refillCmd: BotCommandDef<{ arg: string }> = {
  name: '补发',
  scopes: ['MGMT', 'DM'],
  tier: 2,
  auditAction: 'bot.order.refill',
  parse(args) {
    if (args.length !== 1) return { ok: false, usage: '用法：补发 <订单号> 或 补发 <货号>（补这个商品全部付了款在等卡的单）' }
    return { ok: true, value: { arg: code(args[0]) } }
  },
  async run(ctx, a) {
    try {
      if (looksLikeOrderNo(a.arg)) {
        const r = await refillByOrderNo(a.arg, ctx.admin.siteUserId)
        return {
          text: `${r.owned >= r.due ? '✅' : '⚠️'} 补发｜订单 ${r.orderNo}：${r.message}`,
          summary: `补发 ${r.orderNo} +${r.added}`,
          auditTarget: { type: 'order', id: r.orderNo },
          auditDiff: { added: r.added, owned: r.owned, due: r.due },
        }
      }
      const p = await findAutoProductByCode(a.arg)
      const r = await refillByProduct(p.id, ctx.admin.siteUserId)
      if (!r.waiting) return { text: `「${p.name}」（${p.botCode}）没有付了款在等卡的单`, summary: 'nothing' }
      const lines = [`📦 补发｜${p.name}（${p.botCode}）：等卡的单 ${r.waiting} 张，本次处理 ${r.tried} 张，补齐 ${r.completed} 张，共发出 ${r.added} 张卡`]
      if (r.stillShort.length) lines.push(`库存不够：订单 ${r.stillShort[0].orderNo} 还缺 ${r.stillShort[0].short} 张，先「补货 ${p.botCode}」再补发`)
      if (r.waiting > r.tried && !r.stillShort.length) lines.push(`一次最多处理 ${REFILL_BATCH_MAX} 张，剩下的再发一次「补发 ${p.botCode}」`)
      for (const e of r.errors.slice(0, 3)) lines.push(`订单 ${e.orderNo}：${e.error}`)
      return {
        text: lines.join('\n'),
        summary: `补发 ${p.botCode} ${r.completed}/${r.tried}`,
        auditTarget: { type: 'product', id: String(p.id) },
        auditDiff: { waiting: r.waiting, tried: r.tried, completed: r.completed, added: r.added },
      }
    } catch (e) {
      const r = refusal(e, '补发')
      if (r) return r
      throw e
    }
  },
  help: { summary: '补发卡密：给订单号补这一单，给货号补该商品全部付了款在等卡的单', usage: '补发 <订单号 / 货号>', example: '补发 GPT1' },
}

// ---------------------------------------------------------------------------------------------
// 改价 <订单号> <单价>（T3，§8.9）：只限 7 天内的提卡单
// ---------------------------------------------------------------------------------------------

export const repriceCmd: BotCommandDef<{ orderNo: string; price: number }> = {
  name: '改价',
  scopes: ['MGMT', 'DM'],
  tier: 3,
  auditAction: 'bot.order.reprice',
  selfAudited: true,
  parse(args) {
    const usage = '用法：改价 <订单号> <单价>，只限 7 天内机器人提的卡，例：改价 20261005K3F9Q2AB 158'
    if (args.length !== 2) return { ok: false, usage }
    const price = parsePrice(args[1])
    if (price === null) return { ok: false, usage: `单价写法不对：${args[1]}。${usage}` }
    return { ok: true, value: { orderNo: code(args[0]), price } }
  },
  async run(ctx, a) {
    const conversation = convOf(ctx)
    try {
      const r = await repriceIssuedOrder({
        commandId: ctx.commandId,
        admin: { id: ctx.admin.id, name: ctx.admin.name, siteUserId: ctx.admin.siteUserId },
        conversationId: conversation.id,
        orderNo: a.orderNo,
        unitPrice: a.price,
        config: ctx.config,
      })
      return {
        text:
          `✅ 已改价｜订单 ${r.orderNo}（${r.productName} ×${r.quantity}）：${yuan(r.fromAmount)} → ${yuan(r.toAmount)}` +
          (r.profit !== null ? ` · 利润 ${yuan(r.profit)}` : ''),
        summary: `改价 ${r.orderNo} ${r.fromAmount}→${r.toAmount}`,
        auditTarget: { type: 'order', id: r.orderNo },
      }
    } catch (e) {
      const r = refusal(e, '改价')
      if (r) return r
      throw e
    }
  },
  help: { summary: '改提卡单的价格（只限 7 天内机器人提的卡）', usage: '改价 <订单号> <单价>', example: '改价 20261005K3F9Q2AB 158' },
}

export const OPS_COMMANDS: readonly BotCommandDef<any>[] = [issueCmd, restockCmd, onShelfCmd, offShelfCmd, refillCmd, repriceCmd]

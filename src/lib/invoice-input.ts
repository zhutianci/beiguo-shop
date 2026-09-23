import { z } from 'zod'
import { prisma } from './db'
import { normalizeTaxNumber, TAX_NUMBER_MAX_LEN } from './invoice'
import { BillingError, type BuyerInvoiceFields } from './order-billing'

/**
 * 开票抬头的输入层：校验 → 归一化 → 落成 BuyerInvoiceFields。
 *
 * 【为什么单独一个文件】三个入口用同一套字段（下单时勾选开票、订单页补开、邮箱查单补开），
 * 再加后台手动录入和抬头档案的增删改，一共六处。校验规则散在六个 route.ts 里
 * 迟早漂移，而「税号去空格」这种事漏掉一处就等于没做。
 *
 * 【为什么不放在 route.ts 里】Next 的 route.ts 只允许导出 HTTP handler 和少数配置项，
 * 多导出一个 schema 会让 next build 报「不是合法的 Route export」（见交接文档第六节）。
 */

/** 抬头字段的公共形状（不含 externalOrderId / accountEmail 这类路径相关的东西） */
export const invoiceFieldsSchema = z.object({
  title: z.string().trim().min(1, '抬头必填').max(200),
  taxNumber: z.string().trim().min(1, '税号必填').max(64),
  address: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(128).optional().nullable(),
  bankAccount: z.string().trim().max(64).optional().nullable(),
  email: z.string().email('接收邮箱格式不正确'),
  // 必选：发票内容是否展示 ChatGPT/Claude 等字眼。
  // 用 boolean 而非 optional，缺失时 zod 会直接报「请选择…」，不允许静默默认。
  showAiWording: z.boolean({ required_error: '请选择发票中是否展示 ChatGPT/Claude 相关字眼' }),
})

/**
 * 买家提交开票时的完整入参：要么给一个已保存抬头的 id，要么把字段手填齐。
 *
 * 【titleId 与手填字段并存是有意的】选中一条已保存抬头后，买家仍可能临时改接收邮箱
 * 或改「是否展示字眼」。前端把选中的抬头铺进表单再整体提交，服务端以手填字段为准，
 * titleId 只用来记一次 lastUsedAt。这样前后端对「最终开成什么样」只有一个事实来源。
 */
export const buyerInvoiceSubmitSchema = invoiceFieldsSchema.extend({
  /** 本次使用的已保存抬头 id（仅用于刷新使用时间；归属会校验） */
  titleId: z.number().int().positive().optional().nullable(),
  /** 是否把这次填的抬头存进个人中心，供下次一键带入 */
  saveTitle: z.boolean().optional().default(false),
})

/** 单个用户最多保存多少条抬头。防的是脚本灌库，正常人用不到 5 条 */
export const INVOICE_TITLE_LIMIT = 30

/**
 * 校验并归一化税号。返回去掉全部空白后的值。
 *
 * 长度上限是税局模板定的 20 位（统一社会信用代码 18 位、老纳税人识别号最长 20 位）。
 * 在**归一化之后**判长度 —— 「9111 0108 MAER 0M7A 3L」原文 22 个字符、去空格后 18 位，
 * 是合法的，先判长度会把它错杀。
 */
export function assertTaxNumber(raw: string): string {
  const v = normalizeTaxNumber(raw)
  if (!v) throw new BillingError('税号必填')
  if (v.length > TAX_NUMBER_MAX_LEN) {
    throw new BillingError(
      `税号去掉空格后为 ${v.length} 位，超过税务系统允许的 ${TAX_NUMBER_MAX_LEN} 位，请检查是否填错`
    )
  }
  return v
}

type RawInvoiceFields = z.infer<typeof invoiceFieldsSchema>

/** 把校验过的入参整理成服务层要的形状：税号去空格、可选项空串归 null、邮箱小写 */
export function normalizeInvoiceFields(d: RawInvoiceFields): BuyerInvoiceFields {
  return {
    title: d.title.trim(),
    taxNumber: assertTaxNumber(d.taxNumber),
    address: d.address?.trim() || null,
    phone: d.phone?.trim() || null,
    bankName: d.bankName?.trim() || null,
    bankAccount: d.bankAccount?.trim() || null,
    email: d.email.trim().toLowerCase(),
    showAiWording: d.showAiWording,
  }
}

/**
 * 抬头档案的写入（新建或就地更新）。
 *
 * 去重口径：同一用户下 **归一化税号 + 抬头** 完全相同就算同一条，更新而不是再插一条。
 * 刻意没在数据库上加唯一约束：线上是生产库，一个 P2002 会把「提交发票」整条链路打断，
 * 而这里最坏的结果只是多一条重复抬头，买家自己能删。
 */
export async function saveInvoiceTitle(userId: number, f: BuyerInvoiceFields): Promise<void> {
  const data = {
    title: f.title,
    taxNumber: f.taxNumber,
    address: f.address,
    phone: f.phone,
    bankName: f.bankName,
    bankAccount: f.bankAccount,
    email: f.email,
  }

  const existing = await prisma.invoiceTitle.findFirst({
    where: { userId, taxNumber: f.taxNumber, title: f.title },
    select: { id: true },
  })
  if (existing) {
    await prisma.invoiceTitle.update({
      where: { id: existing.id },
      data: { ...data, lastUsedAt: new Date() },
    })
    return
  }

  const count = await prisma.invoiceTitle.count({ where: { userId } })
  if (count >= INVOICE_TITLE_LIMIT) {
    throw new BillingError(`最多保存 ${INVOICE_TITLE_LIMIT} 条抬头，请先到个人中心删掉不用的`)
  }
  await prisma.invoiceTitle.create({
    data: {
      userId,
      ...data,
      // 第一条自动设为默认，省掉买家再点一次
      isDefault: count === 0,
      lastUsedAt: new Date(),
    },
  })
}

/**
 * 记一次抬头的使用时间。归属对不上就什么都不做 —— 这不是安全边界
 * （真正的开票内容以手填字段为准），只是列表排序用的辅助信息，没必要为它报错。
 */
export async function touchInvoiceTitle(userId: number, titleId: number | null | undefined) {
  if (!titleId) return
  await prisma.invoiceTitle
    .updateMany({ where: { id: titleId, userId }, data: { lastUsedAt: new Date() } })
    .catch(() => {})
}

/**
 * 提交开票后的抬头档案副作用：记使用时间 + 按需保存。
 * 失败一律吞掉并记日志 —— 发票已经提交成功了，抬头没存上不该让买家看到一个红色报错。
 */
export async function afterInvoiceSubmitted(
  userId: number | null | undefined,
  opts: { titleId?: number | null; saveTitle?: boolean },
  fields: BuyerInvoiceFields
) {
  if (!userId) return
  try {
    await touchInvoiceTitle(userId, opts.titleId)
    if (opts.saveTitle) await saveInvoiceTitle(userId, fields)
  } catch (e) {
    console.error('[invoice-title] 保存抬头失败（不影响发票）', e)
  }
}

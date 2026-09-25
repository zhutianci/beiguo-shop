/**
 * 后台接口用的活动 / 模板读写（草稿的增删改、复制、另存模板、模板列表），以及路由共用的小工具。
 *
 * 路由保持「校验 + 鉴权 + 调这里」三步；需要 CAS、冲突检测、规范化的逻辑都收在这里，便于测试。
 * 状态机里「草稿之后」的一切（检查、发送、暂停、取消…）不在这里 —— 那是 lifecycle.ts 的事。
 *
 * 【doc 永远以 zod 规范形态落库】contentHash 是 sha256(JSON.stringify(doc))，键的顺序会影响结果。
 * 这里写库的 doc 一律先过 emailDocSchema（输出键序固定为 schema 声明顺序、URL 已 trim），
 * 于是「JSON.parse(库里的字符串)」与「zod 再解析一遍」得到的是同一个对象、同一个指纹 ——
 * 测试发送写的 testedHash、检查接口算的 contentHash、launch 时冻结的 contentHash 才对得上。
 */
import { NextResponse } from 'next/server'
import type { MarketingCampaign, MarketingTemplate } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  CAMPAIGN_STATUSES,
  DEFAULT_AUDIENCE,
  MAX_DOC_JSON_BYTES,
  TOPICS,
  audienceSpecSchema,
  clip,
  emailDocSchema,
  type AudienceSpec,
  type AuditAction,
  type CampaignDetail,
  type CampaignStatus,
  type EmailDoc,
  type TemplateItem,
  type Topic,
} from './types'
import { contentHash } from './hash'
import { normalizeDoc } from './richtext'
import { PRESETS, getPreset } from './presets'
import { DEFAULT_SETTINGS } from './render'
import { audit } from './audit'
import { bjDateKey } from './time'
import { LifecycleError } from './lifecycle'

/* ============================== 错误与响应 ============================== */

/** 带 HTTP 状态码的业务错误（路由 catch 后原样回给前端） */
export class MarketingHttpError extends Error {
  status: number
  payload?: unknown
  constructor(message: string, status = 400, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

/**
 * 把已知的业务错误转成响应；不认识的返回 null（调用方记日志并回通用失败）。
 * LifecycleError 的 payload（如 409 时的新可发人数 / 新指纹、400 时的 issues）放进 data 原样透传。
 */
export function knownErrorResponse(e: unknown): NextResponse | null {
  if (e instanceof LifecycleError || e instanceof MarketingHttpError) {
    const body: Record<string, unknown> = { success: false, error: e.message }
    if (e.payload !== undefined) body.data = e.payload
    return NextResponse.json(body, { status: e.status })
  }
  return null
}

/** 409：草稿已被别处改过（或已不是草稿），附服务器上的最新版本，编辑器据此让管理员选「用服务器的 / 用我的」 */
export function conflictResponse(message: string, server: CampaignDetail): NextResponse {
  return NextResponse.json({ success: false, error: message, data: { server } }, { status: 409 })
}

/* ============================== 路由共用的小工具 ============================== */

/** 路径里的 id：只认 1–9 位正整数，其余一律当作不存在 */
export function parseId(raw: string | undefined | null): number | null {
  if (!raw || !/^\d{1,9}$/.test(raw)) return null
  const n = Number(raw)
  return n > 0 ? n : null
}

export function parsePaging(sp: URLSearchParams, defaultSize = 20, maxSize = 100): { page: number; pageSize: number } {
  const page = Math.min(Math.max(parseInt(sp.get('page') || '1') || 1, 1), 100000)
  const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || String(defaultSize)) || defaultSize, 1), maxSize)
  return { page, pageSize }
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(Math.ceil(total / pageSize), 1)
}

/**
 * 读 JSON 请求体，带体积上限。
 *
 * 【为什么不直接 request.json()】它会把任意大小的请求体读进内存再解析；编辑器的文档上限是 200KB，
 * 超出的请求没有任何正当来源。先看 Content-Length，再按实际字节数复核（分块传输时没有这个头）。
 * 空体按 {} 处理，交给 zod 给出具体的「缺什么」。
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number
): Promise<{ ok: true; body: unknown } | { ok: false; status: number; message: string }> {
  const declared = Number(request.headers.get('content-length') || '')
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413, message: '请求内容过大' }
  let text: string
  try {
    text = await request.text()
  } catch {
    return { ok: false, status: 400, message: '请求体读取失败' }
  }
  if (Buffer.byteLength(text, 'utf8') > maxBytes) return { ok: false, status: 413, message: '请求内容过大' }
  if (!text.trim()) return { ok: true, body: {} }
  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, status: 400, message: '请求体不是合法的 JSON' }
  }
}

/**
 * 审计的保险丝：audit() 契约上不抛错，但它写失败绝不能把已经成功的业务操作变成「失败」回给前端
 * （前端会以为没做成而重试 —— 对「退订」「解除抑制」这类动作，重试本身无害，但提示是错的）。
 */
export async function auditSafe(
  action: AuditAction,
  opts: { actorId?: number | null; campaignId?: number | null; detail?: string | Record<string, unknown> | null }
): Promise<void> {
  try {
    await audit(action, opts)
  } catch (e) {
    console.error(`[marketing] 审计写入失败 action=${action} campaign=${opts.campaignId ?? '-'}:`, (e as Error)?.message || e)
  }
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

/* ============================== 文档 / 受众的解析与规范化 ============================== */

function asTopic(v: string | null | undefined): Topic {
  return (TOPICS as readonly string[]).includes(v || '') ? (v as Topic) : 'PROMO'
}

function asStatus(v: string): CampaignStatus {
  return (CAMPAIGN_STATUSES as readonly string[]).includes(v) ? (v as CampaignStatus) : 'DRAFT'
}

/**
 * 空白文档的兜底：内置「空白」模板缺失时用（presets.ts 是另一个模块，不能假设它永远在）。
 * 只有一段带尊称的正文 —— 阿里云规则要求有尊称，lint 缺尊称是错误。
 */
export function fallbackBlankDoc(): EmailDoc {
  return emailDocSchema.parse({
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    blocks: [
      {
        id: 'bhello01',
        type: 'text',
        align: 'left',
        size: 16,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '{{nickname|朋友}}，你好：' }] }],
        },
      },
    ],
  })
}

/**
 * 外来的 doc（编辑器保存、模板、内置模板）→ 规范化 + 严格校验 + 体积上限。
 * 最后再过一遍 emailDocSchema，保证落库的是 zod 规范形态（见文件头：指纹要稳定）。
 */
export function canonicalDoc(input: unknown): { ok: true; doc: EmailDoc; json: string } | { ok: false; error: string } {
  const n = normalizeDoc(input)
  if (!n.ok) return { ok: false, error: n.error || '邮件内容格式不正确' }
  const strict = emailDocSchema.safeParse(n.doc)
  if (!strict.success) return { ok: false, error: strict.error.errors[0]?.message || '邮件内容格式不正确' }
  const json = JSON.stringify(strict.data)
  if (Buffer.byteLength(json, 'utf8') > MAX_DOC_JSON_BYTES) {
    return { ok: false, error: `邮件内容太大（超过 ${Math.round(MAX_DOC_JSON_BYTES / 1024)}KB），请删减一些区块或文字` }
  }
  return { ok: true, doc: strict.data, json }
}

/**
 * 库里的 doc 字符串 → EmailDoc。库里的只可能是 canonicalDoc 写进去的，正常情况第一步就成功；
 * 解析不了时退回空白文档展示并记日志（只记活动 id，不记内容）。ok=false 时调用方不应把它当真内容去发送。
 */
export function parseStoredDoc(raw: string, ownerTag: string): { ok: boolean; doc: EmailDoc } {
  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = null
  }
  const strict = emailDocSchema.safeParse(parsed)
  if (strict.success) return { ok: true, doc: strict.data }
  try {
    const n = normalizeDoc(parsed)
    if (n.ok) {
      const again = emailDocSchema.safeParse(n.doc)
      if (again.success) return { ok: true, doc: again.data }
    }
  } catch {
    /* 落到下面的兜底 */
  }
  console.error(`[marketing] ${ownerTag} 的 doc 无法解析，暂以空白文档展示`)
  return { ok: false, doc: fallbackBlankDoc() }
}

export function parseStoredAudience(raw: string, ownerTag: string): AudienceSpec {
  try {
    const p = audienceSpecSchema.safeParse(JSON.parse(raw))
    if (p.success) return p.data
  } catch {
    /* 落到下面的兜底 */
  }
  console.error(`[marketing] ${ownerTag} 的受众设置无法解析，暂以默认受众展示`)
  return DEFAULT_AUDIENCE
}

/** 受众入库前的整理：手工名单去重（保持粘贴顺序） */
export function canonicalAudience(a: AudienceSpec): AudienceSpec {
  if (a.type === 'USERS') {
    const seen = new Set<number>()
    const ids: number[] = []
    for (const id of a.userIds) {
      if (!seen.has(id)) {
        seen.add(id)
        ids.push(id)
      }
    }
    return { type: 'USERS', userIds: ids }
  }
  return a
}

/** 主题里不允许换行 / 制表符（邮件头注入与显示错乱），其余原样保留（不 trim：编辑器正在输入时不要吃掉尾部空格） */
export function cleanSubjectLine(s: string): string {
  return s.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ')
}

/* ============================== 活动详情 ============================== */

export function toCampaignDetail(row: MarketingCampaign): CampaignDetail {
  const tag = `活动 #${row.id}`
  const { doc } = parseStoredDoc(row.doc, tag)
  const audience = parseStoredAudience(row.audience, tag)
  // 指纹按库里的原始 topic / preheader 算（与 lifecycle / test-send 同一口径），不按展示用的兜底值
  const hash = contentHash({ topic: row.topic, subject: row.subject, preheader: row.preheader, doc })
  return {
    id: row.id,
    name: row.name,
    topic: asTopic(row.topic),
    status: asStatus(row.status),
    statusNote: row.statusNote,
    subject: row.subject,
    preheader: row.preheader ?? '',
    doc,
    audience,
    scheduledAt: iso(row.scheduledAt),
    materializedAt: iso(row.materializedAt),
    startedAt: iso(row.startedAt),
    completedAt: iso(row.completedAt),
    testedAt: iso(row.testedAt),
    testedCurrent: !!row.testedHash && row.testedHash === hash,
    contentHash: hash,
    couponId: row.couponId,
    recipientCount: row.recipientCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function loadCampaignDetail(id: number): Promise<CampaignDetail | null> {
  const row = await prisma.marketingCampaign.findUnique({ where: { id } })
  return row ? toCampaignDetail(row) : null
}

/** 默认活动名：「未命名活动 9月25日」（北京日期，不依赖进程 TZ） */
export function defaultCampaignName(now: Date = new Date()): string {
  const [, m, d] = bjDateKey(now).split('-')
  return `未命名活动 ${Number(m)}月${Number(d)}日`
}

/* ============================== 新建 / 复制 ============================== */

export interface CreateDraftInput {
  name?: string
  /** 内置模板 key；也接受模板列表里的 'preset:<key>' / 'tpl:<id>' 形式 */
  preset?: string
  templateId?: number
  fromCampaignId?: number
  audience?: AudienceSpec
}

interface DraftContent {
  topic: Topic
  subject: string
  preheader: string | null
  doc: EmailDoc
  docJson: string
}

function contentFrom(raw: { topic: string; subject: string | null; preheader: string | null; doc: unknown }, what: string): DraftContent {
  const c = canonicalDoc(raw.doc)
  if (!c.ok) throw new MarketingHttpError(`${what}的内容无法使用：${c.error}`, 400)
  return {
    topic: asTopic(raw.topic),
    subject: clip(cleanSubjectLine(raw.subject || ''), 200) || '',
    preheader: clip(raw.preheader || '', 200) || null,
    doc: c.doc,
    docJson: c.json,
  }
}

/**
 * 新建草稿。内容来源优先级：fromCampaignId（复制任意状态的活动，含受众）> templateId > preset > 内置「空白」。
 * name 缺省：复制时「<原名> 副本」，其余「未命名活动 9月25日」。
 */
export async function createDraft(input: CreateDraftInput, actorId: number): Promise<CampaignDetail> {
  let content: DraftContent
  let audience: AudienceSpec = input.audience ? canonicalAudience(input.audience) : DEFAULT_AUDIENCE
  let name = input.name?.trim() ? input.name.trim() : defaultCampaignName()
  let source: string

  // preset 字段也接受模板列表里的 key（前端直接把 TemplateItem.key 传过来最省事）
  let presetKey = (input.preset || '').trim()
  let templateId = input.templateId
  if (presetKey.startsWith('tpl:') && !templateId) {
    const n = parseId(presetKey.slice(4))
    if (!n) throw new MarketingHttpError('模板不存在', 404)
    templateId = n
    presetKey = ''
  } else if (presetKey.startsWith('preset:')) {
    presetKey = presetKey.slice(7)
  }

  if (input.fromCampaignId) {
    const src = await prisma.marketingCampaign.findUnique({ where: { id: input.fromCampaignId } })
    if (!src) throw new MarketingHttpError('要复制的活动不存在', 404)
    const parsed = parseStoredDoc(src.doc, `活动 #${src.id}`)
    if (!parsed.ok) throw new MarketingHttpError('要复制的活动内容已损坏，无法复制', 400)
    content = contentFrom({ topic: src.topic, subject: src.subject, preheader: src.preheader, doc: parsed.doc }, '原活动')
    if (!input.audience) audience = canonicalAudience(parseStoredAudience(src.audience, `活动 #${src.id}`))
    if (!input.name?.trim()) name = `${src.name} 副本`
    source = `campaign:${src.id}`
  } else if (templateId) {
    const tpl = await prisma.marketingTemplate.findUnique({ where: { id: templateId } })
    if (!tpl) throw new MarketingHttpError('模板不存在', 404)
    const parsed = parseStoredDoc(tpl.doc, `模板 #${tpl.id}`)
    if (!parsed.ok) throw new MarketingHttpError('模板内容已损坏，无法使用', 400)
    content = contentFrom({ topic: tpl.topic, subject: tpl.subject, preheader: tpl.preheader, doc: parsed.doc }, '模板')
    source = `tpl:${tpl.id}`
  } else {
    const key = presetKey || 'blank'
    const p = getPreset(key)
    if (p) {
      content = contentFrom({ topic: p.topic, subject: p.subject, preheader: p.preheader, doc: p.doc }, '内置模板')
      // 模板自带默认受众（如老客召回：文案写着「上次下单」，只能发给买过的人），请求没指定受众时用它（审查 C13）
      if (!input.audience && p.audience) {
        const parsedAudience = audienceSpecSchema.safeParse(p.audience)
        if (parsedAudience.success) audience = canonicalAudience(parsedAudience.data)
      }
    } else if (key === 'blank') {
      // 内置模板表还没有「空白」（或被改名）时不应该让「新建」按钮失灵
      const doc = fallbackBlankDoc()
      content = { topic: 'PROMO', subject: '', preheader: null, doc, docJson: JSON.stringify(doc) }
    } else {
      throw new MarketingHttpError('模板不存在', 404)
    }
    source = `preset:${key}`
  }

  const row = await prisma.marketingCampaign.create({
    data: {
      name: clip(name, 100) || defaultCampaignName(),
      topic: content.topic,
      subject: content.subject,
      preheader: content.preheader,
      doc: content.docJson,
      audience: JSON.stringify(audience),
      status: 'DRAFT',
      createdBy: actorId,
    },
  })
  await auditSafe(input.fromCampaignId ? 'DUPLICATE' : 'CREATE', {
    actorId,
    campaignId: row.id,
    detail: { source },
  })
  return toCampaignDetail(row)
}

/* ============================== 保存草稿（CAS） ============================== */

export interface UpdateDraftInput {
  baseUpdatedAt: string
  name?: string
  topic?: Topic
  subject?: string
  preheader?: string
  /** 未规范化的 doc（编辑器原样传来）；这里负责 normalizeDoc */
  doc?: unknown
  audience?: AudienceSpec
}

export type UpdateDraftResult =
  | { kind: 'ok'; detail: CampaignDetail }
  | { kind: 'not_found' }
  | { kind: 'not_draft'; detail: CampaignDetail }
  | { kind: 'conflict'; detail: CampaignDetail }
  | { kind: 'invalid'; message: string }

// 自动保存每 1.5 秒一次，逐次写审计会把时间线淹没；同一活动同一操作人 10 分钟内只记一条 UPDATE
const UPDATE_AUDIT_EVERY_MS = 10 * 60 * 1000
const lastUpdateAudit = new Map<string, number>()
function shouldAuditUpdate(campaignId: number, actorId: number, now: number): boolean {
  const key = `${campaignId}:${actorId}`
  const last = lastUpdateAudit.get(key) || 0
  if (now - last < UPDATE_AUDIT_EVERY_MS) return false
  lastUpdateAudit.set(key, now)
  if (lastUpdateAudit.size > 2000) {
    const stale: string[] = []
    lastUpdateAudit.forEach((t, k) => {
      if (now - t >= UPDATE_AUDIT_EVERY_MS) stale.push(k)
    })
    stale.forEach((k) => lastUpdateAudit.delete(k))
  }
  return true
}

/**
 * 保存草稿：只认 DRAFT；baseUpdatedAt 必须等于库里的 updatedAt（乐观锁）。
 *
 * 【为什么检查完还要带条件写】两个标签页同时保存时，「先读后比」两边都会通过；
 * 写的时候带上 {status:'DRAFT', updatedAt: 读到的值} 做 CAS，输的那一方 count=0 → 409。
 * updatedAt 由应用显式写入并保证严格递增：同一毫秒内的两次保存如果拿到相同的 updatedAt，
 * 另一个标签页手里的 baseUpdatedAt 就还「对得上」，冲突会被悄悄吞掉。
 */
export async function updateDraft(id: number, input: UpdateDraftInput, actorId: number): Promise<UpdateDraftResult> {
  const cur = await prisma.marketingCampaign.findUnique({ where: { id } })
  if (!cur) return { kind: 'not_found' }
  if (cur.status !== 'DRAFT') return { kind: 'not_draft', detail: toCampaignDetail(cur) }
  if (input.baseUpdatedAt !== cur.updatedAt.toISOString()) return { kind: 'conflict', detail: toCampaignDetail(cur) }

  const data: {
    name?: string
    topic?: string
    subject?: string
    preheader?: string | null
    doc?: string
    audience?: string
  } = {}
  const changed: string[] = []

  if (input.name !== undefined) {
    const v = clip(input.name, 100) || ''
    if (!v.trim()) return { kind: 'invalid', message: '活动名称不能为空' }
    if (v !== cur.name) {
      data.name = v
      changed.push('name')
    }
  }
  if (input.topic !== undefined && input.topic !== cur.topic) {
    data.topic = input.topic
    changed.push('topic')
  }
  if (input.subject !== undefined) {
    const v = clip(cleanSubjectLine(input.subject), 200) || ''
    if (v !== cur.subject) {
      data.subject = v
      changed.push('subject')
    }
  }
  if (input.preheader !== undefined) {
    const v = clip(cleanSubjectLine(input.preheader), 200) || null
    if (v !== cur.preheader) {
      data.preheader = v
      changed.push('preheader')
    }
  }
  if (input.doc !== undefined) {
    const c = canonicalDoc(input.doc)
    if (!c.ok) return { kind: 'invalid', message: c.error }
    if (c.json !== cur.doc) {
      data.doc = c.json
      changed.push('doc')
    }
  }
  if (input.audience !== undefined) {
    const json = JSON.stringify(canonicalAudience(input.audience))
    if (json !== cur.audience) {
      data.audience = json
      changed.push('audience')
    }
  }

  // 什么都没变：不写库、不动 updatedAt（否则另一个只是打开着的标签页会平白冲突）
  if (!changed.length) return { kind: 'ok', detail: toCampaignDetail(cur) }

  const now = new Date()
  const nextUpdatedAt = now.getTime() > cur.updatedAt.getTime() ? now : new Date(cur.updatedAt.getTime() + 1)
  const r = await prisma.marketingCampaign.updateMany({
    where: { id, status: 'DRAFT', updatedAt: cur.updatedAt },
    data: { ...data, updatedAt: nextUpdatedAt },
  })
  const fresh = await prisma.marketingCampaign.findUnique({ where: { id } })
  if (!fresh) return { kind: 'not_found' }
  if (r.count !== 1) {
    // 输了 CAS：要么被发送 / 删除了，要么别处先保存了
    if (fresh.status !== 'DRAFT') return { kind: 'not_draft', detail: toCampaignDetail(fresh) }
    return { kind: 'conflict', detail: toCampaignDetail(fresh) }
  }

  if (shouldAuditUpdate(id, actorId, now.getTime())) {
    await auditSafe('UPDATE', { actorId, campaignId: id, detail: { fields: changed } })
  }
  return { kind: 'ok', detail: toCampaignDetail(fresh) }
}

/* ============================== 删除草稿 ============================== */

/**
 * 只删 DRAFT（条件删除，与 launch 并发时输的一方拿到 409）。
 * 撤回定时后回到草稿的活动理论上已经由 lifecycle 清掉了快照、链接与 0 张的券批次；这里再兜一次底：
 * 残留的 links 一并删，残留的券批次只在一张都没发出时删除（有发出的券绝不动）。
 */
export async function deleteDraft(id: number, actorId: number): Promise<'ok' | 'not_found' | 'not_draft'> {
  const cur = await prisma.marketingCampaign.findUnique({
    where: { id },
    select: { id: true, status: true, name: true, couponId: true, updatedAt: true },
  })
  if (!cur) return 'not_found'
  if (cur.status !== 'DRAFT') return 'not_draft'

  const r = await prisma.marketingCampaign.deleteMany({ where: { id, status: 'DRAFT' } })
  if (r.count !== 1) {
    const again = await prisma.marketingCampaign.findUnique({ where: { id }, select: { status: true } })
    return again ? 'not_draft' : 'not_found'
  }

  try {
    await prisma.marketingLink.deleteMany({ where: { campaignId: id } })
  } catch (e) {
    console.error(`[marketing] 删除活动 #${id} 的残留链接失败:`, (e as Error)?.message || e)
  }
  if (cur.couponId) {
    try {
      // 只删「CAMPAIGN 来源、0 张已发」的批次：条件写在 where 里，并发发券时也不会误删
      const c = await prisma.coupon.findUnique({ where: { id: cur.couponId }, select: { source: true, claimed: true } })
      if (c && c.source === 'CAMPAIGN' && c.claimed === 0) {
        const grants = await prisma.couponGrant.count({ where: { couponId: cur.couponId } })
        if (grants === 0) await prisma.coupon.deleteMany({ where: { id: cur.couponId, source: 'CAMPAIGN', claimed: 0 } })
      }
    } catch (e) {
      console.error(`[marketing] 删除活动 #${id} 的残留券批次失败:`, (e as Error)?.message || e)
    }
  }

  await auditSafe('DELETE', { actorId, campaignId: id, detail: { name: cur.name } })
  return 'ok'
}

/* ============================== 模板 ============================== */

const MAX_SAVED_TEMPLATES = 200

function templateDescription(t: Pick<MarketingTemplate, 'subject'>): string {
  const s = (t.subject || '').trim()
  return s ? `主题：${s.length > 40 ? s.slice(0, 40) + '…' : s}` : '自存模板'
}

export async function listTemplateItems(): Promise<TemplateItem[]> {
  const builtIn: TemplateItem[] = PRESETS.map((p) => ({
    key: `preset:${p.key}`,
    name: p.name,
    description: p.description,
    topic: p.topic,
    builtIn: true,
    updatedAt: null,
  }))
  const saved = await prisma.marketingTemplate.findMany({
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: MAX_SAVED_TEMPLATES,
    select: { id: true, name: true, topic: true, subject: true, updatedAt: true },
  })
  return builtIn.concat(
    saved.map((t) => ({
      key: `tpl:${t.id}`,
      name: t.name,
      description: templateDescription(t),
      topic: asTopic(t.topic),
      builtIn: false,
      updatedAt: t.updatedAt.toISOString(),
    }))
  )
}

/**
 * 模板接口路径里的 id：接受 '12' 或 'tpl:12'（前端直接用 TemplateItem.key 最省事）。
 * 'preset:*' 是内置模板，不能改也不能删。
 */
export function parseTemplateRef(raw: string): { kind: 'saved'; id: number } | { kind: 'builtin' } | { kind: 'invalid' } {
  let s = raw
  try {
    s = decodeURIComponent(raw)
  } catch {
    return { kind: 'invalid' }
  }
  if (s.startsWith('preset:')) return { kind: 'builtin' }
  if (s.startsWith('tpl:')) s = s.slice(4)
  const id = parseId(s)
  return id ? { kind: 'saved', id } : { kind: 'invalid' }
}

/** 另存为模板：拷当前内容（不含受众、不含活动名以外的任何运行数据） */
export async function saveCampaignAsTemplate(campaignId: number, name: string, actorId: number): Promise<{ id: number }> {
  const src = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } })
  if (!src) throw new MarketingHttpError('活动不存在', 404)
  const parsed = parseStoredDoc(src.doc, `活动 #${src.id}`)
  if (!parsed.ok) throw new MarketingHttpError('活动内容已损坏，无法另存为模板', 400)
  const count = await prisma.marketingTemplate.count()
  if (count >= MAX_SAVED_TEMPLATES) throw new MarketingHttpError(`模板最多 ${MAX_SAVED_TEMPLATES} 个，先删掉一些不用的`, 400)
  const content = contentFrom({ topic: src.topic, subject: src.subject, preheader: src.preheader, doc: parsed.doc }, '活动')
  const tpl = await prisma.marketingTemplate.create({
    data: {
      name: clip(name.trim(), 80) || '未命名模板',
      topic: content.topic,
      subject: content.subject || null,
      preheader: content.preheader,
      doc: content.docJson,
      createdBy: actorId,
    },
  })
  await auditSafe('TEMPLATE', { actorId, campaignId, detail: { op: 'create', templateId: tpl.id } })
  return { id: tpl.id }
}

export async function renameTemplate(id: number, name: string, actorId: number): Promise<boolean> {
  const r = await prisma.marketingTemplate.updateMany({ where: { id }, data: { name: clip(name.trim(), 80) || '未命名模板' } })
  if (r.count !== 1) return false
  await auditSafe('TEMPLATE', { actorId, detail: { op: 'rename', templateId: id } })
  return true
}

export async function deleteTemplate(id: number, actorId: number): Promise<boolean> {
  const r = await prisma.marketingTemplate.deleteMany({ where: { id } })
  if (r.count !== 1) return false
  await auditSafe('TEMPLATE', { actorId, detail: { op: 'delete', templateId: id } })
  return true
}

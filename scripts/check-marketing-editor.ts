/**
 * 营销邮件编辑器的纯逻辑自测。**不连数据库、不需要浏览器**。
 *   npx tsx scripts/check-marketing-editor.ts
 *
 * 钉住的是编辑器里最容易「丢稿 / 撤销撤错 / 发出去才发现」的地方：
 * 撤销历史的合并与上限、区块增删移不丢块不重 id、草稿指纹、颜色/链接/图片地址检查、
 * 图片预处理决策、主题换色，以及与渲染器/规范化器的对接（每个内置模板、每种新区块都能渲染，
 * 预览标记能剥干净，TipTap 风格的 JSON 经 normalizeRichDoc 后能过严格 zod）。
 * 以及自动保存对 409 的分类（已不是草稿 → 锁定而不是「冲突」，审查 C21）、
 * 图片上传回来时用最新的 onChange（不冲掉上传期间的改动，审查 C23）。
 */
import {
  COALESCE_IDLE_MS,
  COALESCE_MAX_MS,
  HISTORY_LIMIT,
  canDuplicate,
  draftKey,
  duplicateBlock,
  historyReducer,
  initHistory,
  insertBlock,
  moveBlock,
  remapThemeColors,
  removeBlock,
  reorderBlocks,
  uniqueBlockId,
  updateBlock,
  type DraftState,
  type HistoryState,
} from '../src/components/admin/marketing/editor/state'
import {
  applySampleVars,
  contrastRatio,
  estimateSubjectLength,
  formatCnDate,
  imageUrlProblem,
  linkProblem,
  normalizeHex,
  parseMoney,
  sampleCouponExpires,
} from '../src/components/admin/marketing/editor/util'
import { planImage, rejectReason, sniffImage, MAX_WIDTH } from '../src/components/admin/marketing/editor/image-process'
import { BLOCK_TYPE_LABEL, emailDocSchema, richDocSchema, type Block, type BlockType, type EmailDoc } from '../src/lib/marketing/types'
import { PRESETS, newBlock } from '../src/lib/marketing/presets'
import { DEFAULT_CONFIG } from '../src/lib/marketing/types'
import { DEFAULT_SETTINGS, THEMES, applyTheme, blockSummary, renderEmail } from '../src/lib/marketing/render'
import { normalizeRichDoc } from '../src/lib/marketing/richtext'
import { lintContent, lintRendered } from '../src/lib/marketing/lint'
import { classify409 } from '../src/components/admin/marketing/editor/use-autosave'
import type { CampaignDetail } from '../src/lib/marketing/types'
import { readFileSync } from 'fs'
import { join } from 'path'

const readSrc = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf-8').replace(/\r\n/g, '\n')

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `实际 ${a}，期望 ${e}`)
}

function textBlock(id: string, text = 'hi'): Block {
  return { id, type: 'text', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }, align: 'left', size: 16 }
}
function mkDoc(ids: string[]): EmailDoc {
  return { v: 1, settings: { ...DEFAULT_SETTINGS }, blocks: ids.map((id) => textBlock(id)) }
}
function mkDraft(doc: EmailDoc, subject = 's'): DraftState {
  return { name: 'n', topic: 'PROMO', subject, preheader: '', doc }
}

/* ============================== 撤销历史 ============================== */
console.log('\n撤销 / 重做')
{
  let h: HistoryState = initHistory(mkDraft(mkDoc(['a'])))
  const setSubject = (v: string, key: string | undefined, now: number) =>
    (h = historyReducer(h, { type: 'update', fn: (d) => ({ ...d, subject: v }), key, now }))

  setSubject('s1', 'subject', 1000)
  setSubject('s12', 'subject', 1500)
  setSubject('s123', 'subject', 2000)
  eq('同一字段 1 秒内连续输入并成一步', h.past.length, 1)
  eq('当前值是最后一次输入', h.present.subject, 's123')

  setSubject('s1234', 'subject', 2000 + COALESCE_IDLE_MS + 1)
  eq('停顿超过 1 秒另起一步', h.past.length, 2)

  const t0 = 10_000
  for (let t = t0; t <= t0 + COALESCE_MAX_MS + 500; t += 400) setSubject('x' + t, 'subject', t)
  ok('一口气连续输入超过 4 秒也会切步（不至于整段一次撤掉）', h.past.length >= 4, `past=${h.past.length}`)

  const before = h.past.length
  setSubject('other', 'name', t0 + COALESCE_MAX_MS + 600)
  eq('换字段立即另起一步', h.past.length, before + 1)

  const same = historyReducer(h, { type: 'update', fn: (d) => d, key: 'x', now: 1 })
  ok('没变化的更新不产生历史步', same === h)

  const presentBefore = h.present
  h = historyReducer(h, { type: 'undo' })
  ok('撤销回到上一步', h.present !== presentBefore && h.future.length === 1)
  h = historyReducer(h, { type: 'redo' })
  ok('重做恢复', h.present === presentBefore && h.future.length === 0)
  h = historyReducer(h, { type: 'undo' })
  setSubject('branch', undefined, 99_999)
  eq('撤销后再改：重做分支被丢弃', h.future.length, 0)

  let big: HistoryState = initHistory(mkDraft(mkDoc(['a'])))
  for (let i = 0; i < 200; i++) big = historyReducer(big, { type: 'update', fn: (d) => ({ ...d, subject: 's' + i }), now: i * 10_000 })
  eq(`历史上限 ${HISTORY_LIMIT} 个快照（含当前）`, big.past.length + 1, HISTORY_LIMIT)
  let undos = 0
  while (big.past.length) {
    big = historyReducer(big, { type: 'undo' })
    undos++
  }
  eq('最多能撤销 49 步', undos, HISTORY_LIMIT - 1)
  eq('最早能撤回到的是第 151 次改动后', big.present.subject, 's150')

  let l: HistoryState = initHistory(mkDraft(mkDoc(['a']), 'mine'))
  l = historyReducer(l, { type: 'load', draft: mkDraft(mkDoc(['a']), 'server') })
  eq('换成服务器版本', l.present.subject, 'server')
  l = historyReducer(l, { type: 'undo' })
  eq('「使用服务器版本」后 Ctrl+Z 能找回自己的', l.present.subject, 'mine')
}

/* ============================== 区块操作 ============================== */
console.log('\n区块操作')
{
  const d = mkDoc(['a', 'b', 'c'])
  eq('上移', moveBlock(d, 'b', -1).blocks.map((b) => b.id), ['b', 'a', 'c'])
  eq('下移', moveBlock(d, 'b', 1).blocks.map((b) => b.id), ['a', 'c', 'b'])
  ok('到顶再上移：原样返回（同一引用）', moveBlock(d, 'a', -1) === d)
  ok('到底再下移：原样返回', moveBlock(d, 'c', 1) === d)
  eq('插入到中间', insertBlock(d, 1, textBlock('x')).blocks.map((b) => b.id), ['a', 'x', 'b', 'c'])
  eq('插入下标越界夹到末尾', insertBlock(d, 99, textBlock('x')).blocks.map((b) => b.id), ['a', 'b', 'c', 'x'])
  const r = removeBlock(d, 'b')
  eq('删除返回被删块与原位置', [r.removed?.id, r.index, r.doc.blocks.map((b) => b.id)], ['b', 1, ['a', 'c']])
  ok('删不存在的块：原样', removeBlock(d, 'zz').doc === d)

  eq('按 id 重排', reorderBlocks(d, ['c', 'a', 'b']).blocks.map((b) => b.id), ['c', 'a', 'b'])
  ok('重排列表少一个：拒绝（不丢块）', reorderBlocks(d, ['c', 'a']) === d)
  ok('重排列表有重复：拒绝', reorderBlocks(d, ['a', 'a', 'b']) === d)
  ok('重排列表有陌生 id：拒绝', reorderBlocks(d, ['a', 'b', 'zz']) === d)
  ok('顺序没变：原样返回', reorderBlocks(d, ['a', 'b', 'c']) === d)

  const dup = duplicateBlock(d, 'b')
  ok('复制：插在原块后面', dup.doc.blocks[2].id === dup.newId && dup.doc.blocks.length === 4)
  ok('复制：新 id 不重复且合法', !!dup.newId && dup.newId !== 'b' && /^[A-Za-z0-9_-]{1,32}$/.test(dup.newId))
  ok('复制是深拷贝（改副本不影响原块）', (() => {
    const copy = dup.doc.blocks[2] as Extract<Block, { type: 'text' }>
    copy.content.content.push({ type: 'paragraph' })
    return (d.blocks[1] as Extract<Block, { type: 'text' }>).content.content.length === 1
  })())
  ok('复制后的文档过严格 zod（id 唯一）', emailDocSchema.safeParse(dup.doc).success)

  const coupon = newBlock('coupon', DEFAULT_SETTINGS)
  const withCoupon: EmailDoc = { ...d, blocks: d.blocks.concat([coupon]) }
  ok('优惠券区块不能复制（每封一个）', !canDuplicate(withCoupon, coupon) && duplicateBlock(withCoupon, coupon.id).newId === null)
  const full = mkDoc(Array.from({ length: 40 }, (_, i) => 'k' + i))
  ok('满 40 块不能再插', insertBlock(full, 0, textBlock('x')) === full)
  ok('满 40 块不能再复制', duplicateBlock(full, 'k0').newId === null)

  const ids = new Set<string>()
  const many = mkDoc([])
  for (let i = 0; i < 500; i++) ids.add(uniqueBlockId(many))
  ok('uniqueBlockId 生成的都合法', Array.from(ids).every((x) => /^[A-Za-z0-9_-]{1,32}$/.test(x)))

  const u = updateBlock(d, 'b', (b) => ({ ...b, align: 'center' }) as Block)
  ok('updateBlock 只换目标块', u.blocks[0] === d.blocks[0] && u.blocks[1] !== d.blocks[1] && u.blocks[2] === d.blocks[2])
  ok('updateBlock 未变化返回原文档', updateBlock(d, 'b', (b) => b) === d)
}

/* ============================== 草稿指纹 ============================== */
console.log('\n草稿指纹')
{
  const a = mkDraft(mkDoc(['a']))
  const b = JSON.parse(JSON.stringify(a)) as DraftState
  eq('内容相同指纹相同（撤销回原样 = 已保存）', draftKey(a), draftKey(b))
  ok('内容不同指纹不同', draftKey(a) !== draftKey({ ...a, preheader: 'x' }))
  ok('undefined 字段不影响指纹（清空可选字段后等同于没有）', draftKey({ ...a, doc: { ...a.doc, blocks: [{ ...a.doc.blocks[0], box: undefined }] } }) === draftKey(a))
}

/* ============================== 自动保存 409 分类（审查 C21） ============================== */
console.log('\n自动保存遇到 409')
{
  const srv = (status: string, id = 12): CampaignDetail =>
    ({ id, status, updatedAt: '2026-09-30T10:00:00.000Z', doc: mkDoc(['a']), name: 'n', topic: 'PROMO', subject: 's' }) as unknown as CampaignDetail
  const draft = classify409(srv('DRAFT'), 12)
  ok('服务器版本仍是草稿 → 冲突（让站长二选一）', draft.kind === 'conflict' && draft.server?.status === 'DRAFT')
  for (const st of ['SCHEDULED', 'SENDING', 'PAUSED', 'COMPLETED', 'CANCELLED']) {
    const c = classify409(srv(st), 12)
    ok(`服务器版本已是 ${st} → 锁定（不是冲突，「用我的覆盖」必然再 409）`, c.kind === 'locked' && c.server?.status === st)
  }
  eq('没附 server → 锁定', classify409(undefined, 12), { kind: 'locked', server: null })
  eq('附的是别的活动 → 锁定（不拿别的活动当基准）', classify409(srv('DRAFT', 13), 12), { kind: 'locked', server: null })
  eq('附的东西不像活动（缺 doc）→ 锁定', classify409({ id: 12, status: 'DRAFT', updatedAt: 'x' }, 12), { kind: 'locked', server: null })

  const src = readSrc('src/components/admin/marketing/editor/use-autosave.ts')
  ok('saveOnce 的 409 分支用 classify409 判定', /res\.status === 409\)[\s\S]{0,120}classify409\(/.test(src))
  ok('锁定时显示服务端给的原因', /kind: 'locked', message: body\?\.error \|\|/.test(src))
  ok("resolveConflict('mine') 兜底：服务器版本不是草稿就锁定、不重存", /choice === 'mine' && srv\.status !== 'DRAFT'[\s\S]{0,300}kind: 'locked'[\s\S]{0,120}return null/.test(src))
  ok('文件头注释已改成按 status 区分', /409 且 data\.server\.status==='DRAFT' → 冲突/.test(src) && !/409 不带 server → 活动已不是草稿/.test(src))
}

/* ============================== 图片上传回写（审查 C23） ============================== */
console.log('\n图片上传完成时的回写')
{
  const src = readSrc('src/components/admin/marketing/editor/image-field.tsx')
  const hf = src.match(/const handleFile = async[\s\S]*?\n  \}\n/)?.[0] || ''
  ok('找到 handleFile', !!hf)
  ok('每次渲染都把最新的 onChange 放进 ref', /\n  onChangeRef\.current = onChange\n/.test(src))
  ok('上传回来后调用最新的 onChange（onChangeRef.current）', /await uploadImage\([\s\S]*?onChangeRef\.current\(url\)/.test(hf))
  ok('上传回来后不再调用开始上传时闭包里的 onChange', !/\bonChange\(url\)/.test(hf))
}

/* ============================== 工具 ============================== */
console.log('\n颜色 / 链接 / 图片地址 / 主题长度')
{
  eq('#abc 展开', normalizeHex('#ABC'), '#aabbcc')
  eq('不带 # 也行', normalizeHex('7C3AED'), '#7c3aed')
  eq('rgb() 转 hex', normalizeHex('rgb(124, 58, 237)'), '#7c3aed')
  eq('非法颜色返回 null', [normalizeHex('red'), normalizeHex('#12345'), normalizeHex('rgb(300,0,0)')], [null, null, null])
  ok('黑白对比度 21', Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01)
  ok('浅灰字在白底 < 4.5', contrastRatio('#bbbbbb', '#ffffff') < 4.5)

  eq('https 链接合法', linkProblem('https://bigolab.com/products/1'), null)
  eq('站内路径合法', linkProblem('/products/1'), null)
  eq('mailto 合法', linkProblem('mailto:hi@bigolab.com'), null)
  ok('javascript: 拒绝', !!linkProblem('javascript:alert(1)'))
  ok('协议相对地址 //evil.com 拒绝', !!linkProblem('//evil.com'))
  ok('链接里的变量拒绝', !!linkProblem('https://a.com/?u={{email}}'))
  ok('空格拒绝', !!linkProblem('https://a.com/a b'))
  ok('必填为空报错', !!linkProblem('', { required: true }))
  eq('选填为空不报错', linkProblem(''), null)

  eq('https jpg 合法', imageUrlProblem('https://a.com/x.jpg'), null)
  eq('webp 拒绝', imageUrlProblem('https://a.com/x.webp')?.level, 'error')
  eq('svg 拒绝', imageUrlProblem('https://a.com/x.svg?v=1')?.level, 'error')
  eq('http 拒绝', imageUrlProblem('http://a.com/x.jpg')?.level, 'error')
  eq('无扩展名只警告', imageUrlProblem('https://a.com/img?id=1')?.level, 'warn')

  eq('昵称变量按 12 字估算', estimateSubjectLength('{{nickname|朋友}}，你好'), 12 + 3)
  eq('无变量按字符数', estimateSubjectLength('国庆特惠'), 4)
  eq('样例变量替换', applySampleVars('{{nickname|朋友}}·{{email}}', { nickname: '小明' }), '小明·name@example.com')
  eq('没有昵称用默认值', applySampleVars('{{nickname|同学}}', {}), '同学')

  eq('北京日期中文', formatCnDate('2026-10-07'), '2026年10月7日')
  eq('金额两位小数', [parseMoney('12.5'), parseMoney('0'), parseMoney('12.345'), parseMoney('abc')], [12.5, 0, null, null])

  const grantDoc: EmailDoc = {
    v: 1,
    settings: DEFAULT_SETTINGS,
    blocks: [{ ...(newBlock('coupon') as Extract<Block, { type: 'coupon' }>), grant: { kind: 'THRESHOLD', discount: 5, minAmount: 0, productIds: [], validity: { mode: 'days', days: 7 } } }],
  }
  // 2026-09-25 20:00 北京时间 = 12:00Z；+7 天 = 10 月 2 日（按北京日历，不受本机时区影响）
  eq('直发券 days 模式样例到期日（北京日历）', sampleCouponExpires(grantDoc, new Date('2026-09-25T12:00:00Z')), '2026年10月2日')
  // 北京时间 9-25 23:30 = 15:30Z：北京已是 25 日晚，+7 → 10 月 2 日（若误用 UTC 日期也是 25 日；换 16:30Z = 北京 26 日 00:30）
  eq('跨北京零点按北京日期算', sampleCouponExpires(grantDoc, new Date('2026-09-25T16:30:00Z')), '2026年10月3日')
}

/* ============================== 图片预处理决策 ============================== */
console.log('\n图片预处理')
{
  eq('GIF 原样', planImage({ kind: 'gif', width: 2000, height: 1000, bytes: 900_000, hasAlpha: false }).action, 'keep')
  const bigJpg = planImage({ kind: 'jpeg', width: 3000, height: 2000, bytes: 2_000_000, hasAlpha: false })
  eq('超宽 JPEG 缩到 1200 并重编码', [bigJpg.action, bigJpg.format, bigJpg.width, bigJpg.height], ['encode', 'jpeg', MAX_WIDTH, 800])
  eq('小 JPEG 原样（避免二次压缩）', planImage({ kind: 'jpeg', width: 800, height: 600, bytes: 120_000, hasAlpha: false }).action, 'keep')
  eq('偏大的 JPEG 即使不超宽也重编码', planImage({ kind: 'jpeg', width: 1000, height: 800, bytes: 700_000, hasAlpha: false }).action, 'encode')
  const opaquePng = planImage({ kind: 'png', width: 800, height: 600, bytes: 900_000, hasAlpha: false })
  eq('无透明 PNG 转 JPEG', [opaquePng.action, opaquePng.format], ['encode', 'jpeg'])
  eq('透明 PNG 不超宽原样', planImage({ kind: 'png', width: 800, height: 600, bytes: 200_000, hasAlpha: true }).action, 'keep')
  const bigAlpha = planImage({ kind: 'png', width: 2400, height: 1200, bytes: 900_000, hasAlpha: true })
  eq('透明 PNG 超宽：缩放但保留 PNG', [bigAlpha.action, bigAlpha.format, bigAlpha.width], ['encode', 'png', 1200])

  const bytes = (...xs: number[]) => new Uint8Array(xs.concat(new Array(16).fill(0)))
  eq('识别 JPEG', sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0)), 'jpeg')
  eq('识别 PNG', sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'png')
  eq('识别 GIF', sniffImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)), 'gif')
  eq('改名成 .jpg 的 WebP 也认得出来', sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)), 'webp')
  eq('识别 SVG', sniffImage(new TextEncoder().encode('  <svg xmlns="http://www.w3.org/2000/svg">')), 'svg')
  eq('识别 HEIC', sniffImage(bytes(0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63)), 'heic')
  ok('WebP 给出明确拒绝理由', /WebP/.test(rejectReason('webp', 'a.jpg') || ''))
  ok('SVG 给出明确拒绝理由', /SVG/.test(rejectReason('svg', 'a.svg') || ''))
  eq('JPG/PNG/GIF 不拒绝', [rejectReason('jpeg', 'a'), rejectReason('png', 'a'), rejectReason('gif', 'a')], [null, null, null])
}

/* ============================== 主题换色 ============================== */
console.log('\n主题换色')
{
  const doc: EmailDoc = {
    v: 1,
    settings: { ...DEFAULT_SETTINGS },
    blocks: [newBlock('header', DEFAULT_SETTINGS), newBlock('button', DEFAULT_SETTINGS), { ...(newBlock('button', DEFAULT_SETTINGS) as Extract<Block, { type: 'button' }>), bg: '#123456' }],
  }
  const ocean = THEMES.find((t) => t.key === 'ocean')?.settings
  ok('渲染器提供内置主题', THEMES.length >= 4 && !!ocean)
  if (ocean) {
    const mine = remapThemeColors(doc, doc.settings, ocean)
    const hdr = mine.blocks[0] as Extract<Block, { type: 'header' }>
    const btn = mine.blocks[1] as Extract<Block, { type: 'button' }>
    const custom = mine.blocks[2] as Extract<Block, { type: 'button' }>
    eq('编辑器兜底换色：页眉品牌色跟着换', [hdr.bg, hdr.bg2], [ocean.brand, ocean.accent])
    eq('编辑器兜底换色：按钮品牌色跟着换、白字不动', [btn.bg, btn.color], [ocean.brand, '#ffffff'])
    eq('编辑器兜底换色：自定义颜色保留', custom.bg, '#123456')
    ok('编辑器兜底换色后过 zod', emailDocSchema.safeParse(mine).success)
    const r = applyTheme(doc, ocean)
    ok('渲染器 applyTheme 后过 zod', emailDocSchema.safeParse(r).success)
    eq('渲染器 applyTheme：按钮品牌色跟着换', (r.blocks[1] as Extract<Block, { type: 'button' }>).bg, ocean.brand.toLowerCase())
  }
}

/* ============================== 与渲染器 / 规范化器对接 ============================== */
console.log('\n渲染器对接')
{
  const footer = {
    companyName: DEFAULT_CONFIG.companyName,
    brandName: DEFAULT_CONFIG.brandName,
    contactEmail: 'hi@bigolab.com',
    footerNote: '',
    subjectPrefix: DEFAULT_CONFIG.subjectPrefix,
  }
  const ctxFor = (doc: EmailDoc, selected: string | null) => ({
    mode: 'preview' as const,
    subject: 's',
    preheader: 'p',
    origin: 'http://localhost:3000',
    footer,
    products: {},
    coupon: null,
    vars: {},
    selectedBlockId: selected,
    imagesOff: false,
  })
  ok('内置模板齐全（5 套）', PRESETS.length === 5)
  for (const p of PRESETS) {
    const parsed = emailDocSchema.safeParse(p.doc)
    ok(`模板「${p.name}」过 zod`, parsed.success, parsed.success ? '' : parsed.error.errors[0]?.message)
    let html = ''
    try {
      const r = renderEmail(p.doc, ctxFor(p.doc, p.doc.blocks[0]?.id ?? null))
      html = r.html
      ok(`模板「${p.name}」预览渲染成功（${Math.round(r.sizeBytes / 1024)}KB）`, r.html.length > 1000 && r.sizeBytes > 0)
    } catch (e) {
      ok(`模板「${p.name}」预览渲染成功`, false, e instanceof Error ? e.message : String(e))
    }
    ok(`模板「${p.name}」每个区块都有 data-bid（点预览能定位）`, p.doc.blocks.every((b) => html.includes(`data-bid="${b.id}"`)))
    const stripped = html.replace(/\sdata-bid="[^"]*"/g, '')
    ok(`模板「${p.name}」剥掉预览标记后不再有 data-bid 属性`, !/data-bid="/.test(stripped))
    ok(`模板「${p.name}」预览 HTML 里没有 <script>`, !/<script/i.test(html))
    try {
      const issues = lintContent({ subject: p.subject, preheader: p.preheader, topic: p.topic, doc: p.doc, subjectPrefix: '(AD)' })
      ok(`模板「${p.name}」lintContent 可运行`, Array.isArray(issues))
      const r2 = lintRendered({ html: stripped, text: '', subject: '(AD)' + p.subject, sizeBytes: 1000, imageCount: 0 })
      ok(`模板「${p.name}」lintRendered 在预览 HTML 上没有禁发词误报`, !r2.some((i) => i.code === 'BANNED_WORD'), JSON.stringify(r2))
    } catch (e) {
      ok(`模板「${p.name}」lint 可运行`, false, e instanceof Error ? e.message : String(e))
    }
  }

  const types = Object.keys(BLOCK_TYPE_LABEL) as BlockType[]
  for (const t of types) {
    const b = newBlock(t, DEFAULT_SETTINGS)
    const doc: EmailDoc = { v: 1, settings: DEFAULT_SETTINGS, blocks: [b] }
    let rendered = false
    try {
      renderEmail(doc, ctxFor(doc, b.id))
      rendered = true
    } catch (e) {
      ok(`新建「${BLOCK_TYPE_LABEL[t]}」可渲染`, false, e instanceof Error ? e.message : String(e))
    }
    if (rendered) ok(`新建「${BLOCK_TYPE_LABEL[t]}」可渲染`, true)
    const s = blockSummary(b)
    ok(`「${BLOCK_TYPE_LABEL[t]}」有一行摘要`, typeof s === 'string' && s.length > 0)
  }

  // TipTap getJSON() 的典型输出：link 带 target/rel/class，textStyle 带多余键，颜色是 rgb()，还有嵌套列表
  const tiptapLike = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [
          { type: 'text', text: '你好 ' },
          { type: 'text', text: '{{nickname|朋友}}', marks: [{ type: 'bold' }] },
          {
            type: 'text',
            text: '看看',
            marks: [
              { type: 'link', attrs: { href: 'https://bigolab.com/products/1', target: '_blank', rel: 'noopener noreferrer nofollow', class: null } },
              { type: 'textStyle', attrs: { color: 'rgb(124, 58, 237)', fontFamily: null } },
            ],
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: '一' }] },
              { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '嵌套' }] }] }] },
            ],
          },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: '坏链接', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
      { type: 'paragraph' },
    ],
  }
  const n = normalizeRichDoc(tiptapLike)
  const zr = richDocSchema.safeParse(n)
  ok('TipTap 风格 JSON 经 normalizeRichDoc 后过严格 zod', zr.success, zr.success ? '' : zr.error.errors[0]?.message)
  const flat = JSON.stringify(n)
  ok('规范化：丢掉 target/rel/class 等多余 attrs', !/target|noopener|fontFamily|textAlign/.test(flat))
  ok('规范化：rgb() 颜色转成 #hex', /#7c3aed/i.test(flat))
  ok('规范化：javascript: 链接被丢弃', !/javascript/i.test(flat))
  ok('规范化：嵌套列表被压平（文字保留）', /嵌套/.test(flat) && !/"bulletList"[^\]]*"bulletList"/.test(JSON.stringify((n.content[1] as { content?: unknown }).content)))
  eq('规范化是幂等的（编辑器据此判断是否需要回写）', JSON.stringify(normalizeRichDoc(n)), flat)
}

console.log(`\n${fail === 0 ? '全部通过' : '有失败'}：${pass} 通过，${fail} 失败`)
if (fail > 0) process.exit(1)

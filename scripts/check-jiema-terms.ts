/**
 * 短信接码 · 《短信接码服务条款》与付款前免责弹窗的纯函数 / 源码检查（不连库、不调上游）。docs/短信接码-设计.md §1.8、§8.4、§8.6：
 *
 *   npx tsx scripts/check-jiema-terms.ts
 *
 * 覆盖：
 *   · 「改一句条款就升版本」（§8.4 ④）：条款正文（第一节五条 + jiema-legal.ts 全部常量）与《余额与充值规则》各算一个指纹，
 *     必须等于按当前版本号登记的指纹——只改正文不升版本、或升了版本不登记，这里直接失败；
 *   · 法条：必须有的 15 条都在（刑法 287 之二 / 287 之一 / 253 之一 / 266，反电诈法 25 / 26 / 31 / 38 / 42 / 44，网络安全法 46 / 48，
 *     两高解释 11 / 12，两高一部意见 5）；每条都有要点、原文、版本信息、官方来源（只认 flk.npc.gov.cn / npc.gov.cn / court.gov.cn / spp.gov.cn）；
 *     法律与司法解释写明「现行有效」并带国家法律法规数据库的现行文本链接；关键原文逐字抽查；网络安全法写的是 2025 修正后的条号并注明修正前条号；
 *   · 免责措辞：不出现「不承担任何责任」「概不负责」这类会被认定无效的格式条款写法；必须写「在法律允许的范围内」「与本平台无关」等；
 *   · 用途限制清单齐全；记录留存的天数与 api/cron/cleanup 的常量一致；隐私政策写了条款同意记录；
 *   · lib/jiema/consent：留痕 detail 的截断与解析、TERMS_AGREED 不清理；ui：409 TERMS 之后刷新还是重新弹窗、付款摘要；
 *   · 源码：确认面板的按钮先弹窗（不直接提交）、弹窗默认不勾、勾了才能点、限高滚动；下单接口缺字段按 409（zod 可选）、带 IP / UA；
 *     下单逻辑先核对同意再做幂等、同一事务写 TERMS_AGREED；/jiema、/terms 链到 /jiema/terms。
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { JIEMA_TERMS, JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE, JIEMA_TERMS_VERSION, WALLET_TERMS, WALLET_TERMS_TITLE, WALLET_TERMS_VERSION } from '../src/lib/terms/jiema-wallet'
import { CONSENT_CHECKBOX, CONSENT_TITLE, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, LEGAL_ARTICLES, LEGAL_NOTE, TERMS_MISC, articleLabel } from '../src/lib/terms/jiema-legal'
import { KEEP_EVENT_TYPES, TERMS_AGREED_EVENT, consentDetail, parseConsentDetail } from '../src/lib/jiema/consent'
import { termsReaction, payPlanSummary, termsChangedSinceLast } from '../src/lib/jiema/ui'

let pass = 0
let fail = 0
function ok(cond: boolean, name: string, extra = ''): void {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? `  —— ${extra}` : ''}`)
  }
}
const ROOT = path.join(__dirname, '..')
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const sha = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16)

/**
 * 正文指纹登记表：版本号 → 指纹。改了条款正文就必须升版本号并在这里加一行（旧行留着当历史）。
 * 指纹 = sha256(JSON(正文常量)) 的前 16 位；算法见上面的 sha()。
 */
const JIEMA_FINGERPRINTS: Record<string, string> = {
  '2026-09-30': 'fc3ef48e5982aa84',
}
const WALLET_FINGERPRINTS: Record<string, string> = {
  '2026-09-29': '53123bc3672693a5',
}

console.log('\n【§8.4 ④ 改一句条款就升版本：正文指纹与版本号登记一致】')
{
  const jiemaBody = { JIEMA_TERMS_TITLE, JIEMA_TERMS, CONSENT_TITLE, CONSENT_CHECKBOX, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, TERMS_MISC, LEGAL_NOTE, LEGAL_ARTICLES }
  const walletBody = { WALLET_TERMS_TITLE, WALLET_TERMS }
  const jf = sha(jiemaBody)
  const wf = sha(walletBody)
  ok(/^\d{4}-\d{2}-\d{2}$/.test(JIEMA_TERMS_VERSION) && JIEMA_TERMS_VERSION >= '2026-09-30', `《短信接码服务条款》版本是日期且不早于 2026-09-30（${JIEMA_TERMS_VERSION}）`)
  ok(JIEMA_FINGERPRINTS[JIEMA_TERMS_VERSION] === jf, `《短信接码服务条款》正文指纹 ${jf} 已按版本 ${JIEMA_TERMS_VERSION} 登记`, JIEMA_FINGERPRINTS[JIEMA_TERMS_VERSION] ? '正文改了但版本号没升？升 JIEMA_TERMS_VERSION 并登记新指纹' : '升了版本号还没登记指纹')
  ok(WALLET_FINGERPRINTS[WALLET_TERMS_VERSION] === wf, `《余额与充值规则》正文指纹 ${wf} 已按版本 ${WALLET_TERMS_VERSION} 登记（本次没改这一份）`, '正文改了但 WALLET_TERMS_VERSION 没升？')
  ok(JIEMA_TERMS_TITLE === '短信接码服务条款' && JIEMA_TERMS_PATH === '/jiema/terms', '标题《短信接码服务条款》，全文页 /jiema/terms')
  ok(JIEMA_TERMS.length === 5, '第一节仍是五条（条款页第四节与 /jiema/terms 第一节共用）')
}

console.log('\n【法条：必须有的条文、官方来源、原文抽查】')
{
  const ids = new Set(LEGAL_ARTICLES.map((a) => a.id))
  const need: Array<[string, string]> = [
    ['xf-287-2', '刑法第二百八十七条之二（帮信罪）'],
    ['xf-287-1', '刑法第二百八十七条之一（非法利用信息网络罪）'],
    ['xf-253-1', '刑法第二百五十三条之一（侵犯公民个人信息罪）'],
    ['xf-266', '刑法第二百六十六条（诈骗罪）'],
    ['fz-25', '反电信网络诈骗法第二十五条（不得提供支持或帮助）'],
    ['fz-31', '反电信网络诈骗法第三十一条（不得买卖出租出借电话卡 / 短信端口 / 账号、不得提供实名核验帮助）'],
    ['fz-38', '反电信网络诈骗法第三十八条（法律责任）'],
    ['fz-44', '反电信网络诈骗法第四十四条（违反第三十一条的法律责任）'],
    ['wa-46', '网络安全法第四十六条（个人信息）'],
    ['wa-48', '网络安全法第四十八条（修正前第四十六条）'],
    ['sj-11', '两高帮信解释第十一条（明知）'],
    ['sj-12', '两高帮信解释第十二条（情节严重）'],
    ['fz-26', '反电信网络诈骗法第二十六条（依法调取证据时的协助义务）'],
    ['fz-42', '反电信网络诈骗法第四十二条（违反第二十五条第一款的法律责任）'],
    ['yj-5', '两高一部帮信意见第5条（明知，含批量接收短信验证的平台）'],
  ]
  for (const [id, name] of need) ok(ids.has(id), `有 ${name}`)
  ok(ids.size === LEGAL_ARTICLES.length, 'id 不重复')
  // 只认任务要求的四个官方来源：国家法律法规数据库、中国人大网、最高人民法院、最高人民检察院
  const OFFICIAL = /^https?:\/\/(www\.|flk\.)?(npc\.gov\.cn|court\.gov\.cn|spp\.gov\.cn)\//
  // 国家法律法规数据库详情页：id 是库里的 32 位 bbbs，title 是编码后的法律名称（详情页拿它当标签页标题）
  const FLK = /^https:\/\/flk\.npc\.gov\.cn\/detail\?id=[0-9a-f]{32}&title=(%[0-9A-F]{2})+$/
  for (const a of LEGAL_ARTICLES) {
    ok(
      a.law.startsWith('《') && a.article.startsWith('第') && a.topic.length > 0 && a.gist.length > 10 && a.text.length > 0 && a.text.every((x) => x.length > 0 && !/^[“”"]/.test(x)) && a.version.length > 10 && OFFICIAL.test(a.source.url),
      `${articleLabel(a)}：要点、原文（不带引号残留）、版本、官方来源齐全`,
      a.source.url,
    )
  }
  for (const a of LEGAL_ARTICLES.filter((x) => x.id !== 'yj-5')) {
    ok(
      a.version.includes('现行有效') && (FLK.test(a.source.url) || (!!a.current && FLK.test(a.current.url) && a.current.name.startsWith('国家法律法规数据库'))),
      `${articleLabel(a)}：写明现行有效，并链到国家法律法规数据库的现行文本`,
    )
  }
  const art = (id: string) => LEGAL_ARTICLES.find((a) => a.id === id)!
  ok(art('yj-5').law.includes('法发〔2025〕12号') && art('yj-5').text[2].includes('批量接收提供短信验证、语音验证的平台') && /court\.gov\.cn/.test(art('yj-5').source.url), '法发〔2025〕12号第5条：批量接收提供短信验证的平台（最高人民法院官网）')
  ok(['xf-287-2', 'xf-287-1', 'xf-253-1', 'xf-266'].every((id) => art(id).version.includes('《中华人民共和国刑法修正案（十二）》') && art(id).version.includes('未修改本条')), '刑法四条：注明最近一次修正（修正案十二）未修改本条')
  ok(art('xf-287-2').text[0] === '明知他人利用信息网络实施犯罪，为其犯罪提供互联网接入、服务器托管、网络存储、通讯传输等技术支持，或者提供广告推广、支付结算等帮助，情节严重的，处三年以下有期徒刑或者拘役，并处或者单处罚金。', '287 之二第一款逐字')
  ok(art('fz-31').text[0].includes('短信端口') && art('fz-31').text[0].includes('不得提供实名核验帮助') && art('fz-31').text[0].includes('互联网账号'), '反电诈法第三十一条：短信端口、互联网账号、实名核验帮助')
  ok(art('fz-44').text[0].startsWith('违反本法第三十一条第一款规定的') && art('fz-42').text[0].includes('第二十五条第一款'), '第四十四条对应第三十一条、第四十二条对应第二十五条')
  ok(art('wa-48').article.includes('修正前为第四十六条') && art('wa-46').article.includes('修正前为第四十四条') && art('wa-48').version.includes('2025年10月28日') && art('wa-48').version.includes('2026年1月1日'), '网络安全法按 2025 修正后的条号，并注明修正前条号与施行日期')
  ok(art('sj-11').law.includes('法释〔2019〕15号') && art('sj-12').text[0].includes('“情节严重”'), '两高解释写文号，原文保留中文引号')
  ok(LEGAL_NOTE.includes('flk.npc.gov.cn') && LEGAL_NOTE.includes('不构成法律意见'), '第七节说明：以国家法律法规数据库现行文本为准、不构成法律意见')
}

console.log('\n【免责措辞与用途限制】')
{
  const all = [JIEMA_TERMS, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS.flatMap((s) => [s.heading, s.lead ?? '', ...s.items]), TERMS_MISC].flat().join('\n')
  ok(!/不承担任何责任|概不负责|一概不负责|不负任何责任/.test(all), '不出现「不承担任何责任」「概不负责」这类会被认定无效的写法')
  ok(!all.includes('冻结'), '对买家的处置写「暂停……使用」，不写「冻结」（冻结是有权机关的强制措施）')
  ok(all.includes('造成你人身损害的责任') && all.includes('因平台故意或者重大过失造成你财产损失的责任'), '责任限制不排除人身损害与故意 / 重大过失造成的财产损失')
  ok(all.includes('经核实不存在上述情形的，平台恢复服务与余额的使用'), '暂停之后查明没有违法违约的，恢复服务与余额')
  for (const k of ['学习交流', '测试', '与本平台无关', '自行承担', '帮助信息网络犯罪活动罪', '公安机关', '在法律允许的范围内', '不排除或者限制依法不得排除或者限制的责任', '依法调取证据'])
    ok(all.includes(k), `写明「${k}」`)
  const usage = JIEMA_TERMS_SECTIONS.find((s) => s.id === 'usage')!.items.join('')
  for (const k of ['电信网络诈骗', '赌博', '洗钱', '公民个人信息', '批量注册', '养号', '出售、出租、出借', '冒用他人身份', '实名核验', '转售', '批量调用', '其他违反中华人民共和国法律法规'])
    ok(usage.includes(k), `用途限制含「${k}」`)
  ok(CONSENT_CHECKBOX === '我已阅读并同意上述条款，承诺不将本服务用于任何违法犯罪活动，并自行承担使用后果', '弹窗勾选文案逐字')
  ok(CONSENT_TITLE === '下单须知与免责声明', '弹窗标题')
  const cleanup = read('src/app/api/cron/cleanup/route.ts')
  const days = (name: string) => Number(new RegExp(`const ${name} = (\\d+)`).exec(cleanup)?.[1])
  const keep = JIEMA_TERMS_SECTIONS.find((s) => s.id === 'enforcement')!.items.join('')
  ok(keep.includes(`保存 ${days('SMS_TEXT_RETENTION_DAYS')} 天后清空`) && keep.includes(`保留 ${days('SMS_EVENT_RETENTION_DAYS')} 天`), `记录留存与 cleanup 常量一致（短信 ${days('SMS_TEXT_RETENTION_DAYS')} 天、事件 ${days('SMS_EVENT_RETENTION_DAYS')} 天）`)
  ok(keep.includes('条款同意记录') && keep.includes('IP 地址') && keep.includes('随订单记录保存'), '写明条款同意记录（含 IP）随订单保存')
  const privacy = read('src/app/(shop)/privacy/page.tsx')
  ok(privacy.includes('条款同意记录') && privacy.includes('随订单记录保存') && privacy.includes('IP 地址、浏览器标识'), '隐私政策写了条款同意记录与保存期')
}

console.log('\n【lib/jiema/consent：留痕 detail】')
{
  const d = consentDetail({ terms: 'T', walletTerms: 'W' }, { ip: ' 203.0.113.9 ', ua: `A\nB\u0007${'x'.repeat(400)}` })
  ok(d.ip === '203.0.113.9' && !!d.ua && d.ua.length === 200 && d.ua.endsWith('…') && !/[\n\u0007]/.test(d.ua), 'IP 去空白；UA 去控制字符、截到 200 字符')
  ok(consentDetail({ terms: 'T', walletTerms: 'W' }, { ip: 'unknown', ua: '' }).ip === null && consentDetail({ terms: 'T', walletTerms: 'W' }, null).ua === null, "拿不到 IP（'unknown'）/ 没有 UA → null")
  ok(JSON.stringify(consentDetail({ terms: '2026-09-30', walletTerms: '2026-09-29' }, { ip: 'f'.repeat(200), ua: 'u'.repeat(900) })).length < 1000, '最长的 detail 也放得进 sms_events.detail（1000）')
  const back = parseConsentDetail(JSON.stringify(d))
  ok(!!back && back.terms === 'T' && back.walletTerms === 'W' && back.ip === d.ip && back.ua === d.ua, '解析往返一致')
  ok(parseConsentDetail('not json') === null && parseConsentDetail(null) === null && parseConsentDetail('{"x":1}') === null, '解析不了返回 null（不抛）')
  ok(TERMS_AGREED_EVENT === 'TERMS_AGREED' && KEEP_EVENT_TYPES.includes(TERMS_AGREED_EVENT), 'TERMS_AGREED 不按 180 天清理')
}

console.log('\n【ui：409 TERMS 之后怎么办、付款摘要、条款更新提示】')
{
  const cur = { jiema: '2026-09-30', wallet: '2026-09-29' }
  ok(termsReaction({ termsVersion: '2026-09-30', walletTermsVersion: '2026-09-29' }, cur) === 'REOPEN', '版本一致（没勾同意 / 缺字段）→ 重新弹窗')
  ok(termsReaction({ termsVersion: '2026-10-01', walletTermsVersion: '2026-09-29' }, cur) === 'RELOAD', '服务端条款更新了 → 刷新页面')
  ok(termsReaction({ termsVersion: '2026-09-30', walletTermsVersion: '2026-10-01' }, cur) === 'RELOAD', '服务端余额规则更新了 → 刷新页面')
  ok(termsReaction(null, cur) === 'REOPEN' && termsReaction({}, cur) === 'REOPEN', '服务端没带版本 → 重新弹窗')
  ok(payPlanSummary({ mode: 'BALANCE', balanceCents: 170, alipayCents: 0 }) === '余额付清 ¥1.70', '余额付清摘要')
  ok(payPlanSummary({ mode: 'MIXED', balanceCents: 120, alipayCents: 50 }) === '余额 ¥1.20 + 支付宝 ¥0.50', '组合摘要')
  ok(payPlanSummary({ mode: 'ALIPAY', balanceCents: 0, alipayCents: 170 }) === '支付宝 ¥1.70', '支付宝摘要')
  ok(termsChangedSinceLast({ jiema: '2026-09-29', wallet: '2026-09-29' }, cur) && !termsChangedSinceLast(null, cur), '上一单是旧版 → 弹窗提示「条款已更新」；首单不提示')
}

console.log('\n【源码：弹窗在付款之前、服务端强制、页面链接】')
{
  const panel = read('src/app/(shop)/jiema/checkout-panel.tsx')
  ok(/onClick=\{askConsent\}/.test(panel) && !/onClick=\{\(\) => void submit\(\)\}/.test(panel), '确认面板底栏按钮先弹窗（askConsent），不直接提交')
  ok(panel.includes('<ConsentDialog') && /if \(!agreed\.current\) \{/.test(panel) && /agreed\.current = true/.test(panel), '只有弹窗里「同意并下单」之后 submit 才提交（agreed 兜底）')
  ok(/agree: true,\s*\n\s*termsVersion: JIEMA_TERMS_VERSION,\s*\n\s*walletTermsVersion: WALLET_TERMS_VERSION/.test(panel), '提交带 agree + 两份条款版本')
  ok(!panel.includes('termsPreTicked') && !panel.includes('首单必勾'), '面板里不再有「首单必勾 / 默认勾选」')
  ok(panel.includes("termsReaction(d, { jiema: JIEMA_TERMS_VERSION, wallet: WALLET_TERMS_VERSION })"), '409 TERMS 按 termsReaction 分刷新 / 重新弹窗')
  const dlg = read('src/app/(shop)/jiema/consent-dialog.tsx')
  ok(/useState\(false\)/.test(dlg) && /disabled=\{!checked\}/.test(dlg) && dlg.includes('{CONSENT_CHECKBOX}'), '弹窗默认不勾；勾选后「同意并下单」才可点')
  ok(dlg.includes('下单即表示你已阅读并同意') && dlg.includes('JIEMA_TERMS_TITLE') && dlg.includes('LEGAL_ARTICLES.map') && dlg.includes('JIEMA_DISCLAIMER.map'), '弹窗：标题下注明「下单即表示你已阅读并同意《短信接码服务条款》」，列出免责声明与法条')
  ok(dlg.includes("maxHeight: 'min(calc(100dvh - 16px), 880px)'") && dlg.includes('min-h-0 flex-1') && dlg.includes('overflow-y-auto'), '弹窗限高、正文滚动、底栏钉住（09-24 事故教训）')
  ok(dlg.includes('同意并下单') && dlg.includes('取消'), '两个按钮：取消 / 同意并下单')
  const route = read('src/app/api/jiema/orders/route.ts')
  ok(/agree: z\.boolean\(\)\.nullable\(\)\.optional\(\)/.test(route) && /termsVersion: z\.string\(\)\.max\(16\)\.nullable\(\)\.optional\(\)/.test(route), '下单接口：同意标记与版本号在 zod 里可缺（缺了由下单逻辑回 409，不是 400）')
  ok(route.includes("consent: { ip: clientIp(request.headers), ua: request.headers.get('user-agent') }"), '下单接口把 IP / UA 交给下单事务留痕')
  const ord = read('src/lib/jiema/order.ts')
  const iTerms = ord.indexOf('if (input.agree !== true || input.termsVersion == null || input.walletTermsVersion == null) {')
  const iIdem = ord.indexOf('// 3. 幂等')
  ok(iTerms > 0 && iIdem > iTerms, '下单逻辑：先核对同意与版本，再做幂等（旧页面带旧版本重放也是 409）')
  ok(/type: TERMS_AGREED_EVENT,/.test(ord) && ord.indexOf('type: TERMS_AGREED_EVENT') < ord.indexOf('{ isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }'), 'TERMS_AGREED 在下单事务里写')
  const jiemaPage = read('src/app/(shop)/jiema/page.tsx')
  const terms = read('src/app/(shop)/terms/page.tsx')
  ok(jiemaPage.includes('href={JIEMA_TERMS_PATH}') && terms.includes('href={JIEMA_TERMS_PATH}'), '/jiema 页尾与 /terms 链到 /jiema/terms')
  ok(fs.existsSync(path.join(ROOT, 'src/app/(shop)/jiema/terms/page.tsx')), '/jiema/terms 页面在 (shop)/jiema 页面组里（layout 的 notFoundOnChannel 覆盖）')
  const admin = read('src/app/admin/jiema/orders-tab.tsx')
  ok(admin.includes('d.consent') && admin.includes('条款同意'), '后台订单详情显示条款同意留痕')
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
if (fail) {
  console.log('有失败 ❌')
  process.exit(1)
}
console.log('全部通过 ✅')

/**
 * 短信接码 · 《短信接码服务条款》与付款前免责弹窗的纯函数 / 源码检查（不连库、不调上游）。docs/短信接码-设计.md §1.8、§8.4、§8.6：
 *
 *   npx tsx scripts/check-jiema-terms.ts
 *
 * 覆盖：
 *   · 「改一句条款就升版本」（§8.4 ④）：条款正文（第一节五条 + jiema-legal.ts 全部常量）与《余额与充值规则》各算一个指纹，
 *     必须等于按当前版本号登记的指纹——只改正文不升版本、或升了版本不登记，这里直接失败；
 *   · 法条：对买家只列约束买家自身行为的 12 条（刑法 287 之二 / 287 之一 / 253 之一 / 266，反电诈法 25 / 26 / 31 / 38 / 42 / 44，网络安全法 46 / 48）；
 *     两高解释 11 / 12、两高一部意见 5（讲的是怎么认定平台「明知」「情节严重」）**不得**出现在买家看得到的任何常量里（2026-09-30 评审修复）；
 *     每条都有要点、原文、版本信息、官方来源（只认 npc.gov.cn / flk.npc.gov.cn）；写明「现行有效」并带国家法律法规数据库的现行文本链接；
 *     关键原文逐字抽查；要点的刑罚写全（罚金不漏）；网络安全法写的是 2025 修正后的条号并注明修正前条号；
 *   · 免责措辞：不出现「不承担任何责任」「概不负责」、平台自己「冻结」、「不知悉」「不控制」、排他的「仅用于学习交流」、自称「租用」；
 *     「与本平台无关」一律带「平台依法应当履行的义务除外」；免责原因不含「运营商或者上游服务原因」；赔偿不含「被有关部门处罚」；
 *     暂停余额有 30 日上限、终止后剩余余额退还；免责声明第 6 条带人身损害与故意 / 重大过失的除外；红框有「重点条款提示」；
 *   · 醒目提示：免除或者减轻平台责任、加重你的责任、限制你的权利的条款标了 strong（第一节 2、3，三.1，四，五.1、五.4，六.1、六.2，管辖）；
 *   · 用途限制清单齐全；记录留存一节不写天数（以隐私政策为准）；隐私政策的保存期与 cleanup 常量一致、事件记录不少于六个月、同意记录的 IP / UA 3 年；
 *   · lib/jiema/consent：留痕 detail 的截断与解析、TERMS_AGREED 不清理、到期清除 IP / UA；ui：409 TERMS 之后刷新还是重新弹窗、付款摘要；
 *   · 源码：确认面板的按钮先弹窗（不直接提交）、弹窗默认不勾、勾了才能点、限高滚动（dvh 带 100vh 兜底）、要点标「非原文」、加粗渲染；
 *     下单接口缺字段按 409（zod 可选）、带 IP / UA；下单逻辑先核对同意再做幂等、同一事务写 TERMS_AGREED；/jiema、/terms 链到 /jiema/terms；
 *     /terms 第五节的「包括短信接码」只在 showJiema 时出现；/jiema/terms 有举报入口、客服页链过去。
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { JIEMA_TERMS, JIEMA_TERMS_PATH, JIEMA_TERMS_STRONG, JIEMA_TERMS_TITLE, JIEMA_TERMS_VERSION, WALLET_TERMS, WALLET_TERMS_TITLE, WALLET_TERMS_VERSION } from '../src/lib/terms/jiema-wallet'
import {
  CONSENT_CHECKBOX,
  CONSENT_TITLE,
  GIST_LABEL,
  GIST_NOTE,
  JIEMA_DISCLAIMER,
  JIEMA_TERMS_SECTIONS,
  LEGAL_ARTICLES,
  LEGAL_NOTE,
  STRONG_NOTE,
  TERMS_MISC,
  articleLabel,
  isStrong,
  itemText,
} from '../src/lib/terms/jiema-legal'
import { CONSENT_META_MARKERS, CONSENT_META_RETENTION_DAYS, KEEP_EVENT_TYPES, TERMS_AGREED_EVENT, consentDetail, hasConsentMeta, parseConsentDetail, stripConsentMeta } from '../src/lib/jiema/consent'
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
  '2026-09-30': 'fc3ef48e5982aa84', // 评审前的草稿（8ebd721），没有上线过
  '2026-10-01': '67543623d79257bd',
}
const WALLET_FINGERPRINTS: Record<string, string> = {
  '2026-09-29': '53123bc3672693a5',
}

console.log('\n【§8.4 ④ 改一句条款就升版本：正文指纹与版本号登记一致】')
{
  const jiemaBody = { JIEMA_TERMS_TITLE, JIEMA_TERMS, JIEMA_TERMS_STRONG, CONSENT_TITLE, CONSENT_CHECKBOX, STRONG_NOTE, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, TERMS_MISC, LEGAL_NOTE, GIST_NOTE, GIST_LABEL, LEGAL_ARTICLES }
  const walletBody = { WALLET_TERMS_TITLE, WALLET_TERMS }
  const jf = sha(jiemaBody)
  const wf = sha(walletBody)
  ok(/^\d{4}-\d{2}-\d{2}$/.test(JIEMA_TERMS_VERSION) && JIEMA_TERMS_VERSION >= '2026-10-01', `《短信接码服务条款》版本是日期且不早于 2026-10-01（2026-09-30 是没上线的草稿，评审修复后升版；当前 ${JIEMA_TERMS_VERSION}）`)
  ok(JIEMA_FINGERPRINTS[JIEMA_TERMS_VERSION] === jf, `《短信接码服务条款》正文指纹 ${jf} 已按版本 ${JIEMA_TERMS_VERSION} 登记`, JIEMA_FINGERPRINTS[JIEMA_TERMS_VERSION] ? '正文改了但版本号没升？升 JIEMA_TERMS_VERSION 并登记新指纹' : '升了版本号还没登记指纹')
  ok(WALLET_FINGERPRINTS[WALLET_TERMS_VERSION] === wf, `《余额与充值规则》正文指纹 ${wf} 已按版本 ${WALLET_TERMS_VERSION} 登记（本次没改这一份）`, '正文改了但 WALLET_TERMS_VERSION 没升？')
  ok(JIEMA_TERMS_TITLE === '短信接码服务条款' && JIEMA_TERMS_PATH === '/jiema/terms', '标题《短信接码服务条款》，全文页 /jiema/terms')
  ok(JIEMA_TERMS.length === 5, '第一节仍是五条（条款页第四节与 /jiema/terms 第一节共用）')
}

console.log('\n【法条：只列约束买家的 12 条、官方来源、原文抽查、要点标注】')
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
    ['fz-26', '反电信网络诈骗法第二十六条（依法调取证据时的协助义务）'],
    ['fz-42', '反电信网络诈骗法第四十二条（违反第二十五条第一款的法律责任）'],
  ]
  for (const [id, name] of need) ok(ids.has(id), `有 ${name}`)
  ok(ids.size === LEGAL_ARTICLES.length && LEGAL_ARTICLES.length === need.length, `id 不重复，恰好 ${need.length} 条（${LEGAL_ARTICLES.length}）`)
  ok(!ids.has('sj-11') && !ids.has('sj-12') && !ids.has('yj-5'), '不对买家展示法释〔2019〕15号第十一、十二条与法发〔2025〕12号第5条（讲的是怎么认定平台明知 / 情节严重，只留在设计文档 §8.6 供律师评审）')
  const buyerAll = JSON.stringify({ JIEMA_TERMS, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, TERMS_MISC, LEGAL_NOTE, GIST_NOTE, LEGAL_ARTICLES, STRONG_NOTE })
  ok(!/法释〔2019〕15号|法发〔2025〕12号|批量接收提供短信验证|情节严重”|三个以上对象/.test(buyerAll), '买家看得到的常量里没有两高解释 / 意见的文号与认定标准')
  // 只认官方来源：国家法律法规数据库、中国人大网（司法解释已不对买家展示，最高法 / 最高检的链接不再出现）
  const OFFICIAL = /^https?:\/\/(www\.|flk\.)?npc\.gov\.cn\//
  // 国家法律法规数据库详情页：id 是库里的 32 位 bbbs，title 是编码后的法律名称（详情页拿它当标签页标题）
  const FLK = /^https:\/\/flk\.npc\.gov\.cn\/detail\?id=[0-9a-f]{32}&title=(%[0-9A-F]{2})+$/
  for (const a of LEGAL_ARTICLES) {
    ok(
      a.law.startsWith('《') && a.article.startsWith('第') && a.topic.length > 0 && a.gist.length > 10 && a.text.length > 0 && a.text.every((x) => x.length > 0 && !/^[“”"]/.test(x)) && a.version.length > 10 && OFFICIAL.test(a.source.url),
      `${articleLabel(a)}：要点、原文（不带引号残留）、版本、官方来源齐全`,
      a.source.url,
    )
  }
  for (const a of LEGAL_ARTICLES) {
    ok(
      a.version.includes('现行有效') && (FLK.test(a.source.url) || (!!a.current && FLK.test(a.current.url) && a.current.name.startsWith('国家法律法规数据库'))),
      `${articleLabel(a)}：写明现行有效，并链到国家法律法规数据库的现行文本`,
    )
  }
  const art = (id: string) => LEGAL_ARTICLES.find((a) => a.id === id)!
  ok(['xf-287-2', 'xf-287-1', 'xf-253-1', 'xf-266'].every((id) => art(id).version.includes('《中华人民共和国刑法修正案（十二）》') && art(id).version.includes('未修改本条')), '刑法四条：注明最近一次修正（修正案十二）未修改本条')
  ok(art('xf-287-2').text[0] === '明知他人利用信息网络实施犯罪，为其犯罪提供互联网接入、服务器托管、网络存储、通讯传输等技术支持，或者提供广告推广、支付结算等帮助，情节严重的，处三年以下有期徒刑或者拘役，并处或者单处罚金。', '287 之二第一款逐字')
  ok(art('fz-31').text[0].includes('短信端口') && art('fz-31').text[0].includes('不得提供实名核验帮助') && art('fz-31').text[0].includes('互联网账号'), '反电诈法第三十一条：短信端口、互联网账号、实名核验帮助')
  ok(art('fz-44').text[0].startsWith('违反本法第三十一条第一款规定的') && art('fz-42').text[0].includes('第二十五条第一款'), '第四十四条对应第三十一条、第四十二条对应第二十五条')
  ok(art('wa-48').article.includes('修正前为第四十六条') && art('wa-46').article.includes('修正前为第四十四条') && art('wa-48').version.includes('2025年10月28日') && art('wa-48').version.includes('2026年1月1日'), '网络安全法按 2025 修正后的条号，并注明修正前条号与施行日期')
  ok(art('xf-253-1').gist.includes('并处或者单处罚金') && art('xf-253-1').gist.includes('三年以上七年以下有期徒刑，并处罚金'), '要点：第二百五十三条之一的刑罚写全（两档都带罚金）')
  ok(art('xf-266').gist.includes('数额巨大或者有其他严重情节的，处三年以上十年以下有期徒刑，并处罚金') && art('xf-266').gist.includes('没收财产') && art('xf-266').gist.includes('并处或者单处罚金'), '要点：第二百六十六条三档刑罚与罚金、没收财产写全')
  ok(art('xf-287-2').gist.includes('广告推广、支付结算等帮助'), '要点：第二百八十七条之二写「提供广告推广、支付结算等帮助」（与原文一致，不写成「其他帮助」）')
  ok(LEGAL_ARTICLES.every((a) => !/罚金/.test(a.text.join('')) || /罚金/.test(a.gist)) && LEGAL_ARTICLES.every((a) => !/罚款/.test(a.text.join('')) || /罚款/.test(a.gist)), '要点：原文有罚金 / 罚款的，要点里也有')
  ok(GIST_LABEL === '要点（非原文）：' && GIST_NOTE.includes('不是条文原文') && LEGAL_NOTE.startsWith('条文原文逐字摘自'), '要点标「非原文」，第七节说明写的是「条文原文逐字摘自…」')
  ok(LEGAL_NOTE.includes('flk.npc.gov.cn') && LEGAL_NOTE.includes('不构成法律意见'), '第七节说明：以国家法律法规数据库现行文本为准、不构成法律意见')
}

console.log('\n【免责措辞与用途限制】')
{
  const all = [JIEMA_TERMS, JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS.flatMap((s) => [s.heading, s.lead ?? '', ...s.items.map(itemText)]), TERMS_MISC.map(itemText)].flat().join('\n')
  const sec = (id: string) => JIEMA_TERMS_SECTIONS.find((s) => s.id === id)!
  ok(!/不承担任何责任|概不负责|一概不负责|不负任何责任/.test(all), '不出现「不承担任何责任」「概不负责」这类会被认定无效的写法')
  ok(!all.replace(/有关部门依法要求冻结/g, '').includes('冻结'), '对买家的处置写「暂停……使用」，平台自己不「冻结」（冻结只出现在「有关部门依法要求冻结」）')
  ok(!/不知悉|不控制/.test(all), '不写「不知悉」「不控制」（订单记着目标服务、平台会限额封禁，与事实不符）')
  ok(!/仅用于学习交流/.test(all) && all.includes('仅限用于学习交流、软件开发测试，以及为你本人合法注册、验证账号等合法用途'), '用途：不写排他的「仅用于学习交流」，写「仅限用于学习交流、软件开发测试，以及为你本人合法注册、验证账号等合法用途」')
  ok(!all.includes('租用') && all.includes('临时分配号码并转发该号码收到的短信') && all.includes('你不取得号码的所有权或者长期使用权'), '自身服务写「临时分配号码并转发短信」，不写「租用」（反电诈法第三十一条的禁止性用语）')
  const unrelated = all.split('与本平台无关').length - 1
  ok(unrelated >= 3 && all.split('与本平台无关（平台依法应当履行的义务除外）').length - 1 === unrelated, `「与本平台无关」出现 ${unrelated} 次，每次都带「（平台依法应当履行的义务除外）」`)
  ok(!/运营商或者上游服务原因[^。；]*不承担/.test(all) && itemText(sec('liability').items[1]).includes('因运营商或者上游服务原因没有收到短信的，按第一节全额退回'), '六.2：上游是平台自己的供应商，不列进免责原因；上游原因没收到短信的全额退回')
  ok(!all.includes('被有关部门处罚') && itemText(sec('responsibility').items[2]).includes('第三方索赔或者其他直接损失'), '四.3：赔偿不含平台自己被行政处罚的罚款')
  ok(JIEMA_DISCLAIMER[5].includes('造成你人身损害的责任，以及因平台故意或者重大过失造成你财产损失的责任除外'), '免责声明第 6 条（以实付为限）带民法典第五百零六条的除外')
  const e1 = itemText(sec('enforcement').items[0])
  ok(e1.includes('暂停最长不超过 30 日') && e1.includes('将剩余余额（含充值余额）按原付款途径或者双方协商的方式退还') && JIEMA_DISCLAIMER[4].includes('最长 30 日'), '五.1：暂停余额最长 30 日；核实违法违约终止服务的，剩余余额扣除损失后退还')
  ok(JIEMA_DISCLAIMER[6].startsWith('重点条款提示') && ['不承担赔偿责任', '你应当赔偿', '封禁账号', '经营者所在地有管辖权的人民法院', '不退回支付宝'].every((k) => JIEMA_DISCLAIMER[6].includes(k)), '红框最后一条「重点条款提示」：退款去向、不赔偿的情形、赔偿义务、暂停余额与封禁、管辖法院')
  ok(all.includes('造成你人身损害的责任') && all.includes('因平台故意或者重大过失造成你财产损失的责任'), '责任限制不排除人身损害与故意 / 重大过失造成的财产损失')
  ok(all.includes('经核实不存在上述情形的，平台恢复服务与余额的使用'), '暂停之后查明没有违法违约的，恢复服务与余额')
  const strongs = [...JIEMA_TERMS_SECTIONS.flatMap((s) => s.items), ...TERMS_MISC].filter(isStrong).map(itemText)
  ok(
    [sec('study').items[0], ...sec('responsibility').items, sec('enforcement').items[0], sec('enforcement').items[3], sec('liability').items[0], sec('liability').items[1], TERMS_MISC[1]].every(isStrong) &&
      JSON.stringify(JIEMA_TERMS_STRONG) === '[1,2]' &&
      itemText(TERMS_MISC[1]).includes('经营者所在地有管辖权的人民法院'),
    `醒目提示：免责、赔偿、暂停与封禁、限额、管辖与第一节第 2、3 条标了加粗（共 ${strongs.length + JIEMA_TERMS_STRONG.length} 条）`,
  )
  ok(STRONG_NOTE.includes('请你重点阅读'), '全文开头提示加粗标色的条款')
  for (const k of ['学习交流', '测试', '与本平台无关', '自行承担', '帮助信息网络犯罪活动罪', '公安机关', '在法律允许的范围内', '不排除或者限制依法不得排除或者限制的责任', '依法调取证据', '本条款不减轻平台依法应当履行的义务'])
    ok(all.includes(k), `写明「${k}」`)
  const usage = sec('usage').items.map(itemText).join('')
  for (const k of ['电信网络诈骗', '赌博', '洗钱', '公民个人信息', '批量注册', '养号', '出售、出租、出借', '冒用他人身份', '实名核验', '转售', '批量调用', '其他违反中华人民共和国法律法规'])
    ok(usage.includes(k), `用途限制含「${k}」`)
  ok(CONSENT_CHECKBOX === '我已阅读并同意上述条款，承诺不将本服务用于任何违法犯罪活动，并自行承担使用后果', '弹窗勾选文案逐字')
  ok(CONSENT_TITLE === '下单须知与免责声明', '弹窗标题')
  const cleanup = read('src/app/api/cron/cleanup/route.ts')
  const days = (name: string) => Number(new RegExp(`const ${name} = (\\d+)`).exec(cleanup)?.[1])
  const keep = sec('enforcement').items.map(itemText).join('')
  ok(!/\d+ ?天/.test(all) && keep.includes('各类记录的保存期限以《隐私政策》为准'), '条款里不写死保存天数（以隐私政策为准：改天数不用升条款版本）')
  ok(keep.includes('条款同意记录') && keep.includes('IP 地址'), '写明留存条款同意记录（含 IP）')
  const ev = days('SMS_EVENT_RETENTION_DAYS')
  ok(ev >= 184, `接码事件保存 ${ev} 天 ≥ 184（网络安全法第二十三条「不少于六个月」：最长的六个月区间 184 天）`)
  ok(CONSENT_META_RETENTION_DAYS >= 1095, `同意记录的 IP / UA 保存 ${CONSENT_META_RETENTION_DAYS} 天（3 年）`)
  const privacy = read('src/app/(shop)/privacy/page.tsx').replace(/\s+/g, ' ')
  ok(
    privacy.includes(`保存 ${days('SMS_TEXT_RETENTION_DAYS')} 天后清空`) && privacy.includes(`接码过程的事件记录保存 ${ev} 天（不少于六个月）`) && privacy.includes('IP 地址与浏览器标识自下单之日起保存 3 年，到期清除'),
    `隐私政策与 cleanup 常量一致：短信 ${days('SMS_TEXT_RETENTION_DAYS')} 天、事件 ${ev} 天、同意记录的 IP / UA 3 年`,
  )
  ok(cleanup.includes('await purgeExpiredConsentMeta(now)'), 'cleanup 每天清除到期同意记录里的 IP / UA')
  ok(!/PRIVACY_UPDATED_AT = '2026-09-30'/.test(read('src/lib/legal.ts')), '隐私政策改了正文，PRIVACY_UPDATED_AT 不再是 2026-09-30（生产当天已有两版正文）')
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
  ok(TERMS_AGREED_EVENT === 'TERMS_AGREED' && KEEP_EVENT_TYPES.includes(TERMS_AGREED_EVENT), 'TERMS_AGREED 不按接码事件的保存期清理')
  const full = JSON.stringify(consentDetail({ terms: '2026-10-01', walletTerms: '2026-09-29' }, { ip: '198.51.100.7', ua: 'Mozilla "quoted" UA' }))
  const stripped = stripConsentMeta(full)
  const sb = parseConsentDetail(stripped)
  ok(hasConsentMeta(full) && !hasConsentMeta(stripped) && !!sb && sb.terms === '2026-10-01' && sb.walletTerms === '2026-09-29' && sb.ip === null && sb.ua === null, '到期清除：ip / ua 清成 null，版本留着，清完不再带特征')
  const broken = '{"terms":"x","ip":"1.2.3.4","ua":"abc\\"def…'
  ok(stripConsentMeta(broken) !== null && !hasConsentMeta(stripConsentMeta(broken)) && stripConsentMeta(null) === null, '解析不了的 detail 按正则清掉两个值，保证 cleanup 不会反复圈到同一行')
  ok(CONSENT_META_MARKERS.length === 2 && !hasConsentMeta(JSON.stringify(consentDetail({ terms: 'T', walletTerms: 'W' }, null))), '没有 IP / UA 的留痕不需要清')
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
  ok(dlg.includes('max-h-[min(calc(100vh_-_16px),880px)]'), '不支持 dvh 的浏览器：class 里有 100vh 的限高兜底（内联 dvh 被整条丢掉时卡片不会长到内容全高）')
  ok(dlg.includes('{GIST_LABEL}') && /italic/.test(dlg) && dlg.includes('{GIST_NOTE}'), '法条折叠时的要点前标「要点（非原文）」、换斜体样式，说明里写明不是原文')
  ok(dlg.includes('{STRONG_NOTE}') && dlg.includes('isStrong(it)') && dlg.includes('JIEMA_TERMS_STRONG.includes(i)'), '弹窗全文：加粗标色渲染 strong 条款')
  const jt = read('src/app/(shop)/jiema/terms/page.tsx')
  ok(jt.includes('{STRONG_NOTE}') && jt.includes('isStrong(it)') && jt.includes('JIEMA_TERMS_STRONG.includes(i)'), '/jiema/terms：加粗标色渲染 strong 条款')
  ok(jt.includes('id="report"') && jt.includes('举报违法使用') && jt.includes('110'), '/jiema/terms 有举报入口（#report）')
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
  ok(terms.includes("{showJiema && '（包括短信接码的号码与验证码）'}") && (terms.match(/短信接码的号码与验证码/g) ?? []).length === 1, '/terms 第五节的「包括短信接码的号码与验证码」只在 showJiema 时出现（渠道站与灰度期不提接码）')
  ok(terms.includes('JIEMA_TERMS_STRONG.includes(i)'), '/terms 第四节接码五条里限制权利的两条加粗')
  const panelTxt = read('src/app/(shop)/jiema/checkout-panel.tsx') + jiemaPage + jt
  ok(!/仅用于学习交流|仅供学习交流/.test(panelTxt), '确认面板、/jiema、/jiema/terms 不再写排他的「仅用于学习交流」')
  ok(!read('src/lib/support-faq.ts').includes('你要注册的平台'), 'FAQ「其他服务」写「你要接收验证码的平台」')
  ok(read('src/app/(shop)/support/jiema-zone.tsx').includes('/jiema/terms#report'), '客服页接码分区链到举报入口')
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

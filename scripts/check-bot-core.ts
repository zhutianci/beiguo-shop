/**
 * 微信机器人核心纯函数自测（docs/微信机器人-设计.md §5.4、§7.4、§7.6、§11.2、§16 测试表）。**不连数据库**。
 *   npx tsx scripts/check-bot-core.ts
 *
 * 覆盖：脱敏与网址中性化、分站群黑名单、消息渲染（逐字）、订阅默认值与类别归属、指令解析（全角 / 括号 / @ / 价格 / 免打扰）、
 * 免打扰顺延、渠道通知回扫水位、协议回调解析（三道闸里「真 @」「发送人来自协议」两道的输入）、渠道快速回复令牌、指令注册表约束。
 * 特殊字符一律用 String.fromCharCode 拼，源码里不出现不可见字符。
 */
import { maskCardLike, maskEmails, maskPhones, dropEmails, neutralizeUrls, oneLine, sanitizeSystemValue, sanitizeUserText, tenantBlacklistHit, truncate } from '../src/lib/bot/mask'
import { absoluteLink, bjMinute, fitLines, MAX_MESSAGE_CHARS, renderDigest, renderEventText, summaryLine, yuan } from '../src/lib/bot/render'
import { categoryDefaultOn, DIRECT_EVENT_DEFS, isSubscribed, NOTIFY_EVENT_DEFS, TENANT_NOTICE_DEFS } from '../src/lib/bot/events/catalog'
import { MGMT_CATEGORIES, TENANT_CATEGORIES, type BotCategory } from '../src/lib/bot/types'
import { fmtMinuteOfDay, parseCommandText, parsePositiveInt, parsePrice, parseQuietRange, stripLeadingMentions, toHalfWidth } from '../src/lib/bot/commands/parse'
import { quietUntil } from '../src/lib/bot/outbox'
import { lowerBound, pruneMarks } from '../src/lib/bot/scan'
import { parseAtUserList, parseWxpadMessage } from '../src/lib/bot/adapters/wxpad'
import { issueTenantReplyToken, verifyTenantReplyToken } from '../src/lib/bot/tenant-reply'
import { assertRegistry, COMMANDS, findCommand } from '../src/lib/bot/commands/index'
import { normalizeBotConfig, DEFAULT_BOT_CONFIG } from '../src/lib/bot/config'
import { stripBrackets } from '../src/lib/bot/resolve-site'
import type { BotCommandDef } from '../src/lib/bot/commands/types'
import { renderIssueReceipt } from '../src/lib/bot/ops/issue'
import { looksLikeOrderNo } from '../src/lib/bot/ops/refill'
import { defaultRestockBatch } from '../src/lib/bot/ops/restock'

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
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  ok(name, g === w, `得到 ${g}，应为 ${w}`)
}
function throws(name: string, fn: () => unknown) {
  try {
    fn()
    ok(name, false, '没有抛错')
  } catch {
    ok(name, true)
  }
}

const SP2005 = String.fromCharCode(0x2005) // 微信「@昵称」后面自动插的四分之一空格
const ZWSP = String.fromCharCode(0x200b)
const RLO = String.fromCharCode(0x202e)
const LS = String.fromCharCode(0x2028)
const IDSP = String.fromCharCode(0x3000) // 全角空格

process.env.JWT_SECRET = 'check-bot-core-secret-0123456789abcdef0123456789abcdef'

console.log('\n脱敏与清洗：')
{
  eq('换行、制表压成空格', oneLine('a\nb\r\nc\td'), 'a b c d')
  eq('去掉方向控制、零宽、行分隔符', oneLine(`x${RLO}y${ZWSP}z${LS}w`), 'xyzw')
  eq('超长截断加省略号（按字符数，不切坏汉字）', oneLine('一二三四五六', 4), '一二三四…')
  eq('truncate 不超长原样返回', truncate('abc', 3), 'abc')
  eq('邮箱打码保留前两位与域名', maskEmails('联系 abcdef@qq.com 谢谢'), '联系 ab***@qq.com 谢谢')
  eq('两位本地部分只留一位', maskEmails('ab@qq.com'), 'a***@qq.com')
  eq('一位本地部分', maskEmails('a@qq.com'), 'a***@qq.com')
  eq('分站群直接去邮箱', dropEmails('买家 abc@gmail.com'), '买家 [邮箱已隐藏]')
  eq('手机号打码', maskPhones('电话13812345678。'), '电话138****5678。')
  eq('订单号里的数字串不误伤', maskPhones('订单 202610051381234567890'), '订单 202610051381234567890')
  eq('疑似卡密只留首尾 4 位', maskCardLike('卡密 9D8WA-AVOBY-PJ5P5 发你'), '卡密 9D8W…J5P5 发你')
  eq('纯数字长串不当卡密', maskCardLike('123456789012345'), '123456789012345')
  eq('纯字母长串不当卡密', maskCardLike('abcdefghijklmnop'), 'abcdefghijklmnop')
  eq('短串不动', maskCardLike('abc123'), 'abc123')
  eq('带协议的网址中性化', neutralizeUrls('看 https://evil.com/x'), `看 https:${ZWSP}//evil[.]com/x`)
  eq('www 开头的网址中性化', neutralizeUrls('www.evil.com'), 'www[.]evil[.]com')
  eq('带路径的裸域名中性化', neutralizeUrls('evil.cn/pay'), 'evil[.]cn/pay')
  eq('普通句子里的点不动', neutralizeUrls('版本1.5，hello.world 不是链接'), '版本1.5，hello.world 不是链接')
  const u = sanitizeUserText('加我 abc@qq.com 13812345678 https://x.com/a 卡 9D8WA-AVOBY-PJ5P5', { dropEmail: true })
  ok('买家文本：邮箱去掉', u.includes('[邮箱已隐藏]') && !u.includes('abc@qq.com'), u)
  ok('买家文本：手机打码', u.includes('138****5678'), u)
  ok('买家文本：网址失效', u.includes('x[.]com') && !u.includes('https://x.com'), u)
  ok('买家文本：卡密打码', u.includes('9D8W…J5P5') && !u.includes('AVOBY'), u)
  const longUrl = '看这里 https://evil-phishing-site.example/pay?x=1 快点'
  ok('买家文本截在网址中间：仍然中性化', !/https?:\/\//.test(sanitizeUserText(longUrl, { max: 20 })), sanitizeUserText(longUrl, { max: 20 }))
  const cutEmail = sanitizeSystemValue('客户 someone@example.com 已付款', { max: 10, dropEmail: true })
  ok('系统字段截在邮箱中间：本地部分不漏', !cutEmail.includes('someone'), cutEmail)
  eq('系统字段：单行 + 邮箱打码 + 手机打码（不动卡密形状的订单号）', sanitizeSystemValue('单号 ABCD1234EFGH5678\nabc@qq.com 13812345678'), '单号 ABCD1234EFGH5678 ab***@qq.com 138****5678')
}

console.log('\n分站群黑名单：')
{
  eq('兑换链接（cdk=）', tenantBlacklistHit('https://bigolab.com/redeem/sysa?cdk=9D8WA'), 'cdk')
  eq('财务链接', tenantBlacklistHit('https://bigolab.com/finance/abc'), 'finance-link')
  eq('主站快速回复链接', tenantBlacklistHit('快速回复：https://bigolab.com/reply/12.abc.def'), 'platform-reply-link')
  eq('主站后台链接', tenantBlacklistHit('https://bigolab.com/admin/orders/1'), 'admin-link')
  eq('明文邮箱', tenantBlacklistHit('买家 abc@qq.com'), 'email')
  eq('渠道快速回复链接放行', tenantBlacklistHit('快速回复：https://tibo.pw/partner-reply/AB12CD34EF.5.lzk.abc'), null)
  eq('渠道后台链接放行', tenantBlacklistHit('渠道后台查看：https://tibo.pw/partner/orders/AB12CD34EF'), null)
  eq('打过码的邮箱放行', tenantBlacklistHit('买家 ab***@qq.com'), null)
  eq('administrator 这类词不误伤', tenantBlacklistHit('/administrator'), null)
}

console.log('\n渲染：')
{
  const ev = {
    title: '🛒 新订单（未付款）',
    lines: [
      { label: '订单号', value: 'B2026100500001' },
      { label: '金额', value: '¥150.00' },
      { label: '备注', value: '' },
    ],
    link: '/partner/orders/B2026100500001',
    linkText: null,
  }
  eq(
    '事件逐字（空值行省略、相对链接补域名、默认链接文字）',
    renderEventText(ev, { siteLabel: 'Tibo 小店', origin: 'https://tibo.pw' }),
    '🛒 新订单（未付款）｜Tibo 小店\n订单号：B2026100500001\n金额：¥150.00\n查看：https://tibo.pw/partner/orders/B2026100500001'
  )
  eq('绝对链接原样', absoluteLink('https://a.com/x', 'https://b.com'), 'https://a.com/x')
  eq('相对链接补域名', absoluteLink('/x', 'https://b.com'), 'https://b.com/x')
  eq('不是 / 开头的相对链接丢掉', absoluteLink('javascript:alert(1)', 'https://b.com'), null)
  const many = Array.from({ length: 80 }, (_, i) => `第${i}行：${'内容'.repeat(10)}`)
  const fitted = fitLines(many, '查看：https://bigolab.com/admin')
  ok('超长按行截断、注明其余见后台', fitted.includes('……（其余见后台）'))
  ok('截断后链接行仍在最后', fitted.endsWith('查看：https://bigolab.com/admin'))
  ok('截断后不超过上限（截断提示也算在内）', Array.from(fitted).length <= MAX_MESSAGE_CHARS, String(Array.from(fitted).length))
  for (let n = 880; n <= 905; n++) {
    const t = fitLines(['标题', 'x'.repeat(n - 3)], null)
    if (Array.from(t).length > MAX_MESSAGE_CHARS) ok(`边界 ${n}：不超过上限`, false, String(Array.from(t).length))
  }
  const many2 = Array.from({ length: 40 }, (_, i) => `${i}`.padEnd(29, '字'))
  ok('多行截断（无链接）不超过上限', Array.from(fitLines(many2, null)).length <= MAX_MESSAGE_CHARS)
  eq('合并摘要：北京时间 + 去图标标题 + 第一条非编号值', summaryLine(ev, new Date('2026-10-05T01:02:00Z')), '09:02 新订单（未付款） ¥150.00')
  eq('合并消息', renderDigest('贝果科技', ['09:02 新订单 ¥150.00', '09:03 新订单 ¥160.00'], 3), '🧾 最近 5 条动态｜贝果科技\n· 09:02 新订单 ¥150.00\n· 09:03 新订单 ¥160.00\n· 另有 3 条，见后台')
  eq('北京时间跨日', bjMinute(new Date('2026-10-04T16:30:00Z')), '10-05 00:30')
  eq('金额千分位', yuan(1234.5), '¥1,234.50')
  eq('非法金额', yuan('abc'), '—')
}

console.log('\n事件目录与订阅：')
{
  ok('安全类恒订阅（即使显式退订）', isSubscribed({ security: false }, 'security'))
  ok('显式退订生效', !isSubscribed({ order_new: false }, 'order_new'))
  ok('显式订阅生效', isSubscribed({ order_new: true }, 'order_new'))
  ok('subs 为空走默认', isSubscribed(null, 'order_done'))
  ok('subs 是数组 / 字符串等坏值走默认', isSubscribed([], 'user') && isSubscribed('x', 'user'))
  ok('充值（wallet.topup）沿用现有 opt-in，默认不推', NOTIFY_EVENT_DEFS['wallet.topup'].defaultOn === false)
  for (const c of [...MGMT_CATEGORIES, ...TENANT_CATEGORIES]) ok(`类别「${c}」出厂默认开`, categoryDefaultOn(c))
  const tenantSet = new Set<BotCategory>(TENANT_CATEGORIES)
  const mgmtSet = new Set<BotCategory>(MGMT_CATEGORIES)
  for (const [k, d] of Object.entries(TENANT_NOTICE_DEFS)) ok(`渠道通知 ${k} 的类别分站群可退订`, tenantSet.has(d.category), d.category)
  for (const [k, d] of Object.entries(NOTIFY_EVENT_DEFS)) ok(`主站事件 ${k} 的类别管理群可退订`, mgmtSet.has(d.category), d.category)
  for (const [k, d] of Object.entries(DIRECT_EVENT_DEFS)) {
    const set = k.startsWith('channel.') ? tenantSet : mgmtSet
    ok(`补充事件 ${k} 的类别归属正确`, set.has(d.category), d.category)
  }
  ok('分站群不能订阅平台类别（库存 / 资金异常 / 渠道告警 / 运营 / 安全）', !['stock', 'money_alert', 'channel_alert', 'ops', 'security'].some((c) => tenantSet.has(c as BotCategory)))
}

console.log('\n指令解析：')
{
  eq('全角转半角', toHalfWidth(`＠贝果助手${IDSP}提卡${IDSP}Ｐ１${IDSP}１５０`), '@贝果助手 提卡 P1 150')
  eq('去掉开头的 @机器人', stripLeadingMentions(`@贝果助手${SP2005}提卡 P1 150`), '提卡 P1 150')
  eq('连续多个 @', stripLeadingMentions(`@A${SP2005}@B${SP2005}状态`), '状态')
  eq('只有 @ 没有指令', stripLeadingMentions('@贝果助手'), '')
  eq('「创建 【tibo.pw】」', parseCommandText(`@贝果助手${SP2005}创建 【tibo.pw】`), { name: '创建', args: ['tibo.pw'] })
  eq('指令名不区分大小写', parseCommandText('@贝果助手 HELP')?.name, 'help')
  eq('全角指令与参数（￥ 不在全角 ASCII 段，留给 parsePrice 认）', parseCommandText(`@贝果助手${SP2005}提卡${IDSP}Ｐ１${IDSP}￥１５０`), { name: '提卡', args: ['P1', '￥150'] })
  eq('空消息', parseCommandText(`@贝果助手${SP2005}`), null)
  eq('价格 150', parsePrice('150'), 150)
  eq('价格 ¥150.5', parsePrice('¥150.5'), 150.5)
  eq('价格 ￥150', parsePrice('￥150'), 150)
  eq('价格 150元', parsePrice('150元'), 150)
  eq('价格全角', parsePrice('１５０'), 150)
  eq('价格三位小数拒', parsePrice('150.123'), null)
  eq('价格 0 拒', parsePrice('0'), null)
  eq('价格负数拒', parsePrice('-1'), null)
  eq('价格科学计数拒', parsePrice('1e3'), null)
  eq('价格超过 6 位整数拒', parsePrice('1234567'), null)
  eq('编号 #12', parsePositiveInt('#12'), 12)
  eq('编号 0 拒', parsePositiveInt('0'), null)
  eq('编号带字母拒', parsePositiveInt('12a'), null)
  eq('免打扰 23-8', parseQuietRange('23-8'), { from: 1380, to: 480 })
  eq('免打扰 23:00-08:00', parseQuietRange('23:00-08:00'), { from: 1380, to: 480 })
  eq('免打扰 22:30~7:15', parseQuietRange('22:30~7:15'), { from: 1350, to: 435 })
  eq('免打扰 关', parseQuietRange('关'), 'off')
  eq('免打扰首尾相同拒', parseQuietRange('8-8'), 'bad')
  eq('免打扰小时越界拒', parseQuietRange('25-3'), 'bad')
  eq('分钟转时刻', fmtMinuteOfDay(1380), '23:00')
  eq('去括号', stripBrackets('【tibo.pw】'), 'tibo.pw')
}

console.log('\n免打扰顺延：')
{
  // 23:00–08:00，北京时间 23:30（UTC 15:30）→ 顺延到次日北京 08:00（UTC 00:00）
  eq('跨零点区间内', quietUntil(new Date('2026-10-05T15:30:00Z'), 1380, 480)?.toISOString(), '2026-10-06T00:00:00.000Z')
  eq('区间外不顺延', quietUntil(new Date('2026-10-05T04:00:00Z'), 1380, 480), null)
  // 北京 07:59:30 仍在区间内，顺延到 08:00:00 整
  eq('临近结束顺延到整分', quietUntil(new Date('2026-10-04T23:59:30Z'), 1380, 480)?.toISOString(), '2026-10-05T00:00:00.000Z')
  eq('不跨零点区间（13:00–14:00，北京 13:30）', quietUntil(new Date('2026-10-05T05:30:00Z'), 780, 840)?.toISOString(), '2026-10-05T06:00:00.000Z')
  eq('未设置', quietUntil(new Date(), null, 480), null)
}

console.log('\n渠道通知回扫水位：')
{
  const now = Date.UTC(2026, 9, 5, 12, 0)
  const M = 60_000
  const marks = [
    { t: now - 40 * M, id: 10 },
    { t: now - 20 * M, id: 20 },
    { t: now - 5 * M, id: 30 },
  ]
  eq('下界取 15 分钟前（含）最新的一条', lowerBound(marks, now), 20)
  eq('乱序也一样', lowerBound([marks[2], marks[0], marks[1]], now), 20)
  eq('都不够旧时取最小 id', lowerBound([{ t: now - 5 * M, id: 30 }, { t: now - M, id: 35 }], now), 30)
  eq('没有记录', lowerBound([], now), 0)
  eq(
    '修剪：保留 30 分钟内的，外加一条更早的',
    pruneMarks([{ t: now - 60 * M, id: 1 }, { t: now - 45 * M, id: 2 }, { t: now - 20 * M, id: 3 }, { t: now - M, id: 4 }], now).map((m) => m.id),
    [2, 3, 4]
  )
}

console.log('\n协议回调解析：')
{
  const BOT = 'wxid_bot'
  const base = { msg_id: 1, new_msg_id: '7001', msg_type: 1, create_time: 1_759_629_600 }
  const g = parseWxpadMessage(
    {
      ...base,
      from_user_name: { str: '123@chatroom' },
      to_user_name: { str: BOT },
      content: { str: `wxid_admin:\n@贝果助手${SP2005}状态` },
      msg_source: `<msgsource><atuserlist><![CDATA[,${BOT}]]></atuserlist></msgsource>`,
    },
    BOT
  )
  ok('群消息：发送人取自协议前缀', g?.kind === 'MESSAGE' && g.senderWxid === 'wxid_admin' && g.isGroup, JSON.stringify(g))
  ok('群消息：@ 列表来自 atuserlist', !!g && g.atWxids.includes(BOT) && !g.atAll)
  ok('群消息：去重 ID 优先 new_msg_id', g?.msgId === '7001')
  eq('群消息：正文去掉发送人前缀', g?.text, `@贝果助手${SP2005}状态`)
  const spoof = parseWxpadMessage({ ...base, from_user_name: { str: '123@chatroom' }, content: { str: 'wxid_user:\nwxid_admin:\n状态' }, msg_source: '' }, BOT)
  ok('正文里伪造的发送人前缀不生效', spoof?.senderWxid === 'wxid_user', JSON.stringify(spoof))
  ok('正文里写 @ 但 atuserlist 没有机器人 → 列表为空', !!spoof && spoof.atWxids.length === 0)
  ok('群消息没有发送人前缀 → 不认', parseWxpadMessage({ ...base, from_user_name: { str: '123@chatroom' }, content: { str: '状态' } }, BOT) === null)
  ok('自己发的消息 → 忽略', parseWxpadMessage({ ...base, from_user_name: { str: BOT }, content: { str: 'x' } }, BOT) === null)
  ok('微信团队等系统账号 → 忽略', parseWxpadMessage({ ...base, from_user_name: { str: 'weixin' }, content: { str: 'x' } }, BOT) === null)
  const dm = parseWxpadMessage({ ...base, from_user_name: 'wxid_admin', to_user_name: BOT, content: '认领 ABCD-1234' }, BOT)
  ok('私聊：字段是纯字符串也认', dm?.kind === 'MESSAGE' && !dm.isGroup && dm.senderWxid === 'wxid_admin' && dm.text === '认领 ABCD-1234', JSON.stringify(dm))
  const all = parseWxpadMessage({ ...base, from_user_name: { str: '123@chatroom' }, content: { str: 'wxid_admin:\n@所有人 通知' }, msg_source: '<msgsource><atuserlist>notify@all</atuserlist></msgsource>' }, BOT)
  ok('@所有人 识别', all?.atAll === true)
  const sys = parseWxpadMessage({ ...base, msg_type: 10000, from_user_name: { str: '123@chatroom' }, content: { str: '"某某"邀请"贝果助手"加入了群聊' } }, BOT)
  ok('系统消息', sys?.kind === 'SYSTEM' && sys.senderWxid === '')
  ok('图片等非文本 → 忽略', parseWxpadMessage({ ...base, msg_type: 3, from_user_name: { str: 'wxid_admin' }, content: { str: 'x' } }, BOT) === null)
  ok('缺消息 ID → 忽略', parseWxpadMessage({ from_user_name: { str: 'wxid_admin' }, content: { str: 'x' }, msg_type: 1 }, BOT) === null)
  eq('atuserlist 去掉空项', parseAtUserList('<atuserlist>,wxid_a, wxid_b,</atuserlist>'), ['wxid_a', 'wxid_b'])
  eq('没有 atuserlist', parseAtUserList('<msgsource></msgsource>'), [])
}

console.log('\n渠道快速回复令牌：')
{
  const now = Date.UTC(2026, 9, 5)
  const t = issueTenantReplyToken('AB12CD34EF', 5, 3600_000, now)
  const c = verifyTenantReplyToken(t, now)
  ok('签发后可验过', c?.orderNo === 'AB12CD34EF' && c.tenantId === 5, t)
  const [no, tid, exp, sig] = t.split('.')
  ok('改分站被拒', verifyTenantReplyToken(`${no}.${(6).toString(36)}.${exp}.${sig}`, now) === null)
  ok('改订单被拒', verifyTenantReplyToken(`AB12CD34EG.${tid}.${exp}.${sig}`, now) === null)
  ok('改签名被拒', verifyTenantReplyToken(`${no}.${tid}.${exp}.${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`, now) === null)
  ok('过期被拒', verifyTenantReplyToken(t, now + 3600_001) === null)
  ok('登录 JWT 形状被拒', verifyTenantReplyToken('eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.sig.x', now) === null)
  ok('超长被拒', verifyTenantReplyToken('A'.repeat(300), now) === null)
  throws('不给主站单（tenantId=1）签发', () => issueTenantReplyToken('AB12CD34EF', 1, 1000, now))
  throws('订单编号形状不对不签', () => issueTenantReplyToken('ab-12', 5, 1000, now))
  const saved = process.env.JWT_SECRET
  delete process.env.JWT_SECRET
  ok('密钥未配置：验签 fail closed', verifyTenantReplyToken(t, now) === null)
  process.env.JWT_SECRET = saved
}

console.log('\n配置规范化：')
{
  const c = normalizeBotConfig({ version: 3, issueUserId: '12', caps: { issuePerDay: 99999 }, pacing: { perMinute: 0 }, linkOrigin: 'http://x.com', quietDefault: null })
  eq('issueUserId 字符串转数字', c.issueUserId, 12)
  eq('上限夹到范围内', c.caps.issuePerDay, 1000)
  eq('每分钟条数至少 1', c.pacing.perMinute, 1)
  eq('链接域名只认 https', c.linkOrigin, '')
  eq('免打扰可显式关闭', c.quietDefault, null)
  eq('缺省值', normalizeBotConfig({}).caps, DEFAULT_BOT_CONFIG.caps)
  ok('锁定只认 true', normalizeBotConfig({ locked: 'yes' }).locked === false)
  throws('不是对象抛错', () => normalizeBotConfig([]))
}

console.log('\n指令注册表：')
{
  let err = ''
  try {
    assertRegistry()
  } catch (e) {
    err = (e as Error).message
  }
  ok('当前注册表通过校验', err === '', err)
  ok('至少有基础指令', ['帮助', '状态', '群列表', '锁定', '设为管理群', '创建', '绑定', '解绑'].every((n) => !!findCommand(n)))
  ok('别名与大小写', findCommand('HELP')?.name === '帮助' && findCommand('？')?.name === '帮助')
  for (const c of COMMANDS) {
    if (c.tier >= 3) ok(`T3 指令「${c.name}」不在分站群 / 未登记群`, !c.scopes.includes('TENANT') && !c.scopes.includes('UNBOUND'))
    if (c.tier >= 2) ok(`T${c.tier} 指令「${c.name}」有审计名`, !!c.auditAction)
  }
  const base: BotCommandDef<null> = {
    name: '测试',
    scopes: ['MGMT'],
    tier: 0,
    parse: () => ({ ok: true, value: null }),
    run: async () => ({ text: '' }),
    help: { summary: 's', usage: 'u' },
  }
  throws('名字与别名重复', () => assertRegistry([base, { ...base, name: '测试2', aliases: ['测试'] }]))
  throws('T2 缺审计名', () => assertRegistry([{ ...base, tier: 2 }]))
  throws('未登记群只许 帮助 / 创建 / 设为管理群 / 绑定', () => assertRegistry([{ ...base, scopes: ['UNBOUND'] }]))
  throws('T3 不许锁定时可用', () => assertRegistry([{ ...base, tier: 3, auditAction: 'x', allowWhenLocked: true }]))
  throws('T3 不许进分站群', () => assertRegistry([{ ...base, tier: 3, auditAction: 'x', scopes: ['TENANT'] }]))
  throws('缺帮助', () => assertRegistry([{ ...base, help: { summary: '', usage: '' } }]))
}

console.log('\n提卡回执与补货：')
{
  const base = { productName: 'ChatGPT Plus 月卡', orderNo: '20261005K3F9Q2AB', stockAfter: 17, warnings: [] as string[] }
  eq(
    '单张、站内兑换（附录 A 样例）',
    renderIssueReceipt({ ...base, quantity: 1, unitPrice: 150, amount: 150, costTotal: 120, profit: 30, cards: [{ id: 1, plain: '9D8WA-AVOBY-PJ5P5', link: 'https://bigolab.com/redeem/sysa?cdk=9D8WA-AVOBY-PJ5P5', redeemUrl: null }] }),
    '✅ 提卡成功｜ChatGPT Plus 月卡 ×1\n单价 ¥150.00 · 成本 ¥120.00 · 利润 ¥30.00\n订单号 20261005K3F9Q2AB · 剩余库存 17 张\n核销：https://bigolab.com/redeem/sysa?cdk=9D8WA-AVOBY-PJ5P5'
  )
  eq(
    '多张、非站内兑换、成本未知、带提醒',
    renderIssueReceipt({
      ...base,
      quantity: 2,
      unitPrice: 10,
      amount: 20,
      costTotal: null,
      profit: null,
      warnings: ['这个商品已下架（仍按指令提了卡）'],
      cards: [
        { id: 1, plain: 'AAAA-1111', link: null, redeemUrl: 'https://x.example/redeem' },
        { id: 2, plain: 'BBBB-2222', link: null, redeemUrl: null },
      ],
    }),
    '✅ 提卡成功｜ChatGPT Plus 月卡 ×2\n单价 ¥10.00 × 2 = ¥20.00 · 成本未知\n订单号 20261005K3F9Q2AB · 剩余库存 17 张\n卡密 1：AAAA-1111\n兑换地址：https://x.example/redeem\n卡密 2：BBBB-2222\n⚠️ 这个商品已下架（仍按指令提了卡）'
  )
  ok('订单号形状：20261005K3F9Q2AB', looksLikeOrderNo('20261005K3F9Q2AB'))
  ok('订单号形状：随机段较短也认', looksLikeOrderNo('20261005K3F9'))
  ok('货号不当订单号：GPT1 / P12', !looksLikeOrderNo('GPT1') && !looksLikeOrderNo('P12'))
  eq('默认批次名（北京时间）', defaultRestockBatch(new Date('2026-10-05T06:32:00Z')), 'bot-20261005-1432')
}

console.log('\n动钱指令的注册：')
{
  const want: Record<string, number> = { 提卡: 3, 补货: 3, 上架: 3, 改价: 3, 下架: 2, 补发: 2 }
  for (const [name, tier] of Object.entries(want)) {
    const c = findCommand(name)
    ok(`「${name}」已注册、T${tier}、只在管理群与私聊`, !!c && c.tier === tier && c.scopes.length === 2 && c.scopes.includes('MGMT') && c.scopes.includes('DM'), JSON.stringify(c && { tier: c.tier, scopes: c.scopes }))
  }
  ok('提卡与改价自己写审计（selfAudited）', !!findCommand('提卡')?.selfAudited && !!findCommand('改价')?.selfAudited)
  ok('别名：发卡、导卡', findCommand('发卡')?.name === '提卡' && findCommand('导卡')?.name === '补货')
}

console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
process.exit(fail ? 1 : 0)

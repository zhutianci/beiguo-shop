/**
 * 短信接码 S1 搜索纯函数自测（不连库、不发请求）：
 *   npx tsx scripts/check-jiema-search.ts
 *
 * 对应 docs/短信接码-设计.md §12.1 第 5 条（§1.5、D25）：「电报」「dianbao」「db」「TG」「telgram」（纠错）「chatgpt」「mybankxyz」（没命中 → Any other）；
 * 「微信」「wx」「weixin」→ WeChat（wb）而不是 Apple；「dy」「抖音」→ TikTok/Douyin（lf）而不是 Zomato；「zfb」→ Alipay（hw）；
 * 「wb」「微博」→ Weibo（kf）而不是代码为 wb 的 WeChat；「bd」→ Baidu 而不是 X5ID；「ms」不命中 NovaPoshta；
 * 「快手」「美团」「淘宝」没有命中 → 引导「其他服务」；输入任何上游代码本身都不会因为「代码相等」排第一；任何查询都不再返回「不提供」；
 * 输入法组字期间不过滤。另加国家/地区搜索（中文名、英文名、ISO、区号「+44」「44」）。
 *
 * 服务表用的是上游 getServicesList 的真实代码与英文名（调研 §1.6、resp_getServicesList.txt 核对的撞车样例），
 * 中文名与别名按目录同步的同一个函数（seedForService）从种子 JSON 填进去——测的就是线上会用的那份种子。
 */
import { searchServices, normalize, effectiveQuery, searchCountries, scoreCountry, scoreService, dlDistance, nameTokens, serviceTokens, toSearchable, type SearchableService } from '../src/lib/jiema/search'
import { seedForService, countrySeed, forcedCountryName } from '../src/lib/jiema/catalog'
import { toCatalogService, type CatalogService } from '../src/lib/jiema/dto'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}

// 上游代码与英文名（顺序 = 人气；撞车样例：wx=Apple、wb=WeChat、dy=Zomato、mt=Steam、bd=X5ID、ms=NovaPoshta、xy=Depop、zh=Zoho、bl=BIGO LIVE）
const UPSTREAM: Array<[string, string]> = [
  ['wa', 'Whatsapp'],
  ['tg', 'Telegram'],
  ['go', 'Google,youtube,Gmail'],
  ['ig', 'Instagram+Threads'],
  ['fb', 'facebook'],
  ['dr', 'OpenAI'],
  ['acz', 'Claude'],
  ['tw', 'Twitter'],
  ['ds', 'Discord'],
  ['am', 'Amazon'],
  ['wx', 'Apple'],
  ['mm', 'Microsoft'],
  ['lf', 'TikTok/Douyin'],
  ['wb', 'WeChat'],
  ['hw', 'Alipay/Alibaba/1688'],
  ['za', 'JDcom'],
  ['zp', 'Pinduoduo'],
  ['qf', 'RedBook'],
  ['kf', 'Weibo'],
  ['li', 'Baidu'],
  ['qq', 'Tencent QQ'],
  ['xk', 'DiDi'],
  ['zs', 'Bilibili'],
  ['ts', 'PayPal'],
  ['aon', 'Binance'],
  ['re', 'Coinbase'],
  ['mb', 'Yahoo'],
  ['md', 'Banks'],
  ['ka', 'Shopee'],
  ['nf', 'Netflix'],
  ['dy', 'Zomato'],
  ['mt', 'Steam'],
  ['bd', 'X5ID'],
  ['ms', 'NovaPoshta'],
  ['xy', 'Depop'],
  ['zh', 'Zoho'],
  ['bl', 'BIGO LIVE'],
  ['vi', 'Viber'],
  ['ub', 'Uber'],
  ['oi', 'Tinder'],
  ['ot', 'Any other'],
]
const HOT = ['dr', 'acz', 'tg', 'wa', 'go', 'ig', 'fb', 'tw', 'ds', 'am', 'wx', 'mm']

interface Svc extends SearchableService {
  code: string
}
function build(codes: Array<[string, string]>): Svc[] {
  return codes.map(([code, en], i) => {
    const seed = seedForService(code, en)
    const h = HOT.indexOf(code)
    return { code, en, cn: seed?.cn ?? null, aliases: seed?.aliases ?? [], hot: h >= 0 ? h + 1 : null, pop: i + 1 }
  })
}
const LIST = build(UPSTREAM)
const first = (q: string, list: Svc[] = LIST) => searchServices(q, list)[0]?.item.code ?? null
const codes = (q: string, list: Svc[] = LIST) => searchServices(q, list).map((h) => h.item.code)

console.log('\n【§12.1 第 5 条 服务搜索】')
ok(first('电报') === 'tg' && first('dianbao') === 'tg' && first('db') === 'tg' && first('TG') === 'tg' && first('纸飞机') === 'tg', '「电报」「dianbao」「db」「TG」「纸飞机」→ Telegram')
ok(first('telgram') === 'tg' && searchServices('telgram', LIST)[0].score === 3, '「telgram」→ Telegram（纠错：长度 ≥5、DL 距离 ≤1）')
ok(first('Telegarm') === 'tg', '「Telegarm」→ Telegram（相邻换位算一步）')
ok(first('chatgpt') === 'dr' && first('GPT') === 'dr' && first('codex') === 'dr' && first('openai') === 'dr', '「chatgpt」「GPT」「codex」「openai」→ OpenAI')
ok(first('anthropic') === 'acz' && first('claude') === 'acz', '「anthropic」「claude」→ Claude')
ok(codes('mybankxyz').length === 0, '「mybankxyz」没有命中（页面引导「其他服务 Any other」）')
ok(first('微信') === 'wb' && first('wx') === 'wb' && first('weixin') === 'wb' && first('vx') === 'wb', '「微信」「wx」「weixin」「vx」→ WeChat（wb）')
ok(!codes('wx').includes('wx'), '  …「wx」不命中代码为 wx 的 Apple')
ok(first('苹果') === 'wx' && first('apple') === 'wx', '「苹果」「apple」→ Apple（代码 wx）')
ok(first('dy') === 'lf' && first('抖音') === 'lf' && first('tiktok') === 'lf' && first('douyin') === 'lf', '「dy」「抖音」「tiktok」「douyin」→ TikTok/Douyin（lf）')
ok(!codes('dy').includes('dy'), '  …「dy」不命中代码为 dy 的 Zomato')
ok(first('zfb') === 'hw' && first('支付宝') === 'hw' && first('1688') === 'hw' && first('阿里巴巴') === 'hw', '「zfb」「支付宝」「1688」「阿里巴巴」→ Alipay（hw）')
ok(first('wb') === 'kf' && first('微博') === 'kf' && first('weibo') === 'kf', '「wb」「微博」「weibo」→ Weibo（kf）')
ok(!codes('wb').includes('wb'), '  …「wb」不命中代码为 wb 的 WeChat（搜索不看代码）')
ok(first('bd') === 'li' && first('百度') === 'li' && !codes('bd').includes('bd'), '「bd」「百度」→ Baidu（li），不是代码为 bd 的 X5ID')
ok(!codes('ms').includes('ms'), '「ms」不命中 NovaPoshta（代码 ms）')
ok(first('京东') === 'za' && first('jd') === 'za' && first('拼多多') === 'zp' && first('pdd') === 'zp' && first('小红书') === 'qf' && first('xhs') === 'qf', '京东 / jd、拼多多 / pdd、小红书 / xhs')
ok(first('QQ') === 'qq' && first('腾讯') === 'qq' && first('滴滴') === 'xk' && first('dd') === 'xk' && first('B站') === 'zs' && first('bili') === 'zs' && first('哔哩哔哩') === 'zs', 'QQ / 腾讯、滴滴 / dd、B站 / bili / 哔哩哔哩')
ok(first('币安') === 'aon' && first('binance') === 'aon' && first('paypal') === 'ts' && first('coinbase') === 're' && first('银行') === 'md', '金融、加密货币平台照常可搜（币安、PayPal、Coinbase、银行；D25 不屏蔽）')
ok(codes('快手').length === 0 && codes('美团').length === 0 && codes('淘宝').length === 0, '「快手」「美团」「淘宝」没有命中 → 引导「其他服务」')
ok(first('其他') === 'ot' && first('any other') === 'ot', '「其他」「any other」→ 其他服务')
ok(first('谷歌') === 'go' && first('gmail') === 'go' && first('油管') === 'go' && first('youtube') === 'go', '「谷歌」「gmail」「油管」「youtube」→ Google（英文名按逗号拆词）')
ok(first('ins') === 'ig' && first('threads') === 'ig' && first('脸书') === 'fb' && first('推特') === 'tw' && first('亚马逊') === 'am' && first('微软') === 'mm' && first('outlook') === 'mm', 'ins / threads、脸书、推特、亚马逊、微软 / outlook')

console.log('\n【输入任何上游代码都不会因为「代码相等」排第一】')
{
  // 把每个服务的代码换成随机串：结果（按服务身份）必须完全一样 —— 证明搜索根本不看代码
  const scrambled: Svc[] = LIST.map((s, i) => ({ ...s, code: `zz${i}` }))
  const back = new Map(scrambled.map((s, i) => [s.code, LIST[i].code]))
  let diff = 0
  for (const [code] of UPSTREAM) {
    const a = codes(code)
    const b = searchServices(code, scrambled).map((h) => back.get(h.item.code))
    if (a.join(',') !== b.join(',')) diff++
  }
  ok(diff === 0, '换掉全部代码后，按任何一个代码搜索的结果与顺序不变')
  // 排第一的服务如果恰好是「代码相等」的那个，必须是因为它的名字或别名本身就等于这个词（如 tg、qq、fb）
  const bad: string[] = []
  for (const [code] of UPSTREAM) {
    const top = searchServices(code, LIST)[0]
    if (!top || top.item.code !== code) continue
    const s = top.item
    const own = [...nameTokens(s.en), ...nameTokens(s.cn ?? null), ...(s.aliases ?? []).map(normalize)]
    if (!own.some((t) => t.includes(normalize(code)))) bad.push(code)
  }
  ok(bad.length === 0, '排第一且代码相等的，都是因为名字或别名本身含这个词', bad.join(','))
}

console.log('\n【排序与返回形态（D25：没有「不提供」）】')
{
  const r = searchServices('telegram', LIST)
  ok(r[0].item.code === 'tg' && r[0].score === 0, '完全相等 0 分')
  ok(searchServices('tele', LIST)[0].score === 1 && searchServices('egra', LIST)[0].score === 2, '前缀 1 分 < 包含 2 分')
  ok(searchServices('tel', LIST).length >= 1, '短查询不走纠错（长度 <5）')
  // 同分时热门在前、再按人气：「o」前缀命中 OpenAI（热门）、Outlook 别名（微软，热门）…… OpenAI 排在前
  const tie = build([['zz', 'Omega'], ['dr', 'OpenAI']])
  ok(searchServices('o', tie)[0].item.code === 'dr', '同分时热门在前（OpenAI 是热门）')
  const tie2 = build([['z1', 'Alpha One'], ['z2', 'Alpha Two']])
  ok(searchServices('alpha', tie2).map((h) => h.item.code).join(',') === 'z1,z2', '同分、都不是热门时按人气')
  const keys = new Set(Object.keys(r[0]))
  ok(keys.size === 2 && keys.has('item') && keys.has('score'), '返回只有 { item, score }，没有 blocked / notOffered 之类的字段')
  ok(searchServices('   ', LIST).length === 0 && searchServices('!!!', LIST).length === 0, '规范化后为空 → 空结果（页面显示默认列表）')
}

console.log('\n【规范化与输入法】')
{
  ok(normalize('Ｔｅｌｅｇｒａｍ') === 'telegram' && normalize(' Apple ID ') === 'appleid' && normalize('B站') === 'b站' && normalize('+44') === '44' && normalize('Café') === 'cafe' && normalize('抖音·国际版') === '抖音国际版', '全角转半角、去空格和标点、NFKD 去变音符、汉字保留')
  ok(first('Ｗｅｉｘｉｎ') === 'wb' && first('TELE gram') === 'tg', '全角 / 大小写 / 空格不影响命中')
  ok(effectiveQuery('dian', true, '') === '' && effectiveQuery('电报', false, '') === '电报' && effectiveQuery('d', true, 'x') === 'x', '输入法组字期间不过滤（用上一次提交的查询），组字结束再按最终文字过滤')
  ok(dlDistance('telgram', 'telegram') === 1 && dlDistance('telegarm', 'telegram') === 1 && dlDistance('abc', 'xyz', 1) > 1, 'Damerau-Levenshtein')
  ok(scoreService('telegram', { en: 'Telegram', cn: null, aliases: [] }) === 0 && scoreService('xyz', { en: 'Telegram' }) === null, 'scoreService')
}

console.log('\n【国家/地区搜索（§1.6）】')
{
  const ids = [6, 4, 16, 187, 36, 3, 14, 20, 55, 48]
  const list = ids.map((id) => {
    const s = countrySeed(id)!
    return { id, name: forcedCountryName(id) ?? s.cn, en: ({ 6: 'Indonesia', 4: 'Philippines', 16: 'United Kingdom', 187: 'USA', 36: 'Canada', 3: 'China', 14: 'Hong Kong', 20: 'Macao', 55: 'Taiwan', 48: 'Netherlands' } as Record<number, string>)[id], iso2: s.iso2, dial: s.dial }
  })
  const top = (q: string) => searchCountries(q, list).map((c) => c.id)
  ok(top('+44')[0] === 16 && top('44')[0] === 16, '「+44」「44」都命中英国')
  ok(top('英国')[0] === 16 && top('united')[0] === 16 && top('GB')[0] === 16, '中文名、英文名、ISO 代码')
  ok(top('1').includes(187) && top('1').includes(36), '区号 1：美国、加拿大都在')
  const uk = list.find((c) => c.id === 16)!
  ok(scoreCountry('44', uk) === 0 && scoreCountry('4', uk) === 1 && scoreCountry('+44', uk) === 0 && scoreCountry('9', uk) === null, '区号：完全相等 0 分、前缀 1 分，不做包含匹配（输入 9 不命中 +44）')
  ok(top('台湾')[0] === 55 && top('中国台湾')[0] === 55 && top('香港')[0] === 14 && top('澳门')[0] === 20, '「中国台湾 / 中国香港 / 中国澳门」按中文名能搜到（D44）')
  ok(top('中国').includes(3) && top('中国')[0] === 3, '「中国」→ 中国（+86）排第一，照常可买（D25）')
  ok(searchCountries('', list).length === list.length, '空查询 → 全部')
}

console.log('\n【S1 评审修复：页面真正交给搜索的是目录 DTO（中文名在 name 里）】')
{
  // 与 catalogSnapshot 同一个构造：name = 中文名 || 英文名、aliases = 别名；DTO 里没有 cn
  const dto = (code: string, name: string, en: string, aliases: string[], hot: number | null = null): CatalogService =>
    toCatalogService({ code, name, en, aliases, hot, fromCents: 170, approx: false, level: 'OK' })
  const svcs = [
    dto('tg', '电报', 'Telegram', ['tg', '电报'], 3),
    dto('li2', '领英', 'LinkedIn', []), // 后台新填的中文名、别名留空
    dto('dy', 'Zomato 外卖', 'Zomato', []),
    dto('ot', '其他服务', 'Any other', ['其他', '任意', '不在列表']),
    dto('xx', 'Plain', 'Plain', []), // 没有中文名：name = en
  ]
  ok(!('cn' in svcs[1]), '目录 DTO 本身没有 cn 字段（原来的 bug：searchServices 读 cn，永远是 undefined）')
  ok(searchServices('领英', svcs).length === 0, '  …直接拿 DTO 去搜「领英」：0 条（复现评审的问题）')
  const S = toSearchable(svcs)
  const tok = new Map(S.map((s) => [s, serviceTokens(s)] as const))
  const hit = (q: string) => searchServices(q, S, { tokens: tok }).map((h) => h.item.code)
  ok(hit('领英')[0] === 'li2' && hit('linkedin')[0] === 'li2', 'toSearchable 之后：后台填的中文名「领英」能搜到，英文名照常')
  ok(hit('外卖')[0] === 'dy' && hit('zomato')[0] === 'dy', '「Zomato 外卖」按中文名的词能搜到')
  ok(hit('其他服务')[0] === 'ot', '显示名「其他服务」能搜到（原来别名里只有 其他 / 任意 / 不在列表）')
  ok(S[4].cn === null && hit('plain')[0] === 'xx', '没有中文名的（name = en）不重复收')
  ok(S.every((s, i) => s.pop === i + 1) && S[0].code === 'tg' && S[0].fromCents === 170, 'pop = 人气顺序（数组下标）；其余字段原样保留，结果可以直接当 CatalogService 用')
  // 与种子目录一起：把 LIST（带 cn 的手工形状）改成真实 DTO 形状，结果不变
  const asDto = LIST.map((s) => dto(s.code, s.cn || s.en, s.en, (s.aliases ?? []).slice(), s.hot ?? null))
  const S2 = toSearchable(asDto)
  let diff = 0
  for (const q of ['电报', '微信', 'wx', 'dy', '抖音', 'zfb', 'wb', '微博', 'bd', '百度', 'chatgpt', 'telgram', '其他']) {
    if ((searchServices(q, S2)[0]?.item.code ?? null) !== first(q)) diff++
  }
  ok(diff === 0, '种子目录走真实 DTO 形状（toCatalogService → toSearchable）时，上面各条查询排第一的服务不变')
}

console.log(`\n通过 ${passed} 条，失败 ${failed} 条`)
if (failed) {
  console.log('❌ 有失败')
  process.exit(1)
}
console.log('全部通过 ✅')
process.exit(0)

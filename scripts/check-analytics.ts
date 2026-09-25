/**
 * 流量归类自测。归类错了整个仪表盘就是错的，而这种错误在图表上完全看不出来
 * ——曲线照样好看，只是画的是另一回事。所以这些断言必须有。
 *
 * 跑法：npx tsx scripts/check-analytics.ts
 */
import { classifyReferrer, classifyDevice, normalizePath, pathGroup, shouldSkipPath } from '../src/lib/analytics/classify'

let failed = 0
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) console.log('  ✓', name)
  else { failed++; console.log('  ✗', name, '\n      got =', JSON.stringify(got), '\n      want=', JSON.stringify(want)) }
}

console.log('来源归类：')
eq('谷歌搜索', classifyReferrer('https://www.google.com/search?q=chatgpt充值').source, 'search')
eq('谷歌引擎名', classifyReferrer('https://www.google.com.hk/').engine, 'google')
eq('必应', classifyReferrer('https://cn.bing.com/search?q=x').engine, 'bing')
eq('百度', classifyReferrer('https://www.baidu.com/s?wd=x').engine, 'baidu')
eq('知乎算 social', classifyReferrer('https://zhuanlan.zhihu.com/p/1').source, 'social')
eq('v2ex 算 social', classifyReferrer('https://www.v2ex.com/t/1').source, 'social')
eq('站内跳转算 internal', classifyReferrer('https://bigolab.com/products').source, 'internal')
eq('www 也算 internal', classifyReferrer('https://www.bigolab.com/').source, 'internal')
eq('无 referrer 算 direct', classifyReferrer(undefined).source, 'direct')
eq('空串算 direct', classifyReferrer('').source, 'direct')
eq('非法 URL 不抛异常', classifyReferrer('not a url').source, 'direct')
eq('其他站算 referral', classifyReferrer('https://example.com/a').source, 'referral')
eq('referral 保留 host', classifyReferrer('https://example.com/a').refHost, 'example.com')

console.log('\nAI 助手 / AI 搜索（上线首日就是最大外部来源，不能混进社交）：')
eq('ChatGPT 算 ai', classifyReferrer('https://chatgpt.com/').source, 'ai')
eq('ChatGPT 引擎名', classifyReferrer('https://chatgpt.com/c/abc').engine, 'chatgpt')
eq('chat.openai.com 算 ai', classifyReferrer('https://chat.openai.com/').engine, 'chatgpt')
eq('Claude 算 ai', classifyReferrer('https://claude.ai/chat/1').engine, 'claude')
eq('Perplexity 算 ai', classifyReferrer('https://www.perplexity.ai/search?q=x').engine, 'perplexity')
eq('豆包算 ai', classifyReferrer('https://www.doubao.com/chat/').engine, 'doubao')
eq('秘塔算 ai', classifyReferrer('https://metaso.cn/search/1').engine, 'metaso')
// Gemini 挂在 google.com 下，必须在搜索引擎规则之前命中，否则会被算成 Google 自然搜索
eq('Gemini 不算 Google 搜索', classifyReferrer('https://gemini.google.com/app').source, 'ai')
eq('Gemini 引擎名', classifyReferrer('https://gemini.google.com/app').engine, 'gemini')
eq('Google 搜索仍是 search', classifyReferrer('https://www.google.com/search?q=x').source, 'search')

console.log('\n域名匹配必须按点分段，不能用子串（第一版就是这里错的）：')
// chatgp[t.co]m —— 第一版用 includes 时被当成推特短链 t.co，ChatGPT 流量整段记成社交
eq('chatgpt.com 不该命中 t.co', classifyReferrer('https://chatgpt.com/').source !== 'social', true)
eq('t.co 本身还是 social', classifyReferrer('https://t.co/abc').source, 'social')
eq('x.com 本身还是 social', classifyReferrer('https://x.com/i/1').source, 'social')
// netfli[x.com] / suppor[t.co]m / al[so.com] —— 同一个 bug 的其他受害者
eq('netflix.com 不算社交', classifyReferrer('https://www.netflix.com/').source, 'referral')
eq('support.com 不算社交', classifyReferrer('https://support.com/a').source, 'referral')
eq('also.com 不算 360 搜索', classifyReferrer('https://also.com/a').source, 'referral')
eq('notgoogle.com 不算 Google', classifyReferrer('https://notgoogle.com/').source, 'referral')
eq('google.com.hk 算 Google', classifyReferrer('https://www.google.com.hk/').engine, 'google')

console.log('\n自己的 Host（公网 IP 直连本站时 referrer 是 IP，不是域名）：')
eq('IP 直连的站内跳转算 internal', classifyReferrer('http://8.8.8.8/products', '8.8.8.8').source, 'internal')
eq('不传 selfHost 时退化成外链', classifyReferrer('http://8.8.8.8/products').source, 'referral')
eq('selfHost 不影响外站判定', classifyReferrer('https://chatgpt.com/', 'bigolab.com').source, 'ai')

console.log('\n邮件来源（网页邮箱 referrer + 落地 URL 的 utm_medium=email 标记）：')
eq('QQ 邮箱算 email', classifyReferrer('https://mail.qq.com/cgi-bin/frame_html').source, 'email')
eq('新版 QQ 邮箱算 email', classifyReferrer('https://wx.mail.qq.com/').source, 'email')
eq('腾讯企业邮算 email', classifyReferrer('https://exmail.qq.com/').source, 'email')
eq('网易 163 算 email', classifyReferrer('https://mail.163.com/js6/main.jsp').source, 'email')
eq('网易 126 算 email', classifyReferrer('https://mail.126.com/').source, 'email')
eq('Gmail 算 email（不能被 google. 判成搜索）', classifyReferrer('https://mail.google.com/mail/u/0/').source, 'email')
eq('Outlook 算 email', classifyReferrer('https://outlook.live.com/mail/0/').source, 'email')
eq('雅虎邮箱算 email（不能被 yahoo. 判成搜索）', classifyReferrer('https://mail.yahoo.com/d/folders/1').source, 'email')
eq('阿里邮箱算 email', classifyReferrer('https://qiye.aliyun.com/alimail/').source, 'email')
eq('email 保留 refHost', classifyReferrer('https://mail.qq.com/').refHost, 'mail.qq.com')
eq('email 没有 engine', classifyReferrer('https://mail.qq.com/').engine, null)
eq('utm 标记算 email', classifyReferrer('utm:email'), { source: 'email', engine: null, refHost: null })
eq('utm 标记不受 selfHost 影响', classifyReferrer('utm:email', 'bigolab.com').source, 'email')
// 反例：邮箱规则只认邮箱子域，品牌根域照旧
eq('qq.com 本身仍是 social', classifyReferrer('https://qq.com/').source, 'social')
eq('www.qq.com 仍是 social', classifyReferrer('https://www.qq.com/').source, 'social')
eq('gmail.com（不是 mail.google.com）不算搜索', classifyReferrer('https://gmail.com/').source !== 'search', true)
eq('gmail.com 也不算 email（真实 Gmail 网页在 mail.google.com）', classifyReferrer('https://gmail.com/').source, 'referral')
eq('Google 搜索仍是 search', classifyReferrer('https://www.google.com/search?q=x').source, 'search')
eq('雅虎搜索仍是 search', classifyReferrer('https://search.yahoo.com/search?p=x').source, 'search')
eq('163.com 门户不算 email', classifyReferrer('https://www.163.com/').source, 'referral')
eq('mail.qq.com.evil.com 不算 email', classifyReferrer('https://mail.qq.com.evil.com/').source, 'referral')
eq('xmail.163.com 不算 email（按点分段）', classifyReferrer('https://xmail.163.com/').source, 'referral')
eq('其它 utm: 前缀不算 email', classifyReferrer('utm:social').source, 'direct')

console.log('\n设备：')
eq('iPhone', classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'mobile')
eq('Android', classifyDevice('Mozilla/5.0 (Linux; Android 13)'), 'mobile')
eq('桌面 Chrome', classifyDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop')
eq('无 UA 当桌面', classifyDevice(null), 'desktop')

console.log('\n路径归一化：')
eq('去 query', normalizePath('/products?ref=abc'), '/products')
eq('去 hash', normalizePath('/chongzhi#price'), '/chongzhi')
eq('去尾斜杠', normalizePath('/products/'), '/products')
eq('根路径保留斜杠', normalizePath('/'), '/')
eq('补前导斜杠', normalizePath('products'), '/products')
eq('超长截断到列宽', normalizePath('/' + 'a'.repeat(300)).length, 191)

console.log('\n详情页归类：')
eq('新闻详情', pathGroup('/news/2026-09-19-abc'), '/news/*')
eq('新闻日报', pathGroup('/news/digest/daily/2026-09-19'), '/news/digest/*')
eq('商品详情', pathGroup('/products/16'), '/products/*')
eq('落地页不归类', pathGroup('/chongzhi/chatgpt-plus'), '/chongzhi/chatgpt-plus')

console.log('\n不该记录的路径：')
eq('后台', shouldSkipPath('/admin/orders'), true)
eq('接口', shouldSkipPath('/api/products'), true)
eq('带 token 的收据', shouldSkipPath('/receipt/abc'), true)
eq('支付页', shouldSkipPath('/pay/123'), true)
eq('财务台', shouldSkipPath('/finance/tok'), true)
eq('退订页（token 即凭证）', shouldSkipPath('/unsubscribe/0123456789abcdef0123456789abcdef'), true)
eq('/unsubscribe 以外的相近路径不误伤', shouldSkipPath('/unsubscribed-help'), false)
eq('正常页面不跳过', shouldSkipPath('/chongzhi'), false)

console.log(failed === 0 ? '\n全部通过' : `\n失败 ${failed} 条`)
process.exit(failed === 0 ? 0 : 1)

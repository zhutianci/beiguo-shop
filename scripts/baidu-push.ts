/**
 * 百度「普通收录」主动推送。
 *
 *   npx tsx scripts/baidu-push.ts --dry                 # 只打印会推哪些，不真推
 *   npx tsx scripts/baidu-push.ts                       # 推优先级清单（商业页优先）
 *   npx tsx scripts/baidu-push.ts https://a/ https://b/ # 推指定的几条
 *
 * ---------------------------------------------------------------------------
 * 【先把预期摆正】这个接口只做一件事：告诉百度「这个地址存在」，缩短发现时间。
 * 百度文档原文「不保证收录和展现效果」。它不是排名手段，推了也不等于会被收。
 *
 * 【配额小得必须精打细算】实测这个站当前每日 10 条，API 提交与手动提交共享，
 * 当日有效、不累计。而站上光商业页就有 30 多个，所以**绝不能把它挂进新闻管线**
 * （那边每小时产出新页，一轮就能把配额吃干，商业页永远排不上）。
 * 新闻页交给 sitemap —— sitemap 的配额是单独算的，不和这 10 条共享。
 *
 * 【URL 形式必须和注册的站点一致，这是最容易踩的坑】
 * 2026-09-21 实测：站点注册成 `https://www.bigolab.com` 时，
 *   提交 https://bigolab.com/  → {"success":0,"not_same_site":["https://bigolab.com/"]}
 *   提交 https://www.bigolab.com/ → {"success":1}
 * 而本站 canonical、robots Host、sitemap 用的全是**裸域**，www 一律 301 到裸域。
 * 百度文档又要求「若链接存在跳转关系，请直接提交跳转后链接」。
 * 两边打架的唯一正解是：在百度站点管理里把 `https://bigolab.com`（裸域）注册并验证，
 * 然后 BAIDU_PUSH_SITE 填裸域。推一批会 301 的 www 地址是在浪费配额。
 * 本脚本会在 URL 的 host 与 BAIDU_PUSH_SITE 不一致时直接拒绝发送。
 *
 * 【2026-09-24 更新】裸域站点已验证通过，实测可推：
 *   site=https://bigolab.com → {"remain":0,"success":9}
 * 在那之前一直返回 401 site error——那个错只代表「站点没验证」，
 * 和 token 无关（token 错时返回的是 token is not valid，两者要分清）。
 *
 * 【关于 token】接口只有 http，没有 https，所以 token 会以明文出现在请求行里。
 * 这是百度的限制，不是这里的疏忽。token 放 .env.production，不要进版本库。
 */

const API_BASE = 'http://data.zz.baidu.com/urls'

/** 单次请求最多带多少条。配额只有 10，这里没必要大 */
const MAX_PER_CALL = 20

const TIMEOUT_MS = 20000

/** 505 是百度侧的临时错误，实测重试即可成功 */
const RETRY_ON = new Set([505])
const MAX_RETRY = 3
const RETRY_DELAY_MS = 6000

interface PushResult {
  success?: number
  remain?: number
  not_same_site?: string[]
  not_valid?: string[]
  error?: number
  message?: string
}

function env(name: string): string {
  return (process.env[name] || '').trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 优先级清单。
 *
 * 【为什么是写死的路径而不是整份 sitemap】sitemap 里 87% 是每小时自动产出的新闻页，
 * 按 sitemap 顺序推会把 10 条配额全喂给新闻。这里只列「值钱的页面」，
 * 按「能直接成交」的顺序排：充值落地页 > 商品列表与说明 > 首页与信任页。
 * 商品详情页不写死 id（会变），由 --with-products 从 sitemap 里取。
 */
const PRIORITY_PATHS: string[] = [
  // 前 10 条正好用满一天的配额。2026-09-24 已按这个顺序推过一轮
  '/chongzhi',
  '/chongzhi/chatgpt-plus',
  '/chongzhi/chatgpt-pro',
  '/chongzhi/claude-pro',
  '/chongzhi/claude-max',
  '/chongzhi/claude-kyc',
  '/chongzhi/claude-zhuce',
  '/chongzhi/codex-jiema',
  '/chongzhi/google-zhanghao',
  '/chongzhi/grok-super',
  // 下面这些留给第二天。首页不在列表里：百度验证站点时就抓过根地址，
  // 不必再花一条配额去告诉它首页存在
  '/products',
  '/support',
  '/terms',
  '/about',
]

async function push(site: string, token: string, urls: string[]): Promise<PushResult> {
  const url = `${API_BASE}?site=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: urls.join('\n'),
        signal: ac.signal,
      })
      const text = await res.text()
      let json: PushResult
      try {
        json = JSON.parse(text)
      } catch {
        return { error: -1, message: `返回的不是 JSON：${text.slice(0, 200)}` }
      }
      if (json.error && RETRY_ON.has(json.error) && attempt < MAX_RETRY) {
        console.log(`  百度返回 ${json.error}（临时错误），${RETRY_DELAY_MS / 1000}s 后重试（第 ${attempt} 次）`)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      return json
    } catch (e) {
      if (attempt < MAX_RETRY) {
        console.log(`  请求失败（${(e as Error).message}），重试中`)
        await sleep(RETRY_DELAY_MS)
        continue
      }
      return { error: -1, message: (e as Error).message }
    } finally {
      clearTimeout(timer)
    }
  }
  return { error: -1, message: '重试次数用尽' }
}

async function main() {
  const site = env('BAIDU_PUSH_SITE')
  const token = env('BAIDU_PUSH_TOKEN')

  if (!site || !token) {
    console.error('缺少 BAIDU_PUSH_SITE 或 BAIDU_PUSH_TOKEN。')
    console.error('在 .env.production 里配置后再跑，例如：')
    console.error('  BAIDU_PUSH_SITE=https://bigolab.com')
    console.error('  BAIDU_PUSH_TOKEN=xxxxxxxx')
    process.exit(1)
  }

  let siteHost: string
  try {
    siteHost = new URL(site).host
  } catch {
    console.error(`BAIDU_PUSH_SITE 不是合法地址：${site}`)
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const dry = args.includes('--dry')
  const explicit = args.filter((a) => a.startsWith('http'))

  const urls = explicit.length
    ? explicit
    : PRIORITY_PATHS.map((p) => new URL(p, site).toString())

  // host 不一致的直接拦下来。真发过去只会得到 not_same_site，
  // 而那条记录会让人误以为「推了但百度不收」，实际上是形式写错了。
  const bad = urls.filter((u) => {
    try {
      return new URL(u).host !== siteHost
    } catch {
      return true
    }
  })
  if (bad.length) {
    console.error(`以下 URL 的 host 与 BAIDU_PUSH_SITE（${siteHost}）不一致，拒绝发送：`)
    bad.forEach((u) => console.error(`  ${u}`))
    console.error('百度只接受与注册站点完全同形式的地址（www 与裸域算两个站点）。')
    process.exit(1)
  }

  const list = Array.from(new Set(urls))
  console.log(`站点：${site}`)
  console.log(`待推送 ${list.length} 条：`)
  list.forEach((u, i) => console.log(`  ${String(i + 1).padStart(2)}. ${u}`))

  if (dry) {
    console.log('\n--dry：没有真的发送。')
    return
  }

  console.log('')
  let sent = 0
  for (let i = 0; i < list.length; i += MAX_PER_CALL) {
    const batch = list.slice(i, i + MAX_PER_CALL)
    const r = await push(site, token, batch)
    if (r.error) {
      console.error(`推送失败：error=${r.error} ${r.message || ''}`)
      if (r.error === 401) {
        console.error('401 有两种：token is not valid = 密钥错；site error = 这个站点没在百度注册或未验证。')
      }
      process.exit(1)
    }
    sent += r.success || 0
    console.log(`本批 ${batch.length} 条 → 成功 ${r.success ?? 0}，今日剩余配额 ${r.remain ?? '未知'}`)
    if (r.not_same_site?.length) {
      console.log(`  非本站（未消耗配额）：${r.not_same_site.join(', ')}`)
    }
    if (r.not_valid?.length) {
      console.log(`  不合法：${r.not_valid.join(', ')}`)
    }
    if (typeof r.remain === 'number' && r.remain <= 0) {
      console.log('今日配额已用尽，剩下的明天再推。')
      break
    }
  }
  console.log(`\n共成功推送 ${sent} 条。`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

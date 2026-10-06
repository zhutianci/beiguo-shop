/**
 * IndexNow 一次性补推（docs/SEO-重构/SEO-重构设计.md §6.4 第 4 条、§1.11，批 2 的 G 包）。
 *
 *   INDEXNOW_KEY=<key> npx tsx scripts/indexnow-backfill.ts --dry          # 只打印
 *   INDEXNOW_KEY=<key> npx tsx scripts/indexnow-backfill.ts                # 真推（部署之后跑一次）
 *   INDEXNOW_KEY=<key> npx tsx scripts/indexnow-backfill.ts https://bigolab.com/a https://bigolab.com/b   # 只推这几条
 *
 * 推什么（固定清单，不从 sitemap 里全量取：大事记新页由 cron 自己推，这里只推「批 2 改过的」和「Bing 里该刷新的旧快照」）：
 *  · 批 2 改了 title / description / 正文的公开页：首页、/jiema、/jiema/terms、/news、6 个加了事实卡的落地页、/about、/support、/learn 等；
 *  · Bing 里的 noindex 旧快照（§1.11）：/login、/register、/forgot-password、/lookup —— 让 Bing 重抓后读到 noindex；
 *  · 已下架商品 /products/11、13、22 —— 让 Bing 读到 404（站长给出对应产品线后再改成 301）。
 * IndexNow 只认与 key 同一个 host 的 https 地址；http:// 旧版本靠 Cloudflare 的 Always Use HTTPS 301 收敛，不在这里推。
 * Google 不支持 IndexNow。
 *
 * 【不 import src/】运维脚本在服务器上用 tsx 直接跑，不依赖 Next 的路径别名与数据库（同 baidu-push.ts）。
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow'
const SITE = (process.env.INDEXNOW_SITE || 'https://bigolab.com').replace(/\/+$/, '')

const PATHS = [
  '/',
  '/jiema',
  '/jiema/terms',
  '/news',
  '/chongzhi/chatgpt-pro',
  '/chongzhi/claude-pro',
  '/chongzhi/claude-max',
  '/chongzhi/grok-super',
  '/chongzhi/codex-jiema',
  '/chongzhi/claude-zhuce',
  '/about',
  '/support',
  '/iptools',
  '/links',
  '/learn',
  '/prompts',
  '/guides',
  // noindex 旧快照（§1.11）
  '/login',
  '/register',
  '/forgot-password',
  '/lookup',
  // 已下架商品（404）
  '/products/11',
  '/products/13',
  '/products/22',
]

async function main() {
  const key = (process.env.INDEXNOW_KEY || '').trim()
  const dry = process.argv.includes('--dry')
  if (!/^[a-f0-9]{8,128}$/i.test(key) && !dry) {
    console.error('缺少或不合法的 INDEXNOW_KEY（8–128 位十六进制，与 /indexnow-key.txt 同一个）')
    process.exit(1)
  }
  const explicit = process.argv.slice(2).filter((a) => a.startsWith('http'))
  const urls = Array.from(new Set(explicit.length ? explicit : PATHS.map((p) => `${SITE}${p}`)))
  const host = new URL(SITE).host
  const bad = urls.filter((u) => new URL(u).host !== host)
  if (bad.length) {
    console.error(`host 与 ${host} 不一致，IndexNow 会整批拒绝：`, bad.join(' '))
    process.exit(1)
  }
  console.log(`待推送 ${urls.length} 条：`)
  urls.forEach((u, i) => console.log(`  ${String(i + 1).padStart(2)}. ${u}`))
  if (dry) {
    console.log('\n--dry：没有真的发送。')
    return
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/indexnow-key.txt`, urlList: urls }),
  })
  console.log(`IndexNow 返回 ${res.status}（200 / 202 = 已受理）`, (await res.text().catch(() => '')).slice(0, 200))
  if (!res.ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// 让 tsc 把它当模块（没有 import / export 的文件是全局脚本，main 会和 baidu-push.ts 的同名函数冲突）
export {}

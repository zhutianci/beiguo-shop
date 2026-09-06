/**
 * 【AI圈大事记】信源初始化：把 SEED_SOURCES upsert 进 news_sources。
 *
 * 按 key 幂等，可以反复执行。更新时只覆盖「描述性」字段（名称 / 地址 / 分级 / 角色 / 权重），
 * 刻意不碰 enabled / failCount / lastError —— 那是运行态，管理员在后台停用过的源
 * 不能被一次重跑又打开，连续失败被自动熔断的源也不能被重跑复活。
 *
 * 执行方式二选一：
 *
 * 1) 本机 / 构建机（有 src/ 源码时）：
 *      npm run db:seed-news
 *      # 或 npx tsx prisma/seed-news-sources.ts
 *
 * 2) 生产容器（Dockerfile 的 runner 段只 COPY 了 prisma/ 与 standalone 产物，没有 src/，
 *    因此这里的相对 import 在容器内跑不通）。生产上用管线路由触发同一段逻辑：
 *      curl -fsS "http://app:3000/api/cron/news?stage=seed&secret=$CRON_SECRET"
 *    两条路径调用的是同一份 SEED_SOURCES，不存在两套清单。
 *
 * 加 --dry-run 只打印不写库。
 */
import { PrismaClient } from '@prisma/client'
import { SEED_SOURCES } from '../src/lib/news/sources'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  let created = 0
  let updated = 0

  for (const s of SEED_SOURCES) {
    const common = {
      name: s.name,
      homepage: s.homepage ?? null,
      feedUrl: s.feedUrl,
      kind: s.kind ?? 'RSS',
      lang: s.lang ?? 'zh',
      tier: s.tier,
      role: s.role ?? 'feed',
      weight: s.weight ?? 1,
      viaRelay: s.viaRelay ?? false,
    }

    const exists = await prisma.newsSource.findUnique({ where: { key: s.key }, select: { id: true, enabled: true } })

    if (DRY_RUN) {
      console.log(`${exists ? '[更新]' : '[新建]'} ${s.key.padEnd(14)} tier${s.tier} ${s.role ?? 'feed'} ${s.name}`)
      if (exists) updated++
      else created++
      continue
    }

    if (exists) {
      // 不覆盖 enabled：后台停用与自动熔断的结果必须保住
      await prisma.newsSource.update({ where: { key: s.key }, data: common })
      updated++
    } else {
      await prisma.newsSource.create({ data: { key: s.key, ...common, enabled: s.enabled ?? true } })
      created++
    }
  }

  const enabledCount = DRY_RUN ? 0 : await prisma.newsSource.count({ where: { enabled: true } })
  console.log(
    `信源初始化完成${DRY_RUN ? '（dry-run，未写库）' : ''}：清单 ${SEED_SOURCES.length} 条，新建 ${created}，更新 ${updated}` +
      (DRY_RUN ? '' : `，当前启用中 ${enabledCount}`)
  )
  if (!process.env.NEWS_RELAY_URL) {
    console.log('提示：未配置 NEWS_RELAY_URL，viaRelay 的境外源（X / HuggingFace / DeepMind / Reddit）会被 collect 跳过。')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

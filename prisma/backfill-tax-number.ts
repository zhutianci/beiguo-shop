/**
 * 历史税号去空格回填（可重入、默认 dry-run）：
 *
 *   npx tsx prisma/backfill-tax-number.ts            # 只看会改什么，不写库
 *   npx tsx prisma/backfill-tax-number.ts --apply    # 真正写库
 *
 * 生产（容器内，prisma/ 目录已随镜像带进去）：
 *   docker compose --env-file .env.production run --rm --no-deps -T app  *     npx -y tsx prisma/backfill-tax-number.ts [--apply]
 *
 * 【为什么需要它】买家常把税号按四位一组敲成「9111 0108 MAER 0M7A 3L」，
 * 从 PDF/微信里粘贴还会带全角空格和零宽字符。这些字符在页面上看不出来，
 * 却让税局批量导入报「购买方纳税人识别号长度不能超过20」，而且是**整批退回**。
 *
 * 登记侧已经在 lib/invoice-input 过滤了，导出侧 lib/invoice-export 也兜了一层；
 * 这个脚本是把库里的存量数据也顺手洗干净，让后台看到的和导出的一致。
 *
 * 【去空格后仍超 20 位的不改、只列出来】那是数据本身有问题（填错、把公司名也粘进去了），
 * 脚本替人改数据只会把问题藏起来 —— 打印出来让人去核实。
 */
import { PrismaClient } from '@prisma/client'

/*
 * 【这两个定义是 src/lib/tax-number.ts 的副本，是有意的】
 * 运行时镜像只 COPY 了 prisma/ public/ .next/standalone templates/ 与 prisma client，
 * **没有 src/**（见 Dockerfile 第 44-53 行）。从 ../src/lib/... import 的脚本
 * 在生产容器里会直接 MODULE_NOT_FOUND 挂掉 —— prisma/backfill-cardkey-cost.ts
 * 只 import @prisma/client 就是这个原因。
 * 改规则时两处要一起改；scripts/check-invoice.ts 里有对应断言。
 */
const TAX_NUMBER_MAX_LEN = 20
function normalizeTaxNumber(s: string | null | undefined): string {
  // 一律写成 \u 转义：字符类里直接放真实的全角空格/零宽字符，在编辑器、终端、diff 里全都看不见，改坏了也发现不了
  return (s || '').replace(/[\s\u3000\u00A0\u180E\u200B-\u200D\u2060\uFEFF]/g, '')
}

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

async function main() {
  console.log(APPLY ? '[apply] 将写库\n' : '[dry-run] 只打印，不写库（加 --apply 才真正执行）\n')

  let changed = 0
  let suspicious = 0
  let scanned = 0
  let cursor = 0

  // 分页扫，不要把整张表读进内存（这台机器只有 1.8G）
  for (;;) {
    const rows = await prisma.invoice.findMany({
      where: { id: { gt: cursor }, taxNumber: { not: null } },
      select: { id: true, invoiceNo: true, title: true, taxNumber: true },
      orderBy: { id: 'asc' },
      take: 200,
    })
    if (rows.length === 0) break
    cursor = rows[rows.length - 1].id
    scanned += rows.length

    for (const r of rows) {
      const raw = r.taxNumber || ''
      const clean = normalizeTaxNumber(raw)
      if (clean === raw) continue

      const tooLong = clean.length > TAX_NUMBER_MAX_LEN
      if (tooLong) suspicious++
      else changed++

      const flag = tooLong ? `  ← 去空格后仍 ${clean.length} 位，跳过不改，请人工核实` : ''
      console.log(`  ${r.invoiceNo}  ${r.title || '（无抬头）'}\n    "${raw}" → "${clean}"${flag}`)

      /*
       * 【超长的一律不动】这不是洁癖，是可逆性问题：
       * 「91110108MAER0M7A3L 北京某某有限公司」这种把公司名也粘进税号框的数据，
       * 空格恰恰是人工核对时唯一能看出「税号到哪结束」的线索。抹掉之后原值只存在于
       * 这一次的 stdout 里（线上通常滚在 docker logs 里），核实的人再也切不对。
       * 它去空格后照样超 20 位、照样会被税局退回，改了没有任何收益。
       */
      if (APPLY && !tooLong) {
        await prisma.invoice.update({ where: { id: r.id }, data: { taxNumber: clean } })
      }
    }
  }

  /*
   * 顺带把「背书外部订单」标成「已提醒过」，让它们退出自动到期提醒。
   *
   * sourceKey 以 order: 开头的那些行是为了让发票/收据有开通-到期日期可印而造的，
   * expireDate 是「付款日 + 1 个月」硬写的假日期，跟买家真实订阅周期没关系。
   * 新建的行已经在 lib/order-invoice.ts 里出厂就带上了这个标记，
   * 这里处理的是改造之前留下的存量 —— 不处理的话，买过一次性卡密的买家
   * 会在一个月后收到一封「你的订阅即将到期，请续费」。
   */
  const endorsements = await prisma.externalOrder.findMany({
    where: { sourceKey: { startsWith: 'order:' }, remindedExpireDate: null },
    select: { id: true, expireDate: true },
  })
  if (endorsements.length) {
    console.log(`\n背书外部订单需要标记「不参与自动提醒」：${endorsements.length} 条`)
    if (APPLY) {
      for (const e of endorsements) {
        await prisma.externalOrder.update({
          where: { id: e.id },
          data: { remindedExpireDate: e.expireDate },
        })
      }
    }
  }

  // 只是带空格的抬头档案也一并洗掉（这张表是新建的，通常为空，写在这里是为了将来重跑）
  let titlesChanged = 0
  const titles = await prisma.invoiceTitle.findMany({ select: { id: true, taxNumber: true } })
  for (const t of titles) {
    const clean = normalizeTaxNumber(t.taxNumber)
    if (clean === t.taxNumber) continue
    titlesChanged++
    if (APPLY) await prisma.invoiceTitle.update({ where: { id: t.id }, data: { taxNumber: clean } })
  }

  console.log(`\n扫描 ${scanned} 张发票，需要改 ${changed} 张；抬头档案需要改 ${titlesChanged} 条`)
  if (suspicious) {
    console.log(`另有 ${suspicious} 张去空格后仍超 ${TAX_NUMBER_MAX_LEN} 位，**已跳过不改**，导出前请人工核实`)
  }
  if (!APPLY && (changed || titlesChanged || endorsements.length)) {
    console.log('加 --apply 重新执行才会真正写入')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

/**
 * 查「同一个收件箱」的已有账号（2026-10-25 第三轮加固；规则见 lib/security/email-canonical.ts）。
 * 只对 Gmail 有意义（点与 googlemail 别名）；带「+」的注册在调用前就被拒了。
 * 用户表很小（千级），按域名过滤后在库里比对去点后的本地部分，一条 SQL。
 */
import { prisma } from '../db'
import { canonicalEmail, isGmail } from './email-canonical'

/** 返回与 email 归一化后相同、但字面不同的已有账号 id；没有返回 null */
export async function findCanonicalTwin(email: string): Promise<number | null> {
  if (!isGmail(email)) return null
  const canon = canonicalEmail(email) // xxx@gmail.com
  const local = canon.slice(0, canon.lastIndexOf('@'))
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users
     WHERE (email LIKE '%@gmail.com' OR email LIKE '%@googlemail.com')
       AND REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(LOWER(email), '@', 1), '+', 1), '.', '') = ${local}
     LIMIT 1`
  return rows[0]?.id ?? null
}

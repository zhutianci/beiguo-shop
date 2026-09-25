import { PrismaClient } from '@prisma/client'

// 【只允许在一次性开发库上跑】2026-09-26 审计：旧版 seed 会建出公开默认密码（admin123）的管理员、
// 用 update 覆盖真实分类、插入上架的演示商品；而旧 scripts/deploy.sh 会在生产容器里提示跑它。
// 生产库的首个管理员：先在前台正常注册（真实邮箱，能走找回密码），再在库里
//   UPDATE users SET role='ADMIN' WHERE email='<你的邮箱>';
const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」不是一次性开发库（库名须含 dev 或 test）。生产库绝不跑 seed。`)
  process.exit(2)
}

const prisma = new PrismaClient()

async function main() {
  // 不再内置任何管理员账号或密码。本地要管理员账号请用 scripts/seed-local-demo.ts（admin@demo.local）

  // 创建商品分类
  const categories = [
    { name: 'Claude', icon: '/icons/claude.svg', sortOrder: 1 },
    { name: 'ChatGPT', icon: '/icons/chatgpt.svg', sortOrder: 2 },
    { name: '其他服务', icon: '/icons/other.svg', sortOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: {}, // 不覆盖已有分类的名称、图标、排序
      create: cat,
    })
  }
  console.log('Created categories')

  // 创建商品
  const products = [
    // Claude 系列
    {
      categoryId: 1,
      name: 'Claude Pro',
      description: 'Claude Pro 会员订阅，原价 20 美元/月',
      price: 150,
      originalPrice: 160,
      features: JSON.stringify(['无限制对话', '优先访问', '更快响应速度']),
      sortOrder: 1,
    },
    {
      categoryId: 1,
      name: 'Claude MAX 5x',
      description: 'Claude MAX 会员订阅（5倍用量），原价 100 美元/月',
      price: 780,
      originalPrice: 820,
      features: JSON.stringify(['5倍使用额度', '无限制对话', '优先访问', '更快响应速度']),
      sortOrder: 2,
    },
    {
      categoryId: 1,
      name: 'Claude MAX 20x',
      description: 'Claude MAX 会员订阅（20倍用量），原价 200 美元/月',
      price: 1580,
      originalPrice: 1650,
      features: JSON.stringify(['20倍使用额度', '无限制对话', '优先访问', '最快响应速度']),
      sortOrder: 3,
    },
    // ChatGPT 系列
    {
      categoryId: 2,
      name: 'ChatGPT Plus',
      description: 'ChatGPT Plus 会员订阅，原价 20 美元/月',
      price: 145,
      originalPrice: 155,
      features: JSON.stringify(['GPT-4 访问权限', '更快响应速度', '优先体验新功能']),
      sortOrder: 1,
    },
    {
      categoryId: 2,
      name: 'ChatGPT Pro',
      description: 'ChatGPT Pro 会员订阅，原价 200 美元/月',
      price: 1580,
      originalPrice: 1650,
      features: JSON.stringify(['无限制 GPT-4', 'o1 模型访问', '最高优先级', '更大上下文']),
      sortOrder: 2,
    },
  ]

  // 只在空库里插演示商品：重复跑不会插出重复商品
  if ((await prisma.product.count()) === 0) {
    for (const product of products) {
      await prisma.product.create({
        data: product,
      })
    }
    console.log('Created products')
  } else {
    console.log('已有商品，跳过演示商品')
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

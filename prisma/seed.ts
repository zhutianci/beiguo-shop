import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 预生成的 admin123 bcrypt hash（避免 standalone 模式下找不到 bcryptjs）
// 如需修改密码，请登录后台修改
const ADMIN_PASSWORD_HASH = '$2a$10$1nwsaZ4SDtsUmEDBml2MMuGK2WZb1MlJJxmrxQfIexqqV/fHqyiei'

async function main() {
  // 创建管理员账户（默认密码 admin123，登录后请立即修改）
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: ADMIN_PASSWORD_HASH,
      nickname: '管理员',
      role: 'ADMIN',
    },
  })
  console.log('Created admin:', admin.email)

  // 创建商品分类
  const categories = [
    { name: 'Claude', icon: '/icons/claude.svg', sortOrder: 1 },
    { name: 'ChatGPT', icon: '/icons/chatgpt.svg', sortOrder: 2 },
    { name: '其他服务', icon: '/icons/other.svg', sortOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(cat) + 1 },
      update: cat,
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

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }
  console.log('Created products')

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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Clock, Headphones, Sparkles, Star } from 'lucide-react'
import { PurchaseModal } from '@/components/purchase-modal'
import { ContactModal } from '@/components/contact-modal'

interface Product {
  id: number
  name: string
  description: string | null
  price: string | number
  originalPrice: string | number | null
  features: string | null
  stock: number
  sales: number
  category: { id: number; name: string }
}

const gradients = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
]

function getGradient(id: number) {
  return gradients[id % gradients.length]
}

function getTag(product: Product) {
  const name = product.name.toLowerCase()
  if (name.includes('20x')) return 'ULTIMATE'
  if (name.includes('5x')) return '5X POWER'
  if (name.includes('pro') && name.includes('chatgpt')) return 'o1 ACCESS'
  if (name.includes('plus')) return 'GPT-4'
  if (name.includes('pro')) return 'POPULAR'
  return 'NEW'
}

function parseFeatures(features: string | null): string[] {
  if (!features) return []
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const defaultProcess = [
  { step: '01', title: '下单支付', desc: '选择服务并完成支付' },
  { step: '02', title: '提供信息', desc: '填写您的账号邮箱' },
  { step: '03', title: '快速开通', desc: '10分钟内完成开通' },
  { step: '04', title: '开始使用', desc: '收到确认即可使用' },
]

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.data)
        } else {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="text-white/40">加载中...</div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/40 mb-4">商品不存在</div>
          <Link href="/products" className="text-purple-400 hover:text-purple-300">
            返回商品列表
          </Link>
        </div>
      </div>
    )
  }

  const gradient = getGradient(product.id)
  const tag = getTag(product)
  const features = parseFeatures(product.features)
  const price = Number(product.price)
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null
  const savings = originalPrice ? originalPrice - price : 0

  const benefits = features.slice(0, 4).map((f, i) => ({
    title: f,
    desc: '专业服务保障',
  }))

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回商品列表
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-3xl opacity-30 blur-md`} />

              <div className="relative glass rounded-3xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradient}`}>
                    {tag}
                  </div>
                  <span className="text-sm text-white/40">{product.category.name}</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-white/50 text-lg mb-8">{product.description}</p>
                )}

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80"
                      >
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {benefits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  服务亮点
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                        <Star className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-white/50">{benefit.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                开通流程
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {defaultProcess.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    className="relative glass rounded-2xl p-6"
                  >
                    <div className={`text-3xl font-bold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                      {item.step}
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-xs text-white/50">{item.desc}</p>
                    {i < defaultProcess.length - 1 && (
                      <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass rounded-2xl p-6"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                购买须知
              </h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-white/30 mt-1">·</span>
                  开通后有效期为 30 天，到期可续费
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/30 mt-1">·</span>
                  正规渠道开通，账号安全有保障
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/30 mt-1">·</span>
                  支持支付宝、微信支付
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/30 mt-1">·</span>
                  如有问题请联系客服，工作时间 9:00-22:00
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:sticky lg:top-32 self-start"
          >
            <div className="relative">
              <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-3xl opacity-50 blur-md`} />

              <div className="relative glass rounded-3xl p-8">
                <div className="mb-6">
                  <div className="text-sm text-white/50 mb-2">服务价格</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold">¥{price.toFixed(0)}</span>
                    {originalPrice && (
                      <span className="text-lg text-white/30 line-through">¥{originalPrice.toFixed(0)}</span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r ${gradient}`}>
                        省 ¥{savings.toFixed(0)}
                      </span>
                      <span className="text-xs text-white/40">限时优惠</span>
                    </div>
                  )}

                  {/* 销量 + 库存 */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-white/50">
                    <span>已售 <span className="text-white/80 font-medium">{product.sales}</span></span>
                    <span className="text-white/20">·</span>
                    <span>
                      {product.stock === -1
                        ? '现货充足'
                        : product.stock === 0
                          ? '已售罄'
                          : `余量 ${product.stock}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPurchaseOpen(true)}
                  className={`group w-full py-4 rounded-xl font-semibold bg-gradient-to-r ${gradient} flex items-center justify-center gap-2 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all mb-3`}
                >
                  立即购买
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setContactOpen(true)}
                  className="w-full py-4 rounded-xl font-medium glass hover:bg-white/10 transition-colors"
                >
                  联系客服
                </button>

                <div className="my-6 h-px bg-white/10" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">正规渠道</div>
                      <div className="text-xs text-white/40">安全可靠有保障</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium">极速开通</div>
                      <div className="text-xs text-white/40">最快 10 分钟到账</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Headphones className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium">专属客服</div>
                      <div className="text-xs text-white/40">7×12 小时支持</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: price,
          originalPrice: originalPrice || price,
          gradient,
        }}
      />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

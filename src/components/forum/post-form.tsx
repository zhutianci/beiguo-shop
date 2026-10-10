'use client'

/**
 * 发帖 / 编辑表单：讨论、提示词、教程三种类型（内容平台 P1，设计 §5）。
 *
 * - 讨论：选板块 + 正文 + 自由标签（与以前一样）
 * - 提示词：效果图（≥1，作者自己生成的）→ 模型 → 提示词与使用场景 → 心得（可空）→ 测试日期与账号
 * - 教程：产品标签 → 正文 → 测试日期与账号（必填：模型在变，日期就是可信度）→ 摘要
 * 三种都要做原创声明与 AI 撰写披露（设计 §6.1 / §6.3）。类型发出后不能改（URL 跟着类型走）。
 * 校验以服务端为准（lib/content/write.ts），这里只做提前提示。
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Send, AlertCircle, Tag, ShieldCheck } from 'lucide-react'
import { MarkdownEditor } from './markdown-editor'
import { GalleryInput } from '@/components/content/gallery-input'
import { forumFetch } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import { withRedirect } from '@/lib/safe-redirect'
import { SKILL_TAG_SLUG } from '@/lib/content/skill-lib'
import {
  ACCOUNT_TIERS, ACCOUNT_TIER_LABELS, AI_ASSIST, AI_ASSIST_LABELS, CONTENT_TYPES, CONTENT_TYPE_LABELS, ORIGINALITY,
  ORIGINALITY_LABELS, promptVariables, type AccountTier, type AiAssist, type ContentType, type Originality,
} from '@/lib/content/policy'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface TagOption {
  id: number
  slug: string
  name: string
  kind: 'MODEL' | 'TOPIC' | 'PRODUCT'
  facet: 'IMAGE' | 'VIDEO' | 'TEXT' | null
}

const FACET_NAMES = { IMAGE: '图像', VIDEO: '视频', TEXT: '文本（ChatGPT / Claude 等对话模型）' } as const

export interface PostFormInitial {
  type?: string
  title: string
  content: string
  images: string[]
  tags: string[]
  categoryId: number
  originality?: string
  sourceUrl?: string | null
  aiAssist?: string
  tagIds?: number[]
  prompt?: {
    prompt: string
    negativePrompt: string | null
    modelLabel: string | null
    aspectRatio: string | null
    needsRefImage: boolean
    useCase: string
  } | null
  testedOn?: string | null
  /** 站方据官方文档整理的教程：有资料核对日期，不要求测试日期 */
  checkedOn?: string | null
  accountTier?: string | null
  excerpt?: string | null
  app?: {
    name: string
    url: string
    pricing: string | null
    platforms: string | null
    trialNote: string | null
    selfPromo: boolean
    relation: string | null
  } | null
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50'
const selectCls = `${inputCls} [&>option]:bg-gray-900`

function pick<T extends string>(list: readonly T[], v: string | null | undefined, fallback: T): T {
  return (list as readonly string[]).includes(v ?? '') ? (v as T) : fallback
}

export function PostForm({
  postId,
  initial,
  initialType,
  remixOf,
}: {
  postId?: number
  initial?: PostFormInitial
  initialType?: string
  /** 「做同款」：原提示词 id，预填模型、主题与提示词（P2 二创链） */
  remixOf?: number
}) {
  const router = useRouter()
  const { user } = useUserStore()
  const hydrated = useHydrated()
  const isEdit = !!postId

  const [type, setType] = useState<ContentType>(pick(CONTENT_TYPES, initial?.type ?? initialType, 'DISCUSSION'))
  const [categories, setCategories] = useState<Category[]>([])
  const [tagOptions, setTagOptions] = useState<TagOption[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  // 提示词的「心得」里插的图只进正文，不进效果图画廊
  const [noteImages, setNoteImages] = useState<string[]>([])
  const [tags, setTags] = useState((initial?.tags ?? []).join(' '))
  const [tagIds, setTagIds] = useState<number[]>(initial?.tagIds ?? [])
  const [prompt, setPrompt] = useState(initial?.prompt?.prompt ?? '')
  const [useCase, setUseCase] = useState(initial?.prompt?.useCase ?? '')
  const [negativePrompt, setNegativePrompt] = useState(initial?.prompt?.negativePrompt ?? '')
  const [modelLabel, setModelLabel] = useState(initial?.prompt?.modelLabel ?? '')
  const [aspectRatio, setAspectRatio] = useState(initial?.prompt?.aspectRatio ?? '')
  const [needsRefImage, setNeedsRefImage] = useState(initial?.prompt?.needsRefImage ?? false)
  const [testedOn, setTestedOn] = useState(initial?.testedOn ?? '')
  const [accountTier, setAccountTier] = useState<AccountTier | ''>(initial?.accountTier ? pick(ACCOUNT_TIERS, initial.accountTier, 'OTHER') : '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  // AI 应用（P2）
  const [appName, setAppName] = useState(initial?.app?.name ?? '')
  const [appUrl, setAppUrl] = useState(initial?.app?.url ?? '')
  const [appPricing, setAppPricing] = useState(initial?.app?.pricing ?? '')
  const [appPlatforms, setAppPlatforms] = useState(initial?.app?.platforms ?? '')
  const [appTrial, setAppTrial] = useState(initial?.app?.trialNote ?? '')
  const [selfPromo, setSelfPromo] = useState(initial?.app?.selfPromo ?? false)
  const [relation, setRelation] = useState(initial?.app?.relation ?? 'AUTHOR')
  // 原创声明与 AI 辅助披露（内容平台设计 §6.1 / §6.3）：必选，默认值是最常见的情况
  const [originality, setOriginality] = useState<Originality>(pick(ORIGINALITY, initial?.originality, 'ORIGINAL_FIRST'))
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')
  const [aiAssist, setAiAssist] = useState<AiAssist>(pick(AI_ASSIST, initial?.aiAssist, 'NONE'))
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [remixTitle, setRemixTitle] = useState<string | null>(null)

  // 做同款：拉原提示词，预填模型 / 主题 / 提示词，标题留给作者改（同款要有自己的出图和心得）
  useEffect(() => {
    if (!remixOf || isEdit) return
    fetch(`/api/forum/posts/${remixOf}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || d.data.type !== 'PROMPT') return
        setType('PROMPT')
        setRemixTitle(d.data.title)
        setTagIds(d.data.tagIds || [])
        if (d.data.prompt) {
          setPrompt(d.data.prompt.prompt)
          setUseCase(d.data.prompt.useCase)
          setModelLabel(d.data.prompt.modelLabel ?? '')
          setAspectRatio(d.data.prompt.aspectRatio ?? '')
          setNeedsRefImage(!!d.data.prompt.needsRefImage)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remixOf])

  useEffect(() => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCategories(d.data)
          if (!categoryId && d.data.length) setCategoryId(d.data[0].id)
        }
      })
    fetch('/api/content/tags')
      .then((r) => r.json())
      .then((d) => d.success && setTagOptions(d.data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const byKind = useMemo(() => {
    const m: Record<string, TagOption[]> = { MODEL: [], TOPIC: [], PRODUCT: [] }
    tagOptions.forEach((t) => m[t.kind]?.push(t))
    return m
  }, [tagOptions])
  const variables = useMemo(() => promptVariables(prompt), [prompt])

  const toggleTag = (t: TagOption, single = false) => {
    setTagIds((prev) => {
      if (prev.includes(t.id)) return prev.filter((x) => x !== t.id)
      if (single) {
        const sameKind = new Set(tagOptions.filter((o) => o.kind === t.kind).map((o) => o.id))
        return [...prev.filter((x) => !sameKind.has(x)), t.id]
      }
      return [...prev, t.id]
    })
  }
  const selectedOf = (kind: string) => tagOptions.filter((t) => t.kind === kind && tagIds.includes(t.id))
  // 选中的模型决定这条提示词是图像 / 视频 / 文本：图像类必须有效果图，文本类不需要图
  const modelFacet = selectedOf('MODEL')[0]?.facet ?? null

  const submit = async () => {
    setErr(null)
    if (title.trim().length < 2) return setErr('标题至少 2 个字')
    if (type === 'DISCUSSION') {
      if (!categoryId) return setErr('请选择板块')
      if (!content.trim()) return setErr('内容不能为空')
    }
    if (type === 'PROMPT') {
      if (selectedOf('MODEL').length !== 1) return setErr('请选择 1 个模型')
      if (modelFacet === 'IMAGE' && images.length < 1) return setErr('请至少上传 1 张你自己用这条提示词生成的效果图')
      if (modelFacet === 'TEXT' && content.trim().length < 20) return setErr('请写一段使用说明或示例输出')
      if (prompt.trim().length < 10) return setErr('提示词至少 10 个字')
      if (useCase.trim().length < 4) return setErr('请用一两句话写清楚适合做什么')
    }
    if (type === 'APP') {
      if (!appName.trim()) return setErr('请填写应用名称')
      if (!/^https?:\/\//i.test(appUrl.trim())) return setErr('官网地址需以 http:// 或 https:// 开头')
      if (content.trim().length < 50) return setErr('请写写「我用它解决了什么」（至少 50 字）')
      if (selfPromo && !appTrial.trim()) return setErr('作者自荐必须写明怎么试用')
    }
    if (type === 'GUIDE') {
      if (selectedOf('PRODUCT').length < 1) return setErr('请选择教程针对的产品')
      if (!content.trim()) return setErr('正文不能为空')
      if (!testedOn && !initial?.checkedOn) return setErr('请填写测试日期')
      if (!accountTier) return setErr('请选择测试时用的账号类型')
    }
    if (originality !== 'ORIGINAL_FIRST' && !/^https?:\/\//i.test(sourceUrl.trim())) {
      return setErr('非首发或转载的内容，请填写原文地址（http:// 或 https:// 开头）')
    }

    setSubmitting(true)
    try {
      const common = {
        title, content, images, originality, aiAssist,
        sourceUrl: originality === 'ORIGINAL_FIRST' ? '' : sourceUrl.trim(),
        ...(isEdit ? {} : { type }),
        ...(remixOf && !isEdit && type === 'PROMPT' ? { remixOfId: remixOf } : {}),
      }
      const payload =
        type === 'DISCUSSION'
          ? { ...common, categoryId, tags }
          : {
              ...common,
              tagIds,
              testedOn: testedOn || null,
              accountTier: accountTier || null,
              excerpt: excerpt.trim() || null,
              ...(type === 'APP'
                ? {
                    app: {
                      name: appName.trim(),
                      url: appUrl.trim(),
                      pricing: appPricing.trim() || null,
                      platforms: appPlatforms.trim() || null,
                      trialNote: appTrial.trim() || null,
                      selfPromo,
                      relation: selfPromo ? relation : null,
                    },
                  }
                : {}),
              ...(type === 'PROMPT'
                ? {
                    prompt: {
                      prompt: prompt.trim(),
                      useCase: useCase.trim(),
                      negativePrompt: negativePrompt.trim() || null,
                      modelLabel: modelLabel.trim() || null,
                      aspectRatio: aspectRatio.trim() || null,
                      needsRefImage,
                    },
                  }
                : {}),
            }
      const url = isEdit ? `/api/forum/posts/${postId}` : '/api/forum/posts'
      const res = await forumFetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        // 进待审的也跳到内容页：作者能看到「审核中」提示条（只有本人和管理员能打开）
        router.push(data.data?.path || `/forum/${isEdit ? postId : data.data.id}`)
        router.refresh()
      } else {
        setErr(data.error || '提交失败')
      }
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 内容平台 P0 起发帖须登录（匿名发帖已关闭）。等水合完再判断：zustand persist 在水合那一帧返回 user=null
  if (hydrated && !user) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-3">
        <p className="text-white/70">登录后才能发帖</p>
        <p className="text-xs text-white/40">社区内容需要署名；新人发布的内容会先经过审核，工作日 24 小时内处理。</p>
        <Link
          href={withRedirect('/login', isEdit ? `/forum/${postId}/edit` : `/forum/new${type !== 'DISCUSSION' ? `?type=${type}` : ''}`)}
          className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold"
        >
          去登录
        </Link>
      </div>
    )
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm transition-all ${
      active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'glass text-white/70 hover:text-white'
    }`

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      {/* 类型（只在新建时可选） */}
      {!isEdit && (
        <div>
          <label className="block text-sm text-white/60 mb-2">发布类型</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t)
                  setTagIds([])
                }}
                className={`px-4 py-3 rounded-xl text-sm text-left transition-all ${
                  type === t ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'glass text-white/70 hover:text-white'
                }`}
              >
                <div className="font-semibold">{CONTENT_TYPE_LABELS[t]}</div>
                <div className="text-xs opacity-70 mt-0.5">
                  {t === 'DISCUSSION' ? '提问、反馈、交流' : t === 'PROMPT' ? '可复制的提示词模板' : t === 'APP' ? '应用、工作流、作者自荐' : '功能教程、实测、踩坑'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {remixTitle && type === 'PROMPT' && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          正在做「{remixTitle}」的同款：模型和提示词已预填，上传你自己的出图、写下你的改法即可。发布后会出现在原作的「同款作品」里。
        </div>
      )}

      {/* 讨论：板块 */}
      {type === 'DISCUSSION' && (
        <div>
          <label className="block text-sm text-white/60 mb-2">选择板块</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className={chip(categoryId === c.id)}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提示词：效果图在前（文本类不需要） */}
      {type === 'PROMPT' && modelFacet !== 'TEXT' && (
        <div>
          <label className="block text-sm text-white/60 mb-1">
            {modelFacet === 'VIDEO' ? '封面 / 关键帧截图（选填，建议上传）' : '效果图（至少 1 张，必须是你自己用这条提示词生成的）'}
          </label>
          <p className="text-xs text-white/35 mb-2">第一张是封面。别人的作品请勿上传；需要参考图的提示词，可以把「输入图 → 输出图」都传上来。</p>
          <GalleryInput value={images} onChange={setImages} />
        </div>
      )}

      {/* 标题 */}
      <div>
        <label className="block text-sm text-white/60 mb-2">标题</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder={
            type === 'PROMPT' ? '例如：复古港风证件照（换背景色）' : type === 'GUIDE' ? '用大家会搜的问法，例如：ChatGPT 记忆已满怎么办' : '一句话说明你的主题'
          }
          className={`${inputCls} py-3 text-lg`}
        />
      </div>

      {/* 提示词：模型 + 主题 + 提示词本体 */}
      {type === 'PROMPT' && (
        <>
          <div>
            <label className="block text-sm text-white/60 mb-2">模型（选 1 个，决定这是图像、视频还是文本提示词）</label>
            <div className="space-y-2">
              {(['IMAGE', 'VIDEO', 'TEXT'] as const).map((f) => {
                const list = byKind.MODEL.filter((t) => t.facet === f)
                if (!list.length) return null
                return (
                  <div key={f} className="flex flex-wrap items-center gap-2">
                    <span className="w-full text-xs text-white/35 sm:w-auto sm:min-w-[4rem]">{FACET_NAMES[f]}</span>
                    {list.map((t) => (
                      <button key={t.id} type="button" onClick={() => toggleTag(t, true)} className={chip(tagIds.includes(t.id))}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
            <input
              value={modelLabel}
              onChange={(e) => setModelLabel(e.target.value)}
              maxLength={60}
              placeholder="版本或档位（选填），例如：Thinking 模式、Pro"
              className={`${inputCls} mt-2`}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">主题（选填，最多 3 个）</label>
            <div className="flex flex-wrap gap-2">
              {/* 「Skill 库」只用于 AI 应用（/skills 目录按它取数），提示词的主题里不列 */}
              {byKind.TOPIC.filter((t) => t.slug !== SKILL_TAG_SLUG && (!modelFacet || !t.facet || t.facet === modelFacet)).map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t)} className={chip(tagIds.includes(t.id))}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">提示词全文</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder={
                modelFacet === 'TEXT'
                  ? '建议按「角色 / 背景 / 任务 / 约束 / 输出格式」写，可替换的部分用 [方括号]，例如：你是一名 [学科] 方向的统计顾问……'
                  : '可替换的部分用 [方括号] 标出来，例如：把 [你的照片] 改成白底证件照，背景换成 [颜色]'
              }
              className={`${inputCls} font-mono text-sm resize-y`}
            />
            {variables.length > 0 && <p className="text-xs text-purple-300/80 mt-1">识别到可替换变量：{variables.map((v) => `[${v}]`).join('、')}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">适合做什么</label>
            <input value={useCase} onChange={(e) => setUseCase(e.target.value)} maxLength={300} placeholder="一两句话，例如：把生活照换成可用的证件照，适合办签证前自查" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} maxLength={16} placeholder="画幅比例（选填），例如 3:4" className={inputCls} />
            <label className="flex items-center gap-2 text-sm text-white/70 px-1">
              <input type="checkbox" checked={needsRefImage} onChange={(e) => setNeedsRefImage(e.target.checked)} className="h-4 w-4" />
              需要上传参考图
            </label>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-white/50">负面提示词（选填，主要给 SD / Midjourney）</summary>
            <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} rows={2} maxLength={2000} className={`${inputCls} mt-2 font-mono text-sm`} />
          </details>
        </>
      )}

      {/* AI 应用：基本信息 + 作者自荐披露（设计 §9.1：隔离、披露、可试用） */}
      {type === 'APP' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={60} placeholder="应用名称" className={inputCls} />
            <input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} maxLength={500} placeholder="官网地址 https://…" className={inputCls} />
            <input value={appPricing} onChange={(e) => setAppPricing(e.target.value)} maxLength={60} placeholder="价格（选填）：免费 / 免费+付费 / 开源…" className={inputCls} />
            <input value={appPlatforms} onChange={(e) => setAppPlatforms(e.target.value)} maxLength={100} placeholder="平台（选填）：网页 / iOS / 安卓 / 插件…" className={inputCls} />
          </div>
          <input value={appTrial} onChange={(e) => setAppTrial(e.target.value)} maxLength={200} placeholder={selfPromo ? '怎么试用（必填）：免费额度、试用链接或演示' : '怎么试用（选填）'} className={inputCls} />
          <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={selfPromo} onChange={(e) => setSelfPromo(e.target.checked)} disabled={isEdit} className="mt-1 h-4 w-4" />
            <span>
              这是我自己的 / 我参与的产品（作者自荐）
              <span className="block text-xs text-white/40">
                自荐会放在「作者自荐」专区并显式标注，链接标为推广；需要创作者等级、每 30 天 1 条、人工审核。正文请写开发故事、技术选型或真实数据，纯广告不收。
              </span>
            </span>
          </label>
          {selfPromo && (
            <select value={relation} onChange={(e) => setRelation(e.target.value)} disabled={isEdit} className={selectCls}>
              <option value="AUTHOR">我是作者 / 开发者</option>
              <option value="EMPLOYEE">我在这家公司工作</option>
              <option value="OTHER">我与该产品有其他利益关系</option>
            </select>
          )}
          <div>
            <label className="block text-sm text-white/60 mb-2">场景（选填，最多 3 个）</label>
            <div className="flex flex-wrap gap-2">
              {byKind.TOPIC.filter((t) => t.facet === 'TEXT' || !t.facet).map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t)} className={chip(tagIds.includes(t.id))}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 教程：产品与模型 */}
      {type === 'GUIDE' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-white/60 mb-2">针对的产品（1–2 个）</label>
            <div className="flex flex-wrap gap-2">
              {byKind.PRODUCT.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t)} className={chip(tagIds.includes(t.id))}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">涉及的模型（选填）</label>
            <div className="flex flex-wrap gap-2">
              {byKind.MODEL.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t)} className={chip(tagIds.includes(t.id))}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 正文 */}
      <div>
        <label className="block text-sm text-white/60 mb-2">
          {type === 'APP'
            ? '我用它解决了什么（必填：场景、怎么用、效果、优缺点；截图更好）'
            : type === 'PROMPT'
            ? modelFacet === 'TEXT'
              ? '使用说明与示例输出（必填：怎么填变量、怎么追问，再贴一段示例输出）'
              : '心得与说明（选填：怎么调、失败率、注意事项——写了的提示词更容易被精选）'
            : '正文'}
        </label>
        {type === 'PROMPT' ? (
          <MarkdownEditor value={content} onChange={setContent} images={noteImages} onImagesChange={setNoteImages} minHeight={140} />
        ) : (
          <MarkdownEditor value={content} onChange={setContent} images={images} onImagesChange={setImages} />
        )}
        {type === 'GUIDE' && (
          <p className="text-xs text-white/35 mt-1">建议结构：适用于谁 → 结论先说 → 步骤（附截图）→ 常见问题。表格可用 Markdown 写法。</p>
        )}
      </div>

      {/* 测试日期与账号（提示词选填、教程必填） */}
      {(type === 'PROMPT' || type === 'GUIDE') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/60 mb-2">测试日期{type === 'GUIDE' && !initial?.checkedOn ? '' : '（选填）'}</label>
            {type === 'GUIDE' && initial?.checkedOn && (
              <p className="text-xs text-white/35 mb-2">这篇是站方据官方文档整理的（资料核对于 {initial.checkedOn}），亲自实测后再填测试日期。</p>
            )}
            <input type="date" value={testedOn} onChange={(e) => setTestedOn(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">测试时用的账号{type === 'GUIDE' ? '' : '（选填）'}</label>
            <select value={accountTier} onChange={(e) => setAccountTier(e.target.value as AccountTier | '')} className={selectCls}>
              <option value="">请选择</option>
              {ACCOUNT_TIERS.map((t) => (
                <option key={t} value={t}>{ACCOUNT_TIER_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {type === 'GUIDE' && (
        <div>
          <label className="block text-sm text-white/60 mb-2">摘要（选填，120 字以内，会显示在列表和搜索结果里）</label>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={160} className={inputCls} />
        </div>
      )}

      {/* 讨论：自由标签 */}
      {type === 'DISCUSSION' && (
        <div>
          <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> 标签（空格分隔，最多 5 个）
          </label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如：建议 bug 续费" className={inputCls} />
        </div>
      )}

      {/* 原创声明 + AI 辅助披露 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 原创声明
          </label>
          <select value={originality} onChange={(e) => setOriginality(e.target.value as Originality)} className={selectCls}>
            {ORIGINALITY.map((o) => (
              <option key={o} value={o}>{ORIGINALITY_LABELS[o]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">正文是否使用 AI 撰写</label>
          <select value={aiAssist} onChange={(e) => setAiAssist(e.target.value as AiAssist)} className={selectCls}>
            {AI_ASSIST.map((o) => (
              <option key={o} value={o}>{AI_ASSIST_LABELS[o]}</option>
            ))}
          </select>
        </div>
      </div>
      {originality !== 'ORIGINAL_FIRST' && (
        <div>
          <label className="block text-sm text-white/60 mb-2">原文地址（必填）</label>
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} maxLength={500} placeholder="https://…" className={inputCls} />
        </div>
      )}
      <p className="text-xs text-white/35 leading-relaxed">
        「原创首发」指本站是第一个发布的地方（发到本站前 7 天内只在自己的公众号、博客发过也算）。
        只有原创首发的内容会进入精选；转载请注明来源，并确认已获得授权。出图、截图本身是 AI 生成的不影响这一项，这里问的是文字。
      </p>

      {err && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {err}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/40">
          {/* 只显示昵称不显示邮箱：公开作者名已不再回落到邮箱（审计 G48），提示要和实际显示一致 */}
          {user
            ? `以 ${user.nickname && !user.nickname.includes('@') ? user.nickname : '会员（未设置昵称，可在个人中心设置）'} 身份发布 · 新人内容审核后公开`
            : ''}
        </p>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50 shrink-0"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isEdit ? '保存修改' : '发布'}
        </button>
      </div>
    </div>
  )
}

/**
 * 充值落地页清单。
 *
 * 【为什么要有这么一份注册表】这批页面要同时出现在四个地方：路由本身、sitemap、
 * 站内导航（footer / hub 页）、以及彼此的相关链接。四处各写一遍，加一页就漏一处。
 * 更要紧的是 Google 对 doorway page 的第 4 条判定看的是
 * 「这些页面有没有进入一个可浏览的站内层级」——只挂在 sitemap 里的孤儿页正是被点名的形态。
 * 有了这份注册表，「每一页都能从 hub 页和 footer 点到」是结构上成立的，不是靠人记得。
 *
 * 【为什么用匹配规则而不是写死商品 ID】商品会上下架、会加档位（线上已经有 id 2/4/7/16/21/27/29 这种断号）。
 * 写死 ID 的后果是某天商品换了个 ID，页面上的价格表默默变空，而没有任何报错。
 * 按「分类 + 名称关键词」匹配，新增一个 ChatGPT Plus 档位会自动出现在对应页面上。
 *
 * 【关键词依据】2026-09-19 用 Google 中文下拉建议接口实测 50+ 个种子词的结果：
 *   · 「代开」「代购」「代订阅」「ai会员代充」「ai代充」联想数全部为 0 —— 零需求词，不做页面
 *   · 「购买」覆盖面最广（ChatGPT / Claude / Codex / 谷歌账号 四类都有联想）
 *   · 「充值」最贴合本站卡密交付（chatgpt充值 8 条、chatgpt plus 充值 6 条）
 *   · 「代充」只有 3 条且全是信任审查意图（靠谱吗 / 知乎 / v2ex）—— 当次要词用，放进正文与 FAQ
 *   · 商业密度最高的是「国内」集群（chatgpt plus 国内 返回 10 条，无一条纯信息词）
 *   · 转化最近的是「信用卡被拒 / 付款未获批准」集群
 *   · 「会员」对 Claude 成立（claude 会员 10 条满额），对 ChatGPT **不成立**
 *     （chatgpt会员 返回的是亚美尼亚语联想，Google 没把它和中文商业意图关联）
 */

/** 商品匹配规则：分类名 + 商品名必须/不得包含的关键词（全部小写比较） */
export interface ProductMatch {
  categoryName?: string
  /**
   * 分类名匹配其中**任意一个**即可。用于后台分类名有多种写法/拼错的情况——
   * 线上 Grok 那一类的分类名手误拼成了「Gork」，这里两种都认，
   * 这样后台把它改回「Grok」时页面不会静默变空（那种事故不报错、只是表没了）。
   */
  categoryAny?: string[]
  /** 商品名必须包含其中**至少一个** */
  nameAny?: string[]
  /** 商品名不得包含其中任何一个 */
  nameNone?: string[]
}

export interface LandingDef {
  /** 路由末段，完整路径是 /chongzhi/<slug>；hub 页 slug 为空字符串 */
  slug: string
  /** hub 页与 footer 上显示的短名 */
  navLabel: string
  /** 页面 H1。主词放最前面 */
  h1: string
  /** <title>。30 字符内的部分最要紧，站名放最后 */
  title: string
  description: string
  /** 一句话，hub 页的卡片摘要 */
  blurb: string
  /** 这一页对应哪些在售商品 */
  match: ProductMatch
}

export const LANDING_BASE = '/chongzhi'

export const LANDING_HUB = {
  path: LANDING_BASE,
  navLabel: 'AI 会员充值',
  h1: 'AI 会员充值与账号服务',
  title: 'AI 会员充值 - ChatGPT Plus、Claude Pro 代充价格表 - 贝果科技',
  description:
    'ChatGPT Plus / Pro、Claude Pro / Max 会员充值与代充价格表，另有 Codex 接码、Claude 注册与 KYC 认证。卡密自助兑换，支持支付宝，无需信用卡。',
}

export const LANDINGS = [
  {
    slug: 'chatgpt-plus',
    navLabel: 'ChatGPT Plus 充值',
    h1: 'ChatGPT Plus 充值：国内怎么充、多少钱、信用卡被拒怎么办',
    title: 'ChatGPT Plus 怎么充值、多少钱、代充值全指南 - 贝果科技',
    description:
      'ChatGPT Plus 国内充值全指南：￥135 起，卡密自助兑换，无需信用卡，支持支付宝。含信用卡被拒、付款未获批准、iOS 与信用卡两种充值方式的区别与排查。',
    blurb: '国内不用信用卡也能开 Plus。两种充值方式、真实价格、失败排查全在这一页。',
    // 【nameNone 里必须有 'pro'】线上 Pro 5x 的商品名是
    // 「ChatGPT Pro 5x 自助充值 | 信用卡充值（不可覆盖plus）」——名字里带 plus 这个字。
    // 只按 nameAny:['plus'] 匹配会把两个 Pro 档位一起拉进 Plus 页的价格表。
    match: { categoryName: 'ChatGPT', nameAny: ['plus'], nameNone: ['年费', 'pro'] },
  },
  {
    slug: 'chatgpt-pro',
    navLabel: 'ChatGPT Pro 充值',
    h1: 'ChatGPT Pro 5x 充值：价格、与 Plus 的区别、能不能覆盖已有 Plus',
    title: 'ChatGPT Pro 5x 怎么充值、多少钱、和 Plus 的区别 - 贝果科技',
    description:
      'ChatGPT Pro 5x 充值￥720 起，卡密自助兑换。讲清 Pro 与 Plus 的额度差别、信用卡档与 iOS 档能不能覆盖已有 Plus 订阅，以及充值前必须确认的账户状态。',
    blurb: 'Pro 5x 两个档位的关键差别是「能不能盖掉现有 Plus」。买错了退不了，先看这一页。',
    match: { categoryName: 'ChatGPT', nameAny: ['pro'] },
  },
  {
    slug: 'claude-pro',
    navLabel: 'Claude Pro 充值',
    h1: 'Claude Pro 充值：会员价格、iOS 订阅充值怎么用、封号风险说明',
    title: 'Claude Pro 怎么充值、会员多少钱、代充值指南 - 贝果科技',
    description:
      'Claude Pro 会员充值￥145 起，走 iOS 订阅充值无需上号，卡密自助兑换。含兑换前必须核对的两件事、Pro 升 Max 的做法，以及封号不质保的明确边界。',
    blurb: 'iOS 订阅充值不用把账号交出去，这是 Claude 侧封号率最低的一种充值方式。',
    match: { categoryName: 'Claude', nameAny: ['pro'], nameNone: ['max'] },
  },
  {
    slug: 'claude-max',
    navLabel: 'Claude Max 充值',
    h1: 'Claude Max 5x 充值：价格、5x 与 20x 的额度差别、兑换前的四项检查',
    title: 'Claude Max 5x 怎么充值、多少钱、和 Pro 的区别 - 贝果科技',
    description:
      'Claude Max 5x 会员充值￥950，苹果订阅原价 125 美元/月。讲清 Pro / Max 5x / Max 20x 的额度差别、什么情况下该上 Max，以及兑换前必须核对的四项账户状态。',
    blurb: '搜 Max 的人通常已经做过功课，这一页直接给规格对照和兑换前检查清单。',
    match: { categoryName: 'Claude', nameAny: ['max'] },
  },
  {
    slug: 'claude-kyc',
    navLabel: 'Claude KYC 认证',
    h1: 'Claude KYC 身份认证被弹了怎么办：先分清是不是封号、别急着做哪几件事',
    title: 'Claude KYC 认证是什么、被弹了怎么办、要不要找人代办 - 贝果科技',
    description:
      'Claude 账号突然要求 KYC 身份验证：怎么确认它不是封禁、为什么没有所谓的「必过材料清单」（含中国护照与香港身份这类问题为什么没有确定答案）、失败前该注意什么，以及￥180 的活人认证代办（失败不收费）。',
    blurb: '账号被弹 KYC 之后能做的事很有限，做错一次机会就少一次。先看清楚再动。',
    match: { nameAny: ['kyc'] },
  },
  {
    slug: 'claude-zhuce',
    navLabel: 'Claude 注册',
    h1: 'Claude 注册全流程：注册不了怎么办、手机号验证、家宽 IP 与封号',
    title: 'Claude 怎么注册、注册不了、需要手机号验证怎么办 - 贝果科技',
    description:
      'Claude 账号注册卡在哪一步怎么解决：手机号验证收不到码、注册即封、IP 被判定为机房、需要家宽环境。含荷兰与美区实体卡接码（￥8 起）与家宽注册的普号。',
    blurb: '注册 Claude 会死在三个地方：号码、IP、验证码。这一页按顺序讲清每一个。',
    // 不限分类：这一页同时覆盖「短信接码」分类下的 Claude 验证码，
    // 和「Claude」分类下的家宽注册普号——注册这件事要的是这一整组东西。
    match: { nameAny: ['claude注册验证码', '普号'] },
  },
  {
    slug: 'codex-jiema',
    navLabel: 'Codex 接码',
    h1: 'Codex 接码：OpenAI Codex 注册验证码怎么收、美区实体卡与虚拟号的区别',
    title: 'Codex 接码怎么用、去哪买、美区实体卡验证码 - 贝果科技',
    description:
      'OpenAI Codex 注册要手机验证码怎么办：为什么虚拟号会被拒、美区实体手机卡接码（￥15/次）怎么用、收不到码的排查顺序，以及账号被封之后的替代路径。',
    blurb: 'Codex 注册卡在验证码，多半是号码类型的问题，不是运气问题。',
    match: { categoryName: '短信接码', nameAny: ['codex'] },
  },
  {
    slug: 'google-zhanghao',
    navLabel: '谷歌账号',
    h1: '谷歌账号购买：成品号是什么、2FA 与辅助邮箱怎么登、买来开 Gemini 要注意什么',
    title: '谷歌账号购买：成品号怎么登录、多少钱 - 贝果科技',
    description:
      '谷歌账号购买：2020-2025 年注册的成品号 ￥30 起，支持支付宝，付款后即时发货。讲清 2FA 与辅助邮箱两种登录方式怎么分、到手先登录再改密码的顺序、「质保 3 天内首登」到底保什么，以及买号开 Gemini 前该知道的边界。',
    blurb: '买成品号最容易踩的坑是登录方式。2FA 和辅助邮箱怎么分、到手先做什么，这一页讲清。',
    // 【slug 用 zhanghao 不用 youxiang】2026-09-19 实测：`谷歌邮箱购买` 联想数为 0，
    // 而 `谷歌账号购买` 有真实联想并带出三个修饰词。后台商品名叫「谷歌邮箱成品号」，
    // 用的正是那个零需求词——商品名暂时不动，但对外的页面主词必须是「谷歌账号购买」。
    // 【为什么按分类匹配】这一类目前只有一个 SKU，但很可能按注册年份或登录方式拆档位，
    // 按分类匹配的话新档位会自动进价格表，不用回来改这里。
    match: { categoryName: '谷歌邮箱' },
  },
  {
    slug: 'grok-super',
    navLabel: 'Grok 充值',
    h1: 'Grok Super 充值：三档怎么选、国内怎么付钱',
    title: 'Grok Super 充值 - xAI Grok 会员代充多少钱 - 贝果科技',
    description:
      'xAI Grok Super 会员充值：￥210 起，另有三个月档与 Super Heavy 档。卡密自助兑换，走 iOS 订阅充值，支付宝付款，无需境外支付方式。含三档差别、兑换前必须确认的事与退款口径。',
    blurb: 'Grok 三个档位差价很大（￥210 到 ￥1688），先看清楚区别再下单。',
    /*
     * 【为什么用 categoryAny 而不是 categoryName】后台这个分类名手误拼成了「Gork」。
     * 写死 'Gork' 的话，哪天有人把它改回正确的「Grok」，这一页的价格表会**静默变空**
     * ——不报错、页面照常渲染，只是表没了。两种拼写都认，改与不改都不会出事。
     *
     * 【关键词依据：这一页没有】其余八页的主词都是 2026-09-19 用 Google 下拉建议
     * 实测过的。Grok 这一批没有——服务器在国内连不上那个接口（实测超时），
     * 浏览器侧也被拒。所以这一页**不是**按搜索需求立项的，
     * 是因为站上在卖 3 个 Grok 商品而充值总览页里找不到它，买家发现不了。
     * 等有条件实测之后再决定要不要按需求加厚，别默认照着别的页面的体量写。
     */
    match: { categoryAny: ['Grok', 'Gork'] },
  },
] as const satisfies readonly LandingDef[]

export function landingPath(slug: string): string {
  return `${LANDING_BASE}/${slug}`
}

/**
 * 注册表里所有合法 slug 的联合类型。
 * 落地页在模块顶层写 `findLanding('chatgpt-plus')`，slug 打错的话——
 * 如果签名收的是 string，错误要等到运行时才炸成整个路由 500；
 * 收成联合类型，tsc 当场就报。目录名与注册表对不上是很容易发生的事
 * （改 slug 时忘了改目录，或反过来）。
 */
export type LandingSlug = (typeof LANDINGS)[number]['slug']

/** 找不到就抛，而不是返回 undefined 让调用方用 `!` 抹掉 */
export function findLanding(slug: LandingSlug): LandingDef {
  const found = LANDINGS.find((l) => l.slug === slug)
  if (!found) throw new Error(`[landing] registry 里没有 slug=${slug}`)
  return found
}

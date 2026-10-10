/**
 * 内容平台 P0 的纯函数自测。**不连数据库**。
 *   npx tsx scripts/check-content-policy.ts
 *
 * 钉住几件事：
 *  - 信任等级与审核判定（新人先审后发、编辑后重审、评论只有命中风险才进待审）
 *  - 收录闸门：P0 总开关关着时一律不收录；开关打开后转载 / AI 主笔 / 薄内容仍不收录
 *  - 风险检测：外链、联系方式、敏感词；站内链接不算外链
 *  - Markdown 的 safeUrl 不再放行 //evil.com 与 /\evil.com，外链 rel 带 ugc
 *  - 帖子 images 只收本站论坛上传地址
 *  - 图片去元数据：JPEG 删 EXIF 但保留方向、PNG 删文本块、WebP 删 EXIF 块并清标志位；坏图原样返回
 *  - 内容扩容（10-07）：定时放量队列 SCHEDULED 对外不可见、不收录，改完不提前公开；放量顺序交错；
 *    AI 应用种子文件的编译校验（拿 scripts/fixtures/seed-apps/ 的好 / 坏样例跑 build-seed-bundle，**会起一个子进程**）
 *  - Skill 库目录（10-10）：什么算 Skill 库、平台分组、安装命令的识别、/skills 的收录门槛（ROOT），
 *    以及 scripts/fixtures/seed-apps/skills/ 的三个 Skill 库样例能按内容约定编译（agent-skills 是合法的 TOPIC 标签、没有 facet）
 */
import {
  trustLevelFrom,
  postReviewOnCreate,
  postReviewOnEdit,
  commentReviewOnCreate,
  contentFlags,
  isIndexable,
  isPublic,
  canView,
  isForumImageUrl,
  readableLength,
  INDEXING_OPEN,
  qualityGateReason,
  isHubIndexable,
  parseIdSlug,
  contentPath,
  promptVariables,
  isValidSlug,
  REVIEW_STATUSES,
  releasePerDay,
  shanghaiDayStart,
  MIN_APP_CHARS,
} from '../src/lib/content/policy'
import { releaseOrder, bucketOf, fnv1a } from '../prisma/release-order'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parseTestedOn } from '../src/lib/content/write'
import { simhash, hamming, NEAR_DUP_DISTANCE } from '../src/lib/content/simhash'
import { levelOf } from '../src/lib/content/points'
import { renderMarkdown, safeUrl, stripSiteRef } from '../src/lib/markdown'
import { ctaHref, parseFrom } from '../src/lib/content/cta'
import { monthKey, monthRange, awardRequestId } from '../src/lib/content/award'
import { monthStart, optionsSchema, DEFAULT_OPTIONS } from '../src/lib/content/shop'
import { stripImageMetadata, readExifOrientation, minimalExifApp1 } from '../src/lib/image-meta'
import {
  SKILL_TAG_SLUG,
  SKILLS_PATH,
  SKILL_PAGE_SIZE,
  isSkillLibrary,
  skillPlatformsOf,
  skillPlatformParam,
  parseInstall,
  repoLabelOf,
} from '../src/lib/content/skill-lib'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}

const HOSTS = ['bigolab.com']
const now = new Date('2026-10-06T00:00:00Z')
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000)

console.log('信任等级')
ok('管理员 = 9', trustLevelFrom({ role: 'ADMIN', createdAt: now, approvedPosts: 0, featuredPosts: 0 }, now) === 9)
ok('新注册无过审 = 0', trustLevelFrom({ role: 'USER', createdAt: daysAgo(30), approvedPosts: 0, featuredPosts: 0 }, now) === 0)
ok('有过审但注册不满 7 天 = 0', trustLevelFrom({ role: 'USER', createdAt: daysAgo(3), approvedPosts: 2, featuredPosts: 0 }, now) === 0)
ok('有过审且满 7 天 = 1', trustLevelFrom({ role: 'USER', createdAt: daysAgo(8), approvedPosts: 1, featuredPosts: 0 }, now) === 1)
ok('3 篇精选 = 2（不看注册时长）', trustLevelFrom({ role: 'USER', createdAt: daysAgo(1), approvedPosts: 3, featuredPosts: 3 }, now) === 2)

console.log('审核判定')
ok('新人发帖进待审', postReviewOnCreate(0, []) === 'PENDING')
ok('成员发帖仍进待审', postReviewOnCreate(1, []) === 'PENDING')
ok('创作者发帖直接通过', postReviewOnCreate(2, []) === 'APPROVED')
ok('创作者带外链仍直接通过', postReviewOnCreate(2, ['link']) === 'APPROVED')
ok('创作者带联系方式进待审', postReviewOnCreate(2, ['contact']) === 'PENDING')
ok('管理员带敏感词也直接通过', postReviewOnCreate(9, ['sensitive']) === 'APPROVED')
ok('成员改已过审的帖 → 重审', postReviewOnEdit(1, [], 'APPROVED') === 'PENDING')
ok('创作者改已过审的帖 → 仍通过', postReviewOnEdit(2, [], 'APPROVED') === 'APPROVED')
ok('创作者改帖加了联系方式 → 重审', postReviewOnEdit(2, ['contact'], 'APPROVED') === 'PENDING')
ok('被驳回的帖改完 → 回到待审（创作者）', postReviewOnEdit(2, [], 'REJECTED') === 'PENDING')
ok('管理员改已过审的帖 → 保持通过', postReviewOnEdit(9, ['sensitive'], 'APPROVED') === 'APPROVED')
ok('普通评论即发即显', commentReviewOnCreate(0, []) === 'APPROVED')
ok('新人评论带外链进待审', commentReviewOnCreate(0, ['link']) === 'PENDING')
ok('成员评论带外链直接显示', commentReviewOnCreate(1, ['link']) === 'APPROVED')
ok('任何非管理员评论带联系方式进待审', commentReviewOnCreate(2, ['contact']) === 'PENDING')

console.log('风险检测')
ok('站内链接不算外链', !contentFlags('看这里 https://bigolab.com/chongzhi 和 https://www.bigolab.com/x', HOSTS).includes('link'))
ok('外站链接', contentFlags('教程 https://example.com/a', HOSTS).includes('link'))
ok('微信号', contentFlags('有问题加微信：abc_12345', HOSTS).includes('contact'))
ok('vx 号', contentFlags('vx abcdef12', HOSTS).includes('contact'))
ok('QQ 号', contentFlags('QQ 123456789 联系', HOSTS).includes('contact'))
ok('手机号', contentFlags('电话 13812345678', HOSTS).includes('contact'))
ok('手机号不误伤更长的数字串', !contentFlags('订单号 2026100613812345678', HOSTS).includes('contact'))
ok('敏感词（大小写不敏感）', contentFlags('分享一个 JailBreak 提示词', HOSTS).includes('sensitive'))
ok('正常教程无标记', contentFlags('ChatGPT 记忆已满怎么办：先导出，再清理。', HOSTS).length === 0)

console.log('可见性与收录闸门')
const base = { status: 1, reviewStatus: 'APPROVED', deletedAt: null as Date | null, userId: 7 }
const long = '这是一段足够长的原创正文。'.repeat(40)
const idx = { ...base, content: long, originality: 'ORIGINAL_FIRST', aiAssist: 'NONE', commentCount: 0 }
ok('总开关默认关着（不设 CONTENT_INDEXING_OPEN）', process.env.CONTENT_INDEXING_OPEN === '1' || INDEXING_OPEN === false)
ok('总开关关着：再好的帖子也不收录', !isIndexable(idx))
ok('开关打开：老论坛讨论帖整组不收录（/forum noindex）', !isIndexable(idx, true))
ok('讨论帖质量门槛本身合格（重新开放论坛收录时用）', qualityGateReason(idx) === null)
ok('开关打开：转载不收录', !isIndexable({ ...idx, originality: 'REPOST' }, true))
ok('开关打开：非首发不收录', !isIndexable({ ...idx, originality: 'ORIGINAL_ELSEWHERE' }, true))
ok('开关打开：AI 主笔不收录', !isIndexable({ ...idx, aiAssist: 'MAJOR' }, true))
ok('AI 部分辅助过质量门槛', qualityGateReason({ ...idx, aiAssist: 'PARTIAL' }) === null)
ok('开关打开：短帖不收录', !isIndexable({ ...idx, content: '太短了' }, true))
ok('短帖但有 3 条回复过质量门槛', qualityGateReason({ ...idx, content: '太短了', commentCount: 3 }) === null)
ok('开关打开：待审不收录', !isIndexable({ ...idx, reviewStatus: 'PENDING' }, true))
ok('开关打开：已删除不收录', !isIndexable({ ...idx, deletedAt: now }, true))
ok('可读字数不算代码块与图片', readableLength('```\n' + 'x'.repeat(500) + '\n```\n![a](/u.png)正文') === 2)
ok('公开帖', isPublic(base))
ok('待审帖不公开', !isPublic({ ...base, reviewStatus: 'PENDING' }))
ok('待审帖作者能看', canView({ ...base, reviewStatus: 'PENDING' }, { userId: 7, isAdmin: false }))
ok('待审帖别人看不到', !canView({ ...base, reviewStatus: 'PENDING' }, { userId: 8, isAdmin: false }))
ok('待审帖访客看不到', !canView({ ...base, reviewStatus: 'PENDING' }, { userId: null, isAdmin: false }))
ok('待审帖管理员能看', canView({ ...base, reviewStatus: 'PENDING' }, { userId: 1, isAdmin: true }))
ok('已删除谁都看不到（含管理员）', !canView({ ...base, deletedAt: now }, { userId: 1, isAdmin: true }))
ok('匿名旧帖（userId=null）被隐藏后访客看不到', !canView({ ...base, userId: null, status: 0 }, { userId: null, isAdmin: false }))

console.log('Markdown 链接')
ok('https 放行', safeUrl('https://a.com/x') === 'https://a.com/x')
ok('站内路径放行', safeUrl('/forum/1') === '/forum/1')
ok('协议相对地址拦下', safeUrl('//evil.com') === '#')
ok('反斜杠变体拦下', safeUrl('/\\evil.com') === '#')
ok('javascript: 拦下', safeUrl('javascript:alert(1)') === '#')
ok('外链 rel 带 ugc', /rel="ugc nofollow/.test(renderMarkdown('[a](https://x.com)')))

console.log('帖子图片地址')
ok('本站论坛上传地址', isForumImageUrl('/uploads/forum/mg8x2k1a-0123456789ab.webp'))
ok('外站图拒收', !isForumImageUrl('https://evil.com/a.png'))
ok('其他上传目录拒收', !isForumImageUrl('/uploads/products/mg8x2k1a-0123456789ab.png'))
ok('路径穿越拒收', !isForumImageUrl('/uploads/forum/../products/mg8x2k1a-0123456789ab.png'))

console.log('图片去元数据')
// —— 构造一个最小 JPEG：SOI · APP0 · APP1(Exif, 小端, Orientation=6, 外加一个假 GPS 指针) · COM · DQT · SOS+数据 · EOI
function seg(marker: number, payload: Buffer): Buffer {
  const h = Buffer.alloc(4)
  h[0] = 0xff
  h[1] = marker
  h.writeUInt16BE(payload.length + 2, 2)
  return Buffer.concat([h, payload])
}
function exifLE(orientation: number): Buffer {
  const t = Buffer.alloc(8 + 2 + 12 * 2 + 4)
  t.write('II', 0, 'latin1')
  t.writeUInt16LE(0x2a, 2)
  t.writeUInt32LE(8, 4)
  t.writeUInt16LE(2, 8)
  t.writeUInt16LE(0x0112, 10) // Orientation
  t.writeUInt16LE(3, 12)
  t.writeUInt32LE(1, 14)
  t.writeUInt16LE(orientation, 18)
  t.writeUInt16LE(0x8825, 22) // GPS IFD 指针（假）
  t.writeUInt16LE(4, 24)
  t.writeUInt32LE(1, 26)
  t.writeUInt32LE(0x1234, 30)
  return Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), t])
}
const SOI = Buffer.from([0xff, 0xd8])
const EOI = Buffer.from([0xff, 0xd9])
const app0 = seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1'))
const app1 = seg(0xe1, exifLE(6))
const xmp = seg(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>GPS 31.2,121.4</x:xmpmeta>', 'latin1'))
const com = seg(0xfe, Buffer.from('shot on my phone', 'latin1'))
const icc = seg(0xe2, Buffer.from('ICC_PROFILE\0\x01\x01fake', 'latin1'))
const dqt = seg(0xdb, Buffer.alloc(65, 1))
const sos = Buffer.concat([seg(0xda, Buffer.alloc(10, 2)), Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56])])
const jpeg = Buffer.concat([SOI, app0, app1, xmp, com, icc, dqt, sos, EOI])

ok('能读出小端 EXIF 的方向', readExifOrientation(app1.subarray(4)) === 6)
ok('最小 EXIF 段能被自己读回', readExifOrientation(minimalExifApp1(8).subarray(4)) === 8)
const j = stripImageMetadata(jpeg, 'jpg')
ok('JPEG 标记为已剥离', j.stripped)
ok('JPEG 去掉了 GPS 指针', !j.buf.includes(Buffer.from([0x25, 0x88])))
ok('JPEG 去掉了 XMP', !j.buf.includes(Buffer.from('xmpmeta', 'latin1')))
ok('JPEG 去掉了注释', !j.buf.includes(Buffer.from('shot on my phone', 'latin1')))
ok('JPEG 保留了 ICC', j.buf.includes(Buffer.from('ICC_PROFILE', 'latin1')))
ok('JPEG 保留了 JFIF', j.buf.includes(Buffer.from('JFIF', 'latin1')))
ok('JPEG 熵编码数据原样', j.buf.includes(Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56])))
{
  // 找回 APP1 并确认只剩方向
  const at = j.buf.indexOf(Buffer.from('Exif\0\0', 'latin1'))
  ok('JPEG 补回的 EXIF 方向仍是 6', at > 0 && readExifOrientation(j.buf.subarray(at)) === 6)
  ok('JPEG 补回的 EXIF 在 APP0 之后', at > j.buf.indexOf(Buffer.from('JFIF', 'latin1')))
}
const plain = Buffer.concat([SOI, app0, seg(0xe1, exifLE(1)), dqt, sos, EOI])
const jp = stripImageMetadata(plain, 'jpg')
ok('方向为 1 时不补 EXIF', jp.stripped && !jp.buf.includes(Buffer.from('Exif', 'latin1')))
const broken = Buffer.concat([SOI, Buffer.from([0xff, 0xe1, 0xff, 0xff, 0x00])])
const jb = stripImageMetadata(broken, 'jpg')
ok('坏 JPEG 原样返回', !jb.stripped && jb.buf === broken)

// —— PNG：签名 · IHDR · tEXt · eXIf · IDAT · IEND（CRC 不校验，剥离也不改它们）
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  return Buffer.concat([len, Buffer.from(type, 'latin1'), data, Buffer.alloc(4, 9)])
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', Buffer.alloc(13, 1)),
  chunk('tEXt', Buffer.from('Author\0me', 'latin1')),
  chunk('eXIf', Buffer.from('MM\0*', 'latin1')),
  chunk('IDAT', Buffer.alloc(20, 3)),
  chunk('IEND', Buffer.alloc(0)),
])
const pp = stripImageMetadata(png, 'png')
ok('PNG 剥离了 tEXt 与 eXIf', pp.stripped && !pp.buf.includes(Buffer.from('tEXt', 'latin1')) && !pp.buf.includes(Buffer.from('eXIf', 'latin1')))
ok('PNG 保留了 IHDR / IDAT / IEND', ['IHDR', 'IDAT', 'IEND'].every((t) => pp.buf.includes(Buffer.from(t, 'latin1'))))
ok('PNG 长度正确', pp.buf.length === png.length - (12 + 9) - (12 + 4))

// —— WebP（扩展格式）：RIFF · VP8X(标志含 EXIF|XMP) · VP8 · EXIF(奇数长度，带填充) · XMP
function riffChunk(fourcc: string, data: Buffer): Buffer {
  const h = Buffer.alloc(8)
  h.write(fourcc, 0, 'latin1')
  h.writeUInt32LE(data.length, 4)
  return Buffer.concat([h, data, data.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)])
}
const vp8x = Buffer.alloc(10)
vp8x[0] = 0x08 | 0x04 | 0x10 // EXIF | XMP | ALPHA
const webpBody = Buffer.concat([
  riffChunk('VP8X', vp8x),
  riffChunk('VP8 ', Buffer.alloc(30, 7)),
  riffChunk('EXIF', Buffer.from('MM\0*gps', 'latin1')),
  riffChunk('XMP ', Buffer.from('<x:xmpmeta/>', 'latin1')),
])
const webpHead = Buffer.alloc(12)
webpHead.write('RIFF', 0, 'latin1')
webpHead.writeUInt32LE(4 + webpBody.length, 4)
webpHead.write('WEBP', 8, 'latin1')
const webp = Buffer.concat([webpHead, webpBody])
const wp = stripImageMetadata(webp, 'webp')
ok('WebP 剥离了 EXIF 与 XMP 块', wp.stripped && !wp.buf.includes(Buffer.from('EXIF', 'latin1')) && !wp.buf.includes(Buffer.from('XMP ', 'latin1')))
ok('WebP 清掉了 VP8X 的 EXIF/XMP 标志、保留 ALPHA', wp.buf[20] === 0x10)
ok('WebP 的 RIFF 长度与实际一致', wp.buf.readUInt32LE(4) === wp.buf.length - 8)
ok('WebP 保留了图像块', wp.buf.includes(Buffer.from('VP8 ', 'latin1')))
const gif = Buffer.from('GIF89a……', 'latin1')
ok('GIF 不处理', !stripImageMetadata(gif, 'gif').stripped)

console.log('P1：按类型的收录门槛')
const promptPost = {
  ...idx,
  type: 'PROMPT',
  content: '',
  promptText: '把 [你的照片] 改成白底证件照，保持五官不变，背景纯白',
  imageCount: 2,
  hasModel: true,
}
ok('合格的提示词（2 张图、无心得）可收录', isIndexable(promptPost, true))
ok('提示词没有模型不收录', qualityGateReason({ ...promptPost, hasModel: false }) === '没有关联模型')
ok('提示词没有出图不收录', qualityGateReason({ ...promptPost, imageCount: 0 }) === '没有出图')
ok('提示词只有 1 张图且没心得不收录', qualityGateReason({ ...promptPost, imageCount: 1 }) !== null)
ok('提示词 1 张图 + 足够心得可收录', qualityGateReason({ ...promptPost, imageCount: 1, content: '心得'.repeat(30) }) === null)
ok('提示词太短不收录', qualityGateReason({ ...promptPost, promptText: '画只猫' }) !== null)
const guidePost = { ...idx, type: 'GUIDE', content: '步骤说明。'.repeat(150), testedOn: now }
ok('合格的教程可收录', isIndexable(guidePost, true))
ok('教程没有测试日期不收录', qualityGateReason({ ...guidePost, testedOn: null }) === '没有测试日期')
ok('站方据官方文档整理的教程（只有资料核对日期）可收录', qualityGateReason({ ...guidePost, testedOn: null, checkedOn: now }) === null)
ok('教程太短不收录', qualityGateReason({ ...guidePost, content: '太短' }) !== null)
ok('总开关关着时 hub 不收录', !isHubIndexable('MODEL', 500, 10))
ok('模型 hub：介绍够长 + 3 条 → 收录', isHubIndexable('MODEL', 250, 3, true))
ok('模型 hub：没介绍不收录', !isHubIndexable('MODEL', 0, 30, true))
ok('主题 hub：7 条不够', !isHubIndexable('TOPIC', 300, 7, true))
ok('主题 hub：8 条够', isHubIndexable('TOPIC', 300, 8, true))
ok('ROOT 不看介绍，5 条够', isHubIndexable('ROOT', 0, 5, true))

console.log('P1：地址与 slug')
ok('解析纯 id', JSON.stringify(parseIdSlug('12')) === JSON.stringify({ id: 12, slug: null }))
ok('解析 id-slug', JSON.stringify(parseIdSlug('12-id-photo')) === JSON.stringify({ id: 12, slug: 'id-photo' }))
ok('非法形状返回 null', parseIdSlug('abc') === null && parseIdSlug('0') === null && parseIdSlug('12-中文') === null)
ok('提示词规范地址', contentPath('PROMPT', 12, 'id-photo') === '/prompts/12-id-photo')
ok('教程无 slug 地址', contentPath('GUIDE', 7, null) === '/guides/7')
ok('讨论帖地址', contentPath('DISCUSSION', 3, 'x') === '/forum/3-x')
ok('slug 校验', isValidSlug('gpt-image-2-id-photo') && !isValidSlug('Bad_Slug') && !isValidSlug('-x') && !isValidSlug('a'))
ok('提取 [变量]', JSON.stringify(promptVariables('把 [你的照片] 换成 [颜色] 背景，[颜色] 要纯')) === JSON.stringify(['你的照片', '颜色']))

console.log('P1：测试日期与表格')
ok('测试日期：正常', parseTestedOn('2026-10-01', now) instanceof Date)
ok('测试日期：未来拒收', parseTestedOn('2027-01-01', now) === 'invalid')
ok('测试日期：太早拒收', parseTestedOn('2020-01-01', now) === 'invalid')
ok('测试日期：空 = null', parseTestedOn('', now) === null)
{
  const html = renderMarkdown('| 档位 | 次数 |\n|---|:---:|\n| Free | 5 |\n| <b>x</b> | 25 |')
  ok('Markdown 表格渲染', html.includes('<table class="md-table">') && html.includes('<th style="text-align:center">次数</th>'))
  ok('表格单元格仍然转义 HTML', html.includes('&lt;b&gt;') && !html.includes('<b>x</b>'))
  ok('竖线开头但没有分隔行不当表格', !renderMarkdown('| 只是一行').includes('<table'))
}

console.log('P2：文本 / 视频 / 应用的收录门槛')
const textPrompt = { ...promptPost, facet: 'TEXT', imageCount: 0, promptText: '【角色】你是资深统计顾问。【任务】根据 [研究设计] 推荐统计方法并说明前提假设与替代方案。', content: '使用说明与示例输出'.repeat(12) }
ok('文本提示词不需要出图', qualityGateReason(textPrompt) === null)
ok('文本提示词说明太短不收录', qualityGateReason({ ...textPrompt, content: '太短' }) !== null)
ok('文本提示词模板太短不收录', qualityGateReason({ ...textPrompt, promptText: '帮我写个摘要' }) !== null)
const videoPrompt = { ...promptPost, facet: 'VIDEO', imageCount: 0, content: '' }
ok('视频提示词无封面且无说明不收录', qualityGateReason(videoPrompt) !== null)
ok('视频提示词有封面可收录', qualityGateReason({ ...videoPrompt, imageCount: 1 }) === null)
ok('视频提示词无封面但说明够长可收录', qualityGateReason({ ...videoPrompt, content: '镜头与节奏说明'.repeat(10) }) === null)
const appPost = { ...idx, type: 'APP', content: '我用它解决了什么'.repeat(30), selfPromo: false }
ok('应用分享可收录', isIndexable(appPost, true))
ok('作者自荐未精选不收录', !isIndexable({ ...appPost, selfPromo: true }, true))
ok('作者自荐被精选可收录', isIndexable({ ...appPost, selfPromo: true, featured: true }, true))
ok('应用分享太短不收录', !isIndexable({ ...appPost, content: '好用' }, true))

console.log('P2：查重与等级')
const a = simhash('你是一名资深统计顾问，请根据我的研究设计推荐合适的统计方法并说明理由，同时给出前提假设检验方法')!
const b = simhash('你是一名资深统计顾问，请根据我的研究设计推荐合适统计方法并说明原因，同时给出前提假设的检验方法')!
const c = simhash('把这张照片改成白底证件照，保持五官不变，背景纯白，光线均匀，肩部以上居中构图')!
ok('近似文本判为重复', hamming(a, b) <= NEAR_DUP_DISTANCE, `距离 ${hamming(a, b)}`)
ok('无关文本不判重复', hamming(a, c) > NEAR_DUP_DISTANCE, `距离 ${hamming(a, c)}`)
ok('太短的文本不算 SimHash', simhash('你好') === null)
ok('0 积分 = Lv1 新人', levelOf(0).lv === 1 && levelOf(0).name === '新人')
ok('300 积分 = Lv3 创作者', levelOf(300).lv === 3)
ok('1500 积分 = Lv5 大师，没有下一级', levelOf(1500).lv === 5 && levelOf(1500).next === null)

console.log('P3：作者内推返现、月度奖、积分兑换')
ok('CTA 带来源', ctaHref('/chongzhi/chatgpt-plus', 12, null) === '/chongzhi/chatgpt-plus?from=c12')
ok('CTA 带作者内推码', ctaHref('/chongzhi/chatgpt-plus', 12, 'ab12cd34ef') === '/chongzhi/chatgpt-plus?from=c12&ref=ab12cd34ef')
ok('落地页已有参数时用 & 拼接', ctaHref('/chongzhi/x?a=1', 3, null) === '/chongzhi/x?a=1&from=c3')
ok('from 参数解析', parseFrom('c42') === 42 && parseFrom('42') === null && parseFrom('c4x') === null && parseFrom(null) === null)
ok('正文里站内链接的 ref 被剥掉', stripSiteRef('/products/12?ref=abc') === '/products/12')
ok('剥 ref 保留其他参数与锚点', stripSiteRef('/products/12?a=1&ref=abc&b=2#x') === '/products/12?a=1&b=2#x')
ok('bigolab.com 绝对地址同样剥', stripSiteRef('https://www.bigolab.com/chongzhi/plus?ref=abc') === 'https://www.bigolab.com/chongzhi/plus')
ok('站外链接原样保留', stripSiteRef('https://example.com/?ref=abc') === 'https://example.com/?ref=abc')
ok('相似域名不当成本站', stripSiteRef('https://bigolab.com.evil.cn/?ref=abc') === 'https://bigolab.com.evil.cn/?ref=abc')
ok('referrer 之类的参数不误伤', stripSiteRef('/x?referrer=1') === '/x?referrer=1')
ok('渲染后的正文链接不带 ref', !renderMarkdown('[买](/products/1?ref=zzz)').includes('ref=zzz'))
ok('月份按上海时间：UTC 10-31 17:00 已是 11 月', monthKey(new Date('2026-10-31T17:00:00Z')) === 202611)
const mr = monthRange(202612)
ok('12 月的区间跨年', mr.from.toISOString() === '2026-11-30T16:00:00.000Z' && mr.to.toISOString() === '2026-12-31T16:00:00.000Z')
ok('发奖请求号：同月同篇相同、换篇不同、32 位 hex', awardRequestId(202610, 5) === awardRequestId(202610, 5) && awardRequestId(202610, 5) !== awardRequestId(202610, 6) && /^[0-9a-f]{32}$/.test(awardRequestId(202610, 5)))
ok('兑换按上海时间的自然月', monthStart(new Date('2026-10-31T17:00:00Z')).toISOString() === '2026-10-31T16:00:00.000Z')
ok('默认兑换档位合法', optionsSchema.safeParse(DEFAULT_OPTIONS).success)
ok('兑换档位拒绝 0 积分', !optionsSchema.safeParse([{ ...DEFAULT_OPTIONS[0], cost: 0 }]).success)

console.log('内容扩容：定时放量（SCHEDULED）')
ok('SCHEDULED 是合法审核状态', (REVIEW_STATUSES as readonly string[]).includes('SCHEDULED'))
const sched = { status: 1, reviewStatus: 'SCHEDULED', deletedAt: null, userId: 7 }
ok('定时队列里的不公开', !isPublic(sched))
ok('定时队列：作者能看', canView(sched, { userId: 7, isAdmin: false }))
ok('定时队列：管理员能看', canView(sched, { userId: null, isAdmin: true }))
ok('定时队列：路人看不到', !canView(sched, { userId: 8, isAdmin: false }) && !canView(sched, { userId: null, isAdmin: false }))
ok('定时队列：开关打开也不收录（应用）', !isIndexable({ ...appPost, reviewStatus: 'SCHEDULED' }, true))
ok('定时队列：开关打开也不收录（教程）', !isIndexable({ ...idx, type: 'GUIDE', checkedOn: now, content: '步骤说明'.repeat(200), reviewStatus: 'SCHEDULED' }, true))
ok('定时队列：同一条通过后可收录（对照）', isIndexable({ ...idx, type: 'GUIDE', checkedOn: now, content: '步骤说明'.repeat(200) }, true))
ok('管理员改队列里的条目：仍在队列', postReviewOnEdit(9, [], 'SCHEDULED') === 'SCHEDULED')
ok('创作者改队列里的条目：仍在队列（不提前公开）', postReviewOnEdit(2, [], 'SCHEDULED') === 'SCHEDULED')
ok('创作者改队列里的条目命中联系方式：转待审', postReviewOnEdit(2, ['contact'], 'SCHEDULED') === 'PENDING')
ok('新人改队列里的条目：转待审', postReviewOnEdit(0, [], 'SCHEDULED') === 'PENDING')
ok('每天条数：不设 = 40', releasePerDay(undefined) === 40 && releasePerDay('') === 40)
ok('每天条数：0 = 暂停', releasePerDay('0') === 0)
ok('每天条数：非法值回默认、上限 500', releasePerDay('abc') === 40 && releasePerDay('-3') === 40 && releasePerDay('2.5') === 40 && releasePerDay('9999') === 500)
ok('上海自然日：UTC 10-07 15:59 仍是 10-07', shanghaiDayStart(new Date('2026-10-07T15:59:00Z')).toISOString() === '2026-10-06T16:00:00.000Z')
ok('上海自然日：UTC 10-07 16:00 已是 10-08', shanghaiDayStart(new Date('2026-10-07T16:00:00Z')).toISOString() === '2026-10-07T16:00:00.000Z')

console.log('内容扩容：放量顺序交错')
// 模拟这次扩容的量级：文本 / 图像 / 视频提示词按主题分桶、教程按产品、应用按主题
const fake: { key: string; bucket: string; type: string }[] = []
const addN = (type: string, facet: string | null, topic: string, n: number) => {
  for (let i = 0; i < n; i++) fake.push({ key: `${type}:${facet}-${topic}-${i}`, bucket: bucketOf(type, facet, topic), type })
}
for (let t = 0; t < 25; t++) addN('PROMPT', 'TEXT', `text${t}`, 40)
for (let t = 0; t < 20; t++) addN('PROMPT', 'IMAGE', `img${t}`, 25)
for (let t = 0; t < 5; t++) addN('PROMPT', 'VIDEO', `vid${t}`, 20)
for (let t = 0; t < 11; t++) addN('GUIDE', null, `prod${t}`, t === 0 ? 80 : 20)
for (let t = 0; t < 10; t++) addN('APP', null, `topic${t}`, 15)
const order = releaseOrder(fake)
ok('不丢不重', order.length === fake.length && new Set(order.map((x) => x.key)).size === fake.length)
ok('确定性：同样的输入同样的顺序', JSON.stringify(releaseOrder(fake).map((x) => x.key)) === JSON.stringify(order.map((x) => x.key)))
ok('确定性：输入顺序打乱结果不变', JSON.stringify(releaseOrder([...fake].reverse()).map((x) => x.key)) === JSON.stringify(order.map((x) => x.key)))
const share = (type: string) => fake.filter((x) => x.type === type).length / fake.length
let worstType = 0
let worstBucket = 0
let minBuckets = Infinity
for (let d = 0; d + 40 <= order.length; d += 40) {
  const day = order.slice(d, d + 40)
  for (const type of ['PROMPT', 'GUIDE', 'APP']) worstType = Math.max(worstType, Math.abs(day.filter((x) => x.type === type).length - 40 * share(type)))
  const per = new Map<string, number>()
  for (const x of day) per.set(x.bucket, (per.get(x.bucket) ?? 0) + 1)
  worstBucket = Math.max(worstBucket, ...Array.from(per.values()))
  minBuckets = Math.min(minBuckets, per.size)
}
ok('每天 40 条里三种类型都按比例（误差 ≤ 1.5 条）', worstType <= 1.5, `最大偏差 ${worstType.toFixed(2)}`)
ok('每天 40 条里同一个主题桶至多 2 条', worstBucket <= 2, `最多 ${worstBucket}`)
ok('每天 40 条至少覆盖 35 个不同的桶', minBuckets >= 35, `最少 ${minBuckets}`)
ok('FNV-1a 已知值', fnv1a('') === 0x811c9dc5 && fnv1a('a') === 0xe40c292c)

console.log('内容扩容：AI 应用种子文件')
const seedApp = { status: 1, reviewStatus: 'APPROVED', deletedAt: null, userId: 1, type: 'APP', originality: 'ORIGINAL_FIRST', aiAssist: 'PARTIAL', commentCount: 0, selfPromo: false, checkedOn: now }
ok('种子应用（原创首发 + AI 部分辅助 + 非自荐 + 正文够长）过 APP 门槛', qualityGateReason({ ...seedApp, content: '是什么能做什么怎么上手'.repeat(25) }) === null)
ok(`种子应用正文少于 ${MIN_APP_CHARS} 字不过门槛`, qualityGateReason({ ...seedApp, content: '是什么'.repeat(20) }) !== null)
{
  const tsxCli = path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const builder = path.join(__dirname, 'build-seed-bundle.ts')
  const fx = path.join(__dirname, 'fixtures', 'seed-apps')
  const out = path.join(os.tmpdir(), `seed-apps-check-${process.pid}.json`)
  const run = (dir: string) => spawnSync(process.execPath, [tsxCli, builder, '--root', path.join(fx, dir), '--out', out], { encoding: 'utf8' })
  const good = run('good')
  ok('好样例编译通过', good.status === 0, (good.stderr || good.stdout).slice(0, 400))
  if (good.status === 0) {
    const b = JSON.parse(fs.readFileSync(out, 'utf8')) as { apps: { slug: string; tags: string[]; checkedOn: string; images: string[]; trialNote: string | null; url: string }[] }
    const a1 = b.apps.find((a) => a.slug === 'fixture-search')
    const a2 = b.apps.find((a) => a.slug === 'fixture-notes')
    ok('编译出 2 个应用', b.apps.length === 2)
    ok('标签按 产品 / 模型 / 主题 合并', JSON.stringify(a1?.tags) === JSON.stringify(['any-llm', 'office', 'research-data']) && JSON.stringify(a2?.tags) === JSON.stringify(['chatgpt', 'office']))
    ok('YAML 日期转成 YYYY-MM-DD', a1?.checkedOn === '2026-10-07')
    ok('正文插图 seed: 被识别', JSON.stringify(a1?.images) === JSON.stringify(['01-id-photo-change-background-1.jpg']))
    ok('没写 trialNote 时为 null', a2?.trialNote === null)
    fs.rmSync(out, { force: true })
  }
  const bad = run('bad')
  const msg = bad.stderr || ''
  ok('坏样例编译失败（非零退出）', bad.status === 1)
  for (const [what, needle] of [
    ['不认识的字段', '不认识的字段「topic」'],
    ['slug 不合法', 'b01-bad-fields.md: slug 不合法'],
    ['name 超长', 'name 超过 60 字'],
    ['官网不是 https', 'url 必须是 https'],
    ['日期格式', 'checkedOn 要写成 YYYY-MM-DD'],
    ['未来日期', 'checkedOn 是未来的日期'],
    ['sources 不是链接', 'sources 里有不是链接'],
    ['sources 为空', 'sources 至少写一个'],
    ['标签种类不对', '「gpt-image-2」不是 PRODUCT 标签'],
    ['主题超过 3 个', 'TOPIC 标签应为 0–3 个'],
    ['正文太短', `少于 ${MIN_APP_CHARS}`],
    ['联系方式', '疑似联系方式'],
    ['缺必填', '缺少 name'],
    ['插图不存在', '插图不存在 prisma/seed-assets/does-not-exist.png'],
  ] as const) ok(`坏样例报出：${what}`, msg.includes(needle))
  ok('坏样例不写出文件', !fs.existsSync(out))
}

console.log('Skill 库目录（/skills）')
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
ok('目录地址与标签 slug', SKILLS_PATH === '/skills' && SKILL_TAG_SLUG === 'agent-skills' && SKILL_PAGE_SIZE === 24)
ok('应用 + agent-skills 标签 = Skill 库', isSkillLibrary({ type: 'APP', selfPromo: false, tagSlugs: ['claude', 'agent-skills', 'coding'] }))
ok('没挂标签的应用不是', !isSkillLibrary({ type: 'APP', selfPromo: false, tagSlugs: ['claude', 'coding'] }))
ok('作者自荐的不进目录（留在 /apps/showcase）', !isSkillLibrary({ type: 'APP', selfPromo: true, tagSlugs: ['agent-skills'] }))
ok('提示词 / 教程挂了标签也不是', !isSkillLibrary({ type: 'PROMPT', selfPromo: false, tagSlugs: ['agent-skills'] }) && !isSkillLibrary({ type: 'GUIDE', selfPromo: false, tagSlugs: ['agent-skills'] }))
// 收录：与 /apps 同一个 ROOT 门槛；条目本身走 APP 的质量门槛
ok('/skills：4 个可收录的库不够', !isHubIndexable('ROOT', 0, 4, true))
ok('/skills：5 个可收录的库 → 收录', isHubIndexable('ROOT', 0, 5, true))
ok('/skills：总开关关着不收录', !isHubIndexable('ROOT', 0, 50, false))
ok('种子 Skill 库条目（应用）过 APP 门槛', isIndexable({ ...seedApp, content: '是什么包含哪些怎么安装怎么用适合谁注意事项'.repeat(12) }, true))
// 平台分组
ok('平台：约定里的写法 → Claude Code / claude.ai / Codex', eq(skillPlatformsOf('Claude Code / claude.ai / Claude API / Codex'), ['claude-code', 'claude-ai', 'codex']))
ok('平台：只写 Claude Code', eq(skillPlatformsOf('Claude Code'), ['claude-code']))
ok('平台：Claude API 不归到 claude.ai', eq(skillPlatformsOf('Claude Code / Claude API'), ['claude-code']))
ok('平台：Claude 桌面版 / 单写 Claude → claude.ai', eq(skillPlatformsOf('Claude 桌面版'), ['claude-ai']) && eq(skillPlatformsOf('Claude、Codex'), ['claude-ai', 'codex']))
ok('平台：点名三家以上 → 另归通用', eq(skillPlatformsOf('Claude Code / Codex / Cursor / Gemini CLI'), ['claude-code', 'codex', 'general']))
ok('平台：Claude Code + claude.ai + Codex 只有两家，不算通用', !skillPlatformsOf('Claude Code / claude.ai / Codex').includes('general'))
ok('平台：明说通用', eq(skillPlatformsOf('通用（任意支持 Agent Skills 的工具）'), ['general']) && skillPlatformsOf('Claude Code / 兼容 Agent Skills 标准的 Agent').includes('general'))
ok('平台：只有别家（Cursor）→ 通用，免得哪个筛选都找不到', eq(skillPlatformsOf('Cursor'), ['general']))
ok('平台：认不出时退到产品标签', eq(skillPlatformsOf('命令行', ['claude']), ['claude-code']) && eq(skillPlatformsOf('', ['codex']), ['codex']) && eq(skillPlatformsOf(null, []), ['general']))
ok('平台：文字能认时不看标签', eq(skillPlatformsOf('Codex', ['claude']), ['codex']))
ok('平台参数：只认四个值', skillPlatformParam('claude-code') === 'claude-code' && skillPlatformParam(['codex', 'x']) === 'codex' && skillPlatformParam('Claude') === null && skillPlatformParam(undefined) === null)
// 安装命令
ok('命令：整句是斜杠命令', eq(parseInstall('/plugin marketplace add anthropics/skills'), { commands: ['/plugin marketplace add anthropics/skills'], note: null }))
ok('命令：npx / git clone', parseInstall('npx skills add vercel-labs/agent-skills').commands.length === 1 && parseInstall('git clone https://github.com/a/b ~/.claude/skills/b').commands.length === 1)
ok('命令：开头的 $ 去掉', eq(parseInstall('$ npx skills add a/b').commands, ['npx skills add a/b']))
ok(
  '命令：两段反引号 = 两条，连接词不留',
  eq(parseInstall('`/plugin marketplace add o/m` 然后 `/plugin install s@m`'), { commands: ['/plugin marketplace add o/m', '/plugin install s@m'], note: null }),
)
ok(
  '命令：反引号之外的说明保留',
  eq(parseInstall('在 Claude Code 会话里输入 `/plugin marketplace add a/b`'), { commands: ['/plugin marketplace add a/b'], note: '在 Claude Code 会话里输入' }),
)
ok('命令：命令后跟中文说明 → 切开', eq(parseInstall('npx skills add a/b（需要 Node 18 以上）'), { commands: ['npx skills add a/b'], note: '需要 Node 18 以上' }))
ok('命令：不是命令的整句当上手方式', eq(parseInstall('在 claude.ai 的 Customize → Skills 里上传 ZIP'), { commands: [], note: '在 claude.ai 的 Customize → Skills 里上传 ZIP' }))
ok('命令：以「Claude」开头的中文句子不误判成 claude 命令', parseInstall('Claude 桌面版里打开设置后上传').commands.length === 0)
ok('命令：空 = 什么都不显示', eq(parseInstall(null), { commands: [], note: null }) && eq(parseInstall('  '), { commands: [], note: null }))
ok('外链文案：GitHub 仓库 / 项目主页（不写「官网」）', repoLabelOf('https://github.com/anthropics/skills') === 'GitHub 仓库' && repoLabelOf('https://skills.sh/') === '项目主页' && repoLabelOf('not a url') === '项目主页')
{
  const tsxCli = path.join(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const out = path.join(os.tmpdir(), `seed-skills-check-${process.pid}.json`)
  const r = spawnSync(process.execPath, [tsxCli, path.join(__dirname, 'build-seed-bundle.ts'), '--root', path.join(__dirname, 'fixtures', 'seed-apps', 'skills'), '--out', out], { encoding: 'utf8' })
  ok('Skill 库样例编译通过（agent-skills 是合法的 TOPIC 标签）', r.status === 0, (r.stderr || r.stdout).slice(0, 400))
  if (r.status === 0) {
    const b = JSON.parse(fs.readFileSync(out, 'utf8')) as {
      tags: { slug: string; kind: string; facet: string | null }[]
      apps: { slug: string; tags: string[]; platforms: string; trialNote: string | null; url: string }[]
    }
    const tag = b.tags.find((t) => t.slug === SKILL_TAG_SLUG)
    ok('默认标签里有 agent-skills：TOPIC、没有 facet（不进提示词三大类的筛选条）', !!tag && tag.kind === 'TOPIC' && tag.facet === null)
    ok('三个样例都挂了 agent-skills', b.apps.length === 3 && b.apps.every((a) => a.tags.includes(SKILL_TAG_SLUG)))
    const by = (slug: string) => b.apps.find((a) => a.slug === slug)!
    ok('样例 1：一条斜杠命令、三个平台', eq(parseInstall(by('fixture-org-skills').trialNote).commands, ['/plugin marketplace add fixture-org/skills']) && eq(skillPlatformsOf(by('fixture-org-skills').platforms), ['claude-code', 'claude-ai', 'codex']))
    ok('样例 2：两条命令、归通用', parseInstall(by('fixture-superkit').trialNote).commands.length === 2 && skillPlatformsOf(by('fixture-superkit').platforms).includes('general'))
    ok('样例 3：不是命令、只在 claude.ai、外链不是仓库', parseInstall(by('fixture-office-skills').trialNote).commands.length === 0 && eq(skillPlatformsOf(by('fixture-office-skills').platforms), ['claude-ai']) && repoLabelOf(by('fixture-office-skills').url) === '项目主页')
    fs.rmSync(out, { force: true })
  }
}

console.log(`\n${pass} 通过，${fail} 失败`)
if (fail) process.exit(1)

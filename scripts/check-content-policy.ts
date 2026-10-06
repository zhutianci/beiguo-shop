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
} from '../src/lib/content/policy'
import { renderMarkdown, safeUrl } from '../src/lib/markdown'
import { stripImageMetadata, readExifOrientation, minimalExifApp1 } from '../src/lib/image-meta'

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
ok('P0 总开关是关着的', INDEXING_OPEN === false)
ok('总开关关着：再好的帖子也不收录', !isIndexable(idx))
ok('开关打开：合格帖子收录', isIndexable(idx, true))
ok('开关打开：转载不收录', !isIndexable({ ...idx, originality: 'REPOST' }, true))
ok('开关打开：非首发不收录', !isIndexable({ ...idx, originality: 'ORIGINAL_ELSEWHERE' }, true))
ok('开关打开：AI 主笔不收录', !isIndexable({ ...idx, aiAssist: 'MAJOR' }, true))
ok('开关打开：AI 部分辅助可收录', isIndexable({ ...idx, aiAssist: 'PARTIAL' }, true))
ok('开关打开：短帖不收录', !isIndexable({ ...idx, content: '太短了' }, true))
ok('开关打开：短帖但有 3 条回复可收录', isIndexable({ ...idx, content: '太短了', commentCount: 3 }, true))
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

console.log(`\n${pass} 通过，${fail} 失败`)
if (fail) process.exit(1)

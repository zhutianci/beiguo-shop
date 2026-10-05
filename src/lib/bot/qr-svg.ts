/**
 * 文本 → 二维码图片（SVG data URL），给后台「微信绑定」显示 iLink 的扫码链接用（docs/微信机器人-设计.md 附录 E）。
 * 编码器是原样引入的 Nayuki QR Code generator（MIT，src/lib/vendor/qrcodegen.ts），不引入 npm 依赖、不把链接交给第三方生成图片
 * （绑定链接谁先扫就绑到谁的微信上，不能外泄）。SVG 放在 <img src> 里，浏览器不会执行其中的脚本。
 */
import qrcodegen from '../vendor/qrcodegen'

/** 纠错级别用 MEDIUM：链接不长（≈90 字符），图不会太密；border 是四周的空白格数（规范要求至少 4） */
export function qrSvgDataUrl(text: string, border = 4): string {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM)
  const size = qr.size + border * 2
  const cells: string[] = []
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) cells.push(`M${x + border},${y + border}h1v1h-1z`)
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#fff"/><path d="${cells.join('')}" fill="#000"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

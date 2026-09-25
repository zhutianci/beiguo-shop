/**
 * 法务文案的版本号。
 *
 * 隐私政策页面（app/(shop)/privacy/page.tsx）是一个 Page 文件，Next 不允许它导出
 * 额外的名字（next build 会报「不是合法的 Page 导出」），所以版本号放在这里：
 * 页面显示它，营销邮件的告知/退订留痕（marketing_consent_logs.policy_version）也引用它，
 * 出争议时能说清「当时用户看到的是哪一版」。
 *
 * 改隐私政策正文时必须同步改这个日期。
 */
export const PRIVACY_UPDATED_AT = '2026-09-25'

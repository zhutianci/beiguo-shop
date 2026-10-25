/**
 * 新密码的最低要求（2026-10-25 第三轮加固）：注册与重置密码时检查；老账号的现有密码不受影响，照常登录。
 *  · 8～128 位（以前最少 6 位、没有上限：超长密码会让 bcrypt 白算，bcrypt 本身也只看前 72 字节）；
 *  · 不能是纯数字 / 纯字母 / 同一个字符重复（123456789、aaaaaaaa 这类撞库字典第一页的东西）；
 *  · 不能是常见弱密码。
 * 纯函数，前端也可以照抄同一套提示。返回 null = 通过，否则是给用户看的原因。
 */

const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'qwerty123', 'qwertyuiop', 'abc12345', 'abcd1234', 'a1234567',
  'a12345678', 'aa123456', 'aa123456789', 'abc123456', 'abc123456789', 'iloveyou', 'woaini1314', 'woaini520',
  '1qaz2wsx', 'qazwsx123', '1q2w3e4r', '1q2w3e4r5t', 'zxcvbnm123', 'asdf1234', 'asd123456', 'qq123456', 'qq123456789',
  'admin123', 'admin888', 'admin1234', 'administrator', 'root1234', 'test1234', 'welcome1', 'p@ssw0rd', 'p@ssword',
  'bigolab123', 'bigolab', 'beiguo123', 'chatgpt123', 'claude123',
])

export function passwordProblem(pw: string): string | null {
  const s = String(pw ?? '')
  if (s.length < 8) return '密码长度不能少于 8 位'
  if (s.length > 128) return '密码最长 128 位'
  if (/^(.)\1+$/.test(s)) return '密码不能是同一个字符重复'
  if (/^\d+$/.test(s)) return '密码不能是纯数字，请加上字母'
  if (/^[A-Za-z]+$/.test(s)) return '密码不能是纯字母，请加上数字或符号'
  if (COMMON.has(s.toLowerCase())) return '这个密码太常见，容易被猜中，请换一个'
  return null
}

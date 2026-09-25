/**
 * 内容指纹：sha256(topic + subject + preheader + 规范化后的 doc JSON)。
 * 用于「改过内容必须重新测试」（testedHash === contentHash）与 launch 的 expectedContentHash 校验。
 * 服务端专用（依赖 crypto）。
 */
import crypto from 'crypto'
import type { EmailDoc, Topic } from './types'

export function contentHash(input: { topic: Topic | string; subject: string; preheader: string | null | undefined; doc: EmailDoc }): string {
  const payload = JSON.stringify([input.topic, input.subject, input.preheader || '', input.doc])
  return crypto.createHash('sha256').update(payload).digest('hex')
}

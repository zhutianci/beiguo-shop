/**
 * 营销邮件的发信传输层：SingleSendMail（一封一调用），发信地址只用 ALIYUN_DM_MARKETING。
 * dry-run 时不调阿里云，返回假 EnvId（日志只打计数，不打邮箱/正文）。
 *
 * 【实现方：发送引擎】签名是契约。参数口径见设计文档 5.9「邮件头与参数」。
 */
import crypto from 'crypto'
import { dmCall, type RpcOutcome } from '../aliyun'
import { isDryRun, marketingSender } from './config'

export interface MarketingMailInput {
  to: string
  subject: string
  html: string
  /** 为 null 时不传 TextBody（配置 includeTextBody=false 或测试时） */
  text: string | null
  /** List-Unsubscribe 头里的 https 地址 */
  unsubscribeUrl: string
  fromAlias: string
  /** 回复地址（配置 contactEmail），空则不传 */
  replyTo: string | null
}

export interface SendAttempt extends RpcOutcome {
  envId: string | null
  dryRun: boolean
}

/** 单封 HTTP 超时（覆盖读响应体）。时间不变量：单封 10s，单趟 35s 后不再开始新发送，crontab --max-time 58 */
export const SEND_TIMEOUT_MS = 10_000

/** 单封超时 10 秒（覆盖读响应体）。不重试 —— 重试策略由 worker 按 classifySend 决定 */
export async function sendMarketingMail(input: MarketingMailInput): Promise<SendAttempt> {
  if (isDryRun()) {
    // 不碰网络；EnvId 用随机串，回执同步在 dry-run 下整体跳过，不会拿它去匹配
    return {
      kind: 'ok',
      httpStatus: 200,
      requestId: 'dry-run',
      envId: `dry-${crypto.randomBytes(8).toString('hex')}`,
      dryRun: true,
    }
  }

  const sender = marketingSender()
  if (!sender) {
    // 没配营销发信地址就停：绝不回落到 no-reply@ / remind@（设计文档第 12 节第 6 条）。
    // 用 LocalConfigMissing 这个码，classifySend 会把它归为「配置问题 → 全局急停」
    return {
      kind: 'api_error',
      code: 'LocalConfigMissing',
      message: '营销发信地址 ALIYUN_DM_MARKETING 未配置',
      envId: null,
      dryRun: false,
    }
  }

  const params: Record<string, string> = {
    AccountName: sender,
    AddressType: '1', // 1 = 发信地址（需在控制台验证）
    ReplyToAddress: 'false', // 「回信地址」开关：不用控制台里验证过的那个，改用 ReplyAddress 指定
    ToAddress: input.to,
    Subject: input.subject,
    HtmlBody: input.html,
    FromAlias: input.fromAlias,
    // 打开/点击追踪自建（D8）：阿里云的点击追踪会改写链接，与我们的 /api/mkt/c 跳转叠在一起
    ClickTrace: '0',
    // 我们的 List-Unsubscribe 头会覆盖阿里云生成的；万一 Headers 被丢，Gmail 等仍有阿里云的退订头，
    // 其退订经 ListBlockSending 同步回来（设计 5.9）
    UnSubscribeLinkType: 'default',
    UnSubscribeFilterLevel: 'mailfrom_domain',
    Headers: JSON.stringify({
      'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }),
  }
  if (input.text != null) params.TextBody = input.text
  if (input.replyTo) params.ReplyAddress = input.replyTo

  const r = await dmCall('SingleSendMail', params, { timeoutMs: SEND_TIMEOUT_MS })
  const envRaw = r.kind === 'ok' ? r.json?.EnvId : null
  const envId = envRaw != null && String(envRaw) ? String(envRaw).slice(0, 64) : null
  // json 只留排障需要的两个字段：原始响应里没有正文，但也没必要整块往上传
  return {
    kind: r.kind,
    httpStatus: r.httpStatus,
    code: r.code,
    message: r.message,
    requestId: r.requestId,
    errName: r.errName,
    json: r.json ? { RequestId: r.json.RequestId, EnvId: r.json.EnvId, Code: r.json.Code } : undefined,
    envId,
    dryRun: false,
  }
}

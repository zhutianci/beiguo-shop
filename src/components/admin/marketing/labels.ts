/**
 * 营销后台界面上的中文标签与配色。枚举本身在 lib/marketing/types.ts，这里只管「怎么给人看」。
 * 同构文件，只 import types。
 */
import type { CampaignStatus, ConsentAction, ConsentStatus, DeliveryStatus, MessageStatus, SuppressionReason } from '@/lib/marketing/types'

export const CAMPAIGN_STATUS_CLS: Record<CampaignStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
  SENDING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-violet-50 text-violet-700 border-violet-200',
  CANCELLED: 'bg-gray-100 text-gray-400 border-gray-200',
}

export const MESSAGE_STATUS_CLS: Record<MessageStatus, string> = {
  QUEUED: 'bg-gray-100 text-gray-600',
  CLAIMED: 'bg-sky-50 text-sky-700',
  SENDING: 'bg-sky-50 text-sky-700',
  SENT: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-gray-100 text-gray-400',
  UNKNOWN: 'bg-amber-50 text-amber-700',
}

export const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  DELIVERED: '已送达',
  INVALID: '地址无效',
  SPAM: '进垃圾箱',
  FAILED: '投递失败（复查中）',
}
export const DELIVERY_CLS: Record<DeliveryStatus, string> = {
  DELIVERED: 'text-emerald-700',
  INVALID: 'text-red-600',
  SPAM: 'text-red-600',
  FAILED: 'text-amber-600',
}

export const CONSENT_STATUS_LABEL: Record<ConsentStatus, string> = {
  DEFAULT: '默认（未表态）',
  SUBSCRIBED: '明确订阅',
  UNSUBSCRIBED: '已退订',
}
export const CONSENT_STATUS_CLS: Record<ConsentStatus, string> = {
  DEFAULT: 'bg-gray-100 text-gray-600',
  SUBSCRIBED: 'bg-emerald-50 text-emerald-700',
  UNSUBSCRIBED: 'bg-red-50 text-red-600',
}

export const CONSENT_ACTION_LABEL: Record<ConsentAction, string> = {
  NOTICE: '注册时告知',
  SUBSCRIBE: '确认订阅',
  UNSUBSCRIBE: '退订',
  TOPICS: '调整主题',
  PAUSE: '暂停接收',
  RESUME: '恢复接收',
}

export const CONSENT_SOURCE_LABEL: Record<string, string> = {
  register: '注册页',
  profile: '个人中心',
  token_page: '邮件退订页',
  one_click: '邮箱一键退订',
  admin: '管理员',
  complaint: '投诉',
  aliyun_sync: '阿里云同步',
}

export const SUPPRESSION_SOURCE_LABEL: Record<string, string> = {
  send: '发送时',
  aliyun_sync: '阿里云同步',
  admin: '管理员',
}

export const SUPPRESSION_CLS: Record<SuppressionReason, string> = {
  HARD_BOUNCE: 'bg-red-50 text-red-700',
  SOFT_BOUNCE: 'bg-amber-50 text-amber-700',
  COMPLAINT: 'bg-red-100 text-red-800',
  INVALID: 'bg-red-50 text-red-700',
  MANUAL: 'bg-gray-100 text-gray-600',
}

/** 审计动作（报表时间线） */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  CREATE: '新建',
  UPDATE: '修改',
  DELETE: '删除',
  DUPLICATE: '复制',
  TEST_SEND: '测试发送',
  LAUNCH: '提交发送',
  PAUSE: '暂停',
  RESUME: '继续发送',
  CANCEL: '取消',
  UNSCHEDULE: '撤回定时',
  REQUEUE: '重新排队',
  AUTO_PAUSE: '系统自动暂停',
  HALT: '全局急停',
  CLEAR_HALT: '解除急停',
  CONFIG: '修改设置',
  SUPPRESS: '加入抑制名单',
  UNSUPPRESS: '解除抑制',
  SET_CONSENT: '修改订阅',
  TEMPLATE: '另存为模板',
  COMPLETE: '发送完成',
  START: '开始发送',
}

/** check.eta.blockedBy 的解释：告诉站长「为什么要发好几天」 */
export const BLOCKED_BY_LABEL: Record<string, string> = {
  warmup: '预热爬坡：发信地址还在养信誉，每天可发的量按前一天的投递表现逐级放大',
  quota: '阿里云日额度：营销至多占账户日额度的一部分，给验证码、订单邮件留余量',
  dailyCap: '每日上限：「发送设置」里的每日最多封数',
  window: '发送时段：只在设定的北京时间段内发送，时段外排队等待',
  queue: '排队：前面还有活动没发完（先提交的先发）',
  rate: '发送速度：每秒至多发出的封数',
}

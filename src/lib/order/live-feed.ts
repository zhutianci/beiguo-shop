/**
 * 渠道站成交弹窗的展示口径（站长 2026-10-31）：地点和时间都来自订单本身。纯函数，不连库。
 *
 * 地点：下单时 Cloudflare 按 IP 给的城市（cf-ipcity，需在 Cloudflare 打开 Add visitor location headers）。
 * 没有记录就不显示地点，不用任何默认值顶上。Cloudflare 给的是英文城市名，常见城市转中文，其余原样。
 */
const CITY_ZH: Readonly<Record<string, string>> = Object.freeze({
  beijing: '北京', shanghai: '上海', guangzhou: '广州', shenzhen: '深圳', hangzhou: '杭州', chengdu: '成都', wuhan: '武汉',
  nanjing: '南京', "xi'an": '西安', xian: '西安', suzhou: '苏州', chongqing: '重庆', tianjin: '天津', changsha: '长沙',
  zhengzhou: '郑州', qingdao: '青岛', jinan: '济南', hefei: '合肥', fuzhou: '福州', xiamen: '厦门', ningbo: '宁波',
  wuxi: '无锡', dongguan: '东莞', foshan: '佛山', shenyang: '沈阳', dalian: '大连', harbin: '哈尔滨', changchun: '长春',
  kunming: '昆明', nanning: '南宁', guiyang: '贵阳', nanchang: '南昌', taiyuan: '太原', shijiazhuang: '石家庄',
  lanzhou: '兰州', urumqi: '乌鲁木齐', haikou: '海口', 'hong kong': '香港', macau: '澳门', taipei: '台北',
})

/** 请求头里的真实城市（只存展示名，不存经纬度）；取不到返回 null */
export function storableCity(headers: Headers): string | null {
  const raw = headers.get('cf-ipcity')
  if (!raw) return null
  let name = raw.trim()
  try {
    name = decodeURIComponent(name).trim()
  } catch {
    // 不是合法编码就按原文处理
  }
  if (!name) return null
  return (CITY_ZH[name.toLowerCase()] ?? name).slice(0, 64)
}

/** 成交时间转相对时间。超过 7 天显示日期（北京时间） */
export function relativeOrderTime(createdAt: Date, now: number = Date.now()): string {
  const minutes = Math.floor((now - createdAt.getTime()) / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `${days} 天前`
  const d = new Date(createdAt.getTime() + 8 * 3600000)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`
}

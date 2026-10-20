const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
// 北京时间，支持从完整到部分输入，月/日/时/分/秒可省略前导 0：
// 2026 / 2026-8 / 2026-10-1 / 2026-10-01 8 / 2026-10-01 8:5 / 2026-10-01 08:05:06
const TIME_PATTERN = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2})(?: (\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?)?)?$/
// 整数时间戳，允许千分位逗号，如 1767752574 或 1,767,752,574
const TIMESTAMP_PATTERN = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/

export const TIMESTAMP_UNITS = {
  SECONDS: 'seconds',
  MILLISECONDS: 'milliseconds',
}

const pad2 = (value) => String(value).padStart(2, '0')

export function formatBeijingTime(timestampMs) {
  const date = new Date(Number(timestampMs) + BEIJING_OFFSET_MS)

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('无效时间戳')
  }

  const parts = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ].map((part, index) => (index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0')))

  return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`
}

export function timestampToBeijingTime(value, unit = TIMESTAMP_UNITS.SECONDS) {
  const text = String(value).trim()

  if (!TIMESTAMP_PATTERN.test(text)) {
    throw new TypeError('时间戳必须是整数（可带千分位逗号）')
  }

  const timestamp = Number(text.replace(/,/g, ''))
  const timestampMs = unit === TIMESTAMP_UNITS.MILLISECONDS ? timestamp : timestamp * 1000

  if (!Number.isSafeInteger(timestampMs)) {
    throw new RangeError('时间戳超出支持范围')
  }

  return formatBeijingTime(timestampMs)
}

export function beijingTimeToTimestamp(value, unit = TIMESTAMP_UNITS.SECONDS) {
  const text = String(value).trim()
  const match = TIME_PATTERN.exec(text)

  if (!match) {
    throw new TypeError('时间格式应为 YYYY-MM-DD HH:mm:ss（可省略部分，月/日/时/分/秒可用 1-2 位）')
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  // 不完整输入按规则补默认值：月、日补 1，时、分、秒补 0
  const year = Number(yearText)
  const month = monthText ? Number(monthText) : 1
  const day = dayText ? Number(dayText) : 1
  const hour = hourText ? Number(hourText) : 0
  const minute = minuteText ? Number(minuteText) : 0
  const second = secondText ? Number(secondText) : 0

  const timestampMs = Date.UTC(year, month - 1, day, hour - 8, minute, second)
  // 用补齐后的完整时间回环校验，拦截 13 月、2 月 30 日、25 点等非法值
  const canonical = `${yearText}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`

  if (formatBeijingTime(timestampMs) !== canonical) {
    throw new RangeError('日期或时间无效')
  }

  return unit === TIMESTAMP_UNITS.MILLISECONDS ? timestampMs : timestampMs / 1000
}


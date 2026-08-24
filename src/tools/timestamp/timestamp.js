const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
const TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/

export const TIMESTAMP_UNITS = {
  SECONDS: 'seconds',
  MILLISECONDS: 'milliseconds',
}

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

  if (!/^-?\d+$/.test(text)) {
    throw new TypeError('时间戳必须是整数')
  }

  const timestamp = Number(text)
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
    throw new TypeError('时间格式必须是 YYYY-MM-DD HH:mm:ss')
  }

  const [, year, month, day, hour, minute, second] = match.map(Number)
  const timestampMs = Date.UTC(year, month - 1, day, hour - 8, minute, second)

  if (formatBeijingTime(timestampMs) !== text) {
    throw new RangeError('日期或时间无效')
  }

  return unit === TIMESTAMP_UNITS.MILLISECONDS ? timestampMs : timestampMs / 1000
}


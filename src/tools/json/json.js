import { isLosslessNumber, parse } from 'lossless-json'

export function parseJson(text) {
  return parse(text)
}

export function isJsonContainer(value) {
  return value !== null && typeof value === 'object' && !isLosslessNumber(value)
}

export function formatJsonString(value, preserveEscapes) {
  return preserveEscapes ? JSON.stringify(value) : `"${value}"`
}

export function formatJsonValue(value, preserveEscapes) {
  if (typeof value === 'string') {
    return formatJsonString(value, preserveEscapes)
  }

  if (isLosslessNumber(value)) {
    return value.value
  }

  if (value === null) {
    return 'null'
  }

  return String(value)
}

export function formatJson(value, preserveEscapes = true, depth = 0) {
  if (!isJsonContainer(value)) {
    return formatJsonValue(value, preserveEscapes)
  }

  const entries = Array.isArray(value) ? value.map((item) => [null, item]) : Object.entries(value)
  const [openBracket, closeBracket] = Array.isArray(value) ? ['[', ']'] : ['{', '}']

  if (entries.length === 0) {
    return `${openBracket}${closeBracket}`
  }

  const indentation = '  '.repeat(depth)
  const childIndentation = '  '.repeat(depth + 1)
  const lines = entries.map(([key, childValue]) => {
    const keyText = key === null ? '' : `${JSON.stringify(key)}: `
    return `${childIndentation}${keyText}${formatJson(childValue, preserveEscapes, depth + 1)}`
  })

  return `${openBracket}\n${lines.join(',\n')}\n${indentation}${closeBracket}`
}
